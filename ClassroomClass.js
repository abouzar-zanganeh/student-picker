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
        // (تغییر یافته) این متد حالا از Getter هوشمند liveSession استفاده می‌کند.
        const liveSession = this.liveSession; // دریافت جلسه زنده و فعال
        if (liveSession) {
            // وظیفه انتخاب را به خود جلسه زنده محول می‌کند
            return liveSession.selectNextWinner(category, this.students);
        }
        console.log("خطا: هیچ جلسه زنده‌ای برای انتخاب دانش‌آموز وجود ندارد.");
        return null; // اگر هیچ جلسه زنده‌ای وجود نداشته باشد
    }

    // --- بخش جدید: متدهای کمکی برای مدیریت وضعیت جلسه ---
    // این متدها به منطق اصلی برنامه کمک می‌کنند تا وضعیت جلسات را بهتر درک کند.
    get liveSession() {
        // یک Getter هوشمند که آخرین جلسه خاتمه نیافته را به عنوان جلسه "زنده" برمی‌گرداند.
        // این متد از آخر لیست شروع به گشتن می‌کند.
        for (let i = this.sessions.length - 1; i >= 0; i--) {
            if (!this.sessions[i].isFinished) {
                return this.sessions[i];
            }
        }
        return null; // اگر تمام جلسات خاتمه یافته باشند
    }

    endLiveSession() {
        // یک متد راحت برای خاتمه دادن به جلسه زنده فعلی.
        const sessionToEnd = this.liveSession;
        if (sessionToEnd) {
            sessionToEnd.end();
            console.log(`جلسه زنده (شماره ${sessionToEnd.sessionNumber}) خاتمه یافت.`);
            return true;
        }
        return false;
    }


    // --- بخش ۴: متدهای گزارش‌گیری و تحلیل (GETTERS & REPORTS) ---
    // این بخش بدون تغییر باقی می‌ماند چون منطق آن به وضعیت زنده/منتخب ارتباطی ندارد.

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
        // نسخه نهایی: ابتدا وجود تمام نمرات را بررسی کرده و سپس با فرمول جدید محاسبه می‌کند.
        const scores = student.logs.scores;
        const requiredSkills = ['listening', 'speaking', 'reading', 'writing'];

        // مرحله ۱: بررسی وجود نمرات برای تمام مهارت‌های الزامی
        for (const skill of requiredSkills) {
            if (!scores[skill] || scores[skill].length === 0) {
                // اگر حتی برای یک مهارت نمره‌ای ثبت نشده باشد، محاسبه را متوقف می‌کند.
                console.log(`محاسبه نمره برای دانش‌آموز «${student.identity.name}» انجام نشد. دلیل: نمره‌ای برای مهارت «${skill}» ثبت نشده است.`);
                return null; 
            }
        }

        // تابع کمکی برای محاسبه میانگین که حالا می‌دانیم آرایه آن خالی نیست.
        const getSkillAverage = (skill) => {
            return scores[skill].reduce((a, b) => a + b, 0) / scores[skill].length;
        };

        // مرحله ۲: محاسبه میانگین‌ها بر اساس منطق جدید
        const listeningAvg = getSkillAverage('listening');
        const speakingAvg = getSkillAverage('speaking');
        const readingAvg = getSkillAverage('reading');
        const writingAvg = getSkillAverage('writing');
        
        // ترکیب میانگین‌های Listening و Speaking
        const combinedListeningSpeakingAvg = (listeningAvg + speakingAvg) / 2;

        // مرحله ۳: اعمال فرمول نهایی با وزن‌ها و مخرج صحیح
        const numerator = (combinedListeningSpeakingAvg * 3) + (readingAvg * 2) + (writingAvg * 1);
        const finalScore = numerator / 6;

        // گرد کردن نتیجه و برگرداندن آن
        return Math.round(finalScore * 100) / 100;
    }

    assignAllFinalScores() {
        // نسخه نهایی: نتیجه null را مدیریت کرده و گزارش کاملی از عملیات ارائه می‌دهد.
        let successCount = 0;
        let failedStudentsNames = []; // آرایه‌ای برای نگهداری اسامی دانش‌آموزان ناموفق

        console.log("شروع عملیات محاسبه نمره نهایی برای تمام دانش‌آموزان...");

        this.students.forEach(student => {
            const calculatedScore = this.calculateFinalStudentScore(student);

            if (calculatedScore !== null) {
                student.finalClassActivityScore = calculatedScore;
                successCount++;
            } else {
                student.finalClassActivityScore = null;
                // نام دانش‌آموز ناموفق به لیست اضافه می‌شود
                failedStudentsNames.push(student.identity.name);
            }
        });

        const failedCount = failedStudentsNames.length;
        console.log(`عملیات پایان یافت. تعداد نمرات موفق: ${successCount} | تعداد ناموفق (نمرات ناقص): ${failedCount}`);

        // اگر دانش‌آموز ناموفقی وجود داشته باشد، اسامی آن‌ها را چاپ می‌کند
        if (failedCount > 0) {
            console.log("اسامی دانش‌آموزانی که نمراتشان ناقص است:");
            failedStudentsNames.forEach(name => console.log(`- ${name}`));
        }
    }
}