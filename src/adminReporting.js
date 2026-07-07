// @ts-nocheck
/* ==========================================================================
   reporting.js introduction
   --------------------------------------------------------------------------
   This JS file handles the reporting functionality for student warnings,
   including the modal UI and note logging.
   ========================================================================== */

import * as state from './state.js';
import { showCustomConfirm, showReportSentConfirmation, showNotification } from './notifyingMessaging.js';
import { saveData, currentClassroom } from './state.js';


/**
 * Shows the report-to-admin modal with an editable message.
 * @param {Object} student - The student being reported
 * @param {Object} session - The current session
 */
export function showReportToAdminModal(student, session) {
    // 1. Generate the preset message
    const studentName = student.identity.name;
    const message = `مدیریت محترم،\nلطفاً برای دانش‌آموز «${studentName}» مورد زیر را پیگیری بفرمایید:`;


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
                // Send the report (SMS/email) first
                if (selectedContact.phone) {
                    const encodedMessage = encodeURIComponent(editedMessage);
                    const smsUrl = `sms:${selectedContact.phone}?body=${encodedMessage}`;
                    window.location.href = smsUrl;
                } else if (selectedContact.email) {
                    const encodedMessage = encodeURIComponent(editedMessage);
                    const subject = encodeURIComponent(`گزارش وضعیت دانش‌آموز - ${student.identity.name}`);
                    const emailUrl = `mailto:${selectedContact.email}?subject=${subject}&body=${encodedMessage}`;
                    window.location.href = emailUrl;
                } else {
                    showNotification('⚠️ تماس مدیریت فاقد شماره موبایل یا ایمیل است.');
                    return;
                }

                // Save the selected admin as the last used for this class
                if (currentClassroom) {
                    currentClassroom.info.lastReportedAdminId = selectedContact.id;
                    saveData();
                }

                // Show confirmation dialog
                showReportSentConfirmation(
                    () => {
                        // User confirmed: save the note
                        const noteContent = `[گزارش به مدیریت] ${new Date().toLocaleDateString('fa-IR')}\n${editedMessage}`;
                        student.addNote(noteContent, { type: 'fromAttendance', sessionNumber: session.sessionNumber });
                        saveData();
                        const contactInfo = selectedContact.name || 'مدیریت';
                        showNotification(`✅ گزارش به «${contactInfo}» ارسال و ثبت شد.`);
                    },
                    () => {
                        // User cancelled: don't save anything
                        showNotification('❌ ثبت گزارش لغو شد.');
                    }
                );
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
 * Shows the report-to-admin modal with a callback for successful send.
 * @param {Object} student - The student being reported
 * @param {Object} session - The current session
 * @param {string} preFilledMessage - Pre-filled message for the textarea
 * @param {Function} onReportSent - Callback after report is successfully sent
 */
export function showReportToAdminModalWithCallback(student, session, preFilledMessage, onReportSent) {
    // 1. Build dropdown options (if contacts exist)
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

    // 2. Show the custom confirm modal with dropdown + textarea
    showCustomConfirm(
        'پیام زیر برای مدیریت ارسال خواهد شد. می‌توانید آن را ویرایش کنید:',
        (editedMessage, selectedAdminId) => {
            // On confirm: send the report
            const selectedContact = contacts.find(c => c.id === selectedAdminId);
            if (selectedContact) {
                // Send the report (SMS/email)
                if (selectedContact.phone) {
                    const encodedMessage = encodeURIComponent(editedMessage);
                    const smsUrl = `sms:${selectedContact.phone}?body=${encodedMessage}`;
                    window.location.href = smsUrl;
                } else if (selectedContact.email) {
                    const encodedMessage = encodeURIComponent(editedMessage);
                    const subject = encodeURIComponent(`گزارش وضعیت دانش‌آموز - ${student.identity.name}`);
                    const emailUrl = `mailto:${selectedContact.email}?subject=${subject}&body=${encodedMessage}`;
                    window.location.href = emailUrl;
                } else {
                    showNotification('⚠️ تماس مدیریت فاقد شماره موبایل یا ایمیل است.');
                    return;
                }

                // Save the selected admin as the last used for this class
                if (currentClassroom) {
                    currentClassroom.info.lastReportedAdminId = selectedContact.id;
                    state.saveData();
                }

                // Call the callback with the final message and contact
                if (typeof onReportSent === 'function') {
                    onReportSent(editedMessage, selectedContact);
                }
            } else {
                showNotification('⚠️ تماس مدیریت انتخاب شده معتبر نیست.');
            }
        },
        {
            confirmText: 'ارسال',
            cancelText: 'لغو',
            confirmClass: 'btn-success',
            textarea: true,
            textareaValue: preFilledMessage,
            textareaPlaceholder: 'پیام خود را وارد کنید...',
            dropdown: contacts.length > 0,
            dropdownOptions: dropdownOptions,
            dropdownLabel: 'انتخاب مدیریت:',
            dropdownSelected: selectedValue,
            disableConfirm: contacts.length === 0,
            confirmWarning: contacts.length === 0 ? 'ابتدا یک شماره تماس برای مدیریت در تنظیمات برنامه اضافه کنید.' : '',
            onCancel: () => {
                showNotification('❌ گزارش لغو شد.');
            }
        }
    );
}