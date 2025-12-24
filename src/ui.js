import * as state from './state.js';
import { addBackupSnapshot, getBackupSnapshots, deleteBackupSnapshot } from './db.js';

import { processRestore } from './state.js';

import {
    getActiveItems, getSessionDisplayMap, permanentlyDeleteStudent,
    permanentlyDeleteSession, permanentlyDeleteCategory, permanentlyDeleteScore, permanentlyDeleteNote
} from './state.js';
import { detectTextDirection, renderMultiLineText, parseStudentName, sortStudents } from './utils.js';
import { getLogsForClass, renameClassroomLog } from './logManager.js';
import * as logManager from './logManager.js';
import { Category, EDUCATIONAL_SYSTEMS } from './models.js';
import { handleUndoLastSelection } from './main.js';
import JSZip from 'jszip';

import { toJalaali, toGregorian } from 'jalaali-js';

// --- HTML Elements ---
export const classManagementPage = document.getElementById('class-management-page');

// Elements for the add-class modal
export const openAddClassModalBtn = document.getElementById('open-add-class-modal-btn');
export const addClassModal = document.getElementById('add-class-modal');
export const modalNewClassNameInput = document.getElementById('modal-new-class-name');
export const modalAddClassSystemSelect = document.getElementById('modal-add-class-system');
export const modalAddClassLevelSelect = document.getElementById('modal-add-class-level');
export const confirmAddClassBtn = document.getElementById('confirm-add-class-btn');
export const cancelAddClassBtn = document.getElementById('cancel-add-class-btn');

export const classListUl = document.getElementById('class-list');
export const undoToast = document.getElementById('undo-toast');
export const undoMessage = document.getElementById('undo-message');
export const undoBtn = document.getElementById('undo-btn');
export const settingsPage = document.getElementById('settings-page');
export const settingsClassNameHeader = document.getElementById('settings-class-name-header');
export const settingsStudentListUl = document.getElementById('settings-student-list');
export const categoryListUl = document.getElementById('category-list');
export const backToSessionsBtn = document.getElementById('back-to-sessions-btn');
export const newStudentNameInput = document.getElementById('new-student-name');
export const addStudentBtn = document.getElementById('add-student-btn');
export const pasteArea = document.getElementById('paste-area');
export const processPasteBtn = document.getElementById('process-paste-btn');
export const csvPreviewPage = document.getElementById('csv-preview-page');
export const csvPreviewList = document.getElementById('csv-preview-list');
export const csvConfirmBtn = document.getElementById('csv-confirm-btn');
export const csvCancelBtn = document.getElementById('csv-cancel-btn');
export const importCsvBtn = document.getElementById('import-csv-btn');
export const csvFileInput = document.getElementById('csv-file-input');
export const columnMappingPage = document.getElementById('column-mapping-page');
export const columnSelectDropdown = document.getElementById('column-select-dropdown');
export const confirmColumnBtn = document.getElementById('confirm-column-btn');
export const cancelImportBtn = document.getElementById('cancel-import-btn');


export const appHeader = document.querySelector('.app-header');
export const selectStudentBtn = document.getElementById('select-student-btn');
export const selectStudentBtnWrapper = document.getElementById('select-student-btn-wrapper');

export const assessmentModeLabel = document.getElementById('assessment-mode-label');
export const categoryWeightLabel = document.getElementById('category-weight-label');

export const attendancePage = document.getElementById('attendance-page');
export const attendanceListUl = document.getElementById('attendance-list');
export const finishAttendanceBtn = document.getElementById('finish-attendance-btn');
export const classListHeader = document.querySelector('#class-management-page h2');
export const studentStatsHeader = document.getElementById('student-stats-header');
export const hamburgerMenuBtn = document.getElementById('hamburger-menu-btn');
export const sideNavMenu = document.getElementById('side-nav-menu');
export const closeNavBtn = document.getElementById('close-nav-btn');
export const overlay = document.getElementById('overlay');
export const backupDataBtn = document.getElementById('backup-data-btn');
export const restoreDataBtn = document.getElementById('restore-data-btn');
export const restoreFileInput = document.getElementById('restore-file-input');
export const customConfirmModal = document.getElementById('custom-confirm-modal');
export const confirmModalMessage = document.getElementById('confirm-modal-message');
export const confirmModalCancelBtn = document.getElementById('confirm-modal-cancel-btn');
export const confirmModalConfirmBtn = document.getElementById('confirm-modal-confirm-btn');
export const secureConfirmModal = document.getElementById('secure-confirm-modal');
export const secureConfirmMessage = document.getElementById('secure-confirm-message');
export const secureConfirmCode = document.getElementById('secure-confirm-code');
export const secureConfirmInput = document.getElementById('secure-confirm-input');
export const secureConfirmCancelBtn = document.getElementById('secure-confirm-cancel-btn');
export const secureConfirmConfirmBtn = document.getElementById('secure-confirm-confirm-btn');
export const addNoteModal = document.getElementById('add-note-modal');
export const newNoteContent = document.getElementById('new-note-content');
export const classSaveNoteBtn = document.getElementById('class-save-note-btn');
export const cancelNoteBtn = document.getElementById('cancel-note-btn');
export const studentSearchInput = document.getElementById('student-search-input');
export const studentSearchResultsDiv = document.getElementById('student-search-results');
export const backToStudentPageBtn = document.getElementById('back-to-student-page-btn');
export const gradedCategoryPillsContainer = document.getElementById('graded-category-pills-container');
export const newScoreValueInput = document.getElementById('new-score-value');
export const newScoreCommentTextarea = document.getElementById('new-score-comment');
export const addScoreBtn = document.getElementById('add-score-btn');
export const profileStatsSummaryDiv = document.getElementById('profile-stats-summary');
export const profileScoresListUl = document.getElementById('profile-scores-list');
export const globalStudentSearchInput = document.getElementById('global-student-search-input');
export const globalStudentSearchResultsDiv = document.getElementById('global-student-search-results');

export const trashedClassesList = document.getElementById('trashed-classes-list');
export const trashedStudentsList = document.getElementById('trashed-students-list');
export const trashedSessionsList = document.getElementById('trashed-sessions-list');
export const trashedCategoriesList = document.getElementById('trashed-categories-list');
export const trashedNotesList = document.getElementById('trashed-notes-list');
export const trashedScoresList = document.getElementById('trashed-scores-list');
export const quickGradeFormWrapper = document.getElementById('quick-grade-form-wrapper');
export const quickScoreInput = document.getElementById('quick-score-input');
export const quickNoteTextarea = document.getElementById('quick-note-textarea');
export const quickGradeSubmitBtn = document.getElementById('quick-grade-submit-btn');
const categoryPillsContainer = document.getElementById('category-selection-container');
const resultDiv = document.getElementById('selected-student-result');
export const contextMenu = document.getElementById('custom-context-menu');
export const breadcrumbContainer = document.getElementById('breadcrumb-container');

// ... modal for reporting on the context menu of main page ...
export const reportConfigModal = document.getElementById('report-config-modal');
export const reportColumnsContainer = document.getElementById('report-columns-container');
export const reportPrintBtn = document.getElementById('report-print-btn');
export const reportCancelBtn = document.getElementById('report-cancel-btn');

let winnerRemovalLongPressTimer = null;

let contextMenuTarget = null; // Tracks the LI element that was right-clicked

// for category modal on student page (when adding categories)
export const categoryModal = document.getElementById('category-modal');
export const categoryModalTitle = document.getElementById('category-modal-title');
export const newCategoryModalNameInput = document.getElementById('new-category-modal-name');
export const newCategoryModalIsGradedCheckbox = document.getElementById('new-category-modal-is-graded');
export const categoryModalCancelBtn = document.getElementById('category-modal-cancel-btn');
export const categoryModalSaveBtn = document.getElementById('category-modal-save-btn');

// for mass comment modal
export const massCommentModal = document.getElementById('mass-comment-modal');
export const massCommentModalTitle = document.getElementById('mass-comment-modal-title');
export const massCommentStudentCountMessage = document.getElementById('mass-comment-student-count-message');
export const massCommentContent = document.getElementById('mass-comment-content');
export const massCommentAppendCheckbox = document.getElementById('mass-comment-append-checkbox');
export const massCommentCancelBtn = document.getElementById('mass-comment-cancel-btn');
export const massCommentSaveBtn = document.getElementById('mass-comment-save-btn');
export const massCommentBtn = document.getElementById('mass-comment-btn');
export const attendanceMassActionsContainer = document.getElementById('attendance-mass-actions-container');

export const attendanceSearchInput = document.createElement('input');

export const sessionDashboardPage = document.getElementById('session-dashboard-page');

export const attendancePane = document.getElementById('attendance-pane');

// for educational system and level selects in settings page
export const settingsEduSystemSelect = document.getElementById('settings-edu-system');
export const settingsLevelSelect = document.getElementById('settings-level');

// Elements for schedule section in add-class modal
export const modalScheduleTextInput = document.getElementById('modal-schedule-text');
export const modalScheduleDaysContainer = document.getElementById('modal-schedule-days');
export const modalScheduleStartTimeInput = document.getElementById('modal-schedule-start-time');
export const modalScheduleEndTimeInput = document.getElementById('modal-schedule-end-time');
export const modalScheduleToggle = document.getElementById('modal-schedule-toggle');
export const modalScheduleContent = document.getElementById('modal-schedule-content');


export const newCategoryModalWeightInput = document.getElementById('new-category-modal-weight');

export const newCategoryModal = document.getElementById('category-modal');
export const newCategoryModalWeightGroup = document.getElementById('new-category-modal-weight-group');
export const openAddCategoryBtn = document.getElementById('open-add-category-btn');

// Helper for handling Long Press events
export function setupLongPress(element, callback) {
    let timer;
    const longPressDuration = 800; // 800ms to trigger

    const start = (e) => {
        // Prevent default only if necessary? No, keep it simple for now.
        timer = setTimeout(() => {
            if (state.userSettings.isVibrationEnabled && navigator.vibrate) {
                navigator.vibrate(50);
            }
            callback(e);
        }, longPressDuration);
    };

    const cancel = () => {
        clearTimeout(timer);
    };

    // Support both Touch and Mouse
    element.addEventListener('touchstart', start, { passive: true });
    element.addEventListener('touchend', cancel);
    element.addEventListener('touchmove', cancel);

    element.addEventListener('mousedown', start);
    element.addEventListener('mouseup', cancel);
    element.addEventListener('mouseleave', cancel);
}


export function renderSessionDashboard(initialTab = 'selector') {
    if (!state.currentClassroom || !state.selectedSession) {
        showPage('class-management-page');
        return;
    }

    // This block sets up the content for the "Selector" pane
    initializeStudentPageUI();
    renderCategoryPills();
    renderStudentStatsList();

    // This sets up the content for the "Attendance" pane
    renderAttendancePage();

    // Now, show the main dashboard page
    showPage('session-dashboard-page', { tab: initialTab });

    // And finally, activate the tab-switching logic
    setupDashboardTabs();

    // --- NEW: Switch to the correct initial tab ---
    switchDashboardTab(initialTab);
    // --- END NEW ---

    // Restore the last selected category and winner
    restoreSessionState();
}

export function switchDashboardTab(tabName) {
    const selectorTabBtn = document.getElementById('selector-tab-btn');
    const attendanceTabBtn = document.getElementById('attendance-tab-btn');
    const selectorPane = document.getElementById('selector-pane');


    const isSelector = tabName === 'selector';

    selectorTabBtn.classList.toggle('active', isSelector);
    attendanceTabBtn.classList.toggle('active', !isSelector);
    selectorPane.classList.toggle('active', isSelector);
    attendancePane.classList.toggle('active', !isSelector);
}

export function setupDashboardTabs() {
    const selectorTabBtn = document.getElementById('selector-tab-btn');
    const attendanceTabBtn = document.getElementById('attendance-tab-btn');
    const selectorPane = document.getElementById('selector-pane');


    selectorTabBtn.addEventListener('click', () => {
        renderStudentStatsList();
        displayWinner();
        selectorTabBtn.classList.add('active');
        attendanceTabBtn.classList.remove('active');
        selectorPane.classList.add('active');
        attendancePane.classList.remove('active');
        showPage('session-dashboard-page', { tab: 'selector' });
    });

    attendanceTabBtn.addEventListener('click', () => {
        renderAttendancePage();
        attendanceTabBtn.classList.add('active');
        selectorTabBtn.classList.remove('active');
        attendancePane.classList.add('active');
        selectorPane.classList.remove('active');
        showPage('session-dashboard-page', { tab: 'attendance' });
    });
}

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

export function handleUndo() {
    if (state.previousState) {
        const currentClassName = state.currentClassroom ? state.currentClassroom.info.name : null;

        const plainData = JSON.parse(state.previousState);
        state.rehydrateData(plainData);

        if (currentClassName && state.classrooms[currentClassName]) {
            state.setCurrentClassroom(state.classrooms[currentClassName]);
        } else {
            state.setCurrentClassroom(null);
        }

        if (state.currentClassroom) {
            renderSettingsStudentList();
            renderSettingsCategories();
            renderSessions();
        } else {
            renderClassList();
        }

        undoToast.classList.remove('show');
        clearTimeout(state.undoTimeout);
        state.setPreviousState(null);
    }
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

export function showRestoreConfirmModal(plainData) {
    // --- Get references to the new modal's elements ---
    const modal = document.getElementById('restore-confirm-modal');
    const messageEl = document.getElementById('restore-modal-message');
    const appendCheckbox = document.getElementById('restore-append-checkbox');
    const appendLabel = document.querySelector('label[for="restore-append-checkbox"]'); // Get label to update text
    const cancelBtn = document.getElementById('restore-confirm-cancel-btn');
    const confirmBtn = document.getElementById('restore-confirm-confirm-btn');
    const warningEl = document.getElementById('restore-modal-warning');

    // Reset warning visibility
    warningEl.style.display = 'none';

    // Check if the backup is older than the last restore
    const backupTimestamp = plainData.metadata?.createdAt || 0; // Safe access
    if (state.userSettings.lastRestoreTimestamp && backupTimestamp < state.userSettings.lastRestoreTimestamp) {
        const backupDate = new Date(backupTimestamp).toLocaleDateString('fa-IR');
        const restoreDate = new Date(state.userSettings.lastRestoreTimestamp).toLocaleDateString('fa-IR');
        warningEl.textContent = `⚠️ هشدار: این فایل پشتیبان (${backupDate}) قدیمی‌تر از آخرین بازیابی شما (${restoreDate}) است.`;
        warningEl.style.display = 'block';
    }

    // --- Prepare the modal content ---
    const classroomsObj = plainData.data.classrooms || {};
    const classNames = Object.values(classroomsObj).map(c => c.info.name);
    const classCount = classNames.length;
    const classWord = classCount === 1 ? 'کلاس' : 'کلاس';

    // Build list of classes
    const classesListHtml = classNames.map(name =>
        `<li style="margin-bottom: 4px;">🔹 ${name}</li>`
    ).join('');

    messageEl.innerHTML = `
        <div style="margin-bottom: 10px;">
            فایل پشتیبان شامل <strong>${classCount} ${classWord}</strong> زیر است:
        </div>
        <ul style="
            margin: 0; 
            padding: 10px; 
            background-color: #f8f9fa; 
            border-radius: 5px; 
            border: 1px solid #e9ecef;
            list-style: none; 
            max-height: 150px; 
            overflow-y: auto;
            text-align: right;
        ">
            ${classesListHtml}
        </ul>
        <div style="margin-top: 15px;">
            لطفاً نحوه بازیابی را مشخص کنید.
        </div>
    `;

    // Update Checkbox Logic
    appendCheckbox.checked = false; // Default: Smart Sync (Unchecked)
    if (appendLabel) {
        appendLabel.textContent = "جایگزینی کامل (حذف داده‌های فعلی)";
    }

    // --- Define button actions ---
    const confirmHandler = () => {
        const isCleanRestore = appendCheckbox.checked;
        state.processRestore(plainData, isCleanRestore); // Pass the new flag

        // Clean up and provide feedback
        confirmBtn.onclick = null; // Clean listener
        cancelBtn.onclick = null;
        modal.removeEventListener('click', confirmHandler);

        closeActiveModal();
        renderClassList();
        showPage('class-management-page');

        const modeText = isCleanRestore ? "پاک‌سازی و بازیابی" : "همگام‌سازی هوشمند";
        showNotification(`✅ اطلاعات با موفقیت بازیابی شد (${modeText}).`);
    };

    const cancelHandler = () => {
        confirmBtn.onclick = null;
        cancelBtn.onclick = null;
        closeActiveModal();
    };

    confirmBtn.onclick = confirmHandler;
    cancelBtn.onclick = cancelHandler;

    openModal('restore-confirm-modal');
}

export function showCustomConfirm(message, onConfirm, options = {}) {
    const {
        confirmText = 'تایید',
        cancelText = 'لغو',
        confirmClass = 'btn-success',
        onCancel = () => { },
        isDelete = false
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
    secureConfirmInput.value = '';
    secureConfirmConfirmBtn.disabled = true;

    state.setSecureConfirmCallback(onConfirm);

    openModal('secure-confirm-modal');
    secureConfirmInput.focus();

    const validationHandler = () => {
        if (secureConfirmInput.value === randomCode) {
            secureConfirmConfirmBtn.disabled = false;
        } else {
            secureConfirmConfirmBtn.disabled = true;
        }
    };

    secureConfirmInput.addEventListener('input', validationHandler);

    return () => {
        secureConfirmInput.removeEventListener('input', validationHandler);
    };
}

export function showCategoryModal(onSave, options = {}) {
    const {
        title = 'ایجاد دسته‌بندی جدید',
        initialName = '',
        initialIsGraded = false,
        initialWeight = 1,
        saveButtonText = 'ذخیره'
    } = options;

    // 1. Configure the modal's appearance
    categoryModalTitle.textContent = title;
    newCategoryModalNameInput.value = initialName;
    newCategoryModalIsGradedCheckbox.checked = initialIsGraded;


    newCategoryModalWeightInput.value = initialWeight;

    categoryModalSaveBtn.textContent = saveButtonText;

    // 2. Set the callback function that will run on save
    state.setSaveCategoryCallback((categoryName, isGraded, weight = 1) => {
        const weight = parseFloat(newCategoryModalWeightInput.value) || 1;
        // Basic validation before executing the main callback
        if (!categoryName) {
            showNotification('⚠️ لطفاً نام دسته‌بندی را وارد کنید.');
            return;
        }
        onSave(categoryName, isGraded, weight);
        closeActiveModal(); // Close the modal on successful save
    });

    // 3. Open the modal and focus the input
    openModal('category-modal');
    newCategoryModalNameInput.focus();
    if (initialName) {
        newCategoryModalNameInput.select();
    }
}

export function showMoveStudentModal(student, sourceClass) {
    // Find all other active classes to serve as possible destinations
    const destinationClasses = Object.values(state.classrooms)
        .filter(c => !c.isDeleted && c.info.name !== sourceClass.info.name);

    const modalTitle = document.getElementById('move-student-modal-title');
    const classSelect = document.getElementById('move-student-class-select');
    const confirmBtn = document.getElementById('move-student-confirm-btn');

    modalTitle.textContent = `انتقال دانش‌آموز: ${student.identity.name}`;
    classSelect.innerHTML = ''; // Clear previous options

    if (destinationClasses.length === 0) {
        classSelect.innerHTML = '<option value="">کلاس دیگری برای انتقال وجود ندارد</option>';
        confirmBtn.disabled = true;
    } else {
        destinationClasses.forEach(classroom => {
            const option = document.createElement('option');
            option.value = classroom.info.name;
            option.textContent = classroom.info.name;
            classSelect.appendChild(option);
        });
        confirmBtn.disabled = false;
    }


    state.setStudentToMove(student);
    state.setSourceClassForMove(sourceClass);

    openModal('move-student-modal');
}

export function showRenameStudentModal(student, classroom) {
    if (!student || !classroom) return;

    const oldName = student.identity.name;

    // Save the old structural parts for comparison
    const oldFirstName = student.identity.firstName || "";
    const oldLastName = student.identity.lastName || "";

    const modalTitle = document.getElementById('add-note-modal-title');
    modalTitle.textContent = 'تغییر نام دانش‌ آموز';

    const initialValue = (student.identity.firstName && student.identity.lastName)
        ? `${student.identity.firstName} . ${student.identity.lastName}`
        : oldName;

    newNoteContent.value = initialValue;
    newNoteContent.rows = 1;
    newNoteContent.dispatchEvent(new Event('input', { bubbles: true }));

    state.setSaveNoteCallback((newName) => {

        const dotIndex = newName.indexOf('.');
        if (dotIndex <= 0 || dotIndex >= newName.length - 1) {
            showNotification("لطفا نام و نام خانوادگی شخص را با یک نقطه از هم جدا کنید. مثال: علی . احمدی");
            return false; // This prevents the modal from closing
        }

        const parsedIdentity = parseStudentName(newName);
        const cleanNewName = parsedIdentity.name;

        // Treat undefined/null as empty strings for safe comparison
        const newFirstName = parsedIdentity.firstName || "";

        // Guard: Dotted student missing dot
        if (student.identity.firstName && student.identity.lastName && !parsedIdentity.firstName) {
            showNotification('⚠️ این دانش‌آموز دارای نام و نام‌خانوادگی تفکیک شده است. لطفاً حتماً از نقطه (.) بین نام و نام‌خانوادگی استفاده کنید.');
            return false;
        }

        // --- FIX: ROBUST CHANGE DETECTION ---
        // 1. Did the characters actually change? (e.g. spelling)
        const textChanged = cleanNewName !== oldName;

        // 2. Did the structure split change? (e.g. moving the dot)
        // We compare the NEW first name against the OLD first name.
        const structureChanged = newFirstName !== oldFirstName;

        // The Condition: Save if text changed OR if structure changed
        if (cleanNewName && (textChanged || structureChanged)) {

            const isDuplicate = getActiveItems(classroom.students).some(
                s => s.identity.studentId !== student.identity.studentId &&
                    s.identity.name.toLowerCase() === cleanNewName.toLowerCase()
            );

            if (isDuplicate) {
                showNotification('دانش‌آموزی با این نام از قبل در این کلاس وجود دارد.');
                return false;
            } else {
                student.identity.name = cleanNewName;
                student.identity.firstName = parsedIdentity.firstName;
                student.identity.lastName = parsedIdentity.lastName;

                logManager.addLog(classroom.info.name, `نام دانش‌آموز «${oldName}» به «${cleanNewName}» تغییر یافت.`, { type: 'VIEW_STUDENT_PROFILE', studentId: student.identity.studentId });

                state.saveData();

                renderSettingsStudentList();
                renderStudentStatsList();
                renderAttendancePage();
                displayWinner();
                if (state.selectedStudentForProfile && state.selectedStudentForProfile.identity.studentId === student.identity.studentId) {
                    showStudentProfile(student);
                }

                const updatedRow = document.querySelector(`#settings-student-list li[data-student-id="${student.identity.studentId}"]`);
                if (updatedRow) {
                    updatedRow.classList.add('recently-updated');
                    setTimeout(() => {
                        if (updatedRow) updatedRow.classList.remove('recently-updated');
                    }, 10000);
                    updatedRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }

                showNotification(`✅ نام دانش‌آموز به «${cleanNewName}» تغییر یافت.`);
            }
        } else if (!cleanNewName) {
            showNotification('⚠️ نام نمی‌تواند خالی باشد.');
            return false;
        }

        // Reset modal title
        const modalTitle = document.getElementById('add-note-modal-title');
        modalTitle.textContent = 'ثبت یادداشت جدید';
        newNoteContent.rows = 4;
    });

    openModal('add-note-modal');
    newNoteContent.focus();
    newNoteContent.select();
}

export function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        // Prevents opening a new modal if one is already active
        if (state.activeModal) return;
        modal.classList.add('modal-visible');
        state.setActiveModal(modalId);
        // Adds a dummy state to the history to "trap" the back button
        history.pushState(null, '', location.href);
    }
}

export function closeActiveModal(onClosed, isHistoryPop = false) {
    if (!state.activeModal) return;

    const modal = document.getElementById(state.activeModal);
    const activeModalId = state.activeModal;

    // IMPORTANT: We clear the activeModal state *before* navigating back.
    // This lets our 'popstate' listener (in the next step) know that we are closing the modal
    // intentionally and that it should not spring the "trap".
    state.setActiveModal(null);

    if (activeModalId === 'student-profile-modal') {
        state.setSelectedStudentForProfile(null);
    }


    if (!isHistoryPop) {
        history.back();
    }

    if (modal) {
        modal.classList.add('modal-closing');

        setTimeout(() => {
            modal.classList.remove('modal-visible');
            modal.classList.remove('modal-closing');

            if (activeModalId === 'custom-confirm-modal') {
                state.setConfirmCallback(null);
                state.setCancelCallback(null);
            }
            if (activeModalId === 'secure-confirm-modal') {
                state.setSecureConfirmCallback(null);
            }

            if (activeModalId === 'category-modal') {
                state.setSaveCategoryCallback(null);
            }

            if (activeModalId === 'mass-comment-modal') {
                // NEW: Clear the content on close for the mass comment modal
                massCommentContent.value = '';
            }

            if (activeModalId === 'add-note-modal') {
                state.setSaveNoteCallback(null);
            }



            // Run the callback function after everything is done
            if (typeof onClosed === 'function') {
                onClosed();
            }

        }, 300); // This must match the animation duration
    }
}

