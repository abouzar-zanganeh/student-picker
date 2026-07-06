// @ts-nocheck
import * as state from './state.js'
import { getActiveItems, currentClassroom, selectedSession } from './state.js';

export function getAbsentStudents() {

    const absentStudents = getActiveItems(currentClassroom.students).filter(student => {
        const record = selectedSession.studentRecords[student.identity.studentId];
        return record && record.attendance === 'absent';
    });

    return absentStudents;
}

export function getPresentStudents() {

    const presentStudents = getActiveItems(currentClassroom.students).filter(student => {
        const record = selectedSession.studentRecords[student.identity.studentId];
        return record && record.attendance === 'present';
    });

    return presentStudents;
}

/**
 * Calculates the count of sessions where a student has a specific homework status.
 * @param {Object} student - Student instance
 * @param {Object} classroom - Classroom containing sessions
 * @param {string} status - Homework status to count ('none', 'incomplete', or 'complete')
 * @returns {number} Count of sessions with matching status
 */
export function countHomeworkStatus(student, classroom, status) {
    if (!student || !classroom || !status) return 0;

    return classroom.sessions.reduce((count, session) => {
        if (session.isDeleted || session.isCancelled) return count;
        const record = session.studentRecords[student.identity.studentId];
        return count + (record && record.homework && record.homework.status === status ? 1 : 0);
    }, 0);
}



/**
 * Evaluates all warning conditions for a student and returns an array of active warnings.
 * @param {Object} student - Student instance
 * @param {Object} classroom - Classroom containing sessions
 * @param {Object} currentSession - The current session (for homework failure counting)
 * @returns {Array} Array of warning objects: { type, count, threshold, message }
 */
export function getStudentWarnings(student, classroom, currentSession) {
    const thresholds = state.userSettings.warningThresholds || {
        totalAbsences: 4,
        consecutiveAbsences: 2,
        homeworkFailures: 4
    };

    const warnings = [];
    const studentId = student.identity.studentId;

    // 1. Total absences (past sessions only - exclude current session)
    const pastSessions = classroom.sessions.filter(s =>
        !s.isDeleted && !s.isCancelled && s.sessionNumber !== currentSession?.sessionNumber
    );
    const totalAbsences = pastSessions.filter(s =>
        s.studentRecords[studentId]?.attendance === 'absent'
    ).length;
    if (totalAbsences >= thresholds.totalAbsences) {
        warnings.push({
            type: 'total_absences',
            count: totalAbsences,
            threshold: thresholds.totalAbsences,
            message: `غیبت کل: ${totalAbsences} جلسه (آستانه: ${thresholds.totalAbsences})`
        });
    }

    // 2. Consecutive absences (past sessions only)
    const sortedSessions = pastSessions
        .filter(s => s.studentRecords[studentId] !== undefined)
        .sort((a, b) => b.sessionNumber - a.sessionNumber);

    let consecutiveCount = 0;
    for (const session of sortedSessions) {
        if (session.studentRecords[studentId]?.attendance === 'absent') {
            consecutiveCount++;
            if (consecutiveCount >= thresholds.consecutiveAbsences) break;
        } else {
            break;
        }
    }
    if (consecutiveCount >= thresholds.consecutiveAbsences) {
        warnings.push({
            type: 'consecutive_absences',
            count: consecutiveCount,
            threshold: thresholds.consecutiveAbsences,
            message: `غیبت پیاپی: ${consecutiveCount} جلسه (آستانه: ${thresholds.consecutiveAbsences})`
        });
    }

    // 3. Homework failures (none or incomplete) - count current session + past sessions
    const allRelevantSessions = classroom.sessions.filter(s =>
        !s.isDeleted && !s.isCancelled
    );
    const homeworkFailures = allRelevantSessions.filter(s =>
        ['none', 'incomplete'].includes(s.studentRecords[studentId]?.homework?.status)
    ).length;
    if (homeworkFailures >= thresholds.homeworkFailures) {
        warnings.push({
            type: 'homework_failures',
            count: homeworkFailures,
            threshold: thresholds.homeworkFailures,
            message: `مشکل تکلیف: ${homeworkFailures} جلسه (آستانه: ${thresholds.homeworkFailures})`
        });
    }

    return warnings;
}