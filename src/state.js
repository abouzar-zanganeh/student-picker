import { Classroom, Student, Session, Category, Homework } from './models.js';


// --- وضعیت کلی برنامه (Global State) ---
export let classrooms = {}; // آبجکتی برای نگهداری تمام کلاس‌ها بر اساس نام آنها
export let currentClassroom = null; // کلاسی که کاربر در حال کار با آن است
export let liveSession = null; // جلسه زنده‌ای که در حال برگزاری است
export let selectedSession = null; // جلسه‌ای که کاربر برای مشاهده انتخاب کرده
export let selectedStudentForProfile = null; // دانش‌آموزی که پروفایل او در حال مشاهده است
export let previousState = null; // برای ذخیره آخرین وضعیت قبل از حذف
export let undoTimeout = null;   // برای مدیریت زمان‌بندی پیام واگرد
export let namesToImport = []; // آرایه‌ای برای نگهداری موقت اسامی جهت ورود
export let importedFileContent = null; // برای نگهداری محتوای کامل فایل CSV
export let notificationTimeout = null;
export let selectedCategory = null;
export let easterEggClickCount = 0;
export let easterEggLastClickTime = 0;
export let resetEasterEggClickCount = 0;
export let resetEasterEggLastClickTime = 0;
export let confirmCallback = null;
export let cancelCallback = null;
export let secureConfirmCallback = null;
export let activeModal = null; // Will hold the ID of the currently open modal
export let winnerHistoryIndex = -1; // -1 indicates we're not in history view
export let saveNoteCallback = null;
export let manualSelection = null; // To hold a student selected from the stats table



// --- توابع اصلی داده‌ها (Data Functions) ---
export function saveData() {
    localStorage.setItem('teacherAssistantData_v2', JSON.stringify(classrooms));
}