export function renderMassCommentControls() {
    // Show the button container only on the attendance page

    if (!attendancePane || !attendancePane.classList.contains('active')) {
        attendanceMassActionsContainer.style.display = 'none';
        return;
    }

    const selectedCount = state.selectedStudentsForMassComment.length;

    //1. Hide the entire container if no students are selected.
    if (selectedCount < 1) {
        attendanceMassActionsContainer.style.display = 'none';
    } else {
        attendanceMassActionsContainer.style.display = 'block';
    }

    // 2. Toggle disabled state (requires at least 2 students, or 1 for comment clearing)
    massCommentBtn.disabled = selectedCount < 1;

    // 3. Update button text
    massCommentBtn.textContent = `📝 ثبت یادداشت گروهی (${selectedCount} نفر)`;
}


export function showMassCommentModal() {
    const studentIds = state.selectedStudentsForMassComment;
    const selectedCount = studentIds.length;

    // 1. Check if *any* selected student has an existing comment.
    // We only need this flag to decide whether to show the 'Append' checkbox.
    let hasExistingComments = false;

    if (selectedCount > 0) {
        hasExistingComments = studentIds.some(id =>
            state.selectedSession.studentRecords[id]?.homework.comment
        );
    }

    // 2. Configure modal appearance
    massCommentStudentCountMessage.textContent =
        `یادداشت برای ${selectedCount} دانش‌آموز ثبت خواهد شد.`;

    // The key change: ensure content is always blank for a clean slate.
    massCommentContent.value = '';
    massCommentContent.dispatchEvent(new Event('input', { bubbles: true }));

    // Reset the append checkbox and control its visibility based on the flag.
    massCommentAppendCheckbox.checked = true;
    const modalOptions = document.querySelector('#mass-comment-modal .modal-options');
    modalOptions.style.display = hasExistingComments ? 'flex' : 'none';

    // 3. Set callback and open modal
    openModal('mass-comment-modal');
    massCommentContent.focus();
}

/**
 * Core logic to update homework comments for all selected students.
 * @param {string} commentText The text to be saved.
 * @param {boolean} append If true, append to existing comment; otherwise, replace.
 */
export function processMassHomeworkComment(commentText, append) {
    if (!state.currentClassroom || !state.selectedSession) return;

    let studentsUpdatedCount = 0;
    const studentIds = state.selectedStudentsForMassComment;
    const session = state.selectedSession;

    studentIds.forEach(studentId => {
        const record = session.studentRecords[studentId];
        if (record && record.homework) {
            const currentComment = record.homework.comment || '';
            let newComment = commentText;

            if (append && currentComment.length > 0) {
                // Append the new text after a separator, if current is not empty
                newComment = currentComment + '\n---' + '\n' + commentText;
            } else {
                // Replace or set the new text
                newComment = commentText;
            }

            // Update the homework comment
            record.homework.comment = newComment.trim();

            // Find the student object to handle the accompanying profile note
            const student = state.currentClassroom.students.find(s => s.identity.studentId === studentId);
            if (student) {
                updateStudentProfileNoteForHomework(student, session, newComment.trim());
            }

            studentsUpdatedCount++;
        }
    });

    // Clear the selection after the action is done
    state.setSelectedStudentsForMassComment([]);

    // Save data and re-render
    state.saveData();
    renderAttendancePage(); // Re-render to clear checkboxes and update counts

    logManager.addLog(state.currentClassroom.info.name,
        `${studentsUpdatedCount} دانش‌آموز به صورت گروهی یادداشت تکلیف گرفتند.`,
        { type: 'VIEW_SESSIONS' });

    showNotification(`✅ یادداشت برای ${studentsUpdatedCount} دانش‌آموز ثبت شد.`);
}


/**
 * Logic extracted from attendance page setup to manage the profile note corresponding to a homework comment.
 * This ensures consistency with the original single-student note behavior.
 */
function updateStudentProfileNoteForHomework(student, session, content) {
    const sessionDisplayNumberMap = getSessionDisplayMap(state.currentClassroom);
    const displayNumber = sessionDisplayNumberMap.get(session.sessionNumber);
    const noteSource = { type: 'fromAttendance', sessionNumber: session.sessionNumber };
    const notePrefix = `یادداشت جلسه ${displayNumber}:\n`;
    const existingNote = student.profile.notes.find(n =>
        !n.isDeleted &&
        n.source &&
        n.source.type === 'fromAttendance' &&
        n.source.sessionNumber === noteSource.sessionNumber
    );

    if (existingNote) {
        if (content) {
            existingNote.content = notePrefix + content;
            existingNote.isDeleted = false; // Restore if it was previously soft-deleted
        } else {
            existingNote.isDeleted = true;
        }
    } else if (content) {
        student.addNote(notePrefix + content, noteSource);
    }
}

export function showClassNoteModal(classroom) {
    newNoteContent.value = classroom.note || '';
    state.setSaveNoteCallback((content) => {
        classroom.note = content;
        state.saveData();
        // We've moved the log call here as well
        logManager.addLog(classroom.info.name, `یادداشت کلاس ذخیره شد.`, { type: 'VIEW_CLASS_NOTE' });
        renderClassList();
        showNotification('✅ یادداشت کلاس ذخیره شد.');
    });
    openModal('add-note-modal');
    newNoteContent.focus();
}

export function showSessionNoteModal(session, displaySessionNumber) {
    // 1. Pre-fill the modal with existing note (or empty)
    newNoteContent.value = session.note || '';
    newNoteContent.dispatchEvent(new Event('input', { bubbles: true })); // Trigger auto-direction

    // 2. Define what happens on "Save"
    state.setSaveNoteCallback((content) => {
        session.note = content;
        state.saveData();

        logManager.addLog(state.currentClassroom.info.name,
            `یادداشت جلسه ${displaySessionNumber} ذخیره شد.`,
            { type: 'VIEW_SESSIONS' });

        renderSessions();
        showNotification("✅یادداشت جلسه ذخیره شد.");
    });

    // 3. Open the modal
    openModal('add-note-modal');
    newNoteContent.focus();
}

export function showSettingsPage(classroom) {
    state.setCurrentClassroom(classroom);
    settingsClassNameHeader.textContent = `تنظیمات کلاس: ${classroom.info.name}`;
    renderSettingsStudentList();
    renderSettingsCategories();
    renderSettingsOther();
    showPage('settings-page');
}

export function renderLogModal(classroomName) {
    const logModalTitle = document.getElementById('log-modal-title');
    const logListUl = document.getElementById('log-list');

    logModalTitle.textContent = `گزارش فعالیت‌های کلاس: ${classroomName}`;
    logListUl.innerHTML = ''; // Clear previous entries

    const logs = getLogsForClass(classroomName);

    if (logs.length === 0) {
        logListUl.innerHTML = `<li class="no-content-message">هنوز فعالیتی برای این کلاس ثبت نشده است.</li>`;
    } else {
        logs.forEach(log => {
            const li = document.createElement('li');
            li.className = 'log-entry';

            const timestamp = new Date(log.timestamp);
            // Format for readability: YYYY/MM/DD HH:MM
            const formattedTime = `${timestamp.toLocaleDateString('fa-IR')} - ${timestamp.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}`;

            const timeSpan = document.createElement('span');
            timeSpan.className = 'log-timestamp';
            timeSpan.textContent = formattedTime;

            const messageSpan = document.createElement('span');
            messageSpan.className = 'log-message';
            messageSpan.textContent = log.message;

            // If the log entry has a clickable action, add the necessary data and class
            if (log.action) {
                messageSpan.classList.add('log-action-link');
                // Store the action object as a string in a data attribute

                messageSpan.dataset.action = JSON.stringify({ ...log.action, classroomName: log.classroomName });
            }

            li.appendChild(timeSpan);
            li.appendChild(messageSpan);
            logListUl.appendChild(li);
        });
    }
    openModal('log-modal');
}

document.getElementById('log-modal-close-btn').addEventListener('click', () => {
    closeActiveModal();
});

export function triggerFileDownload(fileObject) {
    // This creates a temporary URL for the file object.
    const url = URL.createObjectURL(fileObject);

    // This creates a hidden link, sets its properties, and clicks it programmatically.
    const link = document.createElement('a');
    link.href = url;
    link.download = fileObject.name;
    document.body.appendChild(link);
    link.click();

    // This cleans up by removing the link and revoking the temporary URL.
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // --- CHANGED: Ask for confirmation instead of auto-updating ---
    setTimeout(() => {
        showCustomConfirm(
            "آیا فایل پشتیبان با موفقیت ذخیره شد؟",
            () => {
                state.setLastBackupTimestamp();
                renderClassManagementStats();
                showNotification("✅ تاریخ پشتیبان ثبت شد.");
            },
            { confirmText: 'بله، ذخیره شد', cancelText: 'خیر', confirmClass: 'btn-success' }
        );
    }, 500);
}

export async function initiateBackupProcess(classNamesToBackup = []) {
    // 1. Await the file creation.
    const fileToShare = await state.prepareBackupData(classNamesToBackup);

    // 1b. Check if file creation succeeded
    if (!fileToShare) {
        showNotification("❌ خطا در ایجاد فایل پشتیبان.");
        return;
    }

    // Generate Farsi Description
    let backupDescription = 'پشتیبان کامل سیستم';

    if (classNamesToBackup.length > 0) {
        // Join names with Persian comma
        const namesList = classNamesToBackup.join('، ');
        const label = classNamesToBackup.length === 1 ? 'پشتیبان کلاس:' : 'پشتیبان کلاس‌های:';
        backupDescription = `${label} ${namesList}`;
    }

    // Silently save a snapshot to the "Garage" (IndexedDB)
    addBackupSnapshot(fileToShare, {
        name: fileToShare.name,
        description: backupDescription,
        version: "2.0-b64"
    }).catch(err => console.error("Failed to save local snapshot:", err));

    // 2. Check for mobile/share capability.
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice && navigator.share && navigator.canShare && navigator.canShare({ files: [fileToShare] })) {

        // 3. Show a confirmation modal.
        showCustomConfirm(
            "فایل پشتیبان شما آماده است. آیا مایل به اشتراک‌گذاری آن هستید؟",
            () => {
                // 4. Run share logic
                try {
                    navigator.share({
                        title: fileToShare.name,
                        text: 'فایل پشتیبان داده‌های برنامه',
                        files: [fileToShare],
                    })
                        .then(() => {
                            showCustomConfirm(
                                "آیا فایل پشتیبان با موفقیت ارسال/ذخیره شد؟",
                                () => {
                                    state.setLastBackupTimestamp();
                                    renderClassManagementStats();
                                    showNotification("✅ تاریخ پشتیبان ثبت شد.");
                                },
                                { confirmText: 'بله', cancelText: 'خیر', confirmClass: 'btn-success' }
                            );
                        })
                } catch (error) {
                    console.error('Error during sharing process:', error);
                    triggerFileDownload(fileToShare);
                    showNotification("⚠️خطا در فرآیند اشتراک‌گذاری. فایل در حال دانلود است.");
                }
            },
            {
                confirmText: 'بله',
                cancelText: 'خیر',
                confirmClass: 'btn-success'
            }
        );
    } else {
        // 4b. On desktop, just trigger the download directly.
        triggerFileDownload(fileToShare);
        showNotification("✅پشتیبان‌گیری با موفقیت انجام شد.");
    }
}

export function openContextMenu(event, menuItems) {
    event.preventDefault();

    // Start by closing any existing menu and clearing any old target
    closeContextMenu();

    // NEW: Find and highlight the target LI
    contextMenuTarget = event.target.closest('li');
    if (contextMenuTarget) {
        contextMenuTarget.classList.add('context-menu-target');
    }

    // Use a timeout to allow the close transition to begin
    setTimeout(() => {
        const menu = contextMenu;
        const ul = menu.querySelector('ul');
        ul.innerHTML = ''; // Clear out items

        // Dynamically create and add the new menu items
        menuItems.forEach(item => {
            const li = document.createElement('li');

            if (item.isSeparator) {
                li.className = 'separator';
            } else {
                li.innerHTML = `
                    <span class="icon">${item.icon || ''}</span>
                    <span class="label">${item.label}</span>
                `;
                if (item.className) {
                    li.classList.add(item.className);
                }
                li.addEventListener('click', () => {
                    item.action();
                    closeContextMenu(); // This will now also remove the highlight.
                });
            }
            ul.appendChild(li);
        });

        // --- NEW: Positioning Logic ---
        // 1. Make the menu visible so we can measure it
        menu.classList.add('visible');

        // 2. Get dimensions of menu, window, and body
        const { offsetWidth: menuWidth, offsetHeight: menuHeight } = menu;
        const { innerHeight: windowHeight } = window;
        const bodyRect = document.body.getBoundingClientRect();

        // 3. Calculate and apply centered coordinates
        // Center vertically relative to the viewport
        menu.style.top = `${(windowHeight - menuHeight) / 2}px`;

        // Center horizontally relative to the BODY's actual position
        const bodyCenter = bodyRect.left + (bodyRect.width / 2);
        menu.style.left = `${bodyCenter - (menuWidth / 2)}px`;

    }, 50); // A small delay for a smooth effect
}

export function closeContextMenu() {
    if (contextMenu.classList.contains('visible')) {
        contextMenu.classList.remove('visible');
    }

    // NEW: Remove highlight from the target item
    if (contextMenuTarget) {
        contextMenuTarget.classList.remove('context-menu-target');
        contextMenuTarget = null; // Reset the tracker
    }
}

export function renderBreadcrumbs() {
    breadcrumbContainer.innerHTML = ''; // Clear previous breadcrumbs

    // Get the new settings button
    const headerSettingsBtn = document.getElementById('header-settings-btn');
    if (!headerSettingsBtn) return; // Safety check

    const path = []; // This array will hold the parts of our breadcrumb trail

    // --- Home Link (Always the first part) ---
    path.push({
        label: 'کلاس‌ها',
        handler: () => {
            state.setCurrentClassroom(null);
            state.setSelectedSession(null);
            state.setSelectedStudentForProfile(null);
            showPage('class-management-page');
        }
    });

    // --- Build path based on current state ---
    if (state.currentClassroom) {
        path.push({
            label: state.currentClassroom.info.name,
            handler: () => {
                state.setSelectedSession(null);
                state.setSelectedStudentForProfile(null);
                renderSessions();
                showPage('session-page');
            }
        });

        const activePage = document.querySelector('.page.active')?.id;

        // --- NEW LOGIC: Control settings button visibility ---
        if (activePage === 'session-page') {
            headerSettingsBtn.style.visibility = 'visible';
        } else {
            headerSettingsBtn.style.visibility = 'hidden';
        }
        // --- END NEW LOGIC ---

        if (activePage === 'settings-page') {
            path.push({ label: 'تنظیمات' });
        } else if (state.selectedSession) {
            const sessionMap = getSessionDisplayMap(state.currentClassroom);
            const displayNumber = sessionMap.get(state.selectedSession.sessionNumber) || ` (#${state.selectedSession.sessionNumber})`;
            path.push({
                label: `جلسه ${displayNumber}`,
                handler: () => {
                    state.setSelectedStudentForProfile(null);
                    renderSessionDashboard('selector');
                }
            });

            if (state.selectedStudentForProfile) {
                path.push({ label: `پروفایل: ${state.selectedStudentForProfile.identity.name}` });
            } else if (activePage === 'session-dashboard-page') {
                // Check which tab is active
                const isAttendance = document.getElementById('attendance-tab-btn').classList.contains('active');
                if (isAttendance) {
                    path.push({ label: 'حضور و غیاب' });
                } else {
                    path.push({ label: 'انتخابگر' });
                }
            }
        }
    } else {
        // We're on the main class list page
        headerSettingsBtn.style.visibility = 'hidden';
    }

    // --- Render the path to HTML ---
    if (path.length <= 1) {
        breadcrumbContainer.style.display = 'none'; // Hide on main page
        return;
    }

    breadcrumbContainer.style.display = 'flex'; // Show on other pages

    path.forEach((part, index) => {
        const item = document.createElement('a');
        item.textContent = part.label;
        item.className = 'breadcrumb-item';

        if (index === path.length - 1 || !part.handler) {
            item.classList.add('active');
        } else {
            item.addEventListener('click', part.handler);
        }

        breadcrumbContainer.appendChild(item);

        if (index < path.length - 1) {
            const separator = document.createElement('span');
            separator.className = 'breadcrumb-separator';
            separator.textContent = '/';
            breadcrumbContainer.appendChild(separator);
        }
    });
}


function renderStudentAbsenceInfo(student, sessionDisplayNumberMap, absenceSpan) {
    absenceSpan.innerHTML = '';

    // Get full info for each absent session, including makeup status
    const absentSessions = state.currentClassroom.sessions
        .filter(session => !session.isDeleted && !session.isCancelled && session
            .studentRecords[student.identity.studentId]?.attendance === 'absent')
        .map(session => ({
            // Use the map to get the correct display number
            number: sessionDisplayNumberMap.get(session.sessionNumber),
            isMakeup: session.isMakeup
        }))
        // This safely filters out any sessions that might be absent but are now cancelled
        .filter(sessionInfo => sessionInfo.number !== undefined);

    // Rebuild the content with proper styling
    if (absentSessions.length > 0) {
        absenceSpan.appendChild(document.createTextNode('جلسات غایب: '));

        absentSessions.forEach((sessionInfo, index) => {
            const numberSpan = document.createElement('span');
            numberSpan.textContent = sessionInfo.number;

            if (sessionInfo.isMakeup) {
                numberSpan.classList.add('makeup-absence');
            }
            absenceSpan.appendChild(numberSpan);

            if (index < absentSessions.length - 1) {
                absenceSpan.appendChild(document.createTextNode('، '));
            }
        });
    } else {
        absenceSpan.textContent = 'جلسات غایب: بدون غیبت';
    }
}

function renderStudentHomeworkInfo(student, sessionDisplayNumberMap, homeworkSpan, options = {}) {
    const { includePrefix = true } = options;
    homeworkSpan.innerHTML = ''; // Clear previous content

    // Find all sessions where homework was 'incomplete' or 'none'
    const incompleteSessions = state.currentClassroom.sessions
        .filter(session => {
            if (session.isDeleted || session.isCancelled) return false;
            const record = session.studentRecords[student.identity.studentId];
            return record && record.homework && (record.homework.status === 'incomplete' || record.homework.status === 'none');
        })
        .map(session => ({
            number: sessionDisplayNumberMap.get(session.sessionNumber),
            status: session.studentRecords[student.identity.studentId].homework.status
        }))
        .filter(sessionInfo => sessionInfo.number !== undefined); // Ensure cancelled sessions are out

    if (incompleteSessions.length > 0) {
        if (includePrefix) {
            homeworkSpan.appendChild(document.createTextNode('تکالیف ناقص: '));
        }
        incompleteSessions.forEach((sessionInfo, index) => {
            const numberSpan = document.createElement('span');
            numberSpan.textContent = sessionInfo.number;
            if (sessionInfo.status === 'incomplete') {
                numberSpan.classList.add('incomplete-homework');
            }
            homeworkSpan.appendChild(numberSpan);

            if (index < incompleteSessions.length - 1) {
                homeworkSpan.appendChild(document.createTextNode('،'));
            }
        });
    } else {
        if (includePrefix) {
            homeworkSpan.textContent = 'تکالیف ناقص: ندارد';
        } else {
            homeworkSpan.textContent = 'ندارد';
        }
    }
}

