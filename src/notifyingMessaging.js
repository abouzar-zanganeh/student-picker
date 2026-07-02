// @ts-nocheck
/* ==========================================================================
   notifyingMessaging.js introduction
   --------------------------------------------------------------------------
   This JS file manages notification and user alerting logic
   ========================================================================== */


import * as state from "./state";

import {
    confirmModalCancelBtn, confirmModalConfirmBtn, confirmModalMessage, openModal,
    secureConfirmCode, secureConfirmConfirmBtn, secureConfirmInput,
    secureConfirmMessage, showPage, undoMessage, undoToast
} from "./ui";

import { setActiveModal } from './state.js';
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
        confirmText = 'تایید',
        cancelText = 'لغو',
        confirmClass = 'btn-success',
        onCancel = () => { },
        isDelete = false,
        textarea = false,      // NEW: if true, show a textarea
        textareaValue = '',    // NEW: initial value for the textarea
        textareaPlaceholder = '' // NEW: placeholder text
    } = options;

    // Determine the correct confirm action
    const confirmAction = isDelete
        ? () => showSecureConfirm(message, onConfirm)
        : onConfirm;

    // --- Set up the modal content ---
    let modalContent = message.replace(/\n/g, '<br>');

    // If textarea is requested, append it to the message
    if (textarea) {
        modalContent += `
            <div style="margin: 15px 0;">
                <textarea id="custom-confirm-textarea" 
                          rows="5" 
                          style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--color-border); font-family: var(--font-family-main);"
                          placeholder="${textareaPlaceholder}">${textareaValue}</textarea>
            </div>
        `;
    }

    confirmModalMessage.innerHTML = modalContent;
    confirmModalConfirmBtn.textContent = confirmText;
    confirmModalCancelBtn.textContent = cancelText;

    // Reset classes before adding the new one
    confirmModalConfirmBtn.className = 'modal-action-btn';
    confirmModalConfirmBtn.classList.add(confirmClass);

    // Set the appropriate callbacks
    state.setConfirmCallback(() => {
        // If textarea exists, pass its value to the callback
        if (textarea) {
            const textareaEl = document.getElementById('custom-confirm-textarea');
            const textValue = textareaEl ? textareaEl.value : '';
            // Call the original onConfirm with the textarea value
            if (typeof onConfirm === 'function') {
                onConfirm(textValue);
            }
        } else {
            // Original behavior
            if (typeof confirmAction === 'function') {
                confirmAction();
            }
        }
    });
    state.setCancelCallback(onCancel);

    const modalActions = confirmModalConfirmBtn.parentElement;
    confirmModalCancelBtn.style.display = onCancel === null ? 'none' : 'inline-block';
    modalActions.style.justifyContent = onCancel === null ? 'center' : 'space-between';

    openModal('custom-confirm-modal');

    // Focus the textarea if it exists
    if (textarea) {
        setTimeout(() => {
            const textareaEl = document.getElementById('custom-confirm-textarea');
            if (textareaEl) {
                textareaEl.focus();
                textareaEl.select();
            }
        }, 100);
    }
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
