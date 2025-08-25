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

// --- Console Debugging Utilities ---
export function backfillClassroomDates(state) {
    const classOrder = [
        "Pre1 Sat 9:00",
        "Inter1 Sat 16:30",
        "Ad2 Sat 18:30",
        "Ad1 Sun 10:45",
        "High2 Sun 14:30",
        "Inter2 Sun 16:30",
        "Pre1 Sun 18:30"
    ];

    const startDate = new Date('2025-07-12T09:00:00Z'); // Corresponds to July 12, 2025

    console.group("Starting Classroom Date Backfill...");

    classOrder.forEach((className, index) => {
        if (state.classrooms[className]) {
            // Add 1 second for each subsequent class to create a unique, ordered timestamp
            const newDate = new Date(startDate.getTime() + index * 1000);
            state.classrooms[className].info.creationDate = newDate;
            console.log(`Updated "${className}" creationDate to: ${newDate.toISOString()}`);
        } else {
            console.warn(`Class "${className}" not found. Skipping.`);
        }
    });

    state.saveData();
    console.log("✅ All creation dates have been updated and saved to localStorage.");
    console.groupEnd();
    alert("Classroom date backfill is complete! Check the console for details.");
}
