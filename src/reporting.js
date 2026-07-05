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
import { saveData } from './state.js';

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

    // 2. Show the custom confirm modal with a textarea
    showCustomConfirm(
        'پیام زیر برای مدیریت ارسال خواهد شد. می‌توانید آن را ویرایش کنید:',
        (editedMessage) => {
            // On confirm: send the report with the edited message
            handleSendReport(student, session, warningType, editedMessage);
        },
        {
            confirmText: 'ارسال',
            cancelText: 'لغو',
            confirmClass: 'btn-success',
            textarea: true,
            textareaValue: message,
            textareaPlaceholder: 'پیام خود را وارد کنید...'
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
 * Handles sending the report: opens SMS or email with the message.
 */
function handleSendReport(student, session, warningType, message) {
    // 1. Get the first admin contact (or use a default if none exists)
    const contacts = state.userSettings.adminContacts || [];
    let contact = contacts[0];

    // If no contact is saved, use a fallback
    if (!contact) {
        // Fallback: prompt the user to add a contact
        showNotification('⚠️ ابتدا یک تماس مدیریت در تنظیمات برنامه اضافه کنید.');
        return;
    }

    // 2. Encode the message for URL
    const encodedMessage = encodeURIComponent(message);

    // 3. Send via SMS or email
    if (contact.phone) {
        // SMS: opens messaging app with number and message pre-filled
        const smsUrl = `sms:${contact.phone}?body=${encodedMessage}`;
        window.location.href = smsUrl;
        console.log(`📨 SMS sent to ${contact.phone}: ${message}`);
    } else if (contact.email) {
        // Email: opens email client with address and message pre-filled
        const subject = encodeURIComponent(`گزارش وضعیت دانش‌آموز - ${student.identity.name}`);
        const emailUrl = `mailto:${contact.email}?subject=${subject}&body=${encodedMessage}`;
        window.location.href = emailUrl;
        console.log(`📨 Email sent to ${contact.email}: ${message}`);
    } else {
        showNotification('⚠️ تماس مدیریت فاقد شماره موبایل یا ایمیل است.');
        return;
    }

    // 4. Add a note to the student's profile
    const noteContent = `[ADMIN_NOTIFIED] ${new Date().toLocaleDateString('fa-IR')} - ${warningType}: ${message}`;
    student.addNote(noteContent, { type: 'fromAttendance', sessionNumber: session.sessionNumber });

    // 5. Save data
    saveData();

    // 6. Show confirmation
    const contactInfo = contact.name || 'مدیریت';
    showNotification(`✅ گزارش به «${contactInfo}» ارسال شد.`);
}