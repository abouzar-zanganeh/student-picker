
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
		const newCategoryNameInput = document.getElementById('new-category-name');
        const addCategoryBtn = document.getElementById('add-category-btn');
        const categoryListUl = document.getElementById('category-list');

        // --- State Management ---
        let schoolData = {};
        let currentClass = null;
		let currentSession = null;
		let currentCategory = null;
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
        function renderStudents(categoryToDisplay = null) {
    studentListUl.innerHTML = '';
    settingsStudentListUl.innerHTML = '';
    
    if (currentClass && schoolData[currentClass]) {
        const students = schoolData[currentClass].students;

        const createStudentListItem = (student, index, isSettingsPage) => {
            const li = document.createElement('li');
            li.className = 'student-list-item'; // New class for flexbox styling

            // --- Total Stats Div ---
            const totalStatsDiv = document.createElement('div');
            totalStatsDiv.className = 'total-stats';
            const nameSpan = document.createElement('span');
            nameSpan.textContent = toPersianDigits(`${student.name} (مجموع انتخاب: ${student.totalCount})`);
            totalStatsDiv.appendChild(nameSpan);
            
            if (isSettingsPage) {
                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = 'حذف';
                deleteBtn.style.backgroundColor = '#dc3545';
                deleteBtn.addEventListener('click', (event) => {
                    if (confirm(toPersianDigits(`آیا از حذف دانش‌آموز «${student.name}» مطمئن هستید؟`))) {
                         // Logic to delete student will be here
                        const classObject = schoolData[currentClass];
                        students.splice(index, 1);
                        saveData();
                        renderStudents();
                    }
                });
                totalStatsDiv.appendChild(deleteBtn);
            }
            
            // --- Category Stats Div (placeholder) ---
            const categoryStatsDiv = document.createElement('div');
            categoryStatsDiv.className = 'category-stats';
            // Create a unique ID for each student's category stats div
            const studentId = student.name.replace(/\s+/g, '-');
            categoryStatsDiv.id = `cat-stats-${studentId}`;

            if(categoryToDisplay && student.sessionData[currentSession] && student.sessionData[currentSession][categoryToDisplay]) {
                const stats = student.sessionData[currentSession][categoryToDisplay];
                categoryStatsDiv.textContent = toPersianDigits(`${categoryToDisplay}: (انتخاب: ${stats.count} | غیبت: ${stats.absenceCount} | مشکل: ${stats.problemCount})`);
                categoryStatsDiv.classList.add('visible');
            }

            li.appendChild(totalStatsDiv);
            li.appendChild(categoryStatsDiv);
            return li;
        };

        students.forEach((student, index) => {
            // We need to clone the node for the second list
            const listItemForStudentPage = createStudentListItem(student, index, false);
            const listItemForSettingsPage = createStudentListItem(student, index, true);
            studentListUl.appendChild(listItemForStudentPage);
            settingsStudentListUl.appendChild(listItemForSettingsPage);
        });
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
            renderCategories(); // Call the new function
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

    const sortedSessionNumbers = Object.keys(sessions).map(Number).sort((a, b) => b - a);

    sortedSessionNumbers.forEach(sessionNumber => {
        const li = document.createElement('li');
        li.textContent = toPersianDigits(`جلسه شماره ${sessionNumber}`);
        li.style.cursor = 'pointer';
        li.addEventListener('click', () => {
            currentSession = sessionNumber;
            
            classNameHeader.textContent = toPersianDigits(`کلاس: ${currentClass} - جلسه ${currentSession}`);
            selectedStudentResult.innerHTML = ''; // Always clear previous results when entering a session

            renderStudents();
            renderCategorySelectionButtons(); // Call the function to show category buttons
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
    
    classObject.sessions[nextSessionNumber] = {};

    classObject.students.forEach(student => {
        if (!student.sessionData) {
            student.sessionData = {};
        }
        // For each category, initialize session data for the student
        classObject.categories.forEach(category => {
            if (!student.sessionData[nextSessionNumber]) {
                student.sessionData[nextSessionNumber] = {};
            }
            student.sessionData[nextSessionNumber][category] = {
                count: 0,
                absenceCount: 0,
                problemCount: 0,
                lastWinner: null
            };
        });
    });

    currentSession = nextSessionNumber;
    
    classNameHeader.textContent = toPersianDigits(`کلاس: ${currentClass} - جلسه ${currentSession}`);
    selectedStudentResult.innerHTML = '';
    
    saveData();
    renderStudents();
    renderCategorySelectionButtons(); // Call the function to show category buttons
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
		function renderCategories() {
            categoryListUl.innerHTML = '';
            if (!currentClass || !schoolData[currentClass].categories) return;

            const categories = schoolData[currentClass].categories;
            categories.forEach((category, index) => {
                const li = document.createElement('li');
                const nameSpan = document.createElement('span');
                nameSpan.textContent = toPersianDigits(category);
                li.appendChild(nameSpan);

                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = 'حذف';
                deleteBtn.style.backgroundColor = '#dc3545';
                deleteBtn.addEventListener('click', () => {
                    // We can add a confirmation here if needed in the future
                    categories.splice(index, 1);
                    saveData();
                    renderCategories();
                });
                li.appendChild(deleteBtn);
                categoryListUl.appendChild(li);
            });
        }

        addCategoryBtn.addEventListener('click', () => {
            const categoryName = newCategoryNameInput.value.trim();
            if (categoryName && currentClass && schoolData[currentClass]) {
                const classObject = schoolData[currentClass];
                if (!classObject.categories) {
                    classObject.categories = [];
                }
                // Check for duplicates (case-insensitive)
                const isDuplicate = classObject.categories.some(cat => cat.toLowerCase() === categoryName.toLowerCase());
                if (!isDuplicate) {
                    classObject.categories.push(categoryName);
                    saveData();
                    renderCategories();
                    newCategoryNameInput.value = '';
                } else {
                    alert('این دسته‌بندی از قبل وجود دارد.');
                }
            }
        });

        addCategoryBtn.addEventListener('click', () => {
            const categoryName = newCategoryNameInput.value.trim();
            if (categoryName && currentClass && schoolData[currentClass]) {
                const classObject = schoolData[currentClass];
                if (!classObject.categories) {
                    classObject.categories = [];
                }
                if (!classObject.categories.includes(categoryName)) {
                    classObject.categories.push(categoryName);
                    saveData();
                    renderCategories();
                    newCategoryNameInput.value = '';
                } else {
                    alert('این دسته‌بندی از قبل وجود دارد.');
                }
            }
        });
        
        // --- Event Listeners ---
       addClassBtn.addEventListener('click', () => {
    const className = newClassNameInput.value.trim();
    if (className && !schoolData[className]) {
        schoolData[className] = {
            students: [],
            sessions: {},
            categories: [
                'Vocabulary', 'Grammar', 'Reading', 'Writing', 
                'Speaking', 'Pronunciation', 'Listening'
            ]
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
        currentSession = null;
        currentCategory = null;
        showPage('class-management-page');
    });
});
        addStudentBtn.addEventListener('click', () => {
    const studentName = newStudentNameInput.value.trim();
    if (!studentName || !currentClass) return;

    const classObject = schoolData[currentClass];
    const isDuplicate = classObject.students.some(s => s.name.toLowerCase() === studentName.toLowerCase());

    if (isDuplicate) {
        alert('دانش‌آموزی با این نام از قبل در این کلاس وجود دارد.');
        return;
    }

    const newStudent = {
        name: studentName,
        totalCount: 0,
        totalAbsenceCount: 0,
        totalProblemCount: 0,
        sessionData: {}
    };

    // Initialize data for existing sessions for the new student
    for (const sessionNumber in classObject.sessions) {
        newStudent.sessionData[sessionNumber] = {};
        classObject.categories.forEach(category => {
            newStudent.sessionData[sessionNumber][category] = {
                count: 0,
                absenceCount: 0,
                problemCount: 0
            };
        });
    }

    classObject.students.push(newStudent);
    saveData();
    renderStudents(); // This will need to be updated later
    newStudentNameInput.value = '';
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
    
    const sessionCategoryStats = winner.sessionData[currentSession][currentCategory];
    const resultText = document.createElement('div');
    resultText.innerHTML = toPersianDigits(`✨ <strong>${winner.name}</strong> (انتخاب در این دسته: ${sessionCategoryStats.count}) ✨`);
    
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'status-button-container';

    const createStatusButton = (text, type) => {
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.className = 'status-button';
        
        const sessionProp = type === 'absent' ? 'absenceCount' : 'problemCount';
        const totalProp = type === 'absent' ? 'totalAbsenceCount' : 'totalProblemCount';
        
        btn.addEventListener('click', () => {
            const isActive = btn.classList.toggle('active');
            const change = isActive ? 1 : -1;

            winner[totalProp] += change;
            winner.sessionData[currentSession][currentCategory][sessionProp] += change;
            
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
    if (!currentClass || !currentSession || !currentCategory) {
        alert("لطفاً ابتدا یک دسته‌بندی را انتخاب کنید.");
        return;
    }

    const classObject = schoolData[currentClass];
    const allStudents = classObject.students;
    const lastWinnerName = classObject.sessions[currentSession][currentCategory]?.lastWinner?.name || null;
    
    let candidates = allStudents.filter(s => s.name !== lastWinnerName);
    if (candidates.length === 0) candidates = allStudents;

    let minCount = Infinity, maxCount = -Infinity;
    candidates.forEach(s => {
        const count = s.sessionData[currentSession][currentCategory]?.count ?? 0;
        if (count < minCount) minCount = count;
        if (count > maxCount) maxCount = count;
    });

    const currentGap = maxCount - minCount;
    let selectionPool = [];

    if (currentGap >= 3 && candidates.length > 1) {
        const minCountStudents = candidates.filter(s => (s.sessionData[currentSession][currentCategory]?.count ?? 0) === minCount);
        selectionPool = minCountStudents;
    } else {
        candidates.forEach(s => {
            const count = s.sessionData[currentSession][currentCategory]?.count ?? 0;
            const weight = (maxCount - count) + 1;
            for (let i = 0; i < weight; i++) {
                selectionPool.push(s);
            }
        });
    }

    if (selectionPool.length === 0) selectionPool = candidates;
    const randomIndex = Math.floor(Math.random() * selectionPool.length);
    const winner = selectionPool[randomIndex];

    if (winner) {
        // Increment total and specific counters
        winner.totalCount++;
        winner.sessionData[currentSession][currentCategory].count++;
        
        // Save winner for this specific category in this session
        classObject.sessions[currentSession][currentCategory] = {
            ...classObject.sessions[currentSession][currentCategory],
            lastWinner: winner
        };

        saveData();
        renderStudents(currentCategory); // Pass the active category to the render function
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
		function renderCategorySelectionButtons() {
    const container = document.getElementById('category-selection-container');
    container.innerHTML = '';
    selectStudentBtn.disabled = true;

    if (!currentClass || !schoolData[currentClass].categories) return;

    const categories = schoolData[currentClass].categories;
    categories.forEach(category => {
        const btn = document.createElement('button');
        btn.textContent = toPersianDigits(category);
        btn.className = 'btn-secondary category-btn';
        btn.dataset.category = category;
        
        btn.addEventListener('click', () => {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            currentCategory = category;
            selectStudentBtn.disabled = false;
            selectedStudentResult.innerHTML = '';

            // Re-render the student list to show stats for the selected category
            renderStudents(currentCategory);
        });

        container.appendChild(btn);
    });
}
        window.resetCurrentClassCounters = resetCurrentClassCounters;

        // --- Initial Load ---
        loadData();
        renderClasses();
        showPage('class-management-page');
    });