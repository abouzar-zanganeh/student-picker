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

