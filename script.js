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
            absences: 0,
            otherIssues: 0,
            earlyLeaves: 0,
        };

        this.categoryCounts = {}; // آبجکت جدید برای شمارش انتخاب‌ها بر اساس دسته‌بندی

        this.logs = {
            parentContacts: [],
            scores: { listening: [], speaking: [], reading: [], writing: [] },
            discipline: [],
            sessionHistory: {},
        };
        this.profile = {
            notes: [],
            tags: [],
        };
        this.finalClassActivityScore = null;
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
        this.isMakeup = true;
    }

    initializeStudentRecord(studentId) {
        if (!this.studentRecords[studentId]) {
            this.studentRecords[studentId] = {
                attendance: 'present',
                homework: 'complete',
                selections: {}
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

    addScore(studentInstance, skill, score) {
        studentInstance.logs.scores[skill].push(score);
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
    let previousState = null; // برای ذخیره آخرین وضعیت قبل از حذف
    let undoTimeout = null;   // برای مدیریت زمان‌بندی پیام واگرد
    let namesToImport = []; // آرایه‌ای برای نگهداری موقت اسامی جهت ورود
    let importedFileContent = null; // برای نگهداری محتوای کامل فایل CSV
    let notificationTimeout = null;
    let selectedCategory = null;



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

            // ساخت نمونه Classroom
            const classroomInstance = new Classroom(plainClass.info);

            // بازسازی دانش‌آموزان
            classroomInstance.students = plainClass.students.map(plainStudent => {
                const studentInstance = new Student(plainStudent.identity);
                studentInstance.statusCounters = plainStudent.statusCounters;
                studentInstance.logs = plainStudent.logs;
                studentInstance.profile = plainStudent.profile;
                studentInstance.finalClassActivityScore = plainStudent.finalClassActivityScore;
                studentInstance.categoryCounts = plainStudent.categoryCounts || {};
                return studentInstance;
            });

            // بازسازی جلسات
            classroomInstance.sessions = plainClass.sessions.map(plainSession => {
                const sessionInstance = new Session(plainSession.sessionNumber);
                sessionInstance.startTime = new Date(plainSession.startTime);
                sessionInstance.endTime = plainSession.endTime ? new Date(plainSession.endTime) : null;
                sessionInstance.isFinished = plainSession.isFinished;
                sessionInstance.isMakeup = plainSession.isMakeup;
                sessionInstance.studentRecords = plainSession.studentRecords;
                sessionInstance.lastWinnerByCategory = plainSession.lastWinnerByCategory;
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
                selectedSession.setAttendance(student.identity.studentId, 'present');
                presentBtn.classList.add('active');
                absentBtn.classList.remove('active');
                saveData();
            });

            absentBtn.addEventListener('click', () => {
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

        currentClassroom.students.forEach(student => {
            const li = document.createElement('li');
            li.className = 'student-list-item';

            // بخش اصلی آمار که همیشه دیده می‌شود
            const totalStatsDiv = document.createElement('div');
            totalStatsDiv.className = 'total-stats';
            totalStatsDiv.innerHTML = `
            <span>${student.identity.name}</span>
            <span>کل: ${student.statusCounters.totalSelections} | غیبت: ${student.statusCounters.absences}</span>
        `;

            // بخش جزئیات دسته‌بندی‌ها که در ابتدا پنهان است
            const categoryStatsDiv = document.createElement('div');
            categoryStatsDiv.className = 'category-stats';

            if (Object.keys(student.categoryCounts).length > 0) {
                for (const categoryName in student.categoryCounts) {
                    const count = student.categoryCounts[categoryName];
                    const statP = document.createElement('p');
                    statP.textContent = `${categoryName}: ${count}`;
                    categoryStatsDiv.appendChild(statP);
                }
            } else {
                categoryStatsDiv.textContent = 'هنوز در هیچ دسته‌بندی انتخاب نشده است.';
            }

            li.appendChild(totalStatsDiv);
            li.appendChild(categoryStatsDiv);

            // افزودن رویداد کلیک برای باز و بسته کردن جزئیات
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
        const isPresent = studentRecord && studentRecord.attendance === 'present';

        const getSelectionCount = (student) => {
            return (studentRecord.selections && studentRecord.selections[categoryName]) || 0;
        };

        const winnerNameEl = document.createElement('div');
        winnerNameEl.innerHTML = `✨ <strong>${winner.identity.name}</strong>✨`;

        if (!isPresent) {
            resultDiv.classList.add('absent');
            winnerNameEl.classList.add('absent-student-name');
        }

        resultDiv.appendChild(winnerNameEl);

        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'status-button-container';

        const createStatusButton = (text, counterKey, isInitiallyToggled = false) => {
            const btn = document.createElement('button');
            btn.textContent = text;
            btn.className = 'status-button';
            let isToggled = isInitiallyToggled;

            if (isToggled) {
                btn.classList.add('active');
            }

            btn.addEventListener('click', () => {
                isToggled = !isToggled;
                winner.statusCounters[counterKey] += isToggled ? 1 : -1;
                btn.classList.toggle('active', isToggled);

                if (counterKey === 'absences') {
                    const studentId = winner.identity.studentId;
                    const newStatus = isToggled ? 'absent' : 'present';
                    selectedSession.setAttendance(studentId, newStatus);
                }

                saveData();
                renderStudentStatsList();
            });
            buttonContainer.appendChild(btn);
        };

        // اگر دانش‌آموز غایب باشد، دکمه «غایب» را به صورت فعال نشان بده
        createStatusButton('غایب', 'absences', !isPresent);
        createStatusButton('مشکل فنی', 'otherIssues');

        resultDiv.appendChild(buttonContainer);
    }

    function renderStudentPage() {
        const categoryPillsContainer = document.getElementById('category-selection-container');
        const studentListUl = document.getElementById('student-list');
        const classNameHeader = document.getElementById('class-name-header');

        if (!currentClassroom || !selectedSession) {
            showPage('class-management-page');
            return;
        }

        classNameHeader.textContent = `جلسه ${selectedSession.sessionNumber} / کلاس: ${currentClassroom.info.name}`;
        categoryPillsContainer.innerHTML = '';
        studentListUl.innerHTML = '';
        selectedCategory = null;
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

        showPage('student-page');
        renderStudentStatsList();
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
                showUndoToast(`کلاس «${name}» حذف شد.`);
                delete classrooms[name];
                saveData();
                renderClassList();
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

    function showPage(pageId) {
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

            const sessionDate = new Date(session.startTime).toLocaleDateString('fa-IR');
            const sessionText = document.createElement('span');
            sessionText.textContent = `جلسه ${session.sessionNumber} - تاریخ: ${sessionDate}`;
            li.appendChild(sessionText);

            const badgesContainer = document.createElement('div');

            if (session.isFinished) {
                const finishedBadge = document.createElement('span');
                finishedBadge.className = 'badge badge-secondary';
                finishedBadge.textContent = 'خاتمه یافته';
                badgesContainer.appendChild(finishedBadge);
            }
            if (session.isMakeup) {
                const makeupBadge = document.createElement('span');
                makeupBadge.className = 'badge badge-warning';
                makeupBadge.textContent = 'جبرانی';
                badgesContainer.appendChild(makeupBadge);
            }
            li.appendChild(badgesContainer);

            li.addEventListener('click', () => {
                selectedSession = session;
                renderStudentPage();
            });
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
            const wantsToTakeAttendance = confirm("آیا تمایل به انجام فرآیند حضور و غیاب دارید؟");

            const newSession = currentClassroom.startNewSession();
            liveSession = newSession;
            selectedSession = newSession;

            currentClassroom.students.forEach(student => {
                liveSession.setAttendance(student.identity.studentId, 'present');
            });

            if (wantsToTakeAttendance) {
                renderAttendancePage();
                showPage('attendance-page');
            } else {
                renderStudentPage();
            }
            saveData();
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

    // --- بارگذاری اولیه ---
    loadData();


});