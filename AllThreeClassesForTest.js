class Student {
    constructor(identityInfo) {
        this.identity = {
            name: identityInfo.name,
            studentId: identityInfo.studentId || null,
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
            scores: {
                listening: [], 
                speaking: [],
                reading: [],
                writing: [],
            },
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
            scheduleCode: info.scheduleCode || null,
            teacherName: info.teacherName || null,
            type: info.type || 'in-person',
            term: info.term || null,
            scheduleText: info.scheduleText || null,
            level: info.level || null,
            creationDate: new Date(),
        };
        this.students = [];
        this.sessions = [];
        this.categories = ['Vocabulary', 'Grammar', 'Speaking'];
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
            console.log(`جلسه شماره ${sessionNumber} با موفقیت خاتمه یافت.`);
            return true;
        }
        console.log(`خطا: جلسه شماره ${sessionNumber} یافت نشد یا از قبل خاتمه یافته است.`);
        return false;
    }

    getSession(sessionNumber) {
        return this.sessions.find(s => s.sessionNumber === sessionNumber);
    }

    markSessionAsMakeup(sessionNumber) {
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
        console.log("خطا: هیچ جلسه زنده‌ای برای انتخاب دانش‌آموز وجود ندارد.");
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
            console.log(`جلسه زنده (شماره ${sessionToEnd.sessionNumber}) خاتمه یافت.`);
            return true;
        }
        return false;
    }

    getOverallClassAverage() {
        if (this.students.length === 0) return 0;
        const totalAverage = this.students.reduce((sum, student) => {
            return sum + student.getOverallAverage(); 
        }, 0);
        return totalAverage / this.students.length;
    }

    getAtRiskStudents() {
        return this.students.filter(student => student.isAtRisk());
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