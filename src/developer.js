import * as state from './state.js';
import * as ui from './ui.js';
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
    window.dev = {
        state,
        ui,
        utils,
        db,
        main
    };

    console.log("🛠️ Developer Mode Active! Modules exposed to 'window.dev'");

    // Apply visual feedback
    const header = document.querySelector('.app-header h1');
    if (header) {
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
            ui.showNotification("🛠️ حالت توسعه‌دهنده فعال شد.");
            devModeClicks = 0;
        }
    });

    // 2. Deactivation: Long Press
    ui.setupLongPress(header, () => {
        if (!state.userSettings.isDeveloperMode) return;

        ui.showCustomConfirm("آیا از خروج از حالت توسعه‌دهنده مطمئن هستید؟", () => {
            state.setUserSettings({ isDeveloperMode: false });
            state.saveData(true);
            // Refresh to cleanly wipe global objects and reset styles
            window.location.reload();
        }, { confirmText: 'بله', confirmClass: 'btn-warning' });
    });
    isInitialized = true;
}