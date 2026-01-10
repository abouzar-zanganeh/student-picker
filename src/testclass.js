/* ==========================================================================
   testclass.js introduction
   --------------------------------------------------------------------------
   This JS file utility for generating random test classrooms and 
   students to facilitate rapid testing and development.
   ========================================================================== */


import { Classroom, Student } from "./models";
import * as state from "./state";
import * as ui from "./ui";
import * as notifyingMessaging from './notifyingMessaging';
import { parseStudentName } from "./utils";


export function testClassHook(classListHeader) {
    classListHeader.addEventListener('click', () => {
        const now = new Date().getTime();
        if (now - state.easterEggLastClickTime > 500) {
            state.setEasterEggClickCount(1);
        } else {
            state.setEasterEggClickCount(state.easterEggClickCount + 1);
        }
        state.setEasterEggLastClickTime(now);

        if (state.easterEggClickCount === 5) {
            state.setEasterEggClickCount(0);
            notifyingMessaging.showCustomConfirm(
                "آیا از ساخت یک کلاس تستی تصادفی مطمئن هستید؟",
                () => {
                    function createRandomClass() {
                        const testClassName = `کلاس تستی ${Object.keys(state.classrooms).length + 1}`;
                        const newClass = new Classroom({ name: testClassName, type: 'online' });

                        // Updated to include dots for parsing
                        const students = ['علی . رضایی', 'مریم . حسینی', 'زهرا . احمدی', 'رضا . محمدی', 'فاطمه . کریمی'];

                        // Use parseStudentName to populate firstName and lastName correctly
                        students.forEach(name => newClass.addStudent(new Student(parseStudentName(name))));

                        state.classrooms[testClassName] = newClass;
                        state.saveData();
                        ui.renderClassList();
                    }
                    createRandomClass();
                    notifyingMessaging.showNotification("کلاس تستی با موفقیت ساخته شد ✅!");
                },
                { confirmText: 'بساز', confirmClass: 'btn-success' }
            );
        }
    });
}