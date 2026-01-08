/* ==========================================================================
   demo.js introduction
   --------------------------------------------------------------------------
   This JS file Configures the application for "Demo Mode" by disabling 
   persistence and setting up safe mock interactions.
   ========================================================================== */



import * as state from "./state";
import { classrooms, trashBin, setOriginalStateBackup, loadData, originalStateBackup } from "./state";
import * as ui from "./ui.js";
import { closeSideNav } from "./main.js";



// Functions to control the Demo Mode

export function enterDemoMode() {
    // Create a deep copy of the current state to prevent any direct mutation.
    // JSON.stringify turns the live objects into a string, and JSON.parse creates brand new objects from that string.
    setOriginalStateBackup(JSON.parse(JSON.stringify({ classrooms, trashBin })));
    state.setIsDemoMode(true);
}
export function exitDemoMode() {
    state.setIsDemoMode(false);
    // Restore the original state by simply re-running the initial data load process.
    loadData();
    setOriginalStateBackup(null);
}
export function handleExitDemoMode() {
    ui.showCustomConfirm(
        "آیا از خروج از حالت نمایش (Demo) مطمئن هستید؟ با خروج، تمام تغییرات آزمایشی شما حذف شده و داده‌های اصلی شما بازیابی خواهند شد.",
        () => {
            exitDemoMode();

            // Reset the navigation state before re-rendering
            state.setCurrentClassroom(null);
            state.setSelectedSession(null);
            state.setSelectedStudentForProfile(null);

            ui.renderClassList();
            ui.showPage('class-management-page');
            ui.updateDemoModeBanner();
            closeSideNav(); // Ensure nav is closed if exiting from there
        },
        { confirmText: 'خروج', confirmClass: 'btn-success' }
    );
}
export function prepareDemoModeButtons() {
    const demoModeBtn = document.getElementById('demo-mode-btn'); // for the demo mode (this and the following event listener)
    demoModeBtn.addEventListener('click', () => {
        if (state.isDemoMode) {
            handleExitDemoMode();
        } else {
            closeSideNav();
            ui.showCustomConfirm(
                "شما در حال ورود به حالت نمایش (Demo) هستید. در این حالت، هیچ‌کدام از تغییرات شما ذخیره نخواهد شد. آیا ادامه می‌دهید؟",
                () => {
                    enterDemoMode();
                    ui.updateDemoModeBanner();
                    closeSideNav();
                },
                { confirmText: 'تایید', confirmClass: 'btn-warning', onCancel: closeSideNav }
            );
        }
    });

    const exitDemoBtn = document.getElementById('exit-demo-btn');
    if (exitDemoBtn) {
        exitDemoBtn.addEventListener('click', () => {
            if (state.isDemoMode) {
                handleExitDemoMode();
            }
        });
    }
}

