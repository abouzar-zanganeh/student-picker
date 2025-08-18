import * as state from './state.js';
import { getActiveItems } from './state.js';
import { detectTextDirection, renderMultiLineText } from './utils.js';

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
export const attendanceClassNameHeader = document.getElementById('attendance-class-name-header');
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
export const saveNoteBtn = document.getElementById('save-note-btn');
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
export const trashedScoreCommentsList = document.getElementById('trashed-score-comments-list');
export const quickGradeFormWrapper = document.getElementById('quick-grade-form-wrapper');
export const quickScoreInput = document.getElementById('quick-score-input');
export const quickNoteTextarea = document.getElementById('quick-note-textarea');
export const quickGradeSubmitBtn = document.getElementById('quick-grade-submit-btn');
const classNameHeader = document.getElementById('class-name-header');
const categoryPillsContainer = document.getElementById('category-selection-container');
const resultDiv = document.getElementById('selected-student-result');
export const contextMenu = document.getElementById('custom-context-menu');


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
        onCancel = null,
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

export function renderAttendancePage() {
    if (!state.currentClassroom || !state.selectedSession) return;

    attendanceClassNameHeader.textContent = `حضور و غیاب کلاس: ${state.currentClassroom.info.name}`;
    attendanceListUl.innerHTML = '';

    getActiveItems(state.currentClassroom.students).forEach(student => {
        const li = document.createElement('li');
        li.className = 'attendance-list-item';

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

        // First, get an array of objects containing the session number and its makeup status
        const absentSessions = state.currentClassroom.sessions
            .filter(session => !session.isDeleted && session.studentRecords[student.identity.studentId]?.attendance === 'absent')
            .map(session => ({
                number: session.sessionNumber,
                isMakeup: session.isMakeup
            }));

        if (absentSessions.length > 0) {
            // Instead of setting textContent, we build the content node by node
            absenceSpan.appendChild(document.createTextNode('جلسات غایب: '));

            absentSessions.forEach((sessionInfo, index) => {
                const numberSpan = document.createElement('span');
                numberSpan.textContent = sessionInfo.number;

                // Apply our new class if the session was a makeup
                if (sessionInfo.isMakeup) {
                    numberSpan.classList.add('makeup-absence');
                }
                absenceSpan.appendChild(numberSpan);

                // Add a comma separator, but not after the last number
                if (index < absentSessions.length - 1) {
                    absenceSpan.appendChild(document.createTextNode('، '));
                }
            });
        } else {
            absenceSpan.textContent = 'جلسات غایب: بدون غیبت';
        }

        infoDiv.appendChild(nameSpan);
        infoDiv.appendChild(absenceSpan);

        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'attendance-button-group';

        const presentBtn = document.createElement('button');
        presentBtn.textContent = 'حاضر';
        presentBtn.className = 'attendance-status-btn present';

        const absentBtn = document.createElement('button');
        absentBtn.textContent = 'غایب';
        absentBtn.className = 'attendance-status-btn absent';

        const currentStatus = state.selectedSession.studentRecords[student.identity.studentId]?.attendance || 'present';
        if (currentStatus === 'present') {
            presentBtn.classList.add('active');
        } else if (currentStatus === 'absent') {
            absentBtn.classList.add('active');
        }

        const updateAbsenceInfo = () => {
            // Clear the existing content first
            absenceSpan.innerHTML = '';

            // Get full info for each absent session, including makeup status
            const absentSessions = state.currentClassroom.sessions
                .filter(session => !session.isDeleted && session.studentRecords[student.identity.studentId]?.attendance === 'absent')
                .map(session => ({
                    number: session.sessionNumber,
                    isMakeup: session.isMakeup
                }));

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
        };

        presentBtn.addEventListener('click', () => {
            const studentRecord = state.selectedSession.studentRecords[student.identity.studentId];
            if (!studentRecord) return;

            const wasAbsent = studentRecord.attendance === 'absent';
            const hadIssue = studentRecord.hadIssue;



            state.selectedSession.setAttendance(student.identity.studentId, 'present');
            presentBtn.classList.add('active');
            absentBtn.classList.remove('active');
            updateAbsenceInfo();
            state.saveData();
        });

        absentBtn.addEventListener('click', () => {
            const studentRecord = state.selectedSession.studentRecords[student.identity.studentId];
            if (!studentRecord) return;

            const wasPresent = studentRecord.attendance === 'present';

            if (wasPresent) {
                if (studentRecord.hadIssue) {
                    student.statusCounters.otherIssues--;
                    studentRecord.hadIssue = false;
                }
            }

            state.selectedSession.setAttendance(student.identity.studentId, 'absent');
            absentBtn.classList.add('active');
            presentBtn.classList.remove('active');
            updateAbsenceInfo();
            state.saveData();
        });

        buttonGroup.appendChild(presentBtn);
        buttonGroup.appendChild(absentBtn);
        li.appendChild(infoDiv);
        li.appendChild(buttonGroup);
        attendanceListUl.appendChild(li);
    });
}

