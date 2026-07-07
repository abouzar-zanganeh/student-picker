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

/**
 * Shows a standalone report modal with SMS and Share options.
 * @param {Object} student - The student being reported
 * @param {Object} session - The current session
 * @param {string} preFilledMessage - Pre-filled message for the textarea
 * @param {Function} onReportSent - Callback after report is successfully sent
 */
export function showReportModalStandalone(student, session, preFilledMessage, onReportSent) {
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

    // 2. Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay modal-visible';
    overlay.style.display = 'flex';

    // 3. Create modal content
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

    // Header message
    const headerP = document.createElement('p');
    headerP.style.fontSize = '14px';
    headerP.style.color = 'var(--color-text-muted)';
    headerP.style.marginBottom = '10px';
    headerP.style.marginTop = '10px';
    headerP.textContent = 'پیام زیر برای مدیریت ارسال خواهد شد. می‌توانید آن را ویرایش کنید:';
    modalContent.appendChild(headerP);

    // Dropdown (if contacts exist)
    if (contacts.length > 0) {
        const dropdownDiv = document.createElement('div');
        dropdownDiv.style.margin = '15px 0';

        const dropdownLabel = document.createElement('label');
        dropdownLabel.style.display = 'block';
        dropdownLabel.style.fontSize = '14px';
        dropdownLabel.style.color = 'var(--color-text-muted)';
        dropdownLabel.style.marginBottom = '5px';
        dropdownLabel.textContent = 'انتخاب مدیریت:';
        dropdownDiv.appendChild(dropdownLabel);

        const select = document.createElement('select');
        select.id = 'report-admin-select';
        select.style.width = '100%';
        select.style.padding = '8px';
        select.style.borderRadius = '4px';
        select.style.border = '1px solid var(--color-border)';
        select.style.fontFamily = 'var(--font-family-main)';
        select.style.fontSize = '14px';
        select.style.backgroundColor = 'var(--color-surface)';
        select.style.color = 'var(--color-text-dark)';

        dropdownOptions.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.label;
            if (opt.value === selectedValue) {
                option.selected = true;
            }
            select.appendChild(option);
        });

        dropdownDiv.appendChild(select);
        modalContent.appendChild(dropdownDiv);
    }

    // Textarea
    const noteDiv = document.createElement('div');
    noteDiv.style.marginBottom = '15px';

    const label = document.createElement('label');
    label.style.display = 'block';
    label.style.fontSize = '14px';
    label.style.color = 'var(--color-text-muted)';
    label.style.marginBottom = '5px';
    label.textContent = 'متن پیام:';
    noteDiv.appendChild(label);

    const textarea = document.createElement('textarea');
    textarea.id = 'report-message-textarea';
    textarea.rows = 5;
    textarea.style.width = '100%';
    textarea.style.padding = '8px';
    textarea.style.borderRadius = '4px';
    textarea.style.border = '1px solid var(--color-border)';
    textarea.style.fontFamily = 'var(--font-family-main)';
    textarea.style.backgroundColor = 'var(--color-surface)';
    textarea.style.color = 'var(--color-text-dark)';
    textarea.style.boxSizing = 'border-box';
    textarea.value = preFilledMessage;
    noteDiv.appendChild(textarea);
    modalContent.appendChild(noteDiv);

    // Warning if no contacts
    if (contacts.length === 0) {
        const warningP = document.createElement('p');
        warningP.style.color = 'var(--color-strong-warning)';
        warningP.style.fontSize = '14px';
        warningP.style.textAlign = 'center';
        warningP.style.margin = '10px 0';
        warningP.textContent = '⚠️ ابتدا یک شماره تماس برای مدیریت در تنظیمات برنامه اضافه کنید.';
        modalContent.appendChild(warningP);
    }

    // Action buttons
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'modal-actions';
    actionsDiv.style.display = 'flex';
    actionsDiv.style.justifyContent = 'center';
    actionsDiv.style.gap = '10px';
    actionsDiv.style.flexWrap = 'wrap';

    const smsBtn = document.createElement('button');
    smsBtn.className = 'btn-success';
    smsBtn.textContent = '📱 ارسال پیامکی';
    smsBtn.style.minWidth = '100px';

    const shareBtn = document.createElement('button');
    shareBtn.className = 'btn-primary';
    shareBtn.textContent = '📤 اشتراک‌گذاری';
    shareBtn.style.minWidth = '100px';
    shareBtn.style.backgroundColor = '#17a2b8';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn-secondary';
    cancelBtn.textContent = 'لغو';
    cancelBtn.style.minWidth = '100px';

    actionsDiv.appendChild(smsBtn);
    actionsDiv.appendChild(shareBtn);
    actionsDiv.appendChild(cancelBtn);
    modalContent.appendChild(actionsDiv);

    overlay.appendChild(modalContent);
    document.body.appendChild(overlay);

    // --- Event Handlers ---

    // Close function
    const closeReportModal = () => {
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
        closeReportModal();
        showNotification('❌ گزارش لغو شد.');
    });

    // Cancel button
    cancelBtn.addEventListener('click', () => {
        closeReportModal();
        showNotification('❌ گزارش لغو شد.');
    });

    // SMS button
    smsBtn.addEventListener('click', () => {
        const message = document.getElementById('report-message-textarea').value;
        const selectedAdminId = document.getElementById('report-admin-select')?.value || null;
        const selectedContact = contacts.find(c => c.id === selectedAdminId);

        if (!selectedContact) {
            showNotification('⚠️ لطفاً یک مخاطب مدیریت انتخاب کنید.');
            return;
        }

        // Close the report modal
        closeReportModal();

        // Send via SMS
        if (selectedContact.phone) {
            const encodedMessage = encodeURIComponent(message);
            const smsUrl = `sms:${selectedContact.phone}?body=${encodedMessage}`;
            window.location.href = smsUrl;
        } else if (selectedContact.email) {
            const encodedMessage = encodeURIComponent(message);
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

        // Show confirmation dialog
        showReportSentConfirmation(
            () => {
                // User confirmed: save the note
                const noteContent = `[گزارش به مدیریت] ${new Date().toLocaleDateString('fa-IR')}\n${message}`;
                student.addNote(noteContent, { type: 'fromAttendance', sessionNumber: session.sessionNumber });
                state.saveData();
                const contactInfo = selectedContact.name || 'مدیریت';
                showNotification(`✅ گزارش به «${contactInfo}» ارسال و ثبت شد.`);
                if (typeof onReportSent === 'function') {
                    onReportSent(message, selectedContact);
                }
            },
            () => {
                showNotification('❌ ثبت گزارش لغو شد.');
            }
        );
    });

    // Share button
    shareBtn.addEventListener('click', () => {
        const message = document.getElementById('report-message-textarea').value;
        const selectedAdminId = document.getElementById('report-admin-select')?.value || null;
        const selectedContact = contacts.find(c => c.id === selectedAdminId);

        // Close the report modal
        closeReportModal();

        // Check if share API is available
        if (navigator.share) {
            navigator.share({
                text: message,
                title: 'گزارش وضعیت دانش‌آموز'
            }).then(() => {
                // User shared successfully
                showReportSentConfirmation(
                    () => {
                        // Save the note
                        const noteContent = `[گزارش به مدیریت] ${new Date().toLocaleDateString('fa-IR')}\n${message}`;
                        student.addNote(noteContent, { type: 'fromAttendance', sessionNumber: session.sessionNumber });
                        state.saveData();
                        if (selectedContact && currentClassroom) {
                            currentClassroom.info.lastReportedAdminId = selectedContact.id;
                            state.saveData();
                        }
                        const contactInfo = selectedContact?.name || 'مدیریت';
                        showNotification(`✅ گزارش ارسال و ثبت شد.`);
                        if (typeof onReportSent === 'function') {
                            onReportSent(message, selectedContact);
                        }
                    },
                    () => {
                        showNotification('❌ ثبت گزارش لغو شد.');
                    }
                );
            }).catch((err) => {
                // User cancelled share or error
                if (err.name !== 'AbortError') {
                    console.error('Share error:', err);
                    showNotification('❌ خطا در اشتراک‌گذاری.');
                } else {
                    showNotification('❌ اشتراک‌گذاری لغو شد.');
                }
            });
        } else {
            // Fallback for browsers without share API
            // Copy to clipboard as fallback
            navigator.clipboard.writeText(message).then(() => {
                showNotification('✅ پیام در کلیپ‌بورد کپی شد. می‌توانید آن را در هر برنامه‌ای قرار دهید.');

                // Still allow saving the note
                showReportSentConfirmation(
                    () => {
                        const noteContent = `[گزارش به مدیریت] ${new Date().toLocaleDateString('fa-IR')}\n${message}`;
                        student.addNote(noteContent, { type: 'fromAttendance', sessionNumber: session.sessionNumber });
                        state.saveData();
                        if (selectedContact && currentClassroom) {
                            currentClassroom.info.lastReportedAdminId = selectedContact.id;
                            state.saveData();
                        }
                        showNotification(`✅ گزارش ثبت شد.`);
                        if (typeof onReportSent === 'function') {
                            onReportSent(message, selectedContact);
                        }
                    },
                    () => {
                        showNotification('❌ ثبت گزارش لغو شد.');
                    }
                );
            }).catch(() => {
                showNotification('❌ خطا در کپی کردن پیام.');
            });
        }
    });

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    state.setActiveModal('report-modal');
}