// @ts-nocheck
/* ==========================================================================
   developer.js introduction
   --------------------------------------------------------------------------
   This JS file contains debugging tools and logic for the 
   internal "Developer Mode" to expose state for inspection.
   ========================================================================== */


import * as state from './state.js';
import { currentClassroom, saveData } from './state.js';
import * as ui from './ui.js';
import * as notifyingMessaging from './notifyingMessaging.js';
import * as utils from './otherUtils.js';
import * as db from './db.js';
import * as main from './main.js';

let devModeClicks = 0;
let isInitialized = false;

/**
 * The "Payload": Exposes modules and applies visual styles.
 * This runs whenever Developer Mode is active.
 */
export function bootstrapDeveloperMode() {

    window.dev = {
        state,
        ui,
        utils,
        db,
        main,
        getCurrentStudents,
        clearAllStudents
    };

    console.log("🛠️ Developer Mode Active! Modules exposed to 'window.dev'");

    // Apply visual feedback
    const header = document.querySelector('.app-header h1');
    if (header) {

        header.style.color = 'var(--color-primary)';
        header.classList.add('dev-mode-tilt');
    }


}

function clearAllStudents() {
    const classroom = state.currentClassroom;

    if (!classroom) {
        console.error(`❌ No class is currently selected.`);
        console.log(`Tip: Navigate to a class first, or use dev.state.currentClassroom = dev.state.classrooms["Your Class Name"]`);
        return;
    }

    const studentCount = state.getActiveItems(classroom.students).length;

    if (studentCount === 0) {
        console.log(`ℹ️ Class "${classroom.info.name}" already has no students.`);
        return;
    }

    // Browser confirmation with stronger warning
    const confirmed = confirm(
        `⚠️⚠️⚠️ PERMANENT DELETE WARNING ⚠️⚠️⚠️\n\n` +
        `Class: ${classroom.info.name}\n` +
        `Students to delete: ${studentCount}\n\n` +
        `This will PERMANENTLY DELETE all students.\n` +
        `This action CANNOT be undone. Students will NOT go to trash.\n\n` +
        `Type "DELETE" in the next prompt to confirm.`
    );

    if (!confirmed) {
        console.log(`❌ Deletion cancelled for class "${classroom.info.name}".`);
        return;
    }

    // Second confirmation with text entry
    const confirmationText = prompt(`Type "DELETE" to permanently delete all ${studentCount} students:`);

    if (confirmationText !== "DELETE") {
        console.log(`❌ Deletion cancelled - incorrect confirmation text.`);
        return;
    }

    // Permanently delete all active students
    const activeStudents = [...state.getActiveItems(classroom.students)]; // Copy array since we'll mutate

    activeStudents.forEach(student => {
        // Use the existing permanent deletion function
        state.permanentlyDeleteStudent(student, classroom);
    });

    state.saveData();

    // Refresh UI
    ui.renderSettingsStudentList();
    ui.renderStudentStatsList();
    ui.renderAttendancePage();

    console.log(`🔥 PERMANENTLY deleted ${activeStudents.length} students from class "${classroom.info.name}". This action cannot be undone.`);
}


function getCurrentStudents() {
    const classroom = currentClassroom;
    if (!classroom) return console.error("❌ No class selected");

    const names = state.getActiveItems(classroom.students).map(s => s.identity.name);
    console.log(names.join('\n'));
}

export function activateDeveloperAccessOnConsole() {
    if (isInitialized) {
        console.warn("Developer access is already initialized. Remove the redundant call.");
        return;
    }
    const header = document.querySelector('.app-header h1');
    if (!header) return;

    // 1. Activation: 10 Clicks
    header.addEventListener('click', () => {
        if (state.userSettings.isDeveloperMode) return; // Already active

        devModeClicks++;
        if (devModeClicks === 10) {
            state.setUserSettings({ isDeveloperMode: true });
            bootstrapDeveloperMode();
            notifyingMessaging.showBottomUpNotification("🛠️ حالت توسعه‌دهنده فعال شد.");
            devModeClicks = 0;
        }
    });

    // 2. Deactivation: Long Press
    utils.setupLongPress(header, () => {
        if (!state.userSettings.isDeveloperMode) return;

        notifyingMessaging.showCustomConfirm("آیا از خروج از حالت توسعه‌دهنده مطمئن هستید؟", () => {
            state.setUserSettings({ isDeveloperMode: false });
            saveData(true);
            // Refresh to cleanly wipe global objects and reset styles
            window.location.reload();
        }, { confirmText: 'بله', confirmClass: 'btn-warning' });
    });
    isInitialized = true;
}