// =================================================================
//  بخش ۱: تعریف کلاس‌ها (بلوپرینت‌های معماری جدید )
// =================================================================

class Student {
    constructor(identityInfo) {
        this.identity = {
            name: identityInfo.name,
            studentId: identityInfo.studentId || `id_${new Date().getTime()}_${Math.random()}`,
            branchName: identityInfo.branchName || null,
            ageGroup: identityInfo.ageGroup || 'adult',
            level: identityInfo.level || null,
            contact: {
                social: identityInfo.socialContact || null,
                parent: identityInfo.parentContact || null,
            }
        };
        this.statusCounters = {
            totalSelections: 0,
            missedChances: 0,
            otherIssues: 0,
            earlyLeaves: 0,
        };

        this.categoryCounts = {}; // آبجکت جدید برای شمارش انتخاب‌ها بر اساس دسته‌بندی

        this.logs = {
            parentContacts: [],
            scores: {},
            discipline: [],
            sessionHistory: {},
        };
        this.profile = {
            notes: [],
            tags: [],
        };
        this.finalClassActivityScore = null;
    }

    addScore(skill, value, comment) {
        if (!this.logs.scores[skill]) {
            this.logs.scores[skill] = [];
        }
        const newScore = new Score(skill, value, comment);
        this.logs.scores[skill].push(newScore);
    }

    addNote(content) {
        const newNote = new Note(content);
        this.profile.notes.push(newNote);
    }
}

class Score {
    constructor(skill, value, comment = '') {
        this.id = `score_${new Date().getTime()}`;
        this.skill = skill;
        this.value = value;
        this.timestamp = new Date();
        this.comment = comment;
    }
}

class Note {
    constructor(content) {
        this.id = `note_${new Date().getTime()}`;
        this.timestamp = new Date();
        this.content = content;
    }
}

class Session {
    constructor(sessionNumber) {
        this.sessionNumber = sessionNumber;
        this.startTime = new Date();
        this.endTime = null;
        this.isFinished = false;
        this.isMakeup = false;
        this.studentRecords = {};
        this.lastWinnerByCategory = {};
        this.lastUsedCategoryId = null;
        this.lastSelectedWinnerId = null;
    }

    end() {
        this.isFinished = true;
        this.endTime = new Date();
    }

    markAsMakeup() {
        this.isMakeup = !this.isMakeup;
    }

    initializeStudentRecord(studentId) {
        if (!this.studentRecords[studentId]) {
            this.studentRecords[studentId] = {
                attendance: 'present',
                homework: 'complete',
                selections: {},
                hadIssue: false,

            };
        }
    }

    setAttendance(studentId, status) {
        this.initializeStudentRecord(studentId);
        this.studentRecords[studentId].attendance = status;
    }

    setHomeworkStatus(studentId, status) {
        this.initializeStudentRecord(studentId);
        this.studentRecords[studentId].homework = status;
    }

    selectNextWinner(categoryName, studentList) {
        if (!studentList || studentList.length === 0) {
            console.log("هیچ دانش‌آموزی در کلاس برای انتخاب وجود ندارد.");
            return null;
        }

        const lastWinnerId = this.lastWinnerByCategory[categoryName];
        let candidates = studentList.filter(s => s.identity.studentId !== lastWinnerId);
        if (candidates.length === 0) {
            candidates = studentList;
        }

        const getSelectionCount = (student) => {
            const record = this.studentRecords[student.identity.studentId];
            return (record && record.selections && record.selections[categoryName]) || 0;
        };

        let minCount = Infinity;
        let maxCount = 0;
        candidates.forEach(s => {
            const count = getSelectionCount(s);
            if (count < minCount) minCount = count;
            if (count > maxCount) maxCount = count;
        });

        let absoluteMaxCount = 0;
        studentList.forEach(s => {
            const count = getSelectionCount(s);
            if (count > absoluteMaxCount) absoluteMaxCount = count;
        });

        let allowedGap = 1;
        if (absoluteMaxCount >= 10) allowedGap = 2;
        if (absoluteMaxCount >= 30) allowedGap = 3;

        let selectionPool = [];
        if (maxCount - minCount >= allowedGap && candidates.length > 1) {
            selectionPool = candidates.filter(s => getSelectionCount(s) === minCount);
        } else {
            candidates.forEach(s => {
                const count = getSelectionCount(s);
                const weight = (maxCount - count) + 1;
                for (let i = 0; i < weight; i++) {
                    selectionPool.push(s);
                }
            });
        }

        if (selectionPool.length === 0) selectionPool = candidates;

        const winner = selectionPool[Math.floor(Math.random() * selectionPool.length)];
        const winnerId = winner.identity.studentId;

        this.initializeStudentRecord(winnerId);
        this.studentRecords[winnerId].selections[categoryName] = getSelectionCount(winner) + 1;

        winner.statusCounters.totalSelections++;
        winner.categoryCounts[categoryName] = (winner.categoryCounts[categoryName] || 0) + 1;

        this.lastWinnerByCategory[categoryName] = winnerId;

        return winner;
    }
}

class Classroom {
    constructor(info) {
        this.info = {
            name: info.name,
            scheduleCode: info.scheduleCode || `code_${new Date().getTime()}`,
            teacherName: info.teacherName || null,
            type: info.type || 'in-person',
            term: info.term || null,
            scheduleText: info.scheduleText || null,
            level: info.level || null,
            creationDate: new Date(),
        };
        this.students = [];
        this.sessions = [];
        this.categories = [
            new Category('Vocabulary'),
            new Category('Grammar'),
            new Category('Speaking')
        ];
        this.futurePlans = {};
    }

    addStudent(studentInstance) {
        this.students.push(studentInstance);
    }

    removeStudent(studentId) {
        this.students = this.students.filter(s => s.identity.studentId !== studentId);
    }

    startNewSession() {
        const sessionNumber = this.sessions.length + 1;
        const newSession = new Session(sessionNumber);
        this.sessions.push(newSession);
        return newSession;
    }

    endSpecificSession(sessionNumber) {
        const sessionToEnd = this.getSession(sessionNumber);
        if (sessionToEnd && !sessionToEnd.isFinished) {
            sessionToEnd.end();
            return true;
        }
        return false;
    }

    getSession(sessionNumber) {
        return this.sessions.find(s => s.sessionNumber === sessionNumber);
    }

    markAsMakeup(sessionNumber) {
        const session = this.getSession(sessionNumber);
        if (session) {
            session.markAsMakeup();
        }
    }

    planForSession(sessionNumber, planText) {
        this.futurePlans[sessionNumber] = planText;
    }

    selectNextWinner(category) {
        const liveSession = this.liveSession;
        if (liveSession) {
            return liveSession.selectNextWinner(category, this.students);
        }
        return null;
    }

    get liveSession() {
        for (let i = this.sessions.length - 1; i >= 0; i--) {
            if (!this.sessions[i].isFinished) {
                return this.sessions[i];
            }
        }
        return null;
    }

    endLiveSession() {
        const sessionToEnd = this.liveSession;
        if (sessionToEnd) {
            sessionToEnd.end();
            return true;
        }
        return false;
    }

    calculateFinalStudentScore(student) {
        const scores = student.logs.scores;
        const requiredSkills = ['listening', 'speaking', 'reading', 'writing'];
        for (const skill of requiredSkills) {
            if (!scores[skill] || scores[skill].length === 0) {
                console.log(`محاسبه نمره برای دانش‌آموز «${student.identity.name}» انجام نشد. دلیل: نمره‌ای برای مهارت «${skill}» ثبت نشده است.`);
                return null;
            }
        }
        const getSkillAverage = (skill) => {
            return scores[skill].reduce((a, b) => a + b, 0) / scores[skill].length;
        };
        const listeningAvg = getSkillAverage('listening');
        const speakingAvg = getSkillAverage('speaking');
        const readingAvg = getSkillAverage('reading');
        const writingAvg = getSkillAverage('writing');
        const combinedListeningSpeakingAvg = (listeningAvg + speakingAvg) / 2;
        const numerator = (combinedListeningSpeakingAvg * 3) + (readingAvg * 2) + (writingAvg * 1);
        const finalScore = numerator / 6;
        return Math.round(finalScore * 100) / 100;
    }

