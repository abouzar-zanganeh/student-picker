import * as state from './state.js';
import {
    getActiveItems, getSessionDisplayMap, permanentlyDeleteStudent,
    permanentlyDeleteSession, permanentlyDeleteCategory, permanentlyDeleteScore, permanentlyDeleteNote
} from './state.js';
import { detectTextDirection, renderMultiLineText } from './utils.js';
import { getLogsForClass, renameClassroomLog } from './logManager.js';
import * as logManager from './logManager.js';

// --- HTML Elements ---
export const classManagementPage = document.getElementById('class-management-page');
export const newClassNameInput = document.getElementById('new-class-name');
export const addClassBtn = document.getElementById('add-class-btn');
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
export const newCategoryNameInput = document.getElementById('new-category-name');
export const addCategoryBtn = document.getElementById('add-category-btn');
export const appHeader = document.querySelector('.app-header');
export const selectStudentBtn = document.getElementById('select-student-btn');
export const selectStudentBtnWrapper = document.getElementById('select-student-btn-wrapper');
export const attendancePage = document.getElementById('attendance-page');
export const attendanceListUl = document.getElementById('attendance-list');
export const finishAttendanceBtn = document.getElementById('finish-attendance-btn');
export const backToSessionsFromAttendanceBtn = document.getElementById('back-to-sessions-from-attendance-btn');
export const backToAttendanceBtn = document.getElementById('back-to-attendance-btn');
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
export const studentProfilePage = document.getElementById('student-profile-page');
export const profileStudentNameHeader = document.getElementById('profile-student-name-header');
export const backToStudentPageBtn = document.getElementById('back-to-student-page-btn');
export const gradedCategoryPillsContainer = document.getElementById('graded-category-pills-container');
export const newScoreValueInput = document.getElementById('new-score-value');
export const newScoreCommentTextarea = document.getElementById('new-score-comment');
export const addScoreBtn = document.getElementById('add-score-btn');
export const profileStatsSummaryDiv = document.getElementById('profile-stats-summary');
export const profileScoresListUl = document.getElementById('profile-scores-list');
export const globalStudentSearchInput = document.getElementById('global-student-search-input');
export const globalStudentSearchResultsDiv = document.getElementById('global-student-search-results');
export const isGradedCheckbox = document.getElementById('is-graded-checkbox');
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
    confirmModalMessage.textContent = message;
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

    // 1. Configure the modal for renaming
    const modalTitle = document.getElementById('add-note-modal-title');
    modalTitle.textContent = 'تغییر نام دانش‌آموز';
    newNoteContent.value = oldName;
    newNoteContent.rows = 1;
    newNoteContent.dispatchEvent(new Event('input', { bubbles: true })); // Trigger auto-direction

    // 2. Define what happens when the "Save" button is clicked
    state.setSaveNoteCallback((newName) => {
        const trimmedNewName = newName.trim();

        if (trimmedNewName && trimmedNewName !== oldName) {
            // Check for duplicates, excluding the student being renamed
            const isDuplicate = getActiveItems(classroom.students).some(
                s => s.identity.studentId !== student.identity.studentId &&
                    s.identity.name.toLowerCase() === trimmedNewName.toLowerCase()
            );

            if (isDuplicate) {
                showNotification('دانش‌آموزی با این نام از قبل در این کلاس وجود دارد.');
            } else {
                student.identity.name = trimmedNewName;

                logManager.addLog(classroom.info.name, `نام دانش‌آموز «${oldName}» به «${trimmedNewName}» تغییر یافت.`, { type: 'VIEW_STUDENT_PROFILE', studentId: student.identity.studentId });

                state.saveData();

                // Re-render relevant UI parts to show the new name
                renderSettingsStudentList();
                renderStudentStatsList();
                if (state.selectedStudentForProfile && state.selectedStudentForProfile.identity.studentId === student.identity.studentId) {
                    renderStudentProfilePage();
                }

                showNotification(`✅نام دانش‌آموز به «${trimmedNewName}» تغییر یافت.`);
            }
        }

        // 3. Reset the modal to its default state for adding notes
        modalTitle.textContent = 'ثبت یادداشت جدید';
        newNoteContent.rows = 4;
    });

    // 4. Open the modal and pre-select the text
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

export function closeActiveModal(onClosed) {
    if (!state.activeModal) return;

    const modal = document.getElementById(state.activeModal);
    const activeModalId = state.activeModal;

    // IMPORTANT: We clear the activeModal state *before* navigating back.
    // This lets our 'popstate' listener (in the next step) know that we are closing the modal
    // intentionally and that it should not spring the "trap".
    state.setActiveModal(null);
    history.back(); // Programmatically go back to clear the dummy state from the history.

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

export function showSettingsPage(classroom) {
    state.setCurrentClassroom(classroom);
    settingsClassNameHeader.textContent = `تنظیمات کلاس: ${classroom.info.name}`;
    renderSettingsStudentList();
    renderSettingsCategories();
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
}

export async function initiateBackupProcess() {
    // 1. Get the prepared file object.
    const fileToShare = state.prepareBackupData();

    // 2. Check for mobile/share capability.
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice && navigator.share && navigator.canShare && navigator.canShare({ files: [fileToShare] })) {
        try {
            // 3. Use the file with the Web Share API.
            await navigator.share({
                title: 'پشتیبان دستیار معلم',
                text: 'فایل پشتیبان داده‌های برنامه',
                files: [fileToShare],
            });
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error sharing file:', error);
                // 4a. If sharing fails, fall back to a direct download.
                triggerFileDownload(fileToShare);
                showNotification("⚠️اشتراک‌گذاری با خطا مواجه شد. فایل در حال دانلود است.");
            }
        }
    } else {
        // 4b. On desktop, trigger the download directly.
        triggerFileDownload(fileToShare);
        showNotification("✅پشتیبان‌گیری با موفقیت انجام شد.");
    }
}

