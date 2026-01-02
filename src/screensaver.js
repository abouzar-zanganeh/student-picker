import * as state from './state.js';

let inactivityTimer = null;

const INACTIVITY_TIMEOUT = 2 * 60 * 1000;
const eventTypes = ['mousemove', 'keypress', 'scroll', 'click', 'touchstart'];

let screenSaverOverlay = null;

function showScreenSaver() {
    screenSaverOverlay.classList.add('visible');
}

function hideScreenSaver() {
    screenSaverOverlay.classList.remove('visible');
}

function resetInactivityTimer() {
    hideScreenSaver();
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(showScreenSaver, INACTIVITY_TIMEOUT);
}

function handleOverlayInteraction(e) {
    e.preventDefault();
    e.stopPropagation();
    setTimeout(resetInactivityTimer, 0);
}

export function initializeScreenSaver() {
    if (!screenSaverOverlay) {
        screenSaverOverlay = document.getElementById('screen-saver-overlay');
        if (!screenSaverOverlay) return;
    }

    resetInactivityTimer();

    eventTypes.forEach(event =>
        window.addEventListener(event, resetInactivityTimer)
    );

    screenSaverOverlay.addEventListener('click', handleOverlayInteraction);
    screenSaverOverlay.addEventListener('touchstart', handleOverlayInteraction);

    const version = import.meta.env.VITE_APP_VERSION;
    if (version) {
        const el = document.getElementById('screen-saver-version');
        if (el) el.textContent = `v${version}`;
    }
}

export function deinitializeScreenSaver() {
    clearTimeout(inactivityTimer);
    hideScreenSaver();

    eventTypes.forEach(event =>
        window.removeEventListener(event, resetInactivityTimer)
    );

    if (screenSaverOverlay) {
        screenSaverOverlay.removeEventListener('click', handleOverlayInteraction);
        screenSaverOverlay.removeEventListener('touchstart', handleOverlayInteraction);
    }
}

/**
 * Wires the settings toggle to the screensaver feature.
 * This is screensaver-specific, not a generic helper.
 */
export function prepareScreenSaverToggle(toggleElement) {
    if (!toggleElement) return;

    toggleElement.addEventListener('change', (e) => {
        const enabled = e.target.checked;

        state.setUserSettings({ isScreenSaverEnabled: enabled });

        if (enabled) {
            initializeScreenSaver();
        } else {
            deinitializeScreenSaver();
        }
    });
}
