import * as state from "./state";


export function prepareScreenSaverToggle(screensaverToggle, initializeScreenSaver, deinitializeScreenSaver) {
    screensaverToggle.addEventListener('change', (e) => {
        if (e.target.checked) {
            // Enable
            state.setUserSettings({ isScreenSaverEnabled: true });
            initializeScreenSaver();
        } else {
            // Disable
            state.setUserSettings({ isScreenSaverEnabled: false });
            deinitializeScreenSaver();
        }
    });
}
