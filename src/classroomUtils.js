// @ts-nocheck
import * as state from './state.js'
import { getActiveItems, currentClassroom } from './state.js';

export function getAbsentStudents() {

    const absentStudents = getActiveItems(currentClassroom.students).filter(student => {
        const record = state.selectedSession.studentRecords[student.identity.studentId];
        return record && record.attendance === 'absent';
    });

    return absentStudents;
}

export function getPresentStudents() {

    const presentStudents = getActiveItems(currentClassroom.students).filter(student => {
        const record = state.selectedSession.studentRecords[student.identity.studentId];
        return record && record.attendance === 'present';
    });

    return presentStudents;
}