function createAttendanceListItem(student, sessionDisplayNumberMap) {
    const li = document.createElement('li');
    li.className = 'attendance-list-item';

    // --- PREPARE ELEMENTS FOR ROW 3 (Required for Row 2 listeners) ---
    const absenceSpan = document.createElement('span');
    absenceSpan.className = 'absence-info';

    const homeworkInfoSpan = document.createElement('span');
    homeworkInfoSpan.className = 'homework-info';


    // --- ROW 1: Checkbox + Student Name ---
    const row1 = document.createElement('div');
    row1.className = 'att-row-1';

    // FLAG: Tracks if the interaction was a long press
    let longPressOccurred = false;

    // Reset flag on any new interaction start
    row1.addEventListener('mousedown', () => longPressOccurred = false);
    row1.addEventListener('touchstart', () => longPressOccurred = false, { passive: true });

    // 1. Define Checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'mass-comment-checkbox';
    checkbox.checked = state.selectedStudentsForMassComment.includes(student.identity.studentId);

    checkbox.addEventListener('change', () => {
        const studentId = student.identity.studentId;
        const currentSelection = state.selectedStudentsForMassComment;
        if (checkbox.checked) {
            if (!currentSelection.includes(studentId)) currentSelection.push(studentId);
        } else {
            const index = currentSelection.indexOf(studentId);
            if (index > -1) currentSelection.splice(index, 1);
        }
        renderMassCommentControls();

        // Optional: Exit selection mode if last item unchecked
        const list = document.getElementById('attendance-list');
        if (currentSelection.length === 0 && list.classList.contains('selection-mode-active')) {
            list.classList.remove('selection-mode-active');
        }
    });

    // 2. Define Name
    const nameSpan = document.createElement('span');
    nameSpan.className = 'student-name';
    nameSpan.textContent = student.identity.firstName && student.identity.lastName
        ? `${student.identity.lastName}، ${student.identity.firstName}`
        : student.identity.name;

    // Normal Click: Profile (Blocked if long press occurred)
    nameSpan.addEventListener('click', (e) => {
        if (longPressOccurred) {
            // It was a long press, so consume this click and do nothing
            e.stopPropagation();
            e.preventDefault();
            longPressOccurred = false; // Reset
            return;
        }
        showStudentProfile(student);
    });

    // 3. Attach Long Press to the ROW
    setupLongPress(row1, (e) => {
        // Set the flag!
        longPressOccurred = true;

        const list = document.getElementById('attendance-list');

        // Activate Selection Mode
        if (!list.classList.contains('selection-mode-active')) {
            list.classList.add('selection-mode-active');
        }

        // Automatically check THIS student
        if (!checkbox.checked) {
            checkbox.checked = true;
            checkbox.dispatchEvent(new Event('change'));
        }
    });

    row1.appendChild(checkbox);
    row1.appendChild(nameSpan);


    // --- ROW 2: Action Buttons (Centered Group) ---
    const row2 = document.createElement('div');
    row2.className = 'att-row-2';

    // 1. Attendance Toggle (Rightmost)
    const attendanceToggleBtn = document.createElement('button');
    let attLongPress = false; // Flag to prevent click after long press

    // Reset flag on touch/mouse down
    attendanceToggleBtn.addEventListener('mousedown', () => attLongPress = false);
    attendanceToggleBtn.addEventListener('touchstart', () => attLongPress = false, { passive: true });

    const currentStatus = state.selectedSession.studentRecords[student.identity.studentId]?.attendance || 'present';

    const updateButtonUI = (status) => {
        if (status === 'present') {
            attendanceToggleBtn.textContent = 'حاضر';
            attendanceToggleBtn.className = 'attendance-status-btn present active';
        } else {
            attendanceToggleBtn.textContent = 'غایب';
            attendanceToggleBtn.className = 'attendance-status-btn absent active';
        }
    };
    updateButtonUI(currentStatus);

    // Normal Click
    attendanceToggleBtn.addEventListener('click', (e) => {
        if (attLongPress) { e.stopPropagation(); return; } // Block if long press occurred

        const oldStatus = state.selectedSession.studentRecords[student.identity.studentId]?.attendance || 'present';
        const newStatus = oldStatus === 'present' ? 'absent' : 'present';

        state.selectedSession.setAttendance(student.identity.studentId, newStatus);
        if (newStatus === 'absent') {
            state.selectedSession.studentRecords[student.identity.studentId].hadIssue = false;
        }
        state.saveData();

        updateButtonUI(newStatus);
        renderStudentAbsenceInfo(student, sessionDisplayNumberMap, absenceSpan);
        renderStudentStatsList();
        renderAbsenteesSummary();
    });

    // Long Press (Mass Action)
    setupLongPress(attendanceToggleBtn, () => {
        attLongPress = true;
        const targetStatus = currentStatus === 'present' ? 'absent' : 'present';
        const targetLabel = targetStatus === 'present' ? 'حاضر' : 'غایب';

        showCustomConfirm(
            `آیا مطمئن هستید که می‌خواهید وضعیت حضور تمام دانش‌آموزان را به «${targetLabel}» تغییر دهید؟`,
            () => {
                getActiveItems(state.currentClassroom.students).forEach(s => {
                    state.selectedSession.setAttendance(s.identity.studentId, targetStatus);
                    if (targetStatus === 'absent') {
                        state.selectedSession.studentRecords[s.identity.studentId].hadIssue = false;
                    }
                });
                state.saveData();
                renderAttendancePage(); // Re-render whole list
                showNotification(`✅ وضعیت تمام دانش‌آموزان به «${targetLabel}» تغییر یافت.`);
            },
            { confirmText: 'بله، اعمال کن', confirmClass: 'btn-warning' }
        );
    });

    // 2. Homework Controls Wrapper
    const homeworkControls = document.createElement('div');
    homeworkControls.className = 'homework-controls';

    const homeworkTooltipMap = {
        none: 'بدون تکلیف',
        complete: 'تکلیف کامل',
        incomplete: 'تکلیف ناقص'
    };

    // HW Status Button
    const homeworkBtn = document.createElement('button');
    let hwStatusLongPress = false;

    homeworkBtn.addEventListener('mousedown', () => hwStatusLongPress = false);
    homeworkBtn.addEventListener('touchstart', () => hwStatusLongPress = false, { passive: true });

    const homeworkStatus = state.selectedSession.studentRecords[student.identity.studentId]?.homework.status || 'none';
    homeworkBtn.className = `homework-status-btn ${homeworkStatus}`;
    homeworkBtn.title = homeworkTooltipMap[homeworkStatus];

    // Normal Click
    homeworkBtn.addEventListener('click', (e) => {
        if (hwStatusLongPress) { e.stopPropagation(); return; }

        const homework = state.selectedSession.studentRecords[student.identity.studentId].homework;
        const statusCycle = { 'none': 'incomplete', 'incomplete': 'complete', 'complete': 'none' };
        const nextStatus = statusCycle[homework.status];

        state.selectedSession.setHomeworkStatus(student.identity.studentId, nextStatus);
        state.saveData();

        homeworkBtn.className = `homework-status-btn ${nextStatus}`;
        homeworkBtn.title = homeworkTooltipMap[nextStatus];
        renderStudentHomeworkInfo(student, sessionDisplayNumberMap, homeworkInfoSpan);
    });

    // Long Press (Mass Action)
    setupLongPress(homeworkBtn, () => {
        hwStatusLongPress = true;
        const statusCycle = { 'none': 'incomplete', 'incomplete': 'complete', 'complete': 'none' };
        const targetStatus = statusCycle[homeworkStatus];
        const targetLabel = homeworkTooltipMap[targetStatus];

        showCustomConfirm(
            `آیا از تغییر وضعیت تکلیف تمام دانش‌آموزان به «${targetLabel}» مطمئن هستید؟`,
            () => {
                getActiveItems(state.currentClassroom.students).forEach(s => {
                    state.selectedSession.setHomeworkStatus(s.identity.studentId, targetStatus);
                });
                state.saveData();
                renderAttendancePage();
                showNotification(`✅ وضعیت تکلیف همه به «${targetLabel}» تغییر یافت.`);
            },
            { confirmText: 'بله', confirmClass: 'btn-warning' }
        );
    });

    // HW Note Button
    const homeworkNoteBtn = document.createElement('button');
    let hwNoteLongPress = false;

    homeworkNoteBtn.addEventListener('mousedown', () => hwNoteLongPress = false);
    homeworkNoteBtn.addEventListener('touchstart', () => hwNoteLongPress = false, { passive: true });

    homeworkNoteBtn.className = 'btn-icon';
    homeworkNoteBtn.innerHTML = '📝';
    homeworkNoteBtn.title = 'افزودن یادداشت برای تکلیف';

    const homeworkComment = state.selectedSession.studentRecords[student.identity.studentId]?.homework.comment;
    if (!homeworkComment) homeworkNoteBtn.style.opacity = '0.3';

    // Normal Click
    homeworkNoteBtn.addEventListener('click', (e) => {
        if (hwNoteLongPress) { e.stopPropagation(); return; }

        // ... (Existing logic for single note) ...
        const homework = state.selectedSession.studentRecords[student.identity.studentId].homework;
        newNoteContent.value = homework.comment || '';
        newNoteContent.dispatchEvent(new Event('input', { bubbles: true }));

        state.setSaveNoteCallback((content) => {
            homework.comment = content;

            // Logic to sync with profile note
            const sessionDisplayNumberMap = getSessionDisplayMap(state.currentClassroom);
            const displayNumber = sessionDisplayNumberMap.get(state.selectedSession.sessionNumber);
            const noteSource = { type: 'fromAttendance', sessionNumber: state.selectedSession.sessionNumber };
            const notePrefix = `یادداشت جلسه ${displayNumber}:\n`;

            const existingNote = student.profile.notes.find(n => !n.isDeleted && n.source && n.source.type === 'fromAttendance' && n.source.sessionNumber === noteSource.sessionNumber);

            if (existingNote) {
                if (content) existingNote.content = notePrefix + content;
                else existingNote.isDeleted = true;
            } else if (content) {
                student.addNote(notePrefix + content, noteSource);
            }

            state.saveData();
            showNotification("✅یادداشت تکلیف ذخیره شد.");
            homeworkNoteBtn.style.opacity = content ? '1' : '0.3';
            renderStudentHomeworkInfo(student, sessionDisplayNumberMap, homeworkInfoSpan);
        });

        openModal('add-note-modal');
        newNoteContent.focus();
    });

    // Long Press (Mass Note)
    setupLongPress(homeworkNoteBtn, () => {
        hwNoteLongPress = true;
        showCustomConfirm(
            "آیا می‌خواهید برای **تمام** دانش‌آموزان کلاس یادداشت تکلیف ثبت کنید؟",
            () => {
                const allStudentIds = getActiveItems(state.currentClassroom.students).map(s => s.identity.studentId);
                state.setSelectedStudentsForMassComment(allStudentIds);
                showMassCommentModal();
            },
            { confirmText: 'بله', confirmClass: 'btn-primary' }
        );
    });

    // Append Buttons to Row 2
    row2.appendChild(attendanceToggleBtn);
    homeworkControls.appendChild(homeworkNoteBtn);
    homeworkControls.appendChild(homeworkBtn);
    row2.appendChild(homeworkControls);


    // --- ROW 3: Info Stats (Absence + Homework) ---
    const row3 = document.createElement('div');
    row3.className = 'att-row-3';

    // Populate initial text
    renderStudentAbsenceInfo(student, sessionDisplayNumberMap, absenceSpan);
    renderStudentHomeworkInfo(student, sessionDisplayNumberMap, homeworkInfoSpan);

    row3.appendChild(absenceSpan); // Right side
    row3.appendChild(homeworkInfoSpan); // Left side

    // --- ASSEMBLE CARD ---
    li.appendChild(row1);
    li.appendChild(row2);
    li.appendChild(row3);

    return li;
}

function getRealSessionNumber() {
    // Use this function to get the active session number. This function filters out cancelled and deleted sessions
    const sessionDisplayNumberMap = getSessionDisplayMap(state.currentClassroom);
    const displayNumber = sessionDisplayNumberMap.get(state.selectedSession.sessionNumber);
    return displayNumber;

}

export function renderAttendancePage() {

    const allStudents = getActiveItems(state.currentClassroom.students);
    const sortedStudents = sortStudents(allStudents);

    if (!state.currentClassroom || !state.selectedSession) return;

    sortedStudents.forEach(student => {
        state.selectedSession.initializeStudentRecord(student.identity.studentId);
    });

    state.setSelectedStudentsForMassComment([]);

    const sessionDisplayNumberMap = getSessionDisplayMap(state.currentClassroom);

    createAbsenteesSummaryBox();

    attendanceListUl.innerHTML = '';

    // Creates and adds the header row
    const headerLi = document.createElement('li');
    headerLi.className = 'attendance-list-header';

    // Configure the search input we created earlier
    attendanceSearchInput.id = 'attendance-search-input';
    attendanceSearchInput.type = 'text';
    attendanceSearchInput.className = 'inline-search-input';
    attendanceSearchInput.placeholder = 'جستجو...';
    attendanceSearchInput.value = ''; // Ensure it's clear on re-render

    // Create a container for the search bar to help with alignment
    const searchContainer = document.createElement('div');
    searchContainer.className = 'student-search-container';
    searchContainer.appendChild(attendanceSearchInput);

    // Create containers for labels
    const labelsContainer = document.createElement('div');
    labelsContainer.className = 'header-labels-container';
    labelsContainer.innerHTML = `
    <span class="header-label">تکلیف</span>
    <span class="header-label">حضور</span>
`;

    // Add the new elements to the header
    headerLi.appendChild(searchContainer);
    headerLi.appendChild(labelsContainer);

    attendanceListUl.appendChild(headerLi);

    sortedStudents.forEach(student => {
        const li = createAttendanceListItem(student, sessionDisplayNumberMap);
        attendanceListUl.appendChild(li);
    });

    // --- NEW: Render controls and reset selection on page load ---
    state.setSelectedStudentsForMassComment([]); // Clear selection when re-rendering the list
    renderMassCommentControls(); // Initialize the button state
    // --- END NEW ---


    setupAbsenteesCopyButton();
    renderAbsenteesSummary();
}

