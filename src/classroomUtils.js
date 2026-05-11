import * as state from './state.js'
import { getActiveItems } from './state.js';

export function getAbsentStudents() {

    const absentStudents = getActiveItems(state.currentClassroom.students).filter(student => {
        const record = state.selectedSession.studentRecords[student.identity.studentId];
        return record && record.attendance === 'absent';
    });

    return absentStudents;
}

export function getPresentStudents() {

    const presentStudents = getActiveItems(state.currentClassroom.students).filter(student => {
        const record = state.selectedSession.studentRecords[student.identity.studentId];
        return record && record.attendance === 'present';
    });

    return presentStudents;
}