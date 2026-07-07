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

        // Define the final action
        const finalAction = () => {
            if (typeof onConfirm === 'function') {
                onConfirm(textValue, dropdownValue);
            }
        };

        // If isDelete is true, wrap the action with secure confirm
        if (isDelete) {
            showSecureConfirm(message, finalAction);
        } else {
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
    actionsDiv.style.gap = '10px';
    actionsDiv.style.flexWrap = 'wrap';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn-secondary';
    cancelBtn.textContent = 'لغو';
    cancelBtn.style.minWidth = '100px';

    const ignoreBtn = document.createElement('button');
    ignoreBtn.className = 'btn-secondary';
    ignoreBtn.textContent = 'چشم‌پوشی';
    ignoreBtn.style.minWidth = '100px';
    ignoreBtn.style.backgroundColor = '#6c757d';

    const reportBtn = document.createElement('button');
    reportBtn.className = 'btn-warning';
    reportBtn.textContent = 'گزارش به مدیریت';
    reportBtn.style.minWidth = '100px';

    actionsDiv.appendChild(cancelBtn);
    actionsDiv.appendChild(ignoreBtn);
    actionsDiv.appendChild(reportBtn);
    modalContent.appendChild(actionsDiv);

    overlay.appendChild(modalContent);
    document.body.appendChild(overlay);

    // --- Event Handlers ---

    // Close function
    const closeSettlementModal = () => {
        overlay.classList.remove('modal-visible');
        overlay.classList.add('modal-closing');
        setTimeout(() => {
            overlay.remove();
            document.body.style.overflow = 'auto';
            state.setActiveModal(null);
        }, 300);
    };

    // Helper to get selected warning types
    const getSelectedWarnings = () => {
        const selected = [];
        warnings.forEach((w, index) => {
            const checkbox = document.getElementById(`settle-warning-${index}`);
            if (checkbox && checkbox.checked) {
                selected.push(w.type);
            }
        });
        return selected;
    };

    // Helper to settle warnings
    const settleWarnings = (selectedWarnings, finalNote, action) => {
        if (!student.settledWarnings) {
            student.settledWarnings = {};
        }
        if (!student.settledWarnings[sessionNumber]) {
            student.settledWarnings[sessionNumber] = {};
        }

        selectedWarnings.forEach(type => {
            student.settledWarnings[sessionNumber][type] = {
                action: action,
                note: finalNote || ''
            };
        });

        // Build note content
        const dateStr = new Date().toLocaleDateString('fa-IR');

        let noteContent;
        if (action === 'reported') {
            // For reported warnings: just the warning messages, no extra headers
            const warningLines = selectedWarnings.map(type => {
                const warningObj = warnings.find(w => w.type === type);
                const messageParts = warningObj ? warningObj.message.split('(آستانه:') : [type];
                return messageParts[0].trim();
            }).join('\n');

            noteContent = `[گزارش به مدیریت] تاریخ: ${dateStr}\n${warningLines}`;
        } else {
            // For ignored warnings: include the teacher's note and a list
            const settledWarningDetails = selectedWarnings.map(type => {
                const warningObj = warnings.find(w => w.type === type);
                const messageParts = warningObj ? warningObj.message.split('(آستانه:') : [type];
                return `- ${messageParts[0].trim()}`;
            }).join('\n');

            noteContent = `[تسویه هشدار - چشم‌پوشی] تاریخ: ${dateStr}\n${finalNote ? finalNote + '\n' : ''}موارد زیر پیگیری شد:\n${settledWarningDetails}`;
        }
        student.addNote(noteContent, { type: 'fromSession', sessionNumber: sessionNumber });

        state.saveData();
    };

    // X button
    closeBtn.addEventListener('click', () => {
        closeSettlementModal();
        showNotification('❌ تسویه هشدار لغو شد.');
    });

    // Cancel button
    cancelBtn.addEventListener('click', () => {
        closeSettlementModal();
        showNotification('❌ تسویه هشدار لغو شد.');
    });

    // Ignore button (چشم‌پوشی)
    ignoreBtn.addEventListener('click', () => {
        const finalNote = textarea.value.trim();
        const selectedWarnings = getSelectedWarnings();

        if (selectedWarnings.length === 0) {
            showNotification('⚠️ هیچ هشدار انتخاب نشده است.');
            return;
        }

        settleWarnings(selectedWarnings, finalNote, 'ignored');
        closeSettlementModal();
        if (typeof onSettled === 'function') {
            onSettled();
        }
        showNotification(`✅ ${selectedWarnings.length} هشدار با چشم‌پوشی تسویه شد.`);
    });

    // Report button (گزارش به مدیریت)
    reportBtn.addEventListener('click', () => {
        const selectedWarnings = getSelectedWarnings();

        if (selectedWarnings.length === 0) {
            showNotification('⚠️ هیچ هشدار انتخاب نشده است.');
            return;
        }

        // Close the settlement modal first
        closeSettlementModal();

        // Delay opening the report modal to ensure the settlement modal is fully closed
        setTimeout(() => {
            import('./adminReporting').then(module => {
                // Build clean warning messages without threshold info
                const warningMessages = selectedWarnings.map(type => {
                    const w = warnings.find(w => w.type === type);
                    if (w) {
                        // Remove the threshold part (آستانه: X)
                        const cleanMessage = w.message.split('(آستانه:')[0].trim();
                        return cleanMessage;
                    }
                    return type;
                }).join('\n');

                // Pre-fill the report message with clean warning details
                const preFilledMessage = `گزارش هشدارهای دانش‌آموز «${student.identity.name}»:\n\n${warningMessages}`;

                // Show the report modal
                module.showReportToAdminModalWithCallback(
                    student,
                    { sessionNumber: sessionNumber },
                    'warning_settlement',
                    preFilledMessage,
                    (finalMessage, contact) => {
                        // This callback runs after the report is sent
                        // Settle the warnings
                        const finalNote = finalMessage || preFilledMessage;
                        settleWarnings(selectedWarnings, finalNote, 'reported');
                        if (typeof onSettled === 'function') {
                            onSettled();
                        }
                        showNotification(`✅ ${selectedWarnings.length} هشدار گزارش و تسویه شد.`);
                    }
                );
            }).catch(err => {
                console.error('Failed to load report modal:', err);
                showNotification('❌ خطا در باز کردن پنجره گزارش.');
            });
        }, 350); // Wait for the settlement modal close animation to complete (300ms + small buffer)
    });

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    state.setActiveModal('settlement-modal');
}