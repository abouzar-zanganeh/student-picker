// @ts-nocheck
/* ==========================================================================
   reporting.js introduction
   --------------------------------------------------------------------------
   This JS file handles the reporting functionality for student warnings,
   including the modal UI and note logging.
   ========================================================================== */

import * as state from './state.js';
import { openModal, closeActiveModal } from './ui.js';
import { showNotification } from './notifyingMessaging.js';
import { saveData } from './state.js';

/**
 * Shows the report-to-admin modal with a preset message.
 * @param {Object} student - The student being reported
 * @param {Object} session - The current session
 * @param {string} warningType - 'homework_none' (MVP) or other types later
 */
export function showReportToAdminModal(student, session, warningType) {
    // 1. Generate the preset message
    const studentName = student.identity.name;
    const sessionNumber = session.sessionNumber;
    const message = generatePresetMessage(studentName, sessionNumber, warningType);

    // 2. Get the modal elements
    const modal = document.getElementById('report-modal');
    if (!modal) {
        console.error('report-modal not found in DOM');
        return;
    }

    // 3. Populate the modal
    const messageTextarea = document.getElementById('report-message-textarea');
    if (messageTextarea) {
        messageTextarea.value = message;
        messageTextarea.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // 4. Set the send button action
    const sendBtn = document.getElementById('report-send-btn');
    const cancelBtn = document.getElementById('report-cancel-btn');

    // Remove old listeners to avoid duplicates
    const newSendBtn = sendBtn.cloneNode(true);
    sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);
    const newCancelBtn = cancelBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

    newSendBtn.addEventListener('click', () => {
        const finalMessage = messageTextarea ? messageTextarea.value : message;
        handleSendReport(student, session, warningType, finalMessage);
        closeActiveModal();
    });

    newCancelBtn.addEventListener('click', () => {
        closeActiveModal();
    });

    // 5. Open the modal
    openModal('report-modal');
    if (messageTextarea) {
        messageTextarea.focus();
        messageTextarea.select();
    }
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