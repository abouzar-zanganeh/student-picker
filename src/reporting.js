// @ts-nocheck
/* ==========================================================================
   reporting.js introduction
   --------------------------------------------------------------------------
   This JS file handles the reporting functionality for student warnings,
   including the modal UI and note logging.
   ========================================================================== */

import * as state from './state.js';
import { showCustomConfirm } from './notifyingMessaging.js';
import { showNotification } from './notifyingMessaging.js';
import { saveData, currentClassroom } from './state.js';


/**
 * Shows the report-to-admin modal with an editable message.
 * @param {Object} student - The student being reported
 * @param {Object} session - The current session
 * @param {string} warningType - 'homework_none' (MVP) or other types later
 */
export function showReportToAdminModal(student, session, warningType) {
    // 1. Generate the preset message
    const studentName = student.identity.name;
    const sessionNumber = session.sessionNumber;
    const message = generatePresetMessage(studentName, sessionNumber, warningType);



    // 2. Build dropdown options (if contacts exist)
    const contacts = state.userSettings.adminContacts || [];
    let dropdownOptions = [];
    let selectedValue = '';

    if (contacts.length > 0) {
        dropdownOptions = contacts.map(contact => ({
            value: contact.id,
            label: `${contact.name || 'بدون نام'}`
        }));

        const lastUsedId = currentClassroom?.info?.lastReportedAdminId || null;
        selectedValue = lastUsedId && contacts.some(c => c.id === lastUsedId)
            ? lastUsedId
            : (contacts[0]?.id || '');
    }

    // 3. Show the custom confirm modal with dropdown + textarea
    showCustomConfirm(
        'پیام زیر برای مدیریت ارسال خواهد شد. می‌توانید آن را ویرایش کنید:',
        (editedMessage, selectedAdminId) => {
            // On confirm: send the report
            const selectedContact = contacts.find(c => c.id === selectedAdminId);
            if (selectedContact) {
                handleSendReport(student, session, warningType, editedMessage, selectedContact);
            } else {
                showNotification('⚠️ تماس مدیریت انتخاب شده معتبر نیست.');
            }
        },
        {
            confirmText: 'ارسال',
            cancelText: 'لغو',
            confirmClass: 'btn-success',
            textarea: true,
            textareaValue: message,
            textareaPlaceholder: 'پیام خود را وارد کنید...',
            dropdown: contacts.length > 0, // Only show dropdown if contacts exist
            dropdownOptions: dropdownOptions,
            dropdownLabel: 'انتخاب مدیریت:',
            dropdownSelected: selectedValue,
            disableConfirm: contacts.length === 0,        // NEW
            confirmWarning: contacts.length === 0 ? 'ابتدا یک شماره تماس برای مدیریت در تنظیمات برنامه اضافه کنید.' : ''  // NEW
        }
    );
}

/**
 * Generates a preset message based on the warning type.
 */
function generatePresetMessage(studentName, sessionNumber, warningType) {
    const dateStr = new Date().toLocaleDateString('fa-IR');
    switch (warningType) {
        case 'homework_none':
            return `دانش‌آموز «${studentName}» در جلسه ${sessionNumber} (تاریخ ${dateStr}) تکلیف خود را ارائه نکرده است. لطفاً بررسی فرمایید.`;
        default:
            return `دانش‌آموز «${studentName}» نیازمند توجه است. لطفاً بررسی فرمایید.`;
    }
}


/**
 * Handles sending the report: opens SMS or email with the message,
 * saves the selected admin as the last used for this class,
 * and adds a note to the student's profile.
 */
function handleSendReport(student, session, warningType, message, contact) {

    // 0. Check if any admin contacts exist
    const contacts = state.userSettings.adminContacts || [];
    if (contacts.length === 0) {
        showNotification('⚠️ ابتدا یک تماس مدیریت در تنظیمات برنامه اضافه کنید.');
        return;
    }

    // 1. Save the selected admin as the last used for this class
    if (currentClassroom) {
        currentClassroom.info.lastReportedAdminId = contact.id;
        saveData();
    }

    // 2. Send via SMS or email
    if (contact.phone) {
        const encodedMessage = encodeURIComponent(message);
        const smsUrl = `sms:${contact.phone}?body=${encodedMessage}`;
        window.location.href = smsUrl;
        console.log(`📨 SMS sent to ${contact.phone}: ${message}`);
    } else if (contact.email) {
        const encodedMessage = encodeURIComponent(message);
        const subject = encodeURIComponent(`گزارش وضعیت دانش‌آموز - ${student.identity.name}`);
        const emailUrl = `mailto:${contact.email}?subject=${subject}&body=${encodedMessage}`;
        window.location.href = emailUrl;
        console.log(`📨 Email sent to ${contact.email}: ${message}`);
    } else {
        showNotification('⚠️ تماس مدیریت فاقد شماره موبایل یا ایمیل است.');
        return;
    }

    // 3. Add a note to the student's profile
    const noteContent = `[ADMIN_NOTIFIED] ${new Date().toLocaleDateString('fa-IR')} - ${warningType}: ${message}`;
    student.addNote(noteContent, { type: 'fromAttendance', sessionNumber: session.sessionNumber });

    // 4. Save data (again, to ensure the note is saved)
    saveData();

    // 5. Show confirmation
    const contactInfo = contact.name || 'مدیریت';
    showNotification(`✅ گزارش به «${contactInfo}» ارسال شد.`);
}