// @ts-nocheck
/* ==========================================================================
   notifyingMessaging.js introduction
   --------------------------------------------------------------------------
   This JS file manages notification and user alerting logic
   ========================================================================== */


import * as state from "./state";
import { setActiveModal } from './state.js';

import {
    confirmModalCancelBtn, confirmModalConfirmBtn, confirmModalMessage, openModal,
    secureConfirmCode, secureConfirmConfirmBtn, secureConfirmInput,
    secureConfirmMessage, showPage, undoMessage, undoToast
} from "./ui";

import { settingsPage } from './ui.js'

export function showUndoToast(message) {

    clearTimeout(state.undoTimeout);

    if (!state.previousState) {
        state.setPreviousState(JSON.stringify(state.classrooms));
    }

    undoMessage.textContent = message;
    undoToast.classList.add('show');

    state.setUndoTimeout(setTimeout(() => {
        undoToast.classList.remove('show');
        state.setPreviousState(null);
    }, 5000));
}

/**
 * The main function for app's notifications. These notifications pop up from the button
 * of the screen.
 * @param {*} message the message the notification should display
 * @param {*} duration duration after which the notification hides
 * @returns null
 */
export function showNotification(message, duration = 3000) {
    const notificationToast = document.getElementById('notification-toast');
    if (!notificationToast) return;

    notificationToast.textContent = message;
    notificationToast.classList.add('show');

    clearTimeout(state.notificationTimeout);
    state.setNotificationTimeout(setTimeout(() => {
        notificationToast.classList.remove('show');
    }, duration));
}

export function showCustomConfirm(message, onConfirm, options = {}) {
    const {
        confirmText = 'تایید', cancelText = 'لغو', confirmClass = 'btn-success', onCancel = () => { }, isDelete = false
    } = options;

    // Determine the correct confirm action based on the isDelete flag.
    // If it's a delete action, the callback will be to open the next modal.
    // Otherwise, it's the original onConfirm function passed into this function.
    const confirmAction = isDelete
        ? () => showSecureConfirm(message, onConfirm)
        : onConfirm;

    // --- This part sets up the modal's appearance and is now used for all cases ---
    confirmModalMessage.innerHTML = message.replace(/\n/g, '<br>');
    confirmModalConfirmBtn.textContent = confirmText;
    confirmModalCancelBtn.textContent = cancelText;

    // Reset classes before adding the new one to avoid style conflicts
    confirmModalConfirmBtn.className = 'modal-action-btn';
    confirmModalConfirmBtn.classList.add(confirmClass);

    // Set the appropriate callbacks in the global state
    state.setConfirmCallback(confirmAction);
    state.setCancelCallback(onCancel);

    const modalActions = confirmModalConfirmBtn.parentElement;
    confirmModalCancelBtn.style.display = onCancel === null ? 'none' : 'inline-block';
    modalActions.style.justifyContent = onCancel === null ? 'center' : 'space-between';

    openModal('custom-confirm-modal');
}

export function showSecureConfirm(message, onConfirm) {
    const randomCode = Math.floor(10000 + Math.random() * 90000).toString();
    secureConfirmMessage.textContent = message;
    secureConfirmCode.textContent = randomCode;
    //@ts-ignore

    secureConfirmInput.value = '';
    //@ts-ignore

    secureConfirmConfirmBtn.disabled = true;

    state.setSecureConfirmCallback(onConfirm);

    openModal('secure-confirm-modal');
    secureConfirmInput.focus();

    const validationHandler = () => {
        //@ts-ignore

        if (secureConfirmInput.value === randomCode) {
            //@ts-ignore

            secureConfirmConfirmBtn.disabled = false;
        } else {
            //@ts-ignore

            secureConfirmConfirmBtn.disabled = true;
        }
    };

    secureConfirmInput.addEventListener('input', validationHandler);

    return () => {
        secureConfirmInput.removeEventListener('input', validationHandler);
    };
}