export function renderStudentStatsList() {
    const tableContainer = document.getElementById('student-stats-table-container');
    if (!tableContainer) return;
    tableContainer.innerHTML = '';

    if (!state.currentClassroom) return;

    const totalStudents = getActiveItems(state.currentClassroom.students).length;
    studentStatsHeader.textContent = `آمار عملکرد`;


    // --- DYNAMIC HEADER GENERATION ---
    // 1. Isolate the 'Name' header, which always comes first.
    const nameHeader = ['نام'];

    // 2. Define the static counter headers that will now go at the end.
    const counterHeaders = ['کل انتخاب ها', 'غیبت', 'خروج', 'فرصت ازدست‌رفته', 'مشکل', 'میانگین', 'نمره نهایی'];

    // 3. Get the dynamic part by filtering for gradable categories.
    const gradedCategoryHeaders = state.currentClassroom.categories
        .filter(cat => cat.isGradedCategory && !cat.isDeleted)
        .map(cat => cat.name);

    // 4. Combine them in the new desired order: Name, Graded Categories, Counters.
    const allHeaders = [...nameHeader, ...gradedCategoryHeaders, ...counterHeaders];
    // --- END DYNAMIC HEADER GENERATION ---

    const table = document.createElement('table');
    table.className = 'student-stats-table';

    // Create the header row using our combined list
    const thead = table.createTHead();
    const headerRow = thead.insertRow();
    allHeaders.forEach((headerText, index) => {
        const th = document.createElement('th');

        // Check if it's the first header (the 'Name' column) and add the cue.
        if (index === 0) {
            th.innerHTML = `${headerText} <span style="opacity: 0.6;">🔗</span>`;
            th.title = 'ردیف‌های این ستون قابل کلیک هستند';
        } else {
            th.textContent = headerText;
        }

        headerRow.appendChild(th);
    });

    const tbody = table.createTBody();

    const activeStudents = sortStudents(getActiveItems(state.currentClassroom.students));

    const calculateAbsences = (student) => {
        let absenceCount = 0;
        state.currentClassroom.sessions.forEach(session => {
            if (session.isDeleted || session.isCancelled) return;
            const record = session.studentRecords[student.identity.studentId];
            if (record && record.attendance === 'absent') {
                absenceCount++;
            }
        });
        return absenceCount;
    };

    activeStudents.forEach(student => {
        const row = tbody.insertRow();
        row.dataset.studentId = student.identity.studentId;

        // Highlight absent students' rows
        if (state.selectedSession) {
            const studentRecord = state.selectedSession.studentRecords[student.identity.studentId];
            if (studentRecord && studentRecord.attendance === 'absent') {
                row.classList.add('absent-row-highlight');
            }
        }

        // --- DYNAMIC DATA POPULATION ---
        // 1. Add data for the static columns
        const nameCell = row.insertCell();
        const nameLink = document.createElement('span');
        nameLink.textContent = `${student.identity.lastName}، ${student.identity.firstName}`;
        nameLink.className = 'student-name-link';
        nameLink.addEventListener('click', () => {
            showStudentProfile(student);
        });
        nameCell.appendChild(nameLink);
        // 2. Loops through our dynamic list of gradable categories to add the rest of the data
        gradedCategoryHeaders.forEach(categoryName => {
            const cell = row.insertCell();
            cell.style.direction = 'ltr';
            // The key in categoryCounts is the exact category name (e.g., "Listening")
            const skillKey = categoryName.toLowerCase();
            const scoresForSkill = student.logs.scores[skillKey]?.filter(s => !s.isDeleted) || [];

            if (scoresForSkill.length > 0) {
                scoresForSkill.forEach((score, index) => {
                    const scoreSpan = document.createElement('span');
                    scoreSpan.textContent = score.value + (score.comment ? '\'' : '');
                    scoreSpan.style.position = 'relative'; // This provides the context for the tooltip.

                    if (score.comment) {
                        scoreSpan.dataset.tooltip = score.comment;
                    }

                    cell.appendChild(scoreSpan);

                    // Add a comma if it's not the last score, without a space.
                    if (index < scoresForSkill.length - 1) {
                        cell.appendChild(document.createTextNode(','));
                    }
                });
            } else {
                cell.textContent = ''; // Leave the cell empty if there are no scores.
            }

            // --- NEW: Make the entire cell clickable ---
            cell.style.cursor = 'pointer';
            cell.addEventListener('click', () => {
                displayWinner(student, categoryName);
                const categoryContainer = document.getElementById('category-selection-container');
                if (categoryContainer) {
                    categoryContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
        });
        row.insertCell().textContent = student.statusCounters.totalSelections || 0;
        row.insertCell().textContent = calculateAbsences(student);
        row.insertCell().textContent = student.statusCounters.outOfClassCount || 0;
        row.insertCell().textContent = student.statusCounters.missedChances || 0;


        const totalIssues = Object.values(student.categoryIssues || {}).reduce((sum, count) => sum + count, 0);
        row.insertCell().textContent = totalIssues;

        const overallAverage = student.getOverallAverageScore();
        row.insertCell().textContent = overallAverage !== null ? overallAverage : '-';

        const finalScore = state.currentClassroom.calculateFinalStudentScore(student);
        row.insertCell().textContent = finalScore !== null ? finalScore : '-';

        // --- END DYNAMIC DATA POPULATION ---
    });

    getActiveItems(state.currentClassroom.students);
    studentStatsHeader.setAttribute('data-student-count', activeStudents.length);

    tableContainer.appendChild(table);
    // --- Adds event listener for the name header toggle ---
    const tableElement = tableContainer.querySelector('.student-stats-table');
    const nameHeaderCell = tableElement?.querySelector('thead th:first-child');

    if (nameHeaderCell) {
        nameHeaderCell.addEventListener('click', () => {
            tableElement.classList.toggle('name-column-expanded');
        });
    }
}

export function displayWinner(manualWinner = null, manualCategoryName = null) {
    const resultDiv = document.getElementById('selected-student-result');
    resultDiv.innerHTML = '';

    // --- Table Row Highlight Management ---
    // First, clear any existing winner highlight from the table
    const previousWinnerRow = document.querySelector('.current-winner-highlight');
    if (previousWinnerRow) {
        previousWinnerRow.classList.remove('current-winner-highlight');
    }

    resultDiv.classList.remove('absent');

    let winner, categoryName;

    // --- NEW: Prioritize manual override from table click ---
    if (manualWinner && manualCategoryName) {
        winner = manualWinner;
        categoryName = manualCategoryName;
        state.setManualSelection({ student: manualWinner, categoryName: manualCategoryName });

        // When a student is manually selected, we are not browsing the history.
        state.setWinnerHistoryIndex(-1);
    } else {
        state.setManualSelection(null);
        updateCategoryColumnHighlight(null);
        // --- FALLBACK: Original logic for showing a historical winner ---
        if (!state.selectedSession || state.winnerHistoryIndex < 0 || !state.selectedSession.winnerHistory[state.winnerHistoryIndex]) {
            return;
        }
        const historyEntry = state.selectedSession.winnerHistory[state.winnerHistoryIndex];
        winner = historyEntry.winner;
        categoryName = historyEntry.categoryName;
    }



    // Now, find and highlight the new winner's row
    if (winner) {

        const winnerRow = document.querySelector(`.student-stats-table tr[data-student-id="${winner.identity.studentId}"]`);
        if (winnerRow) {
            winnerRow.classList.add('current-winner-highlight');
        }
    }
    // --- End Highlight Management ---

    // --- NEW: Sync Category State and UI ---
    const correspondingCategory = state.currentClassroom.categories.find(c => c.name === categoryName);
    if (correspondingCategory) {

        // Update the application state to the historical category
        state.setSelectedCategory(correspondingCategory);
        updateSelectButtonText(correspondingCategory);
        updateCategoryWeightLabel(correspondingCategory);

        // Update the UI to show the correct active pill
        const allPills = document.querySelectorAll('#category-selection-container .pill');
        allPills.forEach(p => p.classList.remove('active'));
        const activePill = Array.from(allPills).find(p => p.textContent === categoryName);
        if (activePill) {
            activePill.classList.add('active');
        }

        // Update the quick grade form to match the new active category
        updateQuickGradeUIForCategory(correspondingCategory);
        updateCategoryColumnHighlight(correspondingCategory.name);
    }
    // --- END NEW ---

    const studentRecord = state.selectedSession.studentRecords[winner.identity.studentId];
    const isAbsent = studentRecord?.attendance === 'absent';

    // --- Name and Navigation Container ---
    const nameContainer = document.createElement('div');
    nameContainer.className = 'winner-name-container';

    const backBtn = document.createElement('button');
    backBtn.className = 'btn-icon';
    backBtn.innerHTML = '˅';
    backBtn.title = 'برنده قبلی';
    const isInHistoryMode = !manualWinner;
    backBtn.classList.toggle('is-disabled', !isInHistoryMode || state.winnerHistoryIndex <= 0);
    backBtn.addEventListener('click', () => {
        if (backBtn.classList.contains('is-disabled')) {
            backBtn.classList.add('shake-animation');
            setTimeout(() => backBtn.classList.remove('shake-animation'), 200);
        } else {
            state.setWinnerHistoryIndex(state.winnerHistoryIndex - 1);
            displayWinner(); // Re-render
        }
    });

    const winnerNameEl = document.createElement('div');
    winnerNameEl.className = 'winner-name';
    winnerNameEl.innerHTML = `✨ <strong>${winner.identity.name}</strong>✨`;
    winnerNameEl.classList.add('heartbeat-animation');
    if (isAbsent) {
        winnerNameEl.style.textDecoration = 'line-through';
        winnerNameEl.style.opacity = '0.6';
        winnerNameEl.style.color = 'var(--color-secondary)'; // Make the text gray
    }

    const hadIssue = studentRecord?.hadIssue;
    if (hadIssue && !isAbsent) {
        winnerNameEl.style.color = 'var(--color-warning)';
        winnerNameEl.title = 'این دانش‌آموز در انتخاب قبلی با مشکل مواجه شده بود';
    }

    const wasOutOfClass = studentRecord?.wasOutOfClass;
    if (wasOutOfClass && !isAbsent) {
        winnerNameEl.style.color = 'var(--color-strong-warning)';
        winnerNameEl.title = 'این دانش‌آموز در زمان انتخاب خارج از کلاس بود';
    }

    // --- Long Press Listeners for Undoing Selection ---
    const longPressDuration = 1000; // 1 second

    const startPress = (e) => {


        // Start a timer
        winnerRemovalLongPressTimer = setTimeout(() => {
            // If the timer finishes, the press was long.
            handleUndoLastSelection(winner, categoryName);
            winnerRemovalLongPressTimer = null; // Clear the timer
        }, longPressDuration);
    };

    const cancelPress = () => {
        // If the user lets go or moves their finger away, clear the timer
        if (winnerRemovalLongPressTimer) {
            clearTimeout(winnerRemovalLongPressTimer);
            winnerRemovalLongPressTimer = null;
        }
    };

    // Mouse events for desktop
    winnerNameEl.addEventListener('mousedown', startPress);
    winnerNameEl.addEventListener('mouseup', cancelPress);
    winnerNameEl.addEventListener('mouseout', cancelPress);

    // Touch events for mobile
    winnerNameEl.addEventListener('touchstart', startPress);
    winnerNameEl.addEventListener('touchmove', cancelPress);
    winnerNameEl.addEventListener('touchend', cancelPress);
    winnerNameEl.addEventListener('touchcancel', cancelPress);
    // --- End Long Press ---

    const forwardBtn = document.createElement('button');
    forwardBtn.className = 'btn-icon';
    forwardBtn.innerHTML = '˄';
    forwardBtn.title = 'برنده بعدی';
    forwardBtn.classList.toggle('is-disabled', !isInHistoryMode || state.winnerHistoryIndex >= state.selectedSession.winnerHistory.length - 1);
    forwardBtn.addEventListener('click', () => {
        if (forwardBtn.classList.contains('is-disabled')) {
            forwardBtn.classList.add('shake-animation');
            setTimeout(() => forwardBtn.classList.remove('shake-animation'), 200);
        } else {
            state.setWinnerHistoryIndex(state.winnerHistoryIndex + 1);
            displayWinner(); // Re-render
        }
    });

    nameContainer.appendChild(forwardBtn);
    nameContainer.appendChild(winnerNameEl);

    // Check if the student is new in this specific session
    if (winner.onboardingSession === state.selectedSession.sessionNumber) {
        const newStudentBadge = document.createElement('div');
        newStudentBadge.className = 'new-student-badge';
        newStudentBadge.textContent = 'دانش آموز جدید';
        nameContainer.appendChild(newStudentBadge);
    }

    nameContainer.appendChild(backBtn);
    resultDiv.appendChild(nameContainer);

    // Disable the main "Select Student" button if we are viewing a past winner
    selectStudentBtn.disabled = isInHistoryMode && !forwardBtn.classList.contains('is-disabled');

    // --- Status Buttons (absent, issue, profile) ---
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'status-button-container';

    const absentBtn = document.createElement('button');
    absentBtn.textContent = 'غایب';
    absentBtn.classList.add('status-button', 'absent-btn');
    if (isAbsent) absentBtn.classList.add('active');

    const issueBtn = document.createElement('button');
    issueBtn.textContent = 'مشکل';
    issueBtn.classList.add('status-button', 'issue-btn');
    if (studentRecord?.hadIssue) issueBtn.classList.add('active');

    const exitBtn = document.createElement('button');
    exitBtn.textContent = 'خروج';
    exitBtn.classList.add('status-button', 'exit-btn');
    if (studentRecord?.wasOutOfClass) exitBtn.classList.add('active');

    const profileBtn = document.createElement('button');
    profileBtn.textContent = 'پروفایل';
    profileBtn.className = 'status-button profile-btn';

    if (state.selectedSession.isFinished) {
        absentBtn.disabled = true;
    } else {

        absentBtn.addEventListener('click', () => {
            const isCurrentlyActive = absentBtn.classList.contains('active');

            if (exitBtn.classList.contains('active')) {
                exitBtn.classList.remove('active');
                studentRecord.wasOutOfClass = false;
                winner.statusCounters.outOfClassCount = Math.max(0, (winner.statusCounters.outOfClassCount || 0) - 1);
                winner.statusCounters.missedChances = Math.max(0, winner.statusCounters.missedChances - 1);
            }

            if (!isCurrentlyActive) {
                if (issueBtn.classList.contains('active')) {
                    issueBtn.classList.remove('active');
                    studentRecord.hadIssue = false;
                    winner.statusCounters.otherIssues = Math.max(0, winner.statusCounters.otherIssues - 1);
                    winner.statusCounters.missedChances = Math.max(0, winner.statusCounters.missedChances - 1);
                }
                absentBtn.classList.add('active');
                state.selectedSession.setAttendance(winner.identity.studentId, 'absent');
                winner.statusCounters.missedChances++;

                // Update UI Immediately
                winnerNameEl.style.textDecoration = 'line-through';
                winnerNameEl.style.opacity = '0.6';
                winnerNameEl.style.color = 'var(--color-secondary)'; // Set text color to gray
                winnerNameEl.title = '';
            } else {
                absentBtn.classList.remove('active');
                state.selectedSession.setAttendance(winner.identity.studentId, 'present');
                winner.statusCounters.missedChances = Math.max(0, winner.statusCounters.missedChances - 1);

                // Revert UI Immediately
                winnerNameEl.style.textDecoration = '';
                winnerNameEl.style.opacity = '';
                winnerNameEl.style.color = ''; // Revert text color
            }
            renderStudentStatsList();

            setTimeout(() => {
                // Check if we are in history mode (index != -1) or manual mode
                if (state.winnerHistoryIndex !== -1) {
                    displayWinner(); // Refresh using history index (keeps arrows)
                } else {
                    displayWinner(winner, categoryName); // Refresh using manual selection (no arrows)
                }
            }, 0);

            state.saveData();
        });
    }

    if (state.selectedSession.isFinished) {
        issueBtn.disabled = true;
    } else {
        issueBtn.addEventListener('click', () => {
            const isCurrentlyActive = issueBtn.classList.contains('active');

            if (exitBtn.classList.contains('active')) {
                exitBtn.classList.remove('active');
                studentRecord.wasOutOfClass = false;
                winner.statusCounters.outOfClassCount = Math.max(0, (winner.statusCounters.outOfClassCount || 0) - 1);
                winner.statusCounters.missedChances = Math.max(0, winner.statusCounters.missedChances - 1);
            }

            if (!isCurrentlyActive) {
                if (absentBtn.classList.contains('active')) {
                    absentBtn.classList.remove('active');
                    state.selectedSession.setAttendance(winner.identity.studentId, 'present');
                    winner.statusCounters.missedChances = Math.max(0, winner.statusCounters.missedChances - 1);
                }
                issueBtn.classList.add('active');
                studentRecord.hadIssue = true;

                const categoryName = state.selectedCategory.name;
                winner.categoryIssues[categoryName] = (winner.categoryIssues[categoryName] || 0) + 1;

                winner.statusCounters.missedChances++;

                // --- First, clear any potential 'absent' styling ---
                winnerNameEl.style.textDecoration = '';
                winnerNameEl.style.opacity = '';
                // ----------------------------------------------------

                // Now, apply the 'issue' styling
                winnerNameEl.style.color = 'var(--color-warning)';
                winnerNameEl.title = 'این دانش‌آموز در انتخاب قبلی با مشکل مواجه شده بود';

            } else {
                issueBtn.classList.remove('active');
                studentRecord.hadIssue = false;

                const categoryName = state.selectedCategory.name;
                if (winner.categoryIssues[categoryName]) { winner.categoryIssues[categoryName] = Math.max(0, winner.categoryIssues[categoryName] - 1); }

                winner.statusCounters.missedChances = Math.max(0, winner.statusCounters.missedChances - 1);

                // --- ADDED ---
                winnerNameEl.style.color = ''; // Reverts to default color
                winnerNameEl.title = '';      // Removes the tooltip
                // -------------
            }
            renderStudentStatsList();

            setTimeout(() => {
                // Check if we are in history mode (index != -1) or manual mode
                if (state.winnerHistoryIndex !== -1) {
                    displayWinner(); // Refresh using history index (keeps arrows)
                } else {
                    displayWinner(winner, categoryName); // Refresh using manual selection (no arrows)
                }
            }, 0);

            state.saveData();
        });
    }

    if (state.selectedSession.isFinished) {
        exitBtn.disabled = true;
    } else {
        exitBtn.addEventListener('click', () => {
            const isCurrentlyActive = exitBtn.classList.contains('active');

            if (!isCurrentlyActive) {
                // 1. Deactivate other mutually exclusive buttons & Revert their stats
                if (absentBtn.classList.contains('active')) {
                    absentBtn.classList.remove('active');
                    state.selectedSession.setAttendance(winner.identity.studentId, 'present');
                    winner.statusCounters.missedChances = Math.max(0, winner.statusCounters.missedChances - 1);
                }
                if (issueBtn.classList.contains('active')) {
                    issueBtn.classList.remove('active');
                    studentRecord.hadIssue = false;
                    const categoryName = state.selectedCategory.name;
                    if (winner.categoryIssues[categoryName]) {
                        winner.categoryIssues[categoryName] = Math.max(0, winner.categoryIssues[categoryName] - 1);
                    }
                    winner.statusCounters.missedChances = Math.max(0, winner.statusCounters.missedChances - 1);
                }

                // 2. Activate Exit State
                exitBtn.classList.add('active');
                studentRecord.wasOutOfClass = true;

                // Increment Counters
                winner.statusCounters.outOfClassCount = (winner.statusCounters.outOfClassCount || 0) + 1;
                winner.statusCounters.missedChances++;

                // Visual cues
                winnerNameEl.style.textDecoration = '';
                winnerNameEl.style.opacity = '';
                winnerNameEl.style.color = 'var(--color-strong-warning)';
                winnerNameEl.title = 'این دانش‌آموز در زمان انتخاب خارج از کلاس بود';

            } else {
                // 3. Deactivate Exit State
                exitBtn.classList.remove('active');
                studentRecord.wasOutOfClass = false;

                // Decrement Counters
                winner.statusCounters.outOfClassCount = Math.max(0, (winner.statusCounters.outOfClassCount || 0) - 1);
                winner.statusCounters.missedChances = Math.max(0, winner.statusCounters.missedChances - 1);

                // Remove visual cues
                winnerNameEl.style.color = '';
                winnerNameEl.title = '';
            }
            renderStudentStatsList();

            setTimeout(() => {
                // Check if we are in history mode (index != -1) or manual mode
                if (state.winnerHistoryIndex !== -1) {
                    displayWinner(); // Refresh using history index (keeps arrows)
                } else {
                    displayWinner(winner, categoryName); // Refresh using manual selection (no arrows)
                }
            }, 0);

            state.saveData();
        });
    }

    if (state.selectedSession.isFinished) {
        profileBtn.disabled = true;
    } else {
        profileBtn.addEventListener('click', () => {
            showStudentProfile(winner);
        });
    }

    buttonContainer.appendChild(absentBtn);
    buttonContainer.appendChild(exitBtn);
    buttonContainer.appendChild(issueBtn);
    buttonContainer.appendChild(profileBtn);
    resultDiv.appendChild(buttonContainer);

    // --- Add Qualitative Assessment Row ---
    // Only show if we have a valid category (which we usually do)
    if (categoryName) {
        const qualitativeRow = createQualitativeButtons(winner, categoryName);
        resultDiv.appendChild(qualitativeRow);
    }
    // -------------------------------------------

    // --- Details Container (scores, notes) ---
    const detailsContainer = document.createElement('div');
    detailsContainer.className = 'student-details-container';

    const scoresDiv = document.createElement('div');
    scoresDiv.className = 'student-details-scores';
    scoresDiv.innerHTML = '<h4>آخرین نمرات</h4>';

    const scoresList = document.createElement('ul');
    scoresList.className = 'scores-list';

    // Get all *active* graded categories from the state
    const gradedCategories = state.currentClassroom.categories.filter(
        cat => cat.isGradedCategory && !cat.isDeleted
    );
    let hasAnyScore = false;
    const studentScores = winner.logs.scores || {};

    gradedCategories.forEach(category => {
        const categoryName = category.name; // e.g., "Reading"
        const skillKey = categoryName.toLowerCase(); // e.g., "reading"

        const li = document.createElement('li');
        const skillNameSpan = document.createElement('span');
        skillNameSpan.className = 'skill-name';
        skillNameSpan.textContent = `${categoryName}:`;
        const skillScoresSpan = document.createElement('span');
        skillScoresSpan.className = 'skill-scores';

        const scoresForSkill = studentScores[skillKey]?.filter(s => !s.isDeleted);

        if (scoresForSkill && scoresForSkill.length > 0) {
            hasAnyScore = true;
            // Get the last 3 scores
            const recentScores = scoresForSkill.slice(-3);

            // Loop through them to create individual elements
            recentScores.forEach((score, index) => {
                const scoreItem = document.createElement('span');
                scoreItem.textContent = score.value + (score.comment ? '\'' : '');

                // If there is a comment, attach the tooltip
                if (score.comment) {
                    scoreItem.dataset.tooltip = score.comment;
                    scoreItem.style.position = 'relative'; // Crucial: makes the tooltip appear above THIS number
                    scoreItem.style.cursor = 'help'; // Visual cue that it's hoverable
                    scoreItem.classList.add('tooltip-container'); // Reuse existing class if needed
                }

                skillScoresSpan.appendChild(scoreItem);

                // Add comma separator if it's not the last item
                if (index < recentScores.length - 1) {
                    skillScoresSpan.appendChild(document.createTextNode(','));
                }
            });
        } else {
            skillScoresSpan.textContent = 'none';
        }

        li.appendChild(skillNameSpan);
        li.appendChild(skillScoresSpan);
        scoresList.appendChild(li);
    });

    if (!hasAnyScore) {
        scoresList.innerHTML = `<div class="no-content-message">هنوز نمره‌ای ثبت نشده است.</div>`;
    }

    scoresDiv.appendChild(scoresList);
    detailsContainer.appendChild(scoresDiv);

    const notesDiv = document.createElement('div');
    notesDiv.className = 'student-details-notes';
    // --- NEW: Create a proper header for the notes section ---
    const notesHeader = document.createElement('div');
    notesHeader.className = 'history-section-header'; // Reuse existing style for flex layout

    const notesTitle = document.createElement('h4');
    notesTitle.textContent = 'یادداشت‌ها';

    const addNoteBtn = document.createElement('button');
    addNoteBtn.className = 'btn-icon';
    addNoteBtn.innerHTML = '📝';
    addNoteBtn.title = 'افزودن یادداشت جدید';

    if (state.selectedSession.isFinished) {
        addNoteBtn.disabled = true;
    } else {
        addNoteBtn.addEventListener('click', () => {
            newNoteContent.value = '';
            newNoteContent.dispatchEvent(new Event('input', { bubbles: true }));

            state.setSaveNoteCallback((content) => {
                if (content) {
                    winner.addNote(content); // 'winner' is the selected student in this scope
                    state.saveData();
                    displayWinner(); // This refreshes the winner panel to show the new note
                    showNotification('✅ یادداشت با موفقیت ثبت شد.');
                }
            });

            openModal('add-note-modal');
            newNoteContent.focus();
        });
    }

    notesHeader.appendChild(notesTitle);
    notesHeader.appendChild(addNoteBtn);

    notesDiv.appendChild(notesHeader);
    // --- END NEW ---

    const notesList = document.createElement('ul');
    notesList.className = 'notes-list';

    if (winner.profile.notes && winner.profile.notes.length > 0) {
        const sortedNotes = [...winner.profile.notes].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        sortedNotes.forEach(note => {
            const noteItem = document.createElement('li');
            noteItem.dir = detectTextDirection(note.content); // Set the direction
            noteItem.textContent = note.content;              // Set the content
            notesList.appendChild(noteItem);
        });
    } else {
        notesList.innerHTML = '<div class="no-content-message">یادداشتی وجود ندارد.</div>';
    }

    notesDiv.appendChild(notesList);
    detailsContainer.appendChild(notesDiv);
    resultDiv.appendChild(detailsContainer);
}

export function setAutoDirectionOnInput(inputElement) {
    inputElement.addEventListener('input', () => {
        const text = inputElement.value;
        const direction = detectTextDirection(text);
        inputElement.setAttribute('dir', direction);
    });
}


function initializeStudentPageUI() {

    updateSelectButtonText(null);




    // Set header and clear containers
    categoryPillsContainer.innerHTML = '';
    resultDiv.innerHTML = '';

    // Reset the quick grade form
    quickGradeFormWrapper.classList.add('tooltip-container');
    quickScoreInput.disabled = true;
    quickNoteTextarea.disabled = true;
    quickGradeSubmitBtn.disabled = true;
    quickScoreInput.value = '';
    quickNoteTextarea.value = '';

    // Reset the main action button
    selectStudentBtnWrapper.classList.add('disabled-wrapper');
    selectStudentBtn.disabled = true;
}

function renderCategoryPills() {
    categoryPillsContainer.innerHTML = ''; // Clear existing pills first

    const activeCategories = state.currentClassroom.categories.filter(cat => !cat.isDeleted);

    activeCategories.forEach(category => {
        const pill = document.createElement('span');
        pill.className = 'pill';
        pill.textContent = category.name;
        pill.dataset.categoryId = category.id;
        if (category.description) {
            pill.dataset.tooltip = category.description;
        }

        // --- REGULAR CLICK EVENT ---
        if (state.selectedSession.isFinished) {
            pill.classList.add('disabled');
        } else {
            pill.addEventListener('click', () => {
                document.querySelectorAll('#category-selection-container .pill').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                state.setSelectedCategory(category);
                updateSelectButtonText(category);
                updateCategoryWeightLabel(category);
                updateQuickGradeUIForCategory(category);
                updateCategoryColumnHighlight(category.name);
                selectStudentBtnWrapper.classList.remove('disabled-wrapper');
                selectStudentBtn.disabled = state.selectedSession.isFinished;
                const lastWinnerId = state.selectedSession.lastWinnerByCategory[category.name];
                if (lastWinnerId) {
                    const lastWinner = state.currentClassroom.students.find(s => s.identity.studentId === lastWinnerId);
                    if (lastWinner) {
                        displayWinner(lastWinner, category.name);
                    }
                } else {
                    resultDiv.innerHTML = '';
                    state.setManualSelection(null);
                    state.setWinnerHistoryIndex(-1);
                    selectStudentBtn.disabled = false;
                    const previousWinnerRow = document.querySelector('.current-winner-highlight');
                    if (previousWinnerRow) {
                        previousWinnerRow.classList.remove('current-winner-highlight');
                    }
                }
            });
        }

        // --- NEW CONTEXT MENU (RIGHT-CLICK) EVENT ---
        if (!state.selectedSession.isFinished) {
            pill.addEventListener('contextmenu', (event) => {
                const menuItems = [{
                    label: 'تغییر نام',
                    icon: '✏️',
                    action: () => {
                        showCategoryModal((newName, newIsGraded, newWeight) => {
                            const result = state.renameCategory(state.currentClassroom, category, newName);
                            if (result.success) {
                                category.isGradedCategory = newIsGraded;
                                category.weight = newWeight;
                                state.saveData();
                                logManager.addLog(state.currentClassroom.info.name, `نام دسته‌بندی «${category.name}» به «${newName}» تغییر یافت.`);
                                renderCategoryPills();
                                renderStudentStatsList();
                                showNotification(`✅ نام دسته‌بندی به «${newName}» تغییر یافت.`);
                            } else {
                                showNotification(`⚠️ ${result.message}`);
                            }
                        }, {
                            title: 'ویرایش دسته‌بندی',
                            initialName: category.name,
                            initialIsGraded: category.isGradedCategory,
                            initialWeight: category.weight || 1,
                            saveButtonText: 'ذخیره تغییرات'
                        });
                    }
                }, {
                    label: 'حذف دسته‌بندی',
                    icon: '🗑️',
                    className: 'danger',
                    action: () => {
                        showCustomConfirm(
                            `آیا از انتقال دسته‌بندی «${category.name}» به سطل زباله مطمئن هستید؟`,
                            () => {
                                const trashEntry = {
                                    id: `trash_${Date.now()}_${Math.random()}`,
                                    timestamp: new Date().toISOString(),
                                    type: 'category',
                                    description: `دسته‌بندی «${category.name}» از کلاس «${state.currentClassroom.info.name}»`,
                                    restoreData: { categoryId: category.id, classId: state.currentClassroom.info.scheduleCode }
                                };

                                state.addToTrashBin(trashEntry);

                                //Mark all associated scores as deleted ---
                                const skillKey = category.name.toLowerCase();
                                state.currentClassroom.students.forEach(student => {
                                    if (student.logs.scores && student.logs.scores[skillKey]) {
                                        student.logs.scores[skillKey].forEach(score => {
                                            score.isDeleted = true;
                                        });
                                    }
                                });

                                // --- Check if the deleted category was the active one ---
                                if (state.selectedCategory && state.selectedCategory.id === category.id) {
                                    state.setSelectedCategory(null); // Clear the state
                                    resultDiv.innerHTML = ''; // Clear the winner display
                                    updateQuickGradeUIForCategory(null); // Disable the quick-grade form
                                    updateCategoryColumnHighlight(null); // to clear the highlight
                                    selectStudentBtnWrapper.classList.add('disabled-wrapper'); // Disable the main select button
                                    selectStudentBtn.disabled = true;

                                    // Clear the winner highlight from the stats table
                                    const previousWinnerRow = document.querySelector('.current-winner-highlight');
                                    if (previousWinnerRow) {
                                        previousWinnerRow.classList.remove('current-winner-highlight');
                                    }
                                }

                                category.isDeleted = true;
                                logManager.addLog(state.currentClassroom.info.name, `دسته‌بندی «${category.name}» به سطل زباله منتقل شد.`, {
                                    type: 'VIEW_TRASH'
                                });
                                state.saveData();
                                renderCategoryPills();
                                renderStudentStatsList();
                                showNotification(`✅ دسته‌بندی «${category.name}» به سطل زباله منتقل شد.`);
                            }, {
                            confirmText: 'بله',
                            confirmClass: 'btn-warning'
                        }
                        );
                    }
                }];
                openContextMenu(event, menuItems);
            });
        }

        categoryPillsContainer.appendChild(pill);
    });

    // --- "ADD CATEGORY" PILL ---
    const addPill = document.createElement('span');
    addPill.className = 'pill add-category-pill';
    addPill.textContent = '+';
    addPill.title = 'افزودن دسته‌بندی جدید';

    if (!state.selectedSession.isFinished) {
        addPill.addEventListener('click', () => {

            newCategoryModalIsGradedCheckbox.checked = false;
            document.getElementById('new-category-modal-weight-group').style.display = 'none';

            showCategoryModal((categoryName, isGraded, weight) => {

                const existingCategory = state.currentClassroom.categories.find(

                    cat => cat.name.toLowerCase() === categoryName.toLowerCase() && !cat.isDeleted
                );
                if (existingCategory) {
                    showNotification("⚠️ این دسته‌بندی از قبل وجود دارد.");
                    return;
                }

                const newCategory = new Category(categoryName, '', isGraded, weight);
                state.currentClassroom.categories.push(newCategory);

                state.saveData();
                logManager.addLog(state.currentClassroom.info.name,
                    `دسته‌بندی جدید «${categoryName}» اضافه شد.`, {
                    type: 'VIEW_CLASS_SETTINGS'
                });
                renderCategoryPills();
                showNotification(`✅ دسته‌بندی «${categoryName}» اضافه شد.`);
            }, { initialWeight: 1 }); // Passing default weight to the modal options
        });
    } else {
        addPill.classList.add('disabled');
    }

    categoryPillsContainer.appendChild(addPill);
}

function restoreSessionState() {
    if (state.selectedSession.lastUsedCategoryId) {

        if (state.selectedSession.isFinished) return;

        const lastCategoryPill = categoryPillsContainer.querySelector(`.pill[data-category-id="${state.selectedSession.lastUsedCategoryId}"]`);
        if (lastCategoryPill) {
            lastCategoryPill.click();
        }
    }
    // Checks the winner history to restore the last displayed winner
    if (state.selectedSession.winnerHistory && state.selectedSession.winnerHistory.length > 0) {
        // Point the index to the last winner in the history
        state.setWinnerHistoryIndex(state.selectedSession.winnerHistory.length - 1);
        // Call displayWinner to show them
        displayWinner();
    }
}

// Updates the main "Select Student" button text based on the selected category
function updateSelectButtonText(category) {
    if (category) {
        selectStudentBtn.textContent = `نفر بعدی در ${category.name}`;

    } else {
        selectStudentBtn.textContent = 'نفر بعدی';
    }
}


function updateCategoryWeightLabel(category) {
    if (category && category.isGradedCategory) {
        categoryWeightLabel.textContent = `ضریب: ${category.weight || 1}`;
        categoryWeightLabel.style.display = 'block';
    } else {
        categoryWeightLabel.style.display = 'none';
    }
}

export function updateQuickGradeUIForCategory(category) {

    if (state.selectedSession.isFinished) {
        quickScoreInput.disabled = true;
        quickNoteTextarea.disabled = true;
        quickGradeSubmitBtn.disabled = true;
        quickGradeFormWrapper.setAttribute('title', 'جلسه خاتمه یافته است');
        return;
    }

    if (category && category.isGradedCategory) {
        quickScoreInput.disabled = false;
        quickNoteTextarea.disabled = false;
        quickGradeSubmitBtn.disabled = false;
        quickGradeFormWrapper.removeAttribute('title');
    } else {
        // This block now handles both non-gradable and null/undefined categories.
        quickScoreInput.disabled = true;
        quickNoteTextarea.disabled = true;
        quickGradeSubmitBtn.disabled = true;

        // Set the correct tooltip based on the reason for disabling.
        if (category) { // It's a non-gradable category
            quickGradeFormWrapper.setAttribute('title', 'برای این دسته‌بندی قابلیت نمره دهی تعریف نشده است');
        } else { // No category is selected
            quickGradeFormWrapper.setAttribute('title', 'ابتدا یک دسته‌بندی را انتخاب کنید');
        }
    }
}

export function updateCategoryColumnHighlight(categoryName) {
    const table = document.querySelector('.student-stats-table');
    if (!table) return;

    // --- 1. Clear all previous highlights ---
    const highlightedCells = table.querySelectorAll('.current-category-highlight');
    highlightedCells.forEach(cell => {
        cell.classList.remove('current-category-highlight');
    });

    if (!categoryName) return; // Stop here if we're just clearing

    // --- 2. Find the header index for the new category ---
    let categoryIndex = -1;
    const headers = table.querySelectorAll('thead th');
    headers.forEach((th, index) => {
        // We check .textContent.trim() to find the matching header name
        if (th.textContent.trim() === categoryName) {
            categoryIndex = index;
        }
    });

    if (categoryIndex === -1) return; // Category not found in table (e.g., "Grammar")

    // --- 3. Highlight the header ---
    headers[categoryIndex].classList.add('current-category-highlight');

    // --- 4. Highlight all cells in that column ---
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
        const cell = row.cells[categoryIndex];
        if (cell) {
            cell.classList.add('current-category-highlight');
        }
    });
}



export function showStudentProfile(student) {
    state.setSelectedStudentForProfile(student); // Set the student globally

    // --- Always open the MODAL ---
    const profileModal = document.getElementById('student-profile-modal');
    const modalHeader = document.getElementById('modal-profile-student-name');
    const modalContentContainer = document.getElementById('modal-profile-content-container');
    const modalCloseBtn = document.getElementById('modal-profile-close-btn');

    if (!profileModal || !modalHeader || !modalContentContainer || !modalCloseBtn) return;

    // 1. Set the student's name in the modal header
    modalHeader.textContent = `پروفایل: ${student.identity.name}`;

    modalHeader.style.cursor = 'pointer';
    modalHeader.onclick = () => {
        const currentStudent = state.selectedStudentForProfile;
        const currentClassroom = state.currentClassroom;

        closeActiveModal(() => {
            showRenameStudentModal(currentStudent, currentClassroom);
        });
    };

    // 2. Clear previous content before rendering
    modalContentContainer.innerHTML = '';



    // Create a container for all action buttons
    const actionButtonsContainer = document.createElement('div');
    actionButtonsContainer.className = 'profile-header-actions'; // New CSS class

    // --- Move Student Button ---
    const moveStudentBtn = document.createElement('button');
    moveStudentBtn.className = 'btn-icon btn-icon-label';
    moveStudentBtn.title = 'انتقال دانش‌آموز';
    moveStudentBtn.innerHTML = '<span>➡️</span><span>انتقال</span>';
    moveStudentBtn.addEventListener('click', () => {
        const studentToMove = state.selectedStudentForProfile;
        const sourceClass = state.currentClassroom;

        // Close the profile modal first, then open the move modal
        closeActiveModal(() => {
            showMoveStudentModal(studentToMove, sourceClass);
        });
    });

    // --- Delete Student Button ---
    const deleteStudentBtn = document.createElement('button');
    deleteStudentBtn.className = 'btn-icon btn-icon-label';
    deleteStudentBtn.title = 'حذف دانش‌آموز';
    deleteStudentBtn.innerHTML = '<span>🗑️</span><span>حذف</span>';
    deleteStudentBtn.style.color = 'var(--color-strong-warning)'; // Make it red
    deleteStudentBtn.addEventListener('click', () => {
        const studentToDelete = state.selectedStudentForProfile;
        const currentClass = state.currentClassroom;

        // Close the profile modal first, then show the confirm modal
        closeActiveModal(() => {
            showCustomConfirm(
                `آیا از انتقال دانش‌آموز «${studentToDelete.identity.name}» به سطل زباله مطمئن هستید؟`,
                () => {
                    // This is the same logic from the settings page
                    const trashEntry = {
                        id: `trash_${Date.now()}_${Math.random()}`,
                        timestamp: new Date().toISOString(),
                        type: 'student',
                        description: `دانش‌آموز «${studentToDelete.identity.name}» از کلاس «${currentClass.info.name}»`,
                        restoreData: { studentId: studentToDelete.identity.studentId, classId: currentClass.info.scheduleCode }
                    };

                    state.addToTrashBin(trashEntry);

                    studentToDelete.isDeleted = true;
                    logManager.addLog(currentClass.info.name, `دانش‌آموز «${studentToDelete.identity.name}» به سطل زباله منتقل شد.`, { type: 'VIEW_TRASH' });
                    state.saveData();

                    // Refresh the UI in the background
                    renderSettingsStudentList();
                    renderStudentStatsList();
                    renderAttendancePage();

                    showNotification(`✅ دانش‌آموز «${studentToDelete.identity.name}» به سطل زباله منتقل شد.`);
                },
                {
                    confirmText: 'بله',
                    confirmClass: 'btn-warning',
                    isDelete: true,
                    // If they cancel, re-open the profile
                    onCancel: () => {
                        showStudentProfile(studentToDelete);
                    }
                }
            );
        });
    });

    // 2. Create the "Add Note" button and its listener
    const addNoteBtn = document.createElement('button');
    addNoteBtn.className = 'btn-icon btn-icon-label';
    addNoteBtn.title = 'افزودن یادداشت جدید';
    addNoteBtn.innerHTML = '<span>📝</span><span>یادداشت</span>';
    addNoteBtn.addEventListener('click', () => {
        const studentForNote = state.selectedStudentForProfile; // <-- CAPTURE STUDENT

        newNoteContent.value = ''; // Clear modal for a new note
        newNoteContent.dispatchEvent(new Event('input', { bubbles: true }));

        // Inside addNoteBtn.addEventListener...
        state.setSaveNoteCallback((content) => {
            if (content) {
                studentForNote.addNote(content);
                state.saveData();

                logManager.addLog(state.currentClassroom.info.name, `یادداشت جدیدی برای دانش‌آموز «${studentForNote.identity.name}» ثبت شد.`, { type: 'VIEW_STUDENT_PROFILE', studentId: studentForNote.identity.studentId });

                displayWinner();
                showNotification('✅ یادداشت با موفقیت ثبت شد.');

                // Return a function to be run AFTER the note modal closes
                return () => showStudentProfile(studentForNote);
            }
        });

        // Close the current profile modal, and THEN open the note modal.
        closeActiveModal(() => {
            openModal('add-note-modal');
            newNoteContent.focus();
        });
    });

    // Add all buttons to the new container
    actionButtonsContainer.appendChild(moveStudentBtn);
    actionButtonsContainer.appendChild(deleteStudentBtn);
    actionButtonsContainer.appendChild(addNoteBtn); // Add note button last

    modalContentContainer.appendChild(actionButtonsContainer);


    // 3. Render all profile sections into the modal
    renderProfileScoringSection(modalContentContainer);
    renderHistorySection(modalContentContainer);

    // 4. Set up the close button listener
    modalCloseBtn.onclick = () => closeActiveModal();

    // 5. Finally, open the modal
    openModal('student-profile-modal');
}

function renderProfileScoringSection(container) {
    if (!state.selectedStudentForProfile || !state.currentClassroom) return;

    // 1. Create the main wrapper for the scoring section
    const scoringSection = document.createElement('div');
    scoringSection.className = 'scoring-section';

    // 2. Create and append the HTML content for the section
    scoringSection.innerHTML = `
    <h3>ثبت نمره جدید</h3>
    <div id="modal-graded-pills" class="category-pills"></div>
    <div class="input-group" style="margin-top: 15px; display: flex; gap: 10px;">
        <input type="number" id="modal-new-score-value" placeholder="نمره" style="width: 70px; text-align: center;">
        <input type="text" id="modal-new-score-comment" placeholder="توضیحات (اختیاری)..." style="flex-grow: 1;">
    </div>
    <button id="modal-add-score-btn" class="btn-success" style="width: 100%; margin-top: 10px;">ثبت نمره</button>
`;

    // Enable auto-direction for the new comment input
    setAutoDirectionOnInput(scoringSection.querySelector('#modal-new-score-comment'));

    // 3. Populate the graded category pills
    const pillsContainer = scoringSection.querySelector('#modal-graded-pills');
    const gradedCategories = getActiveItems(state.currentClassroom.categories).filter(c => c.isGradedCategory);

    gradedCategories.forEach(category => {
        const pill = document.createElement('span');
        pill.className = 'pill';
        pill.textContent = category.name;
        pill.dataset.skillName = category.name;
        pill.addEventListener('click', () => {
            pillsContainer.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
        });
        pillsContainer.appendChild(pill);
    });

    // 4. Attach the "Add Score" button's event listener directly
    const addScoreBtn = scoringSection.querySelector('#modal-add-score-btn');
    addScoreBtn.addEventListener('click', () => {
        const activeSkillPill = pillsContainer.querySelector('.pill.active');
        if (!activeSkillPill) {
            showNotification("⚠️لطفاً یک مهارت را برای نمره‌دهی انتخاب کنید.");
            return;
        }
        const skill = activeSkillPill.dataset.skillName;
        const scoreInput = scoringSection.querySelector('#modal-new-score-value');
        const commentTextarea = scoringSection.querySelector('#modal-new-score-comment');
        const value = scoreInput.value;
        const comment = commentTextarea.value.trim();

        if (!value) {
            showNotification("لطفاً مقدار نمره را وارد کنید.");
            return;
        }

        state.selectedStudentForProfile.addScore(skill, parseFloat(value), comment);
        state.saveData();

        logManager.addLog(state.currentClassroom.info.name, `نمره ${value} در ${skill} برای «${state.selectedStudentForProfile.identity.name}» ثبت شد.`, {
            type: 'VIEW_STUDENT_PROFILE',
            studentId: state.selectedStudentForProfile.identity.studentId
        });

        // --- NEW LOGIC ---
        // 1. Refresh the background page
        renderStudentStatsList();
        displayWinner();

        // 2. Clear inputs for the next entry
        scoreInput.value = '';
        commentTextarea.value = '';

        // 3. Refresh the history section within the modal
        const modalContentContainer = document.getElementById('modal-profile-content-container');
        const oldHistorySection = modalContentContainer.querySelector('.history-section');
        if (oldHistorySection) {
            oldHistorySection.remove();
        }
        renderHistorySection(modalContentContainer);

        showNotification(`✅ نمره برای مهارت ${skill} با موفقیت ثبت شد.`);
    });

    // 5. Finally, append the entire new section to the provided container
    container.appendChild(scoringSection);
}

function renderHistorySection(container) {
    if (!state.selectedStudentForProfile) return;

    // 1. Create the main wrapper and its header
    const historySection = document.createElement('div');
    historySection.className = 'history-section';

    const historyHeader = document.createElement('div');
    historyHeader.className = 'history-section-header';

    const title = document.createElement('h3');
    title.textContent = 'سوابق دانش‌آموز';



    // Add the title and the button container to the header
    historyHeader.appendChild(title);

    historySection.appendChild(historyHeader);

    // 3. Call the other functions to populate the content
    renderProfileContent(historySection);
    renderScoresHistory(historySection);
    renderStudentNotes(historySection);

    // 4. Append the complete history section to the main container
    container.appendChild(historySection);
}

function renderProfileContent(container) {
    if (!state.selectedStudentForProfile) return;
    const student = state.selectedStudentForProfile;

    const absenceCount = state.currentClassroom.sessions.reduce((count, session) => {
        const record = session.studentRecords[student.identity.studentId];
        return count + (record && record.attendance === 'absent' ? 1 : 0);
    }, 0);

    const totalIssues = Object.values(student.categoryIssues || {}).reduce((sum, count) => sum + count, 0);

    // --- NEW: Calculate Qualitative Totals ---
    let totalEffort = 0, totalGood = 0, totalExcellent = 0;
    const qStats = student.qualitativeStats || {};
    Object.values(qStats).forEach(s => {
        totalEffort += s.effort || 0;
        totalGood += s.good || 0;
        totalExcellent += s.excellent || 0;
    });
    const totalRated = totalEffort + totalGood + totalExcellent;
    // -----------------------------------------

    // Create a new stats summary div
    const statsSummaryDiv = document.createElement('div');
    statsSummaryDiv.className = 'stats-summary-box';
    statsSummaryDiv.innerHTML = `
        <p><strong>کل انتخاب:</strong> ${student.statusCounters.totalSelections}</p>
        <p><strong>غیبت:</strong> ${absenceCount}</p>
        <p><strong>فرصت از دست رفته:</strong> ${student.statusCounters.missedChances || 0}</p>
        <p><strong>مشکل:</strong> ${totalIssues}</p>
        <p><strong>عملکرد کیفی:</strong> ${totalRated}</p>
    `;
    container.appendChild(statsSummaryDiv);

    const totalSelectionsP = statsSummaryDiv.querySelector('p:nth-child(1)'); // کل انتخاب
    const totalIssuesP = statsSummaryDiv.querySelector('p:nth-child(4)');     // مشکل
    const totalQualityP = statsSummaryDiv.querySelector('p:nth-child(5)');    // عملکرد کیفی (New)

    container.appendChild(statsSummaryDiv);


    // The rest of this function is mostly a copy-paste of the old renderStudentProfilePage,
    // but adapted to append elements to the 'container' parameter.

    const activeCategories = getActiveItems(state.currentClassroom.categories);
    const selectionsBreakdownContainer = document.createElement('div');
    selectionsBreakdownContainer.className = 'stats-breakdown';

    if (activeCategories.length > 0) {



        activeCategories.forEach(category => {
            const categoryName = category.name;
            const count = student.categoryCounts?.[categoryName] || 0;
            const p = document.createElement('p');
            p.className = 'stats-breakdown-item';
            p.innerHTML = `<strong>${categoryName}:</strong> ${count}`;
            selectionsBreakdownContainer.appendChild(p);
        });

        const totalSelectionsP = statsSummaryDiv.querySelector('p:first-child');

        if (totalSelectionsP) {
            totalSelectionsP.classList.add('collapsible-toggle');
            totalSelectionsP.onclick = () => {
                selectionsBreakdownContainer.classList.toggle('open');
                totalSelectionsP.classList.toggle('open'); // Toggles the triangle
            };
            totalSelectionsP.after(selectionsBreakdownContainer);
        }
    }

    const issuesBreakdownContainer = document.createElement('div');
    issuesBreakdownContainer.className = 'stats-breakdown';
    if (activeCategories.length > 0) {



        activeCategories.forEach(category => {
            const categoryName = category.name;
            const count = student.categoryIssues?.[categoryName] || 0;
            const p = document.createElement('p');
            p.className = 'stats-breakdown-item';
            p.innerHTML = `<strong>${categoryName}:</strong> ${count}`;
            issuesBreakdownContainer.appendChild(p);
        });

        if (totalIssuesP) {
            totalIssuesP.classList.add('collapsible-toggle');
            totalIssuesP.onclick = () => {
                issuesBreakdownContainer.classList.toggle('open');
                totalIssuesP.classList.toggle('open'); // Toggles the triangle
            };
            statsSummaryDiv.appendChild(issuesBreakdownContainer);
        }
    }

    // --- NEW: Qualitative Breakdown ---
    const qualityBreakdownContainer = document.createElement('div');
    qualityBreakdownContainer.className = 'stats-breakdown';

    if (totalRated > 0) {
        // Iterate over categories to show specific stats
        for (const cat in qStats) {
            const s = qStats[cat];
            const catTotal = (s.effort || 0) + (s.good || 0) + (s.excellent || 0);

            if (catTotal > 0) {
                const p = document.createElement('p');
                p.className = 'stats-breakdown-item';
                // Inline styles used to match the button colors
                p.innerHTML = `<strong>${cat}:</strong> <span style="color:var(--color-primary)">عالی:${s.excellent}</span> | <span style="color:var(--color-success)">خوب:${s.good}</span> | <span style="color:#fd7e14">تلاش:${s.effort}</span>`;
                qualityBreakdownContainer.appendChild(p);
            }
        }

        if (totalQualityP) {
            totalQualityP.classList.add('collapsible-toggle');
            totalQualityP.onclick = () => {
                qualityBreakdownContainer.classList.toggle('open');
                totalQualityP.classList.toggle('open');
            };
            statsSummaryDiv.appendChild(qualityBreakdownContainer);
        }
    }
    // ----------------------------------

    const homeworkInfoP = document.createElement('p');
    const homeworkLabel = document.createElement('strong');
    homeworkLabel.textContent = 'تکالیف ناقص:';
    const homeworkValuesSpan = document.createElement('span');
    homeworkValuesSpan.style.marginRight = '5px';
    const sessionDisplayNumberMap = getSessionDisplayMap(state.currentClassroom);
    renderStudentHomeworkInfo(student, sessionDisplayNumberMap, homeworkValuesSpan, { includePrefix: false });
    homeworkInfoP.appendChild(homeworkLabel);
    homeworkInfoP.appendChild(homeworkValuesSpan);
    statsSummaryDiv.appendChild(homeworkInfoP);
}



export function renderScoresHistory(scoresContainer) {
    if (!state.selectedStudentForProfile) return;
    const student = state.selectedStudentForProfile;

    // Create the header and list elements
    const scoresHeader = document.createElement('h4');
    scoresHeader.textContent = 'تاریخچه نمرات:';
    scoresHeader.style.marginTop = '20px';

    const profileScoresListUl = document.createElement('ul');
    profileScoresListUl.className = 'list-container';

    // Flatten all scores from all skills into a single array and sort by date
    const allScores = Object.values(student.logs.scores || {})
        .flat()
        .filter(score => !score.isDeleted)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (allScores.length === 0) {
        profileScoresListUl.innerHTML = '<div class="no-content-message">هنوز نمره‌ای ثبت نشده است.</div>';
    } else {
        allScores.forEach(score => {
            const li = document.createElement('li');
            li.className = 'score-history-item';

            const itemContentDiv = document.createElement('div');
            itemContentDiv.className = 'item-content';

            const scoreInfoDiv = document.createElement('div');
            scoreInfoDiv.className = 'score-info';

            const skillBadge = document.createElement('span');
            skillBadge.className = 'score-skill-badge';
            skillBadge.textContent = score.skill;

            const scoreValueSpan = document.createElement('span');
            scoreValueSpan.className = 'score-value';
            scoreValueSpan.textContent = `نمره: ${score.value}`;

            const scoreDateSpan = document.createElement('span');
            scoreDateSpan.className = 'score-date';
            scoreDateSpan.textContent = new Date(score.timestamp).toLocaleDateString('fa-IR');

            scoreInfoDiv.appendChild(skillBadge);
            scoreInfoDiv.appendChild(scoreValueSpan);
            scoreInfoDiv.appendChild(scoreDateSpan);

            itemContentDiv.appendChild(scoreInfoDiv);

            if (score.comment) {
                const scoreCommentP = document.createElement('p');
                scoreCommentP.className = 'score-comment';
                scoreCommentP.innerHTML = renderMultiLineText(score.comment);

                scoreCommentP.addEventListener('click', () => {
                    // 1. Set up the note modal with the score's comment
                    newNoteContent.value = score.comment;
                    newNoteContent.dispatchEvent(new Event('input', { bubbles: true }));

                    // 2. Define what "Save" does
                    state.setSaveNoteCallback((newText) => {
                        score.comment = newText;
                        state.saveData();

                        logManager.addLog(state.currentClassroom.info.name,
                            `توضیحات نمره ${score.value} (${score.skill}) برای دانش‌آموز «${student.identity.name}» به‌روزرسانی شد.`, {
                            type: 'VIEW_STUDENT_PROFILE',
                            studentId: student.identity.studentId
                        });

                        showStudentProfile(student); // Re-open profile modal
                        showNotification("✅ توضیحات نمره با موفقیت ویرایش شد.");
                    });

                    // 3. Close the profile modal, THEN open the note modal
                    closeActiveModal(() => {
                        openModal('add-note-modal');
                        newNoteContent.focus();
                    });
                });

                itemContentDiv.appendChild(scoreCommentP);
            }

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn-icon delete-item-btn';
            deleteBtn.innerHTML = '🗑️';
            deleteBtn.title = 'حذف این نمره';
            deleteBtn.addEventListener('click', () => {
                closeActiveModal(() => {
                    showCustomConfirm(
                        `آیا از انتقال نمره ${score.value} در مهارت «${score.skill}» به سطل زباله مطمئن هستید؟`,
                        () => {
                            // NEW: This logic now sends the item to the trash bin
                            const trashEntry = {
                                id: `trash_${Date.now()}_${Math.random()}`,
                                timestamp: new Date().toISOString(),
                                type: 'score',
                                description: `نمره ${score.value} (${score.skill}) برای «${student.identity.name}»`,
                                restoreData: { scoreId: score.id, skill: score.skill, studentId: student.identity.studentId, classId: state.currentClassroom.info.scheduleCode }
                            };

                            state.addToTrashBin(trashEntry);

                            score.isDeleted = true; // Mark as deleted
                            state.saveData();

                            logManager.addLog(state.currentClassroom.info.name, `نمره ${score.value} (${score.skill}) دانش‌آموز «${student.identity.name}» به سطل زباله منتقل شد.`, { type: 'VIEW_TRASH' });

                            // Re-open the profile modal to see the change
                            showStudentProfile(student);
                            showNotification('✅ نمره به سطل زباله منتقل شد.');
                        },
                        {
                            confirmText: 'تایید انتقال',
                            confirmClass: 'btn-warning',
                            // NEW: If user cancels, re-open the profile modal
                            onCancel: () => {
                                showStudentProfile(student);
                            }
                        }
                    );
                });
            });

            li.appendChild(itemContentDiv);
            li.appendChild(deleteBtn);
            profileScoresListUl.appendChild(li);
        });
    }

    // Append the new elements to the container
    scoresContainer.appendChild(scoresHeader);
    scoresContainer.appendChild(profileScoresListUl);
}

export function renderStudentNotes(notesContainer) {
    // Don't clear the container! Instead, create and append our own elements.
    if (!state.selectedStudentForProfile) return;

    const notesHeader = document.createElement('h4');
    notesHeader.textContent = 'تاریخچه یادداشت‌ها:';
    notesHeader.style.marginTop = '20px';

    const profileNotesListUl = document.createElement('ul');
    profileNotesListUl.className = 'list-container';

    if (!state.selectedStudentForProfile.profile.notes || state.selectedStudentForProfile.profile.notes.length === 0) {
        profileNotesListUl.innerHTML = '<div class="no-content-message">هنوز یادداشتی ثبت نشده است.</div>';
    } else {
        const sortedNotes = [...state.selectedStudentForProfile.profile.notes]
            .filter(note => !note.isDeleted)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        sortedNotes.forEach(note => {
            // ... (The rest of the note creation logic remains exactly the same)
            const li = document.createElement('li');
            li.className = 'note-history-item';

            const itemContentDiv = document.createElement('div');
            itemContentDiv.className = 'item-content';

            const noteInfoDiv = document.createElement('div');
            noteInfoDiv.className = 'note-info';

            const noteDateSpan = document.createElement('span');
            noteDateSpan.className = 'note-date';
            noteDateSpan.textContent = new Date(note.timestamp).toLocaleDateString('fa-IR');

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn-icon delete-item-btn';
            deleteBtn.innerHTML = '🗑️';
            deleteBtn.title = 'حذف این یادداشت';
            deleteBtn.addEventListener('click', () => {

                const studentForNote = state.selectedStudentForProfile; // <-- CAPTURE STUDENT

                // This is the "close-then-open" fix
                closeActiveModal(() => {
                    showCustomConfirm(
                        `آیا از انتقال این یادداشت به سطل زباله مطمئن هستید؟`,
                        () => {
                            const trashEntry = {
                                id: `trash_${Date.now()}_${Math.random()}`,
                                timestamp: new Date().toISOString(),
                                type: 'note',
                                description: `یادداشت برای دانش‌آموز «${studentForNote.identity.name}»`,
                                restoreData: { noteId: note.id, studentId: studentForNote.identity.studentId, classId: state.currentClassroom.info.scheduleCode }
                            };


                            state.addToTrashBin(trashEntry);

                            note.isDeleted = true;
                            logManager.addLog(state.currentClassroom.info.name, `یادداشت دانش‌آموز «${studentForNote.identity.name}» به سطل زباله منتقل شد.`, { type: 'VIEW_TRASH' });
                            state.saveData();

                            // Re-open the profile modal to see the change
                            showStudentProfile(studentForNote);
                            showNotification('✅ یادداشت به سطل زباله منتقل شد.');
                        },
                        {
                            confirmText: 'تایید انتقال',
                            confirmClass: 'btn-warning',
                            // NEW: If user cancels, re-open the profile modal
                            onCancel: () => {
                                showStudentProfile(studentForNote);
                            }
                        }
                    );
                });
            });

            noteInfoDiv.appendChild(noteDateSpan);
            noteInfoDiv.appendChild(deleteBtn);

            const noteContentP = document.createElement('p');
            noteContentP.className = 'note-content';
            noteContentP.innerHTML = renderMultiLineText(note.content);

            noteContentP.addEventListener('click', () => {
                const studentForNote = state.selectedStudentForProfile; // <-- CAPTURE STUDENT
                newNoteContent.value = note.content;
                newNoteContent.dispatchEvent(new Event('input', { bubbles: true }));

                state.setSaveNoteCallback((newText) => {
                    note.content = newText;
                    state.saveData();

                    logManager.addLog(state.currentClassroom.info.name,
                        `یادداشت دانش‌آموز «${studentForNote.identity.name}» به‌روزرسانی شد.`,
                        {
                            type: 'VIEW_STUDENT_PROFILE',
                            studentId: studentForNote.identity.studentId
                        });

                    showStudentProfile(studentForNote);
                    showNotification("✅یادداشت با موفقیت ویرایش شد.");
                });

                // Close the profile modal, THEN open the note modal
                closeActiveModal(() => {
                    openModal('add-note-modal');
                    newNoteContent.focus();
                });
            });

            itemContentDiv.appendChild(noteInfoDiv);
            itemContentDiv.appendChild(noteContentP);
            li.appendChild(itemContentDiv);
            profileNotesListUl.appendChild(li);
        });
    }

    // Append the new elements to the container passed into the function.
    notesContainer.appendChild(notesHeader);
    notesContainer.appendChild(profileNotesListUl);
}

export function renderColumnSelector(headers) {
    columnSelectDropdown.innerHTML = '';
    headers.forEach((header, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = header.trim();
        columnSelectDropdown.appendChild(option);
    });
}

export function renderImportPreview() {
    csvPreviewList.innerHTML = '';
    state.namesToImport.forEach(name => {
        const li = document.createElement('li');
        li.className = 'preview-item';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = true;
        checkbox.dataset.name = name;
        const label = document.createElement('label');
        label.textContent = name;
        li.appendChild(checkbox);
        li.appendChild(label);
        csvPreviewList.appendChild(li);
    });
}


function createClassActionButtons(classroom) {
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'list-item-buttons';

    // --- Note Button ---
    const noteBtn = document.createElement('button');
    noteBtn.className = 'btn-icon';
    noteBtn.innerHTML = '📝';
    noteBtn.title = 'ویرایش یادداشت کلاس';

    // Logic: Only show the button if a note exists
    if (!classroom.note) {
        noteBtn.style.display = 'none';
    }

    noteBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        showClassNoteModal(classroom);
    });

    buttonsContainer.appendChild(noteBtn);

    return buttonsContainer;
}