    assignAllFinalScores() {
        let successCount = 0;
        let failedStudentsNames = [];
        console.log("شروع عملیات محاسبه نمره نهایی برای تمام دانش‌آموزان...");
        this.students.forEach(student => {
            const calculatedScore = this.calculateFinalStudentScore(student);
            if (calculatedScore !== null) {
                student.finalClassActivityScore = calculatedScore;
                successCount++;
            } else {
                student.finalClassActivityScore = null;
                failedStudentsNames.push(student.identity.name);
            }
        });
        const failedCount = failedStudentsNames.length;
        console.log(`عملیات پایان یافت. تعداد نمرات موفق: ${successCount} | تعداد ناموفق (نمرات ناقص): ${failedCount}`);
        if (failedCount > 0) {
            console.log("اسامی دانش‌آموزانی که نمراتشان ناقص است:");
            failedStudentsNames.forEach(name => console.log(`- ${name}`));
        }
    }
}

class Category {
    constructor(name, description = '') {
        this.id = `cat_${new Date().getTime()}_${Math.random()}`;
        this.name = name;
        this.description = description;
        this.isDeleted = false;
    }
}

// =================================================================
//  بخش ۲: منطق اصلی برنامه، مدیریت وضعیت و رویدادها
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    // --- وضعیت کلی برنامه (Global State) ---
    let classrooms = {}; // آبجکتی برای نگهداری تمام کلاس‌ها بر اساس نام آنها
    let currentClassroom = null; // کلاسی که کاربر در حال کار با آن است
    let liveSession = null; // جلسه زنده‌ای که در حال برگزاری است
    let selectedSession = null; // جلسه‌ای که کاربر برای مشاهده انتخاب کرده
    let selectedStudentForProfile = null; // دانش‌آموزی که پروفایل او در حال مشاهده است
    let previousState = null; // برای ذخیره آخرین وضعیت قبل از حذف
    let undoTimeout = null;   // برای مدیریت زمان‌بندی پیام واگرد
    let namesToImport = []; // آرایه‌ای برای نگهداری موقت اسامی جهت ورود
    let importedFileContent = null; // برای نگهداری محتوای کامل فایل CSV
    let notificationTimeout = null;
    let selectedCategory = null;
    let easterEggClickCount = 0;
    let easterEggLastClickTime = 0;
    let resetEasterEggClickCount = 0;
    let resetEasterEggLastClickTime = 0;
    let confirmCallback = null;
    let cancelCallback = null;



    // --- عناصر HTML ---
    const classManagementPage = document.getElementById('class-management-page');
    const newClassNameInput = document.getElementById('new-class-name');
    const addClassBtn = document.getElementById('add-class-btn');
    const classListUl = document.getElementById('class-list');
    const undoToast = document.getElementById('undo-toast');
    const undoMessage = document.getElementById('undo-message');
    const undoBtn = document.getElementById('undo-btn');
    const settingsPage = document.getElementById('settings-page');
    const settingsClassNameHeader = document.getElementById('settings-class-name-header');
    const settingsStudentListUl = document.getElementById('settings-student-list');
    const categoryListUl = document.getElementById('category-list');
    const backToSessionsBtn = document.getElementById('back-to-sessions-btn');
    const newStudentNameInput = document.getElementById('new-student-name');
    const addStudentBtn = document.getElementById('add-student-btn');
    const pasteArea = document.getElementById('paste-area');
    const processPasteBtn = document.getElementById('process-paste-btn');
    const csvPreviewPage = document.getElementById('csv-preview-page');
    const csvPreviewList = document.getElementById('csv-preview-list');
    const csvConfirmBtn = document.getElementById('csv-confirm-btn');
    const csvCancelBtn = document.getElementById('csv-cancel-btn');
    const importCsvBtn = document.getElementById('import-csv-btn');
    const csvFileInput = document.getElementById('csv-file-input');
    const columnMappingPage = document.getElementById('column-mapping-page');
    const columnSelectDropdown = document.getElementById('column-select-dropdown');
    const confirmColumnBtn = document.getElementById('confirm-column-btn');
    const cancelImportBtn = document.getElementById('cancel-import-btn');
    const newCategoryNameInput = document.getElementById('new-category-name');
    const addCategoryBtn = document.getElementById('add-category-btn');
    const appHeader = document.querySelector('.app-header');
    const selectStudentBtn = document.getElementById('select-student-btn');
    const selectStudentBtnWrapper = document.getElementById('select-student-btn-wrapper');
    const attendancePage = document.getElementById('attendance-page');
    const attendanceClassNameHeader = document.getElementById('attendance-class-name-header');
    const attendanceListUl = document.getElementById('attendance-list');
    const finishAttendanceBtn = document.getElementById('finish-attendance-btn');
    const backToSessionsFromAttendanceBtn = document.getElementById('back-to-sessions-from-attendance-btn');
    const backToAttendanceBtn = document.getElementById('back-to-attendance-btn');
    const classListHeader = document.querySelector('#class-management-page h2');
    const studentStatsHeader = document.getElementById('student-stats-header');

    // --- عناصر مودال تایید ---
    const customConfirmModal = document.getElementById('custom-confirm-modal');
    const confirmModalMessage = document.getElementById('confirm-modal-message');
    const confirmModalCancelBtn = document.getElementById('confirm-modal-cancel-btn');
    const confirmModalConfirmBtn = document.getElementById('confirm-modal-confirm-btn');

    // --- عناصر مودال یادداشت ---
    const addNoteModal = document.getElementById('add-note-modal');
    const newNoteContent = document.getElementById('new-note-content');
    const saveNoteBtn = document.getElementById('save-note-btn');
    const cancelNoteBtn = document.getElementById('cancel-note-btn');

    // --- عناصر جستجوی دانش‌آموز ---
    const studentSearchInput = document.getElementById('student-search-input');
    const studentSearchResultsDiv = document.getElementById('student-search-results');

    // --- عناصر صفحه پروفایل دانش‌آموز ---
    const studentProfilePage = document.getElementById('student-profile-page');
    const profileStudentNameHeader = document.getElementById('profile-student-name-header');
    const backToStudentPageBtn = document.getElementById('back-to-student-page-btn');
    const scoreSkillSelectionContainer = document.getElementById('score-skill-selection');
    const newScoreValueInput = document.getElementById('new-score-value');
    const newScoreCommentTextarea = document.getElementById('new-score-comment');
    const addScoreBtn = document.getElementById('add-score-btn');
    const profileStatsSummaryDiv = document.getElementById('profile-stats-summary');
    const profileScoresListUl = document.getElementById('profile-scores-list');


    // --- توابع اصلی داده‌ها (Data Functions) ---
    function saveData() {
        localStorage.setItem('teacherAssistantData_v2', JSON.stringify(classrooms));
    }

    function loadData() {
        const savedData = localStorage.getItem('teacherAssistantData_v2');
        if (savedData) {
            const plainData = JSON.parse(savedData);
            rehydrateData(plainData);
            renderClassList();
        }
    }

    // تابع کلیدی برای تبدیل داده‌های ساده به نمونه‌های کلاس
    function rehydrateData(plainClassrooms) {
        classrooms = {};
        for (const className in plainClassrooms) {
            const plainClass = plainClassrooms[className];

            const classroomInstance = new Classroom(plainClass.info);

            classroomInstance.students = plainClass.students.map(plainStudent => {
                const studentInstance = new Student(plainStudent.identity);
                studentInstance.statusCounters = plainStudent.statusCounters;
                studentInstance.logs = plainStudent.logs;
                // اطمینان از اینکه ساختار scores درست است
                if (!studentInstance.logs.scores) {
                    studentInstance.logs.scores = {};
                }
                studentInstance.profile = plainStudent.profile;
                studentInstance.finalClassActivityScore = plainStudent.finalClassActivityScore;
                studentInstance.categoryCounts = plainStudent.categoryCounts || {};
                return studentInstance;
            });

            classroomInstance.sessions = plainClass.sessions.map(plainSession => {
                const sessionInstance = new Session(plainSession.sessionNumber);
                sessionInstance.startTime = new Date(plainSession.startTime);
                sessionInstance.endTime = plainSession.endTime ? new Date(plainSession.endTime) : null;
                sessionInstance.isFinished = plainSession.isFinished;
                sessionInstance.isMakeup = plainSession.isMakeup;
                sessionInstance.studentRecords = plainSession.studentRecords;
                sessionInstance.lastWinnerByCategory = plainSession.lastWinnerByCategory;
                sessionInstance.lastUsedCategoryId = plainSession.lastUsedCategoryId;
                sessionInstance.lastSelectedWinnerId = plainSession.lastSelectedWinnerId;
                return sessionInstance;
            });

            classroomInstance.categories = plainClass.categories.map(plainCategory => {
                const categoryInstance = new Category(plainCategory.name);
                categoryInstance.id = plainCategory.id;
                categoryInstance.isDeleted = plainCategory.isDeleted;
                return categoryInstance;
            });
            classroomInstance.futurePlans = plainClass.futurePlans;

            classrooms[className] = classroomInstance;
        }
    }

    function showUndoToast(message) {
        clearTimeout(undoTimeout);

        // منطق کلیدی برای واگرد دسته‌ای:
        // فقط زمانی وضعیت را ذخیره کن که هیچ عملیات واگردی در جریان نباشد.
        if (!previousState) {
            previousState = JSON.stringify(classrooms);
        }

        undoMessage.textContent = message;
        undoToast.classList.add('show');

        // با هر حذف جدید، تایمر واگرد را ریست می‌کنیم تا فرصت کافی وجود داشته باشد.
        undoTimeout = setTimeout(() => {
            undoToast.classList.remove('show');
            previousState = null; // پس از پایان زمان، نقطه بازگشت پاک می‌شود.
        }, 5000);
    }

    function handleUndo() {
        if (previousState) {
            const currentClassName = currentClassroom ? currentClassroom.info.name : null;

            const plainData = JSON.parse(previousState);
            rehydrateData(plainData);

            if (currentClassName && classrooms[currentClassName]) {
                currentClassroom = classrooms[currentClassName];
            } else {
                currentClassroom = null;
            }

            // منطق جدید و کامل: رندر مجدد تمام لیست‌های مرتبط
            if (currentClassroom) {
                // اگر داخل یک کلاس هستیم، تمام لیست‌های صفحه تنظیمات را بازسازی کن
                renderSettingsStudentList();
                renderSettingsCategories();
                renderSessions();
            } else {
                renderClassList();
            }

            undoToast.classList.remove('show');
            clearTimeout(undoTimeout);
            previousState = null;
        }
    }

    function showNotification(message, duration = 3000) {
        const notificationToast = document.getElementById('notification-toast');
        if (!notificationToast) return;

        notificationToast.textContent = message;
        notificationToast.classList.add('show');

        clearTimeout(notificationTimeout);
        notificationTimeout = setTimeout(() => {
            notificationToast.classList.remove('show');
        }, duration);
    }

    function showCustomConfirm(message, onConfirm, options = {}) {
        const {
            confirmText = 'تایید',
            cancelText = 'لغو',
            confirmClass = 'btn-success',
            onCancel = null
        } = options;

        confirmModalMessage.textContent = message;
        confirmModalConfirmBtn.textContent = confirmText;
        confirmModalCancelBtn.textContent = cancelText;

        // Reset classes and apply the new one
        confirmModalConfirmBtn.className = 'modal-action-btn'; // Base class
        confirmModalConfirmBtn.classList.add(confirmClass);

        confirmCallback = onConfirm;
        cancelCallback = onCancel;

        customConfirmModal.style.display = 'flex';
    }

    // --- توابع رندر (Render Functions) ---

    function renderAttendancePage() {
        if (!currentClassroom || !selectedSession) return;

        attendanceClassNameHeader.textContent = `حضور و غیاب کلاس: ${currentClassroom.info.name}`;
        attendanceListUl.innerHTML = '';

        currentClassroom.students.forEach(student => {
            const li = document.createElement('li');
            li.className = 'attendance-list-item';

            const nameSpan = document.createElement('span');
            nameSpan.textContent = student.identity.name;

            const buttonGroup = document.createElement('div');
            buttonGroup.className = 'attendance-button-group';

            const presentBtn = document.createElement('button');
            presentBtn.textContent = 'حاضر';
            presentBtn.className = 'attendance-status-btn present';

            const absentBtn = document.createElement('button');
            absentBtn.textContent = 'غایب';
            absentBtn.className = 'attendance-status-btn absent';

            const currentStatus = selectedSession.studentRecords[student.identity.studentId]?.attendance || 'present';
            if (currentStatus === 'present') {
                presentBtn.classList.add('active');
            } else if (currentStatus === 'absent') {
                absentBtn.classList.add('active');
            }

            presentBtn.addEventListener('click', () => {
                const studentRecord = selectedSession.studentRecords[student.identity.studentId];
                if (!studentRecord) return;

                const wasAbsent = studentRecord.attendance === 'absent';
                const hadIssue = studentRecord.hadIssue;

                if (wasAbsent) {
                    student.statusCounters.missedChances--;
                }
                if (hadIssue) {
                    // This was a separate missed chance, so decrement both.
                    student.statusCounters.missedChances--;
                    student.statusCounters.otherIssues--;
                    studentRecord.hadIssue = false;
                }

                selectedSession.setAttendance(student.identity.studentId, 'present');
                presentBtn.classList.add('active');
                absentBtn.classList.remove('active');
                saveData();
            });

            absentBtn.addEventListener('click', () => {
                const studentRecord = selectedSession.studentRecords[student.identity.studentId];
                if (!studentRecord) return;

                const wasPresent = studentRecord.attendance === 'present';

                if (wasPresent) {
                    if (studentRecord.hadIssue) {
                        // The reason for the missed chance is changing from issue to absent.
                        // The count of missedChances remains the same, but otherIssues is decremented.
                        student.statusCounters.otherIssues--;
                        studentRecord.hadIssue = false;
                    } else {
                        // This is a new missed chance.
                        student.statusCounters.missedChances++;
                    }
                }
                // If already absent, no counters change.

                selectedSession.setAttendance(student.identity.studentId, 'absent');
                absentBtn.classList.add('active');
                presentBtn.classList.remove('active');
                saveData();
            });

            buttonGroup.appendChild(presentBtn);
            buttonGroup.appendChild(absentBtn);
            li.appendChild(nameSpan);
            li.appendChild(buttonGroup);
            attendanceListUl.appendChild(li);
        });
    }

    function renderStudentStatsList() {
        const studentListUl = document.getElementById('student-list');
        studentListUl.innerHTML = '';

        if (!currentClassroom) return;

        const calculateAbsences = (student) => {
            let absenceCount = 0;
            if (currentClassroom && currentClassroom.sessions) {
                currentClassroom.sessions.forEach(session => {
                    const record = session.studentRecords[student.identity.studentId];
                    if (record && record.attendance === 'absent') {
                        absenceCount++;
                    }
                });
            }
            return absenceCount;
        };

        currentClassroom.students.forEach(student => {
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

    function displayWinner(winner, categoryName) {
        const resultDiv = document.getElementById('selected-student-result');
        resultDiv.innerHTML = '';
        resultDiv.classList.remove('absent');

        const studentRecord = selectedSession.studentRecords[winner.identity.studentId];
        const isPresent = studentRecord?.attendance === 'present';

        const winnerNameEl = document.createElement('div');
        winnerNameEl.innerHTML = `✨ <strong>${winner.identity.name}</strong>✨`;

        if (!isPresent) {
            resultDiv.classList.add('absent');
            winnerNameEl.classList.add('absent-student-name');
        }

        resultDiv.appendChild(winnerNameEl);

        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'status-button-container';

        const absentBtn = document.createElement('button');
        absentBtn.textContent = 'غایب';
        absentBtn.className = 'status-button';
        if (!isPresent) absentBtn.classList.add('active');

        const issueBtn = document.createElement('button');
        issueBtn.textContent = 'مشکل';
        issueBtn.className = 'status-button';
        if (studentRecord?.hadIssue) issueBtn.classList.add('active');

        const profileBtn = document.createElement('button');
        profileBtn.textContent = 'پروفایل / نمره‌دهی';
        profileBtn.className = 'status-button profile-btn';


        absentBtn.addEventListener('click', () => {
            const wasPresent = selectedSession.studentRecords[winner.identity.studentId].attendance === 'present';
            const hadIssue = studentRecord.hadIssue;

            selectedSession.setAttendance(winner.identity.studentId, wasPresent ? 'absent' : 'present');

            // Toggle Missed Chances, but only if it's not a transfer from an existing "missed" state
            if (!hadIssue) {
                winner.statusCounters.missedChances += wasPresent ? 1 : -1;
            }

            // Mutual Exclusion: If marking a student with an issue as absent, resolve the issue.
            if (wasPresent && hadIssue) {
                studentRecord.hadIssue = false;
                winner.statusCounters.otherIssues--;
                issueBtn.classList.remove('active');
            }

            absentBtn.classList.toggle('active');
            renderStudentStatsList();
            saveData();
        });

        issueBtn.addEventListener('click', () => {
            const hadIssuePreviously = studentRecord.hadIssue;
            const wasAbsent = studentRecord.attendance === 'absent';

            studentRecord.hadIssue = !hadIssuePreviously;

            // Toggle Other Issues Counter
            winner.statusCounters.otherIssues += !hadIssuePreviously ? 1 : -1;

            // Toggle Missed Chances, but only if it's not a transfer from an existing "missed" state (absent)
            if (!wasAbsent) {
                winner.statusCounters.missedChances += !hadIssuePreviously ? 1 : -1;
            }

            // Mutual Exclusion: If marking an absent student as having an issue, make them present.
            if (!hadIssuePreviously && wasAbsent) {
                selectedSession.setAttendance(winner.identity.studentId, 'present');
                absentBtn.classList.remove('active');
            }

            issueBtn.classList.toggle('active');
            renderStudentStatsList();
            saveData();
        });

        profileBtn.addEventListener('click', () => {
            selectedStudentForProfile = winner;
            renderStudentProfilePage();
            showPage('student-profile-page');
        });

        buttonContainer.appendChild(absentBtn);
        buttonContainer.appendChild(issueBtn);
        buttonContainer.appendChild(profileBtn);
        resultDiv.appendChild(buttonContainer);

        // --- نمایش اطلاعات سریع دانش‌آموز (نمرات و یادداشت‌ها) ---
        const detailsContainer = document.createElement('div');
        detailsContainer.className = 'student-details-container';

        // --- بخش نمرات ---
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
                // نمایش حداکثر ۳ نمره آخر
                skillScoresSpan.textContent = scoresForSkill.slice(-3).map(s => s.value).join(', ');
            } else {
                skillScoresSpan.textContent = 'none';
            }

            li.appendChild(skillNameSpan);
            li.appendChild(skillScoresSpan);
            scoresList.appendChild(li);
        });

        if (!hasAnyScore && Object.keys(studentScores).length === 0) {
            scoresList.innerHTML = `<li class="no-content-message">هنوز نمره‌ای ثبت نشده.</li>`;
        }

        scoresDiv.appendChild(scoresList);
        detailsContainer.appendChild(scoresDiv);


        // --- بخش یادداشت‌ها ---
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
            const noNotesItem = document.createElement('li');
            noNotesItem.className = 'no-content-message';
            noNotesItem.textContent = 'یادداشتی وجود ندارد.';
            notesList.appendChild(noNotesItem);
        }

        notesDiv.appendChild(notesList);
        detailsContainer.appendChild(notesDiv);

        resultDiv.appendChild(detailsContainer);
    }

    function renderStudentPage() {
        const categoryPillsContainer = document.getElementById('category-selection-container'); ""
        const studentListUl = document.getElementById('student-list');
        const classNameHeader = document.getElementById('class-name-header');
        const resultDiv = document.getElementById('selected-student-result');

        if (!currentClassroom || !selectedSession) {
            showPage('class-management-page');
            return;
        }

        classNameHeader.textContent = `جلسه ${selectedSession.sessionNumber} / کلاس: ${currentClassroom.info.name}`;
        categoryPillsContainer.innerHTML = '';
        studentListUl.innerHTML = '';
        resultDiv.innerHTML = ''; // این خط جدید و کلیدی است
        selectStudentBtnWrapper.classList.add('disabled-wrapper');

        const activeCategories = currentClassroom.categories.filter(cat => !cat.isDeleted);
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
                selectedCategory = category;
                selectStudentBtnWrapper.classList.remove('disabled-wrapper');
            });

            categoryPillsContainer.appendChild(pill);
        });

        if (selectedSession.lastUsedCategoryId) {
            const lastCategoryPill = categoryPillsContainer.querySelector(`.pill[data-category-id="${selectedSession.lastUsedCategoryId}"]`);
            if (lastCategoryPill) {
                lastCategoryPill.click();
            }
        }

        if (selectedSession.lastSelectedWinnerId) {
            const lastWinner = currentClassroom.students.find(s => s.identity.studentId === selectedSession.lastSelectedWinnerId);
            if (lastWinner && selectedCategory) {
                displayWinner(lastWinner, selectedCategory.name);
            }
        }

        showPage('student-page');
        renderStudentStatsList();
    }

    function renderStudentProfilePage() {
        if (!selectedStudentForProfile) return;

        const student = selectedStudentForProfile;
        profileStudentNameHeader.textContent = `پروفایل: ${student.identity.name}`;

        // --- Render Stats Summary ---
        const absenceCount = currentClassroom.sessions.reduce((count, session) => {
            const record = session.studentRecords[student.identity.studentId];
            return count + (record && record.attendance === 'absent' ? 1 : 0);
        }, 0);

        profileStatsSummaryDiv.innerHTML = `
            <p><strong>کل انتخاب:</strong> ${student.statusCounters.totalSelections}</p>
            <p><strong>غیبت:</strong> ${absenceCount}</p>
            <p><strong>فرصت از دست رفته:</strong> ${student.statusCounters.missedChances || 0}</p>
            <p><strong>مشکل فنی:</strong> ${student.statusCounters.otherIssues || 0}</p>
        `;

        // --- Render Scoring Form ---
        const skills = ['Listening', 'Speaking', 'Reading', 'Writing'];
        scoreSkillSelectionContainer.innerHTML = '';
        skills.forEach(skill => {
            const pill = document.createElement('span');
            pill.className = 'pill';
            pill.textContent = skill;
            pill.dataset.skillName = skill.toLowerCase();
            scoreSkillSelectionContainer.appendChild(pill);

            pill.addEventListener('click', () => {
                scoreSkillSelectionContainer.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                newScoreValueInput.focus();
            });
        });

        // --- Render Scores History ---
        profileScoresListUl.innerHTML = '';
        const allScores = [];
        for (const skill in student.logs.scores) {
            student.logs.scores[skill].forEach(score => {
                allScores.push(score);
            });
        }

        allScores.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        if (allScores.length === 0) {
            profileScoresListUl.innerHTML = '<li>هنوز نمره‌ای ثبت نشده است.</li>';
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
                                saveData();
                                renderStudentProfilePage(); // Re-render the entire profile page
                                showNotification('نمره با موفقیت حذف شد.');
                            }
                        },
                        { confirmText: 'تایید حذف', confirmClass: 'btn-warning' }
                    );
                });

                li.appendChild(scoreContent);
                li.appendChild(deleteBtn);
                profileScoresListUl.appendChild(li);
            });
        }

        // Clear input fields
        newScoreValueInput.value = '';
        newScoreCommentTextarea.value = '';
        if (scoreSkillSelectionContainer.querySelector('.pill.active')) {
            scoreSkillSelectionContainer.querySelector('.pill.active').classList.remove('active');
        }

        renderStudentNotes();
    }

    function renderStudentNotes() {
        const profileNotesListUl = document.getElementById('profile-notes-list');
        profileNotesListUl.innerHTML = '';

        if (!selectedStudentForProfile || !selectedStudentForProfile.profile.notes || selectedStudentForProfile.profile.notes.length === 0) {
            profileNotesListUl.innerHTML = '<li>هنوز یادداشتی ثبت نشده است.</li>';
            return;
        }

        const sortedNotes = [...selectedStudentForProfile.profile.notes].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

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
                        const noteIndex = selectedStudentForProfile.profile.notes.findIndex(n => n.id === note.id);
                        if (noteIndex > -1) {
                            selectedStudentForProfile.profile.notes.splice(noteIndex, 1);
                            saveData();
                            renderStudentNotes(); // Only re-render the notes list
                            showNotification('یادداشت با موفقیت حذف شد.');
                        }
                    },
                    { confirmText: 'تایید حذف', confirmClass: 'btn-warning' }
                );
            });

            li.appendChild(noteContent);
            li.appendChild(deleteBtn);
            profileNotesListUl.appendChild(li);
        });
    }

    function renderColumnSelector(headers) {
        columnSelectDropdown.innerHTML = '';
        headers.forEach((header, index) => {
            const option = document.createElement('option');
            option.value = index; // مقدار هر گزینه، ایندکس ستون است
            option.textContent = header.trim();
            columnSelectDropdown.appendChild(option);
        });
    }
    function renderImportPreview() {
        csvPreviewList.innerHTML = '';
        namesToImport.forEach(name => {
            const li = document.createElement('li');
            li.className = 'preview-item'; // برای استایل‌دهی بهتر

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = true;
            checkbox.dataset.name = name; // ذخیره نام در دیتاست برای استفاده بعدی

            const label = document.createElement('label');
            label.textContent = name;

            li.appendChild(checkbox);
            li.appendChild(label);
            csvPreviewList.appendChild(li);
        });
    }
    function renderClassList() {
        classListUl.innerHTML = '';
        for (const name in classrooms) {
            const classroom = classrooms[name];

            const li = document.createElement('li');

            const nameContainer = document.createElement('span');
            nameContainer.textContent = name;
            nameContainer.style.flexGrow = '1';

            nameContainer.addEventListener('click', () => {
                currentClassroom = classroom;
                selectedSession = null;
                liveSession = currentClassroom.liveSession;

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
                currentClassroom = classroom;
                settingsClassNameHeader.textContent = `تنظیمات کلاس: ${currentClassroom.info.name}`;
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
                        // قبل از هر تغییری، وضعیت فعلی را برای قابلیت واگرد ذخیره می‌کنیم
                        showUndoToast(`کلاس «${name}» حذف شد.`);

                        // کلاس را از آبجکت اصلی در حافظه حذف می‌کنیم
                        delete classrooms[name];

                        // مهم‌ترین بخش: آبجکت به‌روز شده را فوراً در حافظه مرورگر ذخیره می‌کنیم
                        saveData();

                        // در نهایت، لیست کلاس‌ها را دوباره رندر می‌کنیم تا تغییر در صفحه دیده شود
                        renderClassList();
                    },
                    { confirmText: 'تایید حذف', confirmClass: 'btn-warning' }
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

    function renderSettingsStudentList() {
        settingsStudentListUl.innerHTML = '';
        if (!currentClassroom) return;

        currentClassroom.students.forEach(student => {
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

                currentClassroom.removeStudent(student.identity.studentId);

                saveData();
                renderSettingsStudentList();
            });

            li.appendChild(nameSpan);
            li.appendChild(deleteBtn);
            settingsStudentListUl.appendChild(li);
        });
    }

    function renderSettingsCategories() {
        categoryListUl.innerHTML = '';
        if (!currentClassroom) return;

        const activeCategories = currentClassroom.categories.filter(cat => !cat.isDeleted);

        activeCategories.forEach(category => {
            const li = document.createElement('li');

            const nameSpan = document.createElement('span');
            nameSpan.textContent = category.name;
            nameSpan.style.flexGrow = '1';

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn-icon';
            deleteBtn.innerHTML = '🗑️';
            deleteBtn.style.color = 'var(--color-warning)';

            deleteBtn.addEventListener('click', () => {
                showUndoToast(`دسته‌بندی «${category.name}» حذف شد.`);

                const categoryIndex = currentClassroom.categories.findIndex(c => c.id === category.id);
                if (categoryIndex > -1) {
                    currentClassroom.categories.splice(categoryIndex, 1);
                }

                saveData();
                renderSettingsCategories();
            });

            li.appendChild(nameSpan);
            li.appendChild(deleteBtn);
            categoryListUl.appendChild(li);
        });
    }

    function _internalShowPage(pageId) {
        // ابتدا تمام صفحات را پنهان می‌کنیم
        document.querySelectorAll('.page').forEach(page => {
            page.style.display = 'none';
        });

        // سپس صفحه مورد نظر را نمایش می‌دهیم
        const pageToShow = document.getElementById(pageId);
        if (pageToShow) {
            pageToShow.style.display = 'block';
        }

        // منطق جدید: نمایش یا پنهان کردن هدر اصلی
        if (pageId === 'class-management-page') {
            appHeader.style.display = 'block';
        } else {
            appHeader.style.display = 'none';
        }
    }

    function showPage(pageId) {
        const state = {
            pageId,
            currentClassName: currentClassroom ? currentClassroom.info.name : null,
            selectedSessionNumber: selectedSession ? selectedSession.sessionNumber : null,
            selectedStudentId: selectedStudentForProfile ? selectedStudentForProfile.identity.studentId : null,
        };

        const currentState = history.state;
        if (!currentState ||
            currentState.pageId !== state.pageId ||
            currentState.currentClassName !== state.currentClassName ||
            currentState.selectedSessionNumber !== state.selectedSessionNumber ||
            currentState.selectedStudentId !== state.selectedStudentId) {
            history.pushState(state, '', `#${pageId}`);
        }

        _internalShowPage(pageId);
    }

    function renderSessions() {
        const sessionListUl = document.getElementById('session-list');
        const sessionClassNameHeader = document.getElementById('session-class-name-header');

        if (!currentClassroom) return;

        sessionClassNameHeader.textContent = `کلاس: ${currentClassroom.info.name}`;
        sessionListUl.innerHTML = '';

        if (currentClassroom.sessions.length === 0) {
            sessionListUl.innerHTML = '<li>هنوز جلسه‌ای شروع نشده است.</li>';
            return;
        }

        const reversedSessions = [...currentClassroom.sessions].reverse();

        reversedSessions.forEach(session => {
            const li = document.createElement('li');

            // --- Container for text and badges ---
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
                finishedBadge.className = 'type-badge'; // Using existing class for style
                finishedBadge.textContent = 'خاتمه یافته';
                finishedBadge.style.backgroundColor = 'var(--color-secondary)';
                badgesContainer.appendChild(finishedBadge);
            }
            if (session.isMakeup) {
                const makeupBadge = document.createElement('span');
                makeupBadge.className = 'type-badge'; // Using existing class for style
                makeupBadge.textContent = 'جبرانی';
                makeupBadge.style.backgroundColor = 'var(--color-warning)';
                makeupBadge.style.color = 'var(--color-text-dark)';
                badgesContainer.appendChild(makeupBadge);
            }
            infoContainer.appendChild(badgesContainer);

            li.appendChild(infoContainer);


            // --- Main click event to enter the session ---
            infoContainer.addEventListener('click', () => {
                selectedSession = session;
                renderStudentPage();
            });


            // --- Container for action buttons ---
            const buttonsContainer = document.createElement('div');
            buttonsContainer.className = 'list-item-buttons';

            // Button to toggle makeup status
            const makeupBtn = document.createElement('button');
            makeupBtn.className = 'btn-icon';
            makeupBtn.innerHTML = '🔄';
            makeupBtn.title = 'تغییر وضعیت جبرانی';
            makeupBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                currentClassroom.markAsMakeup(session.sessionNumber);
                saveData();
                renderSessions(); // Re-render to show updated status
            });
            buttonsContainer.appendChild(makeupBtn);


            // Button to end the session (only if not already finished)
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
                            currentClassroom.endSpecificSession(session.sessionNumber);
                            saveData();
                            renderSessions(); // Re-render to show updated status
                        },
                        { confirmText: 'بله', confirmClass: 'btn-success' }
                    );
                });
                buttonsContainer.appendChild(endSessionBtn);
            }

            // Delete button for the session
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
                        const sessionIndex = currentClassroom.sessions.findIndex(s => s.sessionNumber === session.sessionNumber);
                        if (sessionIndex > -1) {
                            currentClassroom.sessions.splice(sessionIndex, 1);
                            saveData();
                            renderSessions();
                        }
                    },
                    { confirmText: 'تایید حذف', confirmClass: 'btn-warning' }
                );
            });
            buttonsContainer.appendChild(deleteSessionBtn);


            li.appendChild(buttonsContainer);
            sessionListUl.appendChild(li);
        });
    }

    function updateSessionPageHeader() {
        const sessionClassNameHeader = document.getElementById('session-class-name-header');
        if (currentClassroom) {
            sessionClassNameHeader.textContent = `کلاس: ${currentClassroom.info.name}`;
        }
    }

    // --- شنودگرهای رویداد (Event Listeners) ---
    studentStatsHeader.addEventListener('click', () => {
        const now = new Date().getTime();

        if (now - resetEasterEggLastClickTime > 500) {
            resetEasterEggClickCount = 1;
        } else {
            resetEasterEggClickCount++;
        }

        resetEasterEggLastClickTime = now;

        if (resetEasterEggClickCount === 5) {
            resetEasterEggClickCount = 0;

            showCustomConfirm(
                "آیا از صفر کردن تمام شمارنده‌های دانش‌آموزان مطمئن هستید؟ این عمل غیرقابل بازگشت است.",
                () => {
                    resetAllStudentCounters();
                },
                { confirmText: 'بله', confirmClass: 'btn-warning' }
            );
        }
    });

    classListHeader.addEventListener('click', () => {
        const now = new Date().getTime();

        if (now - easterEggLastClickTime > 500) {
            easterEggClickCount = 1;
        } else {
            easterEggClickCount++;
        }

        easterEggLastClickTime = now;

        if (easterEggClickCount === 5) {
            easterEggClickCount = 0;

            showCustomConfirm(
                "آیا از ساخت یک کلاس تستی تصادفی مطمئن هستید؟",
                () => {
                    createRandomClass();
                    showNotification("کلاس تستی با موفقیت ساخته شد!");
                },
                { confirmText: 'بساز', confirmClass: 'btn-success' }
            );
        }
    });

    confirmModalCancelBtn.addEventListener('click', () => {
        customConfirmModal.style.display = 'none';
        if (typeof cancelCallback === 'function') {
            cancelCallback();
        }
        confirmCallback = null;
        cancelCallback = null;
    });

    confirmModalConfirmBtn.addEventListener('click', () => {
        if (typeof confirmCallback === 'function') {
            confirmCallback();
        }
        customConfirmModal.style.display = 'none';
        confirmCallback = null;
        cancelCallback = null;
    });

    backToAttendanceBtn.addEventListener('click', () => {
        if (currentClassroom && selectedSession) {
            renderAttendancePage();
            showPage('attendance-page');
        }
    });

    selectStudentBtn.addEventListener('click', () => {
        if (!currentClassroom || !selectedSession || !selectedCategory) return;

        const winner = selectedSession.selectNextWinner(selectedCategory.name, currentClassroom.students);

        if (winner) {
            displayWinner(winner, selectedCategory.name);
            const studentRecord = selectedSession.studentRecords[winner.identity.studentId];
            if (studentRecord) {
                if (studentRecord.attendance === 'absent') {
                    winner.statusCounters.missedChances++;
                } else if (studentRecord.hadIssue) {
                    winner.statusCounters.missedChances++;
                    winner.statusCounters.otherIssues++;
                }
            }
            selectedSession.lastUsedCategoryId = selectedCategory.id;
            selectedSession.lastSelectedWinnerId = winner.identity.studentId;
            renderStudentStatsList();
            saveData();
        } else {
            showNotification("دانش‌آموز واجد شرایطی برای انتخاب یافت نشد.");
        }
    });

    addCategoryBtn.addEventListener('click', () => {
        if (!currentClassroom) return;

        const categoryName = newCategoryNameInput.value.trim();
        if (!categoryName) {
            alert("لطفاً نام دسته‌بندی را وارد کنید.");
            return;
        }

        const isDuplicate = currentClassroom.categories.some(cat => !cat.isDeleted && cat.name.toLowerCase() === categoryName.toLowerCase());
        if (isDuplicate) {
            alert("این دسته‌بندی از قبل وجود دارد.");
            return;
        }

        const newCategory = new Category(categoryName);
        currentClassroom.categories.push(newCategory);

        saveData();
        renderSettingsCategories();
        newCategoryNameInput.value = '';
    });

    newCategoryNameInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            addCategoryBtn.click();
        }
    });

    confirmColumnBtn.addEventListener('click', () => {
        if (!importedFileContent) {
            alert("خطایی رخ داده است. لطفاً فایل را دوباره انتخاب کنید.");
            showPage('settings-page');
            return;
        }

        // گرفتن ایندکس ستونی که کاربر انتخاب کرده است
        const selectedColumnIndex = parseInt(columnSelectDropdown.value, 10);

        // پردازش محتوای فایل برای استخراج اسامی از ستون انتخاب شده
        const lines = importedFileContent.split('\n');
        const dataRows = lines.slice(1); // نادیده گرفتن خط اول (هدرها)

        namesToImport = dataRows.map(row => {
            const columns = row.split(',');
            // استخراج داده از ستون مورد نظر و حذف فضاهای خالی احتمالی
            return columns[selectedColumnIndex]?.trim();
        })
            .filter(name => name && name.length > 0); // حذف ردیف‌های خالی یا نامعتبر

        if (namesToImport.length > 0) {
            renderImportPreview();
            showPage('csv-preview-page');
        } else {
            alert("هیچ نامی در ستون انتخاب شده پیدا نشد. لطفاً ستون دیگری را امتحان کنید یا فایل خود را بررسی کنید.");
        }

        // ریست کردن محتوای موقت فایل
        importedFileContent = null;
    });

    importCsvBtn.addEventListener('click', () => {
        // با کلیک روی دکمه، فایل ورودی مخفی را فعال می‌کنیم
        csvFileInput.click();
    });

    csvFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = (e) => {
            const text = e.target.result;
            importedFileContent = text; // محتوای کامل فایل را ذخیره می‌کنیم

            // خط اول فایل (هدرها) را استخراج می‌کنیم
            const firstLine = text.split('\n')[0];
            const headers = firstLine.split(',');

            renderColumnSelector(headers); // منوی کشویی را با هدرها پر می‌کنیم
            showPage('column-mapping-page'); // صفحه انتخاب ستون را نمایش می‌دهیم
        };

        reader.readAsText(file);

        // ورودی را ریست می‌کنیم تا در صورت انتخاب مجدد همان فایل، رویداد اجرا شود
        event.target.value = null;
    });

    cancelImportBtn.addEventListener('click', () => {
        // عملیات را لغو کرده و به صفحه تنظیمات بازمی‌گردیم
        importedFileContent = null;
        showPage('settings-page');
    });

    csvConfirmBtn.addEventListener('click', () => {
        const selectedCheckboxes = csvPreviewList.querySelectorAll('input[type="checkbox"]:checked');

        selectedCheckboxes.forEach(checkbox => {
            const name = checkbox.dataset.name;

            // بررسی اینکه آیا دانش‌آموز با این نام از قبل وجود دارد یا نه
            const isDuplicate = currentClassroom.students.some(student => student.identity.name.toLowerCase() === name.toLowerCase());

            if (!isDuplicate) {
                const newStudent = new Student({ name: name });
                currentClassroom.addStudent(newStudent);
            } else {
                console.log(`دانش‌آموز «${name}» به دلیل تکراری بودن اضافه نشد.`);
            }
        });

        saveData(); // ذخیره تمام تغییرات
        renderSettingsStudentList(); // بازسازی لیست دانش‌آموزان در صفحه تنظیمات
        showPage('settings-page'); // بازگشت به صفحه تنظیمات

        // خالی کردن محتوای استفاده شده
        pasteArea.value = '';
        namesToImport = [];
    });
    csvCancelBtn.addEventListener('click', () => {
        namesToImport = []; // خالی کردن آرایه اسامی موقت
        showPage('settings-page');
    });
    processPasteBtn.addEventListener('click', () => {
        const text = pasteArea.value.trim();
        if (!text) {
            alert("کادر متنی خالی است. لطفاً اسامی را وارد کنید.");
            return;
        }

        // تبدیل متن به آرایه‌ای از اسامی، حذف خطوط خالی و فضاهای اضافی
        const names = text.split('\n')
            .map(name => name.trim())
            .filter(name => name.length > 0);

        if (names.length > 0) {
            namesToImport = names;
            renderImportPreview();
            showPage('csv-preview-page');
        } else {
            alert("هیچ نام معتبری برای ورود پیدا نشد.");
        }
    });
    newStudentNameInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            addStudentBtn.click();
        }
    });

    addStudentBtn.addEventListener('click', () => {
        if (!currentClassroom) return;

        const studentName = newStudentNameInput.value.trim();
        if (!studentName) {
            alert("لطفاً نام دانش‌آموز را وارد کنید.");
            return;
        }

        const isDuplicate = currentClassroom.students.some(student => student.identity.name.toLowerCase() === studentName.toLowerCase());
        if (isDuplicate) {
            alert("دانش‌آموزی با این نام از قبل در این کلاس وجود دارد.");
            return;
        }

        const newStudent = new Student({ name: studentName });

        currentClassroom.addStudent(newStudent);
        saveData();
        renderSettingsStudentList();

        newStudentNameInput.value = '';
        newStudentNameInput.focus();
    });
    backToSessionsBtn.addEventListener('click', () => {
        renderSessions();
        showPage('session-page');
    });
    document.getElementById('new-session-btn').addEventListener('click', () => {
        if (currentClassroom) {
            const unfinishedSession = currentClassroom.sessions.find(session => !session.isFinished);

            if (unfinishedSession) {
                showNotification(`جلسه ${unfinishedSession.sessionNumber} هنوز تمام نشده است. لطفاً ابتدا با دکمه ✅ آن را خاتمه دهید.`);
                return;
            }

            const startSession = (takeAttendance) => {
                const newSession = currentClassroom.startNewSession();
                liveSession = newSession;
                selectedSession = newSession;

                currentClassroom.students.forEach(student => {
                    liveSession.setAttendance(student.identity.studentId, 'present');
                });

                if (takeAttendance) {
                    renderAttendancePage();
                    showPage('attendance-page');
                } else {
                    renderStudentPage();
                }
                saveData();
            };

            showCustomConfirm(
                "آیا تمایل به انجام فرآیند حضور و غیاب دارید؟",
                () => startSession(true), // onConfirm
                {
                    confirmText: 'بله',
                    cancelText: 'خیر',
                    confirmClass: 'btn-success',
                    onCancel: () => startSession(false) // onCancel
                }
            );
        }
    });
    addClassBtn.addEventListener('click', () => {
        const className = newClassNameInput.value.trim();
        const selectedTypeRadio = document.querySelector('input[name="class-type"]:checked');

        if (!className && !selectedTypeRadio) {
            showNotification("لطفاً نام و نوع کلاس را مشخص کنید.");
            return;
        }
        if (!className) {
            showNotification("لطفاً نام کلاس را وارد کنید.");
            return;
        }
        if (!selectedTypeRadio) {
            showNotification("لطفاً نوع کلاس را انتخاب کنید.");
            return;
        }

        if (classrooms[className]) {
            showNotification("کلاسی با این نام از قبل وجود دارد.");
            return;
        }

        const classType = selectedTypeRadio.value;
        const newClassroom = new Classroom({ name: className, type: classType });

        classrooms[className] = newClassroom;
        saveData();
        renderClassList();

        newClassNameInput.value = '';
        selectedTypeRadio.checked = false;
    });

    newClassNameInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            addClassBtn.click();
        }
    });
    undoBtn.addEventListener('click', handleUndo);

    document.querySelectorAll('.back-to-classes-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentClassroom = null;
            selectedSession = null;
            liveSession = null;
            showPage('class-management-page');
        });
    });

    finishAttendanceBtn.addEventListener('click', () => {
        renderStudentPage();
    });

    backToSessionsFromAttendanceBtn.addEventListener('click', () => {
        renderSessions();
        showPage('session-page');
    });

    backToStudentPageBtn.addEventListener('click', () => {
        selectedStudentForProfile = null;
        showPage('student-page');
    });

    // --- Event Listeners for Student Search ---
    function renderSearchResults(searchTerm = '') {
        if (!currentClassroom) return;

        const filteredStudents = currentClassroom.students.filter(student =>
            student.identity.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        studentSearchResultsDiv.innerHTML = '';

        if (filteredStudents.length > 0) {
            filteredStudents.forEach(student => {
                const studentDiv = document.createElement('div');
                studentDiv.textContent = student.identity.name;
                studentDiv.addEventListener('click', () => {
                    selectedStudentForProfile = student;
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

    studentSearchInput.addEventListener('focus', () => {
        renderSearchResults();
    });

    studentSearchInput.addEventListener('input', () => {
        renderSearchResults(studentSearchInput.value);
    });

    document.addEventListener('click', (event) => {
        if (!studentSearchInput.contains(event.target) && !studentSearchResultsDiv.contains(event.target)) {
            studentSearchResultsDiv.style.display = 'none';
        }
    });

    newScoreValueInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            addScoreBtn.click();
        }
    });

    newScoreCommentTextarea.addEventListener('keyup', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault(); // Prevent adding a new line
            addScoreBtn.click();
        }
    });

    addScoreBtn.addEventListener('click', () => {
        const selectedSkillPill = scoreSkillSelectionContainer.querySelector('.pill.active');
        if (!selectedSkillPill) {
            showNotification('لطفاً یک مهارت را برای نمره‌دهی انتخاب کنید.');
            return;
        }

        const skill = selectedSkillPill.dataset.skillName;
        const value = parseInt(newScoreValueInput.value, 10);
        const comment = newScoreCommentTextarea.value.trim();

        if (isNaN(value) || value < 0 || value > 100) {
            showNotification('لطفاً یک نمره معتبر بین ۰ تا ۱۰۰ وارد کنید.');
            return;
        }

        if (selectedStudentForProfile) {
            selectedStudentForProfile.addScore(skill, value, comment);
            saveData();
            showNotification(`نمره برای مهارت ${skill} با موفقیت ثبت شد.`);
            // Re-render the page to show the new score
            renderStudentProfilePage();
        }
    });

    // --- Event Listeners for Add Note Modal ---
    document.body.addEventListener('click', (event) => {
        if (event.target.id === 'add-note-btn') {
            addNoteModal.style.display = 'flex';
            newNoteContent.focus();
        }
    });

    cancelNoteBtn.addEventListener('click', () => {
        addNoteModal.style.display = 'none';
        newNoteContent.value = '';
    });

    saveNoteBtn.addEventListener('click', () => {
        const content = newNoteContent.value.trim();
        if (content && selectedStudentForProfile) {
            selectedStudentForProfile.addNote(content);
            saveData();
            showNotification('یادداشت با موفقیت ثبت شد.');
            renderStudentNotes();
            addNoteModal.style.display = 'none';
            newNoteContent.value = '';
        } else {
            showNotification('لطفاً متن یادداشت را وارد کنید.', 3000);
        }
    });

    // --- توابع مربوط به باگ یابی debugging ---

    window.resetAllStudentCounters = function () {
        if (!classrooms || Object.keys(classrooms).length === 0) {
            console.log("هیچ کلاسی برای ریست کردن وجود ندارد.");
            return;
        }

        let studentCount = 0;
        for (const className in classrooms) {
            const classroom = classrooms[className];
            if (classroom.students && classroom.students.length > 0) {
                classroom.students.forEach(student => {
                    student.statusCounters = {
                        totalSelections: 0,
                        missedChances: 0,
                        otherIssues: 0,
                        earlyLeaves: 0,
                    };
                    student.categoryCounts = {};
                    student.finalClassActivityScore = null;

                    if (student.logs) {
                        student.logs.sessionHistory = {};
                    }

                    studentCount++;
                });
            }
        }

        saveData();

        if (document.getElementById('student-page').style.display === 'block') {
            renderStudentStatsList();
            const resultDiv = document.getElementById('selected-student-result');
            if (resultDiv) resultDiv.innerHTML = '';
        }

        console.log(`✅ شمارنده‌های ${studentCount} دانش‌آموز با موفقیت صفر شد. داده‌ها ذخیره شدند.`);
    }

    window.createRandomClass = function () {
        const randomId = Math.floor(Math.random() * 1000);
        const className = `کلاس تستی ${randomId}`;

        if (classrooms[className]) {
            console.log("کلاس تستی با نام مشابه از قبل وجود دارد، لطفاً دوباره امتحان کنید.");
            return;
        }

        const classInfo = {
            name: className,
            type: Math.random() < 0.5 ? 'online' : 'in-person',
            level: `Level ${Math.floor(Math.random() * 10) + 1}`
        };
        const newClass = new Classroom(classInfo);

        const studentNames = ["سارا رضایی", "علی اکبری", "مریم حسینی", "رضا محمدی", "فاطمه احمدی", "حسین کریمی", "زهرا قاسمی", "مهدی جعفری", "نیلوفر محمودی", "امیر مرادی", "هستی صالحی", "پرهام اسدی"];
        const selectedStudents = studentNames.sort(() => 0.5 - Math.random()).slice(0, 5);

        selectedStudents.forEach(name => {
            const student = new Student({ name: name });
            newClass.addStudent(student);
        });

        const categories = newClass.categories.map(c => c.name);
        const numberOfSessions = Math.floor(Math.random() * 5) + 5;

        let sessionDate = new Date();
        sessionDate.setDate(sessionDate.getDate() - (numberOfSessions * 3));

        for (let i = 0; i < numberOfSessions; i++) {
            const session = newClass.startNewSession();

            session.startTime = new Date(sessionDate);

            newClass.students.forEach(student => {
                session.initializeStudentRecord(student.identity.studentId);
                const isAbsent = Math.random() < 0.1;
                if (isAbsent) {
                    session.setAttendance(student.identity.studentId, 'absent');
                }

                categories.forEach(catName => {
                    const selectionCount = Math.floor(Math.random() * 4);
                    if (selectionCount > 0) {
                        session.studentRecords[student.identity.studentId].selections[catName] = selectionCount;
                        student.categoryCounts[catName] = (student.categoryCounts[catName] || 0) + selectionCount;
                        student.statusCounters.totalSelections += selectionCount;
                    }
                });
            });

            session.end();
            const daysToAdd = Math.floor(Math.random() * 3) + 2;
            sessionDate.setDate(sessionDate.getDate() + daysToAdd);
        }

        classrooms[className] = newClass;
        saveData();
        renderClassList();

        console.log(`✅ کلاس تستی جدید با نام "${className}" و ${newClass.students.length} دانش‌آموز و ${newClass.sessions.length} جلسه با موفقیت ساخته شد.`);
    }

    // --- شنودگر رویداد برای back/forward ---
    window.addEventListener('popstate', (event) => {
        if (!event.state) {
            _internalShowPage('class-management-page');
            return;
        }

        const { pageId, currentClassName, selectedSessionNumber, selectedStudentId } = event.state;

        currentClassroom = currentClassName ? classrooms[currentClassName] : null;
        selectedSession = (currentClassroom && selectedSessionNumber)
            ? currentClassroom.getSession(selectedSessionNumber)
            : null;
        selectedStudentForProfile = (currentClassroom && selectedStudentId)
            ? currentClassroom.students.find(s => s.identity.studentId === selectedStudentId)
            : null;
        liveSession = currentClassroom ? currentClassroom.liveSession : null;

        // Re-render the view based on the restored state
        switch (pageId) {
            case 'class-management-page':
                renderClassList();
                break;
            case 'session-page':
                renderSessions();
                updateSessionPageHeader();
                break;
            case 'student-page':
                renderStudentPage();
                break;
            case 'attendance-page':
                renderAttendancePage();
                break;
            case 'settings-page':
                if (currentClassroom) {
                    settingsClassNameHeader.textContent = `تنظیمات کلاس: ${currentClassroom.info.name}`;
                    renderSettingsStudentList();
                    renderSettingsCategories();
                }
                break;
            case 'student-profile-page':
                renderStudentProfilePage();
                break;
        }

        _internalShowPage(pageId);
    });

    // --- بارگذاری اولیه ---
    history.replaceState({ pageId: 'class-management-page' }, '', '#class-management-page');
    loadData();


});