export function createBackup() {
    const dataStr = JSON.stringify(classrooms, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    const today = new Date().toLocaleDateString('fa-IR-u-nu-latn').replace(/\//g, '-');
    link.download = `SP-${today}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

export function loadData() {
    const savedData = localStorage.getItem('teacherAssistantData_v2');
    if (savedData) {
        const plainData = JSON.parse(savedData);
        rehydrateData(plainData);
    }
}

// تابع کلیدی برای تبدیل داده‌های ساده به نمونه‌های کلاس
export function rehydrateData(plainClassrooms) {
    classrooms = {};
    for (const className in plainClassrooms) {
        const plainClass = plainClassrooms[className];

        const classroomInstance = new Classroom(plainClass.info);
        classroomInstance.isDeleted = plainClass.isDeleted;

        classroomInstance.note = plainClass.note || '';

        classroomInstance.students = plainClass.students.map(plainStudent => {
            const studentInstance = new Student(plainStudent.identity);
            studentInstance.isDeleted = plainStudent.isDeleted;
            studentInstance.statusCounters = plainStudent.statusCounters;
            studentInstance.logs = plainStudent.logs;
            // اطمینان از اینکه ساختار scores درست است
            if (!studentInstance.logs.scores) {
                studentInstance.logs.scores = {};
            }
            studentInstance.profile = plainStudent.profile;
            studentInstance.finalClassActivityScore = plainStudent.finalClassActivityScore;
            studentInstance.categoryCounts = plainStudent.categoryCounts || {};
            studentInstance.categoryIssues = plainStudent.categoryIssues || {};
            return studentInstance;
        });

        classroomInstance.sessions = plainClass.sessions.map(plainSession => {
            const sessionInstance = new Session(plainSession.sessionNumber);
            sessionInstance.isDeleted = plainSession.isDeleted;

            sessionInstance.note = plainSession.note || '';

            sessionInstance.startTime = new Date(plainSession.startTime);
            sessionInstance.endTime = plainSession.endTime ? new Date(plainSession.endTime) : null;
            sessionInstance.isFinished = plainSession.isFinished;
            sessionInstance.isMakeup = plainSession.isMakeup;
            sessionInstance.isCancelled = plainSession.isCancelled || false;
            sessionInstance.studentRecords = plainSession.studentRecords;

            // Homework Rehydration Section
            for (const studentId in sessionInstance.studentRecords) {
                const record = sessionInstance.studentRecords[studentId];
                // Check if homework exists and is a plain object (from old data)
                if (record.homework && !(record.homework instanceof Homework)) {
                    // Re-instantiate it from the plain object's data
                    sessionInstance.studentRecords[studentId].homework = new Homework(
                        record.homework.status,
                        record.homework.comment
                    );
                }
            }

            sessionInstance.lastWinnerByCategory = plainSession.lastWinnerByCategory;
            sessionInstance.lastUsedCategoryId = plainSession.lastUsedCategoryId;
            sessionInstance.lastSelectedWinnerId = plainSession.lastSelectedWinnerId;

            const plainWinnerHistory = plainSession.winnerHistory || [];
            sessionInstance.winnerHistory = plainWinnerHistory.map(historyEntry => {
                // Find the fully rehydrated student instance from the main student list
                const rehydratedStudent = classroomInstance.students.find(
                    s => s.identity.studentId === historyEntry.winner.identity.studentId
                );
                // Return a new history entry with the proper Student instance
                return {
                    winner: rehydratedStudent,
                    categoryName: historyEntry.categoryName
                };
            });

            return sessionInstance;
        });

        classroomInstance.categories = plainClass.categories.map(plainCategory => {
            const categoryInstance = new Category(plainCategory.name, plainCategory.description, plainCategory.isGradedCategory); categoryInstance.id = plainCategory.id;
            categoryInstance.isDeleted = plainCategory.isDeleted;
            return categoryInstance;
        });
        classroomInstance.futurePlans = plainClass.futurePlans;

        classrooms[className] = classroomInstance;
    }
}

export function renameClassroom(oldName, newName) {
    // First, check if a class with the new name already exists to prevent duplicates.
    if (classrooms[newName]) {
        return { success: false, message: 'کلاسی با این نام از قبل وجود دارد.' };
    }

    // Get the classroom object from the old name.
    const classroom = classrooms[oldName];
    if (!classroom) {
        return { success: false, message: 'کلاس مورد نظر یافت نشد.' };
    }

    // Update the name property within the object itself for consistency.
    classroom.info.name = newName;

    // Create the new key in the classrooms object and delete the old one.
    classrooms[newName] = classroom;
    delete classrooms[oldName];

    // If the renamed class was the currently active one, update the reference.
    if (currentClassroom === classroom) {
        setCurrentClassroom(classroom);
    }

    return { success: true };
}


export function setCurrentClassroom(classroom) { currentClassroom = classroom; }
export function setLiveSession(session) { liveSession = session; }
export function setSelectedSession(session) { selectedSession = session; }
export function setSelectedStudentForProfile(student) { selectedStudentForProfile = student; }
export function setPreviousState(state) { previousState = state; }
export function setUndoTimeout(timeout) { undoTimeout = timeout; }
export function setNamesToImport(names) { namesToImport = names; }
export function setImportedFileContent(content) { importedFileContent = content; }
export function setNotificationTimeout(timeout) { notificationTimeout = timeout; }
export function setSelectedCategory(category) { selectedCategory = category; }
export function setEasterEggClickCount(count) { easterEggClickCount = count; }
export function setEasterEggLastClickTime(time) { easterEggLastClickTime = time; }
export function setResetEasterEggClickCount(count) { resetEasterEggClickCount = count; }
export function setResetEasterEggLastClickTime(time) { resetEasterEggLastClickTime = time; }
export function setConfirmCallback(callback) { confirmCallback = callback; }
export function setCancelCallback(callback) { cancelCallback = callback; }
export function setSecureConfirmCallback(callback) { secureConfirmCallback = callback; }
export function setActiveModal(modalId) { activeModal = modalId; }
export function setManualSelection(selection) { manualSelection = selection; }


export function resetAllStudentCounters() {
    for (const className in classrooms) {
        const classroom = classrooms[className];
        classroom.students.forEach(student => {
            student.statusCounters = {
                totalSelections: 0,
                missedChances: 0,
                otherIssues: 0,
                earlyLeaves: 0,
            };
            student.categoryCounts = {};
            // Reset absences
            classroom.sessions.forEach(session => {
                const studentId = student.identity.studentId;
                if (session.studentRecords[studentId]) {
                    session.studentRecords[studentId].attendance = 'present';
                }
            });
        });
    }
    saveData();
}

// This function filters those students who are not deleted and return an array of them.
export function getActiveItems(items) {
    // A safeguard to ensure we're always working with an array.
    if (!Array.isArray(items)) {
        return [];
    }
    return items.filter(item => !item.isDeleted);
}

export function getSessionDisplayMap(classroom) {
    const sessionDisplayMap = new Map();
    if (!classroom) return sessionDisplayMap; // Return an empty map if no classroom is provided

    const activeSessionsForNumbering = getActiveItems(classroom.sessions)
        .filter(s => !s.isCancelled)
        .sort((a, b) => a.sessionNumber - b.sessionNumber);

    activeSessionsForNumbering.forEach((session, index) => {
        // The Map will store the permanent session number as the key,
        // and the calculated display number as the value.
        sessionDisplayMap.set(session.sessionNumber, index + 1);
    });

    return sessionDisplayMap;
}

export function setWinnerHistoryIndex(index) {
    winnerHistoryIndex = index;
}

export function setSaveNoteCallback(callback) { saveNoteCallback = callback; }