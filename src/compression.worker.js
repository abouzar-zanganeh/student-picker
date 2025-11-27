import LZString from 'lz-string';

self.onmessage = (e) => {
    try {
        // Debugging: Check if the library loaded correctly
        if (!LZString) {
            throw new Error("LZString library is undefined. Import failed.");
        }

        const jsonString = e.data;
        const compressed = LZString.compressToUTF16(jsonString);

        self.postMessage(compressed);
    } catch (error) {
        // Send the error message back to the main thread so we can see it
        // We throw it so the 'onerror' in state.js catches it, or log it here.
        console.error("🔥 Worker Internal Error:", error);
    }
};