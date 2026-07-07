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
        confirmText = 'تایید',
        cancelText = 'لغو',
        confirmClass = 'btn-success',
        onCancel = () => { },
        isDelete = false,
        textarea = false,
        textareaValue = '',
        textareaPlaceholder = '',
        dropdown = false,
        dropdownOptions = [],
        dropdownLabel = '',
        dropdownSelected = '',
        disableConfirm = false,
        confirmWarning = ''
    } = options;

    // Determine the correct confirm action
    const confirmAction = isDelete
        ? () => showSecureConfirm(message, onConfirm)
        : onConfirm;

    // --- Set up the modal content ---
    let modalContent = message.replace(/\n/g, '<br>');

    // If dropdown is requested, add it
    if (dropdown) {
        let optionsHtml = dropdownOptions.map(opt =>
            `<option value="${opt.value}" ${opt.value === dropdownSelected ? 'selected' : ''}>${opt.label}</option>`
        ).join('');

        modalContent += `
            <div style="margin: 15px 0;">
                <label style="display: block; font-size: 14px; color: var(--color-text-muted); margin-bottom: 5px;">${dropdownLabel}</label>
                <select id="custom-confirm-dropdown" 
                        style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--color-border); font-family: var(--font-family-main); font-size: 14px; background-color: var(--color-surface); color: var(--color-text-dark);">
                    ${optionsHtml}
                </select>
            </div>
        `;
    }

    // If textarea is requested, add it
    if (textarea) {
        modalContent += `
            <div style="margin: 15px 0;">
                <textarea id="custom-confirm-textarea" 
                          rows="5" 
                          style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--color-border); font-family: var(--font-family-main); background-color: var(--color-surface); color: var(--color-text-dark);"
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
    confirmModalConfirmBtn.disabled = disableConfirm;

    // Get modal actions container
    const modalActions = confirmModalConfirmBtn.parentElement;

    // --- Handle warning text (remove existing and add new if needed) ---
    const existingWarning = document.querySelector('.confirm-warning-text');
    if (existingWarning) existingWarning.remove();

    if (confirmWarning) {
        const warningDiv = document.createElement('div');
        warningDiv.className = 'confirm-warning-text';
        warningDiv.style.marginTop = '15px';
        warningDiv.style.color = 'var(--color-strong-warning)';
        warningDiv.style.fontSize = '14px';
        warningDiv.style.textAlign = 'center';
        warningDiv.style.fontWeight = '500';
        warningDiv.textContent = `⚠️ ${confirmWarning}`;

        // Insert it after the modal actions
        modalActions.parentElement.insertBefore(warningDiv, modalActions.nextSibling);
    }

    // Set the appropriate callbacks
    state.setConfirmCallback(() => {
        // Collect values from dropdown and textarea
        let dropdownValue = null;
        if (dropdown) {
            const dropdownEl = document.getElementById('custom-confirm-dropdown');
            dropdownValue = dropdownEl ? dropdownEl.value : null;
        }

        let textValue = null;
        if (textarea) {
            const textareaEl = document.getElementById('custom-confirm-textarea');
            textValue = textareaEl ? textareaEl.value : '';
        }

        // Define the final action (the actual work to be done)
        const finalAction = () => {
            if (typeof onConfirm === 'function') {
                onConfirm(textValue, dropdownValue);
            }
        };

        // If isDelete is true, wrap the action with secure confirm
        if (isDelete) {
            // Show secure confirm, and if successful, run finalAction
            showSecureConfirm(message, finalAction);
        } else {
            // Otherwise, run the action directly
            finalAction();
        }
    });
    state.setCancelCallback(onCancel);

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

    // Pre-filled note message
    const defaultNote = `تسویه هشدار برای دانش‌آموز «${student.identity.name}» در تاریخ ${new Date().toLocaleDateString('fa-IR')}`;

    const modalContent = `
        <div style="margin-bottom: 15px;">
            <p style="font-size: 14px; color: var(--color-text-muted); margin-bottom: 10px;">
                هشدارهای زیر برای این دانش‌آموز ثبت شده است. لطفاً اقدام مورد نظر را انتخاب کنید:
            </p>
            <div style="background-color: #f8f9fa; border-radius: 5px; padding: 10px; margin-bottom: 15px;">
                ${warningsHtml}
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: block; font-size: 14px; color: var(--color-text-muted); margin-bottom: 5px;">یادداشت (اختیاری - قابل ویرایش):</label>
                <textarea id="settlement-note-textarea" 
                          rows="4" 
                          style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--color-border); font-family: var(--font-family-main); background-color: var(--color-surface); color: var(--color-text-dark); box-sizing: border-box;"
                          placeholder="یادداشت خود را وارد کنید..."></textarea>
            </div>
        </div>
    `;

    // Use showCustomConfirm with our custom content
    showCustomConfirm(
        modalContent,
        (noteText) => {
            // Get the textarea value directly from the DOM
            const textarea = document.getElementById('settlement-note-textarea');
            const finalNote = textarea ? textarea.value : noteText || defaultNote;

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
                    note: finalNote || defaultNote
                };
            });

            // Add the note to the student's profile
            const noteContent = `[تسویه هشدار] ${finalNote || defaultNote}`;
            student.addNote(noteContent, { type: 'fromSession', sessionNumber: sessionNumber });

            // Save and refresh
            state.saveData();
            if (typeof onSettled === 'function') {
                onSettled();
            }
            showNotification(`✅ ${selectedWarnings.length} هشدار تسویه شد.`);
        },
        {
            confirmText: 'ثبت یادداشت و تسویه',
            cancelText: 'لغو',
            confirmClass: 'btn-success',
            textarea: false,
            onCancel: () => {
                showNotification('❌ تسویه هشدار لغو شد.');
            }
        }
    );

    // Set the textarea value after the modal is rendered
    setTimeout(() => {
        const textarea = document.getElementById('settlement-note-textarea');
        if (textarea) {
            textarea.value = defaultNote;
        }
    }, 50);
}