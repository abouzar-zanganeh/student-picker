import * as state from './state.js';
import { resetAllStudentCounters, getActiveItems } from './state.js';
import * as ui from './ui.js';
import { Classroom, Student, Category } from './models.js';
import { normalizeText, normalizeKeyboard } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- HTML Elements (from ui.js, but needed for event listeners) ---
    const {
        globalStudentSearchInput, globalStudentSearchResultsDiv,
        newClassNameInput, addClassBtn, classListUl, undoBtn,
        settingsPage, settingsClassNameHeader, settingsStudentListUl, categoryListUl,
        backToSessionsBtn, newStudentNameInput, addStudentBtn, pasteArea,
        processPasteBtn, csvPreviewPage, csvPreviewList, csvConfirmBtn,
        csvCancelBtn, importCsvBtn, csvFileInput, columnMappingPage,
        columnSelectDropdown, confirmColumnBtn, cancelImportBtn, newCategoryNameInput,
        addCategoryBtn, selectStudentBtn, attendancePage, attendanceClassNameHeader,
        attendanceListUl, finishAttendanceBtn, backToSessionsFromAttendanceBtn,
        backToAttendanceBtn, classListHeader, studentStatsHeader, hamburgerMenuBtn,
        sideNavMenu, closeNavBtn, overlay, backupDataBtn, restoreDataBtn,
        restoreFileInput, customConfirmModal, confirmModalMessage,
        confirmModalCancelBtn, confirmModalConfirmBtn, secureConfirmModal,
        secureConfirmMessage, secureConfirmCode, secureConfirmInput,
        secureConfirmCancelBtn, secureConfirmConfirmBtn, addNoteModal,
        newNoteContent, saveNoteBtn, cancelNoteBtn, studentSearchInput,
        studentSearchResultsDiv, studentProfilePage, profileStudentNameHeader,
        backToStudentPageBtn, gradedCategoryPillsContainer, newScoreValueInput,
        newScoreCommentTextarea, addScoreBtn, profileStatsSummaryDiv,
        profileScoresListUl, isGradedCheckbox
    } = ui; // This is a bit of a trick to avoid rewriting all the getElementById calls
    const trashNavBtn = document.getElementById('trash-nav-btn');

    const globalSearchIcon = document.querySelector('.global-search-container .search-icon');

    // --- Initial Load ---
    state.loadData();
    ui.renderClassList();

    function initializeAnimatedSearch(containerSelector, clearResultsCallback) {
        const container = document.querySelector(containerSelector);
        if (!container) return; // Exit if the container doesn't exist on the current page

        const icon = container.querySelector('.search-icon');
        const input = container.querySelector('.animated-search-input');

        if (!icon || !input) return;

        icon.addEventListener('mousedown', (e) => {
            // By always preventing the default mousedown action, we stop the browser
            // from creating an unstable focus state when the window regains focus.
            e.preventDefault();
        });

        icon.addEventListener('click', () => {
            // This logic now only needs to handle showing the input
            if (!container.classList.contains('search-active')) {
                container.classList.add('search-active');
                input.focus();
            }
        });

        input.addEventListener('blur', () => {
            setTimeout(() => {
                container.classList.remove('search-active');
                input.value = '';
                if (clearResultsCallback) {
                    clearResultsCallback([]);
                }
            }, 150);
        });
    }


    // --- Event Listeners ---

    window.addEventListener('scroll', ui.closeContextMenu);

    document.addEventListener('click', (e) => {
        // If the context menu is visible and the click was outside of it, close it.
        if (ui.contextMenu.classList.contains('visible') && !ui.contextMenu.contains(e.target)) {
            ui.closeContextMenu();
        }
    });

    ui.selectStudentBtnWrapper.addEventListener('click', () => {
        // Check for either of the two conditions that make the button disabled.
        if (ui.selectStudentBtnWrapper.classList.contains('disabled-wrapper') || ui.selectStudentBtn.disabled) {

            ui.selectStudentBtn.classList.add('shake-animation');

            // Remove the animation class after it finishes so it can be re-triggered.
            setTimeout(() => {
                ui.selectStudentBtn.classList.remove('shake-animation');
            }, 200); // This duration must match the animation in style.css
        }
    });

    studentStatsHeader.addEventListener('click', () => {
        const now = new Date().getTime();
        if (now - state.resetEasterEggLastClickTime > 500) {
            state.setResetEasterEggClickCount(1);
        } else {
            state.setResetEasterEggClickCount(state.resetEasterEggClickCount + 1);
        }
        state.setResetEasterEggLastClickTime(now);

        if (state.resetEasterEggClickCount === 5) {
            state.setResetEasterEggClickCount(0);
            ui.showCustomConfirm(
                "آیا از صفر کردن تمام شمارنده‌های دانش‌آموزان مطمئن هستید؟ این عمل غیرقابل بازگشت است.",
                () => {

                    resetAllStudentCounters();
                    ui.renderStudentStatsList();
                    ui.showNotification("تمام آمارها صفر شدند.");
                },
                { confirmText: 'بله', confirmClass: 'btn-warning' }
            );
        }
    });

    classListHeader.addEventListener('click', () => {
        const now = new Date().getTime();
        if (now - state.easterEggLastClickTime > 500) {
            state.setEasterEggClickCount(1);
        } else {
            state.setEasterEggClickCount(state.easterEggClickCount + 1);
        }
        state.setEasterEggLastClickTime(now);

        if (state.easterEggClickCount === 5) {
            state.setEasterEggClickCount(0);
            ui.showCustomConfirm(
                "آیا از ساخت یک کلاس تستی تصادفی مطمئن هستید؟",
                () => {
                    function createRandomClass() {
                        const testClassName = `کلاس تستی ${Object.keys(state.classrooms).length + 1}`;
                        const newClass = new Classroom({ name: testClassName, type: 'online' });
                        const students = ['علی رضایی', 'مریم حسینی', 'زهرا احمدی', 'رضا محمدی', 'فاطمه کریمی'];
                        students.forEach(name => newClass.addStudent(new Student({ name })));
                        state.classrooms[testClassName] = newClass;
                        state.saveData();
                        ui.renderClassList();
                    }
                    createRandomClass();
                    ui.showNotification("کلاس تستی با موفقیت ساخته شد!");
                },
                { confirmText: 'بساز', confirmClass: 'btn-success' }
            );
        }
    });

    secureConfirmCancelBtn.addEventListener('click', () => {
        ui.closeActiveModal();
        state.setSecureConfirmCallback(null);
    });

    secureConfirmConfirmBtn.addEventListener('click', () => {
        if (typeof state.secureConfirmCallback === 'function') {
            state.secureConfirmCallback();
        }
        ui.closeActiveModal();
        state.setSecureConfirmCallback(null);
    });

    confirmModalCancelBtn.addEventListener('click', () => {
        ui.closeActiveModal(state.cancelCallback);
    });

    confirmModalConfirmBtn.addEventListener('click', () => {
        ui.closeActiveModal(state.confirmCallback);
    });

    backToAttendanceBtn.addEventListener('click', () => {
        if (state.currentClassroom && state.selectedSession) {
            ui.renderAttendancePage();
            ui.showPage('attendance-page');
        }
    });

    selectStudentBtn.addEventListener('click', () => {
        if (ui.quickScoreInput.value.trim() !== '' || ui.quickNoteTextarea.value.trim() !== '') {
            ui.showNotification("لطفاً ابتدا با دکمه «ثبت»، تغییرات را ذخیره کنید.");
            return;
        }
        if (!state.currentClassroom || !state.selectedSession || !state.selectedCategory) return;

        const winner = state.currentClassroom.selectNextWinner(state.selectedCategory.name, state.selectedSession);

        if (winner) {
            const studentRecord = state.selectedSession.studentRecords[winner.identity.studentId];
            if (studentRecord && studentRecord.attendance === 'absent') {
                winner.statusCounters.missedChances++;
            }
            if (studentRecord && studentRecord.hadIssue) {
                winner.statusCounters.missedChances++;
                winner.statusCounters.otherIssues++;
            }


            // --- New History Logic ---
            const historyEntry = {
                winner,
                categoryName: state.selectedCategory.name
            };
            state.selectedSession.winnerHistory.push(historyEntry);

            // Keep the history capped at 10 items
            if (state.selectedSession.winnerHistory.length > 10) {
                state.selectedSession.winnerHistory.shift();
            }

            // Set the index to point to the newest winner we just added
            state.setWinnerHistoryIndex(state.selectedSession.winnerHistory.length - 1);
            // --- End New History Logic ---


            ui.displayWinner();

            state.selectedSession.lastUsedCategoryId = state.selectedCategory.id;
            state.selectedSession.lastSelectedWinnerId = winner.identity.studentId;
            ui.renderStudentStatsList();
            state.saveData();
        } else {
            ui.showNotification("دانش‌آموز واجد شرایطی برای انتخاب یافت نشد.");
        }
    });

    addCategoryBtn.addEventListener('click', () => {
        if (!state.currentClassroom) return;
        const categoryName = newCategoryNameInput.value.trim();
        const isGraded = isGradedCheckbox.checked; // Get the checkbox status

        if (!categoryName) {
            alert("لطفاً نام دسته‌بندی را وارد کنید.");
            return;
        }
        const isDuplicate = state.currentClassroom.categories.some(cat => !cat.isDeleted && cat.name.toLowerCase() === categoryName.toLowerCase());
        if (isDuplicate) {
            alert("این دسته‌بندی از قبل وجود دارد.");
            return;
        }
        // Pass the 'isGraded' status to the constructor
        const newCategory = new Category(categoryName, '', isGraded);
        state.currentClassroom.categories.push(newCategory);
        state.saveData();
        ui.renderSettingsCategories();

        // Reset the form fields for the next entry
        newCategoryNameInput.value = '';
        isGradedCheckbox.checked = false;
    });

    newCategoryNameInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            addCategoryBtn.click();
        }
    });

    confirmColumnBtn.addEventListener('click', () => {
        if (!state.importedFileContent) {
            alert("خطایی رخ داده است. لطفاً فایل را دوباره انتخاب کنید.");
            ui.showPage('settings-page');
            return;
        }
        const selectedColumnIndex = parseInt(columnSelectDropdown.value, 10);
        const lines = state.importedFileContent.split('\n');
        const dataRows = lines.slice(1);
        const names = dataRows.map(row => {
            const columns = row.split(',');
            return columns[selectedColumnIndex]?.trim();
        }).filter(name => name && name.length > 0);

        if (names.length > 0) {
            state.setNamesToImport(names);
            ui.renderImportPreview();
            ui.showPage('csv-preview-page');
        } else {
            alert("هیچ نامی در ستون انتخاب شده پیدا نشد. لطفاً ستون دیگری را امتحان کنید یا فایل خود را بررسی کنید.");
        }
        state.setImportedFileContent(null);
    });

    importCsvBtn.addEventListener('click', () => {
        csvFileInput.click();
    });

    csvFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            state.setImportedFileContent(text);
            const firstLine = text.split('\n')[0];
            const headers = firstLine.split(',');
            ui.renderColumnSelector(headers);
            ui.showPage('column-mapping-page');
        };
        reader.readAsText(file);
        event.target.value = null;
    });

    cancelImportBtn.addEventListener('click', () => {
        state.setImportedFileContent(null);
        ui.showPage('settings-page');
    });

    csvConfirmBtn.addEventListener('click', () => {
        const selectedCheckboxes = csvPreviewList.querySelectorAll('input[type="checkbox"]:checked');
        selectedCheckboxes.forEach(checkbox => {
            const name = checkbox.dataset.name;
            const isDuplicate = state.currentClassroom.students.some(student => student.identity.name.toLowerCase() === name.toLowerCase());
            if (!isDuplicate) {
                const newStudent = new Student({ name: name });
                state.currentClassroom.addStudent(newStudent);
            } else {
                console.log(`دانش‌آموز «${name}» به دلیل تکراری بودن اضافه نشد.`);
            }
        });
        state.saveData();
        ui.renderSettingsStudentList();
        ui.showPage('settings-page');
        pasteArea.value = '';
        state.setNamesToImport([]);
    });

    csvCancelBtn.addEventListener('click', () => {
        state.setNamesToImport([]);
        ui.showPage('settings-page');
    });

    processPasteBtn.addEventListener('click', () => {
        const text = pasteArea.value.trim();
        if (!text) {
            alert("کادر متنی خالی است. لطفاً اسامی را وارد کنید.");
            return;
        }
        const names = text.split('\n').map(name => name.trim()).filter(name => name.length > 0);
        if (names.length > 0) {
            state.setNamesToImport(names);
            ui.renderImportPreview();
            ui.showPage('csv-preview-page');
        } else {
            alert("هیچ نام معتبری برای ورود پیدا نشد.");
        }
    });

    newStudentNameInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            addStudentBtn.click();
        }
    });

    addStudentBtn.addEventListener('click', () => {
        if (!state.currentClassroom) return;
        const studentName = newStudentNameInput.value.trim();
        if (!studentName) {
            alert("لطفاً نام دانش‌آموز را وارد کنید.");
            return;
        }
        const isDuplicate = state.currentClassroom.students.some(student => student.identity.name.toLowerCase() === studentName.toLowerCase());
        if (isDuplicate) {
            alert("دانش‌آموزی با این نام از قبل در این کلاس وجود دارد.");
            return;
        }
        const newStudent = new Student({ name: studentName });
        state.currentClassroom.addStudent(newStudent);
        state.saveData();
        ui.renderSettingsStudentList();
        newStudentNameInput.value = '';
        newStudentNameInput.focus();
    });

    backToSessionsBtn.addEventListener('click', () => {
        ui.renderSessions();
        ui.showPage('session-page');
    });

    document.getElementById('new-session-btn').addEventListener('click', () => {
        if (state.currentClassroom) {
            const unfinishedSession = state.currentClassroom.sessions.find(session => !session.isFinished && !session.isCancelled && !session.isDeleted);
            if (unfinishedSession) {
                ui.showNotification(`جلسه ${unfinishedSession.sessionNumber} هنوز تمام نشده است. لطفاً ابتدا با دکمه ✅ آن را خاتمه دهید.`);
                return;
            }

            // This function encapsulates the original logic of asking about attendance.
            const askAboutAttendanceAndStart = () => {
                const startSession = (takeAttendance) => {
                    const newSession = state.currentClassroom.startNewSession();
                    state.setLiveSession(newSession);
                    state.setSelectedSession(newSession);
                    state.currentClassroom.students.forEach(student => {
                        state.liveSession.setAttendance(student.identity.studentId, 'present');
                    });
                    if (takeAttendance) {
                        ui.renderAttendancePage();
                        ui.showPage('attendance-page');
                    } else {
                        ui.renderStudentPage();
                    }
                    state.saveData();
                };
                ui.showCustomConfirm(
                    "آیا تمایل به انجام فرآیند حضور و غیاب دارید؟",
                    () => startSession(true),
                    {
                        confirmText: 'بله',
                        cancelText: 'خیر',
                        confirmClass: 'btn-success',
                        onCancel: () => startSession(false)
                    }
                );
            };

            //checks if a session exists for today.
            if (state.currentClassroom.hasSessionToday()) {
                ui.showCustomConfirm(
                    "شما امروز یک جلسه برای این کلاس ثبت کرده‌اید. آیا از شروع یک جلسه جدید دیگر مطمئن هستید؟",
                    askAboutAttendanceAndStart, // On confirm, it proceeds to ask about attendance.
                    { confirmText: 'بله، ادامه بده', confirmClass: 'btn-warning' }
                );
            } else {
                // Otherwise, just ask about attendance as before.
                askAboutAttendanceAndStart();
            }
        }
    });

    addClassBtn.addEventListener('click', () => {
        const className = newClassNameInput.value.trim();
        const selectedTypeRadio = document.querySelector('input[name="class-type"]:checked');
        if (!className && !selectedTypeRadio) {
            ui.showNotification("لطفاً نام و نوع کلاس را مشخص کنید.");
            return;
        }
        if (!className) {
            ui.showNotification("لطفاً نام کلاس را وارد کنید.");
            return;
        }
        if (!selectedTypeRadio) {
            ui.showNotification("لطفاً نوع کلاس را انتخاب کنید.");
            return;
        }
        if (state.classrooms[className]) {
            ui.showNotification("کلاسی با این نام از قبل وجود دارد.");
            return;
        }
        const classType = selectedTypeRadio.value;
        const newClassroom = new Classroom({ name: className, type: classType });
        state.classrooms[className] = newClassroom;
        state.saveData();
        ui.renderClassList();
        newClassNameInput.value = '';
        selectedTypeRadio.checked = false;
    });



    globalStudentSearchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value;
        if (searchTerm.length < 2) {
            ui.renderGlobalSearchResults([]);
            return;
        }

        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        const keyboardNormalizedTerm = normalizeKeyboard(lowerCaseSearchTerm);

        const allResults = [];
        for (const className in state.classrooms) {
            const classroom = state.classrooms[className];
            if (classroom.isDeleted) continue;

            const foundStudents = getActiveItems(classroom.students).filter(student => {
                const normalizedStudentName = normalizeText(student.identity.name.toLowerCase());

                // Check if student name includes the term as typed
                const matchesOriginal = normalizedStudentName.includes(normalizeText(lowerCaseSearchTerm));

                // Check if student name includes the keyboard-mapped term
                const matchesMapped = normalizedStudentName.includes(normalizeText(keyboardNormalizedTerm));

                return matchesOriginal || matchesMapped;
            });

            foundStudents.forEach(student => {
                allResults.push({ student, classroom });
            });
        }

        ui.renderGlobalSearchResults(allResults);
    });




    newClassNameInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            addClassBtn.click();
        }
    });

    undoBtn.addEventListener('click', ui.handleUndo);

    document.querySelectorAll('.back-to-classes-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            state.setCurrentClassroom(null);
            state.setSelectedSession(null);
            state.setLiveSession(null);
            ui.showPage('class-management-page');
        });
    });

    finishAttendanceBtn.addEventListener('click', () => {
        ui.renderStudentPage();
    });

    backToSessionsFromAttendanceBtn.addEventListener('click', () => {
        ui.renderSessions();
        ui.showPage('session-page');
    });

    backToStudentPageBtn.addEventListener('click', () => {
        state.setSelectedStudentForProfile(null);
        ui.showPage('student-page');
    });

    studentSearchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value;

        if (!searchTerm) {
            ui.renderSearchResults([]); // Pass an empty array to clear results
            return;
        }

        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        const keyboardNormalizedTerm = normalizeKeyboard(lowerCaseSearchTerm);
        const allStudents = getActiveItems(state.currentClassroom.students);

        const foundStudents = allStudents.filter(student => {
            const normalizedStudentName = normalizeText(student.identity.name.toLowerCase());

            // Check if student name includes the term as typed
            const matchesOriginal = normalizedStudentName.includes(normalizeText(lowerCaseSearchTerm));

            // Check if student name includes the keyboard-mapped term
            const matchesMapped = normalizedStudentName.includes(normalizeText(keyboardNormalizedTerm));

            return matchesOriginal || matchesMapped;
        });

        ui.renderSearchResults(foundStudents);
    });

    studentSearchInput.addEventListener('focus', () => {
        if (studentSearchInput.value) {
            ui.renderSearchResults(studentSearchInput.value);
        }
    });

    document.addEventListener('click', (e) => {
        if (!studentSearchInput.contains(e.target)) {
            studentSearchResultsDiv.style.display = 'none';
        }
    });

    ui.quickGradeSubmitBtn.addEventListener('click', () => {
        const scoreValue = ui.quickScoreInput.value;
        const noteText = ui.quickNoteTextarea.value.trim();
        let student;
        //Checks for a manual selection (from the stats table) first ---
        if (state.manualSelection) {
            student = state.manualSelection.student;
        } else {
            // Fallback to the original history logic
            const historyEntry = state.selectedSession?.winnerHistory[state.winnerHistoryIndex];
            student = historyEntry?.winner;
        }

        if (!student) {
            ui.showNotification("خطا: دانش‌آموز معتبری برای ثبت نمره یافت نشد.");
            return;
        }
        const category = state.selectedCategory;

        if (!student || !category) {
            ui.showNotification("لطفاً ابتدا یک دانش‌آموز و یک دسته‌بندی را انتخاب کنید.");
            return;
        }

        if (!scoreValue) {
            ui.showNotification("لطفاً مقدار نمره را وارد کنید.");
            return;
        }

        if (scoreValue > 100 || scoreValue < 0) {
            ui.showNotification("نمره نباید از ۱۰۰ بیشتر و از صفر کمتر باشد");
            return;
        }


        if (student) {
            student.addScore(category.name, parseFloat(scoreValue), noteText);
            state.saveData();
            ui.showNotification(`نمره برای ${student.identity.name} در مهارت ${category.name} ثبت شد.`);
            // Clear inputs for the next entry
            ui.quickScoreInput.value = '';
            ui.quickNoteTextarea.value = '';
            // Refresh the winner display to show the new score/note instantly
            ui.displayWinner(student, category.name);
        }
    });

    const quickGradeSubmitHandler = (event) => {
        if (event.key === 'Enter' && event.ctrlKey) {
            event.preventDefault(); // Prevents adding a new line in the textarea
            ui.quickGradeSubmitBtn.click();
        }
    };

    ui.quickScoreInput.addEventListener('keydown', quickGradeSubmitHandler);
    ui.quickNoteTextarea.addEventListener('keydown', quickGradeSubmitHandler);

    addScoreBtn.addEventListener('click', () => {
        const activeSkillPill = gradedCategoryPillsContainer.querySelector('.pill.active');
        if (!activeSkillPill) {
            ui.showNotification("لطفاً یک مهارت را برای نمره‌دهی انتخاب کنید.");
            return;
        }
        const skill = activeSkillPill.dataset.skillName;
        const value = newScoreValueInput.value;
        const comment = newScoreCommentTextarea.value.trim();

        if (!value) {
            ui.showNotification("لطفاً مقدار نمره را وارد کنید.");
            return;
        }

        state.selectedStudentForProfile.addScore(skill, parseFloat(value), comment);
        state.saveData();
        ui.renderStudentProfilePage();
        ui.showNotification(`نمره برای مهارت ${skill} با موفقیت ثبت شد.`);
    });

    document.getElementById('add-note-btn').addEventListener('click', () => {
        // Ensure a student is selected before opening the modal
        if (!state.selectedStudentForProfile) return;

        newNoteContent.value = ''; // Start with a blank slate for a new note
        newNoteContent.dispatchEvent(new Event('input', { bubbles: true }));

        // Set the callback with the specific logic for saving a STUDENT note
        state.setSaveNoteCallback((content) => {
            if (content) { // Only add a note if there's text content
                state.selectedStudentForProfile.addNote(content);
                state.saveData();
                ui.renderStudentNotes(); // This re-renders the notes list on the profile page
            }
        });

        ui.openModal('add-note-modal');
        newNoteContent.focus();
    });

    cancelNoteBtn.addEventListener('click', () => {
        ui.closeActiveModal();
    });

    saveNoteBtn.addEventListener('click', () => {
        const content = newNoteContent.value.trim();
        // Check if a save function has been set in the state
        if (typeof state.saveNoteCallback === 'function') {
            state.saveNoteCallback(content); // Execute the specific save logic
            ui.closeActiveModal();
            ui.showNotification("یادداشت با موفقیت ذخیره شد.");
        }
    });

    hamburgerMenuBtn.addEventListener('click', () => {
        sideNavMenu.style.width = '250px';
        overlay.classList.add('modal-visible');
    });

    closeNavBtn.addEventListener('click', closeSideNav);
    overlay.addEventListener('click', closeSideNav);

    trashNavBtn.addEventListener('click', () => {
        ui.renderTrashPage();
        ui.showPage('trash-page');
        closeSideNav(); // Close the nav menu after clicking
    });

    backupDataBtn.addEventListener('click', () => {
        const dataStr = JSON.stringify(state.classrooms, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        const today = new Date().toLocaleDateString('fa-IR-u-nu-latn').replace(/\//g, '-');
        link.download = `SP-${today}.json`;
        link.click();
        URL.revokeObjectURL(url);
        ui.showNotification("پشتیبان‌گیری با موفقیت انجام شد.");
        closeSideNav();
    });

    restoreDataBtn.addEventListener('click', () => {
        restoreFileInput.click();
        closeSideNav();
    });

    restoreFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const plainData = JSON.parse(e.target.result);
                ui.showCustomConfirm(
                    "آیا از بازیابی اطلاعات مطمئن هستید؟ تمام داده‌های فعلی شما بازنویسی خواهد شد.",
                    () => {
                        state.rehydrateData(plainData);
                        state.saveData();
                        ui.renderClassList();
                        ui.showPage('class-management-page');
                        ui.showNotification("اطلاعات با موفقیت بازیابی شد.");

                    },
                    { confirmText: 'بازیابی کن', confirmClass: 'btn-warning' }
                );
            } catch (error) {
                ui.showNotification("خطا در خواندن فایل. لطفاً فایل پشتیبان معتبر انتخاب کنید.");
            }
        };
        reader.readAsText(file);
        event.target.value = null; // Reset input
    });

    window.addEventListener('popstate', (event) => {
        if (state.activeModal) {
            history.pushState(null, '', location.href);
        }
        ui.closeContextMenu();
        if (event.state) {
            const { pageId, currentClassName, selectedSessionNumber, selectedStudentId } = event.state;
            if (currentClassName) {
                state.setCurrentClassroom(state.classrooms[currentClassName]);
                if (selectedSessionNumber) {
                    state.setSelectedSession(state.currentClassroom.getSession(selectedSessionNumber));
                }
                if (selectedStudentId) {
                    state.setSelectedStudentForProfile(state.currentClassroom.students.find(s => s.identity.studentId === selectedStudentId));
                }
            }
            ui._internalShowPage(pageId);
        } else {
            state.setCurrentClassroom(null);
            state.setSelectedSession(null);
            state.setSelectedStudentForProfile(null);
            ui._internalShowPage('class-management-page');
        }
    });


    // All keyboard shortcust will be defined here
    document.addEventListener('keydown', (event) => {
        // First, determine if the user is typing in any input field.
        const focusedElement = document.activeElement;
        const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(focusedElement.tagName);

        // If the user is typing, we disable ALL keyboard shortcuts.
        if (isTyping) {
            return;
        }

        // --- Developer shortcut for restoring data ---
        if (event.key.toLowerCase() === 'o' && event.shiftKey) {
            // We only want this to work on the main page
            if (ui.classManagementPage.classList.contains('active')) {
                event.preventDefault(); // Prevents any default browser action for this shortcut
                ui.restoreFileInput.click(); // Programmatically clicks the hidden file input
            }
        }

        // --- Global 'Escape' key handler ---
        // This code now only runs if the user is NOT typing.
        if (event.key === 'Escape') {
            if (ui.contextMenu.classList.contains('visible')) {
                ui.closeContextMenu();
            } else if (state.activeModal) {
                ui.closeActiveModal();
            } else {
                history.back();
            }
            return; // Stop processing other shortcuts
        }

        // --- Page-Specific Shortcuts ---
        // The '!isTyping' check is no longer needed here because of the guard clause above.
        if (state.selectedSession) {
            const key = event.key.toLowerCase();

            // Prevent default browser actions for our shortcut keys
            if (' ascfg'.includes(key)) {
                event.preventDefault();
            }

            switch (key) {
                case ' ':
                    selectStudentBtn.click();
                    break;

                case 'a':
                    if (attendancePage.classList.contains('active')) {
                        history.back();
                    } else {
                        ui.renderAttendancePage();
                        ui.showPage('attendance-page');
                    }
                    break;

                case 's':
                    if (document.getElementById('session-page').classList.contains('active')) {
                        history.back();
                    } else {
                        backToSessionsBtn.click();
                    }
                    break;

                case 'c':
                    document.querySelector('.back-to-classes-btn').click();
                    break;

                case 'f':
                    const searchIcon = document.querySelector('.action-column .search-icon');
                    if (searchIcon) {
                        searchIcon.click();
                    }
                    break;

                case 'g':
                    if (studentProfilePage.classList.contains('active')) {
                        history.back();
                    } else {
                        const lastWinnerId = state.selectedSession.lastSelectedWinnerId;
                        if (lastWinnerId) {
                            const student = state.currentClassroom.students.find(s => s.identity.studentId === lastWinnerId);
                            if (student) {
                                state.setSelectedStudentForProfile(student);
                                ui.renderStudentProfilePage();
                                ui.showPage('student-profile-page');
                            }
                        } else {
                            ui.showNotification("ابتدا یک نفر را انتخاب کنید تا پروفایل او نمایش داده شود.");
                        }
                    }
                    break;

                case 'arrowleft': {
                    const backBtn = document.querySelector('button[title="برنده قبلی"]');
                    if (backBtn && !backBtn.disabled) {
                        event.preventDefault(); // Prevent page scrolling
                        backBtn.click();
                    }
                    break;
                }

                case 'arrowright': {
                    const forwardBtn = document.querySelector('button[title="برنده بعدی"]');
                    if (forwardBtn && !forwardBtn.disabled) {
                        event.preventDefault(); // Prevent page scrolling
                        forwardBtn.click();
                    }
                    break;
                }
            }
        }
    });

    function closeSideNav() {
        sideNavMenu.style.width = '0';
        overlay.classList.add('modal-closing'); // Use the modal's closing class

        setTimeout(() => {
            // This removes all classes after the animation finishes
            overlay.classList.remove('modal-visible', 'modal-closing');
        }, 300); // This duration must match your CSS animation time
    }

    // --- Initialize UI Components ---
    initializeAnimatedSearch('.global-search-container .animated-search-container', ui.renderGlobalSearchResults);
    initializeAnimatedSearch('.action-column-header .animated-search-container', ui.renderSearchResults);

    // --- Apply Auto-Direction to Textareas ---
    const textareasToMonitor = [
        ui.newNoteContent,          // Main note modal
        ui.newScoreCommentTextarea, // Score comments on profile page
        ui.quickNoteTextarea,       // Quick-grade note on student page
        ui.pasteArea                // Pasting student names in settings
    ];

    textareasToMonitor.forEach(textarea => {
        if (textarea) { // A small check to ensure the element exists
            ui.setAutoDirectionOnInput(textarea);
        }
    });

    profileStudentNameHeader.addEventListener('click', () => {
        const student = state.selectedStudentForProfile;
        const classroom = state.currentClassroom;
        if (!student || !classroom) return;

        // 1. Configure the modal for renaming
        const modalTitle = document.getElementById('add-note-modal-title');
        modalTitle.textContent = 'تغییر نام دانش‌آموز';
        ui.newNoteContent.value = student.identity.name;
        ui.newNoteContent.rows = 1; // Make textarea look like a single-line input

        // 2. Define what happens when the "Save" button is clicked
        state.setSaveNoteCallback((newName) => {
            const trimmedNewName = newName.trim();
            if (!trimmedNewName || trimmedNewName === student.identity.name) {
            } else {
                const isDuplicate = classroom.students.some(
                    s => !s.isDeleted && s.identity.name.toLowerCase() === trimmedNewName.toLowerCase()
                );

                if (isDuplicate) {
                    ui.showNotification('دانش‌آموزی با این نام از قبل در این کلاس وجود دارد.');
                } else {
                    student.identity.name = trimmedNewName;
                    state.saveData();
                    ui.renderStudentProfilePage();
                    ui.renderStudentStatsList();
                    ui.showNotification(`نام دانش‌آموز به «${trimmedNewName}» تغییر یافت.`);
                }
            }

            // 3. Reset the modal to its default state for adding notes
            modalTitle.textContent = 'ثبت یادداشت جدید';
            ui.newNoteContent.rows = 4; // A reasonable default for notes
        });

        // 4. Open the modal
        ui.openModal('add-note-modal');
        ui.newNoteContent.focus();
        ui.newNoteContent.select(); // Select the text for easy editing
    });

});
// --- PWA Service Worker Registration ---

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('Service Worker registered successfully:', registration);
            })
            .catch(err => {
                console.error('Service Worker registration failed:', err);
            });
    });
}

