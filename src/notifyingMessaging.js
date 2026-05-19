// @ts-nocheck
/* ==========================================================================
   notifyingMessaging.js introduction
   --------------------------------------------------------------------------
   This JS file manages notification and user alerting logic
   ========================================================================== */


import * as state from "./state";
import { confirmModalCancelBtn, confirmModalConfirmBtn, confirmModalMessage, openModal, secureConfirmCode, secureConfirmConfirmBtn, secureConfirmInput, secureConfirmMessage, undoMessage, undoToast } from "./ui";
import { setPastAttendanceCallback, setPastAttendanceCancelCallback } from './state.js';
import { setActiveModal } from './state.js';


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
 * @param {Function} onConfirm - Callback that receives the chosen status ('present', 'absent', or 'unknown')
 * @param {Function} onCancel - Optional callback if user cancels
 */
export function showPastAttendanceChoiceModal(onConfirm, onCancel = null) {
    const modal = document.getElementById('past-attendance-modal');
    const confirmBtn = document.getElementById('past-attendance-confirm-btn');
    const cancelBtn = document.getElementById('past-attendance-cancel-btn');
    const select = document.getElementById('past-attendance-select');

    if (!modal) {
        console.error("past-attendance-modal not found in DOM");
        return;
    }

    // Store callbacks in state (similar to other modals)
    setPastAttendanceCallback(onConfirm);
    setPastAttendanceCancelCallback(onCancel);

    // Clean up and open modal
    confirmBtn.onclick = () => {
        const chosenStatus = select.value;
        if (typeof onConfirm === 'function') {
            onConfirm(chosenStatus);
        }
        closeModal(modal);
    };

    cancelBtn.onclick = () => {
        if (typeof onCancel === 'function') {
            onCancel();
        }
        closeModal(modal);
    };

    openModal('past-attendance-modal');
}

function closeModal(modal) {
    modal.classList.remove('modal-visible');
    setActiveModal(null);
    document.body.style.overflow = 'auto';
}
