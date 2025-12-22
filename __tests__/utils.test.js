import { normalizeText, detectTextDirection, parseStudentName } from '../src/utils.js';
import { vi, describe, it, expect } from 'vitest';

vi.mock('../src/state.js', () => ({
    userSettings: { isSoundEnabled: true }
}));

describe('normalizeText', () => {
    it('normalizes Persian characters and removes spaces', () => {
        expect(normalizeText('ي ك')).toBe('یک');
    });
});

describe('detectTextDirection', () => {
    it('returns "rtl" for Persian text', () => {
        expect(detectTextDirection('سلام')).toBe('rtl');
    });

    it('returns "ltr" for English text', () => {
        expect(detectTextDirection('Hello')).toBe('ltr');
    });

    it('defaults to "ltr" for empty or invalid input', () => {
        expect(detectTextDirection('')).toBe('ltr');
        expect(detectTextDirection(null)).toBe('ltr');
    });
});