export function openContextMenu(event, menuItems) {
    event.preventDefault();

    // Start by closing any existing menu. This will trigger the fade-out.
    closeContextMenu();

    // Use a timeout to allow the close transition to begin before we re-open.
    setTimeout(() => {
        const menu = contextMenu;
        const ul = menu.querySelector('ul');
        ul.innerHTML = ''; // Clear out items from any previous menu.

        // Dynamically create and add the new menu items.
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
                    closeContextMenu();
                });
            }
            ul.appendChild(li);
        });

        // --- Positioning Logic ---
        const { clientX, clientY } = event;
        const { innerWidth: windowWidth, innerHeight: windowHeight } = window;

        // Position and show the menu. This will now trigger the fade-in.
        menu.style.top = `${clientY}px`;
        menu.style.left = `${clientX}px`;
        menu.classList.add('visible');

        // --- Edge Collision Detection ---
        const { offsetWidth: menuWidth, offsetHeight: menuHeight } = menu;

        if (clientX + menuWidth > windowWidth) {
            menu.style.left = `${windowWidth - menuWidth - 5}px`;
        }
        if (clientY + menuHeight > windowHeight) {
            menu.style.top = `${windowHeight - menuHeight - 5}px`;
        }
    }, 50); // A small delay like 50ms is enough for a smooth effect
}

export function closeContextMenu() {
    if (contextMenu.classList.contains('visible')) {
        contextMenu.classList.remove('visible');
    }
}

export function renderBreadcrumbs() {
    breadcrumbContainer.innerHTML = ''; // Clear previous breadcrumbs

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

        if (activePage === 'settings-page') {
            path.push({ label: 'تنظیمات' });
        } else if (state.selectedSession) {
            const sessionMap = getSessionDisplayMap(state.currentClassroom);
            const displayNumber = sessionMap.get(state.selectedSession.sessionNumber) || ` (#${state.selectedSession.sessionNumber})`;
            path.push({
                label: `جلسه ${displayNumber}`,
                handler: () => {
                    state.setSelectedStudentForProfile(null);
                    showPage('student-page');
                }
            });

            // Check for deeper pages within a session
            const activePage = document.querySelector('.page.active')?.id;
            if (state.selectedStudentForProfile) {
                path.push({ label: `پروفایل: ${state.selectedStudentForProfile.identity.name}` });
            } else if (activePage === 'attendance-page') {
                path.push({ label: 'حضور و غیاب' });
            }
        }
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

        // If it's the last item or has no handler, make it inactive
        if (index === path.length - 1 || !part.handler) {
            item.classList.add('active');
        } else {
            item.addEventListener('click', part.handler);
        }

        breadcrumbContainer.appendChild(item);

        // Add separator if it's not the last item
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

    const homeworkTooltipMap = {
        none: 'بدون تکلیف',
        complete: 'تکلیف کامل',
        incomplete: 'تکلیف ناقص'
    };

    const infoDiv = document.createElement('div');
    infoDiv.className = 'student-info';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'student-name';
    nameSpan.textContent = student.identity.name;

    nameSpan.addEventListener('click', () => {
        state.setSelectedStudentForProfile(student);
        renderStudentProfilePage();
        showPage('student-profile-page');
    });

    const absenceSpan = document.createElement('span');
    absenceSpan.className = 'absence-info';

    const homeworkInfoSpan = document.createElement('span');
    homeworkInfoSpan.className = 'homework-info';

    renderStudentAbsenceInfo(student, sessionDisplayNumberMap, absenceSpan);

    renderStudentHomeworkInfo(student, sessionDisplayNumberMap, homeworkInfoSpan);

    infoDiv.appendChild(nameSpan);
    infoDiv.appendChild(absenceSpan);
    infoDiv.appendChild(homeworkInfoSpan);


    // Homework related controls
    const homeworkControls = document.createElement('div');
    homeworkControls.className = 'homework-controls';

    const homeworkBtn = document.createElement('button');
    const homeworkStatus = state.selectedSession.studentRecords[student.identity.studentId]?.homework.status || 'none';
    homeworkBtn.className = `homework-status-btn ${homeworkStatus}`;
    homeworkBtn.title = homeworkTooltipMap[homeworkStatus];
    homeworkBtn.addEventListener('click', () => {
        const homework = state.selectedSession.studentRecords[student.identity.studentId].homework;
        const statusCycle = {
            'none': 'incomplete',
            'incomplete': 'complete',
            'complete': 'none'
        };
        const nextStatus = statusCycle[homework.status];
        homeworkBtn.title = homeworkTooltipMap[nextStatus];


        // Update the data
        state.selectedSession.setHomeworkStatus(student.identity.studentId, nextStatus);
        state.saveData();

        // Update the UI
        homeworkBtn.className = `homework-status-btn ${nextStatus}`;
        renderStudentHomeworkInfo(student, sessionDisplayNumberMap, homeworkInfoSpan);
    });

    const homeworkNoteBtn = document.createElement('button');
    homeworkNoteBtn.className = 'btn-icon';
    homeworkNoteBtn.innerHTML = '📝';
    homeworkNoteBtn.title = 'افزودن یادداشت برای تکلیف';
    const homeworkComment = state.selectedSession.studentRecords[student.identity.studentId]?.homework.comment;
    if (!homeworkComment) {
        homeworkNoteBtn.style.opacity = '0.3';
    }

    homeworkNoteBtn.addEventListener('click', () => {
        const homework = state.selectedSession.studentRecords[student.identity.studentId].homework;

        // Populate the modal with the existing comment
        newNoteContent.value = homework.comment || '';
        newNoteContent.dispatchEvent(new Event('input', { bubbles: true })); // Trigger auto-direction

        // Define what "Save" does for this specific context
        state.setSaveNoteCallback(
            (content) => {
                // 1. Save the comment to the session's homework record
                homework.comment = content;

                // 2. Prepare variables for creating/finding the profile note
                const sessionDisplayNumberMap = getSessionDisplayMap(state.currentClassroom);
                const displayNumber = sessionDisplayNumberMap.get(state.selectedSession.sessionNumber);
                const noteSource = { type: 'fromAttendance', sessionNumber: state.selectedSession.sessionNumber };
                const notePrefix = `یادداشت حضور-غیاب ${displayNumber}: `;

                // 3. Find if a note from this source already exists in the student's profile
                const existingNote = student.profile.notes.find(n =>
                    !n.isDeleted && // Important: Only check non-deleted notes
                    n.source &&
                    n.source.type === 'fromAttendance' &&
                    n.source.sessionNumber === noteSource.sessionNumber
                );

                // 4. Intelligently update or create the note
                if (existingNote) {
                    if (content) {
                        // If there's new content, update the existing note
                        existingNote.content = notePrefix + content;
                    } else {
                        // If content is cleared, soft-delete the existing note
                        existingNote.isDeleted = true;
                    }
                } else if (content) {
                    // If no note exists and there's new content, add a new one
                    student.addNote(notePrefix + content, noteSource);
                }

                state.saveData();

                logManager.addLog(state.currentClassroom.info.name, `یادداشت تکلیف جلسه ${displayNumber} برای دانش‌آموز «${student.identity.name}» ذخیره شد.`, { type: 'VIEW_STUDENT_PROFILE', studentId: student.identity.studentId });

                showNotification("✅یادداشت تکلیف ذخیره شد.");

                // 5. Update the button's visual cue and re-render homework info
                homeworkNoteBtn.style.opacity = content ? '1' : '0.3';
                renderStudentHomeworkInfo(student, sessionDisplayNumberMap, homeworkInfoSpan);
            });

        openModal('add-note-modal');
        newNoteContent.focus();
    });

    homeworkControls.appendChild(homeworkBtn);
    homeworkControls.appendChild(homeworkNoteBtn);
    // End of Homework related..


    const attendanceToggleBtn = document.createElement('button');
    const currentStatus = state.selectedSession.studentRecords[student.identity.studentId]?.attendance || 'present';

    // Function to update button appearance
    const updateButtonUI = (status) => {
        if (status === 'present') {
            attendanceToggleBtn.textContent = 'حاضر';
            attendanceToggleBtn.className = 'attendance-status-btn present active';
        } else {
            attendanceToggleBtn.textContent = 'غایب';
            attendanceToggleBtn.className = 'attendance-status-btn absent active';
        }
    };

    // Set initial state
    updateButtonUI(currentStatus);

    // Add toggle logic
    attendanceToggleBtn.addEventListener('click', () => {
        const oldStatus = state.selectedSession.studentRecords[student.identity.studentId]?.attendance || 'present';
        const newStatus = oldStatus === 'present' ? 'absent' : 'present';

        state.selectedSession.setAttendance(student.identity.studentId, newStatus);

        if (newStatus === 'absent') {
            state.selectedSession.studentRecords[student.identity.studentId].hadIssue = false;
        }

        state.saveData();

        // Update UI
        updateButtonUI(newStatus);
        renderStudentAbsenceInfo(student, sessionDisplayNumberMap, absenceSpan);
        renderAbsenteesSummary();
    });

    // Final assembly of the list item
    li.appendChild(infoDiv);
    li.appendChild(homeworkControls);
    li.appendChild(attendanceToggleBtn);

    return li;
}

