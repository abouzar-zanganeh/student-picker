const LOG_STORAGE_KEY = 'teacherAssistantLogs_v2';
const MAX_LOG_ITEMS = 100;

/**
 * Retrieves all logs from localStorage and parses them.
 * @returns {object} An object where keys are classroom names and values are log arrays.
 */
function getLogs() {
    try {
        const logs = localStorage.getItem(LOG_STORAGE_KEY);
        return logs ? JSON.parse(logs) : {};
    } catch (error) {
        console.error("Error reading logs from localStorage:", error);
        return {}; // Return an empty object in case of parsing errors
    }
}

/**
 * Saves the entire log object back to localStorage.
 * @param {object} allLogs The complete log object to save.
 */
function saveLogs(allLogs) {
    try {
        localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(allLogs));
    } catch (error) {
        console.error("Error saving logs to localStorage:", error);
    }
}

/**
 * Adds a new log entry for a specific classroom.
 * @param {string} classroomName - The name of the classroom to log against.
 * @param {string} message - The human-readable message for the log.
 * @param {object} action - An object containing data for navigation (e.g., { type: 'VIEW_STUDENT', studentId: '...' }).
 */
export function addLog(classroomName, message, action = null) {
    if (!classroomName) return;

    const allLogs = getLogs();
    if (!allLogs[classroomName]) {
        allLogs[classroomName] = [];
    }

    const logEntry = {
        timestamp: new Date().toISOString(),
        message,
        action,
        classroomName
    };

    // Add the new entry to the beginning of the array
    allLogs[classroomName].unshift(logEntry);

    // Enforce the log limit by removing the oldest entries
    if (allLogs[classroomName].length > MAX_LOG_ITEMS) {
        allLogs[classroomName].pop();
    }

    saveLogs(allLogs);
}

/**
 * Retrieves the log array for a single classroom.
 * @param {string} classroomName - The name of the classroom.
 * @returns {Array} The array of log entries, or an empty array if none exist.
 */
export function getLogsForClass(classroomName) {
    const allLogs = getLogs();
    return allLogs[classroomName] || [];
}

/**
 * Clears all logs from localStorage. Used during backup restore.
 */
export function clearAllLogs() {
    localStorage.removeItem(LOG_STORAGE_KEY);
    console.log("All activity logs have been cleared.");
}

/**
 * Renames a classroom's log history key.
 * @param {string} oldName - The original name of the classroom.
 * @param {string} newName - The new name for the classroom.
 */
export function renameClassroomLog(oldName, newName) {
    const allLogs = getLogs();
    // Check if a log for the old name exists and there isn't one for the new name
    if (allLogs[oldName] && !allLogs[newName]) {
        allLogs[newName] = allLogs[oldName]; // Copy the history to the new key
        delete allLogs[oldName];             // Remove the old key
        saveLogs(allLogs);
    }
}