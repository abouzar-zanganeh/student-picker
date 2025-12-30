import { userSettings } from './state.js';

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