function getRealSessionNumber() {
    // Use this function to get the active session number. This function filters out cancelled and deleted sessions
    const sessionDisplayNumberMap = getSessionDisplayMap(state.currentClassroom);
    const displayNumber = sessionDisplayNumberMap.get(state.selectedSession.sessionNumber);
    return displayNumber;

}

export function renderAttendancePage() {
    if (!state.currentClassroom || !state.selectedSession) return;

    const sessionDisplayNumberMap = getSessionDisplayMap(state.currentClassroom);

    createAbsenteesSummaryBox();

    attendanceListUl.innerHTML = '';

    // Creates and adds the header row
    const headerLi = document.createElement('li');
    headerLi.className = 'attendance-list-header';
    headerLi.innerHTML = `
    <span class="header-label-spacer"></span>
    <span class="header-label">تکلیف</span>
    <span class="header-label">حضور</span>
`;

    attendanceListUl.appendChild(headerLi);

    getActiveItems(state.currentClassroom.students).forEach(student => {
        const li = createAttendanceListItem(student, sessionDisplayNumberMap);
        attendanceListUl.appendChild(li);
    });


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
    const counterHeaders = ['کل انتخاب ها', 'غیبت', 'خروج', 'فرصت ازدست‌رفته', 'مشکل', 'میانگین', 'نمره کلاسی (کانون)'];

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
    const activeStudents = getActiveItems(state.currentClassroom.students);

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
        nameLink.textContent = student.identity.name;
        nameLink.className = 'student-name-link';
        nameLink.addEventListener('click', () => {
            state.setSelectedStudentForProfile(student);
            renderStudentProfilePage();
            showPage('student-profile-page');
        });
        nameCell.appendChild(nameLink);
        // 2. Loops through our dynamic list of gradable categories to add the rest of the data
        gradedCategoryHeaders.forEach(categoryName => {
            const cell = row.insertCell();
            // The key in categoryCounts is the exact category name (e.g., "Listening")
            const skillKey = categoryName.toLowerCase();
            const scoresForSkill = student.logs.scores[skillKey]?.filter(s => !s.isDeleted) || [];

            if (scoresForSkill.length > 0) {
                scoresForSkill.forEach((score, index) => {
                    const scoreSpan = document.createElement('span');
                    scoreSpan.textContent = score.value;
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
        // --- FALLBACK: Original logic for showing a historical winner ---
        if (!state.selectedSession || state.winnerHistoryIndex < 0 || !state.selectedSession.winnerHistory[state.winnerHistoryIndex]) {
            return;
        }
        const historyEntry = state.selectedSession.winnerHistory[state.winnerHistoryIndex];
        winner = historyEntry.winner;
        categoryName = historyEntry.categoryName;
    }

    // --- Table Row Highlight Management ---
    // First, clear any existing winner highlight from the table
    const previousWinnerRow = document.querySelector('.current-winner-highlight');
    if (previousWinnerRow) {
        previousWinnerRow.classList.remove('current-winner-highlight');
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

        // Update the UI to show the correct active pill
        const allPills = document.querySelectorAll('#category-selection-container .pill');
        allPills.forEach(p => p.classList.remove('active'));
        const activePill = Array.from(allPills).find(p => p.textContent === categoryName);
        if (activePill) {
            activePill.classList.add('active');
        }

        // Update the quick grade form to match the new active category
        updateQuickGradeUIForCategory(correspondingCategory);
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
        state.saveData();
    });

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
        state.saveData();
    });

    exitBtn.addEventListener('click', () => {
        const isCurrentlyActive = exitBtn.classList.contains('active');

        if (!isCurrentlyActive) {
            // Deactivate other mutually exclusive buttons first
            if (absentBtn.classList.contains('active')) {
                absentBtn.classList.remove('active');
                state.selectedSession.setAttendance(winner.identity.studentId, 'present');
                winner.statusCounters.missedChances = Math.max(0, winner.statusCounters.missedChances - 1);
            }
            if (issueBtn.classList.contains('active')) {
                issueBtn.classList.remove('active');
                studentRecord.hadIssue = false;
                const categoryName = state.selectedCategory.name;
                if (winner.categoryIssues[categoryName]) { winner.categoryIssues[categoryName] = Math.max(0, winner.categoryIssues[categoryName] - 1); }
                winner.statusCounters.missedChances = Math.max(0, winner.statusCounters.missedChances - 1);
            }

            exitBtn.classList.add('active');
            studentRecord.wasOutOfClass = true;

            // Increment both the specific counter and the missed chance counter
            winner.statusCounters.outOfClassCount = (winner.statusCounters.outOfClassCount || 0) + 1;
            winner.statusCounters.missedChances++;

            // Reset any potential 'absent' styling first
            winnerNameEl.style.textDecoration = '';
            winnerNameEl.style.opacity = '';

            // Visual cue for the winner's name
            winnerNameEl.style.color = 'var(--color-strong-warning)';
            winnerNameEl.title = 'این دانش‌آموز در زمان انتخاب خارج از کلاس بود';

        } else {
            exitBtn.classList.remove('active');
            studentRecord.wasOutOfClass = false;

            // Decrement both counters
            winner.statusCounters.outOfClassCount = Math.max(0, (winner.statusCounters.outOfClassCount || 0) - 1);
            winner.statusCounters.missedChances = Math.max(0, winner.statusCounters.missedChances - 1);

            // Remove the visual cue
            winnerNameEl.style.color = '';
            winnerNameEl.title = '';
        }
        renderStudentStatsList();
        state.saveData();
    });

    profileBtn.addEventListener('click', () => {
        state.setSelectedStudentForProfile(winner);
        renderStudentProfilePage();
        showPage('student-profile-page');
    });

    buttonContainer.appendChild(absentBtn);
    buttonContainer.appendChild(exitBtn);
    buttonContainer.appendChild(issueBtn);
    buttonContainer.appendChild(profileBtn);
    resultDiv.appendChild(buttonContainer);

    // --- Details Container (scores, notes) ---
    const detailsContainer = document.createElement('div');
    detailsContainer.className = 'student-details-container';

    const scoresDiv = document.createElement('div');
    scoresDiv.className = 'student-details-scores';
    scoresDiv.innerHTML = '<h4>آخرین نمرات</h4>';

    const scoresList = document.createElement('ul');
    scoresList.className = 'scores-list';

    const skills = ['Reading', 'Writing', 'Speaking', 'Listening'];
    let hasAnyScore = false;
    const studentScores = winner.logs.scores || {};

    skills.forEach(skill => {
        const li = document.createElement('li');
        const skillNameSpan = document.createElement('span');
        skillNameSpan.className = 'skill-name';
        skillNameSpan.textContent = `${skill}:`;
        const skillScoresSpan = document.createElement('span');
        skillScoresSpan.className = 'skill-scores';
        const skillKey = skill.toLowerCase();
        const scoresForSkill = studentScores[skillKey];
        if (scoresForSkill && scoresForSkill.length > 0) {
            hasAnyScore = true;
            skillScoresSpan.textContent = scoresForSkill.slice(-3).map(s => s.value).join(',');
        } else {
            skillScoresSpan.textContent = 'none';
        }
        li.appendChild(skillNameSpan);
        li.appendChild(skillScoresSpan);
        scoresList.appendChild(li);
    });

    if (!hasAnyScore && Object.keys(studentScores).length === 0) {
        scoresList.innerHTML = `<div class="no-content-message">هنوز نمره‌ای ثبت نشده است.</div>`;
    }

    scoresDiv.appendChild(scoresList);
    detailsContainer.appendChild(scoresDiv);

    const notesDiv = document.createElement('div');
    notesDiv.className = 'student-details-notes';
    notesDiv.innerHTML = '<h4>یادداشت‌ها</h4>';

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
    const activeCategories = state.currentClassroom.categories.filter(cat => !cat.isDeleted);
    activeCategories.forEach(category => {
        const pill = document.createElement('span');
        pill.className = 'pill';
        pill.textContent = category.name;
        pill.dataset.categoryId = category.id;
        if (category.description) {
            pill.dataset.tooltip = category.description;
        }

        pill.addEventListener('click', () => {


            document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            state.setSelectedCategory(category);

            updateQuickGradeUIForCategory(category);

            selectStudentBtnWrapper.classList.remove('disabled-wrapper');
            selectStudentBtn.disabled = false;



            // --- NEW: Display the last winner for this category ---
            const lastWinnerId = state.selectedSession.lastWinnerByCategory[category.name];
            if (lastWinnerId) {
                const lastWinner = state.currentClassroom.students.find(s => s.identity.studentId === lastWinnerId);
                if (lastWinner) {
                    // We call displayWinner with the student and category.
                    // This sets a manual selection context, bypassing the history index.
                    displayWinner(lastWinner, category.name);
                }
            } else {
                // If no last winner for this category, clear the display and reset state.
                resultDiv.innerHTML = '';
                state.setManualSelection(null);
                state.setWinnerHistoryIndex(-1);
                selectStudentBtn.disabled = false; // Ensure button is enabled

                // Clear any lingering winner highlight from the stats table
                const previousWinnerRow = document.querySelector('.current-winner-highlight');
                if (previousWinnerRow) {
                    previousWinnerRow.classList.remove('current-winner-highlight');
                }
            }

        });

        categoryPillsContainer.appendChild(pill);
    });
}

function restoreSessionState() {
    if (state.selectedSession.lastUsedCategoryId) {
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

function updateQuickGradeUIForCategory(category) {
    if (!category) return; // Do nothing if no category is provided

    if (category.isGradedCategory) {
        quickScoreInput.disabled = false;
        quickNoteTextarea.disabled = false;
        quickGradeSubmitBtn.disabled = false;
        quickGradeFormWrapper.removeAttribute('data-tooltip');
    } else {
        quickScoreInput.disabled = true;
        quickNoteTextarea.disabled = true;
        quickGradeSubmitBtn.disabled = true;
        quickGradeFormWrapper.setAttribute('data-tooltip', 'برای این دسته‌بندی قابلیت نمره دهی تعریف نشده است');
    }
}

export function renderStudentPage() {

    if (!state.currentClassroom || !state.selectedSession) {
        showPage('class-management-page');
        return;
    }

    initializeStudentPageUI();
    renderCategoryPills();
    restoreSessionState();

    showPage('student-page');
    renderStudentStatsList();
}

export function renderStudentProfilePage() {
    if (!state.selectedStudentForProfile) return;

    const student = state.selectedStudentForProfile;
    profileStudentNameHeader.textContent = `پروفایل: ${student.identity.name}`;

    const absenceCount = state.currentClassroom.sessions.reduce((count, session) => {
        const record = session.studentRecords[student.identity.studentId];
        return count + (record && record.attendance === 'absent' ? 1 : 0);
    }, 0);

    const totalIssues = Object.values(student.categoryIssues || {}).reduce((sum, count) => sum + count, 0);

    profileStatsSummaryDiv.innerHTML = `
    <p><strong>کل انتخاب:</strong> ${student.statusCounters.totalSelections}</p>
    <p><strong>غیبت:</strong> ${absenceCount}</p>
    <p><strong>فرصت از دست رفته:</strong> ${student.statusCounters.missedChances || 0}</p>
    <p><strong>مشکل:</strong> ${totalIssues}</p>`;



    // --- Selections Breakdown ---

    // Get all active categories for the classroom
    const activeCategories = getActiveItems(state.currentClassroom.categories);

    const selectionsBreakdownContainer = document.createElement('div');
    selectionsBreakdownContainer.className = 'stats-breakdown';

    // We can reuse the activeCategories list from the issues breakdown below
    if (activeCategories.length > 0) {
        activeCategories.forEach(category => {
            const categoryName = category.name;
            const count = student.categoryCounts?.[categoryName] || 0;

            const p = document.createElement('p');
            p.className = 'stats-breakdown-item';
            p.innerHTML = `<strong>${categoryName}:</strong> ${count}`;
            selectionsBreakdownContainer.appendChild(p);
        });

        // Find the 'total selections' p tag and insert this breakdown right after it
        const totalSelectionsP = profileStatsSummaryDiv.querySelector('p:first-child');
        if (totalSelectionsP) {
            totalSelectionsP.after(selectionsBreakdownContainer);
        }
    }


    const issuesBreakdownContainer = document.createElement('div');
    issuesBreakdownContainer.className = 'stats-breakdown';


    if (activeCategories.length > 0) {
        activeCategories.forEach(category => {
            const categoryName = category.name;
            // Look up the count for this student. Default to 0 if not found.
            const count = student.categoryIssues?.[categoryName] || 0;

            const p = document.createElement('p');
            p.className = 'stats-breakdown-item';
            p.innerHTML = `<strong>${categoryName}:</strong> ${count}`;
            issuesBreakdownContainer.appendChild(p);
        });

        profileStatsSummaryDiv.appendChild(issuesBreakdownContainer);
    }


    // --- Homework Info ---
    const homeworkInfoP = document.createElement('p');
    const homeworkLabel = document.createElement('strong');
    homeworkLabel.textContent = 'تکالیف ناقص:';

    const homeworkValuesSpan = document.createElement('span');
    homeworkValuesSpan.style.marginRight = '5px'; // Adds a little space after the label

    // Call our reusable function without the prefix
    const sessionDisplayNumberMap = getSessionDisplayMap(state.currentClassroom);
    renderStudentHomeworkInfo(student, sessionDisplayNumberMap, homeworkValuesSpan, { includePrefix: false });

    homeworkInfoP.appendChild(homeworkLabel);
    homeworkInfoP.appendChild(homeworkValuesSpan);
    profileStatsSummaryDiv.appendChild(homeworkInfoP);

    // Get only the categories marked as "gradable" and not deleted
    const gradedCategories = state.currentClassroom.categories.filter(cat => cat.isGradedCategory && !cat.isDeleted);

    gradedCategoryPillsContainer.innerHTML = '';
    gradedCategories.forEach(category => {
        const pill = document.createElement('span');
        pill.className = 'pill';
        pill.textContent = category.name; // e.g., "Writing"
        // Use the category name for the data key. The logic for adding scores will use this value.
        pill.dataset.skillName = category.name;
        if (category.description) {
            pill.dataset.tooltip = category.description;
        }
        gradedCategoryPillsContainer.appendChild(pill);
        pill.addEventListener('click', () => {
            gradedCategoryPillsContainer.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            newScoreValueInput.focus();
        });
    });

    profileScoresListUl.innerHTML = '';
    const allScores = [];
    for (const skill in student.logs.scores) {

        student.logs.scores[skill].forEach(score => {
            if (!score.isDeleted) {
                allScores.push(score);
            }
        });
    }

    allScores.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (allScores.length === 0) {
        profileScoresListUl.innerHTML = '<div class="no-content-message">هنوز نمره‌ای ثبت نشده است.</div>';
    } else {
        allScores.forEach(score => {
            const li = document.createElement('li');
            li.className = 'score-history-item';

            const scoreContent = document.createElement('div');
            scoreContent.className = 'item-content';

            const scoreInfo = document.createElement('div');
            scoreInfo.className = 'score-info';
            scoreInfo.innerHTML = `
        <span class="score-date">${new Date(score.timestamp).toLocaleDateString('fa-IR')}</span>
        <span class="score-value">نمره: <strong>${score.value}</strong></span>
        <span class="score-skill-badge">${score.skill}</span>
    `;
            scoreContent.appendChild(scoreInfo);

            if (score.comment) {
                const fullCommentString = `توضیحات: ${score.comment}`;
                const blockDirection = detectTextDirection(fullCommentString);

                // --- Start of Re-introduced Logic ---
                const commentDirection = detectTextDirection(score.comment);
                const alignmentClass = commentDirection === 'ltr' ? 'comment-ltr' : '';
                // --- End of Re-introduced Logic ---

                const commentP = document.createElement('p');
                commentP.className = 'score-comment';
                commentP.dir = blockDirection;
                // Re-add the alignmentClass to the <bdi> tag
                commentP.innerHTML = `<strong>توضیحات:</strong> <div>${renderMultiLineText(score.comment)}</div>`; commentP.addEventListener('click', () => {
                    newNoteContent.value = score.comment;
                    newNoteContent.dispatchEvent(new Event('input', { bubbles: true }));
                    state.setSaveNoteCallback((newText) => {
                        score.comment = newText;
                        state.saveData();
                        renderStudentProfilePage();
                        showNotification('✅ توضیحات نمره ویرایش شد.');
                    });
                    openModal('add-note-modal');
                    newNoteContent.focus();
                });

                scoreContent.appendChild(commentP);
            }

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn-icon delete-item-btn';
            deleteBtn.innerHTML = '🗑️';
            deleteBtn.title = 'حذف این نمره';
            deleteBtn.addEventListener('click', () => {
                showCustomConfirm(
                    `آیا از حذف نمره ${score.value} برای مهارت ${score.skill} مطمئن هستید؟`,
                    () => {
                        const trashEntry = {
                            id: `trash_${Date.now()}_${Math.random()}`,
                            timestamp: new Date().toISOString(),
                            type: 'score',
                            description: `نمره ${score.value} (${score.skill}) برای دانش‌آموز «${student.identity.name}»`,
                            restoreData: { scoreId: score.id, skill: score.skill, studentId: student.identity.studentId, classroomName: state.currentClassroom.info.name }
                        };
                        state.trashBin.unshift(trashEntry);
                        if (state.trashBin.length > 50) state.trashBin.pop();

                        score.isDeleted = true;
                        logManager.addLog(state.currentClassroom.info.name, `نمره ${score.value} در ${score.skill} برای «${student.identity.name}» به سطل زباله منتقل شد.`, { type: 'VIEW_TRASH' });
                        state.saveData();
                        renderStudentProfilePage();
                        showNotification('✅ نمره به سطل زباله منتقل شد.');
                    },
                    { confirmText: 'تایید حذف', confirmClass: 'btn-warning' }
                );
            });

            li.appendChild(scoreContent);
            li.appendChild(deleteBtn);
            profileScoresListUl.appendChild(li);
        });
    }

    newScoreValueInput.value = '';
    newScoreCommentTextarea.value = '';
    if (gradedCategoryPillsContainer.querySelector('.pill.active')) {
        gradedCategoryPillsContainer.querySelector('.pill.active').classList.remove('active');
    }
    renderStudentNotes();
}

export function renderStudentNotes() {
    const profileNotesListUl = document.getElementById('profile-notes-list');
    profileNotesListUl.innerHTML = '';

    if (!state.selectedStudentForProfile || !state.selectedStudentForProfile.profile.notes || state.selectedStudentForProfile.profile.notes.length === 0) {
        profileNotesListUl.innerHTML = '<div class="no-content-message">هنوز یادداشتی ثبت نشده است.</div>';
        return;
    }


    const sortedNotes = [...state.selectedStudentForProfile.profile.notes]
        .filter(note => !note.isDeleted)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    sortedNotes.forEach(note => {
        const li = document.createElement('li');
        li.className = 'note-history-item';

        const itemContentDiv = document.createElement('div');
        itemContentDiv.className = 'item-content';

        // --- Build the note header programmatically ---
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
            showCustomConfirm(
                `آیا از حذف این یادداشت مطمئن هستید؟`,
                () => {
                    const trashEntry = {
                        id: `trash_${Date.now()}_${Math.random()}`,
                        timestamp: new Date().toISOString(),
                        type: 'note',
                        description: `یادداشت برای دانش‌آموز «${state.selectedStudentForProfile.identity.name}»`,
                        restoreData: { noteId: note.id, studentId: state.selectedStudentForProfile.identity.studentId, classroomName: state.currentClassroom.info.name }
                    };
                    state.trashBin.unshift(trashEntry);
                    if (state.trashBin.length > 50) state.trashBin.pop();

                    note.isDeleted = true;
                    logManager.addLog(state.currentClassroom.info.name, `یادداشت دانش‌آموز «${state.selectedStudentForProfile.identity.name}» به سطل زباله منتقل شد.`, { type: 'VIEW_TRASH' });
                    state.saveData();
                    renderStudentNotes();
                    showNotification('✅ یادداشت به سطل زباله منتقل شد.');
                },
                { confirmText: 'تایید حذف', confirmClass: 'btn-warning' }
            );
        });

        // Append date and the button to the info header
        noteInfoDiv.appendChild(noteDateSpan);
        noteInfoDiv.appendChild(deleteBtn);
        // --- End of header build ---

        // --- Create the note content paragraph ---
        const noteContentP = document.createElement('p');
        noteContentP.className = 'note-content';
        noteContentP.innerHTML = renderMultiLineText(note.content);

        noteContentP.addEventListener('click', () => {
            // 1. Populate the modal with the current note text
            newNoteContent.value = note.content;
            newNoteContent.dispatchEvent(new Event('input', { bubbles: true }));

            // 2. Set the callback for what "Save" should do
            state.setSaveNoteCallback((newText) => {
                note.content = newText;
                state.saveData();

                logManager.addLog(state.currentClassroom.info.name,
                    `یادداشت دانش‌آموز «${state.selectedStudentForProfile.identity.name}» به‌روزرسانی شد.`,
                    {
                        type: 'VIEW_STUDENT_PROFILE',
                        studentId: state.selectedStudentForProfile.identity.studentId
                    });

                renderStudentNotes();
                showNotification("✅یادداشت با موفقیت ویرایش شد.");
            });

            // 3. Open the modal
            openModal('add-note-modal');
            newNoteContent.focus();
        });


        // --- End of content paragraph ---

        // Append the new header and content to the main item container
        itemContentDiv.appendChild(noteInfoDiv);
        itemContentDiv.appendChild(noteContentP);

        // Append the main container to the list item
        li.appendChild(itemContentDiv);

        profileNotesListUl.appendChild(li);
    });
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
    noteBtn.title = 'افزودن/ویرایش یادداشت کلاس';
    noteBtn.style.borderBottom = 'solid';
    if (!classroom.note) {
        noteBtn.style.opacity = '0.5';
        noteBtn.style.borderBottom = 'none';
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

    // Stats Row (Student and Session Counts)
    const studentCount = getActiveItems(classroom.students).length;
    const sessionCount = getActiveItems(classroom.sessions).filter(session => session.isFinished).length;

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

    // --- 1. Info Container (Name and Counts) ---
    const infoContainer = createClassInfoContainer(classroom);
    li.appendChild(infoContainer);

    // --- 2. Badges Container ---
    const badgesContainer = document.createElement('div');
    badgesContainer.className = 'list-item-badges';

    // 'Unfinished Session' Badge
    if (classroom.liveSession && !classroom.liveSession.isCancelled && !classroom.liveSession.isDeleted) {
        const warningBadge = document.createElement('span');
        warningBadge.className = 'warning-badge';
        warningBadge.textContent = 'جلسه باز';
        badgesContainer.appendChild(warningBadge);
        li.classList.add('has-unfinished-session');
    }

    // 'Class Type' Badge
    const typeBadge = document.createElement('span');
    typeBadge.className = `type-badge ${classroom.info.type}`;
    typeBadge.textContent = classroom.info.type === 'online' ? 'آنلاین' : 'حضوری';
    typeBadge.title = 'نوع کلاس';
    badgesContainer.appendChild(typeBadge);

    li.appendChild(badgesContainer);

    // --- 3. Action Buttons ---
    const buttonsContainer = createClassActionButtons(classroom);
    li.appendChild(buttonsContainer);

    // --- 4. Add the right-click context menu ---
    li.addEventListener('contextmenu', (event) => {
        const menuItems = [
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

                    // 1. Configure the modal for renaming the class
                    const modalTitle = document.getElementById('add-note-modal-title');
                    modalTitle.textContent = 'تغییر نام کلاس';
                    newNoteContent.value = oldName;
                    newNoteContent.rows = 1;

                    // 2. Define what happens when the "Save" button is clicked
                    state.setSaveNoteCallback((newName) => {
                        const trimmedNewName = newName.trim();

                        // Only proceed if the name is new and not empty
                        if (trimmedNewName && trimmedNewName !== oldName) {
                            const result = state.renameClassroom(oldName, trimmedNewName);

                            if (result.success) {

                                // First, rename the log history to match the new class name
                                logManager.renameClassroomLog(oldName, trimmedNewName);

                                // Now, add the log entry for the rename action itself
                                logManager.addLog(trimmedNewName, `نام کلاس از «${oldName}» به «${trimmedNewName}» تغییر یافت.`, { type: 'VIEW_SESSIONS' });
                                state.saveData();

                                renderClassList();
                                showNotification(`✅نام کلاس به «${trimmedNewName}» تغییر یافت.`);
                            } else {
                                showNotification(result.message);
                            }
                        }

                        // 3. Reset the modal to its default state for adding notes
                        modalTitle.textContent = 'ثبت یادداشت جدید';
                        newNoteContent.rows = 4;
                    });

                    // 4. Open the modal and pre-select the text
                    openModal('add-note-modal');
                    newNoteContent.focus();
                    newNoteContent.select();
                }
            },
            {
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
                            state.trashBin.unshift(trashEntry);
                            if (state.trashBin.length > 50) state.trashBin.pop(); // Keep the list at 50 items

                            classroom.isDeleted = true; // Still mark as deleted to hide it from the main list
                            state.saveData();
                            renderClassList();
                            showNotification(`✅ کلاس «${classroom.info.name}» به سطل زباله منتقل شد.`);
                        },
                        { confirmText: 'بله', confirmClass: 'btn-warning', isDelete: true }
                    );
                }
            }
        ];
        openContextMenu(event, menuItems);
    });

    return li;
}



