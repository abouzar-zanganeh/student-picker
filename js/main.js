import * as state from './state.js';
import { resetAllStudentCounters } from './state.js';
import * as ui from './ui.js';
import { Classroom, Student, Category } from './models.js';

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
            // If the input is already visible, prevent the mousedown from
            // causing the input to lose focus (which would trigger the blur event).
            if (container.classList.contains('search-active')) {
                e.preventDefault();
            }
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
                if (clearResultsCallback) {
                    clearResultsCallback([]);
                }
            }, 150);
        });
    }


    // --- Event Listeners ---
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
                    // This function needs to be defined or moved.
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
        secureConfirmModal.style.display = 'none';
        state.setSecureConfirmCallback(null);
    });

    secureConfirmConfirmBtn.addEventListener('click', () => {
        if (typeof state.secureConfirmCallback === 'function') {
            state.secureConfirmCallback();
        }
        secureConfirmModal.style.display = 'none';
        state.setSecureConfirmCallback(null);
    });

    confirmModalCancelBtn.addEventListener('click', () => {
        customConfirmModal.style.display = 'none';
        if (typeof state.cancelCallback === 'function') {
            state.cancelCallback();
        }
        state.setConfirmCallback(null);
        state.setCancelCallback(null);
    });

    confirmModalConfirmBtn.addEventListener('click', () => {
        if (typeof state.confirmCallback === 'function') {
            state.confirmCallback();
        }
        customConfirmModal.style.display = 'none';
        state.setConfirmCallback(null);
        state.setCancelCallback(null);
    });

    backToAttendanceBtn.addEventListener('click', () => {
        if (state.currentClassroom && state.selectedSession) {
            ui.renderAttendancePage();
            ui.showPage('attendance-page');
        }
    });

    selectStudentBtn.addEventListener('click', () => {
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
            ui.displayWinner(winner, state.selectedCategory.name);
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
            const unfinishedSession = state.currentClassroom.sessions.find(session => !session.isFinished);
            if (unfinishedSession) {
                ui.showNotification(`جلسه ${unfinishedSession.sessionNumber} هنوز تمام نشده است. لطفاً ابتدا با دکمه ✅ آن را خاتمه دهید.`);
                return;
            }
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
                }
                else {
                    ui.renderStudentPage();
                }
                state.saveData();
            };
            ui.showCustomConfirm(
                "آیا تمایل به انجام فرآیند حضور و غیاب دارید?",
                () => startSession(true),
                {
                    confirmText: 'بله',
                    cancelText: 'خیر',
                    confirmClass: 'btn-success',
                    onCancel: () => startSession(false)
                }
            );
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
        const searchTerm = e.target.value.toLowerCase();
        if (searchTerm.length < 2) {
            ui.renderGlobalSearchResults([]); // Clear results if search is too short
            return;
        }

        const allResults = [];
        for (const className in state.classrooms) {
            const classroom = state.classrooms[className];
            const foundStudents = classroom.students.filter(student =>
                student.identity.name.toLowerCase().includes(searchTerm)
            );

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
        ui.renderSearchResults(e.target.value);
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
        newNoteContent.value = '';
        ui.openModal('add-note-modal');
        newNoteContent.focus();
    });

    cancelNoteBtn.addEventListener('click', () => {
        ui.closeActiveModal();
    });

    saveNoteBtn.addEventListener('click', () => {
        const content = newNoteContent.value.trim();
        if (content && state.selectedStudentForProfile) {
            state.selectedStudentForProfile.addNote(content);
            state.saveData();
            ui.renderStudentNotes();
            ui.closeActiveModal();
            ui.showNotification("یادداشت با موفقیت ذخیره شد.");
        }
    });

    hamburgerMenuBtn.addEventListener('click', () => {
        sideNavMenu.style.width = '250px';
        overlay.style.display = 'block';
    });

    closeNavBtn.addEventListener('click', () => {
        sideNavMenu.style.width = '0';
        overlay.style.display = 'none';
    });

    overlay.addEventListener('click', () => {
        sideNavMenu.style.width = '0';
        overlay.style.display = 'none';
    });

    backupDataBtn.addEventListener('click', () => {
        const dataStr = JSON.stringify(state.classrooms, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        const today = new Date().toLocaleDateString('fa-IR-u-nu-latn').replace(/\//g, '-');
        link.download = `teacher-assistant-backup-${today}.json`;
        link.click();
        URL.revokeObjectURL(url);
        ui.showNotification("پشتیبان‌گیری با موفقیت انجام شد.");
    });

    restoreDataBtn.addEventListener('click', () => {
        restoreFileInput.click();
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

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            // If a modal is active, close it.
            if (state.activeModal) {
                ui.closeActiveModal();
            }
            // Otherwise, perform the default back action.
            else {
                history.back();
            }
        }
    });

    // --- Initialize UI Components ---
    initializeAnimatedSearch('.global-search-container .animated-search-container', ui.renderGlobalSearchResults);
    initializeAnimatedSearch('.action-column-header .animated-search-container', ui.renderSearchResults);


});
