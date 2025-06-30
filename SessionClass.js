class Session {
    constructor(sessionNumber) {
        // --- بخش ۱: هویت و اطلاعات پایه جلسه ---
        this.sessionNumber = sessionNumber; // شماره جلسه
        this.startTime = new Date();        // تاریخ و زمان دقیق شروع جلسه
        this.endTime = null;                // زمانی که جلسه خاتمه یابد، این مقدار پر می‌شود
        this.isFinished = false;            // آیا جلسه خاتمه یافته است یا خیر
        this.isMakeup = false;              // آیا این یک جلسه جبرانی است یا نه

        // --- بخش ۲: وضعیت لحظه‌ای و رکوردهای جلسه ---
        // در این آبجکت، داده‌های هر دانش‌آموز فقط برای همین جلسه ثبت می‌شود.
        // کلید این آبجکت، ID دانش‌آموز است.
        this.studentRecords = {}; // مثال: { "studentId123": { attendance: 'present', homework: 'complete' ... } }

        // آخرین نفر انتخاب شده برای هر دسته‌بندی در این جلسه
        this.lastWinnerByCategory = {}; // مثال: { "Grammar": "studentId123", "Speaking": "studentId456" }
    }

    // --- بخش ۳: متدهای مدیریتی و اقدامات (ACTIONS) ---

    end() {
        // جلسه را خاتمه یافته علامت می‌زند و زمان پایان را ثبت می‌کند.
        this.isFinished = true;
        this.endTime = new Date();
    }

    markAsMakeup() {
        // جلسه را به عنوان جبرانی علامت‌گذاری می‌کند.
        // این متد توسط متد markSessionAsMakeup در کلاس Classroom فراخوانی می‌شود.
        this.isMakeup = true;
    }
    
    // این متد برای مقداردهی اولیه رکورد یک دانش‌آموز در جلسه استفاده می‌شود.
    initializeStudentRecord(studentId) {
        if (!this.studentRecords[studentId]) {
            this.studentRecords[studentId] = {
                attendance: 'present', // حالت پیش‌فرض حضور
                homework: 'complete',  // حالت پیش‌فرض تکلیف
                selections: {}         // شمارنده انتخاب‌ها برای هر دسته‌بندی
            };
        }
    }

    setAttendance(studentId, status) {
        // وضعیت حضور یک دانش‌آموز را در این جلسه ثبت می‌کند.
        // status می‌تواند یکی از این مقادیر باشد: 'present', 'absent', 'tardy'
        this.initializeStudentRecord(studentId); // برای اطمینان از وجود رکورد
        this.studentRecords[studentId].attendance = status;
    }

    setHomeworkStatus(studentId, status) {
        // وضعیت تکلیف یک دانش‌آموز را در این جلسه ثبت می‌کند.
        // status می‌تواند یکی از این مقادیر باشد: 'complete', 'incomplete', 'missing'
        this.initializeStudentRecord(studentId);
        this.studentRecords[studentId].homework = status;
    }

    addScore(studentInstance, skill, score) {
        // نمره یک مهارت را برای دانش‌آموز ثبت می‌کند.
        // این متد، وظیفه اصلی ثبت نمره را به خود دانش‌آموز محول می‌کند.
        studentInstance.logs.scores[skill].push(score);
    }
    
    selectNextWinner(category, studentList) {
        // <<<< قلب تپنده برنامه: الگوریتم انتخاب وزنی در اینجا پیاده‌سازی خواهد شد >>>>
        // این متد:
        // ۱. لیست کل دانش‌آموزان را از Classroom می‌گیرد.
        // ۲. وضعیت حضور و غیاب آنها در این جلسه را از this.studentRecords بررسی می‌کند.
        // ۳. آخرین نفر انتخاب شده در این دسته‌بندی را از this.lastWinnerByCategory می‌خواند.
        // ۴. بر اساس شمارنده انتخاب‌های هر دانش‌آموز در this.studentRecords[studentId].selections،
        //    یک نفر را به صورت هوشمند انتخاب می‌کند.
        // ۵. شمارنده انتخاب نفر برنده و this.lastWinnerByCategory را به‌روز می‌کند.
        // ۶. آبجکت دانش‌آموز برنده را برمی‌گرداند.
    }
}