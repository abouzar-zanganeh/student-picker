class Student {
    constructor(identityInfo) {
        // --- بخش ۱: هویت و اطلاعات پایه ---
        // این اطلاعات معمولاً در ابتدای ترم ثبت و به ندرت تغییر می‌کنند.
        this.identity = {
            name: identityInfo.name, // نام و نام خانوادگی (مثال: "علی رضایی")
            studentId: identityInfo.studentId || null, // کد زبان آموز
            branchName: identityInfo.branchName || null, // نام شعبه
            ageGroup: identityInfo.ageGroup || 'adult', // رده سنی (مثال: 'teen', 'adult')
            level: identityInfo.level || null, // سطح (مثال: "Intermediate 2")
            contact: {
                social: identityInfo.socialContact || null, // تلفن برای شبکه‌های اجتماعی
                parent: identityInfo.parentContact || null, // تلفن والد
            }
        };

        // --- بخش ۲: وضعیت‌ها و شمارنده‌های کلیدی ---
        // این شمارنده‌ها در طول ترم به طور مداوم به‌روزرسانی می‌شوند.
        this.counters = {
            totalSelections: 0, // تعداد کل فراخوان شده‌ها
            outOfClass: 0,      // تعداد کل دفعات خروج از کلاس
            micIssues: 0,       // تعداد کل مشکلات میکروفون
            earlyLeaves: 0,     // تعداد کل تعجیل‌ها
        };
        
        // --- بخش ۳: عملکرد و رویدادهای تحصیلی (لاگ بوک دانش‌آموز) ---
        // این بخش‌ها تاریخچه دقیق عملکرد دانش‌آموز را ثبت می‌کنند.
        this.logs = {
            // برای ثبت تماس با والدین
            parentContacts: [], // آرایه‌ای از آبجکت‌ها: { date: new Date(), reason: "..." }
            
            // برای ثبت نمرات در هر مهارت
            scores: {
                listening: [], 
                speaking: [],
                reading: [],
                writing: [],
            },

            // برای ثبت وضعیت انضباطی و تشویقی
            discipline: [], // آرایه‌ای از آبجکت‌ها: { date: new Date(), type: 'positive' | 'negative', reason: "..." }
            
            // تاریخچه دقیق هر جلسه
            sessionHistory: {}, // آبجکتی که کلید آن شماره جلسه است. مثال در پایین
            /*
            sessionHistory: {
                "1": { selections: { "Grammar": 1, "Speaking": 2 }, absence: true, tardy: false, homework: 'complete' },
                "2": { selections: { "Vocabulary": 1 }, absence: false, tardy: true, homework: 'missing' }
            }
            */
        };

        // --- بخش ۴: ویژگی‌های خاص و یادداشت‌ها (تگ‌ها و نظرات معلم) ---
        this.profile = {
            // یادداشت‌های کلی معلم در مورد دانش‌آموز
            notes: [], // آرایه‌ای از آبجکت‌ها: { date: new Date(), text: "..." }
            
            // برچسب‌های شخصیتی و عملکردی
            tags: [], // مثال: ['فعال', 'پرحرف', 'قوی در Speaking', 'ضعیف در Grammar']
        };

        // --- بخش ۵: نمره نهایی و کلیدی ---
        this.finalClassActivityScore = null; // نمره نهایی کلاسی
    }

    // --- متدها (ACTIONS & GETTERS) ---
    // در آینده متدهایی برای کار با این داده‌ها اضافه خواهیم کرد.
    // مثال‌هایی از متدهایی که می‌توانیم داشته باشیم:

    // متد برای افزودن یک یادداشت جدید
    // addNote(text) { ... }

    // متد برای ثبت تماس با والدین
    // logParentContact(reason) { ... }

    // متد برای محاسبه میانگین نمرات یک مهارت
    // getAverageScore(skill) { ... }
    
    // متد برای بررسی وضعیت خطر (۴ غیبت)
    // isAtRiskOfFailing() { ... }
}