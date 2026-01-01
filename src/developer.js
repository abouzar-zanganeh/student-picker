import * as ui from "./ui";
import * as state from "./state";
import * as utils from "./utils";
import * as db from "./db";
import * as main from "./main";

// ---- Developer Mode Activation Logic ---- //
export let devModeClicks = 0;
export function exposeToConsole() {
    document.querySelector('.app-header h1').addEventListener('click', () => {
        devModeClicks++;

        if (devModeClicks === 10) {
            // Expose modules to a global namespace
            window.dev = {
                state,
                ui,
                utils,
                db,
                main,
                developer
            };

            console.log("🛠️ Developer Mode Activated! Access modules via the 'dev' object (e.g., dev.state.currentClassroom)");
            ui.showNotification("🛠️ حالت توسعه‌دهنده فعال شد.");

            // Visual feedback: brief pulse animation on the header
            document.querySelector('.app-header h1').style.color = 'var(--color-primary)';
            document.querySelector('.app-header h1').classList.add('dev-mode-tilt');
        }
    });
}
// ---- end of Developer Mode Activation Logic ---- //
