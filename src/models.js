// =================================================================
//  بخش ۱: تعریف کلاس‌ها (بلوپرینت‌های معماری جدید)
// =================================================================

export const EDUCATIONAL_SYSTEMS = {
    ili: {
        id: 'ili',
        label: 'کانون زبان ایران',
        levels: [
            // Kids
            'Primer 1', 'Primer 2',
            'Step Up 1', 'Step Up 2', 'Step Up 3', 'Step Up 4',
            'Move Up 1', 'Move Up 2', 'Move Up 3', 'Move Up 4',
            'Jump Up 1', 'Jump Up 2', 'Jump Up 3', 'Jump Up 4',

            // Young Adults
            'Start 1',
            'Run 1', 'Run 2', 'Run 3', 'Run 4',
            'Race 1', 'Race 2', 'Race 3',
            'Reach 1', 'Reach 2', 'Reach 3', 'Reach 4',

            // Adults
            'Basic 1', 'Basic 2', 'Basic 3',
            'Elementary 1', 'Elementary 2', 'Elementary 3',
            'Pre-intermediate 1', 'Pre-intermediate 2', 'Pre-intermediate 3',
            'Intermediate 1', 'Intermediate 2', 'Intermediate 3',
            'High-intermediate 1', 'High-intermediate 2', 'High-intermediate 3',
            'Advanced 1', 'Advanced 2', 'Advanced 3'
        ]
    },

    school: {
        id: 'school',
        label: 'آموزش و پرورش',
        levels: [
            'کلاس اول', 'کلاس دوم', 'کلاس سوم',
            'کلاس چهارم', 'کلاس پنجم', 'کلاس ششم',
            'کلاس هفتم', 'کلاس هشتم', 'کلاس نهم',
            'کلاس دهم', 'کلاس یازدهم', 'کلاس دوازدهم'
        ]
    },
    custom: {
        id: 'custom',
        label: 'سایر / آزاد',
        levels: []
    }
};

export class Student {
    constructor(identityInfo) {
        this.identity = {
            name: identityInfo.name,

            firstName: identityInfo.firstName || null,
            lastName: identityInfo.lastName || null,

            studentId: identityInfo.studentId || `id_${new Date().getTime()}_${Math.random()}`,
            branchName: identityInfo.branchName || null,
            ageGroup: identityInfo.ageGroup || 'adult',
            level: identityInfo.level || null,
            contact: {
                social: identityInfo.socialContact || null,
                parent: identityInfo.parentContact || null,
            }
        };
        this.isDeleted = false;
        this.statusCounters = {
            totalSelections: 0,
            missedChances: 0,
            earlyLeaves: 0,
            outOfClassCount: 0,
        };

        this.categoryCounts = {};
        this.categoryIssues = {};

        this.qualitativeStats = {}; // Stores qualitative feedback per category: { "Grammar": { effort: 0, good: 0, excellent: 0 } }

        this.logs = {
            parentContacts: [],
            scores: {},
            discipline: {}, // stores positives and negatives objects
            sessionHistory: {},
        };
        this.profile = {
            notes: [],
            tags: [],
        };
        this.finalClassActivityScore = null;
        this.onboardingSession = null;
    }

    addScore(skill, value, comment) {
        if (value > 100 || value < 0) {
            console.log("نمره نباید از ۱۰۰ بیشتر و از صفر کمتر باشد");
            return;
        }
        const skillKey = skill.toLowerCase(); // Normalize the key to lowercase
        if (!this.logs.scores[skillKey]) {
            this.logs.scores[skillKey] = [];
        }
        // Still pass the original skill name to the Score object for display purposes
        const newScore = new Score(skill, value, comment);
        this.logs.scores[skillKey].push(newScore);
    }

    addNote(content, source = null) {
        const newNote = new Note(content, source);
        this.profile.notes.push(newNote);
    }

    getOverallAverageScore() {
        let totalValue = 0;
        let scoreCount = 0;

        for (const skill in this.logs.scores) {
            this.logs.scores[skill].forEach(score => {
                if (!score.isDeleted) {
                    totalValue += score.value;
                    scoreCount++;
                }
            });
        }

        // To avoid dividing by zero...
        if (scoreCount === 0) {
            return null;
        }

        const average = totalValue / scoreCount;
        return Math.round(average * 100) / 100;
    }
}

