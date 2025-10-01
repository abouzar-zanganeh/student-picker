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

