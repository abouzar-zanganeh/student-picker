// @ts-nocheck
/* ==========================================================================
   state.js introduction
   --------------------------------------------------------------------------
   This JS file manages global application state, data persistence 
   (loading/saving), and reactivity references.
   ========================================================================== */


import { Classroom, Student, Session, Category, Homework, Note } from './models.js';
import LZString from 'lz-string';

import CompressionWorker from './compression.worker.js?worker';

// --- وضعیت کلی برنامه (Global State) ---

// This variable @displayedWinnerID is a signal variable that shows if a winner is
// already shown on the page to the user.
export let displayedWinnerID = null;
export function setDisplayedWinnerID(id) {
    displayedWinnerID = id;
}

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

export let assessmentPools = {}; // Tracks { categoryId: { assessmentCandidates: [], pickedCandidatesThisSession: [] } }

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

export let datePickerCallback = null;

//for moving students
export let studentToMove = null;
export let sourceClassForMove = null;

// for Demo Mode
export let isDemoMode = false;
export function setIsDemoMode(value) {
    isDemoMode = value;
}
export let originalStateBackup = null;
export function setOriginalStateBackup(state) {
    originalStateBackup = state;
}

export let trashBin = [];

export let selectedClassIds = [];

export let selectedStudentsForMassComment = [];

export let userSettings = {
    // This object stores the state values for the app settings which can be customized by the user
    isScreenSaverEnabled: true,
    isSoundEnabled: true,
    isVibrationEnabled: true,

    darkModePreference: 'system',  // 'light', 'dark', or 'system'

    isDeveloperMode: false,
    lastRestoreTimestamp: null,
    lastBackupTimestamp: null,
    adminContacts: [],

    warningThresholds: {
        totalAbsences: 4,
        consecutiveAbsences: 2,
        homeworkFailures: 4
    }
};

export let isAssessmentModeActive = false;
export function setIsAssessmentModeActive(value) {
    isAssessmentModeActive = value;
    saveData();
}

export let isModalTransitioning = false; // New flag to track modal transitions
export function setIsModalTransitioning(value) {
    isModalTransitioning = value;
}
//-----------------------

// --- توابع اصلی داده‌ها (Data Functions) ---

let saveTimer = null;

const compressionWorker = new CompressionWorker();

compressionWorker.onmessage = (e) => {
    const compressed = e.data;
    try {
        localStorage.setItem('teacherAssistantData_v2', compressed);
        console.log("Background save complete.");
    } catch (err) {
        console.error("Background storage failed:", err);
    }
};

compressionWorker.onerror = (err) => {
    console.error("❌ Worker Communication Error:", err.message, err);
};

export function saveData(immediate = false) {
    if (isDemoMode) return;

    // 1. Prepare data (Fast, in-memory)
    const appState = {
        classrooms,
        trashBin,
        userSettings,
        isAssessmentModeActive
    };
    const jsonString = JSON.stringify(appState);

    // 2. Immediate Save (Synchronous - Blocks UI, but safe for closing tab)
    if (immediate) {
        if (saveTimer) clearTimeout(saveTimer);
        try {
            const compressed = LZString.compressToUTF16(jsonString);
            localStorage.setItem('teacherAssistantData_v2', compressed);
            console.log("Immediate save complete.");
        } catch (e) {
            console.error("Immediate save failed:", e);
        }
        return;
    }

    // 3. Background Save (Asynchronous - Zero Lag)
    if (saveTimer) clearTimeout(saveTimer);

    saveTimer = setTimeout(() => {
        // Send data to the worker. The UI stays free.
        compressionWorker.postMessage(jsonString);
        saveTimer = null;
    }, 500);
}