function createClassInfoContainer(classroom) {
    const nameContainer = document.createElement('div');
    nameContainer.style.flexGrow = '1';
    nameContainer.style.display = 'flex';
    nameContainer.style.flexDirection = 'column';
    nameContainer.style.alignItems = 'flex-start';

    // Class Name
    const classNameSpan = document.createElement('span');
    classNameSpan.textContent = classroom.info.name;
    classNameSpan.classList.add('class-name-display');
    nameContainer.appendChild(classNameSpan);

    // Stats Row (Student and Session Counts + Days)
    const studentCount = getActiveItems(classroom.students).length;
    const sessionCount = getActiveItems(classroom.sessions).filter(session => session.isFinished).length;
    const scheduleDaysText = formatClassDays(classroom.info.scheduleDays);

    const statsRowDiv = document.createElement('div');
    statsRowDiv.classList.add('class-stats-row');

    const studentCountSpan = document.createElement('span');
    studentCountSpan.textContent = `${studentCount} نفر`;
    studentCountSpan.classList.add('student-count-badge');
    statsRowDiv.appendChild(studentCountSpan);

    const sessionCountSpan = document.createElement('span');
    sessionCountSpan.textContent = `${sessionCount} جلسه`;
    sessionCountSpan.classList.add('session-count-badge');
    statsRowDiv.appendChild(sessionCountSpan);

    //Add Days Badge if schedule exists
    if (scheduleDaysText) {
        const daysSpan = document.createElement('span');
        daysSpan.textContent = scheduleDaysText;
        daysSpan.classList.add('schedule-days-badge'); // New class for potential styling
        statsRowDiv.appendChild(daysSpan);
    }

    nameContainer.appendChild(statsRowDiv);

    // Add navigation event listener
    nameContainer.addEventListener('click', () => {
        state.setCurrentClassroom(classroom);
        state.setSelectedSession(null);
        state.setLiveSession(state.currentClassroom.liveSession);
        renderSessions();
        showPage('session-page');
    });

    return nameContainer;
}

