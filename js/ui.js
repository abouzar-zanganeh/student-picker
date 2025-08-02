import * as state from './state.js';

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

    if (isDelete) {
        const firstConfirm = () => {
            showSecureConfirm(message, onConfirm);
        };
        confirmModalMessage.textContent = message;
        confirmModalConfirmBtn.textContent = confirmText;
        confirmModalCancelBtn.textContent = cancelText;
        confirmModalConfirmBtn.className = 'modal-action-btn';
        confirmModalConfirmBtn.classList.add(confirmClass);
        state.setConfirmCallback(firstConfirm);
        state.setCancelCallback(onCancel);
        openModal('custom-confirm-modal');
    } else {
        confirmModalMessage.textContent = message;
        confirmModalConfirmBtn.textContent = confirmText;
        confirmModalCancelBtn.textContent = cancelText;
        confirmModalConfirmBtn.className = 'modal-action-btn';
        confirmModalConfirmBtn.classList.add(confirmClass);
        state.setConfirmCallback(onConfirm);
        state.setCancelCallback(onCancel);
        openModal('custom-confirm-modal');
    }
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
        modal.classList.add('modal-visible');
        state.setActiveModal(modalId);
    }
}

export function closeActiveModal() {
    if (!state.activeModal) return;

    const modal = document.getElementById(state.activeModal);
    const activeModalId = state.activeModal; // Store the ID before we reset the state

    if (modal) {
        // 1. Add the class to trigger the closing animation
        modal.classList.add('modal-closing');

        // 2. Wait for the animation to finish before hiding the modal
        setTimeout(() => {
            modal.classList.remove('modal-visible');
            modal.classList.remove('modal-closing'); // Clean up the animation class

            // 4. Perform original cleanup logic for callbacks
            if (activeModalId === 'custom-confirm-modal') {
                state.setConfirmCallback(null);
                state.setCancelCallback(null);
            }
            if (activeModalId === 'secure-confirm-modal') {
                state.setSecureConfirmCallback(null);
            }

        }, 300); // IMPORTANT: This must match the animation duration (0.3s)
    }

    // 3. Reset the state immediately so another modal can't be opened mid-animation
    state.setActiveModal(null);
}

