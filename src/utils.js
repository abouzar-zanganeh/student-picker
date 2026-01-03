import { userSettings } from './state.js';
import * as ui from './ui.js';
import { openContextMenu } from './ui.js';
import { switchDashboardTab } from './ui.js';

export function normalizeText(str) {
    // A safeguard to ensure we're always working with a string
    if (typeof str !== 'string') {
        return '';
    }

    // Chain of replacements for character variations and all whitespace/ZWNJ
    return str
        .replace(/ي/g, 'ی') // Arabic Yeh to Persian Yeh
        .replace(/ك/g, 'ک') // Arabic Kaf to Persian Kaf
        .replace(/[\s\u200c]/g, ''); // Removes all whitespace (\s) and the zero-width non-joiner (\u200c)
}

export function detectTextDirection(str) {
    if (typeof str !== 'string' || str.length === 0) {
        return 'ltr'; // Default to LTR for empty or invalid input
    }

    const rtlRegex = /[\u0590-\u07FF]/;
    return rtlRegex.test(str) ? 'rtl' : 'ltr';
}

export function renderMultiLineText(textContent) {
    // If the input is empty or just whitespace, return an empty string.
    if (!textContent || !textContent.trim()) {
        return '';
    }

    // 1. Split the text into an array of individual lines.
    const lines = textContent.split('\n');

    // 2. Map each line to a <div> with the correct direction.
    const htmlLines = lines.map(line => {
        const direction = detectTextDirection(line);
        // Using '&nbsp;' ensures that empty lines still take up space.
        const content = line || '&nbsp;';
        return `<div dir="${direction}">${content}</div>`;
    });

    // 3. Join the array of HTML strings into a single block.
    return htmlLines.join('');
}

export function normalizeKeyboard(str) {
    if (typeof str !== 'string') {
        return '';
    }

    const keyMap = {
        'q': 'ض', 'w': 'ص', 'e': 'ث', 'r': 'ق', 't': 'ف', 'y': 'غ', 'u': 'ع', 'i': 'ه', 'o': 'خ', 'p': 'ح', '[': 'ج', ']': 'چ',
        'a': 'ش', 's': 'س', 'd': 'ی', 'f': 'ب', 'g': 'ل', 'h': 'ا', 'j': 'ت', 'k': 'ن', 'l': 'م', ';': 'ک', '\'': 'گ',
        'z': 'ظ', 'x': 'ط', 'c': 'ز', 'v': 'ر', 'b': 'ذ', 'n': 'د', 'm': 'پ', ',': 'و'
    };

    let result = '';
    for (let i = 0; i < str.length; i++) {
        const char = str[i].toLowerCase(); // Ensure we match lowercase keys
        result += keyMap[char] || str[i]; // If char is in map, replace it; otherwise, keep original
    }
    return result;
}

export function parseStudentName(input) {
    if (!input || typeof input !== 'string') {
        return { name: '', firstName: '', lastName: '' };
    }

    const parts = input.split('.').map(p => p.trim());

    if (parts.length > 1) {
        const firstName = parts[0];
        const lastName = parts.slice(1).join(' ');
        return {
            firstName,
            lastName,
            name: `${firstName} ${lastName}`.trim()
        };
    }

    return {
        name: input.trim(),
        firstName: '',
        lastName: ''
    };
}

// Singleton AudioContext to prevent resource exhaustion
let sharedAudioContext = null;

export function playSuccessSound() {

    if (!userSettings.isSoundEnabled) return;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    if (!sharedAudioContext) {
        sharedAudioContext = new AudioContext();
    }

    const ctx = sharedAudioContext;

    // Helper function to actually generate the sound
    const generateSound = () => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = 'sine';

        // Use current time relative to the now-active context
        const now = ctx.currentTime;

        // Pitch: 450Hz (Your preference)
        oscillator.frequency.setValueAtTime(450, now);

        // Volume Envelope: Ultra-Short Click (~30ms)
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.3, now + 0.002);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.03);

        oscillator.start(now);
        oscillator.stop(now + 0.04);
    };

    // Robust State Handling:
    // If suspended, resume first, THEN play. Otherwise, play immediately.
    if (ctx.state === 'suspended') {
        ctx.resume().then(() => {
            generateSound();
        }).catch(err => console.error("Audio resume failed:", err));
    } else {
        generateSound();
    }
}
// helper function to use for any type of students names sorting 
export function sortStudents(students) {
    const structured = students.filter(
        s => s.identity.firstName && s.identity.lastName
    );

    const semiStructured = students.filter(
        s =>
            (!s.identity.firstName || !s.identity.lastName) &&
            typeof s.identity.name === 'string'
    );

    const unstructured = students.filter(
        s =>
            (!s.identity.firstName || !s.identity.lastName) &&
            !s.identity.name
    );

    // Sort by last name, then first name (Persian locale)
    structured.sort((a, b) => {
        const last = a.identity.lastName.localeCompare(b.identity.lastName, 'fa');
        if (last !== 0) return last;
        return a.identity.firstName.localeCompare(b.identity.firstName, 'fa');
    });

    // Sort single-string names
    semiStructured.sort((a, b) =>
        a.identity.name.localeCompare(b.identity.name, 'fa')
    );

    return [...structured, ...semiStructured, ...unstructured];
}

