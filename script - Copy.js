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
            return true;
        }
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

// =================================================================
//  بخش ۲: منطق اصلی برنامه، مدیریت وضعیت و رویدادها
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    // --- وضعیت کلی برنامه (Global State) ---
    let classrooms = {}; // آبجکتی برای نگهداری تمام کلاس‌ها بر اساس نام آنها
    let currentClassroom = null; // کلاسی که کاربر در حال کار با آن است
    let liveSession = null; // جلسه زنده‌ای که در حال برگزاری است
    let selectedSession = null; // جلسه‌ای که کاربر برای مشاهده انتخاب کرده

    // --- عناصر HTML ---
    const classManagementPage = document.getElementById('class-management-page');
    const newClassNameInput = document.getElementById('new-class-name');
    const addClassBtn = document.getElementById('add-class-btn');
    const classListUl = document.getElementById('class-list');
    
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
            
            classroomInstance.categories = plainClass.categories;
            classroomInstance.futurePlans = plainClass.futurePlans;

            classrooms[className] = classroomInstance;
        }
    }

    // --- توابع رندر (Render Functions) ---
    function renderClassList() {
        classListUl.innerHTML = '';
        for (const name in classrooms) {
            const classroom = classrooms[name];
            const li = document.createElement('li');
            li.textContent = name;
            li.addEventListener('click', () => {
                currentClassroom = classroom;
                selectedSession = null; 
                liveSession = currentClassroom.liveSession;

                renderSessions();
                updateSessionPageHeader();
                showPage('session-page');
            });
            classListUl.appendChild(li);
        }
    }

    function showPage(pageId) {
        document.querySelectorAll('.page').forEach(page => {
            page.style.display = 'none';
        });
        const pageToShow = document.getElementById(pageId);
        if (pageToShow) {
            pageToShow.style.display = 'block';
        }
    }

    function renderSessions() {
        // This function will be filled in later
        const sessionListUl = document.getElementById('session-list');
        sessionListUl.innerHTML = '<li>No sessions yet.</li>'; 
    }

    function updateSessionPageHeader() {
        // This function will also be expanded later
        const sessionClassNameHeader = document.getElementById('session-class-name-header');
        if (currentClassroom) {
            sessionClassNameHeader.textContent = `کلاس: ${currentClassroom.info.name}`;
        }
    }

    // --- شنودگرهای رویداد (Event Listeners) ---
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