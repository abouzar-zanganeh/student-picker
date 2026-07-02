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
 * Handles sending the report: logs to console (MVP), adds a note to the student's profile,
 * and shows a confirmation notification.
 */
function handleSendReport(student, session, warningType, message) {
    // 1. Console log placeholder for actual sending
    console.log('📨 Report sent to admin:');
    console.log(`Student: ${student.identity.name}`);
    console.log(`Session: ${session.sessionNumber}`);
    console.log(`Warning Type: ${warningType}`);
    console.log(`Message: ${message}`);
    console.log('📨 [MVP] Admin contact: placeholder (no actual SMS/email sent yet)');

    // 2. Add a note to the student's profile
    const noteContent = `[ADMIN_NOTIFIED] ${new Date().toLocaleDateString('fa-IR')} - ${warningType}: ${message}`;
    student.addNote(noteContent, { type: 'fromAttendance', sessionNumber: session.sessionNumber });

    // 3. Save data
    saveData();

    // 4. Show confirmation
    showNotification('✅ گزارش به مدیریت ثبت شد. (نسخه MVP - ارسال واقعی فعال نیست)');
}