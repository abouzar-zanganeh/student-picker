/* ==========================================================================
   developer.js introduction
   --------------------------------------------------------------------------
   This JS file contains debugging tools and logic for the 
   internal "Developer Mode" to expose state for inspection.
   ========================================================================== */


import * as state from './state.js';
import * as ui from './ui.js';
import * as notifyingMessaging from './notifyingMessaging.js';
import * as utils from './utils.js';
import * as db from './db.js';
import * as main from './main.js';

let devModeClicks = 0;
let isInitialized = false;

/**
 * The "Payload": Exposes modules and applies visual styles.
 * This runs whenever Developer Mode is active.
 */
export function bootstrapDeveloperMode() {
    // @ts-ignore
    window.dev = {
        state,
        ui,
        utils,
        db,
        main,
        getCurrentStudents: () => {
            const classroom = state.currentClassroom;
            if (!classroom) return console.error("❌ No class selected");

            const names = state.getActiveItems(classroom.students).map(s => s.identity.name);
            console.log(names.join('\n'));
        }
    };

    console.log("🛠️ Developer Mode Active! Modules exposed to 'window.dev'");

    // Apply visual feedback
    const header = document.querySelector('.app-header h1');
    if (header) {
        // @ts-ignore
        header.style.color = 'var(--color-primary)';
        header.classList.add('dev-mode-tilt');
    }
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
            notifyingMessaging.showNotification("🛠️ حالت توسعه‌دهنده فعال شد.");
            devModeClicks = 0;
        }
    });

    // 2. Deactivation: Long Press
    utils.setupLongPress(header, () => {
        if (!state.userSettings.isDeveloperMode) return;

        notifyingMessaging.showCustomConfirm("آیا از خروج از حالت توسعه‌دهنده مطمئن هستید؟", () => {
            state.setUserSettings({ isDeveloperMode: false });
            state.saveData(true);
            // Refresh to cleanly wipe global objects and reset styles
            window.location.reload();
        }, { confirmText: 'بله', confirmClass: 'btn-warning' });
    });
    isInitialized = true;
}