export class Score {
    constructor(skill, value, comment = '') {
        this.id = `score_${new Date().getTime()}`;
        this.skill = skill;
        this.value = value;
        this.timestamp = new Date();
        this.comment = comment;
        this.isDeleted = false;
    }
}

export class Note {
    constructor(content, source = null) {
        this.id = `note_${new Date().getTime()}`;
        this.timestamp = new Date();
        this.content = content;
        this.isDeleted = false;
        this.source = source;
    }
}

export class Homework {
    constructor(status = 'complete', comment = '') {
        this.status = status; // 'none', 'incomplete', 'complete'
        this.comment = comment;
        this.timestamp = new Date();
    }
}

export class Session {
    constructor(sessionNumber) {
        this.sessionNumber = sessionNumber;

        // startTime: The "Logical" date of the session. 
        // This is what appears in the UI and can be edited by the teacher 
        // (e.g., to record a past cancelled session).
        this.startTime = new Date();

        // createdAt: The "Audit" timestamp. 
        // This marks exactly when the record was created in the system 
        // and should generally remain immutable.
        this.createdAt = new Date();

        this.note = '';
        this.isDeleted = false;
        this.endTime = null;
        this.isFinished = false;
        this.isMakeup = false;
        this.isCancelled = false;
        this.studentRecords = {};
        this.lastWinnerByCategory = {};
        this.lastUsedCategoryId = null;
        this.lastSelectedWinnerId = null;
        this.winnerHistory = [];

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
                attendance: 'present', // 'present', 'absent', 'late', 'leftEarly'
                homework: new Homework(),
                selections: {}, //The recording of how many times a student was selected in this session per category. for example: { "Vocabulary": 2, "Grammar": 1 }.
                hadIssue: false,
                wasOutOfClass: false,
                performanceRatings: {}, // Stores the rating for this session per category: { "Grammar": "good" }

            };
        }
    }

    setAttendance(studentId, status) {
        this.initializeStudentRecord(studentId);
        this.studentRecords[studentId].attendance = status;
    }

    setHomeworkStatus(studentId, status) {
        this.initializeStudentRecord(studentId);
        this.studentRecords[studentId].homework.status = status;
    }

    selectNextWinner(categoryName, studentList, allCategories) {
        // Step 0: Check if there are any students to select from.
        if (!studentList || studentList.length === 0) {
            console.log("هیچ دانش‌آموزی در کلاس برای انتخاب وجود ندارد.");
            return null;
        }

        // Avoid selecting the same student twice in a row for the same category.
        const lastWinnerId = this.lastWinnerByCategory[categoryName];
        let candidates = studentList.filter(s => s.identity.studentId !== lastWinnerId && !s.isDeleted);

        // If filtering leaves no one, it means all students were the last winner.
        // In this case, all students become candidates again.
        if (candidates.length === 0) {
            candidates = studentList;
        }

        // This should ideally not happen if presentStudents has members, but as a safeguard:
        if (candidates.length === 0) {
            return null;
        }

        // Helper to get the total selection count for a student in a given category.
        const getGlobalSelectionCount = (student, catName) => {
            return student.categoryCounts[catName] || 0;
        };

        // Step 1: Primary Filter - Find students with the minimum selections in the CURRENT category.
        const minSelectionCount = Math.min(...candidates.map(s => getGlobalSelectionCount(s, categoryName)));
        const primaryCandidates = candidates.filter(s => getGlobalSelectionCount(s, categoryName) === minSelectionCount);

        let winner;

        // If the primary filter gives a single, clear winner, select them.
        if (primaryCandidates.length === 1) {
            winner = primaryCandidates[0];
        } else if (primaryCandidates.length > 1) {
            // Step 2: First Tie-Breaker - Use the sum of selections in OTHER categories.
            const otherCategoryNames = allCategories
                .filter(c => !c.isDeleted && c.name !== categoryName)
                .map(c => c.name);

            const candidatesWithOtherCounts = primaryCandidates.map(student => {
                const otherCategoriesTotal = otherCategoryNames.reduce((total, catName) => {
                    return total + getGlobalSelectionCount(student, catName);
                }, 0);
                return { student, otherCategoriesTotal };
            });

            const minOtherCount = Math.min(...candidatesWithOtherCounts.map(c => c.otherCategoriesTotal));
            const secondaryCandidates = candidatesWithOtherCounts
                .filter(c => c.otherCategoriesTotal === minOtherCount)
                .map(c => c.student);

            // If the tie-breaker gives a single winner, select them.
            if (secondaryCandidates.length === 1) {
                winner = secondaryCandidates[0];
            } else {
                // Step 3: Final Tie-Breaker - Randomly select from the final tied group.
                winner = secondaryCandidates[Math.floor(Math.random() * secondaryCandidates.length)];
            }
        } else {
            // This is a fallback. If `primaryCandidates` is empty while `candidates` is not,
            // it indicates a logic issue. As a safeguard, we select randomly from the available candidates.
            winner = candidates[Math.floor(Math.random() * candidates.length)];
        }

        // --- Update Winner's Stats ---
        const winnerId = winner.identity.studentId;

        // Ensure a record for the session exists.
        this.initializeStudentRecord(winnerId);

        // Increment the session-specific selection count.
        const sessionSelectionCount = (this.studentRecords[winnerId].selections[categoryName] || 0) + 1;
        this.studentRecords[winnerId].selections[categoryName] = sessionSelectionCount;

        // Increment the student's global counters.
        winner.statusCounters.totalSelections++;
        winner.categoryCounts[categoryName] = (winner.categoryCounts[categoryName] || 0) + 1;

        // Record this winner to avoid immediate re-selection.
        this.lastWinnerByCategory[categoryName] = winnerId;

        return winner;
    }
}