export function renderClassList() {
    classListUl.innerHTML = '';

    // Convert the classrooms object to an array and sort it by creation date
    const sortedClasses = Object.values(state.classrooms)
        .sort((a, b) => new Date(a.info.creationDate) - new Date(b.info.creationDate));

    // Now, iterate over the sorted array instead of the original object
    sortedClasses.forEach(classroom => {
        if (classroom.isDeleted) return; // Use return instead of continue in forEach

        const li = createClassListItem(classroom);
        classListUl.appendChild(li);
    });
}

// End of functions needed for rendering the classroom page

export function renderSettingsStudentList() {
    settingsStudentListUl.innerHTML = '';
    if (!state.currentClassroom) return;

    getActiveItems(state.currentClassroom.students).forEach(student => {
        const li = document.createElement('li');
        const nameSpan = document.createElement('span');
        nameSpan.textContent = student.identity.name;
        nameSpan.style.flexGrow = '1';

        nameSpan.className = 'student-name-link';
        nameSpan.addEventListener('click', () => {
            state.setSelectedStudentForProfile(student);
            renderStudentProfilePage();
            showPage('student-profile-page');
        });

        li.appendChild(nameSpan);

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
                        // This will call the function we create in Part B
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
                                    restoreData: { studentId: student.identity.studentId, classroomName: state.currentClassroom.info.name }
                                };
                                state.trashBin.unshift(trashEntry);
                                if (state.trashBin.length > 50) state.trashBin.pop();

                                student.isDeleted = true;
                                logManager.addLog(state.currentClassroom.info.name, `دانش‌آموز «${student.identity.name}» به سطل زباله منتقل شد.`, { type: 'VIEW_TRASH' });
                                state.saveData();
                                renderSettingsStudentList();
                                showNotification(`✅ دانش‌آموز «${student.identity.name}» به سطل زباله منتقل شد.`);
                            },
                            { confirmText: 'بله', confirmClass: 'btn-warning', isDelete: true }
                        );
                    }
                }
            ];
            openContextMenu(event, menuItems);
        });
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
            gradedBadge.textContent = 'قابل نمره‌دهی';
            nameAndBadgeContainer.appendChild(gradedBadge);
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
                        restoreData: { categoryId: category.id, classroomName: state.currentClassroom.info.name }
                    };
                    state.trashBin.unshift(trashEntry);
                    if (state.trashBin.length > 50) state.trashBin.pop();

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
        renderClassList();
        appHeader.style.display = 'flex';
    } else {
        appHeader.style.display = 'none';
    }
    renderBreadcrumbs();
}