// Sets up an element to respond to both double-click (desktop) and double-tap (mobile)
export function setupDoubleAction(element, callback) {
    let lastTap = 0;
    // Handle Desktop
    element.addEventListener('dblclick', callback);
    // Handle Mobile (Custom double-tap detection)
    element.addEventListener('touchend', (e) => {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        if (tapLength < 400 && tapLength > 0) {
            e.preventDefault();
            callback(e);
        }
        lastTap = currentTime;
    });
}

// This function sets up a keyboard shortcut on a given input element whether it is 
// an input or textarea.
export function setupKeyboardShortcut(element, key, callback) {
    if (!element) return;

    element.addEventListener('keydown', (event) => {
        // 1. Special handling for TEXTAREA with 'Enter' key
        if (element.tagName === 'TEXTAREA' && key === 'Enter') {
            // Require Ctrl (or Meta/Command on Mac) + Enter to trigger
            if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                callback(event);
            }
            return; // Exit here so we don't trigger the default behavior below
        }

        // 2. Standard handling for INPUTs (or other keys)
        // This preserves your existing check to ignore Shift+Enter on regular inputs
        if (event.shiftKey && key === 'Enter') return;

        if (event.key === key) {
            callback(event);
        }
    });
}

// This function hides the on-screen keyboard by blurring the focused input element.
export function hideKeyboard(element) {
    if (element && typeof element.blur === 'function' && element?.tagName === 'INPUT') {
        element.blur();
    }
}

// Sets up an input or textarea to auto-select all text on focus
export function setupAutoSelectOnFocus(element) {
    if (!element) return;

    element.addEventListener('focus', () => {
        // The native method that highlights all text
        element.select();
    });
}

// Temporarily applies a blinking error effect to an element for visual feedback
// mostly used when there's invalid input or action.
export function flashElement(element, duration = 4000, shouldScroll = true) {
    if (shouldScroll) {
        scrollToElement(element);
    }

    element.classList.add('blink-error');
    setTimeout(() => {
        element.classList.remove('blink-error');
    }, duration);
}

