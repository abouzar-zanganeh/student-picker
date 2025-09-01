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

export function backfillHomeworkStatus(state) {
    console.group("Starting Homework Status Backfill...");
    let updatedCount = 0;

    for (const className in state.classrooms) {
        const classroom = state.classrooms[className];
        console.log(`Processing classroom: "${className}"`);

        classroom.sessions.forEach(session => {
            for (const studentId in session.studentRecords) {
                const record = session.studentRecords[studentId];
                // Ensure the homework object exists and its status isn't already 'complete'.
                if (record.homework && record.homework.status !== 'complete') {
                    record.homework.status = 'complete';
                    updatedCount++;
                }
            }
        });
    }

    if (updatedCount > 0) {
        state.saveData();
        console.log(`✅ Backfill complete. ${updatedCount} homework records were updated to 'complete' and saved.`);
    } else {
        console.log("No records needed updating. All relevant homework statuses were already 'complete'.");
    }
    console.groupEnd();
    alert("Homework backfill process is complete! Check the console for details.");
}