export function showPage(pageId) {
    const historyState = {
        pageId,
        currentClassName: state.currentClassroom ? state.currentClassroom.info.name : null,
        selectedSessionNumber: state.selectedSession ? state.selectedSession.sessionNumber : null,
        selectedStudentId: state.selectedStudentForProfile ? state.selectedStudentForProfile.identity.studentId : null,
    };

    // Build a new URL with query parameters to store the context
    let hash = `#${pageId}`;
    const params = new URLSearchParams();

    if (state.currentClassroom) {
        params.set('class', state.currentClassroom.info.name);
    }
    if (state.selectedSession) {
        params.set('session', state.selectedSession.sessionNumber);
    }
    if (state.selectedStudentForProfile) {
        params.set('student', state.selectedStudentForProfile.identity.studentId);
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

    // --- Add the note Button ---
    const noteBtn = document.createElement('button');
    noteBtn.className = 'btn-icon';
    noteBtn.innerHTML = '📝';
    noteBtn.title = 'افزودن/ویرایش یادداشت جلسه';
    noteBtn.style.borderBottom = 'solid';

    if (!session.note) {
        noteBtn.style.opacity = '0.5';
        noteBtn.style.borderBottom = 'none';

    }

    noteBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        newNoteContent.value = session.note || '';
        state.setSaveNoteCallback((content) => {
            session.note = content;
            state.saveData();

            logManager.addLog(state.currentClassroom.info.name,
                `یادداشت جلسه ${displaySessionNumber} ذخیره شد.`,
                { type: 'VIEW_SESSIONS' });

            renderSessions();
            showNotification("✅یادداشت جلسه ذخیره شد.");
        });
        openModal('add-note-modal');
        newNoteContent.focus();
    });

    buttonsContainer.appendChild(noteBtn);

    if (!session.isFinished && !session.isCancelled) {
        const endSessionBtn = document.createElement('button');
        endSessionBtn.className = 'btn-icon';
        endSessionBtn.innerHTML = '✅';
        endSessionBtn.title = 'خاتمه جلسه';
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

                    // New: Show a second confirmation for backup
                    showCustomConfirm(
                        "جلسه با موفقیت خاتمه یافت. آیا مایل به ایجاد فایل پشتیبان هستید؟",
                        () => {
                            // This logic now runs when the user clicks the "Yes" button.
                            if (state.isDemoMode) {
                                showNotification("⚠️ پشتیبان‌گیری در حالت نمایش (Demo) غیرفعال است.");
                                return; // This stops the function before creating the backup file.
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
        buttonsContainer.appendChild(endSessionBtn);
    }

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

    const badgesContainer = document.createElement('div');
    badgesContainer.style.display = 'flex';
    badgesContainer.style.gap = '5px';
    badgesContainer.style.marginTop = '5px';

    // Day of the week badge
    const dayOfWeek = new Date(session.startTime).toLocaleDateString('fa-IR', { weekday: 'long' });
    const dayBadge = document.createElement('span');
    dayBadge.className = 'type-badge day-badge';
    dayBadge.textContent = dayOfWeek;
    badgesContainer.appendChild(dayBadge);

    if (session.isCancelled) {
        sessionText.textContent = `✅جلسه لغو شده - تاریخ: ${sessionDate}`;
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
            renderStudentPage();
        });
    }
    // comment for test

    infoContainer.appendChild(sessionText);

    if (session.isFinished) {
        const finishedBadge = document.createElement('span');
        finishedBadge.className = 'type-badge';
        finishedBadge.textContent = 'خاتمه یافته';
        finishedBadge.style.backgroundColor = 'var(--color-secondary)';
        badgesContainer.appendChild(finishedBadge);
    }
    if (session.isMakeup) {
        const makeupBadge = document.createElement('span');
        makeupBadge.className = 'type-badge';
        makeupBadge.textContent = 'جبرانی';
        makeupBadge.style.backgroundColor = 'var(--color-warning)';
        makeupBadge.style.color = 'var(--color-text-dark)';
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
                                restoreData: { sessionNumber: session.sessionNumber, classroomName: state.currentClassroom.info.name }
                            };
                            state.trashBin.unshift(trashEntry);
                            if (state.trashBin.length > 50) state.trashBin.pop();

                            session.isDeleted = true;
                            logManager.addLog(state.currentClassroom.info.name, `جلسه ${displayNumText} به سطل زباله منتقل شد.`, { type: 'VIEW_TRASH' });
                            state.saveData();
                            renderSessions();
                            showNotification(`✅ جلسه ${displayNumText} به سطل زباله منتقل شد.`);
                        },
                        { confirmText: 'بله', confirmClass: 'btn-warning', isDelete: true }
                    );
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
                state.setSelectedStudentForProfile(student);
                renderStudentProfilePage();
                showPage('student-profile-page');
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

            const studentNameSpan = document.createElement('span');
            studentNameSpan.className = 'student-name';
            studentNameSpan.textContent = result.student.identity.name;

            const classNameSpan = document.createElement('span');
            classNameSpan.className = 'class-name';
            classNameSpan.textContent = `کلاس: ${result.classroom.info.name}`;

            // --- REVISED LOGIC ---

            // 1. The main container now navigates to the student profile.
            resultDiv.addEventListener('click', () => {
                state.setCurrentClassroom(result.classroom);
                state.setSelectedStudentForProfile(result.student);
                renderStudentProfilePage();
                showPage('student-profile-page');
                globalStudentSearchResultsDiv.style.display = 'none';
                globalStudentSearchInput.value = '';
            });

            // 2. The class name is a separate action that stops the parent click.
            classNameSpan.addEventListener('click', (event) => {
                event.stopPropagation(); // This is crucial to prevent both actions from firing.
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
                    const classroom = state.classrooms[r.classroomName];
                    const student = classroom?.students.find(s => s.identity.studentId === r.studentId);
                    if (student) {
                        student.isDeleted = false;
                        success = true;
                    }
                    break;
                }
                case 'session': {
                    const classroom = state.classrooms[r.classroomName];
                    const session = classroom?.sessions.find(s => s.sessionNumber === r.sessionNumber);
                    if (session) {
                        session.isDeleted = false;
                        success = true;
                    }
                    break;
                }
                case 'category': {
                    const classroom = state.classrooms[r.classroomName];
                    const category = classroom?.categories.find(c => c.id === r.categoryId);
                    if (category) {
                        category.isDeleted = false;
                        success = true;
                    }
                    break;
                }
                case 'score': {
                    const classroom = state.classrooms[r.classroomName];
                    const student = classroom?.students.find(s => s.identity.studentId === r.studentId);
                    const score = student?.logs.scores[r.skill.toLowerCase()]?.find(sc => sc.id === r.scoreId);
                    if (score) {
                        score.isDeleted = false;
                        success = true;
                    }
                    break;
                }
                case 'note': {
                    const classroom = state.classrooms[r.classroomName];
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
                `آیا از حذف دائمی این آیتم مطمئن هستید؟ این عمل غیرقابل بازگشت است.`,
                () => {
                    const r = entry.restoreData;
                    switch (entry.type) {
                        case 'classroom': delete state.classrooms[r.name]; break;
                        case 'student': permanentlyDeleteStudent({ identity: { studentId: r.studentId } }, state.classrooms[r.classroomName]); break;
                        case 'session': permanentlyDeleteSession(r.classroomName, r.sessionNumber); break;
                        case 'category': permanentlyDeleteCategory(r.classroomName, r.categoryId); break;
                        case 'score': permanentlyDeleteScore(r.classroomName, r.studentId, r.skill, r.scoreId); break;
                        case 'note': permanentlyDeleteNote(r.classroomName, r.studentId, r.noteId); break;
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
