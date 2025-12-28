const DB_NAME = 'TeacherAssistantDB';
const DB_VERSION = 1;
const STORE_NAME = 'backups';

// --- Internal Helper: Open the Database ---
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        // Runs only if the DB doesn't exist or version number changes
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                // Create a store that uses 'id' (timestamp) as the unique key
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };

        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

// --- Public API ---

/**
 * Saves a backup file to the database.
 * Automatically deletes the oldest backup if there are more than 10.
 * @param {File|Blob} file The compressed backup file
 * @param {Object} metadata Info about the backup (name, version, etc.)
 */
export async function addBackupSnapshot(file, metadata) {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const record = {
        id: Date.now(), // Unique ID based on time
        file: file,     // The heavy binary blob
        metadata: metadata, // Display info
        timestamp: new Date().toISOString()
    };

    store.add(record);

    // --- Rotation Logic (Keep Max 10) ---
    transaction.oncomplete = () => {
        // Start a new transaction for cleanup to ensure the 'add' is committed first
        const cleanupTx = db.transaction(STORE_NAME, 'readwrite');
        const cleanupStore = cleanupTx.objectStore(STORE_NAME);

        const countRequest = cleanupStore.count();
        countRequest.onsuccess = () => {
            if (countRequest.result > 10) {
                // Fetch all keys (sorted by ID ascending = oldest first)
                const keysRequest = cleanupStore.getAllKeys();
                keysRequest.onsuccess = () => {
                    const keys = keysRequest.result;
                    // Delete items until only 3 remain
                    while (keys.length > 10) {
                        const keyToDelete = keys.shift(); // Remove the first (oldest) key
                        cleanupStore.delete(keyToDelete);
                        console.log(`♻️ Auto-deleted old backup snapshot: ${keyToDelete}`);
                    }
                };
            }
        };
    };
}

/**
 * Retrieves all stored backup snapshots.
 * @returns {Promise<Array>} Array of backup records, sorted newest first.
 */
export async function getBackupSnapshots() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
            // Sort by ID descending (Newest first)
            const results = request.result.sort((a, b) => b.id - a.id);
            resolve(results);
        };
        request.onerror = () => reject(request.error);
    });
}

/**
 * Deletes a specific backup snapshot by ID.
 * @param {number} id The ID of the backup to delete
 */
export async function deleteBackupSnapshot(id) {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.delete(id);
}