function createClassListItem(classroom) {
    const li = document.createElement('li');

    // Check status and apply highlight for the ongoing class (class that's inside its schedule time)
    const status = getClassScheduleStatus(classroom);
    if (status.type === 'active') {
        li.classList.add('active-class-card');
        li.title = 'این کلاس هم‌اکنون در حال برگزاری است'; // Tooltip hint
    }

    // --- Checkbox for selection ---
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'mass-selection-checkbox';
    checkbox.checked = state.selectedClassIds.includes(classroom.info.name);

    checkbox.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevents the main list item's click event
    });

    checkbox.addEventListener('change', () => {
        const className = classroom.info.name;
        if (checkbox.checked) {
            if (!state.selectedClassIds.includes(className)) {
                state.selectedClassIds.push(className);
            }
        } else {
            const index = state.selectedClassIds.indexOf(className);
            if (index > -1) {
                state.selectedClassIds.splice(index, 1);
            }
        }
    });

    li.appendChild(checkbox);

    // --- 1. Info Container (Name and Counts) ---
    const infoContainer = createClassInfoContainer(classroom);
    li.appendChild(infoContainer);

    // --- 3. Left Column Wrapper (Holds Badges & Buttons Vertically) ---
    const leftColumnWrapper = document.createElement('div');
    leftColumnWrapper.style.display = 'flex';
    leftColumnWrapper.style.flexDirection = 'column';
    leftColumnWrapper.style.gap = '5px';
    leftColumnWrapper.style.alignItems = 'flex-end'; // Aligns contents to the left (in RTL)
    leftColumnWrapper.style.marginLeft = '10px'; // Adds some breathing room from the text

    // A. Badges Container
    const badgesContainer = document.createElement('div');
    badgesContainer.className = 'list-item-badges';

    // 1. Unfinished Session Badge
    if (classroom.liveSession && !classroom.liveSession.isCancelled && !classroom.liveSession.isDeleted) {
        const warningBadge = document.createElement('span');
        warningBadge.className = 'warning-badge';
        warningBadge.textContent = 'جلسه باز';
        badgesContainer.appendChild(warningBadge);
        li.classList.add('has-unfinished-session');
    }

    // 2. Class Type Badge
    const typeBadge = document.createElement('span');
    typeBadge.className = `type-badge ${classroom.info.type}`;
    typeBadge.textContent = classroom.info.type === 'online' ? 'آنلاین' : 'حضوری';
    typeBadge.title = 'نوع کلاس';
    badgesContainer.appendChild(typeBadge);

    // 3. Schedule Status Badge
    const scheduleStatus = getClassScheduleStatus(classroom);

    if (scheduleStatus.type === 'incomplete') {
        const incompleteBadge = document.createElement('span');
        incompleteBadge.className = 'type-badge cancelled-badge';
        incompleteBadge.textContent = 'زمان‌بندی ناقص';
        incompleteBadge.style.cursor = 'pointer';
        incompleteBadge.title = 'برای تکمیل زمان‌بندی کلیک کنید';
        incompleteBadge.addEventListener('click', (e) => {
            e.stopPropagation();
            showCustomConfirm(
                "زمان‌بندی این کلاس کامل نیست. برای نمایش صحیح در لیست، لطفاً روزها و ساعت برگزاری را مشخص کنید.",
                () => { showSettingsPage(classroom); },
                { confirmText: 'تنظیمات', confirmClass: 'btn-primary' }
            );
        });
        badgesContainer.appendChild(incompleteBadge);
    } else {
        const conflictName = findScheduleConflict(classroom, state.classrooms);
        if (conflictName) {
            const conflictBadge = document.createElement('span');
            conflictBadge.className = 'type-badge conflict-badge';
            conflictBadge.textContent = 'تداخل زمانی';
            conflictBadge.style.cursor = 'pointer';
            conflictBadge.title = `تداخل با کلاس: ${conflictName}`;
            conflictBadge.addEventListener('click', (e) => {
                e.stopPropagation();
                showCustomConfirm(
                    `زمان برگزاری این کلاس با کلاس «${conflictName}» تداخل دارد. لطفاً زمان‌بندی را بررسی کنید.`,
                    () => { showSettingsPage(classroom); },
                    { confirmText: 'تنظیمات', confirmClass: 'btn-primary' }
                );
            });
            badgesContainer.appendChild(conflictBadge);
        }
    }

    // Add Badges to Wrapper
    leftColumnWrapper.appendChild(badgesContainer);

    // B. Action Buttons (Note Button) - Appended UNDER badges
    const buttonsContainer = createClassActionButtons(classroom);
    leftColumnWrapper.appendChild(buttonsContainer);

    // Add the entire wrapper to the list item
    li.appendChild(leftColumnWrapper);

    // --- 4. Add the right-click context menu ---
    li.addEventListener('contextmenu', (event) => {

        // This block defines the backup option and then immediately adjusts it for multi-selection.
        const backupItem = {
            label: 'پشتیبان‌گیری از این کلاس',
            icon: '📤',
            action: () => {
                initiateBackupProcess([classroom.info.name]);
            }
        };

        const selectedCount = state.selectedClassIds.length;
        // If more than one class is checked AND the right-clicked class is one of them...
        if (selectedCount > 1 && state.selectedClassIds.includes(classroom.info.name)) {
            // ...update the label and the action for the multi-backup case.
            backupItem.label = `پشتیبان‌گیری از ${selectedCount} کلاس`;
            backupItem.action = () => {
                initiateBackupProcess(state.selectedClassIds);
                state.setSelectedClassIds([]); // Clear the selection
                renderClassList(); // Re-render to uncheck the boxes
            };
        }

        // --- 1. Define Default Single Delete Item ---
        const deleteItem = {
            label: 'حذف کلاس',
            icon: '🗑️',
            className: 'danger',
            action: () => {
                showCustomConfirm(
                    `آیا از انتقال کلاس «${classroom.info.name}» به سطل زباله مطمئن هستید؟`,
                    () => {
                        const trashEntry = {
                            id: `trash_${Date.now()}_${Math.random()}`,
                            timestamp: new Date().toISOString(),
                            type: 'classroom',
                            description: `کلاس «${classroom.info.name}»`,
                            restoreData: { name: classroom.info.name }
                        };

                        // USE THE NEW FUNCTION
                        state.addToTrashBin(trashEntry);

                        classroom.isDeleted = true;
                        logManager.addLog(classroom.info.name, `کلاس «${classroom.info.name}» به سطل زباله منتقل شد.`, { type: 'VIEW_TRASH' });
                        state.saveData();
                        renderClassList();
                        showNotification(`✅ کلاس «${classroom.info.name}» به سطل زباله منتقل شد.`);
                    },
                    { confirmText: 'بله', confirmClass: 'btn-warning', isDelete: true }
                );
            }
        };

        // --- 2. Override for Batch Deletion ---
        if (selectedCount > 1 && state.selectedClassIds.includes(classroom.info.name)) {
            deleteItem.label = `حذف ${selectedCount} کلاس`;
            deleteItem.action = () => {
                showCustomConfirm(
                    `آیا از انتقال ${selectedCount} کلاس انتخاب شده به سطل زباله مطمئن هستید؟`,
                    () => {
                        state.selectedClassIds.forEach(clsName => {
                            const cls = state.classrooms[clsName];
                            if (cls && !cls.isDeleted) {
                                const trashEntry = {
                                    id: `trash_${Date.now()}_${Math.random()}`,
                                    timestamp: new Date().toISOString(),
                                    type: 'classroom',
                                    description: `کلاس «${cls.info.name}»`,
                                    restoreData: { name: cls.info.name }
                                };

                                // USE THE NEW FUNCTION
                                state.addToTrashBin(trashEntry);

                                cls.isDeleted = true;
                                logManager.addLog(cls.info.name, `کلاس «${cls.info.name}» به سطل زباله منتقل شد.`, { type: 'VIEW_TRASH' });
                            }
                        });

                        state.setSelectedClassIds([]);
                        state.saveData();
                        renderClassList();
                        showNotification(`✅ ${selectedCount} کلاس به سطل زباله منتقل شدند.`);
                    },
                    { confirmText: 'بله', confirmClass: 'btn-warning', isDelete: true }
                );
            };
        }

        const menuItems = [
            {
                label: 'چاپ گزارش کلاس',
                icon: '🖨️',
                action: () => {
                    showReportConfigModal(classroom);
                }
            },
            {
                label: classListUl.classList.contains('selection-mode-active') ? 'لغو انتخاب' : 'انتخاب چند کلاس',
                icon: '✔️',
                action: () => {
                    const wasSelectionMode = classListUl.classList.contains('selection-mode-active');
                    classListUl.classList.toggle('selection-mode-active');

                    if (wasSelectionMode) {
                        state.setSelectedClassIds([]);
                        renderClassList();
                    }
                }
            },
            backupItem,
            {
                label: 'یادداشت کلاس',
                icon: '📝',
                action: () => {
                    showClassNoteModal(classroom);
                }
            },
            {
                label: 'تنظیمات کلاس',
                icon: '⚙️',
                action: () => {
                    showSettingsPage(classroom);
                }
            },
            {
                label: 'گزارش فعالیت‌ها',
                icon: '📋',
                action: () => {
                    renderLogModal(classroom.info.name);
                }
            },
            {
                label: 'تغییر نام',
                icon: '✏️',
                action: () => {
                    const oldName = classroom.info.name;
                    const modalTitle = document.getElementById('add-note-modal-title');
                    modalTitle.textContent = 'تغییر نام کلاس';
                    newNoteContent.value = oldName;
                    newNoteContent.rows = 1;

                    state.setSaveNoteCallback((newName) => {
                        const trimmedNewName = newName.trim();
                        if (trimmedNewName && trimmedNewName !== oldName) {
                            const result = state.renameClassroom(oldName, trimmedNewName);
                            if (result.success) {
                                logManager.renameClassroomLog(oldName, trimmedNewName);
                                logManager.addLog(trimmedNewName, `نام کلاس از «${oldName}» به «${trimmedNewName}» تغییر یافت.`, { type: 'VIEW_SESSIONS' });
                                state.saveData();
                                renderClassList();
                                showNotification(`✅نام کلاس به «${trimmedNewName}» تغییر یافت.`);
                            } else {
                                showNotification(result.message);
                            }
                        }
                        modalTitle.textContent = 'ثبت یادداشت جدید';
                        newNoteContent.rows = 4;
                    });
                    openModal('add-note-modal');
                    newNoteContent.focus();
                    newNoteContent.select();
                }
            },
            deleteItem
        ];
        openContextMenu(event, menuItems);
    });

    return li;
}

export function renderClassManagementStats() {
    const statsContainer = document.getElementById('class-management-stats');
    if (!statsContainer) return;

    const activeClasses = Object.values(state.classrooms).filter(c => !c.isDeleted);
    const totalClasses = activeClasses.length;
    const totalStudents = activeClasses.reduce((sum, classroom) => {
        return sum + getActiveItems(classroom.students).length;
    }, 0);

    let backupDateHtml = '';
    if (state.userSettings.lastBackupTimestamp) {
        // Updated formatting to include weekday and time
        const backupDate = new Date(state.userSettings.lastBackupTimestamp).toLocaleString('fa-IR', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            weekday: 'long',
            hour: '2-digit',
            minute: '2-digit'
        });

        backupDateHtml = `
            <div class="stats-row backup-stat">
                <span>آخرین پشتیبان: <strong>${backupDate}</strong></span>
            </div>
        `;
    }

    statsContainer.innerHTML = `
        <div class="stats-row main-stats">
            <span>کل کلاس‌ها: <strong>${totalClasses}</strong></span>
            <span>|</span>
            <span>کل دانش‌آموزان: <strong>${totalStudents}</strong></span>
        </div>
        ${backupDateHtml} 
    `;
}

export function renderClassList() {

    renderClassManagementStats();

    classListUl.innerHTML = '';

    const activeClasses = Object.values(state.classrooms).filter(c => !c.isDeleted);

    // --- Select elements ---
    const fabContainer = document.querySelector('.fab-container');
    const globalSearchContainer = document.querySelector('.global-search-container');

    // --- Handle Empty State ---
    if (activeClasses.length === 0) {
        // 1. Center the FAB
        if (fabContainer) fabContainer.classList.add('center-empty-state');

        // 2. Hide the search container completely
        if (globalSearchContainer) globalSearchContainer.style.display = 'none';

        classListUl.innerHTML = '<li class="no-content-message" style="text-align:center; margin-top:20px;">هنوز کلاسی ایجاد نشده است.</li>';
        return;
    } else {
        // Restore standard view
        if (fabContainer) fabContainer.classList.remove('center-empty-state');
        if (globalSearchContainer) globalSearchContainer.style.display = ''; // Clears the inline style to revert to CSS default
    }
    // ---------------------------------------

    const sortedClasses = activeClasses.sort((a, b) => {
        const statusA = getClassScheduleStatus(a);
        const statusB = getClassScheduleStatus(b);

        // 1. Primary Sort: By Status Rank (Active < Upcoming < Incomplete < Unscheduled)
        if (statusA.sortIndex !== statusB.sortIndex) {
            return statusA.sortIndex - statusB.sortIndex;
        }

        // 2. Secondary Sort for "Upcoming": Who starts sooner?
        if (statusA.type === 'upcoming') {
            return statusA.nextTimestamp - statusB.nextTimestamp;
        }

        // 3. Fallback Sort: Creation Date (for Incomplete/Unscheduled/Active ties)
        return new Date(a.info.creationDate) - new Date(b.info.creationDate);
    });

    sortedClasses.forEach(classroom => {
        const li = createClassListItem(classroom);
        classListUl.appendChild(li);
    });
}

// End of functions needed for rendering the classroom page

export function renderSettingsStudentList() {
    if (!state.currentClassroom) return;

    settingsStudentListUl.innerHTML = '';

    // 1. Get all active students
    const allStudents = getActiveItems(state.currentClassroom.students);

    //2. sort students into structured and unstructured
    const sortedStudents = sortStudents(allStudents);



    // 3. Render the list
    sortedStudents.forEach(student => {
        const li = document.createElement('li');

        // Critical for the highlight feature we added earlier
        li.dataset.studentId = student.identity.studentId;

        const nameSpan = document.createElement('span');
        nameSpan.className = 'student-name-link'; // Restore styling
        nameSpan.style.flexGrow = '1'; // Ensure it fills the space for easier clicking

        // --- VISUAL GUIDE LOGIC ---
        // If separated, show "First ، Last". If not, show normal "Name"
        if (student.identity.firstName && student.identity.lastName) {
            nameSpan.textContent = `${student.identity.lastName}، ${student.identity.firstName}`;
        } else {
            nameSpan.textContent = student.identity.name;
        }

        // Restore Click Listener to Open Profile
        nameSpan.addEventListener('click', () => {
            showStudentProfile(student);
        });

        // Rename Logic (Long Press)
        setupLongPress(li, (e) => {
            showRenameStudentModal(student, state.currentClassroom);
        });

        // Context Menu
        li.addEventListener('contextmenu', (event) => {
            const menuItems = [
                {
                    label: 'تغییر نام',
                    icon: '✏️',
                    action: () => {
                        showRenameStudentModal(student, state.currentClassroom);
                    }
                },
                {
                    label: 'انتقال دانش‌آموز',
                    icon: '➡️',
                    action: () => {
                        showMoveStudentModal(student, state.currentClassroom);
                    }
                },
                {
                    label: 'حذف دانش‌آموز',
                    icon: '🗑️',
                    className: 'danger',
                    action: () => {
                        showCustomConfirm(
                            `آیا از انتقال دانش‌آموز «${student.identity.name}» به سطل زباله مطمئن هستید؟`,
                            () => {
                                const trashEntry = {
                                    id: `trash_${Date.now()}_${Math.random()}`,
                                    timestamp: new Date().toISOString(),
                                    type: 'student',
                                    description: `دانش‌آموز «${student.identity.name}» از کلاس «${state.currentClassroom.info.name}»`,
                                    restoreData: { studentId: student.identity.studentId, classId: state.currentClassroom.info.scheduleCode }
                                };

                                // NEW LOGIC: Use the central function
                                state.addToTrashBin(trashEntry);

                                student.isDeleted = true;
                                logManager.addLog(state.currentClassroom.info.name, `دانش‌آموز «${student.identity.name}» به سطل زباله منتقل شد.`, { type: 'VIEW_TRASH' });
                                state.saveData();

                                // Refresh all relevant UI parts
                                renderSettingsStudentList();
                                renderStudentStatsList();
                                renderAttendancePage();

                                showNotification(`✅ دانش‌آموز «${student.identity.name}» به سطل زباله منتقل شد.`);
                            },
                            { confirmText: 'بله', confirmClass: 'btn-warning' }
                        );
                    }
                }
            ];
            openContextMenu(event, menuItems);
        });

        li.appendChild(nameSpan);
        // Note: deleteBtn is gone
        settingsStudentListUl.appendChild(li);
    });
}

export function renderSettingsCategories() {
    categoryListUl.innerHTML = '';
    if (!state.currentClassroom) return;

    const activeCategories = state.currentClassroom.categories.filter(cat => !cat.isDeleted);

    activeCategories.forEach(category => {
        const li = document.createElement('li');
        const nameAndBadgeContainer = document.createElement('div');
        nameAndBadgeContainer.className = 'name-and-badge-container';

        const nameSpan = document.createElement('span');
        nameSpan.textContent = category.name;
        nameAndBadgeContainer.appendChild(nameSpan);

        // If the category is graded, add the badge
        if (category.isGradedCategory) {
            const gradedBadge = document.createElement('span');
            gradedBadge.className = 'category-badge';
            gradedBadge.textContent = 'نمره‌دار';
            nameAndBadgeContainer.appendChild(gradedBadge);
        }

        if (category.isGradedCategory) {
            const weightBadge = document.createElement('span');
            weightBadge.className = 'category-badge weight-badge';
            weightBadge.textContent = `ضریب: ${category.weight || 1}`;
            nameAndBadgeContainer.appendChild(weightBadge);
        }

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-icon';
        deleteBtn.innerHTML = '🗑️';
        deleteBtn.style.color = 'var(--color-warning)';
        deleteBtn.addEventListener('click', () => {
            showCustomConfirm(
                `آیا از انتقال دسته‌بندی «${category.name}» به سطل زباله مطمئن هستید؟`,
                () => {
                    const trashEntry = {
                        id: `trash_${Date.now()}_${Math.random()}`,
                        timestamp: new Date().toISOString(),
                        type: 'category',
                        description: `دسته‌بندی «${category.name}» از کلاس «${state.currentClassroom.info.name}»`,
                        restoreData: { categoryId: category.id, classId: state.currentClassroom.info.scheduleCode }
                    };

                    // NEW LOGIC
                    state.addToTrashBin(trashEntry);

                    category.isDeleted = true;
                    logManager.addLog(state.currentClassroom.info.name, `دسته‌بندی «${category.name}» به سطل زباله منتقل شد.`, { type: 'VIEW_TRASH' });
                    state.saveData();
                    renderSettingsCategories();
                    showNotification(`✅ دسته‌بندی «${category.name}» به سطل زباله منتقل شد.`);
                },
                { confirmText: 'بله', confirmClass: 'btn-warning' }
            );
        });
        li.appendChild(nameAndBadgeContainer);
        li.appendChild(deleteBtn);
        categoryListUl.appendChild(li);
    });
}

export function renderSettingsOther() {
    if (!state.currentClassroom) return;
    const classroom = state.currentClassroom;

    // --- 1. Educational System Setup (Refactored) ---
    populateSystemLevelSelects(
        settingsEduSystemSelect,
        settingsLevelSelect,
        classroom.info.educationalSystem,
        classroom.info.level
    );

    // Add specific listeners for the Settings page to save data immediately
    settingsEduSystemSelect.addEventListener('change', () => {
        classroom.info.educationalSystem = settingsEduSystemSelect.value;
        // We need to grab the new level value because the helper resets it
        classroom.info.level = settingsLevelSelect.value;
        state.saveData();
    });

    settingsLevelSelect.addEventListener('change', () => {
        classroom.info.level = settingsLevelSelect.value;
        state.saveData();
    });

    // --- 3. Class Type Logic  ---
    const classType = classroom.info.type || 'in-person';
    const radioToSelect = document.querySelector(`#settings-page input[name="class-type-setting"][value="${classType}"]`);
    if (radioToSelect) {
        radioToSelect.checked = true;
    }

    // --- 4.  Schedule Logic ---
    const scheduleDays = classroom.info.scheduleDays || [];
    document.querySelectorAll('input[name="schedule-day"]').forEach(checkbox => {
        checkbox.checked = scheduleDays.includes(parseInt(checkbox.value));
    });

    document.getElementById('settings-schedule-start').value = classroom.info.scheduleStartTime || '';
    document.getElementById('settings-schedule-end').value = classroom.info.scheduleEndTime || '';
}

export function _internalShowPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    const pageToShow = document.getElementById(pageId);
    if (pageToShow) {
        pageToShow.classList.add('active');
    }

    // This part for the header can remain separate as it's a unique case
    if (pageId === 'class-management-page') {

        state.setCurrentClassroom(null);
        state.setSelectedSession(null);
        state.setSelectedStudentForProfile(null);

        renderClassList();
        appHeader.style.display = 'flex';
    } else {
        appHeader.style.display = 'none';
    }
    renderBreadcrumbs();
}

export function showPage(pageId, options = {}) {
    const { tab } = options;
    const historyState = {
        pageId,
        currentClassName: state.currentClassroom ? state.currentClassroom.info.name : null,
        selectedSessionNumber: state.selectedSession ? state.selectedSession.sessionNumber : null,
        selectedStudentId: state.selectedStudentForProfile ? state.selectedStudentForProfile.identity.studentId : null,
    };

    // Build a new URL with query parameters to store the context
    let hash = `#${pageId}`;
    const params = new URLSearchParams(window.location.hash.split('?')[1] || '');

    //  CLASSROOM LOGIC ---
    if (state.currentClassroom) {
        params.set('class', state.currentClassroom.info.name);
    } else {
        params.delete('class');
    }

    //  SESSION LOGIC ---
    if (state.selectedSession) {
        params.set('session', state.selectedSession.sessionNumber);
    } else {
        params.delete('session');
    }

    //  STUDENT LOGIC ---
    if (state.selectedStudentForProfile) {
        params.set('student', state.selectedStudentForProfile.identity.studentId);
    } else {
        params.delete('student');
    }

    // --- TAB LOGIC ---
    if (pageId === 'session-dashboard-page' && tab) {
        params.set('tab', tab);
    } else if (pageId !== 'session-dashboard-page') {
        // Clean up tab param if we're not on the dashboard
        params.delete('tab');
    }

    const paramsString = params.toString();
    if (paramsString) {
        hash += `?${paramsString}`;
    }

    // Only push a new entry to browser history if the URL has actually changed
    if (window.location.hash !== hash) {
        history.pushState(historyState, '', hash);
    }

    _internalShowPage(pageId);
}

// Reactored rendersessions sub functions

function createSessionActionButtons(session, displaySessionNumber) {
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'list-item-buttons';
    // Add gap to separate the button from the note icon
    buttonsContainer.style.gap = '10px';

    // --- 1. Define Note Button ---
    const noteBtn = document.createElement('button');
    noteBtn.className = 'btn-icon';
    noteBtn.innerHTML = '📝';
    noteBtn.title = 'ویرایش یادداشت جلسه';

    // Logic: Hide if empty
    if (!session.note) {
        noteBtn.style.display = 'none';
    }

    noteBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        showSessionNoteModal(session, displaySessionNumber);
    });

    // --- 2. Define & Append End Session Button (Priority 1: Rightmost) ---
    if (!session.isFinished && !session.isCancelled) {
        const endSessionBtn = document.createElement('button');
        // Use btn-success for green background, text content instead of icon
        endSessionBtn.className = 'btn-success';
        endSessionBtn.textContent = 'پایان جلسه';

        // Inline styles to make it fit nicely in the list row
        endSessionBtn.style.fontSize = '12px';
        endSessionBtn.style.padding = '4px 10px';
        endSessionBtn.style.whiteSpace = 'nowrap';

        endSessionBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            showCustomConfirm(
                `جلسه شماره ${displaySessionNumber} خاتمه پیدا خواهد کرد!`,
                () => {
                    state.currentClassroom.endSpecificSession(session.sessionNumber);
                    state.saveData();

                    logManager.addLog(state.currentClassroom.info.name,
                        `جلسه ${displaySessionNumber} خاتمه یافت.`, { type: 'VIEW_SESSIONS' });

                    renderSessions();

                    showCustomConfirm(
                        "جلسه با موفقیت خاتمه یافت. آیا مایل به ایجاد فایل پشتیبان هستید؟",
                        () => {
                            if (state.isDemoMode) {
                                showNotification("⚠️ پشتیبان‌گیری در حالت نمایش (Demo) غیرفعال است.");
                                return;
                            }
                            initiateBackupProcess();
                            showNotification("✅فایل پشتیبان با موفقیت ایجاد شد.");
                        },
                        {
                            confirmText: 'بله',
                            cancelText: 'خیر',
                            confirmClass: 'btn-success'
                        }
                    );
                }
            );
        });
        // Append End Button FIRST so it sits on the RIGHT edge
        buttonsContainer.appendChild(endSessionBtn);
    }

    // --- 3. Append Note Button (Priority 2: Left of End Button) ---
    buttonsContainer.appendChild(noteBtn);

    return buttonsContainer;
}

