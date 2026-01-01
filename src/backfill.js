// --- Temporary Universal Utility Function ---
// This function can be called from the console to fix student data across ALL classes by
// assigning a student's highest score to his/her writing skill score.
function backfillWritingScoresForAll() {
    console.log("Starting universal backfill for writing scores...");
    let totalStudentsUpdated = 0;

    // Loop through every class in the data.
    for (const className in state.classrooms) {
        const classroom = state.classrooms[className];
        if (classroom.isDeleted) continue; // Skip deleted classes

        let studentsUpdatedInClass = 0;
        const students = state.getActiveItems(classroom.students);

        students.forEach(student => {
            const scores = student.logs.scores;
            // Ensure scores object exists before checking for writing
            const hasWritingScore = scores && scores.writing && scores.writing.length > 0;

            if (!hasWritingScore) {
                let highestScoreValue = -1; // Start with -1 to handle scores of 0

                // Loop through all skill categories for the student
                for (const skill in scores) {
                    if (skill !== 'writing') {
                        scores[skill].forEach(score => {
                            if (score.value > highestScoreValue) {
                                highestScoreValue = score.value;
                            }
                        });
                    }
                }

                // If a valid highest score was found, add it
                if (highestScoreValue > -1) {
                    const comment = `Automatically assigned based on the highest score (${highestScoreValue}) from other skills.`;
                    student.addScore('Writing', highestScoreValue, comment);
                    studentsUpdatedInClass++;
                }
            }
        });

        if (studentsUpdatedInClass > 0) {
            console.log(`Updated ${studentsUpdatedInClass} student(s) in class: ${classroom.info.name}.`);
            totalStudentsUpdated += studentsUpdatedInClass;
        }
    }

    if (totalStudentsUpdated > 0) {
        state.saveData(); // Save all changes at the very end
        console.log(`Update complete. A total of ${totalStudentsUpdated} student(s) were updated across all classes. Data saved.`);
        // Optionally re-render the UI if it's visible
        if (document.getElementById('student-page').classList.contains('active')) {
            ui.renderStudentStatsList();
        }
    } else {
        console.log("No students needed updating in any class.");
    }
}