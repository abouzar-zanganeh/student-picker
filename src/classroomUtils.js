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
 * Checks if a student has a homework 'none' warning in the current session.
 * @param {Object} student - Student instance
 * @param {Object} session - Current session
 * @returns {boolean} True if homework status is 'none'
 */
export function hasHomeworkNoneWarning(student, session) {
    if (!student || !session) return false;
    const record = session.studentRecords[student.identity.studentId];
    return record && record.homework && record.homework.status === 'none';
}