function createSessionInfoContainer(session, displaySessionNumber) {
    const infoContainer = document.createElement('div');
    infoContainer.style.display = 'flex';
    infoContainer.style.flexDirection = 'column';
    infoContainer.style.alignItems = 'flex-start';
    infoContainer.style.flexGrow = '1';

    const sessionDate = new Date(session.startTime).toLocaleDateString('fa-IR');
    const sessionText = document.createElement('span');
    sessionText.className = 'session-list-title';

    const badgesContainer = document.createElement('div');
    badgesContainer.style.display = 'flex';
    badgesContainer.style.gap = '5px';
    badgesContainer.style.marginTop = '5px';

    // Days of the week badge
    const dayOfWeek = new Date(session.startTime).toLocaleDateString('fa-IR', { weekday: 'long' });
    const dayBadge = document.createElement('span');
    dayBadge.className = 'type-badge day-badge';
    dayBadge.textContent = dayOfWeek;
    badgesContainer.appendChild(dayBadge);

    if (session.isCancelled) {
        sessionText.textContent = `لغو شده - تاریخ: ${sessionDate}`;
        infoContainer.style.cursor = 'default';
        const cancelledBadge = document.createElement('span');
        cancelledBadge.className = 'type-badge cancelled-badge';
        cancelledBadge.textContent = 'لغو شده';
        badgesContainer.appendChild(cancelledBadge);
    } else {
        // Dynamically find the session's display number
        sessionText.textContent = `جلسه ${displaySessionNumber} - تاریخ: ${sessionDate}`;
        infoContainer.style.cursor = 'pointer';
        infoContainer.addEventListener('click', () => {
            state.setSelectedSession(session);
            renderSessionDashboard();
        });
    }
    // comment for test

    infoContainer.appendChild(sessionText);

    if (session.isFinished) {
        const finishedBadge = document.createElement('span');
        finishedBadge.className = 'type-badge finished-badge';
        finishedBadge.textContent = 'خاتمه یافته';
        badgesContainer.appendChild(finishedBadge);
    }
    if (session.isMakeup) {
        const makeupBadge = document.createElement('span');
        makeupBadge.className = 'type-badge makeup-badge';
        makeupBadge.textContent = 'جبرانی';
        badgesContainer.appendChild(makeupBadge);
    }
    infoContainer.appendChild(badgesContainer);

    return infoContainer;
}

function createSessionListItem(session, sessionDisplayNumberMap) {
    const li = document.createElement('li');

    const displaySessionNumber = sessionDisplayNumberMap.get(session.sessionNumber);

    const infoContainer = createSessionInfoContainer(session, displaySessionNumber);
    li.appendChild(infoContainer);

    const buttonsContainer = createSessionActionButtons(session, displaySessionNumber);
    li.appendChild(buttonsContainer);

    // --- Add the right-click context menu ---
    li.addEventListener('contextmenu', (event) => {
        const menuItems = [
            {
                label: 'یادداشت جلسه',
                icon: '📝',
                action: () => {
                    showSessionNoteModal(session, displaySessionNumber);
                }
            },

            {
                label: session.isCancelled ? 'بازگردانی جلسه' : 'لغو جلسه',
                icon: '❌',
                action: () => {
                    const actionText = session.isCancelled ? 'بازگردانی جلسه' : 'لغو جلسه';
                    const confirmMsg = session.isCancelled ?
                        `آیا از بازگردانی این جلسه مطمئن هستید؟` :
                        `آیا از لغو این جلسه مطمئن هستید؟ جلسه لغو شده در آمار تاثیری ندارد اما قابل بازگردانی است.`;
                    showCustomConfirm(confirmMsg, () => {
                        session.isCancelled = !session.isCancelled;

                        const logMessage = session.isCancelled
                            ? `جلسه ${displaySessionNumber} لغو شد.`
                            : `جلسه لغو شده (تاریخ: ${new Date(session.startTime).toLocaleDateString('fa-IR')}) بازگردانی شد.`;
                        logManager.addLog(state.currentClassroom.info.name, logMessage, { type: 'VIEW_SESSIONS' });

                        state.saveData();
                        renderSessions();
                        showNotification(session.isCancelled ? '✅جلسه لغو شد.' : '✅جلسه بازگردانی شد.');
                    }, { confirmText: actionText, confirmClass: 'btn-warning' });
                }
            },

            {
                label: 'تغییر وضعیت جبرانی',
                icon: '🔄',
                action: () => {
                    state.currentClassroom.markAsMakeup(session.sessionNumber);
                    state.saveData();

                    const logMessage = session.isMakeup
                        ? `جلسه ${displaySessionNumber} به عنوان جبرانی علامت‌گذاری شد.`
                        : `جلسه ${displaySessionNumber} از حالت جبرانی خارج شد.`;
                    logManager.addLog(state.currentClassroom.info.name, logMessage, { type: 'VIEW_SESSIONS' });

                    renderSessions();
                }
            },
            {
                label: 'حذف جلسه',
                icon: '🗑️',
                className: 'danger', // This will style the item in red
                action: () => {
                    const displayNumText = session.isCancelled ? 'لغو شده' : displaySessionNumber;
                    showCustomConfirm(
                        `آیا از انتقال جلسه ${displayNumText} به سطل زباله مطمئن هستید؟`,
                        () => {
                            const trashEntry = {
                                id: `trash_${Date.now()}_${Math.random()}`,
                                timestamp: new Date().toISOString(),
                                type: 'session',
                                description: `جلسه ${displayNumText} از کلاس «${state.currentClassroom.info.name}»`,
                                restoreData: { sessionNumber: session.sessionNumber, classId: state.currentClassroom.info.scheduleCode }
                            };

                            // NEW LOGIC
                            state.addToTrashBin(trashEntry);

                            session.isDeleted = true;
                            logManager.addLog(state.currentClassroom.info.name, `جلسه ${displayNumText} به سطل زباله منتقل شد.`, { type: 'VIEW_TRASH' });
                            state.saveData();
                            renderSessions();
                            showNotification(`✅ جلسه ${displayNumText} به سطل زباله منتقل شد.`);
                        },
                        { confirmText: 'بله', confirmClass: 'btn-warning', isDelete: true }
                    );
                }
            },

            // [!code ++] New "Change Date" Item
            {
                label: 'تغییر تاریخ',
                icon: '📅',
                action: () => {
                    const daySelect = document.getElementById('dp-day');
                    const monthSelect = document.getElementById('dp-month');
                    const yearSelect = document.getElementById('dp-year');

                    // 1. Convert Current Gregorian Date to Jalaali
                    const jDate = toJalaali(session.startTime);

                    // 2. Populate Dropdowns (Dynamically)
                    // -- Days (1-31)
                    daySelect.innerHTML = '';
                    for (let i = 1; i <= 31; i++) {
                        const option = document.createElement('option');
                        option.value = i;
                        option.textContent = i.toLocaleString('fa-IR');
                        if (i === jDate.jd) option.selected = true;
                        daySelect.appendChild(option);
                    }

                    // -- Months (Names)
                    const persianMonths = [
                        'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
                        'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
                    ];
                    monthSelect.innerHTML = '';
                    persianMonths.forEach((name, index) => {
                        const option = document.createElement('option');
                        option.value = index + 1; // 1-based
                        option.textContent = name;
                        if (index + 1 === jDate.jm) option.selected = true;
                        monthSelect.appendChild(option);
                    });

                    // -- Years (Current +/- 5 years)
                    yearSelect.innerHTML = '';
                    const currentYear = jDate.jy;
                    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
                        const option = document.createElement('option');
                        option.value = i;
                        option.textContent = i.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]); // Farsi digits
                        if (i === jDate.jy) option.selected = true;
                        yearSelect.appendChild(option);
                    }

                    // 3. Define Callback (Receives Jalaali Object from Main.js)
                    state.setDatePickerCallback((dateObj) => {
                        if (!dateObj) return;

                        // Convert Jalaali -> Gregorian
                        const gDate = toGregorian(parseInt(dateObj.jy), parseInt(dateObj.jm), parseInt(dateObj.jd));

                        // Create JS Date (Note: JS Month is 0-indexed)
                        const updatedDate = new Date(gDate.gy, gDate.gm - 1, gDate.gd);

                        // MERGE TIME: Keep original hours/minutes
                        updatedDate.setHours(session.startTime.getHours());
                        updatedDate.setMinutes(session.startTime.getMinutes());
                        updatedDate.setSeconds(session.startTime.getSeconds());

                        // Log & Save
                        const oldDateStr = session.startTime.toLocaleDateString('fa-IR');
                        session.startTime = updatedDate;
                        const newDateStr = session.startTime.toLocaleDateString('fa-IR');

                        logManager.addLog(state.currentClassroom.info.name,
                            `تاریخ جلسه ${displaySessionNumber} از ${oldDateStr} به ${newDateStr} تغییر یافت.`,
                            { type: 'VIEW_SESSIONS' }
                        );

                        state.saveData();
                        renderSessions();
                        showNotification(`✅ تاریخ جلسه به ${newDateStr} تغییر یافت.`);
                    });

                    openModal('date-picker-modal');
                }
            }
        ];

        openContextMenu(event, menuItems);
    });

    return li;
}

export function renderSessions() {
    const sessionListUl = document.getElementById('session-list');

    if (!state.currentClassroom) return;

    sessionListUl.innerHTML = '';

    if (state.currentClassroom.sessions.length === 0) {
        sessionListUl.innerHTML = '<li>هنوز جلسه‌ای شروع نشده است.</li>';
        return;
    }

    const sessionDisplayNumberMap = getSessionDisplayMap(state.currentClassroom);
    const reversedSessions = [...getActiveItems(state.currentClassroom.sessions)].reverse();

    reversedSessions.forEach(session => {
        // Pass the map instead of the activeSessions array
        const li = createSessionListItem(session, sessionDisplayNumberMap);
        sessionListUl.appendChild(li);
    });
}




export function renderSearchResults(filteredStudents) {
    studentSearchResultsDiv.innerHTML = '';

    if (filteredStudents.length > 0) {
        filteredStudents.forEach(student => {
            const studentDiv = document.createElement('div');
            studentDiv.textContent = student.identity.name;
            studentDiv.addEventListener('click', () => {
                showStudentProfile(student);
                studentSearchResultsDiv.style.display = 'none';
                studentSearchInput.value = '';
            });
            studentSearchResultsDiv.appendChild(studentDiv);
        });
        studentSearchResultsDiv.style.display = 'block';
    } else {
        // This new logic checks if the search was intentional before showing "Not found"
        if (studentSearchInput.value.trim() !== '') {
            const noResultsDiv = document.createElement('div');
            noResultsDiv.className = 'no-results';
            noResultsDiv.textContent = 'پیدا نشد';
            studentSearchResultsDiv.appendChild(noResultsDiv);
            studentSearchResultsDiv.style.display = 'block';
        } else {
            // If the input that led to empty results was also empty, just hide the dropdown.
            studentSearchResultsDiv.style.display = 'none';
        }
    }
}

export function renderGlobalSearchResults(results) {
    globalStudentSearchResultsDiv.innerHTML = '';

    if (results.length > 0) {
        results.forEach(result => {
            const resultDiv = document.createElement('div');
            resultDiv.className = 'global-search-result';

            if (result.type === 'student') {
                // --- This is the logic for rendering a STUDENT ---
                const studentNameSpan = document.createElement('span');
                studentNameSpan.className = 'student-name';
                studentNameSpan.textContent = result.student.identity.name;

                const classNameSpan = document.createElement('span');
                classNameSpan.className = 'class-name';
                classNameSpan.textContent = `کلاس: ${result.classroom.info.name}`;

                // 1. The main container navigates to the student profile.
                resultDiv.addEventListener('click', () => {
                    state.setCurrentClassroom(result.classroom);
                    showStudentProfile(result.student);
                    globalStudentSearchResultsDiv.style.display = 'none';
                    globalStudentSearchInput.value = '';
                });

                // 2. The class name is a separate action that stops the parent click.
                classNameSpan.addEventListener('click', (event) => {
                    event.stopPropagation();
                    state.setCurrentClassroom(result.classroom);
                    state.setSelectedSession(null);
                    state.setLiveSession(result.classroom.liveSession);
                    renderSessions();
                    showPage('session-page');
                    globalStudentSearchResultsDiv.style.display = 'none';
                    globalStudentSearchInput.value = '';
                });

                resultDiv.appendChild(studentNameSpan);
                resultDiv.appendChild(classNameSpan);

            } else if (result.type === 'classroom') {
                // --- This is the NEW logic for rendering a CLASSROOM ---
                const classNameSpan = document.createElement('span');
                classNameSpan.className = 'student-name'; // Use same style as student name for prominence
                classNameSpan.textContent = `[کلاس] ${result.classroom.info.name}`;

                // The whole item just navigates to the session page
                resultDiv.addEventListener('click', () => {
                    state.setCurrentClassroom(result.classroom);
                    state.setSelectedSession(null);
                    state.setLiveSession(result.classroom.liveSession);
                    renderSessions();
                    showPage('session-page');
                    globalStudentSearchResultsDiv.style.display = 'none';
                    globalStudentSearchInput.value = '';
                });

                resultDiv.appendChild(classNameSpan);
            }

            globalStudentSearchResultsDiv.appendChild(resultDiv);
        });
        globalStudentSearchResultsDiv.style.display = 'block';
    } else {
        if (globalStudentSearchInput.value.trim() !== '') {
            const noResultsDiv = document.createElement('div');
            noResultsDiv.className = 'no-results';
            noResultsDiv.textContent = 'پیدا نشد';
            globalStudentSearchResultsDiv.appendChild(noResultsDiv);
            globalStudentSearchResultsDiv.style.display = 'block';
        } else {
            globalStudentSearchResultsDiv.style.display = 'none';
        }
    }
}


export function renderTrashPage() {
    const trashedItemsList = document.getElementById('trashed-items-list');
    trashedItemsList.innerHTML = '';

    if (state.trashBin.length === 0) {
        trashedItemsList.innerHTML = '<li style="text-align: center; padding: 20px;">سطل زباله خالی است.</li>';
        return;
    }

    state.trashBin.forEach((entry, index) => {
        const li = document.createElement('li');

        const descriptionSpan = document.createElement('span');
        descriptionSpan.textContent = entry.description;
        descriptionSpan.style.flexGrow = "1";

        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'list-item-buttons';

        // Restore Button
        const restoreBtn = document.createElement('button');
        restoreBtn.className = 'btn-icon';
        restoreBtn.innerHTML = '🔄';
        restoreBtn.title = 'بازیابی';
        restoreBtn.addEventListener('click', () => {
            let success = false;
            let errorMessage = null; // For custom error messages

            const r = entry.restoreData; // Shortcut for restoreData

            switch (entry.type) {
                case 'classroom': {
                    const classroom = state.classrooms[r.name];
                    // Conflict check: An active class with the same name already exists.
                    if (classroom && !classroom.isDeleted) {
                        errorMessage = `کلاسی با نام «${r.name}» از قبل فعال است.`;
                    } else if (classroom && classroom.isDeleted) {
                        classroom.isDeleted = false;
                        success = true;
                    }
                    break;
                }
                case 'student': {
                    const classroom = Object.values(state.classrooms).find(c => c.info.scheduleCode === r.classId);
                    const student = classroom?.students.find(s => s.identity.studentId === r.studentId);
                    if (student) {
                        student.isDeleted = false;
                        success = true;
                    }
                    break;
                }
                case 'session': {
                    const classroom = Object.values(state.classrooms).find(c => c.info.scheduleCode === r.classId);
                    const session = classroom?.sessions.find(s => s.sessionNumber === r.sessionNumber);
                    if (session) {
                        session.isDeleted = false;
                        success = true;
                    }
                    break;
                }
                case 'category': {
                    const classroom = Object.values(state.classrooms).find(c => c.info.scheduleCode === r.classId);
                    const category = classroom?.categories.find(c => c.id === r.categoryId);
                    if (category) {
                        category.isDeleted = false;
                        success = true;
                    }
                    break;
                }
                case 'score': {
                    const classroom = Object.values(state.classrooms).find(c => c.info.scheduleCode === r.classId);
                    const student = classroom?.students.find(s => s.identity.studentId === r.studentId);
                    const score = student?.logs.scores[r.skill.toLowerCase()]?.find(sc => sc.id === r.scoreId);
                    if (score) {
                        score.isDeleted = false;
                        success = true;
                    }
                    break;
                }
                case 'note': {
                    const classroom = Object.values(state.classrooms).find(c => c.info.scheduleCode === r.classId);
                    const student = classroom?.students.find(s => s.identity.studentId === r.studentId);
                    const note = student?.profile.notes.find(n => n.id === r.noteId);
                    if (note) {
                        note.isDeleted = false;
                        success = true;
                    }
                    break;
                }
            }

            if (success) {
                state.trashBin.splice(index, 1);
                state.saveData();
                renderTrashPage();
                if (entry.type === 'classroom') {
                    renderClassList(); // Update the class list if a class was restored
                }
                showNotification('✅ آیتم با موفقیت بازیابی شد.');
            } else {
                if (errorMessage) {
                    showNotification(`⚠️ ${errorMessage}`);
                } else {
                    showNotification('⚠️ آیتم اصلی برای بازیابی یافت نشد.');
                }
            }
        });

        // Permanent Delete Button
        const permanentDeleteBtn = document.createElement('button');
        permanentDeleteBtn.className = 'btn-icon';
        permanentDeleteBtn.innerHTML = '🔥';
        permanentDeleteBtn.title = 'حذف دائمی';
        permanentDeleteBtn.addEventListener('click', () => {
            showCustomConfirm(
                `آیا از حذف دائمی این آیتم مطمئن هستید؟ این عمل غیرقابل بازgشت است.`,
                () => {
                    const r = entry.restoreData;

                    // Helper function to find the classroom by its unique scheduleCode (classId)
                    const findClass = (classId) => Object.values(state.classrooms).find(c => c.info.scheduleCode === classId);

                    let classroom; // Declare classroom variable here

                    switch (entry.type) {
                        case 'classroom':
                            delete state.classrooms[r.name];
                            break;
                        case 'student':
                            classroom = findClass(r.classId);
                            permanentlyDeleteStudent({ identity: { studentId: r.studentId } }, classroom);
                            break;
                        case 'session':
                            classroom = findClass(r.classId);
                            if (classroom) {
                                permanentlyDeleteSession(classroom.info.name, r.sessionNumber);
                            }
                            break;
                        case 'category':
                            classroom = findClass(r.classId);
                            if (classroom) {
                                permanentlyDeleteCategory(classroom.info.name, r.categoryId);
                            }
                            break;
                        case 'score':
                            classroom = findClass(r.classId);
                            if (classroom) {
                                permanentlyDeleteScore(classroom.info.name, r.studentId, r.skill, r.scoreId);
                            }
                            break;
                        case 'note':
                            classroom = findClass(r.classId);
                            if (classroom) {
                                permanentlyDeleteNote(classroom.info.name, r.studentId, r.noteId);
                            }
                            break;
                    }

                    state.trashBin.splice(index, 1);
                    state.saveData();
                    renderTrashPage();
                    showNotification('✅ آیتم برای همیشه حذف شد.');
                },
                { confirmText: 'حذف دائمی', confirmClass: 'btn-warning' }
            );
        });

        buttonsContainer.appendChild(restoreBtn);
        buttonsContainer.appendChild(permanentDeleteBtn);
        li.appendChild(descriptionSpan);
        li.appendChild(buttonsContainer);
        trashedItemsList.appendChild(li);
    });
}

function createAbsenteesSummaryBox() {
    const summaryContainer = document.getElementById('absentees-summary-container');
    if (!summaryContainer) return;

    summaryContainer.innerHTML = `
        <div id="absentees-summary-box" class="absentees-summary">
            <div class="absentees-summary-header">
                <h4>لیست غایبین جلسه شماره <span id="absentee-summary-session-number"></span></h4>
                <button id="copy-absentees-btn" class="btn-icon" title="کپی لیست غایبین">📋</button>
            </div>
            <div id="absentees-summary-list" class="summary-list"></div>
        </div>
    `;
}

function renderAbsenteesSummary() {
    // --- NEW: Get references to elements just-in-time ---
    const summaryBox = document.getElementById('absentees-summary-box');
    const summaryList = document.getElementById('absentees-summary-list');
    const sessionNumberSpan = document.getElementById('absentee-summary-session-number');

    // --- NEW: Defensive check to ensure all elements exist before proceeding ---
    if (!summaryBox || !summaryList || !sessionNumberSpan) {
        console.error('Could not find all absentee summary elements.');
        return;
    }

    // 1. Make sure we are in a valid session
    if (!state.currentClassroom || !state.selectedSession) {
        summaryBox.classList.remove('visible');
        return;
    }

    // 2. Get a list of all students marked as absent
    const absentStudents = getActiveItems(state.currentClassroom.students).filter(student => {
        const record = state.selectedSession.studentRecords[student.identity.studentId];
        return record && record.attendance === 'absent';
    });

    // 3. Update the session number in the title
    const sessionDisplayNumberMap = getSessionDisplayMap(state.currentClassroom);
    sessionNumberSpan.textContent = sessionDisplayNumberMap.get(state.selectedSession.sessionNumber);

    // 4. Show or hide the box based on whether there are any absentees
    if (absentStudents.length > 0) {
        summaryBox.classList.add('visible');
    } else {
        summaryBox.classList.remove('visible');
    }

    // 5. Clear the old list and build the new one
    summaryList.innerHTML = '';
    absentStudents.forEach(student => {
        const calculateTotalAbsences = (s) => {
            return state.currentClassroom.sessions.reduce((count, session) => {
                if (session.isDeleted || session.isCancelled) return count;
                const record = session.studentRecords[s.identity.studentId];
                return count + (record && record.attendance === 'absent' ? 1 : 0);
            }, 0);
        };
        const totalAbsences = calculateTotalAbsences(student);

        const nameTag = document.createElement('span');
        nameTag.className = 'summary-name';
        nameTag.textContent = `${student.identity.name} (غیبت: ${totalAbsences})`;

        nameTag.addEventListener('click', () => {
            nameTag.classList.add('fading-out');
            setTimeout(() => {
                state.selectedSession.setAttendance(student.identity.studentId, 'present');
                state.saveData();
                renderAttendancePage();
            }, 200);
        });
        summaryList.appendChild(nameTag);
    });
}

function setupAbsenteesCopyButton() {

    // 1. Get a fresh reference to the button just in time.
    const copyBtn = document.getElementById('copy-absentees-btn');

    // 2. Add a defensive check to ensure the button exists before proceeding.
    if (!copyBtn) {
        console.error('Could not find the copy absentees button to attach listener.');
        return;
    }

    copyBtn.addEventListener('click', () => {
        if (!state.currentClassroom || !state.selectedSession) return;

        // Get the list of absent students
        const absentStudents = getActiveItems(state.currentClassroom.students).filter(student => {
            const record = state.selectedSession.studentRecords[student.identity.studentId];
            return record && record.attendance === 'absent';
        });

        if (absentStudents.length === 0) {
            showNotification('⚠️لیست غایبین خالی است.');
            return;
        }

        // Helper to calculate total absences for the text format
        const calculateTotalAbsences = (s) => {
            return state.currentClassroom.sessions.reduce((count, session) => {
                if (session.isDeleted || session.isCancelled) return count;
                const record = session.studentRecords[s.identity.studentId];
                return count + (record && record.attendance === 'absent' ? 1 : 0);
            }, 0);
        };

        // Build the formatted string for the clipboard
        let textToCopy = `لیست غایبین جلسه شماره ${getRealSessionNumber()}:\n\n`;
        absentStudents.forEach(student => {
            const totalAbsences = calculateTotalAbsences(student);
            textToCopy += `- ${student.identity.name} (تعداد غیبت‌ها: ${totalAbsences})\n`;
        });

        // Use the modern Clipboard API to copy the text
        navigator.clipboard.writeText(textToCopy).then(() => {
            showNotification('✅لیست غایبین با موفقیت کپی شد.');
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            showNotification('❌خطا در کپی کردن لیست.');
        });
    });
}

//for demo mode appearance of banner
export function updateDemoModeBanner() {
    const banner = document.getElementById('demo-mode-banner');
    if (!banner) return;

    if (state.isDemoMode) {
        banner.classList.add('visible');
        document.body.classList.add('demo-mode-active');
    } else {
        banner.classList.remove('visible');
        document.body.classList.remove('demo-mode-active');
    }
}