/**
 * Shows a modal asking the teacher to choose attendance status for all past sessions.
 * Used when adding a new student to a class that already has completed sessions.
 * @param {Function} onConfirm - Callback receiving chosen status ('present', 'absent', or 'unknown')
 * @param {Function|null} onCancel - Optional callback if user cancels
 */
export function showPastAttendanceChoiceModal(onConfirm, onCancel = null) {
    const pastAttendanceModal = document.getElementById('past-attendance-modal');
    const confirmBtn = document.getElementById('past-attendance-confirm-btn');
    const cancelBtn = document.getElementById('past-attendance-cancel-btn');
    const select = document.getElementById('past-attendance-select');

    if (!pastAttendanceModal) {
        console.error("past-attendance-modal not found in DOM");
        return;
    }



    // Clean up and open modal
    confirmBtn.onclick = () => {
        const chosenStatus = select.value;
        if (typeof onConfirm === 'function') {
            onConfirm(chosenStatus);
        }
        closeModal(pastAttendanceModal);
        showPage('settings-page');

    };

    cancelBtn.onclick = () => {
        if (typeof onCancel === 'function') {
            onCancel();
        }
        closeModal(pastAttendanceModal);
        showPage('settings-page');
    };

    openModal('past-attendance-modal');
}

function closeModal(modal) {
    modal.classList.remove('modal-visible');
    setActiveModal(null);
    document.body.style.overflow = 'auto';
}

/**
 * Shows a modal for settling student warnings.
 * @param {Object} student - The student instance
 * @param {Array} warnings - Array of warning objects from getStudentWarnings()
 * @param {number} sessionNumber - Current session number
 * @param {Function} onSettled - Callback after settlement is complete
 */