export function renderStudentStatsList() {
    const tableContainer = document.getElementById('student-stats-table-container');
    if (!tableContainer) return;
    tableContainer.innerHTML = '';

    if (!state.currentClassroom) return;

    const totalStudents = getActiveItems(state.currentClassroom.students).length;
    studentStatsHeader.textContent = `آمار عملکرد دانش‌آموزان -- ${totalStudents} نفر`;

    // --- DYNAMIC HEADER GENERATION ---
    // 1. Define the static part of our headers.
    const staticHeaders = ['نام', 'کل انتخاب ها', 'غیبت', 'فرصت ازدست‌رفته', 'مشکل'];

    // 2. Get the dynamic part by filtering for gradable categories.
    const gradedCategoryHeaders = state.currentClassroom.categories
        .filter(cat => cat.isGradedCategory && !cat.isDeleted)
        .map(cat => cat.name); // e.g., ['Listening', 'Speaking', ...]

    // 3. Combine them to create the final, complete list of headers.
    const allHeaders = [...staticHeaders, ...gradedCategoryHeaders];
    // --- END DYNAMIC HEADER GENERATION ---

    const table = document.createElement('table');
    table.className = 'student-stats-table';

    // Create the header row using our combined list
    const thead = table.createTHead();
    const headerRow = thead.insertRow();
    allHeaders.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
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

        // --- DYNAMIC DATA POPULATION ---
        // 1. Add data for the static columns
        row.insertCell().textContent = student.identity.name;
        row.insertCell().textContent = student.statusCounters.totalSelections || 0;
        row.insertCell().textContent = calculateAbsences(student);
        row.insertCell().textContent = student.statusCounters.missedChances || 0;
        row.insertCell().textContent = student.statusCounters.otherIssues || 0;

        // 2. Loops through our dynamic list of gradable categories to add the rest of the data
        gradedCategoryHeaders.forEach(categoryName => {
            const cell = row.insertCell();
            // The key in categoryCounts is the exact category name (e.g., "Listening")
            cell.textContent = student.categoryCounts[categoryName] || 0;
        });
        // --- END DYNAMIC DATA POPULATION ---
    });

    tableContainer.appendChild(table);
    // --- Adds event listener for the name header toggle ---
    const tableElement = tableContainer.querySelector('.student-stats-table');
    const nameHeader = tableElement?.querySelector('thead th:first-child');

    if (nameHeader) {
        nameHeader.addEventListener('click', () => {
            tableElement.classList.toggle('name-column-expanded');
        });
    }
}

