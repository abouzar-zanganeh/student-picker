
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
		const sessionPage = document.getElementById('session-page');
        const sessionClassNameHeader = document.getElementById('session-class-name-header');
        const newSessionBtn = document.getElementById('new-session-btn');
        const sessionListUl = document.getElementById('session-list');

        // --- State Management ---
        let schoolData = {};
        let currentClass = null;
		let currentSession = null;
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
    } else {
        schoolData = {};
    }
}
// ...
addClassBtn.addEventListener('click', () => {
    const className = newClassNameInput.value.trim();
    if (className && !schoolData[className]) {
        schoolData[className] = {
            students: [],
            sessions: {} // A place to store session data
        };
        saveData();
        renderClasses();
        newClassNameInput.value = '';
    } else if (schoolData[className]) {
        alert('کلاسی با این نام از قبل وجود دارد.');
    }
});
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
        const students = schoolData[currentClass].students;

        const renderList = (listElement, isSettingsPage) => {
            listElement.innerHTML = '';
            students.forEach((student, index) => {
                const li = document.createElement('li');
                const nameSpan = document.createElement('span');
                // Updated to show TOTAL counts from the new structure
                nameSpan.textContent = toPersianDigits(`${student.name} (مجموع انتخاب: ${student.totalCount} | مجموع غیبت: ${student.totalAbsenceCount} | مجموع مشکل: ${student.totalProblemCount})`);
                li.appendChild(nameSpan);

                if (isSettingsPage) {
                    const deleteBtn = document.createElement('button');
                    deleteBtn.textContent = 'حذف';
                    deleteBtn.style.backgroundColor = '#dc3545';
                    deleteBtn.addEventListener('click', (event) => {
                        const deleteStudent = () => {
                            // Clear last winner if they are deleted
                            const classObject = schoolData[currentClass];
                            if (classObject.sessions[currentSession] && classObject.sessions[currentSession].lastWinner && classObject.sessions[currentSession].lastWinner.name === student.name) {
                                classObject.sessions[currentSession].lastWinner = null;
                            }
                            students.splice(index, 1);
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
        renderList(studentListUl, false);
        renderList(settingsStudentListUl, true);
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
        
        // This is the main navigation logic now
        nameContainer.addEventListener('click', () => {
            currentClass = className;
            sessionClassNameHeader.textContent = toPersianDigits(`کلاس: ${className}`);
            renderSessions(); // We will create this function next
            showPage('session-page');
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
		function renderSessions() {
    sessionListUl.innerHTML = '';
    const classObject = schoolData[currentClass];
    const sessions = classObject.sessions || {};

    // Get session numbers and sort them numerically in descending order
    const sortedSessionNumbers = Object.keys(sessions).map(Number).sort((a, b) => b - a);

    sortedSessionNumbers.forEach(sessionNumber => {
        const li = document.createElement('li');
        li.textContent = toPersianDigits(`جلسه شماره ${sessionNumber}`);
        li.style.cursor = 'pointer';
        li.addEventListener('click', () => {
            currentSession = sessionNumber;
            
            // Update headers and navigate
            classNameHeader.textContent = toPersianDigits(`کلاس: ${currentClass} - جلسه ${currentSession}`);
            
            // Display the last winner of THAT session
            const lastSessionWinner = classObject.sessions[currentSession].lastWinner;
            if (lastSessionWinner) {
                // We need a way to find the full student object from just the name
                const winnerObject = classObject.students.find(s => s.name === lastSessionWinner.name);
                if (winnerObject) {
                    displayWinner(winnerObject);
                }
            } else {
                selectedStudentResult.innerHTML = '';
            }

            renderStudents(); // This will be updated later to show session-specific data
            showPage('student-page');
        });
        sessionListUl.appendChild(li);
    });
}
	newSessionBtn.addEventListener('click', () => {
    const classObject = schoolData[currentClass];
    const sessions = classObject.sessions || {};
    const sessionNumbers = Object.keys(sessions).map(Number);
    const nextSessionNumber = sessionNumbers.length > 0 ? Math.max(...sessionNumbers) + 1 : 1;
    
    // Create the new session object
    classObject.sessions[nextSessionNumber] = {
        lastWinner: null
    };

    // Initialize session data for each student for this new session
    classObject.students.forEach(student => {
        if (!student.sessionData) {
            student.sessionData = {};
        }
        student.sessionData[nextSessionNumber] = {
            count: 0,
            absenceCount: 0,
            problemCount: 0
        };
    });

    currentSession = nextSessionNumber;
    
    // Update headers and navigate
    classNameHeader.textContent = toPersianDigits(`کلاس: ${currentClass} - جلسه ${currentSession}`);
    selectedStudentResult.innerHTML = ''; // Clear previous results
    
    saveData();
    renderStudents(); // This will be updated later to show session-specific data
    showPage('student-page');
});
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
        // Create student with the new, more complex data structure
        const newStudent = {
            name: studentName,
            totalCount: 0,
            totalAbsenceCount: 0,
            totalProblemCount: 0,
            sessionData: {}
        };
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
    selectedStudentResult.innerHTML = ''; // Clear previous content

    const sessionStats = winner.sessionData[currentSession] || { count: 0, absenceCount: 0, problemCount: 0 };
    const resultText = document.createElement('div');
    resultText.innerHTML = toPersianDigits(`✨ <strong>${winner.name} (انتخاب در این جلسه: ${sessionStats.count})</strong> ✨`);
    
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'status-button-container';

    const createStatusButton = (text, type) => {
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.className = 'status-button';
        
        const sessionProp = type === 'absent' ? 'absenceCount' : 'problemCount';
        const totalProp = type === 'absent' ? 'totalAbsenceCount' : 'totalProblemCount';
        
        let isToggled = false;

        btn.addEventListener('click', () => {
            isToggled = !isToggled;
            btn.classList.toggle('active', isToggled);
            
            const change = isToggled ? 1 : -1;
            winner[totalProp] += change;
            winner.sessionData[currentSession][sessionProp] += change;
            
            saveData();
            renderStudents();
        });
        return btn;
    };
    
    const absentBtn = createStatusButton('غایب', 'absent');
    const problemBtn = createStatusButton('مشکل', 'problem');
    
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
    let lastSessionWinner = classObject.sessions[currentSession].lastWinner;
    
    let absoluteMaxCount = 0;
    allStudents.forEach(s => { 
        const sessionCount = s.sessionData[currentSession] ? s.sessionData[currentSession].count : 0;
        if (sessionCount > absoluteMaxCount) absoluteMaxCount = sessionCount;
    });

    let candidates = allStudents.filter(s => !lastSessionWinner || s.name !== lastSessionWinner.name);
    if (candidates.length === 0) candidates = allStudents;
    
    let minCountInCandidates = Infinity, maxCountInCandidates = -Infinity;
    if (candidates.length > 0) {
        candidates.forEach(s => {
            const sessionCount = s.sessionData[currentSession] ? s.sessionData[currentSession].count : 0;
            if (sessionCount < minCountInCandidates) minCountInCandidates = sessionCount;
            if (sessionCount > maxCountInCandidates) maxCountInCandidates = sessionCount;
        });
    }

    const currentGap = maxCountInCandidates - minCountInCandidates;
    let selectionPool = [];
    if (currentGap >= 3 && candidates.length > 1) { // Simplified gap logic
        const minCountStudents = candidates.filter(s => (s.sessionData[currentSession] ? s.sessionData[currentSession].count : 0) === minCountInCandidates);
        selectionPool = minCountStudents;
    } else {
        candidates.forEach(s => {
            const sessionCount = s.sessionData[currentSession] ? s.sessionData[currentSession].count : 0;
            const weight = (maxCountInCandidates - sessionCount) + 1;
            for (let i = 0; i < weight; i++) selectionPool.push(s);
        });
    }

    if (selectionPool.length === 0) selectionPool = candidates;
    const randomIndex = Math.floor(Math.random() * selectionPool.length);
    const winner = selectionPool[randomIndex];
    
    if (winner) {
        // Increment both total and session-specific counts
        winner.totalCount++;
        winner.sessionData[currentSession].count++;
        
        classObject.sessions[currentSession].lastWinner = winner;
        saveData();
        renderStudents();
        displayWinner(winner);
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