function getClassScheduleStatus(classroom) {
    const { scheduleDays, scheduleStartTime, scheduleEndTime } = classroom.info;
    const hasDays = scheduleDays && scheduleDays.length > 0;
    const hasTime = scheduleStartTime && scheduleEndTime;

    // Priority 4: Unscheduled (No data at all)
    if (!hasDays && !hasTime) return { type: 'unscheduled', sortIndex: 3 };

    // Priority 3: Incomplete (Missing days OR time)
    if (!hasDays || !hasTime) return { type: 'incomplete', sortIndex: 2 };

    // Priority 1 & 2: Scheduled
    const now = new Date();
    const currentDay = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Minutes since midnight

    const [startH, startM] = scheduleStartTime.split(':').map(Number);
    const [endH, endM] = scheduleEndTime.split(':').map(Number);
    const startTimeVal = startH * 60 + startM;
    const endTimeVal = endH * 60 + endM;

    // Check if Active NOW
    // Logic: Is today a class day? AND Is current time between start and end?
    if (scheduleDays.includes(currentDay)) {
        if (currentTime >= startTimeVal && currentTime < endTimeVal) {
            return { type: 'active', sortIndex: 0 };
        }
    }

    // Calculate Next Occurrence for "Upcoming" sorting
    // We look ahead up to 7 days to find the next class
    for (let i = 0; i <= 7; i++) {
        const checkDay = (currentDay + i) % 7;

        if (scheduleDays.includes(checkDay)) {
            // If it's today (i=0), we only care if the class hasn't started yet
            if (i === 0 && currentTime >= startTimeVal) continue;

            // Found the next class slot
            const targetDate = new Date(now);
            targetDate.setDate(now.getDate() + i);
            targetDate.setHours(startH, startM, 0, 0);
            return { type: 'upcoming', sortIndex: 1, nextTimestamp: targetDate.getTime() };
        }
    }

    // Fallback (Should rarely happen if hasDays is true)
    return { type: 'upcoming', sortIndex: 1, nextTimestamp: 9999999999999 };
}

function findScheduleConflict(currentClass, allClasses) {
    const { scheduleDays, scheduleStartTime, scheduleEndTime } = currentClass.info;

    // Safety check: If current class is incomplete, we don't check for conflicts
    if (!scheduleDays || !scheduleDays.length || !scheduleStartTime || !scheduleEndTime) return null;

    const [currentStartH, currentStartM] = scheduleStartTime.split(':').map(Number);
    const [currentEndH, currentEndM] = scheduleEndTime.split(':').map(Number);
    const currentStartVal = currentStartH * 60 + currentStartM;
    const currentEndVal = currentEndH * 60 + currentEndM;

    for (const otherClass of Object.values(allClasses)) {
        // Skip self, deleted classes, or same name
        if (otherClass === currentClass || otherClass.isDeleted || otherClass.info.name === currentClass.info.name) continue;

        const otherInfo = otherClass.info;
        // Skip incomplete other classes
        if (!otherInfo.scheduleDays || !otherInfo.scheduleDays.length || !otherInfo.scheduleStartTime || !otherInfo.scheduleEndTime) continue;

        // Check for Day Overlap
        const daysOverlap = scheduleDays.some(day => otherInfo.scheduleDays.includes(day));
        if (!daysOverlap) continue;

        // Check for Time Overlap
        const [otherStartH, otherStartM] = otherInfo.scheduleStartTime.split(':').map(Number);
        const [otherEndH, otherEndM] = otherInfo.scheduleEndTime.split(':').map(Number);
        const otherStartVal = otherStartH * 60 + otherStartM;
        const otherEndVal = otherEndH * 60 + otherEndM;

        // Overlap Logic: (StartA < EndB) and (EndA > StartB)
        if (currentStartVal < otherEndVal && currentEndVal > otherStartVal) {
            return otherClass.info.name; // Return the name of the first conflicting class
        }
    }

    return null; // No conflicts found
}

function formatClassDays(dayIndices) {
    if (!dayIndices || dayIndices.length === 0) return '';

    const dayMap = {
        6: 'شنبه',
        0: '۱شنبه',
        1: '۲شنبه',
        2: '۳شنبه',
        3: '۴شنبه',
        4: '۵شنبه',
        5: 'جمعه'
    };

    // Sort days based on Persian week: Sat(6) is first, then Sun(0), etc.
    const sortedIndices = [...dayIndices].sort((a, b) => {
        const persianOrder = { 6: 0, 0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6 };
        return persianOrder[a] - persianOrder[b];
    });

    return sortedIndices.map(i => dayMap[i]).join('، ');
}

// --- Restore Points Logic ---

export async function renderRestorePointsPage() {
    const list = document.getElementById('restore-points-list');
    list.innerHTML = '<li style="text-align:center; padding:20px;">در حال بارگذاری...</li>';

    try {
        const snapshots = await getBackupSnapshots();

        if (snapshots.length === 0) {
            list.innerHTML = '<li style="text-align:center; padding:20px;">هیچ فایل پشتیبانی یافت نشد.</li>';
            return;
        }

        list.innerHTML = ''; // Clear loading message

        snapshots.forEach(record => {
            const li = document.createElement('li');
            li.className = 'restore-point-card';

            // 1. Format Date & Size (Now with Weekday)
            const date = new Date(record.timestamp).toLocaleString('fa-IR', {
                weekday: 'long', // Adds "شنبه", "یکشنبه", etc.
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            const sizeKB = (record.file.size / 1024).toFixed(1) + ' KB';

            // 2. Build HTML Structure
            li.innerHTML = `
                <div class="restore-card-header">
                    <span class="restore-date">${date}</span>
                    <span class="restore-size">${sizeKB}</span>
                </div>
                <div class="restore-desc">${record.metadata.description || 'بدون توضیحات'}</div>
                <div class="restore-actions">
                    <button class="btn-restore-action">بازگردانی</button>
                </div>
            `;

            // 3. Add Restore Logic
            const restoreBtn = li.querySelector('.btn-restore-action');
            restoreBtn.addEventListener('click', async () => {
                try {
                    // 1. Read the text content from the file blob
                    // content will be the Base64 string like "UEsDB..."
                    const base64Content = await record.file.text();

                    //2. Load the Zip from that Base64 string
                    const zip = new JSZip();
                    const unzipped = await zip.loadAsync(base64Content, { base64: true });

                    const backupFile = unzipped.file("backup.json");

                    if (!backupFile) throw new Error("فایل backup.json یافت نشد.");

                    const jsonString = await backupFile.async("string");
                    const plainData = JSON.parse(jsonString);

                    // B. Trigger the existing Restore Modal
                    showRestoreConfirmModal(plainData);

                } catch (err) {
                    console.error("Restore failed:", err);
                    showNotification("❌ فایل پشتیبان معتبر نیست.");
                }
            });

            list.appendChild(li);
        });

    } catch (err) {
        console.error("Failed to load snapshots:", err);
        list.innerHTML = '<li style="text-align:center; color:red;">خطا در بارگذاری اطلاعات.</li>';
    }
}

function generatePrintableReport(classroom, selectedColumns, sortMode = 'default', needsWarningFootnote = false) {
    // 1. Prepare Data
    let students = [...state.getActiveItems(classroom.students)];
    const dateStr = new Date().toLocaleDateString('fa-IR', {
        year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
    });

    // 2. Apply Sorting using sorting helper in utils.js
    if (sortMode === 'alpha') {
        students = sortStudents(students);
    }

    // 3. Build Table Headers
    let theadHtml = '<tr>';
    selectedColumns.forEach(col => {
        theadHtml += `<th>${col.label}</th>`;
    });
    theadHtml += '</tr>';

    // 4. Build Table Rows
    let tbodyHtml = '';
    students.forEach((student, index) => {
        tbodyHtml += '<tr>';
        selectedColumns.forEach(col => {
            let cellValue = '-';

            if (col.id === 'row_num') cellValue = index + 1;
            else if (col.id === 'name') {
                if (student.identity.firstName && student.identity.lastName) {
                    cellValue = `${student.identity.lastName}، ${student.identity.firstName}`;
                } else {
                    cellValue = student.identity.name;
                }
            }
            else if (col.id === 'total_selections') cellValue = student.statusCounters.totalSelections;
            else if (col.id === 'absences') {
                cellValue = classroom.sessions.reduce((acc, sess) => {
                    if (sess.isDeleted || sess.isCancelled) return acc;
                    const rec = sess.studentRecords[student.identity.studentId];
                    return acc + (rec && rec.attendance === 'absent' ? 1 : 0);
                }, 0);
            }
            else if (col.id === 'exit_count') cellValue = student.statusCounters.outOfClassCount || 0;
            else if (col.id === 'missed_chances') cellValue = student.statusCounters.missedChances;
            else if (col.id === 'issues') cellValue = Object.values(student.categoryIssues || {}).reduce((a, b) => a + b, 0);
            else if (col.id === 'avg_score') cellValue = student.getOverallAverageScore() || '-';
            else if (col.id === 'final_score') cellValue = classroom.calculateFinalStudentScore(student) || '-';
            else if (col.type === 'category') {
                cellValue = student.categoryCounts[col.id] || 0;
            }
            else if (col.type === 'category_scores') {
                const skillKey = col.id.toLowerCase();
                const scores = student.logs.scores[skillKey]?.filter(s => !s.isDeleted) || [];
                cellValue = scores.length > 0 ? scores.map(s => s.value).join('، ') : '-';
            }

            // Logic: Names are Right-aligned + Nowrap
            // Scores & Numbers are Center-aligned + Nowrap (for lists)
            let styleCss = 'text-align: center;'; // Default for counts, averages, rows

            if (col.id === 'name') {
                styleCss = 'text-align: right; white-space: nowrap;';
            } else if (col.type === 'category_scores') {
                styleCss = 'text-align: center; white-space: nowrap;';
            }

            const cellStyle = `style="${styleCss}"`;

            tbodyHtml += `<td ${cellStyle}>${cellValue}</td>`;
        });

        tbodyHtml += '</tr>';
    });

    // 5. Prepare Warning Footnote
    let footnoteHtml = '';
    if (needsWarningFootnote) {
        footnoteHtml = `
            <div class="warning-footnote">
                ⚠️ <strong>توجه:</strong> ترتیب الفبایی این لیست ممکن است دقیق نباشد. (نام خانوادگی برخی دانش‌آموزان در سیستم تفکیک نشده است)
            </div>
        `;
    }

    // --- Capture App Stylesheets ---
    // This grabs all <link rel="stylesheet"> tags from your main app to inject into the print window
    const appStyles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
        .map(link => link.outerHTML)
        .join('');

    // 6. Create Print Window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        showNotification('⚠️ مرورگر شما پنجره جدید را مسدود کرد. لطفاً اجازه دهید.', 'error');
        return;
    }

    const htmlContent = `
        <!DOCTYPE html>
        <html lang="fa" dir="rtl">
        <head>
            <title>گزارش کلاس ${classroom.info.name}</title>
            ${appStyles} <style>
                @media print {
                    @page { size: A4; margin: 10mm; }
                    /* Updated Font Family */
                    body { font-family: 'Vazirmatn', 'Vazir', Tahoma, sans-serif; color: #000; }
                }
                /* Updated Font Family */
                body { font-family: 'Vazirmatn', 'Vazir', Tahoma, sans-serif; padding: 20px; direction: rtl; }
                h1 { text-align: center; margin-bottom: 5px; font-size: 24px; }
                .meta { text-align: center; margin-bottom: 30px; font-size: 14px; color: #444; }
                table { width: 100%; border-collapse: collapse; font-size: 12px; }
                th, td { border: 1px solid #333; padding: 6px 8px; text-align: center; }
                th { background-color: #eee; font-weight: bold; }
                tr:nth-child(even) { background-color: #f9f9f9; }
                .signature { margin-top: 50px; display: flex; justify-content: space-between; padding: 0 50px; }
                
                .warning-footnote {
                    margin-top: 20px;
                    font-size: 11px;
                    color: #555;
                    font-style: italic;
                    border-top: 1px solid #ccc;
                    padding-top: 10px;
                }
            </style>
        </head>
        <body>
            <h1>گزارش وضعیت کلاس ${classroom.info.name}</h1>
            <div class="meta">
                تاریخ گزارش: ${dateStr} | تعداد دانش‌آموزان: ${students.length}
            </div>
            <table>
                <thead>${theadHtml}</thead>
                <tbody>${tbodyHtml}</tbody>
            </table>
            ${footnoteHtml}
            <div class="signature">
                <div>امضای معلم</div>
                <div>مهر و امضای مدرسه</div>
            </div>
            <script>
                window.onload = function() { window.print(); }
            <\/script>
        </body>
        </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
}

function showReportConfigModal(classroom) {
    const container = reportColumnsContainer;
    container.innerHTML = ''; // Clear previous columns

    // 1. Calculate Unstructured Students (Missing lastName)
    const activeStudents = state.getActiveItems(classroom.students);
    const unstructuredCount = activeStudents.filter(s => !s.identity.lastName).length;

    // 2. Define Available Columns
    const standardColumns = [
        { id: 'row_num', label: 'ردیف', checked: true },
        { id: 'name', label: 'نام دانش‌آموز', checked: true },
        { id: 'total_selections', label: 'کل انتخاب‌ها', checked: true },
        { id: 'absences', label: 'تعداد غیبت', checked: true },
        { id: 'exit_count', label: 'تعداد خروج', checked: false },
        { id: 'missed_chances', label: 'فرصت سوخته', checked: false },
        { id: 'issues', label: 'مشکل‌پاسخگویی', checked: false },
        { id: 'avg_score', label: 'میانگین نمرات', checked: true },
        { id: 'final_score', label: 'نمره نهایی (کانون)', checked: true },
    ];

    // Add Dynamic Categories
    classroom.categories.forEach(cat => {
        if (!cat.isDeleted) {
            // 1. The Count Column (Standard)
            standardColumns.push({
                id: cat.name,
                label: `تعداد ${cat.name}`,
                type: 'category',
                checked: false
            });

            // 2. The Scores Column (Only if graded)
            if (cat.isGradedCategory) {
                standardColumns.push({
                    id: cat.name,
                    label: `نمرات ${cat.name}`,
                    type: 'category_scores',
                    checked: false
                });
            }
        }
    });

    // 3. Render Column Checkboxes
    standardColumns.forEach(col => {
        const wrapper = document.createElement('label');
        wrapper.className = 'report-column-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = col.checked;
        checkbox.dataset.colId = col.id;
        checkbox.dataset.colLabel = col.label;
        if (col.type) checkbox.dataset.colType = col.type;

        const text = document.createElement('span');
        text.textContent = col.label;

        wrapper.appendChild(checkbox);
        wrapper.appendChild(text);
        container.appendChild(wrapper);
    });

    // 4. Inject Sorting Options (Dynamic UI Injection) - IMPROVED UI
    const modalContent = container.parentElement;
    const existingSort = modalContent.querySelector('#report-sort-options');
    if (existingSort) existingSort.remove(); // Cleanup previous instance

    const sortContainer = document.createElement('div');
    sortContainer.id = 'report-sort-options';
    // Better container styling matching the app's clean look
    sortContainer.style.marginTop = '20px';
    sortContainer.style.padding = '15px';
    sortContainer.style.backgroundColor = '#f8f9fa';
    sortContainer.style.borderRadius = '5px';
    sortContainer.style.border = '1px solid #e9ecef';

    sortContainer.innerHTML = `
        <div style="margin-bottom: 10px; font-weight: bold; color: #333;">ترتیب نمایش لیست:</div>
        
        <div style="display: flex; flex-direction: column; gap: 10px;">
            <label style="cursor: pointer; display: flex; align-items: center; gap: 8px;">
                <input type="radio" name="report-sort" value="alpha" checked style="accent-color: var(--color-primary);">
                <span>بر اساس نام خانوادگی</span>
            </label>

            <label style="cursor: pointer; display: flex; align-items: center; gap: 8px;">
                <input type="radio" name="report-sort" value="default" style="accent-color: var(--color-primary);">
                <span>بر اساس زمان ورود به کلاس</span>
            </label>
        </div>

        <div id="sort-warning" style="
            display: none; 
            margin-top: 12px; 
            background-color: #fff3cd; 
            color: #856404; 
            padding: 10px; 
            border-radius: 4px; 
            font-size: 13px; 
            border: 1px solid #ffeeba;
            line-height: 1.5;
        ">
            ⚠️ <strong>توجه:</strong> نام خانوادگی ${unstructuredCount} دانش‌آموز هنوز تفکیک نشده است. مرتب‌سازی این موارد ممکن است کاملاً دقیق نباشد.
        </div>
    `;

    // Insert before the buttons
    const actionsDiv = modalContent.querySelector('.modal-actions');
    modalContent.insertBefore(sortContainer, actionsDiv);

    // Toggle Warning Logic
    const radios = sortContainer.querySelectorAll('input[name="report-sort"]');
    const warningBox = sortContainer.querySelector('#sort-warning');

    const updateWarning = () => {
        const isAlpha = sortContainer.querySelector('input[value="alpha"]').checked;
        warningBox.style.display = (isAlpha && unstructuredCount > 0) ? 'block' : 'none';
    };

    radios.forEach(r => r.addEventListener('change', updateWarning));

    updateWarning();

    // 5. Button Handlers
    reportPrintBtn.onclick = () => {
        const selected = [];
        const checkboxes = container.querySelectorAll('input[type="checkbox"]:checked');
        checkboxes.forEach(cb => {
            selected.push({
                id: cb.dataset.colId,
                label: cb.dataset.colLabel,
                type: cb.dataset.colType
            });
        });

        if (selected.length === 0) {
            showNotification('⚠️ لطفاً حداقل یک ستون را انتخاب کنید.');
            return;
        }

        // Capture Sort Preferences
        const sortMode = sortContainer.querySelector('input[name="report-sort"]:checked').value;
        const needsWarningFootnote = (sortMode === 'alpha' && unstructuredCount > 0);

        closeActiveModal();
        // Pass the new arguments to the generator
        generatePrintableReport(classroom, selected, sortMode, needsWarningFootnote);
    };

    reportCancelBtn.onclick = () => {
        closeActiveModal();
    };

    // 6. Open Modal
    openModal('report-config-modal');
}

function createQualitativeButtons(student, categoryName) {
    const container = document.createElement('div');
    container.className = 'qualitative-button-container';

    // 1. Determine Context: Are we in History Mode or Manual Mode?
    const historyIndex = state.winnerHistoryIndex;
    const isHistoryMode = historyIndex !== -1 && state.selectedSession.winnerHistory[historyIndex];

    // We prioritize the History Entry if available. 
    // If Manual selection (index -1), we fall back to the session record (or just null if you prefer).
    const historyEntry = isHistoryMode ? state.selectedSession.winnerHistory[historyIndex] : null;
    const sessionRecord = state.selectedSession.studentRecords[student.identity.studentId];

    // Initialize stats containers if missing
    if (!student.qualitativeStats) student.qualitativeStats = {};
    if (!student.qualitativeStats[categoryName]) {
        student.qualitativeStats[categoryName] = { effort: 0, good: 0, excellent: 0 };
    }
    if (!sessionRecord.performanceRatings) sessionRecord.performanceRatings = {};

    // 2. Determine "Current Rating" Source
    // If in history mode, the truth is in the history entry. Otherwise, check session record.
    const currentRating = isHistoryMode ? historyEntry.rating : sessionRecord.performanceRatings[categoryName];

    // Check lock state
    const isLocked = state.selectedSession.isFinished ||
        sessionRecord.attendance === 'absent' ||
        sessionRecord.hadIssue ||
        sessionRecord.wasOutOfClass;

    const buttons = [
        { key: 'effort', label: 'تلاش', className: 'effort-btn' },
        { key: 'good', label: 'خوب', className: 'good-btn' },
        { key: 'excellent', label: 'عالی', className: 'excellent-btn' }
    ];

    buttons.forEach(btnData => {
        const btn = document.createElement('button');
        btn.className = `qualitative-btn ${btnData.className}`;
        btn.textContent = btnData.label;
        btn.disabled = isLocked;

        if (currentRating === btnData.key) {
            btn.classList.add('active');
        }

        btn.addEventListener('click', () => {
            const newRating = btnData.key;

            // A. Update Global Stats (Student Model)
            // 1. Remove old impact if exists
            if (currentRating) {
                if (student.qualitativeStats[categoryName][currentRating] > 0) {
                    student.qualitativeStats[categoryName][currentRating]--;
                }
            }
            // 2. Add new impact (Toggle logic: if clicking same button, we just removed it above and stop there)
            if (currentRating !== newRating) {
                student.qualitativeStats[categoryName][newRating] = (student.qualitativeStats[categoryName][newRating] || 0) + 1;
            }

            // B. Update The Source of Truth (History or Session)
            const finalRating = (currentRating === newRating) ? null : newRating; // Toggle logic

            if (isHistoryMode) {
                historyEntry.rating = finalRating;
            } else {
                // Fallback for manual selection
                if (finalRating) sessionRecord.performanceRatings[categoryName] = finalRating;
                else delete sessionRecord.performanceRatings[categoryName];
            }

            state.saveData();
            displayWinner(); // Re-render
        });

        container.appendChild(btn);
    });

    return container;
}

export function populateSystemLevelSelects(systemSelect, levelSelect, initialSystem = 'custom', initialLevel = null) {
    // 1. Clear and Populate System Select
    systemSelect.innerHTML = '';
    Object.values(EDUCATIONAL_SYSTEMS).forEach(sys => {
        const option = document.createElement('option');
        option.value = sys.id;
        option.textContent = sys.label;
        systemSelect.appendChild(option);
    });

    // Set the initial system selection
    systemSelect.value = initialSystem;

    // 2. Define the Logic to Update Levels
    const updateLevels = (systemId) => {
        levelSelect.innerHTML = '';
        const system = EDUCATIONAL_SYSTEMS[systemId];

        if (system && system.levels.length > 0) {
            system.levels.forEach(lvl => {
                const option = document.createElement('option');
                option.value = lvl;
                option.textContent = lvl;
                levelSelect.appendChild(option);
            });
            levelSelect.disabled = false;
        } else {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = '---';
            levelSelect.appendChild(option);
            levelSelect.disabled = true;
        }
    };

    // 3. Initialize Levels based on the initial system
    updateLevels(initialSystem);

    // 4. Set the initial level if provided
    if (initialLevel) {
        levelSelect.value = initialLevel;
    }

    // 5. Attach Change Listener
    systemSelect.onchange = () => {
        updateLevels(systemSelect.value);
        // Trigger a change event on levelSelect so other listeners know it updated
        levelSelect.dispatchEvent(new Event('change'));
    };
}

export function openAddClassModal() {
    // 1. Reset Inputs
    modalNewClassNameInput.value = '';

    // 2. Populate Dropdowns (using our shared helper)
    // Default to 'custom' system and no specific level
    populateSystemLevelSelects(modalAddClassSystemSelect, modalAddClassLevelSelect, 'custom');

    // 3. Show Modal using the standard app function
    // This handles the 'modal-visible' class and back-button history automatically
    openModal('add-class-modal');

    // Generate day checkboxes in Persian order: Starting from شنبه (Saturday=6) to جمعه (Friday=5)  
    const persianDays = [
        { label: 'شنبه', value: 6 }, // Saturday  
        { label: 'یکشنبه', value: 0 }, // Sunday  
        { label: 'دوشنبه', value: 1 }, // Monday  
        { label: 'سه‌شنبه', value: 2 }, // Tuesday  
        { label: 'چهارشنبه', value: 3 }, // Wednesday  
        { label: 'پنج‌شنبه', value: 4 }, // Thursday  
        { label: 'جمعه', value: 5 } // Friday  
    ];
    modalScheduleDaysContainer.innerHTML = '';
    persianDays.forEach(day => {
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = day.value;
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(day.label));
        modalScheduleDaysContainer.appendChild(label);
    });

    // Set up accordion toggle for the scheduling section
    modalScheduleToggle.addEventListener('click', () => {
        modalScheduleToggle.classList.toggle('open');
        modalScheduleContent.classList.toggle('open');
        const arrow = modalScheduleToggle.querySelector('.arrow');
        arrow.textContent = modalScheduleToggle.classList.contains('open') ? '▼' : '▶';
    });

    modalNewClassNameInput.focus();
}

export function openAddCategoryModal() {
    newCategoryModalNameInput.value = '';
    newCategoryModalIsGradedCheckbox.checked = false;
    newCategoryModalWeightInput.value = 1;
    newCategoryModalWeightGroup.style.display = 'none'; // Hide weight group initially
    openModal('category-modal');
    newCategoryModalNameInput.focus();
}

export function closeAddClassModal() {
    // Use the standard app function to close
    closeActiveModal();
}