export function renderAttendancePage() {
    if (!state.currentClassroom || !state.selectedSession) return;

    attendanceClassNameHeader.textContent = `حضور و غیاب کلاس: ${state.currentClassroom.info.name}`;
    attendanceListUl.innerHTML = '';

    state.currentClassroom.students.forEach(student => {
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

        const absentSessions = state.currentClassroom.sessions
            .filter(session => session.studentRecords[student.identity.studentId]?.attendance === 'absent')
            .map(session => `جلسه ${session.sessionNumber}`);

        if (absentSessions.length > 0) {
            absenceSpan.textContent = `غیبت ها: ${absentSessions.join('، ')}`;
        } else {
            absenceSpan.textContent = 'غیبت ها: بدون غیبت';
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
            const updatedAbsentSessions = state.currentClassroom.sessions
                .filter(session => session.studentRecords[student.identity.studentId]?.attendance === 'absent')
                .map(session => `جلسه ${session.sessionNumber}`);

            if (updatedAbsentSessions.length > 0) {
                absenceSpan.textContent = `غیبت ها: ${updatedAbsentSessions.join('، ')}`;
            } else {
                absenceSpan.textContent = 'غیبت ها: بدون غیبت';
            }
        };

        presentBtn.addEventListener('click', () => {
            const studentRecord = state.selectedSession.studentRecords[student.identity.studentId];
            if (!studentRecord) return;

            const wasAbsent = studentRecord.attendance === 'absent';
            const hadIssue = studentRecord.hadIssue;

            if (wasAbsent) {
                student.statusCounters.missedChances = Math.max(0, student.statusCounters.missedChances - 1);
            }
            if (hadIssue) {
                student.statusCounters.missedChances = Math.max(0, student.statusCounters.missedChances - 1);
                student.statusCounters.otherIssues = Math.max(0, student.statusCounters.otherIssues - 1);
                studentRecord.hadIssue = false;
            }

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
                } else {
                    student.statusCounters.missedChances++;
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
    const studentListUl = document.getElementById('student-list');
    studentListUl.innerHTML = '';

    if (!state.currentClassroom) return;

    // Get the total number of students in the current class
    const totalStudents = state.currentClassroom.students.length;

    // Update the header's text to include the student count
    studentStatsHeader.textContent = `آمار عملکرد دانش‌آموزان -- ${totalStudents} نفر`;
    // --- End of new code ---

    const calculateAbsences = (student) => {
        let absenceCount = 0;
        if (state.currentClassroom && state.currentClassroom.sessions) {
            state.currentClassroom.sessions.forEach(session => {
                const record = session.studentRecords[student.identity.studentId];
                if (record && record.attendance === 'absent') {
                    absenceCount++;
                }
            });
        }
        return absenceCount;
    };

    state.currentClassroom.students.forEach(student => {
        const li = document.createElement('li');
        li.className = 'student-list-item';

        const absenceCount = calculateAbsences(student);

        const totalStatsDiv = document.createElement('div');
        totalStatsDiv.className = 'total-stats';
        totalStatsDiv.innerHTML = `
            <span>${student.identity.name}</span>
            <span>کل انتخاب: ${student.statusCounters.totalSelections} | غیبت: ${absenceCount} | فرصت از دست رفته: ${student.statusCounters.missedChances || 0} | مشکل: ${student.statusCounters.otherIssues}</span>
        `;

        const categoryStatsDiv = document.createElement('div');
        categoryStatsDiv.className = 'category-stats';

        if (Object.keys(student.categoryCounts).length > 0) {
            let statsText = '';
            for (const categoryName in student.categoryCounts) {
                const count = student.categoryCounts[categoryName];
                statsText += `${categoryName}: ${count} | `;
            }
            categoryStatsDiv.textContent = statsText.slice(0, -3);
        } else {
            categoryStatsDiv.textContent = 'هنوز در هیچ دسته‌بندی انتخاب نشده است.';
        }

        li.appendChild(totalStatsDiv);
        li.appendChild(categoryStatsDiv);

        totalStatsDiv.addEventListener('click', () => {
            categoryStatsDiv.classList.toggle('visible');
        });

        studentListUl.appendChild(li);
    });
}

export function displayWinner(winner, categoryName) {
    const resultDiv = document.getElementById('selected-student-result');
    resultDiv.innerHTML = '';
    resultDiv.classList.remove('absent');

    const studentRecord = state.selectedSession.studentRecords[winner.identity.studentId];
    const isAbsent = studentRecord?.attendance === 'absent';

    const winnerNameEl = document.createElement('div');
    winnerNameEl.innerHTML = `✨ <strong>${winner.identity.name}</strong>✨`;

    winnerNameEl.classList.add('heartbeat-animation');

    if (isAbsent) {
        winnerNameEl.style.textDecoration = 'line-through';
        winnerNameEl.style.opacity = '0.6';
    }

    resultDiv.appendChild(winnerNameEl);

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
            noteItem.textContent = note.content;
            notesList.appendChild(noteItem);
        });
    } else {
        notesList.innerHTML = '<div class="no-content-message">یادداشتی وجود ندارد.</div>';
    }

    notesDiv.appendChild(notesList);
    detailsContainer.appendChild(notesDiv);
    resultDiv.appendChild(detailsContainer);
}

export function renderStudentPage() {
    const categoryPillsContainer = document.getElementById('category-selection-container');
    const studentListUl = document.getElementById('student-list');
    const classNameHeader = document.getElementById('class-name-header');
    const resultDiv = document.getElementById('selected-student-result');

    if (!state.currentClassroom || !state.selectedSession) {
        showPage('class-management-page');
        return;
    }

    classNameHeader.textContent = `جلسه ${state.selectedSession.sessionNumber} / کلاس: ${state.currentClassroom.info.name}`;
    categoryPillsContainer.innerHTML = '';
    studentListUl.innerHTML = '';
    resultDiv.innerHTML = '';
    selectStudentBtnWrapper.classList.add('disabled-wrapper');

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
            selectStudentBtnWrapper.classList.remove('disabled-wrapper');
        });
        categoryPillsContainer.appendChild(pill);
    });

    if (state.selectedSession.lastUsedCategoryId) {
        const lastCategoryPill = categoryPillsContainer.querySelector(`.pill[data-category-id="${state.selectedSession.lastUsedCategoryId}"]`);
        if (lastCategoryPill) {
            lastCategoryPill.click();
        }
    }

    if (state.selectedSession.lastSelectedWinnerId) {
        const lastWinner = state.currentClassroom.students.find(s => s.identity.studentId === state.selectedSession.lastSelectedWinnerId);
        if (lastWinner && state.selectedCategory) {
            displayWinner(lastWinner, state.selectedCategory.name);
        }
    }

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
            allScores.push(score);
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
            scoreContent.innerHTML = `
                <div class="score-info">
                    <span class="score-date">${new Date(score.timestamp).toLocaleDateString('fa-IR')}</span>
                    <span class="score-value">نمره: <strong>${score.value}</strong></span>
                    <span class="score-skill-badge">${score.skill}</span>
                </div>
                ${score.comment ? `<p class="score-comment"><strong>توضیحات:</strong> ${score.comment}</p>` : ''}
            `;
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn-icon delete-item-btn';
            deleteBtn.innerHTML = '🗑️';
            deleteBtn.title = 'حذف این نمره';
            deleteBtn.addEventListener('click', () => {
                showCustomConfirm(
                    `آیا از حذف نمره ${score.value} برای مهارت ${score.skill} مطمئن هستید؟`,
                    () => {
                        const skillScores = student.logs.scores[score.skill];
                        const scoreIndex = skillScores.findIndex(s => s.id === score.id);
                        if (scoreIndex > -1) {
                            skillScores.splice(scoreIndex, 1);
                            state.saveData();
                            renderStudentProfilePage();
                            showNotification('نمره با موفقیت حذف شد.');
                        }
                    },
                    { confirmText: 'تایید حذف', confirmClass: 'btn-warning', isDelete: true }
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

    const sortedNotes = [...state.selectedStudentForProfile.profile.notes].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    sortedNotes.forEach(note => {
        const li = document.createElement('li');
        li.className = 'note-history-item';
        const noteContent = document.createElement('div');
        noteContent.className = 'item-content';
        noteContent.innerHTML = `
            <div class="note-info">
                <span class="note-date">${new Date(note.timestamp).toLocaleDateString('fa-IR')}</span>
            </div>
            <p class="note-content">${note.content}</p>
        `;
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-icon delete-item-btn';
        deleteBtn.innerHTML = '🗑️';
        deleteBtn.title = 'حذف این یادداشت';
        deleteBtn.addEventListener('click', () => {
            showCustomConfirm(
                `آیا از حذف این یادداشت مطمئن هستید؟`,
                () => {
                    const noteIndex = state.selectedStudentForProfile.profile.notes.findIndex(n => n.id === note.id);
                    if (noteIndex > -1) {
                        state.selectedStudentForProfile.profile.notes.splice(noteIndex, 1);
                        state.saveData();
                        renderStudentNotes();
                        showNotification('یادداشت با موفقیت حذف شد.');
                    }
                },
                { confirmText: 'تایید حذف', confirmClass: 'btn-warning', isDelete: true }
            );
        });
        li.appendChild(noteContent);
        li.appendChild(deleteBtn);
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

export function renderClassList() {
    classListUl.innerHTML = '';
    for (const name in state.classrooms) {
        const classroom = state.classrooms[name];
        const li = document.createElement('li');
        const nameContainer = document.createElement('div');

        nameContainer.style.flexGrow = '1'; // Keep flexGrow on the container

        // Create a span for the class name itself
        const classNameSpan = document.createElement('span');
        classNameSpan.textContent = name;
        classNameSpan.classList.add('class-name-display'); // Add a class for potential future styling

        // Append the class name span to the nameContainer
        nameContainer.appendChild(classNameSpan);

        // Get the number of students and sessions
        const studentCount = classroom.students.length;
        const sessionCount = classroom.sessions.length;

        // Create a new DIV to hold both badges (this will be our inner flex container)
        const statsRowDiv = document.createElement('div');
        statsRowDiv.classList.add('class-stats-row'); // Add a class for styling

        // Create student count span
        const studentCountSpan = document.createElement('span');
        studentCountSpan.textContent = `${studentCount} نفر`;
        studentCountSpan.classList.add('student-count-badge');

        // Create session count span
        const sessionCountSpan = document.createElement('span');
        sessionCountSpan.textContent = `جلسه ${sessionCount}`;
        sessionCountSpan.classList.add('session-count-badge');

        // Append badges to their new container
        statsRowDiv.appendChild(studentCountSpan);
        statsRowDiv.appendChild(sessionCountSpan);

        // Append the stats row container to the nameContainer
        nameContainer.appendChild(statsRowDiv);

        // Make the nameContainer a flex column to stack the name and the stats row
        nameContainer.style.display = 'flex';
        nameContainer.style.flexDirection = 'column';
        nameContainer.style.alignItems = 'flex-start'; // Align content to the right (RTL)
        // --- End of new code ---


        nameContainer.addEventListener('click', () => {
            state.setCurrentClassroom(classroom);
            state.setSelectedSession(null);
            state.setLiveSession(state.currentClassroom.liveSession);
            renderSessions();
            updateSessionPageHeader();
            showPage('session-page');


        });
        const typeBadge = document.createElement('span');
        typeBadge.className = `type-badge ${classroom.info.type}`;
        typeBadge.textContent = classroom.info.type === 'online' ? 'آنلاین' : 'حضوری';
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'list-item-buttons';
        const settingsBtn = document.createElement('button');
        settingsBtn.className = 'btn-icon';
        settingsBtn.innerHTML = '⚙️';
        settingsBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            state.setCurrentClassroom(classroom);
            settingsClassNameHeader.textContent = `تنظیمات کلاس: ${state.currentClassroom.info.name}`;
            renderSettingsStudentList();
            renderSettingsCategories();
            showPage('settings-page');
        });
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-icon';
        deleteBtn.innerHTML = '🗑️';
        deleteBtn.style.color = 'var(--color-warning)';
        deleteBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            showCustomConfirm(
                `آیا از حذف کلاس «${name}» مطمئن هستید؟ این عمل تمام جلسات و آمار مربوط به آن را نیز حذف می‌کند.`,
                () => {
                    showUndoToast(`کلاس «${name}» حذف شد.`);
                    delete state.classrooms[name];
                    state.saveData();
                    renderClassList();
                },
                { confirmText: 'تایید حذف', confirmClass: 'btn-warning', isDelete: true }
            );
        });
        buttonsContainer.appendChild(settingsBtn);
        buttonsContainer.appendChild(deleteBtn);
        li.appendChild(nameContainer);
        li.appendChild(typeBadge);
        li.appendChild(buttonsContainer);
        classListUl.appendChild(li);
    }
}

export function renderSettingsStudentList() {
    settingsStudentListUl.innerHTML = '';
    if (!state.currentClassroom) return;

    state.currentClassroom.students.forEach(student => {
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
            showUndoToast(`دانش‌آموز «${student.identity.name}» حذف شد.`);
            state.currentClassroom.removeStudent(student.identity.studentId);
            state.saveData();
            renderSettingsStudentList();
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
            const categoryIndex = state.currentClassroom.categories.findIndex(c => c.id === category.id);
            if (categoryIndex > -1) {
                state.currentClassroom.categories.splice(categoryIndex, 1);
            }
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

    const reversedSessions = [...state.currentClassroom.sessions].reverse();

    reversedSessions.forEach(session => {
        const li = document.createElement('li');
        const infoContainer = document.createElement('div');
        infoContainer.style.display = 'flex';
        infoContainer.style.flexDirection = 'column';
        infoContainer.style.alignItems = 'flex-start';
        infoContainer.style.flexGrow = '1';
        infoContainer.style.cursor = 'pointer';
        const sessionDate = new Date(session.startTime).toLocaleDateString('fa-IR');
        const sessionText = document.createElement('span');
        sessionText.textContent = `جلسه ${session.sessionNumber} - تاریخ: ${sessionDate}`;
        infoContainer.appendChild(sessionText);
        const badgesContainer = document.createElement('div');
        badgesContainer.style.display = 'flex';
        badgesContainer.style.gap = '5px';
        badgesContainer.style.marginTop = '5px';
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
        li.appendChild(infoContainer);
        infoContainer.addEventListener('click', () => {
            state.setSelectedSession(session);
            renderStudentPage();
        });
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'list-item-buttons';
        const makeupBtn = document.createElement('button');
        makeupBtn.className = 'btn-icon';
        makeupBtn.innerHTML = '🔄';
        makeupBtn.title = 'تغییر وضعیت جبرانی';
        makeupBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            state.currentClassroom.markAsMakeup(session.sessionNumber);
            state.saveData();
            renderSessions();
        });
        buttonsContainer.appendChild(makeupBtn);
        if (!session.isFinished) {
            const endSessionBtn = document.createElement('button');
            endSessionBtn.className = 'btn-icon';
            endSessionBtn.innerHTML = '✅';
            endSessionBtn.title = 'خاتمه جلسه';
            endSessionBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                showCustomConfirm(
                    `آیا از خاتمه دادن جلسه ${session.sessionNumber} مطمئن هستید؟`,
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
        const deleteSessionBtn = document.createElement('button');
        deleteSessionBtn.className = 'btn-icon';
        deleteSessionBtn.innerHTML = '🗑️';
        deleteSessionBtn.title = 'حذف جلسه';
        deleteSessionBtn.style.color = 'var(--color-warning)';
        deleteSessionBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            showCustomConfirm(
                `آیا از حذف جلسه ${session.sessionNumber} مطمئن هستید؟ این عمل آمار ثبت شده در این جلسه را نیز حذف می‌کند.`,
                () => {
                    showUndoToast(`جلسه ${session.sessionNumber} حذف شد.`);
                    const sessionIndex = state.currentClassroom.sessions.findIndex(s => s.sessionNumber === session.sessionNumber);
                    if (sessionIndex > -1) {
                        state.currentClassroom.sessions.splice(sessionIndex, 1);
                        state.saveData();
                        renderSessions();
                    }
                },
                { confirmText: 'تایید حذف', confirmClass: 'btn-warning', isDelete: true }
            );
        });
        buttonsContainer.appendChild(deleteSessionBtn);
        li.appendChild(buttonsContainer);
        sessionListUl.appendChild(li);
    });
}

export function updateSessionPageHeader() {
    const sessionClassNameHeader = document.getElementById('session-class-name-header');
    if (state.currentClassroom) {
        sessionClassNameHeader.textContent = `کلاس: ${state.currentClassroom.info.name}`;
    }
}

export function renderSearchResults(searchTerm = '') {
    if (!state.currentClassroom) return;

    const filteredStudents = state.currentClassroom.students.filter(student =>
        student.identity.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
    } else {
        const noResultsDiv = document.createElement('div');
        noResultsDiv.className = 'no-results';
        noResultsDiv.textContent = 'پیدا نشد';
        studentSearchResultsDiv.appendChild(noResultsDiv);
    }

    studentSearchResultsDiv.style.display = 'block';
}
export function renderGlobalSearchResults(results) {
    globalStudentSearchResultsDiv.innerHTML = '';

    if (results.length === 0) {
        globalStudentSearchResultsDiv.style.display = 'none';
        return;
    }

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
}