export function displayWinner() {
    const resultDiv = document.getElementById('selected-student-result');
    resultDiv.innerHTML = '';
    resultDiv.classList.remove('absent');

    // Check if there's a valid history entry to display
    if (!state.selectedSession || state.winnerHistoryIndex < 0 || !state.selectedSession.winnerHistory[state.winnerHistoryIndex]) {
        return;
    }

    // Get the current winner from the session's history based on the index
    const historyEntry = state.selectedSession.winnerHistory[state.winnerHistoryIndex];
    const { winner, categoryName } = historyEntry;

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
    nameContainer.style.display = 'flex';
    nameContainer.style.alignItems = 'center';
    nameContainer.style.justifyContent = 'space-between';
    nameContainer.style.width = '100%';

    const backBtn = document.createElement('button');
    backBtn.className = 'btn-icon';
    backBtn.innerHTML = '◀️';
    backBtn.title = 'برنده قبلی';
    backBtn.classList.toggle('is-disabled', state.winnerHistoryIndex <= 0);
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
    winnerNameEl.innerHTML = `✨ <strong>${winner.identity.name}</strong>✨`;
    winnerNameEl.classList.add('heartbeat-animation');
    if (isAbsent) {
        winnerNameEl.style.textDecoration = 'line-through';
        winnerNameEl.style.opacity = '0.6';
    }

    const forwardBtn = document.createElement('button');
    forwardBtn.className = 'btn-icon';
    forwardBtn.innerHTML = '▶️';
    forwardBtn.title = 'برنده بعدی';
    forwardBtn.classList.toggle('is-disabled', state.winnerHistoryIndex >= state.selectedSession.winnerHistory.length - 1);
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
    selectStudentBtn.disabled = !forwardBtn.classList.contains('is-disabled');

    // --- Status Buttons (absent, issue, profile) ---
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'status-button-container';

    const absentBtn = document.createElement('button');
    absentBtn.textContent = 'غایب';
    absentBtn.className = 'status-button';
    if (isAbsent) absentBtn.classList.add('active');

    const issueBtn = document.createElement('button');
    issueBtn.textContent = 'مشکل';
    issueBtn.className = 'status-button';
    if (studentRecord?.hadIssue) issueBtn.classList.add('active');

    const profileBtn = document.createElement('button');
    profileBtn.textContent = 'پروفایل / نمره‌دهی';
    profileBtn.className = 'status-button profile-btn';

    absentBtn.addEventListener('click', () => {
        const isCurrentlyActive = absentBtn.classList.contains('active');

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
        } else {
            absentBtn.classList.remove('active');
            state.selectedSession.setAttendance(winner.identity.studentId, 'present');
            winner.statusCounters.missedChances = Math.max(0, winner.statusCounters.missedChances - 1);
        }
        renderStudentStatsList();
        state.saveData();
    });

    issueBtn.addEventListener('click', () => {
        const isCurrentlyActive = issueBtn.classList.contains('active');

        if (!isCurrentlyActive) {
            if (absentBtn.classList.contains('active')) {
                absentBtn.classList.remove('active');
                state.selectedSession.setAttendance(winner.identity.studentId, 'present');
                winner.statusCounters.missedChances = Math.max(0, winner.statusCounters.missedChances - 1);
            }
            issueBtn.classList.add('active');
            studentRecord.hadIssue = true;
            winner.statusCounters.otherIssues++;
            winner.statusCounters.missedChances++;
        } else {
            issueBtn.classList.remove('active');
            studentRecord.hadIssue = false;
            winner.statusCounters.otherIssues = Math.max(0, winner.statusCounters.otherIssues - 1);
            winner.statusCounters.missedChances = Math.max(0, winner.statusCounters.missedChances - 1);
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
            skillScoresSpan.textContent = scoresForSkill.slice(-3).map(s => s.value).join(', ');
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
    classNameHeader.textContent = `جلسه ${state.selectedSession.sessionNumber} / کلاس: ${state.currentClassroom.info.name}`;
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

    profileStatsSummaryDiv.innerHTML = `
        <p><strong>کل انتخاب:</strong> ${student.statusCounters.totalSelections}</p>
        <p><strong>غیبت:</strong> ${absenceCount}</p>
        <p><strong>فرصت از دست رفته:</strong> ${student.statusCounters.missedChances || 0}</p>
        <p><strong>مشکل فنی:</strong> ${student.statusCounters.otherIssues || 0}</p>
    `;

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
                        score.isDeleted = true;
                        state.saveData();
                        renderStudentProfilePage(); // Re-render to hide the deleted item
                        showNotification('نمره به سطل زباله منتقل شد.');
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
                    note.isDeleted = true;
                    state.saveData();
                    renderStudentNotes(); // Re-render to hide the deleted item
                    showNotification('یادداشت به سطل زباله منتقل شد.');
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
                renderStudentNotes();
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
    if (!classroom.note) {
        noteBtn.style.opacity = '0.3';
    }
    noteBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        newNoteContent.value = classroom.note || '';
        state.setSaveNoteCallback((content) => {
            classroom.note = content;
            state.saveData();
            renderClassList();
        });
        openModal('add-note-modal');
        newNoteContent.focus();
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
        updateSessionPageHeader();
        showPage('session-page');
    });

    return nameContainer;
}

