import { normalizeText } from '../src/utils.js'; // Adjust path if needed

describe('normalizeText', () => {
    it('normalizes Persian characters and removes spaces', () => {
        expect(normalizeText('ي ك')).toBe('یک');
    });
});