export function loadData() {
    const savedData = localStorage.getItem('teacherAssistantData_v2');
    if (!savedData) return;

    let plainData;

    try {
        // 1. Try to decompress first
        const decompressed = LZString.decompressFromUTF16(savedData);

        // If decompressed is null/empty, it means the data wasn't compressed (it's old JSON)
        if (decompressed) {
            plainData = JSON.parse(decompressed);
        } else {
            // Fallback: It's legacy uncompressed JSON
            plainData = JSON.parse(savedData);
        }
    } catch (err) {
        // Double safety net: if decompression crashes, try parsing raw
        console.log("Migration: Parsing legacy uncompressed data...");
        plainData = JSON.parse(savedData);
    }

    if (plainData.classrooms !== undefined && plainData.trashBin !== undefined) {
        rehydrateData(plainData.classrooms);
        trashBin = plainData.trashBin || [];
        userSettings = { ...userSettings, ...plainData.userSettings };
        isAssessmentModeActive = plainData.isAssessmentModeActive || false;
    } else {
        rehydrateData(plainData);
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

// تابع کمکی برای تبدیل آبجکت ساده دانش‌آموز به نمونه کلاس
function _rehydrateStudent(plainStudent) {
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

    studentInstance.qualitativeStats = plainStudent.qualitativeStats || {};

    studentInstance.onboardingSession = plainStudent.onboardingSession || null;

    return studentInstance;
}


export function rehydrateData(plainClassrooms) {
    //Function Description: Main function to rehydrate data from plain data

    classrooms = {};
    for (const className in plainClassrooms) {
        const plainClass = plainClassrooms[className];

        let infoForConstructor;
        if (plainClass.info) {
            // New format: The .info object is already correct.
            infoForConstructor = plainClass.info;
        } else {
            // Old format: The name is the key. We create a new info object
            // by copying the old data and adding the name to it.
            infoForConstructor = { ...plainClass, name: className };
        }
        const classroomInstance = new Classroom(infoForConstructor);

        classroomInstance.isDeleted = plainClass.isDeleted;

        classroomInstance.note = plainClass.note || '';

        classroomInstance.students = (plainClass.students || []).map(_rehydrateStudent);

        classroomInstance.sessions = (plainClass.sessions || []).map(plainSession => {
            const sessionInstance = new Session(plainSession.sessionNumber);
            sessionInstance.isDeleted = plainSession.isDeleted;

            sessionInstance.note = plainSession.note || '';

            sessionInstance.startTime = new Date(plainSession.startTime);

            // If createdAt exists, use it. If not (old data), use startTime.
            sessionInstance.createdAt = plainSession.createdAt
                ? new Date(plainSession.createdAt)
                : new Date(plainSession.startTime);

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
            sessionInstance.winnerHistory = plainWinnerHistory
                .filter(historyEntry => historyEntry && historyEntry.winner) // Safely filters out malformed entries
                .map(historyEntry => {
                    const rehydratedStudent = classroomInstance.students.find(
                        s => s.identity.studentId === historyEntry.winner.identity.studentId
                    );
                    return {
                        winner: rehydratedStudent,
                        categoryName: historyEntry.categoryName,
                        rating: historyEntry.rating || null // --- Preserve the rating ---
                    };
                })
                .filter(hydratedEntry => hydratedEntry.winner); // Now, filter out entries where the student wasn't found

            return sessionInstance;
        });

        classroomInstance.categories = (plainClass.categories || []).map(plainCategory => {
            const categoryInstance = new Category(
                plainCategory.name,
                plainCategory.description,
                plainCategory.isGradedCategory,
                plainCategory.weight || 1
            );
            categoryInstance.id = plainCategory.id;
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
    // 1. Check for duplicates in the destination class.
    const isDuplicate = getActiveItems(destinationClassroom.students).some(
        s => s.identity.name.toLowerCase() === studentToMove.identity.name.toLowerCase()
    );

    if (isDuplicate) {
        return { success: false, message: `دانش‌آموزی با نام «${studentToMove.identity.name}» از قبل در کلاس «${destinationClassroom.info.name}» وجود دارد.` };
    }

    // 2. Create a deep copy of the student object to move.
    const studentCopy = JSON.parse(JSON.stringify(studentToMove));
    const rehydratedStudent = _rehydrateStudent(studentCopy);

    // 3. Manually copy session records
    const sessionRecordsToMove = new Map();
    sourceClassroom.sessions.forEach(session => {
        const record = session.studentRecords[studentToMove.identity.studentId];
        if (record) {
            // We must deep copy the record as well!
            sessionRecordsToMove.set(session.sessionNumber, JSON.parse(JSON.stringify(record)));
        }
    });

    // 4. Add the student copy to the destination class.
    destinationClassroom.addStudent(rehydratedStudent);

    // --- 5. Add an automated note using the class method ---
    try {
        const activeSessions = getActiveItems(destinationClassroom.sessions)
            .filter(s => !s.isCancelled)
            .sort((a, b) => b.sessionNumber - a.sessionNumber);
        const latestActiveSession = activeSessions.length > 0 ? activeSessions[0] : null;

        let displaySessionNumber = "؟";
        let noteSource = { type: 'system', description: 'Student Move' };

        if (latestActiveSession) {
            const sessionDisplayMap = getSessionDisplayMap(destinationClassroom);
            displaySessionNumber = sessionDisplayMap.get(latestActiveSession.sessionNumber) || latestActiveSession.sessionNumber;

            noteSource = { type: 'fromSession', sessionNumber: latestActiveSession.sessionNumber };
        }

        const moveDate = new Date().toLocaleDateString('fa-IR');
        const sourceClassName = sourceClassroom.info.name;
        const noteContent = `این دانش آموز در جلسه ${displaySessionNumber} و در تاریخ ${moveDate} از کلاس «${sourceClassName}» به این کلاس انتقال پیدا کرد`;

        // This is the fix: We call the real .addNote() method on our live instance
        rehydratedStudent.addNote(noteContent, noteSource);

    } catch (error) {
        console.error("Failed to add automated move note:", error);
    }
    // --- END ---

    // 6. Merge the copied session records into the destination class's sessions.
    if (sessionRecordsToMove.size > 0) {
        destinationClassroom.sessions.forEach(destSession => {
            // Find a session in the destination class with the same sessionNumber
            const recordToCopy = sessionRecordsToMove.get(destSession.sessionNumber);
            if (recordToCopy && !destSession.isDeleted && !destSession.isCancelled) {
                // Add the student's record to the matching active session in the new class.
                destSession.studentRecords[rehydratedStudent.identity.studentId] = recordToCopy;
            }
        });
    }

    // 7. Create a trash bin entry for the "move" action ---
    const trashEntry = {
        id: `trash_${Date.now()}_${Math.random()}`,
        timestamp: new Date().toISOString(),
        type: 'student',
        // Description now clarifies it was a move
        description: `(انتقال) دانش‌آموز «${studentToMove.identity.name}» از کلاس «${sourceClassroom.info.name}»`,
        restoreData: {
            studentId: studentToMove.identity.studentId,
            classId: sourceClassroom.info.scheduleCode // Use the unique ID
        }
    };

    addToTrashBin(trashEntry);

    // 8. Mark the original student as deleted (soft delete)
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

/**
 * Filters an array to return only items marked as not deleted. The items include students, 
 * sessions, classes, scores, comments, notes, categories or any object with isDeleted propery.
 * @param {Array} items - Array of objects that may have an 'isDeleted' property
 * @returns {Array} Filtered array containing only active items
 */
export function getActiveItems(items) {


    // A safeguard to ensure we're always working with an array.
    if (!Array.isArray(items)) {
        return [];
    }
    return items.filter(item => !item.isDeleted);
}

/**
 * Maps internal session numbers to sequential display numbers (1, 2, 3...)
 * Cancelled sessions are excluded from the sequence.
 * 
 * @param {Object} classroom - Classroom containing sessions
 * @returns {Map<number, number>} Internal number → Display number
 */
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

/**
 * Permanently removes a student from a classroom and cleans up all session references.
 * @param {Object} student - Student instance to delete
 * @param {Object} classroom - Classroom containing the student
 */
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

    // 2. Remove the student's records and all references from every session
    classroom.sessions.forEach(session => {
        // Remove from studentRecords
        if (session.studentRecords[studentId]) {
            delete session.studentRecords[studentId];
        }

        // Remove from lastWinnerByCategory
        for (const categoryName in session.lastWinnerByCategory) {
            if (session.lastWinnerByCategory[categoryName] === studentId) {
                delete session.lastWinnerByCategory[categoryName];
            }
        }

        // Clear lastSelectedWinnerId if it matches
        if (session.lastSelectedWinnerId === studentId) {
            session.lastSelectedWinnerId = null;
        }

        // Filter them out of the winnerHistory
        session.winnerHistory = session.winnerHistory.filter(
            entry => entry.winner && entry.winner.identity.studentId !== studentId
        );
    });
}

export function permanentlyDeleteSession(classroomName, sessionNumber) {
    const classroom = classrooms[classroomName];
    if (!classroom) return;
    const sessionIndex = classroom.sessions.findIndex(s => s.sessionNumber === sessionNumber);
    if (sessionIndex > -1) {

        // Clean up references to this session in all students
        classroom.students.forEach(student => {
            // Remove any notes sourced from this session
            if (student.profile.notes && student.profile.notes.length > 0) {
                student.profile.notes = student.profile.notes.filter(note =>
                    !note.source ||
                    note.source.type !== 'fromSession' ||
                    note.source.sessionNumber !== sessionNumber
                );
            }

            // Reset onboarding session if it matches
            if (student.onboardingSession === sessionNumber) {
                student.onboardingSession = null;
            }
        });

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

    // Remove from session histories
    classroom.sessions.forEach(session => {
        // Remove from lastWinnerByCategory
        if (session.lastWinnerByCategory[categoryName]) {
            delete session.lastWinnerByCategory[categoryName];
        }

        // Filter out of the winnerHistory
        session.winnerHistory = session.winnerHistory.filter(
            entry => entry.categoryName !== categoryName
        );
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

/**
 * Adds an item to the trash bin and enforces the size limit.
 * If the bin exceeds 50 items, the oldest item is removed and its data is permanently deleted.
 */
export function addToTrashBin(entry) {
    trashBin.unshift(entry);

    // Check for overflow (Zombie Data)
    while (trashBin.length > 50) {
        const overflowItem = trashBin.pop(); // Remove oldest reference
        permanentlyDeleteFromTrash(overflowItem); // Kill the actual data
    }
    saveData();
}

/**
 * Permanently deletes the underlying data of a trash item.
 * This acts as a router, calling the specific delete function based on the item type.
 */
export function permanentlyDeleteFromTrash(entry) {
    if (!entry || !entry.restoreData) return;

    console.log(`🗑️ Auto-cleaning overflow item: ${entry.description}`);

    switch (entry.type) {
        case 'classroom':
            // Classrooms are stored by name in the global object
            if (entry.restoreData.name && classrooms[entry.restoreData.name]) {
                delete classrooms[entry.restoreData.name];
            }
            break;
        case 'student':
            if (entry.restoreData.identity?.studentId) {
                permanentlyDeleteStudent(entry.restoreData.identity.studentId);
            }
            break;
        case 'session':
            if (entry.restoreData.id) {
                permanentlyDeleteSession(entry.restoreData.id);
            }
            break;
        case 'category':
            if (entry.restoreData.id) {
                permanentlyDeleteCategory(entry.restoreData.id);
            }
            break;
        case 'score':
            // Scores usually require the full object to identify the student/session
            permanentlyDeleteScore(entry.restoreData);
            break;
        case 'note':
            if (entry.restoreData.id) {
                permanentlyDeleteNote(entry.restoreData.id);
            }
            break;
    }
}

/**
 * Checks if a classroom has any finished, non-cancelled sessions.
 * @param {Object} classroom - Classroom to check
 * @returns {boolean} True if at least one finished session exists
 */
export function hasPastFinishedSessions(classroom) {
    if (!classroom || !classroom.sessions) return false;
    return getActiveItems(classroom.sessions).some(s => s.isFinished && !s.isCancelled);
}

/**
 * Applies the same attendance status to a student for all past finished sessions.
 * @param {string} studentId - Unique ID of the student
 * @param {Object} classroom - Classroom containing sessions
 * @param {string} status - 'present', 'absent', or 'unknown'
 */
export function applyAttendanceToPastSessions(studentId, classroom, status) {
    if (!classroom || !studentId) return;

    getActiveItems(classroom.sessions)
        .filter(s => s.isFinished && !s.isCancelled)
        .forEach(session => {
            session.setAttendance(studentId, status);
        });
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

export function setSelectedStudentsForMassComment(studentIds) {
    selectedStudentsForMassComment = studentIds;
}

export function setUserSettings(newSettings) {
    userSettings = { ...userSettings, ...newSettings };
    saveData();
}

export function setSelectedClassIds(ids) { selectedClassIds = ids; }

export function setLastBackupTimestamp() {
    userSettings.lastBackupTimestamp = new Date().toISOString();
    saveData();
}

export function setDatePickerCallback(callback) { datePickerCallback = callback; }

export function setAssessmentPools(pools) { assessmentPools = pools; }
export function resetAssessmentPools() { assessmentPools = {}; }

export function markStudentAsPickedForAssessmentInSession(categoryId, studentId) {
    if (!assessmentPools[categoryId]) {
        assessmentPools[categoryId] = { assessmentCandidates: [], pickedCandidatesThisSession: [] };
    }
    if (!assessmentPools[categoryId].pickedCandidatesThisSession.includes(studentId)) {
        assessmentPools[categoryId].pickedCandidatesThisSession.push(studentId);
    }
}