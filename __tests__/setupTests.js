// Mock the CompressionWorker import to avoid real Worker creation in tests
vi.mock('../src/compression.worker.js?worker', () => {
    return {
        default: class MockWorker {
            postMessage() { } // No-op
            onmessage = null;
            onerror = null;
            terminate() { }
        }
    };
});