export function showWarningSettlementModal(student, warnings, sessionNumber, onSettled) {
    // Build the warning list with checkboxes
    let warningsHtml = warnings.map((w, index) => `
        <div style="display: flex; align-items: center; gap: 10px; padding: 6px 0; border-bottom: 1px solid var(--color-border);">
            <input type="checkbox" id="settle-warning-${index}" checked data-warning-type="${w.type}">
            <label for="settle-warning-${index}" style="cursor: pointer; font-size: 14px; flex: 1;">⚠️ ${w.message}</label>
        </div>
    `).join('');

    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay modal-visible';
    overlay.style.display = 'flex';

    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.maxWidth = '500px';
    modalContent.style.position = 'relative';

    // Close button (X)
    const closeBtn = document.createElement('button');
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '5px';
    closeBtn.style.left = '15px';
    closeBtn.style.fontSize = '28px';
    closeBtn.style.background = 'none';
    closeBtn.style.border = 'none';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.color = 'var(--color-text-muted)';
    closeBtn.style.padding = '0 8px';
    closeBtn.style.zIndex = '10';
    closeBtn.textContent = '×';
    closeBtn.title = 'بستن';
    modalContent.appendChild(closeBtn);

    // Header
    const headerP = document.createElement('p');
    headerP.style.fontSize = '14px';
    headerP.style.color = 'var(--color-text-muted)';
    headerP.style.marginBottom = '10px';
    headerP.style.marginTop = '10px';
    headerP.textContent = `هشدارهای زیر برای دانش‌آموز «${student.identity.name}» ثبت شده است. لطفاً اقدام مورد نظر را انتخاب کنید:`;
    modalContent.appendChild(headerP);

    // Warnings container
    const warningsDiv = document.createElement('div');
    warningsDiv.style.backgroundColor = '#f8f9fa';
    warningsDiv.style.borderRadius = '5px';
    warningsDiv.style.padding = '10px';
    warningsDiv.style.marginBottom = '15px';
    warningsDiv.innerHTML = warningsHtml;
    modalContent.appendChild(warningsDiv);

    // Note section
    const noteDiv = document.createElement('div');
    noteDiv.style.marginBottom = '15px';

    const label = document.createElement('label');
    label.style.display = 'block';
    label.style.fontSize = '14px';
    label.style.color = 'var(--color-text-muted)';
    label.style.marginBottom = '5px';
    label.textContent = 'یادداشت (اختیاری - قابل ویرایش):';
    noteDiv.appendChild(label);

    const textarea = document.createElement('textarea');
    textarea.id = 'settlement-note-textarea';
    textarea.rows = 4;
    textarea.style.width = '100%';
    textarea.style.padding = '8px';
    textarea.style.borderRadius = '4px';
    textarea.style.border = '1px solid var(--color-border)';
    textarea.style.fontFamily = 'var(--font-family-main)';
    textarea.style.backgroundColor = 'var(--color-surface)';
    textarea.style.color = 'var(--color-text-dark)';
    textarea.style.boxSizing = 'border-box';
    textarea.placeholder = 'یادداشت خود را وارد کنید...';
    noteDiv.appendChild(textarea);
    modalContent.appendChild(noteDiv);

    // Action buttons
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'modal-actions';
    actionsDiv.style.display = 'flex';
    actionsDiv.style.justifyContent = 'center';
    actionsDiv.style.gap = '15px';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn-secondary';
    cancelBtn.textContent = 'لغو';
    cancelBtn.style.width = '120px';

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'btn-success';
    confirmBtn.textContent = 'ثبت یادداشت و تسویه';
    confirmBtn.style.width = '120px';

    actionsDiv.appendChild(cancelBtn);
    actionsDiv.appendChild(confirmBtn);
    modalContent.appendChild(actionsDiv);

    overlay.appendChild(modalContent);
    document.body.appendChild(overlay);

    // --- Event Handlers ---

    // Close function
    const closeModal = () => {
        overlay.classList.remove('modal-visible');
        overlay.classList.add('modal-closing');
        setTimeout(() => {
            overlay.remove();
            document.body.style.overflow = 'auto';
            state.setActiveModal(null);
        }, 300);
    };

    // X button
    closeBtn.addEventListener('click', () => {
        closeModal();
        showNotification('❌ تسویه هشدار لغو شد.');
    });

    // Cancel button
    cancelBtn.addEventListener('click', () => {
        closeModal();
        showNotification('❌ تسویه هشدار لغو شد.');
    });

    // Confirm button
    confirmBtn.addEventListener('click', () => {
        const finalNote = textarea.value.trim();

        // Get selected warning types
        const selectedWarnings = [];
        warnings.forEach((w, index) => {
            const checkbox = document.getElementById(`settle-warning-${index}`);
            if (checkbox && checkbox.checked) {
                selectedWarnings.push(w.type);
            }
        });

        if (selectedWarnings.length === 0) {
            showNotification('⚠️ هیچ هشدار انتخاب نشده است.');
            return;
        }

        // Initialize settledWarnings for this session
        if (!student.settledWarnings) {
            student.settledWarnings = {};
        }
        if (!student.settledWarnings[sessionNumber]) {
            student.settledWarnings[sessionNumber] = {};
        }

        // Mark each selected warning as settled with 'ignored' action
        selectedWarnings.forEach(type => {
            student.settledWarnings[sessionNumber][type] = {
                action: 'ignored',
                note: finalNote || ''
            };
        });

        // Build a clean note with settled warnings
        const settledWarningDetails = selectedWarnings.map(type => {
            const warningObj = warnings.find(w => w.type === type);
            const messageParts = warningObj ? warningObj.message.split('(آستانه:') : [type];
            const cleanMessage = messageParts[0].trim();
            return `- ${cleanMessage}`;
        }).join('\n');

        const dateStr = new Date().toLocaleDateString('fa-IR');
        const noteContent = `[تسویه هشدار] تاریخ: ${dateStr}\n${finalNote ? finalNote + '\n' : ''}موارد زیر پیگیری شد:\n${settledWarningDetails}`;
        student.addNote(noteContent, { type: 'fromSession', sessionNumber: sessionNumber });

        // Save and refresh
        state.saveData();
        closeModal();
        if (typeof onSettled === 'function') {
            onSettled();
        }
        showNotification(`✅ ${selectedWarnings.length} هشدار تسویه شد.`);
    });

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    state.setActiveModal('settlement-modal');
}