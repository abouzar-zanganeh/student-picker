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

export let saveCategoryCallback = null;

export let manualSelection = null; // To hold a student selected from the stats table

//for moving students
export let studentToMove = null;
export let sourceClassForMove = null;

// for Demo Mode
export let isDemoMode = false;
let originalStateBackup = null;

export let trashBin = []; //for trash bin deleted items



// --- توابع اصلی داده‌ها (Data Functions) ---
export function saveData() {
    if (isDemoMode) return;

    const appState = {
        classrooms,
        trashBin
    };

    localStorage.setItem('teacherAssistantData_v2', JSON.stringify(appState));
}


export function prepareBackupData() {

    const appState = { classrooms, trashBin };
    const dataStr = JSON.stringify(appState, null, 2);

    const today = new Date().toLocaleDateString('fa-IR-u-nu-latn').replace(/\//g, '-');
    const fileName = `SP-${today}.txt`;
    return new File([dataStr], fileName, { type: 'text/plain' });
}

export function loadData() {
    const savedData = localStorage.getItem('teacherAssistantData_v2');
    if (!savedData) return;

    const plainData = JSON.parse(savedData);

    // Check if the data is in the new format {classrooms, trashBin} or the old one.
    if (plainData.classrooms) {
        // New format
        rehydrateData(plainData.classrooms);
        trashBin = plainData.trashBin || [];
    } else {
        // Old format: rehydrate, then migrate old deleted items.
        rehydrateData(plainData);
        // This runs once to move existing deleted items into the new trashBin
        migratePreTrashBinDeletions();
    }
}

function migratePreTrashBinDeletions() {
    const migratedTrash = [];

    Object.values(classrooms).forEach(classroom => {
        // Migrate deleted classes
        if (classroom.isDeleted) {
            migratedTrash.push({
                id: `trash_${Date.now()}_${Math.random()}`,
                timestamp: classroom.info.creationDate, // Best guess for timestamp
                type: 'classroom',
                description: `کلاس «${classroom.info.name}»`,
                restoreData: { name: classroom.info.name }
            });
        } else {
            // Migrate deleted students
            classroom.students.forEach(student => {
                if (student.isDeleted) {
                    migratedTrash.push({
                        id: `trash_${Date.now()}_${Math.random()}`,
                        timestamp: student.identity.studentId.split('_')[1],
                        type: 'student',
                        description: `دانش‌آموز «${student.identity.name}»`,
                        restoreData: { studentId: student.identity.studentId, classroomName: classroom.info.name }
                    });
                }
            });
            // Migrate other items... (sessions, categories, etc.)
            // Note: We are simplifying here for the initial migration. A more detailed
            // migration could be added for other types if needed.
        }
    });

    // We only add migrated items if the trashBin is empty to avoid duplication
    if (trashBin.length === 0 && migratedTrash.length > 0) {
        trashBin = migratedTrash;
        console.log(`Migrated ${migratedTrash.length} previously deleted item(s) to the new trash bin.`);
        saveData(); // Save the newly migrated trashBin
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

export function renameCategory(classroom, categoryToRename, newName) {
    const trimmedNewName = newName.trim();
    if (!trimmedNewName) {
        return { success: false, message: 'نام دسته‌بندی نمی‌تواند خالی باشد.' };
    }

    // 1. Check for duplicates (among non-deleted categories, excluding the one being renamed)
    const isDuplicate = classroom.categories.some(
        cat => cat.id !== categoryToRename.id &&
            !cat.isDeleted &&
            cat.name.toLowerCase() === trimmedNewName.toLowerCase()
    );

    if (isDuplicate) {
        return { success: false, message: 'دسته‌بندی دیگری با این نام وجود دارد.' };
    }

    const oldName = categoryToRename.name;
    const oldSkillKey = oldName.toLowerCase();
    const newSkillKey = trimmedNewName.toLowerCase();

    // 2. Update the category object itself
    categoryToRename.name = trimmedNewName;

    // 3. Migrate data for all students in the classroom
    classroom.students.forEach(student => {
        if (student.categoryCounts && student.categoryCounts[oldName] !== undefined) {
            student.categoryCounts[trimmedNewName] = student.categoryCounts[oldName];
            delete student.categoryCounts[oldName];
        }
        if (student.categoryIssues && student.categoryIssues[oldName] !== undefined) {
            student.categoryIssues[trimmedNewName] = student.categoryIssues[oldName];
            delete student.categoryIssues[oldName];
        }
        if (student.logs.scores && student.logs.scores[oldSkillKey]) {
            student.logs.scores[oldSkillKey].forEach(score => score.skill = trimmedNewName);
            if (oldSkillKey !== newSkillKey) {
                student.logs.scores[newSkillKey] = student.logs.scores[oldSkillKey];
                delete student.logs.scores[oldSkillKey];
            }
        }
    });

    // 4. Migrate data for all sessions
    classroom.sessions.forEach(session => {
        if (session.lastWinnerByCategory && session.lastWinnerByCategory[oldName]) {
            session.lastWinnerByCategory[trimmedNewName] = session.lastWinnerByCategory[oldName];
            delete session.lastWinnerByCategory[oldName];
        }
        if (session.winnerHistory) {
            session.winnerHistory.forEach(entry => {
                if (entry.categoryName === oldName) {
                    entry.categoryName = trimmedNewName;
                }
            });
        }
    });


    return { success: true };
}

export function moveStudent(studentToMove, sourceClassroom, destinationClassroom) {
    // 1. Check for duplicates in the destination class to prevent conflicts.
    const isDuplicate = getActiveItems(destinationClassroom.students).some(
        s => s.identity.name.toLowerCase() === studentToMove.identity.name.toLowerCase()
    );

    if (isDuplicate) {
        return { success: false, message: `دانش‌آموزی با نام «${studentToMove.identity.name}» از قبل در کلاس «${destinationClassroom.info.name}» وجود دارد.` };
    }

    // 2. Add the student to the new class.
    // We use a deep copy to ensure the original and new student are separate objects.
    const studentCopy = JSON.parse(JSON.stringify(studentToMove));
    destinationClassroom.addStudent(studentCopy);

    // 3. Mark the original student as deleted in the source class.
    const originalStudent = sourceClassroom.students.find(
        s => s.identity.studentId === studentToMove.identity.studentId
    );
    if (originalStudent) {
        originalStudent.isDeleted = true;
    }

    return { success: true };
}





export function resetAllStudentCounters() {
    for (const className in classrooms) {
        const classroom = classrooms[className];
        classroom.students.forEach(student => {
            student.statusCounters = {
                totalSelections: 0,
                missedChances: 0,
                earlyLeaves: 0,
            };
            student.categoryCounts = {};
            student.categoryIssues = {};
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

export function permanentlyDeleteStudent(studentToDelete, classroom) {
    if (!studentToDelete || !classroom) return;

    const studentId = studentToDelete.identity.studentId;

    // 1. Remove the student from the main students array
    const indexToRemove = classroom.students.findIndex(
        s => s.identity.studentId === studentId
    );
    if (indexToRemove > -1) {
        classroom.students.splice(indexToRemove, 1);
    }

    // 2. Remove the student's records from every session in that class
    classroom.sessions.forEach(session => {
        if (session.studentRecords[studentId]) {
            delete session.studentRecords[studentId];
        }
    });
}

export function permanentlyDeleteSession(classroomName, sessionNumber) {
    const classroom = classrooms[classroomName];
    if (!classroom) return;
    const sessionIndex = classroom.sessions.findIndex(s => s.sessionNumber === sessionNumber);
    if (sessionIndex > -1) {
        classroom.sessions.splice(sessionIndex, 1);
    }
}

export function permanentlyDeleteCategory(classroomName, categoryId) {
    const classroom = classrooms[classroomName];
    if (!classroom) return;

    const categoryIndex = classroom.categories.findIndex(c => c.id === categoryId);
    if (categoryIndex === -1) return;

    const category = classroom.categories[categoryIndex];
    const categoryName = category.name;
    const skillKey = categoryName.toLowerCase();

    // Remove associated data from all students
    classroom.students.forEach(student => {
        if (student.categoryCounts) delete student.categoryCounts[categoryName];
        if (student.categoryIssues) delete student.categoryIssues[categoryName];
        if (student.logs.scores) delete student.logs.scores[skillKey];
    });

    // Remove the category object itself
    classroom.categories.splice(categoryIndex, 1);
}

export function permanentlyDeleteScore(classroomName, studentId, skill, scoreId) {
    const classroom = classrooms[classroomName];
    if (!classroom) return;
    const student = classroom.students.find(s => s.identity.studentId === studentId);
    if (!student || !student.logs.scores[skill.toLowerCase()]) return;

    const skillScores = student.logs.scores[skill.toLowerCase()];
    const scoreIndex = skillScores.findIndex(s => s.id === scoreId);
    if (scoreIndex > -1) {
        skillScores.splice(scoreIndex, 1);
    }
}

export function permanentlyDeleteNote(classroomName, studentId, noteId) {
    const classroom = classrooms[classroomName];
    if (!classroom) return;
    const student = classroom.students.find(s => s.identity.studentId === studentId);
    if (!student || !student.profile.notes) return;

    const noteIndex = student.profile.notes.findIndex(n => n.id === noteId);
    if (noteIndex > -1) {
        student.profile.notes.splice(noteIndex, 1);
    }
}

// Functions to control the Demo Mode
export function enterDemoMode() {
    // Create a deep copy of the current state to prevent any direct mutation.
    // JSON.stringify turns the live objects into a string, and JSON.parse creates brand new objects from that string.
    originalStateBackup = JSON.parse(JSON.stringify({ classrooms, trashBin }));
    isDemoMode = true;
}

export function exitDemoMode() {
    isDemoMode = false;
    // Restore the original state by simply re-running the initial data load process.
    loadData();
    originalStateBackup = null;
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

export function setStudentToMove(student) { studentToMove = student; }
export function setSourceClassForMove(classroom) { sourceClassForMove = classroom; }

export function setTrashBin(newTrashBin) { trashBin = newTrashBin; }

export function setSaveCategoryCallback(callback) { saveCategoryCallback = callback; }