export class Classroom {
    constructor(info) {
        this.info = {
            name: info.name || 'NotNamed',
            teacherName: info.teacherName || null,
            type: info.type || 'in-person',

            educationalSystem: info.educationalSystem || 'custom',

            term: info.term || null,
            scheduleText: info.scheduleText || null,
            level: info.level || null,
            creationDate: info.creationDate ? new Date(info.creationDate) : new Date(),

            // Scheduling Data
            scheduleCode: info.scheduleCode || `code_${new Date().getTime()}`,
            scheduleDays: info.scheduleDays || [], // 0=Sunday, 1=Monday, ..., 6=Saturday
            scheduleStartTime: info.scheduleStartTime || null,
            scheduleEndTime: info.scheduleEndTime || null,
        };
        this.students = [];
        this.sessions = [];
        this.note = '';
        this.isDeleted = false;
        this.categories = [
            // Default participation categories
            new Category('Vocabulary', 'Questions about words and meanings.'),
            new Category('Grammar', 'Questions about sentence structure and rules.'),

            // Default graded categories
            new Category('Listening', undefined, true),
            new Category('Speaking', undefined, true),
            new Category('Reading', undefined, true),
            new Category('Writing', undefined, true)
        ];
        this.futurePlans = {};
    }

    addStudent(studentInstance) {
        this.students.push(studentInstance);
    }

    startNewSession() {

        const maxSessionNumber = this.sessions.reduce((max, s) => Math.max(max, s.sessionNumber), 0);
        const sessionNumber = maxSessionNumber + 1;

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

    hasSessionToday() {
        const todayString = new Date().toDateString();
        return this.sessions.some(session =>
            !session.isDeleted && session.startTime.toDateString() === todayString);
    }

    selectNextWinner(category, session) {
        if (session) {
            // Pass the full list of categories and all students to the selection algorithm.
            return session.selectNextWinner(category, this.students, this.categories);
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

    calculateFinalStudentScore(student) {
        const activeGradableCategories = this.categories.filter(c => c.isGradedCategory && !c.isDeleted);
        if (activeGradableCategories.length === 0) return null;

        let totalWeightedScore = 0;
        let totalWeight = 0;

        for (const cat of activeGradableCategories) {
            const skillKey = cat.name.toLowerCase();
            const scores = student.logs.scores[skillKey]?.filter(s => !s.isDeleted) || [];

            // Strict Completion Check: If any gradable category has 0 scores, abort calculation.
            if (scores.length === 0) return null;

            const avg = scores.reduce((sum, s) => sum + s.value, 0) / scores.length;
            totalWeightedScore += (avg * (cat.weight || 1));
            totalWeight += (cat.weight || 1);
        }

        if (totalWeight === 0) return null;
        const finalScore = totalWeightedScore / totalWeight;
        return Math.trunc(finalScore * 10) / 10; // Keeping one decimal place
    }
}

export class Category {
    constructor(name, description = '', isGradedCategory = false, weight = 1) {
        this.id = `cat_${new Date().getTime()}_${Math.random()}`;
        this.name = name;
        this.description = description;
        this.isDeleted = false;
        this.isGradedCategory = isGradedCategory;
        this.weight = weight;
        this.isDeleted = false;
    }
}