// Smoothly scrolls the given element into the center of the viewport
export function scrollToElement(element) {
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// --- Utility function to clean up orphaned data with detailed logging ---
function cleanupOrphanedData() {
    console.log("🧹 Starting orphaned data cleanup...");
    let totalOrphansFound = 0;

    for (const className in state.classrooms) {
        const classroom = state.classrooms[className];
        if (classroom.isDeleted) continue;

        let classroomWasAffected = false;

        // List of *good* student IDs
        const existingStudentIds = new Set(
            classroom.students.filter(s => !s.isDeleted).map(s => s.identity.studentId)
        );

        // --- NEW: Map of ALL student IDs (including deleted) to their names ---
        const studentIdToNameMap = new Map(
            classroom.students.map(s => [s.identity.studentId, s.identity.name])
        );

        const classLogs = [];

        classroom.sessions.forEach(session => {
            if (session.isDeleted) return;

            const sessionLogs = [];

            // 1. Clean session.studentRecords
            for (const studentId in session.studentRecords) {
                if (!existingStudentIds.has(studentId)) {
                    // --- UPDATED LOG ---
                    const studentName = studentIdToNameMap.get(studentId) || "Unknown/Deleted";
                    sessionLogs.push(`  - Removed student record for: ${studentName} (ID: ${studentId})`);
                    delete session.studentRecords[studentId];
                    totalOrphansFound++;
                    classroomWasAffected = true;
                }
            }

            // 2. Clean session.lastWinnerByCategory
            for (const categoryName in session.lastWinnerByCategory) {
                const studentId = session.lastWinnerByCategory[categoryName];
                if (!existingStudentIds.has(studentId)) {
                    // --- UPDATED LOG ---
                    const studentName = studentIdToNameMap.get(studentId) || "Unknown/Deleted";
                    sessionLogs.push(`  - Removed '${categoryName}' last winner: ${studentName} (ID: ${studentId})`);
                    delete session.lastWinnerByCategory[categoryName];
                    totalOrphansFound++;
                    classroomWasAffected = true;
                }
            }

            // 3. Clean session.lastSelectedWinnerId
            if (session.lastSelectedWinnerId && !existingStudentIds.has(session.lastSelectedWinnerId)) {
                // --- UPDATED LOG ---
                const studentId = session.lastSelectedWinnerId;
                const studentName = studentIdToNameMap.get(studentId) || "Unknown/Deleted";
                sessionLogs.push(`  - Cleared 'lastSelectedWinnerId': ${studentName} (ID: ${studentId})`);
                session.lastSelectedWinnerId = null;
                totalOrphansFound++;
                classroomWasAffected = true;
            }

            // If this session had logs, add them to the class log buffer
            if (sessionLogs.length > 0) {
                const sessionMap = getSessionDisplayMap(classroom);
                const displayNum = sessionMap.get(session.sessionNumber) || `(#${session.sessionNumber})`;
                classLogs.push({ sessionDisplayNumber: displayNum, logs: sessionLogs });
            }
        });

        // Now, if the class was affected, print its buffered logs
        if (classroomWasAffected) {
            console.group(`➡️ Class: ${className}`); // Start a group for the class
            classLogs.forEach(sessionLog => {
                // Start a *collapsed* group for each session
                console.groupCollapsed(`  Session ${sessionLog.sessionDisplayNumber}`);
                sessionLog.logs.forEach(log => console.warn(log)); // Use warn to make it stand out
                console.groupEnd(); // End session group
            });
            console.groupEnd(); // End class group
        }
    }

    // Final Report
    if (totalOrphansFound > 0) {
        state.saveData();
        console.log(`✅ Cleanup complete! Found and removed ${totalOrphansFound} orphaned references. Data saved.`);
    } else {
        console.log("✅ No orphaned data found. Your data is clean!");
    }
}
export function setupSwipeNavigation() {
    const dashboardPage = document.getElementById('session-dashboard-page');
    const tableContainer = document.getElementById('student-stats-table-container');
    if (!dashboardPage) return;

    let touchStartX = 0;
    let touchEndX = 0;

    dashboardPage.addEventListener('touchstart', (event) => {
        // Check if the touch is inside the table container at all
        if (tableContainer && tableContainer.contains(event.target)) {

            // Find the specific cell (td or th) that was touched
            const touchedCell = event.target.closest('td, th');

            // Check if a cell was touched AND if it's the first child (the sticky 'Name' column)
            if (touchedCell && touchedCell.parentElement.firstElementChild === touchedCell) {
                // It's the 'Name' column. Treat as a TAB-SWITCH.
                touchStartX = event.changedTouches[0].screenX;
            } else {
                // It's any OTHER column or the scrollbar area. Treat as a SCROLL.
                touchStartX = 0; // Signal to ignore this swipe for tab switching
            }
        } else {
            // Touch was outside the table. Treat as a TAB-SWITCH.
            touchStartX = event.changedTouches[0].screenX;
        }
    }, { passive: true });

    dashboardPage.addEventListener('touchend', (event) => {
        if (touchStartX === 0) return; // Do nothing if it was flagged as a scroll

        touchEndX = event.changedTouches[0].screenX;
        handleSwipe();
    });

    function handleSwipe() {
        const minSwipeDistance = 150; // Minimum pixels for a valid swipe
        const swipeDistance = touchStartX - touchEndX;
        const absoluteSwipeDistance = Math.abs(swipeDistance);

        // 1. Check if a valid horizontal swipe occurred
        if (absoluteSwipeDistance > minSwipeDistance) {

            // 2. Check which tab is currently active
            const selectorTabBtn = document.getElementById('selector-tab-btn');
            const isSelectorTabActive = selectorTabBtn.classList.contains('active');

            // 3. Toggle to the *other* tab
            if (isSelectorTabActive) {
                // If Selector is active, switch to Attendance
                ui.showPage('session-dashboard-page', { tab: 'attendance' });
                switchDashboardTab('attendance');
            } else {
                // Otherwise (Attendance must be active), switch to Selector
                ui.showPage('session-dashboard-page', { tab: 'selector' });
                switchDashboardTab('selector');
            }
        }

        // Reset for the next touch
        touchStartX = 0;
        touchEndX = 0;
    }
}

// Context Menu Helper: Opens a context menu at the event's position with the provided menu items
export function attachUniversalContextMenu(target, getMenuItems) {
    let longPressTimer = null;
    const LONG_PRESS_TIME = 500; // tweak if needed

    // ---- Desktop (right-click, Mac ctrl-click) ----
    target.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        openContextMenu(e, getMenuItems(target));
    });

    // ---- Touch long-press (iOS / Android) ----
    target.addEventListener("touchstart", (e) => {
        if (e.touches.length !== 1) return;

        const touch = e.touches[0];

        longPressTimer = setTimeout(() => {
            // Create a synthetic event-like object so your existing logic works
            const fakeEvent = {
                preventDefault: () => { },
                clientX: touch.clientX,
                clientY: touch.clientY,
                target
            };

            openContextMenu(fakeEvent, getMenuItems(target));
        }, LONG_PRESS_TIME);
    });

    ["touchend", "touchmove", "touchcancel"].forEach((ev) => {
        target.addEventListener(ev, () => clearTimeout(longPressTimer));
    });
}
