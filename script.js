
    document.addEventListener('DOMContentLoaded', () => {
        // --- HTML Elements ---
        const classManagementPage = document.getElementById('class-management-page');
        const studentPage = document.getElementById('student-page');
        const settingsPage = document.getElementById('settings-page');
        const csvPreviewPage = document.getElementById('csv-preview-page');
        const newClassNameInput = document.getElementById('new-class-name');
        const addClassBtn = document.getElementById('add-class-btn');
        const classListUl = document.getElementById('class-list');
        const classNameHeader = document.getElementById('class-name-header');
        const settingsClassNameHeader = document.getElementById('settings-class-name-header');
        const backToClassesBtns = document.querySelectorAll('.back-to-classes-btn');
        const newStudentNameInput = document.getElementById('new-student-name');
        const addStudentBtn = document.getElementById('add-student-btn');
        const studentListUl = document.getElementById('student-list');
        const settingsStudentListUl = document.getElementById('settings-student-list');
        const selectStudentBtn = document.getElementById('select-student-btn');
        const selectedStudentResult = document.getElementById('selected-student-result');
        const csvFileInput = document.getElementById('csv-file-input');
        const importCsvBtn = document.getElementById('import-csv-btn');
        const pasteArea = document.getElementById('paste-area');
        const processPasteBtn = document.getElementById('process-paste-btn');
        const csvPreviewList = document.getElementById('csv-preview-list');
        const csvConfirmBtn = document.getElementById('csv-confirm-btn');
        const csvCancelBtn = document.getElementById('csv-cancel-btn');
        const studentManagementToggle = document.getElementById('student-management-toggle');
        const studentManagementContent = document.getElementById('student-management-content');
        const undoToast = document.getElementById('undo-toast');
        const undoMessage = document.getElementById('undo-message');
        const undoBtn = document.getElementById('undo-btn');

        // --- State Management ---
        let schoolData = {};
        let currentClass = null;
        let lastWinner = null;
        let namesToImport = [];
        let previousState = null;
        let undoTimeout = null;

        // --- Core Functions ---
        function saveData() { localStorage.setItem('teacherAssistantData', JSON.stringify(schoolData)); }
        function loadData() {
    const savedData = localStorage.getItem('teacherAssistantData');
    if (savedData) {
        schoolData = JSON.parse(savedData);
        // --- Data Migration for backward compatibility ---
        let needsSave = false;
        for (const className in schoolData) {
            // Check if the old array structure exists and convert it
            if (Array.isArray(schoolData[className])) {
                const students = schoolData[className];
                schoolData[className] = {
                    students: students,
                    lastWinner: null
                };
                needsSave = true;
            }

            // Ensure all students have the new counters
            if (schoolData[className] && schoolData[className].students) {
                schoolData[className].students.forEach(student => {
                    if (student.absenceCount === undefined) {
                        student.absenceCount = 0;
                        needsSave = true;
                    }
                    if (student.problemCount === undefined) {
                        student.problemCount = 0;
                        needsSave = true;
                    }
                });
            }
        }
        if (needsSave) {
            saveData(); // Save the potentially migrated data
        }
    } else {
        schoolData = {};
    }
}
        function showPage(pageId) {
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            document.getElementById(pageId).classList.add('active');
        }

        // --- Undo Functionality ---
        function showUndoToast(message) {
            clearTimeout(undoTimeout);
            if (!previousState) {
                previousState = JSON.stringify(schoolData);
            }
            undoMessage.textContent = toPersianDigits(message);
            undoToast.classList.add('show');
            undoTimeout = setTimeout(() => {
                undoToast.classList.remove('show');
                previousState = null;
            }, 5000);
        }
        function handleUndo() {
            if (previousState) {
                schoolData = JSON.parse(previousState);
                saveData();
                renderClasses();
                if (currentClass && schoolData[currentClass]) {
                    renderStudents();
                } else if (currentClass && !schoolData[currentClass]) {
                    currentClass = null;
                    showPage('class-management-page');
                }
                undoToast.classList.remove('show');
                clearTimeout(undoTimeout);
                previousState = null;
            }
        }
        undoBtn.addEventListener('click', handleUndo);

        // --- Helper & Utility Functions ---
        function toPersianDigits(str) {
            const persian = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
            return str.toString().replace(/\d/g, (d) => persian[d]);
        }
        function calculateSimilarity(s1, s2) {
            let longer = s1; let shorter = s2;
            if (s1.length < s2.length) { longer = s2; shorter = s1; }
            let longerLength = longer.length;
            if (longerLength === 0) return 1.0;
            const normalizedLonger = longer.replace(/[\s\u200c]/g, '');
            const normalizedShorter = shorter.replace(/[\s\u200c]/g, '');
            if (normalizedLonger.length === 0) return 1.0;
            return (normalizedLonger.length - editDistance(normalizedLonger, normalizedShorter)) / parseFloat(normalizedLonger.length);
        }
        function editDistance(s1, s2) {
            s1 = s1.toLowerCase(); s2 = s2.toLowerCase();
            const costs = [];
            for (let i = 0; i <= s1.length; i++) {
                let lastValue = i;
                for (let j = 0; j <= s2.length; j++) {
                    if (i === 0) { costs[j] = j; } 
                    else {
                        if (j > 0) {
                            let newValue = costs[j - 1];
                            if (s1.charAt(i - 1) !== s2.charAt(j - 1))
                                newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                            costs[j - 1] = lastValue;
                            lastValue = newValue;
                        }
                    }
                }
                if (i > 0) costs[s2.length] = lastValue;
            }
            return costs[s2.length];
        }

        // --- Render Functions ---
        function renderStudents() {
    studentListUl.innerHTML = '';
    settingsStudentListUl.innerHTML = '';
    
    if (currentClass && schoolData[currentClass]) {
        const students = schoolData[currentClass].students; // Access students from the new structure

        const renderList = (listElement) => {
            listElement.innerHTML = '';
            students.forEach((student, index) => {
                const li = document.createElement('li');
                const nameSpan = document.createElement('span');
                nameSpan.textContent = toPersianDigits(`${student.name} (انتخاب: ${student.count} | غایب: ${student.absenceCount} | مشکل: ${student.problemCount})`);
                li.appendChild(nameSpan);

                if (listElement === settingsStudentListUl) {
                    const deleteBtn = document.createElement('button');
                    deleteBtn.textContent = 'حذف';
                    deleteBtn.style.backgroundColor = '#dc3545';
                    deleteBtn.addEventListener('click', (event) => {
                        const deleteStudent = () => {
                            if (lastWinner && lastWinner.name === student.name) lastWinner = null;
                            schoolData[currentClass].students.splice(index, 1); // Delete from new structure
                            saveData();
                            renderStudents();
                        };
                        if (event.ctrlKey) {
                            deleteStudent();
                        } else {
                            if (confirm(toPersianDigits(`آیا از حذف دانش‌آموز «${student.name}» مطمئن هستید؟`))) {
                                deleteStudent();
                            }
                        }
                    });
                    li.appendChild(deleteBtn);
                }
                listElement.appendChild(li);
            });
        };
        renderList(studentListUl);
        renderList(settingsStudentListUl);
    }
}
        function renderClasses() {
    classListUl.innerHTML = '';
    for (const className in schoolData) {
        const li = document.createElement('li');
        const nameContainer = document.createElement('span');
        nameContainer.textContent = toPersianDigits(className);
        nameContainer.style.flexGrow = '1';
        nameContainer.style.cursor = 'pointer';
        nameContainer.addEventListener('click', () => {
            currentClass = className;
            classNameHeader.textContent = toPersianDigits(`کلاس: ${currentClass}`);
            
            // Check for a saved last winner and display it
            const savedWinner = schoolData[currentClass].lastWinner;
            if (savedWinner) {
                displayWinner(savedWinner);
            } else {
                selectedStudentResult.innerHTML = '';
            }

            renderStudents();
            showPage('student-page');
        });
        
        const buttonsContainer = document.createElement('div');
        const settingsBtn = document.createElement('button');
        settingsBtn.className = 'btn-icon';
        settingsBtn.innerHTML = '⚙️';
        settingsBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            currentClass = className;
            settingsClassNameHeader.textContent = toPersianDigits(`تنظیمات کلاس: ${currentClass}`);
            renderStudents();
            showPage('settings-page');
        });

        const deleteClassBtn = document.createElement('button');
        deleteClassBtn.className = 'btn-icon';
        deleteClassBtn.innerHTML = '🗑️';
        deleteClassBtn.style.color = '#dc3545';
        deleteClassBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            showUndoToast(`کلاس «${className}» حذف شد.`);
            if(currentClass === className) currentClass = null;
            delete schoolData[className];
            saveData();
            renderClasses();
        });
        
        buttonsContainer.appendChild(settingsBtn);
        buttonsContainer.appendChild(deleteClassBtn);
        li.appendChild(nameContainer);
        li.appendChild(buttonsContainer);
        classListUl.appendChild(li);
    }
}
        function renderImportPreview(names) {
            csvPreviewList.innerHTML = '';
            names.forEach(name => {
                const li = document.createElement('li');
                li.className = 'preview-item';
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = true;
                checkbox.dataset.name = name;
                const label = document.createElement('label');
                label.textContent = name;
                li.appendChild(checkbox);
                li.appendChild(label);
                csvPreviewList.appendChild(li);
            });
        }
        
        // --- Event Listeners ---
       addClassBtn.addEventListener('click', () => {
    const className = newClassNameInput.value.trim();
    if (className && !schoolData[className]) {
        // Create class with the new object structure
        schoolData[className] = {
            students: [],
            lastWinner: null
        };
        saveData();
        renderClasses();
        newClassNameInput.value = '';
    } else if (schoolData[className]) {
        alert('کلاسی با این نام از قبل وجود دارد.');
    }
});
        newClassNameInput.addEventListener('keyup', e => { if (e.key === 'Enter') addClassBtn.click(); });
        backToClassesBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                currentClass = null;
                lastWinner = null;
                showPage('class-management-page');
            });
        });
        addStudentBtn.addEventListener('click', () => {
    const studentName = newStudentNameInput.value.trim();
    if (!studentName || !currentClass) return;

    const classObject = schoolData[currentClass];
    const SIMILARITY_THRESHOLD = 0.80;
    let potentialMatch = null;
    const normalizedNewName = studentName.replace(/[\s\u200c]/g, '');

    for (const existingStudent of classObject.students) {
        const normalizedExistingName = existingStudent.name.replace(/[\s\u200c]/g, '');
        if (normalizedNewName.toLowerCase() === normalizedExistingName.toLowerCase()) {
            potentialMatch = existingStudent;
            break;
        }
    }
    if (!potentialMatch) {
        for (const existingStudent of classObject.students) {
             const similarity = calculateSimilarity(studentName, existingStudent.name);
             if (similarity >= SIMILARITY_THRESHOLD) {
                potentialMatch = existingStudent;
                break;
            }
        }
    }

    const addTheStudent = () => {
        const newStudent = { name: studentName, count: 0, absenceCount: 0, problemCount: 0 };
        classObject.students.push(newStudent);
        saveData();
        renderStudents();
        newStudentNameInput.value = '';
    };

    if (potentialMatch) {
        if (confirm(toPersianDigits(`نام وارد شده «${studentName}» به «${potentialMatch.name}» بسیار شبیه است. \nآیا مطمئنید که این یک دانش آموز جدید است؟`))) {
            addTheStudent();
        }
    } else {
        addTheStudent();
    }
});
        newStudentNameInput.addEventListener('keyup', e => { if (e.key === 'Enter') addStudentBtn.click(); });
        importCsvBtn.addEventListener('click', () => { csvFileInput.click(); });
        csvFileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => { processImportedText(e.target.result); };
                reader.readAsText(file, 'UTF-8');
            }
            event.target.value = null;
        });
        processPasteBtn.addEventListener('click', () => {
            const text = pasteArea.value;
            if (text.trim()) { processImportedText(text); } 
            else { alert("کادر متنی خالی است. لطفاً اسامی را وارد کنید."); }
        });
        function processImportedText(text) {
            let names = text.split('\n').map(name => name.trim()).filter(name => name);
            if (names.length === 0) return;
            const header = names[0].toLowerCase().replace(/[\s"']/g, '');
            if (['name', 'student', 'studentname', 'names', 'nam', 'esm'].includes(header)) {
                names.shift();
            }
            namesToImport = names;
            renderImportPreview(namesToImport);
            showPage('csv-preview-page');
        }
        csvConfirmBtn.addEventListener('click', () => {
    const selectedCheckboxes = csvPreviewList.querySelectorAll('input[type="checkbox"]:checked');
    const classObject = schoolData[currentClass];

    selectedCheckboxes.forEach(checkbox => {
        const name = checkbox.dataset.name;
        // Check for duplicates in the new structure
        const isDuplicate = classObject.students.some(s => s.name.toLowerCase() === name.toLowerCase());
        if (!isDuplicate) {
            // Add student with the full data structure
            classObject.students.push({ name: name, count: 0, absenceCount: 0, problemCount: 0 });
        }
    });
    
    saveData();
    renderStudents();
    showPage('settings-page');
    pasteArea.value = '';
});
        csvCancelBtn.addEventListener('click', () => { showPage('settings-page'); });
        
        studentManagementToggle.addEventListener('click', () => {
            studentManagementToggle.classList.toggle('open');
            studentManagementContent.classList.toggle('open');
        });

        function displayWinner(winner) {
    selectedStudentResult.innerHTML = '';

    const resultText = document.createElement('div');
    resultText.innerHTML = toPersianDigits(`✨ <strong>${winner.name} (انتخاب: ${winner.count})</strong> ✨`);
    
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'status-button-container';

    const absentBtn = document.createElement('button');
    absentBtn.textContent = 'غایب';
    absentBtn.className = 'status-button';

    const problemBtn = document.createElement('button');
    problemBtn.textContent = 'مشکل';
    problemBtn.className = 'status-button';

    absentBtn.addEventListener('click', () => {
        const isCurrentlyActive = absentBtn.classList.contains('active');
        
        if (problemBtn.classList.contains('active')) {
            problemBtn.classList.remove('active');
            winner.problemCount--;
        }

        if (isCurrentlyActive) {
            winner.absenceCount--;
        } else {
            winner.absenceCount++;
        }
        absentBtn.classList.toggle('active');
        
        saveData();
        renderStudents();
    });

    problemBtn.addEventListener('click', () => {
        const isCurrentlyActive = problemBtn.classList.contains('active');

        if (absentBtn.classList.contains('active')) {
            absentBtn.classList.remove('active');
            winner.absenceCount--;
        }

        if (isCurrentlyActive) {
            winner.problemCount--;
        } else {
            winner.problemCount++;
        }
        problemBtn.classList.toggle('active');

        saveData();
        renderStudents();
    });
    
    buttonContainer.appendChild(absentBtn);
    buttonContainer.appendChild(problemBtn);
    
    selectedStudentResult.appendChild(resultText);
    selectedStudentResult.appendChild(buttonContainer);
}

selectStudentBtn.addEventListener('click', () => {
    const classObject = schoolData[currentClass];
    if (!classObject || !classObject.students || classObject.students.length === 0) {
        selectedStudentResult.textContent = 'لطفاً ابتدا دانش‌آموز اضافه کنید.';
        return;
    }
    
    let allStudents = classObject.students;
    let lastWinnerName = classObject.lastWinner ? classObject.lastWinner.name : null;
    
    let absoluteMaxCount = 0;
    allStudents.forEach(s => { if (s.count > absoluteMaxCount) absoluteMaxCount = s.count; });
    let allowedGap;
    if (absoluteMaxCount < 10) allowedGap = 1;
    else if (absoluteMaxCount < 30) allowedGap = 2;
    else allowedGap = 3;

    let candidates = allStudents.filter(s => s.name !== lastWinnerName);
    if (candidates.length === 0) candidates = allStudents;
    
    let minCountInCandidates = Infinity, maxCountInCandidates = -Infinity;
    if (candidates.length > 0) {
        candidates.forEach(s => {
            if (s.count < minCountInCandidates) minCountInCandidates = s.count;
            if (s.count > maxCountInCandidates) maxCountInCandidates = s.count;
        });
    }

    const currentGap = maxCountInCandidates - minCountInCandidates;
    let selectionPool = [];
    if (currentGap >= allowedGap && candidates.length > 1) {
        const minCountStudents = candidates.filter(s => s.count === minCountInCandidates);
        selectionPool = minCountStudents;
    } else {
        candidates.forEach(s => {
            const weight = (maxCountInCandidates - s.count) + 1;
            for (let i = 0; i < weight; i++) selectionPool.push(s);
        });
    }

    if (selectionPool.length === 0) selectionPool = candidates;
    const randomIndex = Math.floor(Math.random() * selectionPool.length);
    const winner = selectionPool[randomIndex];
    
    if (winner) {
        winner.count++;
        classObject.lastWinner = winner; // Save the winner to the class object
        saveData();
        renderStudents();
        displayWinner(winner); // Use the new helper function
    }
});
        
        // --- Developer Tools ---
        function resetCurrentClassCounters() {
    if (!currentClass) {
        console.log("ریست ناموفق: ابتدا باید وارد یک کلاس شوید.");
        return;
    }
    const classObject = schoolData[currentClass];
    if (classObject && classObject.students && classObject.students.length > 0) {
        classObject.students.forEach(s => {
            s.count = 0;
            s.absenceCount = 0;
            s.problemCount = 0;
        });
        classObject.lastWinner = null;
        saveData();
        renderStudents();
        console.log(`شمارنده‌های کلاس «${currentClass}» با موفقیت ریست شدند!`);
    } else {
        console.log("این کلاس دانش‌آموزی برای ریست کردن ندارد.");
    }
}
        window.resetCurrentClassCounters = resetCurrentClassCounters;

        // --- Initial Load ---
        loadData();
        renderClasses();
        showPage('class-management-page');
    });