function createClassListItem(classroom) {
    const li = document.createElement('li');

    // Add special styling if there's an active session
    if (classroom.liveSession) {
        li.classList.add('has-unfinished-session');
    }

    // --- 1. Info Container (Name and Counts) ---
    const infoContainer = createClassInfoContainer(classroom);
    li.appendChild(infoContainer);

    // --- 2. Badges Container ---
    const badgesContainer = document.createElement('div');
    badgesContainer.className = 'list-item-badges';

    // 'Unfinished Session' Badge
    if (classroom.liveSession) {
        const warningBadge = document.createElement('span');
        warningBadge.className = 'warning-badge';
        warningBadge.textContent = 'جلسه باز';
        badgesContainer.appendChild(warningBadge);
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
                    state.setCurrentClassroom(classroom);
                    settingsClassNameHeader.textContent = `تنظیمات کلاس: ${state.currentClassroom.info.name}`;
                    renderSettingsStudentList();
                    renderSettingsCategories();
                    showPage('settings-page');
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
                                state.saveData();
                                renderClassList();
                                showNotification(`نام کلاس به «${trimmedNewName}» تغییر یافت.`);
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
                        `آیا از حذف کلاس «${classroom.info.name}» مطمئن هستید؟ این عمل تمام جلسات و آمار مربوط به آن را نیز حذف می‌کند.`,
                        () => {
                            showUndoToast(`کلاس «${classroom.info.name}» حذف شد.`);
                            classroom.isDeleted = true;
                            state.saveData();
                            renderClassList();
                        },
                        { confirmText: 'تایید حذف', confirmClass: 'btn-warning', isDelete: true }
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
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-icon';
        deleteBtn.innerHTML = '🗑️';
        deleteBtn.style.color = 'var(--color-warning)';
        deleteBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            showCustomConfirm(
                `آیا از حذف دانش‌آموز «${student.identity.name}» مطمئن هستید؟`,
                () => {
                    showUndoToast(`دانش‌آموز «${student.identity.name}» حذف شد.`);
                    student.isDeleted = true;
                    state.saveData();
                    renderSettingsStudentList();
                },
                {
                    confirmText: 'تایید حذف',
                    confirmClass: 'btn-warning'
                }
            );
        });
        li.appendChild(nameSpan);
        li.appendChild(deleteBtn);
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
            showUndoToast(`دسته‌بندی «${category.name}» حذف شد.`);
            //marking the category for trash can
            category.isDeleted = true;
            state.saveData();
            renderSettingsCategories();
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
}

export function showPage(pageId) {
    const historyState = {
        pageId,
        currentClassName: state.currentClassroom ? state.currentClassroom.info.name : null,
        selectedSessionNumber: state.selectedSession ? state.selectedSession.sessionNumber : null,
        selectedStudentId: state.selectedStudentForProfile ? state.selectedStudentForProfile.identity.studentId : null,
    };

    const currentState = history.state;
    if (!currentState ||
        currentState.pageId !== historyState.pageId ||
        currentState.currentClassName !== historyState.currentClassName ||
        currentState.selectedSessionNumber !== historyState.selectedSessionNumber ||
        currentState.selectedStudentId !== historyState.selectedStudentId) {
        history.pushState(historyState, '', `#${pageId}`);
    }

    _internalShowPage(pageId);
}

// Reactored rendersessions sub functions

function createSessionActionButtons(session, activeSessions) {
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'list-item-buttons';

    // --- Add the note Button ---
    const noteBtn = document.createElement('button');
    noteBtn.className = 'btn-icon';
    noteBtn.innerHTML = '📝';
    noteBtn.title = 'افزودن/ویرایش یادداشت جلسه';

    if (!session.note) {
        noteBtn.style.opacity = '0.3';
    }

    noteBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        newNoteContent.value = session.note || '';
        state.setSaveNoteCallback((content) => {
            session.note = content;
            state.saveData();
            renderSessions();
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
                `آیا از خاتمه دادن جلسه ${activeSessions.indexOf(session) + 1} مطمئن هستید؟`,
                () => {
                    state.currentClassroom.endSpecificSession(session.sessionNumber);
                    state.saveData();
                    renderSessions();
                },
                { confirmText: 'بله', confirmClass: 'btn-success' }
            );
        });
        buttonsContainer.appendChild(endSessionBtn);
    }

    return buttonsContainer;
}

function createSessionInfoContainer(session, activeSessions) {
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
        sessionText.textContent = `جلسه لغو شده - تاریخ: ${sessionDate}`;
        infoContainer.style.cursor = 'default';
        const cancelledBadge = document.createElement('span');
        cancelledBadge.className = 'type-badge cancelled-badge';
        cancelledBadge.textContent = 'لغو شده';
        badgesContainer.appendChild(cancelledBadge);
    } else {
        // Dynamically find the session's display number
        const displaySessionNumber = activeSessions.indexOf(session) + 1;
        sessionText.textContent = `جلسه ${displaySessionNumber} - تاریخ: ${sessionDate}`;
        infoContainer.style.cursor = 'pointer';
        infoContainer.addEventListener('click', () => {
            state.setSelectedSession(session);
            renderStudentPage();
        });
    }

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

