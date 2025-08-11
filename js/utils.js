export function normalizeText(str) {
    // A safeguard to ensure we're always working with a string
    if (typeof str !== 'string') {
        return '';
    }

    // Chain of replacements for different character variations
    return str
        .replace(/ي/g, 'ی') // Arabic Yeh to Persian Yeh
        .replace(/ك/g, 'ک'); // Arabic Kaf to Persian Kaf
}

export function detectTextDirection(str) {
    // A safeguard to ensure we're always working with a string
    if (typeof str !== 'string' || str.length === 0) {
        return 'ltr'; // Default to LTR for empty or invalid input
    }

    const rtlRegex = /[\u0590-\u07FF]/;
    return rtlRegex.test(str) ? 'rtl' : 'ltr';
}

// --- Console Debugging Utilities ---

// This function will log the current classroom and its active session
function printStatus() {
    console.log("--- Current Status ---");
    if (state.currentClassroom) {
        console.log("Current Classroom:", state.currentClassroom.info.name);
        console.log("Students:", state.currentClassroom.students.length);
        if (state.selectedSession) {
            console.log(`Selected Session: ${state.selectedSession.sessionNumber}`);
        } else {
            console.log("No session is selected.");
        }
    } else {
        console.log("No classroom is selected.");
    }
    console.log("----------------------");
}

// By attaching the function to the 'window' object, we make it accessible from the console.
window.printStatus = printStatus;