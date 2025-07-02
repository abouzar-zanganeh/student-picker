// =================================================================
//  بخش ۱: تعریف کلاس‌ها (بلوپرینت‌های معماری جدید)
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
        this.counters = {
            totalSelections: 0,
            outOfClass: 0,
            micIssues: 0,
            earlyLeaves: 0,
        };
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
    
    selectNextWinner(category, studentList) {
        const presentStudents = studentList.filter(student => {
            this.initializeStudentRecord(student.identity.studentId);
            const record = this.studentRecords[student.identity.studentId];
            return record.attendance === 'present';
        });

        if (presentStudents.length === 0) {
            console.log("هیچ دانش‌آموز حاضری برای انتخاب وجود ندارد.");
            return null;
        }

        const winner = presentStudents[Math.floor(Math.random() * presentStudents.length)];
        
        const studentId = winner.identity.studentId;
        this.initializeStudentRecord(studentId);
        if (!this.studentRecords[studentId].selections[category]) {
            this.studentRecords[studentId].selections[category] = 0;
        }
        this.studentRecords[studentId].selections[category]++;
        winner.counters.totalSelections++;
        
        this.lastWinnerByCategory[category] = studentId;

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
    constructor(name) {
        this.id = `cat_${new Date().getTime()}_${Math.random()}`;
        this.name = name;
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
                studentInstance.counters = plainStudent.counters;
                studentInstance.logs = plainStudent.logs;
                studentInstance.profile = plainStudent.profile;
                studentInstance.finalClassActivityScore = plainStudent.finalClassActivityScore;
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

    // --- توابع رندر (Render Functions) ---
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
            
            const buttonsContainer = document.createElement('div');
            
            const settingsBtn = document.createElement('button');
            settingsBtn.className = 'btn-icon';
            settingsBtn.innerHTML = '⚙️';
            settingsBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                currentClassroom = classroom;
                
                // به‌روزرسانی هدر صفحه تنظیمات
                settingsClassNameHeader.textContent = `تنظیمات کلاس: ${currentClassroom.info.name}`;
                
                // رندر کردن محتوای صفحه تنظیمات
                renderSettingsStudentList();
                renderSettingsCategories();
                
                // نمایش صفحه تنظیمات
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
                showPage('student-page');
                console.log("وارد جلسه منتخب شدید:", selectedSession);
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
        const newSession = currentClassroom.startNewSession();
        
        liveSession = newSession; 
        selectedSession = newSession;
        
        console.log(`--- DEBUG: Session ${newSession.sessionNumber} created. Total sessions now: ${currentClassroom.sessions.length}`);


        saveData();
        renderSessions(); 
        
        showPage('student-page');
    }
});
    
    addClassBtn.addEventListener('click', () => {
        const className = newClassNameInput.value.trim();
        if (className && !classrooms[className]) {
            const newClassroom = new Classroom({ name: className });
            classrooms[className] = newClassroom;
            saveData();
            renderClassList();
            newClassNameInput.value = '';
        } else if (classrooms[className]) {
            alert('کلاسی با این نام از قبل وجود دارد.');
        }
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

    // --- بارگذاری اولیه ---
    loadData();
});