function createSessionListItem(session, activeSessions) {
    const li = document.createElement('li');

    const infoContainer = createSessionInfoContainer(session, activeSessions);
    li.appendChild(infoContainer);

    const buttonsContainer = createSessionActionButtons(session, activeSessions);
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
                        if (session.isCancelled) {
                            session.isFinished = true;
                        } else {
                            session.isFinished = false;
                        }
                        state.saveData();
                        renderSessions();
                        showNotification(session.isCancelled ? 'جلسه لغو شد.' : 'جلسه بازگردانی شد.');
                    }, { confirmText: actionText, confirmClass: 'btn-warning' });
                }
            },
            {
                label: 'تغییر وضعیت جبرانی',
                icon: '🔄',
                action: () => {
                    state.currentClassroom.markAsMakeup(session.sessionNumber);
                    state.saveData();
                    renderSessions();
                }
            },
            {
                label: 'حذف جلسه',
                icon: '🗑️',
                className: 'danger', // This will style the item in red
                action: () => {
                    const displayNumText = session.isCancelled ? 'لغو شده' : `${activeSessions.indexOf(session) + 1}`;
                    showCustomConfirm(
                        `آیا از حذف جلسه ${displayNumText} مطمئن هستید؟ این عمل آمار ثبت شده در این جلسه را نیز حذف می‌کند.`,
                        () => {
                            showUndoToast(`جلسه ${displayNumText} حذف شد.`);
                            session.isDeleted = true;
                            state.saveData();
                            renderSessions();
                        },
                        { confirmText: 'تایید حذف', confirmClass: 'btn-warning', isDelete: true }
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
    const sessionClassNameHeader = document.getElementById('session-class-name-header');

    if (!state.currentClassroom) return;

    sessionClassNameHeader.textContent = `کلاس: ${state.currentClassroom.info.name}`;
    sessionListUl.innerHTML = '';

    if (state.currentClassroom.sessions.length === 0) {
        sessionListUl.innerHTML = '<li>هنوز جلسه‌ای شروع نشده است.</li>';
        return;
    }

    // Get active sessions for correct numbering
    const activeSessions = getActiveItems(state.currentClassroom.sessions)
        .filter(s => !s.isCancelled)
        .sort((a, b) => a.sessionNumber - b.sessionNumber);

    // Get all non-deleted sessions to render, and reverse them for display order
    const reversedSessions = [...getActiveItems(state.currentClassroom.sessions)].reverse();

    reversedSessions.forEach(session => {
        const li = createSessionListItem(session, activeSessions);
        sessionListUl.appendChild(li);
    });
}

export function updateSessionPageHeader() {
    const sessionClassNameHeader = document.getElementById('session-class-name-header');
    if (state.currentClassroom) {
        sessionClassNameHeader.textContent = `کلاس: ${state.currentClassroom.info.name}`;
    }
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

            resultDiv.appendChild(studentNameSpan);
            resultDiv.appendChild(classNameSpan);

            resultDiv.addEventListener('click', () => {
                state.setCurrentClassroom(result.classroom);
                state.setSelectedStudentForProfile(result.student);
                renderStudentProfilePage();
                showPage('student-profile-page');
                globalStudentSearchResultsDiv.style.display = 'none';
                globalStudentSearchInput.value = '';
            });

            globalStudentSearchResultsDiv.appendChild(resultDiv);
        });
        globalStudentSearchResultsDiv.style.display = 'block';
    } else {
        // This logic now mirrors the other search function perfectly.
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
    // Clear previous lists
    trashedClassesList.innerHTML = '';
    trashedStudentsList.innerHTML = '';
    trashedSessionsList.innerHTML = '';
    trashedCategoriesList.innerHTML = '';
    trashedNotesList.innerHTML = '';
    trashedScoreCommentsList.innerHTML = '';

    // --- Render Trashed Classes ---
    const trashedClasses = Object.values(state.classrooms).filter(c => c.isDeleted);
    if (trashedClasses.length === 0) {
        trashedClassesList.innerHTML = '<li>هیچ کلاسی در سطل زباله نیست.</li>';
    } else {
        trashedClasses.forEach(classroom => {
            //rendering logic for classes
            const li = document.createElement('li');
            li.innerHTML = `<span>${classroom.info.name}</span>`;
            const buttonsContainer = document.createElement('div');
            buttonsContainer.className = 'list-item-buttons';
            const restoreBtn = document.createElement('button');
            restoreBtn.className = 'btn-icon';
            restoreBtn.innerHTML = '🔄';
            restoreBtn.title = 'بازیابی';
            restoreBtn.addEventListener('click', () => {
                classroom.isDeleted = false;
                state.saveData();
                renderTrashPage();
                renderClassList();
                showNotification(`کلاس «${classroom.info.name}» بازیابی شد.`);
            });
            const permanentDeleteBtn = document.createElement('button');
            permanentDeleteBtn.className = 'btn-icon';
            permanentDeleteBtn.innerHTML = '🔥';
            permanentDeleteBtn.title = 'حذف دائمی';
            permanentDeleteBtn.addEventListener('click', () => {
                showCustomConfirm(
                    `آیا از حذف دائمی کلاس «${classroom.info.name}» مطمئن هستید؟ این عمل غیرقابل بازگشت است.`,
                    () => {
                        delete state.classrooms[classroom.info.name];
                        state.saveData();
                        renderTrashPage();
                        showNotification(`کلاس «${classroom.info.name}» برای همیشه حذف شد.`);
                    },
                    { confirmText: 'حذف دائمی', confirmClass: 'btn-warning' }
                );
            });
            buttonsContainer.appendChild(restoreBtn);
            buttonsContainer.appendChild(permanentDeleteBtn);
            li.appendChild(buttonsContainer);
            trashedClassesList.appendChild(li);
        });
    }

    // --- Render Trashed Students ---
    const trashedStudents = [];
    Object.values(state.classrooms).forEach(classroom => {
        if (!classroom.isDeleted) {
            classroom.students.forEach(student => {
                if (student.isDeleted) {
                    trashedStudents.push({ student, classroom });
                }
            });
        }
    });

    if (trashedStudents.length === 0) {
        trashedStudentsList.innerHTML = '<li>هیچ دانش‌آموزی در سطل زباله نیست.</li>';
    } else {
        trashedStudents.forEach(({ student, classroom }) => {
            // rendering logic for students ...
            const li = document.createElement('li');
            li.innerHTML = `<span>${student.identity.name} <small>(از کلاس: ${classroom.info.name})</small></span>`;
            const buttonsContainer = document.createElement('div');
            buttonsContainer.className = 'list-item-buttons';
            const restoreBtn = document.createElement('button');
            restoreBtn.className = 'btn-icon';
            restoreBtn.innerHTML = '🔄';
            restoreBtn.title = 'بازیابی';
            restoreBtn.addEventListener('click', () => {
                student.isDeleted = false;
                state.saveData();
                renderTrashPage();
                showNotification(`دانش‌آموز «${student.identity.name}» بازیابی شد.`);
            });
            const permanentDeleteBtn = document.createElement('button');
            permanentDeleteBtn.className = 'btn-icon';
            permanentDeleteBtn.innerHTML = '🔥';
            permanentDeleteBtn.title = 'حذف دائمی';
            permanentDeleteBtn.addEventListener('click', () => {
                showCustomConfirm(
                    `آیا از حذف دائمی دانش‌آموز «${student.identity.name}» مطمئن هستید؟ این عمل غیرقابل بازگشت است.`,
                    () => {
                        const studentIndex = classroom.students.findIndex(s => s.identity.studentId === student.identity.studentId);
                        if (studentIndex > -1) {
                            classroom.students.splice(studentIndex, 1);
                        }
                        state.saveData();
                        renderTrashPage();
                        showNotification(`دانش‌آموز «${student.identity.name}» برای همیشه حذف شد.`);
                    },
                    { confirmText: 'حذف دائمی', confirmClass: 'btn-warning' }
                );
            });
            buttonsContainer.appendChild(restoreBtn);
            buttonsContainer.appendChild(permanentDeleteBtn);
            li.appendChild(buttonsContainer);
            trashedStudentsList.appendChild(li);
        });
    }

    // --- Render Trashed Sessions ---
    const trashedSessions = [];
    Object.values(state.classrooms).forEach(classroom => {
        if (!classroom.isDeleted) {
            classroom.sessions.forEach(session => {
                if (session.isDeleted) {
                    trashedSessions.push({ session, classroom });
                }
            });
        }
    });

    if (trashedSessions.length === 0) {
        trashedSessionsList.innerHTML = '<li>هیچ جلسه‌ای در سطل زباله نیست.</li>';
    } else {
        trashedSessions.forEach(({ session, classroom }) => {
            const li = document.createElement('li');
            li.innerHTML = `<span>جلسه ${session.sessionNumber} <small>(از کلاس: ${classroom.info.name})</small></span>`;
            const buttonsContainer = document.createElement('div');
            buttonsContainer.className = 'list-item-buttons';
            const restoreBtn = document.createElement('button');
            restoreBtn.className = 'btn-icon';
            restoreBtn.innerHTML = '🔄';
            restoreBtn.title = 'بازیابی';
            restoreBtn.addEventListener('click', () => {
                session.isDeleted = false;
                state.saveData();
                renderTrashPage();
                showNotification(`جلسه ${session.sessionNumber} بازیابی شد.`);
            });
            const permanentDeleteBtn = document.createElement('button');
            permanentDeleteBtn.className = 'btn-icon';
            permanentDeleteBtn.innerHTML = '🔥';
            permanentDeleteBtn.title = 'حذف دائمی';
            permanentDeleteBtn.addEventListener('click', () => {
                showCustomConfirm(
                    `آیا از حذف دائمی جلسه ${session.sessionNumber} مطمئن هستید؟`,
                    () => {
                        const sessionIndex = classroom.sessions.findIndex(s => s.sessionNumber === session.sessionNumber);
                        if (sessionIndex > -1) {
                            classroom.sessions.splice(sessionIndex, 1);
                        }
                        state.saveData();
                        renderTrashPage();
                        showNotification(`جلسه ${session.sessionNumber} برای همیشه حذف شد.`);
                    },
                    { confirmText: 'حذف دائمی', confirmClass: 'btn-warning' }
                );
            });
            buttonsContainer.appendChild(restoreBtn);
            buttonsContainer.appendChild(permanentDeleteBtn);
            li.appendChild(buttonsContainer);
            trashedSessionsList.appendChild(li);
        });
    }

    // --- Render Trashed Categories ---
    const trashedCategories = [];
    Object.values(state.classrooms).forEach(classroom => {
        if (!classroom.isDeleted) {
            classroom.categories.forEach(category => {
                if (category.isDeleted) {
                    trashedCategories.push({ category, classroom });
                }
            });
        }
    });

    if (trashedCategories.length === 0) {
        trashedCategoriesList.innerHTML = '<li>هیچ دسته‌بندی در سطل زباله نیست.</li>';
    } else {
        trashedCategories.forEach(({ category, classroom }) => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${category.name} <small>(از کلاس: ${classroom.info.name})</small></span>`;
            const buttonsContainer = document.createElement('div');
            buttonsContainer.className = 'list-item-buttons';
            const restoreBtn = document.createElement('button');
            restoreBtn.className = 'btn-icon';
            restoreBtn.innerHTML = '🔄';
            restoreBtn.title = 'بازیابی';
            restoreBtn.addEventListener('click', () => {
                category.isDeleted = false;
                state.saveData();
                renderTrashPage();
                showNotification(`دسته‌بندی «${category.name}» بازیابی شد.`);
            });
            const permanentDeleteBtn = document.createElement('button');
            permanentDeleteBtn.className = 'btn-icon';
            permanentDeleteBtn.innerHTML = '🔥';
            permanentDeleteBtn.title = 'حذف دائمی';
            permanentDeleteBtn.addEventListener('click', () => {
                showCustomConfirm(
                    `آیا از حذف دائمی دسته‌بندی «${category.name}» مطمئن هستید؟`,
                    () => {
                        const categoryIndex = classroom.categories.findIndex(c => c.id === category.id);
                        if (categoryIndex > -1) {
                            classroom.categories.splice(categoryIndex, 1);
                        }
                        state.saveData();
                        renderTrashPage();
                        showNotification(`دسته‌بندی «${category.name}» برای همیشه حذف شد.`);
                    },
                    { confirmText: 'حذف دائمی', confirmClass: 'btn-warning' }
                );
            });
            buttonsContainer.appendChild(restoreBtn);
            buttonsContainer.appendChild(permanentDeleteBtn);
            li.appendChild(buttonsContainer);
            trashedCategoriesList.appendChild(li);
        });
    }
    // --- Render Trashed Notes ---
    const trashedNotes = [];
    Object.values(state.classrooms).forEach(classroom => {
        if (!classroom.isDeleted) {
            classroom.students.forEach(student => {
                if (!student.isDeleted) {
                    student.profile.notes.forEach(note => {
                        if (note.isDeleted) {
                            trashedNotes.push({ note, student, classroom });
                        }
                    });
                }
            });
        }
    });

    if (trashedNotes.length === 0) {
        trashedNotesList.innerHTML = '<li>هیچ یادداشتی در سطل زباله نیست.</li>';
    } else {
        trashedNotes.forEach(({ note, student, classroom }) => {
            const li = document.createElement('li');
            const previewText = note.content.length > 50 ? note.content.substring(0, 50) + '...' : note.content;
            li.innerHTML = `<span>"${previewText}" <small>(برای: ${student.identity.name}، کلاس: ${classroom.info.name})</small></span>`;

            const buttonsContainer = document.createElement('div');
            buttonsContainer.className = 'list-item-buttons';

            const restoreBtn = document.createElement('button');
            restoreBtn.className = 'btn-icon';
            restoreBtn.innerHTML = '🔄';
            restoreBtn.title = 'بازیابی';
            restoreBtn.addEventListener('click', () => {
                note.isDeleted = false;
                state.saveData();
                renderTrashPage(); // Refresh the trash page
                showNotification(`یادداشت بازیابی شد.`);
            });

            const permanentDeleteBtn = document.createElement('button');
            permanentDeleteBtn.className = 'btn-icon';
            permanentDeleteBtn.innerHTML = '🔥';
            permanentDeleteBtn.title = 'حذف دائمی';
            permanentDeleteBtn.addEventListener('click', () => {
                showCustomConfirm(
                    `آیا از حذف دائمی این یادداشت مطمئن هستید؟ این عمل غیرقابل بازگشت است.`,
                    () => {
                        const noteIndex = student.profile.notes.findIndex(n => n.id === note.id);
                        if (noteIndex > -1) {
                            student.profile.notes.splice(noteIndex, 1);
                        }
                        state.saveData();
                        renderTrashPage();
                        showNotification(`یادداشت برای همیشه حذف شد.`);
                    },
                    { confirmText: 'حذف دائمی', confirmClass: 'btn-warning' }
                );
            });

            buttonsContainer.appendChild(restoreBtn);
            buttonsContainer.appendChild(permanentDeleteBtn);
            li.appendChild(buttonsContainer);
            trashedNotesList.appendChild(li);
        });
    }

    // --- Render Trashed Score Comments ---
    const trashedScoreComments = [];
    Object.values(state.classrooms).forEach(classroom => {
        if (!classroom.isDeleted) {
            classroom.students.forEach(student => {
                if (!student.isDeleted) {
                    // Scores are nested under skill keys, so we must loop through them
                    for (const skill in student.logs.scores) {
                        student.logs.scores[skill].forEach(score => {
                            // We only care about scores that are deleted AND have a comment
                            if (score.isDeleted && score.comment) {
                                trashedScoreComments.push({ score, student, classroom });
                            }
                        });
                    }
                }
            });
        }
    });

    if (trashedScoreComments.length === 0) {
        trashedScoreCommentsList.innerHTML = '<li>هیچ توضیح نمره‌ای در سطل زباله نیست.</li>';
    } else {
        trashedScoreComments.forEach(({ score, student, classroom }) => {
            const li = document.createElement('li');
            const previewText = score.comment.length > 50 ? score.comment.substring(0, 50) + '...' : score.comment;
            li.innerHTML = `<span>"${previewText}" <small>(برای نمره ${score.value} در مهارت ${score.skill} / دانش‌آموز: ${student.identity.name})</small></span>`;

            const buttonsContainer = document.createElement('div');
            buttonsContainer.className = 'list-item-buttons';

            const restoreBtn = document.createElement('button');
            restoreBtn.className = 'btn-icon';
            restoreBtn.innerHTML = '🔄';
            restoreBtn.title = 'بازیابی';
            restoreBtn.addEventListener('click', () => {
                score.isDeleted = false;
                state.saveData();
                renderTrashPage();
                showNotification(`توضیح نمره بازیابی شد.`);
            });

            const permanentDeleteBtn = document.createElement('button');
            permanentDeleteBtn.className = 'btn-icon';
            permanentDeleteBtn.innerHTML = '🔥';
            permanentDeleteBtn.title = 'حذف دائمی';
            permanentDeleteBtn.addEventListener('click', () => {
                showCustomConfirm(
                    `آیا از حذف دائمی این توضیح مطمئن هستید؟ این عمل غیرقابل بازگشت است.`,
                    () => {
                        const skillKey = score.skill.toLowerCase();
                        const skillScores = student.logs.scores[skillKey];
                        if (skillScores) {
                            const scoreIndex = skillScores.findIndex(s => s.id === score.id);
                            if (scoreIndex > -1) {
                                skillScores.splice(scoreIndex, 1);
                            }
                        }
                        state.saveData();
                        renderTrashPage();
                        showNotification(`توضیح نمره برای همیشه حذف شد.`);
                    },
                    { confirmText: 'حذف دائمی', confirmClass: 'btn-warning' }
                );
            });

            buttonsContainer.appendChild(restoreBtn);
            buttonsContainer.appendChild(permanentDeleteBtn);
            li.appendChild(buttonsContainer);
            trashedScoreCommentsList.appendChild(li);
        });
    }
}