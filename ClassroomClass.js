class Classroom {
    constructor(info) {
        // --- بخش ۱: هویت و اطلاعات پایه کلاس ---
        // اطلاعات ثابت و شناسنامه‌ای کلاس که در ابتدا تعریف می‌شوند.
        this.info = {
            name: info.name, // نام کلاس (مثال: "Intermediate 2 - Saturdays")
            scheduleCode: info.scheduleCode || null, // کد زمانبندی
            teacherName: info.teacherName || null, // نام مدرس
            type: info.type || 'in-person', // 'online' یا 'in-person'
            term: info.term || null, // ترم (مثال: "بهار ۱۴۰۴")
            scheduleText: info.scheduleText || null, // زمان کلاس (متن توصیفی)
            level: info.level || null, // سطح کلاس
            creationDate: new Date(), // تاریخ ایجاد کلاس در برنامه
        };

        // --- بخش ۲: محتوا و اجزای داخلی ---
        // این بخش، قلب کلاس است و تمام داده‌های اصلی را نگهداری می‌کند.
        this.students = []; // آرایه‌ای از نمونه‌های کلاس Student
        this.sessions = []; // آرایه‌ای از نمونه‌های کلاس Session
        this.categories = ['Vocabulary', 'Grammar', 'Speaking']; // دسته‌بندی‌های پرسش، با یک مقدار اولیه
        
        // برنامه‌ریزی برای جلسات آینده
        this.futurePlans = {}; // مثال: { "12": "امتحان میان‌ترم", "14": "ارائه پروژه" }
    }

    // --- بخش ۳: متدهای مدیریتی (ACTIONS) ---
    // این متدها، اقدامات اصلی معلم روی کلاس را شبیه‌سازی می‌کنند.

    // --- مدیریت دانش‌آموزان ---
    addStudent(studentInstance) {
        // یک نمونه از کلاس Student را به لیست دانش‌آموزان اضافه می‌کند.
        this.students.push(studentInstance);
    }

    removeStudent(studentId) {
        // یک دانش‌آموز را با استفاده از ID او از لیست حذف می‌کند.
        this.students = this.students.filter(s => s.identity.studentId !== studentId);
    }

    // --- مدیریت جلسات ---
    startNewSession() {
        // یک جلسه جدید ایجاد کرده، به لیست جلسات اضافه می‌کند و آن را برمی‌گرداند.
        const sessionNumber = this.sessions.length + 1;
        const newSession = new Session(sessionNumber); // فرض بر اینکه کلاس Session را داریم
        this.sessions.push(newSession);
        return newSession;
    }

    endSpecificSession(sessionNumber) {
        // ابتدا جلسه مورد نظر را با استفاده از شماره آن پیدا می‌کند
        const sessionToEnd = this.getSession(sessionNumber);

        // بررسی می‌کند که آیا جلسه‌ای با این شماره پیدا شده و آیا آن جلسه از قبل خاتمه نیافته است
        if (sessionToEnd && !sessionToEnd.isFinished) {
            // وظیفه خاتمه دادن را به خود آبجکت همان جلسه مشخص محول می‌کند
            sessionToEnd.end();
            console.log(`جلسه شماره ${sessionNumber} با موفقیت خاتمه یافت.`);
            return true; // برای اعلام موفقیت عملیات
        }
        
        // اگر جلسه‌ای پیدا نشود یا از قبل بسته شده باشد
        console.log(`خطا: جلسه شماره ${sessionNumber} یافت نشد یا از قبل خاتمه یافته است.`);
        return false; // برای اعلام عدم موفقیت
    }

    getSession(sessionNumber) {
        // یک جلسه خاص را از لیست جلسات برمی‌گرداند.
        return this.sessions.find(s => s.sessionNumber === sessionNumber);
    }

    markSessionAsMakeup(sessionNumber) {
        // یک جلسه را به عنوان جبرانی علامت‌گذاری می‌کند.
        const session = this.getSession(sessionNumber);
        if (session) {
            session.markAsMakeup(); // فرض بر اینکه متدی با این نام در کلاس Session وجود دارد
        }
    }
    
    planForSession(sessionNumber, planText) {
        // برای یک جلسه در آینده، برنامه‌ریزی ثبت می‌کند.
        this.futurePlans[sessionNumber] = planText;
    }

    // --- منطق اصلی برنامه ---
    selectNextWinner(category) {
        // این متد، ارکستراتور اصلی است.
        const currentSession = this.sessions[this.sessions.length - 1]; // آخرین جلسه به عنوان جلسه فعلی
        if (currentSession) {
            // وظیفه انتخاب را به خود جلسه محول می‌کند (Delegation)
            return currentSession.selectNextWinner(category, this.students);
        }
        return null; // اگر هیچ جلسه‌ای شروع نشده باشد
    }

    // --- بخش ۴: متدهای گزارش‌گیری و تحلیل (GETTERS & REPORTS) ---

    getOverallClassAverage() {
        // میانگین نمرات کل دانش‌آموزان کلاس را محاسبه می‌کند.
        if (this.students.length === 0) return 0;
        const totalAverage = this.students.reduce((sum, student) => {
            // فرض بر اینکه دانش‌آموز متدی برای محاسبه میانگین کل نمراتش دارد
            return sum + student.getOverallAverage(); 
        }, 0);
        return totalAverage / this.students.length;
    }

    getAtRiskStudents() {
        // دانش‌آموزانی که در خطر fail شدن هستند را برمی‌گرداند (مثلاً غیبت زیاد)
        return this.students.filter(student => student.isAtRisk()); // فرض بر وجود متد isAtRisk در Student
    }
    
    calculateFinalStudentScore(student) {
        // نمره نهایی یک دانش‌آموز را طبق فرمول شما محاسبه می‌کند.
        const scores = student.logs.scores;
        const avg = (skill) => scores[skill].length ? scores[skill].reduce((a, b) => a + b, 0) / scores[skill].length : 0;
        
        const listeningAvg = avg('listening');
        const speakingAvg = avg('speaking');
        const readingAvg = avg('reading');
        const writingAvg = avg('writing');
        
        const finalScore = ((listeningAvg + speakingAvg) * 3 + (readingAvg * 2) + writingAvg) / 6;
        return finalScore;
    }

    assignAllFinalScores() {
        // نمره نهایی همه دانش‌آموزان را محاسبه و در پروفایلشان ثبت می‌کند.
        this.students.forEach(student => {
            student.finalClassActivityScore = this.calculateFinalStudentScore(student);
        });
    }
}