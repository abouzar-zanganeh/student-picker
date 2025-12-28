import * as state from './state.js';
import * as ui from './ui.js';
import * as logManager from './logManager.js';
import * as utils from './utils.js';
import * as db from './db.js';
import JSZip from 'jszip';
import { resetAllStudentCounters, getActiveItems, permanentlyDeleteStudent, getSessionDisplayMap, isAssessmentModeActive, setIsAssessmentModeActive } from './state.js';
import { switchDashboardTab, renderRestorePointsPage, newCategoryModalIsGradedCheckbox } from './ui.js';
import { Classroom, Student, Category } from './models.js';
import { normalizeText, normalizeKeyboard, parseStudentName, playSuccessSound } from './utils.js';


// --- Navigation Hierarchy Map which states which page is the parent of which ---
const NAVIGATION_HIERARCHY = {
    'session-dashboard-page': 'session-page',
    'column-mapping-page': 'settings-page',
    'csv-preview-page': 'settings-page',
    'restore-points-page': 'class-management-page',
    'session-page': 'class-management-page',
    'settings-page': 'class-management-page',
    'trash-page': 'class-management-page',
    'class-management-page': null // Root
};

let devModeClicks = 0;

let selectBtnLongPressActive = false;


// Restores application state based on the URL hash and query parameters.
// Returns true if a page was restored, false otherwise.
function restoreStateFromURL() {
    const hash = window.location.hash;
    if (!hash || hash === '#') return false;

    const [hashPath, queryString] = hash.split('?');
    const pageId = hashPath.substring(1); // Remove the '#'
    const params = new URLSearchParams(queryString);

    const className = params.get('class');
    const sessionNumber = parseInt(params.get('session'), 10);
    const studentId = params.get('student');

    const tab = params.get('tab') || 'selector'; // Default to 'selector' if not specified

    if (className && state.classrooms[className]) {
        state.setCurrentClassroom(state.classrooms[className]);

        if (sessionNumber && state.currentClassroom.getSession(sessionNumber)) {
            state.setSelectedSession(state.currentClassroom.getSession(sessionNumber));
        }

        if (studentId && state.currentClassroom.students.find(s => s.identity.studentId === studentId)) {
            state.setSelectedStudentForProfile(state.currentClassroom.students.find(s => s.identity.studentId === studentId));
        }
    } else {
        // If there's a hash but no valid class, can't restore the state.
        return false;
    }

    // Based on the pageId, render and show the correct page
    switch (pageId) {

        case 'session-page':
            ui.renderSessions();
            ui.showPage('session-page');
            break;

        case 'session-dashboard-page':
            // Determine the correct tab to show.
            const effectiveTab = (pageId === 'attendance-page') ? 'attendance' : tab;

            ui.renderSessionDashboard(effectiveTab);
            break;

        case 'settings-page':
            ui.showSettingsPage(state.currentClassroom);
            break;


        default:
            // If the pageId is something else (like trash-page, etc.), we don't restore it.
            return false;
    }

    return true; // Indicates that a page was successfully restored
}

document.addEventListener('DOMContentLoaded', () => {


    // --- HTML Elements (from ui.js, but needed for event listeners) ---
    const {
        globalStudentSearchInput, globalStudentSearchResultsDiv, classListUl, undoBtn,
        settingsPage, settingsClassNameHeader, settingsStudentListUl, categoryListUl,
        newStudentNameInput, addStudentBtn, pasteArea,
        processPasteBtn, csvPreviewPage, csvPreviewList, csvConfirmBtn,
        csvCancelBtn, importCsvBtn, csvFileInput, columnMappingPage,
        columnSelectDropdown, confirmColumnBtn, cancelImportBtn,
        selectStudentBtn, attendancePage, attendanceClassNameHeader,
        attendanceListUl, finishAttendanceBtn,
        classListHeader, studentStatsHeader, hamburgerMenuBtn,
        sideNavMenu, closeNavBtn, overlay, backupDataBtn, restoreDataBtn,
        restoreFileInput, customConfirmModal, confirmModalMessage,
        confirmModalCancelBtn, confirmModalConfirmBtn, secureConfirmModal,
        secureConfirmMessage, secureConfirmCode, secureConfirmInput,
        secureConfirmCancelBtn, secureConfirmConfirmBtn, addNoteModal,
        newNoteContent, classSaveNoteBtn, cancelNoteBtn, studentSearchInput,
        studentSearchResultsDiv, profileStatsSummaryDiv,
        profileScoresListUl, backupOptionsModal, backupDownloadBtn,
        backupShareBtn, backupOptionsCancelBtn, categoryModalSaveBtn, categoryModalCancelBtn,
        massCommentBtn, massCommentCancelBtn, massCommentSaveBtn,
        massCommentContent, massCommentAppendCheckbox, processMassHomeworkComment,
        attendanceSearchInput, newCategoryModalNameInput, newCategoryModalIsGradedCheckbox,
        newCategoryModalWeightInput, newCategoryModalWeightGroup, openAddCategoryBtn
    } = ui; // This is a bit of a trick to avoid rewriting all the getElementById calls
    const trashNavBtn = document.getElementById('trash-nav-btn');

    const globalSearchIcon = document.querySelector('.global-search-container .search-icon');

    // --- Initial Load ---
    state.loadData();
    ui.updateDemoModeBanner();

    // Try to restore the state from the URL
    const wasRestored = restoreStateFromURL();

    // If no state was restored from the URL (e.g., it's a fresh visit), load the default page
    if (!wasRestored) {
        ui.renderClassList();
        ui.showPage('class-management-page');
    }

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

    attendanceSearchInput.addEventListener('input', () => {
        const lowerCaseSearchTerm = attendanceSearchInput.value.toLowerCase().trim();
        const keyboardNormalizedTerm = normalizeKeyboard(lowerCaseSearchTerm);
        const studentListItems = ui.attendanceListUl.querySelectorAll('.attendance-list-item');

        studentListItems.forEach(item => {
            const nameSpan = item.querySelector('.student-name');
            if (nameSpan) {
                const studentName = nameSpan.textContent;
                const normalizedStudentName = normalizeText(studentName.toLowerCase());

                const matchesOriginal = normalizedStudentName.includes(normalizeText(lowerCaseSearchTerm));
                const matchesMapped = normalizedStudentName.includes(normalizeText(keyboardNormalizedTerm));

                if (matchesOriginal || matchesMapped) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            }
        });
    });

    categoryModalCancelBtn.addEventListener('click', () => {

        ui.closeActiveModal();
        state.setSaveCategoryCallback(null); // Clear the callback on cancel
    });

    categoryModalSaveBtn.addEventListener('click', () => {
        const categoryName = newCategoryModalNameInput.value.trim();
        const isGraded = newCategoryModalIsGradedCheckbox.checked;
        const weight = parseInt(newCategoryModalWeightInput.value, 10) || 1;

        if (!categoryName) {
            ui.showNotification('⚠️ نام دسته‌بندی نمی‌تواند خالی باشد.');
            return;
        }

        // Run the callback (adds the category)
        if (typeof state.saveCategoryCallback === 'function') {
            state.saveCategoryCallback(categoryName, isGraded, weight);
        }

        ui.closeActiveModal();
        ui.showNotification(`✅ دسته‌بندی جدید ${categoryName} با موفقیت اضافه شد.`);
        ui.renderSettingsCategories(); // Refresh list
    });

    window.addEventListener('scroll', ui.closeContextMenu);

    // REPLACE the old document click listener with this one
    document.addEventListener('click', (e) => {
        // Close context menu if visible
        if (ui.contextMenu.classList.contains('visible') && !ui.contextMenu.contains(e.target)) {
            ui.closeContextMenu();
        }

        // Hide student search dropdown
        if (!studentSearchInput.contains(e.target)) {
            studentSearchResultsDiv.style.display = 'none';
        }

        // Handle clicks on log links
        const logLink = e.target.closest('.log-action-link');
        if (logLink && logLink.dataset.action) {
            try {
                const action = JSON.parse(logLink.dataset.action);
                handleLogClick(action);
            } catch (error) {
                console.error("Could not parse log action:", error);
            }
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
                    ui.showNotification("تمام آمارها صفر شدند ✅.");
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

                        // Updated to include dots for parsing
                        const students = ['علی . رضایی', 'مریم . حسینی', 'زهرا . احمدی', 'رضا . محمدی', 'فاطمه . کریمی'];

                        // Use parseStudentName to populate firstName and lastName correctly
                        students.forEach(name => newClass.addStudent(new Student(parseStudentName(name))));

                        state.classrooms[testClassName] = newClass;
                        state.saveData();
                        ui.renderClassList();
                    }
                    createRandomClass();
                    ui.showNotification("کلاس تستی با موفقیت ساخته شد ✅!");
                },
                { confirmText: 'بساز', confirmClass: 'btn-success' }
            );
        }
    });


    // --- Developer Mode Activation ---
    // This developer mode will expose internal modules to the global 'dev' object after 10 clicks on the header.
    document.querySelector('.app-header h1').addEventListener('click', () => {
        devModeClicks++;

        if (devModeClicks === 10) {
            // Expose modules to a global namespace
            window.dev = {
                state,
                ui,
                utils,
                db
            };

            console.log("🛠️ Developer Mode Activated! Access modules via the 'dev' object (e.g., dev.state.currentClassroom)");
            ui.showNotification("🛠️ حالت توسعه‌دهنده فعال شد.");

            // Visual feedback: brief pulse animation on the header
            document.querySelector('.app-header h1').style.color = 'var(--color-primary)';
            document.querySelector('.app-header h1').classList.add('dev-mode-tilt');
        }
    });

    secureConfirmCancelBtn.addEventListener('click', () => {
        ui.closeActiveModal();
        state.setSecureConfirmCallback(null);
    });

    // --- Date Picker Modal Listeners ---
    const datePickerConfirmBtn = document.getElementById('date-picker-confirm-btn');
    const datePickerCancelBtn = document.getElementById('date-picker-cancel-btn');
    // Get references to the 3 dropdowns
    const dpDay = document.getElementById('dp-day');
    const dpMonth = document.getElementById('dp-month');
    const dpYear = document.getElementById('dp-year');

    datePickerConfirmBtn.addEventListener('click', () => {
        // Collect values
        const jy = dpYear.value;
        const jm = dpMonth.value;
        const jd = dpDay.value;

        if (jy && jm && jd && typeof state.datePickerCallback === 'function') {
            // Pass simple object to callback
            state.datePickerCallback({ jy, jm, jd });
            ui.closeActiveModal();
        } else {
            ui.showNotification("⚠️ خطا در انتخاب تاریخ.");
        }
        state.setDatePickerCallback(null);
    });

    if (datePickerCancelBtn) {
        datePickerCancelBtn.addEventListener('click', () => {
            ui.closeActiveModal();
            state.setDatePickerCallback(null); // Clear the callback so it doesn't fire later
        });
    }


    // --- End of Date Picker Modal Listeners ---


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


    ui.selectStudentBtn.addEventListener('click', () => {

        if (selectBtnLongPressActive) {
            selectBtnLongPressActive = false;
            return;
        }

        // 1. Guard check: Prevent selection if there's unsaved data (Applies to both modes)
        if (ui.quickScoreInput.value.trim() !== '' || ui.quickNoteTextarea.value.trim() !== '') {
            ui.showNotification("⚠️لطفاً ابتدا با دکمه «ثبت»، تغییرات را ذخیره کنید و یا نمره و یادداشت را پاک کنید.");
            return;
        }

        if (isAssessmentModeActive) {
            const winner = pickAssessmentWinner(state.currentClassroom, state.selectedCategory);

            if (winner) {
                // Trigger highlights
                ui.renderStudentStatsList();
                ui.displayWinner(winner, state.selectedCategory.name);
                ui.updateCategoryColumnHighlight(state.selectedCategory.name);
                state.saveData();
            } else {
                // THE DETECTION: This runs when pickAssessmentWinner returns null
                ui.showCustomConfirm(
                    "برای تمام دانش‌آموزان در این جلسه یک بار فرصت نمره‌گیری فراهم شده؛ آیا می‌خواهید برای بار دوم این کار را تکرار کنید؟",
                    () => {
                        const categoryId = state.selectedCategory.id;
                        // Reset the round for this category
                        state.assessmentPools[categoryId].scoredThisSession = [];

                        // Automatically trigger the first selection of the new round
                        ui.selectStudentBtn.click();
                    },
                    { confirmText: 'بله', cancelText: 'خیر', confirmClass: 'btn-success' }
                );
            }
        } else {
            // 3. Standard Mode Logic
            if (!state.currentClassroom || !state.selectedSession || !state.selectedCategory) return;

            const winner = state.currentClassroom.selectNextWinner(state.selectedCategory.name, state.selectedSession);

            if (winner) {
                playSuccessSound();

                // Increment standard counters
                const studentRecord = state.selectedSession.studentRecords[winner.identity.studentId];
                if (studentRecord?.attendance === 'absent') winner.statusCounters.missedChances++;
                if (studentRecord?.hadIssue) {
                    winner.statusCounters.missedChances++;
                    winner.categoryIssues[state.selectedCategory.name] = (winner.categoryIssues[state.selectedCategory.name] || 0) + 1;
                }
                if (studentRecord?.wasOutOfClass) {
                    winner.statusCounters.outOfClassCount = (winner.statusCounters.outOfClassCount || 0) + 1;
                    winner.statusCounters.missedChances++;
                }

                // Update History
                const historyEntry = { winner, categoryName: state.selectedCategory.name };
                state.selectedSession.winnerHistory.push(historyEntry);
                if (state.selectedSession.winnerHistory.length > 10) state.selectedSession.winnerHistory.shift();
                state.setWinnerHistoryIndex(state.selectedSession.winnerHistory.length - 1);

                state.selectedSession.lastUsedCategoryId = state.selectedCategory.id;
                state.selectedSession.lastSelectedWinnerId = winner.identity.studentId;

                ui.renderStudentStatsList();
                setTimeout(() => ui.displayWinner(), 0);
                state.saveData();
            } else {
                ui.showNotification("❌دانش‌آموز واجد شرایطی برای انتخاب یافت نشد.");
            }
        }
    });


    // --- EVENT LISTENERS FOR CLASS TYPE ---
    const classTypeSettingRadios = document.querySelectorAll('#settings-page input[name="class-type-setting"]');

    classTypeSettingRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (!state.currentClassroom) return;

            const newType = radio.value;
            const oldType = state.currentClassroom.info.type || 'in-person';

            // If the type hasn't actually changed, do nothing.
            if (newType === oldType) return;

            const typeText = (type) => type === 'online' ? 'آنلاین' : 'حضوری';
            const oldTypeText = typeText(oldType);
            const newTypeText = typeText(newType);

            // Show confirmation modal
            ui.showCustomConfirm(
                `آیا از تغییر نوع کلاس از «${oldTypeText}» به «${newTypeText}» مطمئن هستید؟`,
                () => {
                    // --- ON CONFIRM ---
                    // This is the original logic
                    state.currentClassroom.info.type = newType;
                    state.saveData();

                    logManager.addLog(state.currentClassroom.info.name, `نوع کلاس به «${newTypeText}» تغییر یافت.`, { type: 'VIEW_CLASS_SETTINGS' });
                    ui.renderClassList();
                    ui.showNotification(`✅ نوع کلاس به «${newTypeText}» تغییر یافت.`);
                },
                {
                    confirmText: 'بله',
                    confirmClass: 'btn-warning',
                    onCancel: () => {
                        // --- ON CANCEL ---
                        // Revert the radio button check to the old value
                        const oldRadio = document.querySelector(`#settings-page input[name="class-type-setting"][value="${oldType}"]`);
                        if (oldRadio) {
                            oldRadio.checked = true;
                        }
                    }
                }
            );
        });
    });

    // --- EVENT LISTENERS FOR SCHEDULE SETTINGS ---
    const scheduleDayCheckboxes = document.querySelectorAll('input[name="schedule-day"]');
    const scheduleStartTimeInput = document.getElementById('settings-schedule-start');
    const scheduleEndTimeInput = document.getElementById('settings-schedule-end');

    scheduleDayCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            if (!state.currentClassroom) return;

            // Create an array of selected days (e.g., [6, 0])
            const selectedDays = Array.from(scheduleDayCheckboxes)
                .filter(cb => cb.checked)
                .map(cb => parseInt(cb.value));

            state.currentClassroom.info.scheduleDays = selectedDays;
            state.saveData();
        });
    });

    const handleTimeChange = () => {
        if (!state.currentClassroom) return;
        state.currentClassroom.info.scheduleStartTime = scheduleStartTimeInput.value;
        state.currentClassroom.info.scheduleEndTime = scheduleEndTimeInput.value;
        state.saveData();
    };

    scheduleStartTimeInput.addEventListener('change', handleTimeChange);
    scheduleEndTimeInput.addEventListener('change', handleTimeChange);

    // --- END EVENT LISTENERS ---


    confirmColumnBtn.addEventListener('click', () => {
        if (!state.importedFileContent) {
            ui.showNotification("❌خطایی رخ داده است. لطفاً فایل را دوباره انتخاب کنید.");
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
            ui.showNotification("هیچ نامی در ستون انتخاب شده پیدا نشد. لطفاً ستون دیگری را امتحان کنید یا فایل خود را بررسی کنید.");
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
        let addedCount = 0;
        let skippedNames = [];
        let onboardingOccurred = false;

        selectedCheckboxes.forEach(checkbox => {
            const name = checkbox.dataset.name;
            const parsedName = parseStudentName(name);
            const normalizedNewName = normalizeText(parsedName.name);

            const existingStudent = state.currentClassroom.students.find(student => {
                const normalizedExisting = normalizeText(student.identity.name);
                return normalizedExisting === normalizedNewName && normalizedNewName !== '';
            });

            if (existingStudent) {
                if (existingStudent.isDeleted) {
                    // پاک‌سازی دانش‌آموز حذف شده برای جایگزینی با نسخه جدید
                    permanentlyDeleteStudent(existingStudent, state.currentClassroom);
                } else {
                    // افزودن به لیست تکراری‌ها و پرش از این مرحله
                    skippedNames.push(parsedName.name);
                    return;
                }
            }

            const newStudent = new Student(parsedName);
            state.currentClassroom.addStudent(newStudent);

            // مدیریت دانش‌آموز جدید در کلاسی که جلسات قدیمی دارد
            if (state.currentClassroom.sessions.length > 0) {
                getActiveItems(state.currentClassroom.sessions)
                    .filter(s => s.isFinished && !s.isCancelled)
                    .forEach(session => {
                        session.setAttendance(newStudent.identity.studentId, 'absent');
                    });

                onboardNewStudent(newStudent, state.currentClassroom);
                onboardingOccurred = true;
            }
            addedCount++;
        });

        state.saveData();

        // ثبت در گزارش فعالیت‌ها
        if (addedCount > 0) {
            logManager.addLog(state.currentClassroom.info.name,
                `${addedCount} دانش‌آموز جدید از لیست ورودی به کلاس اضافه شدند.`,
                { type: 'VIEW_SESSIONS' });
        }

        ui.showSettingsPage(state.currentClassroom);

        // آماده‌سازی بخش "تکراری‌ها" در پیام
        let duplicateInfo = skippedNames.length > 0
            ? `⚠️ موارد زیر به دلیل تکراری بودن نادیده گرفته شدند:\n- ${skippedNames.join('\n- ')}`
            : '';

        // نمایش گزارش نهایی با استفاده از تابع به‌روز شده
        if (onboardingOccurred) {
            showOnboardingNotification(addedCount, duplicateInfo);
        } else if (skippedNames.length > 0 || addedCount > 0) {
            const finalMsg = addedCount > 0
                ? `✅ ${addedCount} دانش‌آموز با موفقیت اضافه شدند.\n${duplicateInfo}`
                : duplicateInfo;

            ui.showCustomConfirm(finalMsg, () => { }, {
                confirmText: 'متوجه شدم',
                confirmClass: 'btn-success',
                onCancel: null
            });
        }

        pasteArea.value = '';
        state.setNamesToImport([]);
    });

    csvCancelBtn.addEventListener('click', () => {
        state.setNamesToImport([]);
        ui.showPage('settings-page');
    });

    pasteArea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const value = pasteArea.value;
            const cursorPosition = pasteArea.selectionStart;
            const lastNewLineIndex = value.lastIndexOf('\n', cursorPosition - 1);
            const currentLine = value.substring(lastNewLineIndex + 1, cursorPosition).trim();

            const dotIndex = currentLine.indexOf('.');
            if (currentLine && (dotIndex <= 0 || dotIndex >= currentLine.length - 1)) {
                e.preventDefault(); // Prevents the new line from being created
                ui.showNotification("لطفا یک نقطه بین نام و نام خانوادگی قرار دهید.⚠️ مثال: علی . احمدی", 5000);
            }
        }
    });

    processPasteBtn.addEventListener('click', () => {
        const text = pasteArea.value.trim();
        if (!text) {
            ui.showNotification("کادر متنی خالی است. لطفاً اسامی را وارد کنید.");
            return;
        }
        const names = text.split('\n').map(name => name.trim()).filter(name => name.length > 0);

        // Validation: Check every name for the dot format
        const invalidName = names.find(name => {
            const dotIndex = name.indexOf('.');
            return dotIndex <= 0 || dotIndex >= name.length - 1;
        });

        if (invalidName) {
            ui.showNotification(`فرمت نام «${invalidName}» صحیح نیست. لطفا نام و نام خانوادگی را با نقطه جدا کنید⚠️.`, 5000);
            return;
        }

        if (names.length > 0) {
            state.setNamesToImport(names);
            ui.renderImportPreview();
            ui.showPage('csv-preview-page');
        } else {
            ui.showNotification("هیچ نام معتبری برای ورود پیدا نشد.");
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
            ui.showNotification("لطفاً نام دانش‌آموز را وارد کنید.");
            return;
        }
        const dotIndex = studentName.indexOf('.');
        if (dotIndex <= 0 || dotIndex >= studentName.length - 1) {
            ui.showNotification("لطفا یک نقطه بین نام و نام خانوادگی قرار دهید.⚠️ مثال: علی . احمدی", 5000);
            return;
        }

        const parsed = parseStudentName(newStudentNameInput.value);
        const normalizedNewName = normalizeText(parsed.name);

        const isDuplicate = getActiveItems(state.currentClassroom.students).some(s =>
            normalizeText(s.identity.name) === normalizedNewName
        );

        if (isDuplicate) {
            ui.showNotification(`دانش‌آموز «${parsed.name}» قبلاً در لیست وجود دارد.`, 4000);
            return;
        }

        // Use the helper to parse the name (looks for dot signal)
        const parsedIdentity = parseStudentName(studentName);
        const newStudent = new Student(parsedIdentity); state.currentClassroom.addStudent(newStudent);

        if (state.currentClassroom.sessions.length > 0) {

            // Manually set absence for all finished sessions
            getActiveItems(state.currentClassroom.sessions)
                .filter(s => s.isFinished && !s.isCancelled)
                .forEach(session => {
                    session.setAttendance(newStudent.identity.studentId, 'absent');
                });

            onboardNewStudent(newStudent, state.currentClassroom);
            showOnboardingNotification(1);
        }

        state.saveData();

        logManager.addLog(state.currentClassroom.info.name,
            `دانش‌آموز «${studentName}» به کلاس اضافه شد.`, {
            type: 'VIEW_STUDENT_PROFILE',
            studentId: newStudent.identity.studentId
        });

        ui.renderSettingsStudentList();
        ui.renderStudentStatsList();
        newStudentNameInput.value = '';
        newStudentNameInput.focus();
    });

    document.getElementById('new-session-btn').addEventListener('click', () => {
        if (state.currentClassroom) {
            const unfinishedSession = state.currentClassroom.sessions.find(session => !session.isFinished && !session.isCancelled && !session.isDeleted);
            if (unfinishedSession) {
                ui.showNotification(`⚠️ جلسه ${unfinishedSession.sessionNumber} هنوز تمام نشده است. لطفاً ابتدا با دکمه ✅ آن را خاتمه دهید.`);

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

                    // --- CORRECT ORDER ---
                    // 1. Save the new session data.
                    state.saveData();

                    // 2. Create the log entry.
                    const sessionMap = getSessionDisplayMap(state.currentClassroom);
                    const displayNumber = sessionMap.get(newSession.sessionNumber);
                    logManager.addLog(state.currentClassroom.info.name, `جلسه ${displayNumber} شروع شد.`, { type: 'VIEW_SESSIONS' });

                    // 3. Navigate to the tabbed dashboard
                    ui.renderSessionDashboard(takeAttendance ? 'attendance' : 'selector');
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
                    { confirmText: 'بله', confirmClass: 'btn-warning' }
                );
            } else {
                // Otherwise, just ask about attendance as before.
                askAboutAttendanceAndStart();
            }
        }
    });

    // --- Add Class Modal Logic ---

    // 1. Open Modal
    // We get the element here to be safe
    const openAddClassBtn = document.getElementById('open-add-class-modal-btn');

    if (openAddClassBtn) {
        openAddClassBtn.addEventListener('click', () => {
            ui.openAddClassModal();
        });
    }

    // 2. Cancel / Close
    if (ui.cancelAddClassBtn) {
        ui.cancelAddClassBtn.addEventListener('click', () => {
            ui.closeAddClassModal();
        });
    }

    // 3. Confirm Creation (Debug Version)
    if (ui.confirmAddClassBtn) {

        ui.confirmAddClassBtn.addEventListener('click', () => {

            // 1. Check Input
            const nameInput = ui.modalNewClassNameInput;
            if (!nameInput) {
                console.error("❌ DEBUG: Name Input element is missing!");
                return;
            }
            const name = nameInput.value.trim();

            // Basic Validation
            if (!name) {
                ui.showNotification('لطفاً نام کلاس را وارد کنید.');
                return;
            }
            if (state.classrooms[name]) {
                ui.showNotification('کلاسی با این نام قبلاً ایجاد شده است.');
                return;
            }

            try {
                // Gather Data from Modal Inputs
                const typeRadio = document.querySelector('input[name="modal-class-type"]:checked');
                if (!typeRadio) {
                    console.error("❌ DEBUG: Class Type radio not selected or found!");
                    return;
                }
                const type = typeRadio.value;
                const educationalSystem = ui.modalAddClassSystemSelect.value;


                const newClassName = ui.modalNewClassNameInput.value.trim();
                if (!newClassName) {
                    ui.showNotification('⚠️ لطفاً نام کلاس را وارد کنید.');
                    return;
                }
                if (state.classrooms[newClassName]) {
                    ui.showNotification('⚠️ کلاسی با این نام وجود دارد.');
                    return;
                }

                // Read class type
                const classType = document.querySelector('input[name="modal-class-type"]:checked')?.value || 'in-person';

                // Read educational system and level
                const eduSystem = ui.modalAddClassSystemSelect.value;
                const level = ui.modalAddClassLevelSelect.value || null;

                // Read scheduling data
                const scheduleText = ui.modalScheduleTextInput.value.trim() || null;
                const scheduleDays = Array.from(ui.modalScheduleDaysContainer.querySelectorAll('input:checked'))
                    .map(checkbox => parseInt(checkbox.value, 10));
                const scheduleStartTime = ui.modalScheduleStartTimeInput.value || null;
                const scheduleEndTime = ui.modalScheduleEndTimeInput.value || null;

                // Create the new classroom with all info
                const newClassroom = new Classroom({
                    name: newClassName,
                    type: classType,
                    educationalSystem: eduSystem,
                    level: level,
                    scheduleText: scheduleText,
                    scheduleDays: scheduleDays,
                    scheduleStartTime: scheduleStartTime,
                    scheduleEndTime: scheduleEndTime
                });

                state.classrooms[newClassName] = newClassroom;
                state.saveData();

                ui.closeActiveModal();
                ui.renderClassList();
                ui.showNotification(`✅ کلاس «${newClassName}» ایجاد شد.`);

                // Save to State
                state.classrooms[name] = newClassroom;
                state.saveData();

                // Update UI & Close
                ui.renderClassList();
                ui.closeAddClassModal();

            } catch (error) {
                console.error("❌ CRASH ERROR:", error);
                ui.showNotification("خطایی رخ داد: " + error.message);
            }
        });
    } else {
        console.error("❌ DEBUG: Create Button (ui.confirmAddClassBtn) is NOT found!");
    }
    //---------------------------------



    globalStudentSearchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value;
        if (searchTerm.length < 2) {
            ui.renderGlobalSearchResults([]);
            return;
        }

        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        const keyboardNormalizedTerm = normalizeKeyboard(lowerCaseSearchTerm);

        const allResults = [];

        // --- NEW: Search for classrooms first ---
        for (const className in state.classrooms) {
            const classroom = state.classrooms[className];
            if (classroom.isDeleted) continue;

            const normalizedClassName = normalizeText(className.toLowerCase());
            const matchesOriginal = normalizedClassName.includes(normalizeText(lowerCaseSearchTerm));
            const matchesMapped = normalizedClassName.includes(normalizeText(keyboardNormalizedTerm));

            if (matchesOriginal || matchesMapped) {
                allResults.push({ type: 'classroom', classroom: classroom });
            }
        }
        // --- End of new part ---

        // --- Existing student search (now modified) ---
        for (const className in state.classrooms) {
            const classroom = state.classrooms[className];
            if (classroom.isDeleted) continue;

            const foundStudents = getActiveItems(classroom.students).filter(student => {
                const normalizedStudentName = normalizeText(student.identity.name.toLowerCase());
                const matchesOriginal = normalizedStudentName.includes(normalizeText(lowerCaseSearchTerm));
                const matchesMapped = normalizedStudentName.includes(normalizeText(keyboardNormalizedTerm));
                return matchesOriginal || matchesMapped;
            });

            foundStudents.forEach(student => {
                // Add the 'type' property to the result
                allResults.push({ type: 'student', student, classroom });
            });
        }

        ui.renderGlobalSearchResults(allResults);
    });

    undoBtn.addEventListener('click', ui.handleUndo);

    finishAttendanceBtn.addEventListener('click', () => {
        ui.switchDashboardTab('selector');
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
            ui.showNotification("❌خطا: دانش‌آموز معتبری برای ثبت نمره یافت نشد.");
            return;
        }
        const category = state.selectedCategory;

        if (!student || !category) {
            ui.showNotification("⚠️لطفاً ابتدا یک دانش‌آموز و یک دسته‌بندی را انتخاب کنید.");
            return;
        }

        if (!scoreValue) {
            ui.showNotification("⚠️لطفاً مقدار نمره را وارد کنید.");
            return;
        }

        if (scoreValue > 100 || scoreValue < 0) {
            ui.showNotification("❌نمره نباید از ۱۰۰ بیشتر و از صفر کمتر باشد");
            return;
        }


        if (student) {
            student.addScore(category.name, parseFloat(scoreValue), noteText);

            logManager.addLog(state.currentClassroom.info.name,
                `نمره ${scoreValue} در ${category.name} برای «${student.identity.name}» ثبت شد.`,
                { type: 'VIEW_STUDENT_PROFILE', studentId: student.identity.studentId });

            state.saveData();
            ui.renderStudentStatsList(); // Refreshes the stats table to show the new score.
            ui.showNotification(`✅نمره برای ${student.identity.name} در مهارت ${category.name} ثبت شد.`);
            state.markStudentAsScoredInSession(state.selectedCategory.id, student.identity.studentId);
            // Clear inputs for the next entry
            ui.quickScoreInput.value = '';
            ui.quickNoteTextarea.value = '';
            // Refresh the winner display to show the new score/note instantly
            ui.displayWinner();
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

    cancelNoteBtn.addEventListener('click', () => {
        ui.closeActiveModal();
    });

    classSaveNoteBtn.addEventListener('click', () => {
        const content = newNoteContent.value.trim();
        const callback = state.saveNoteCallback;

        if (typeof callback === 'function') {
            // execute the callback first
            const result = callback(content);

            // Protocol:
            // return false -> Validation Failed (Keep Open)
            // return Function -> Success + Navigation (Close then Run)
            // return undefined/other -> Success (Close)

            if (result === false) {
                // Do not close the modal
                return;
            }

            ui.closeActiveModal(() => {
                if (typeof result === 'function') {
                    result(); // Run the post-close navigation (like opening profile)
                }
            });
        } else {
            ui.closeActiveModal();
        }
    });

    const moveStudentConfirmBtn = document.getElementById('move-student-confirm-btn');
    const moveStudentCancelBtn = document.getElementById('move-student-cancel-btn');
    const classSelectDropdown = document.getElementById('move-student-class-select');

    moveStudentCancelBtn.addEventListener('click', () => {
        ui.closeActiveModal();
    });

    moveStudentConfirmBtn.addEventListener('click', () => {
        const destinationClassName = classSelectDropdown.value;
        const destinationClassroom = state.classrooms[destinationClassName];
        const { studentToMove, sourceClassForMove } = state;

        if (!studentToMove || !sourceClassForMove || !destinationClassroom) {
            ui.showNotification('خطایی رخ داد. لطفاً دوباره امتحان کنید⚠️.', 'error');
            ui.closeActiveModal();
            return;
        }

        const result = state.moveStudent(studentToMove, sourceClassForMove, destinationClassroom);

        if (result.success) {

            logManager.addLog(sourceClassForMove.info.name, `دانش‌آموز «${studentToMove.identity.name}» به کلاس «${destinationClassName}» منتقل شد.`, { type: 'VIEW_SESSIONS' });
            logManager.addLog(destinationClassName, `دانش‌آموز «${studentToMove.identity.name}» از کلاس «${sourceClassForMove.info.name}» به این کلاس منتقل شد.`, { type: 'VIEW_SESSIONS' });

            state.saveData();
            ui.renderSettingsStudentList();
            ui.renderStudentStatsList();
            ui.renderAttendancePage();
            ui.showNotification(`دانش‌آموز «${studentToMove.identity.name}» با موفقیت به کلاس «${destinationClassName}» منتقل شد✅.`);
        } else {
            ui.showNotification(result.message, 'error');
        }

        ui.closeActiveModal();
    });


    hamburgerMenuBtn.addEventListener('click', () => {
        sideNavMenu.style.width = '300px';
        overlay.classList.add('modal-visible');
    });

    hamburgerMenuBtn.addEventListener('click', () => {
        sideNavMenu.style.width = '300px';
        overlay.classList.add('modal-visible');
    });

    // --- NEW HEADER SETTINGS BUTTON LISTENER ---
    const headerSettingsBtn = document.getElementById('header-settings-btn');
    if (headerSettingsBtn) {
        headerSettingsBtn.addEventListener('click', () => {
            if (state.currentClassroom) {
                ui.showSettingsPage(state.currentClassroom);
            }
        });
    }
    // --- END NEW LISTENER ---

    closeNavBtn.addEventListener('click', closeSideNav);

    closeNavBtn.addEventListener('click', closeSideNav);
    overlay.addEventListener('click', closeSideNav);

    trashNavBtn.addEventListener('click', () => {
        ui.renderTrashPage();
        ui.showPage('trash-page');
        closeSideNav(); // Close the nav menu after clicking
    });

    // Restore Points Menu Button
    const restorePointsBtn = document.getElementById('restore-points-nav-btn');
    if (restorePointsBtn) {
        restorePointsBtn.addEventListener('click', () => {
            ui.renderRestorePointsPage();
            ui.showPage('restore-points-page');
            closeSideNav(); // Reuse your existing helper
        });
    }


    const demoModeBtn = document.getElementById('demo-mode-btn'); // for the demo mode (this and the following event listener)
    demoModeBtn.addEventListener('click', () => {
        if (state.isDemoMode) {
            handleExitDemoMode();
        } else {
            closeSideNav();
            ui.showCustomConfirm(
                "شما در حال ورود به حالت نمایش (Demo) هستید. در این حالت، هیچ‌کدام از تغییرات شما ذخیره نخواهد شد. آیا ادامه می‌دهید؟",
                () => {
                    state.enterDemoMode();
                    ui.updateDemoModeBanner();
                    closeSideNav();
                },
                { confirmText: 'تایید', confirmClass: 'btn-warning', onCancel: closeSideNav }
            );
        }
    });

    const exitDemoBtn = document.getElementById('exit-demo-btn');
    if (exitDemoBtn) {
        exitDemoBtn.addEventListener('click', () => {
            if (state.isDemoMode) {
                handleExitDemoMode();
            }
        });
    }

    backupDataBtn.addEventListener('click', () => {

        if (state.isDemoMode) {
            ui.showNotification("⚠️ پشتیبان‌گیری در حالت نمایش (Demo) غیرفعال است.");
            closeSideNav();
            return;
        }

        closeSideNav();
        ui.initiateBackupProcess();
    });

    restoreDataBtn.addEventListener('click', () => {

        if (state.isDemoMode) {
            ui.showNotification("⚠️ بازیابی اطلاعات در حالت نمایش (Demo) غیرفعال است.");
            closeSideNav();
            return;
        }

        restoreFileInput.click();
        closeSideNav();
    });

    restoreFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        // Make the onload function ASYNC to handle unzipping
        reader.onload = async (e) => {
            const fileContent = e.target.result;

            try {
                // --- TRY BLOCK: Assumes it's an OLD, plain-text JSON file ---
                const plainData = JSON.parse(fileContent);

                // Check if it's the NEW metadata format (but uncompressed)
                if (plainData.metadata && plainData.data) {
                    // This will handle v2.0 backups that were not Base64
                    ui.showRestoreConfirmModal(plainData);
                } else {
                    // This handles v1.0 backups (the raw classrooms object)
                    const classroomsDataToRestore = plainData.classrooms || plainData;
                    const trashDataToRestore = plainData.trashBin || [];

                    ui.showCustomConfirm(
                        "آیا از بازیابی اطلاعات مطمئن هستید؟ تمام داده‌های فعلی شما بازنویسی خواهد شد.",
                        () => {
                            state.rehydrateData(classroomsDataToRestore);
                            state.setTrashBin(trashDataToRestore);
                            state.setUserSettings({ lastRestoreTimestamp: new Date().toISOString() });
                            state.saveData();
                            ui.renderClassList();
                            ui.showPage('class-management-page');
                            ui.showNotification("✅اطلاعات با موفقیت بازیابی شد.");
                        },
                        { confirmText: 'بازیابی کن', confirmClass: 'btn-warning' }
                    );
                }

            } catch (jsonError) {
                // --- CATCH BLOCK: Assumes it's a NEW, Base64-compressed file ---
                // The JSON.parse failed, so it's not a plain JSON file.
                // Let's try to decompress it as a Base64 zip.
                try {
                    const zip = new JSZip();

                    // 1. Load the Base64 string (the fileContent)
                    const unzipped = await zip.loadAsync(fileContent, { base64: true });

                    // 2. Find the backup.json file inside
                    const backupFile = unzipped.file("backup.json");
                    if (!backupFile) {
                        throw new Error("فایل backup.json در فایل پشتیبان یافت نشد.");
                    }

                    // 3. Read the content of backup.json as text
                    const jsonString = await backupFile.async("string");

                    // 4. Parse that text into our data object
                    const plainData = JSON.parse(jsonString);

                    // 5. Check if it's our new "2.0-b64" format
                    if (plainData.metadata && plainData.metadata.version === "2.0-b64") {
                        // Success! Show the restore modal
                        ui.showRestoreConfirmModal(plainData);
                    } else {
                        throw new Error("فایل پشتیبان معتبر نیست (نسخه نامشخص).");
                    }

                } catch (zipError) {
                    // This catches errors from zipping or Base64 decoding
                    ui.showNotification("❌خطا در خواندن فایل. لطفاً فایل پشتیبان معتبر انتخاب کنید.");
                    console.error("Restore error (zip/base64):", zipError);
                }
            }
        };

        // We must read the file as text for BOTH old JSON and new Base64
        reader.readAsText(file);
        event.target.value = null; // Reset input
    });

    window.addEventListener('popstate', (event) => {
        // If a modal is open when the back button is used,
        // our only job is to close it and stop further action.
        if (state.activeModal) {
            // Call our function and pass 'true' to signify this is a history pop.
            ui.closeActiveModal(null, true);
            return; // IMPORTANT: Stop here to prevent page navigation.
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

            // This block handles restoring the correct page view from history
            if (pageId === 'session-page') {
                ui.renderSessions();
                ui._internalShowPage(pageId);
            } else {
                ui._internalShowPage(pageId);
            }

        } else {
            // If there's no state, go back to the home page
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
            // Priority 1: Close context menu if visible
            if (ui.contextMenu.classList.contains('visible')) {
                ui.closeContextMenu();
                return;
            }

            // Priority 2: Close active modal
            if (state.activeModal) {
                ui.closeActiveModal();
                return;
            }

            // Priority 3: Hierarchical back navigation
            const activePageId = document.querySelector('.page.active')?.id;

            switch (activePageId) {
                case 'csv-preview-page':
                case 'column-mapping-page':
                    ui.showPage('settings-page');
                    break;

                case 'settings-page':
                case 'session-page':
                    // Both pages are children of a class, go back to the class list
                    state.setCurrentClassroom(null);
                    ui.showPage('class-management-page');
                    break;
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
                    }
                    break;

                case 'f':
                    const searchIcon = document.querySelector('.action-column .search-icon');
                    if (searchIcon) {
                        searchIcon.click();
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

    function handleExitDemoMode() {
        ui.showCustomConfirm(
            "آیا از خروج از حالت نمایش (Demo) مطمئن هستید؟ با خروج، تمام تغییرات آزمایشی شما حذف شده و داده‌های اصلی شما بازیابی خواهند شد.",
            () => {
                state.exitDemoMode();

                // Reset the navigation state before re-rendering
                state.setCurrentClassroom(null);
                state.setSelectedSession(null);
                state.setSelectedStudentForProfile(null);

                ui.renderClassList();
                ui.showPage('class-management-page');
                ui.updateDemoModeBanner();
                closeSideNav(); // Ensure nav is closed if exiting from there
            },
            { confirmText: 'خروج', confirmClass: 'btn-success' }
        );
    }

    // --- Initialize UI Components ---
    initializeAnimatedSearch('.global-search-container .animated-search-container', ui.renderGlobalSearchResults);
    initializeAnimatedSearch('.action-column-header .animated-search-container', ui.renderSearchResults);

    setupSwipeNavigation();

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

    function onboardNewStudent(newStudent, classroom) {
        const existingStudents = getActiveItems(classroom.students).filter(s => s.identity.studentId !== newStudent.identity.studentId);
        if (existingStudents.length === 0) return;

        // --- 1. Find the most active student to use as a template ---
        const templateStudent = existingStudents.reduce((maxStudent, currentStudent) => {
            return currentStudent.statusCounters.totalSelections > maxStudent.statusCounters.totalSelections ? currentStudent : maxStudent;
        }, existingStudents[0]);

        if (!templateStudent || templateStudent.statusCounters.totalSelections === 0) {
            return; // No stats to copy, so we exit.
        }

        // --- 2. Copy participation stats from the template student ---
        newStudent.categoryCounts = JSON.parse(JSON.stringify(templateStudent.categoryCounts));
        newStudent.statusCounters.totalSelections = templateStudent.statusCounters.totalSelections;

        // --- 3. Calculate absence-related stats based on the class average ---
        const totalClassSelections = existingStudents.reduce((sum, s) => sum + s.statusCounters.totalSelections, 0);
        const totalClassMissedChances = existingStudents.reduce((sum, s) => sum + (s.statusCounters.missedChances || 0), 0);
        const missedChanceRate = totalClassSelections > 0 ? totalClassMissedChances / totalClassSelections : 0;
        newStudent.statusCounters.missedChances = Math.round(newStudent.statusCounters.totalSelections * missedChanceRate);

        const activeCategories = getActiveItems(classroom.categories);
        const categoryIssueRates = {};
        activeCategories.forEach(category => {
            const totalCatSelections = existingStudents.reduce((sum, s) => sum + (s.categoryCounts[category.name] || 0), 0);
            const totalCatIssues = existingStudents.reduce((sum, s) => sum + (s.categoryIssues[category.name] || 0), 0);
            categoryIssueRates[category.name] = totalCatSelections > 0 ? totalCatIssues / totalCatSelections : 0;
        });
        activeCategories.forEach(category => {
            const studentCatSelections = newStudent.categoryCounts[category.name] || 0;
            const issueRate = categoryIssueRates[category.name] || 0;
            newStudent.categoryIssues[category.name] = Math.round(studentCatSelections * issueRate);
        });


        // --- 4. Set the correct onboarding session ---
        const liveSession = classroom.liveSession;
        if (liveSession) {
            newStudent.onboardingSession = liveSession.sessionNumber;
        } else {
            newStudent.onboardingSession = classroom.sessions.length + 1;
        }

        // --- 5. Generate the updated onboarding note ---
        const pastSessions = getActiveItems(classroom.sessions).filter(s => s.isFinished && !s.isCancelled);
        const noteHeader = '📝 یادداشت خودکار سیستم';
        const sessionCount = pastSessions.length;
        const reason = `این دانش‌آموز  از جلسه شماره ${sessionCount} به کلاس اضافه شد. آمار مشارکت او بر اساس فعال‌ترین دانش‌آموز و آمار «فرصت از دست رفته» او بر اساس میانگین کلاس ثبت گردید:`;

        const details = [];
        if (newStudent.statusCounters.totalSelections > 0) {
            details.push(`کل انتخاب‌ها: ${newStudent.statusCounters.totalSelections}`);
        }
        if (newStudent.statusCounters.missedChances > 0) {
            details.push(`فرصت‌های از دست رفته: ${newStudent.statusCounters.missedChances}`);
        }
        for (const categoryName in newStudent.categoryCounts) {
            const count = newStudent.categoryCounts[categoryName];
            if (count > 0) {
                details.push(`انتخاب در «${categoryName}»: ${count}`);
            }
        }
        for (const categoryName in newStudent.categoryIssues) {
            const count = newStudent.categoryIssues[categoryName];
            if (count > 0) {
                details.push(`مشکل در «${categoryName}»: ${count}`);
            }
        }

        if (details.length > 0) {
            const noteContent = `${noteHeader}\n${reason}\n\n- ${details.join('\n- ')}`;
            newStudent.addNote(noteContent);
        }
    }

    // main.js - Update the function signature and body
    // main.js - Update this function (around line 1250)
    function showOnboardingNotification(addedCount, extraMessage = '') {
        const studentWord = addedCount > 1 ? 'دانش‌آموزان جدید' : 'دانش‌آموز جدید';

        // 1. Start with the success header
        let message = `✅ ${addedCount} ${studentWord} با موفقیت اضافه شدند.\n`;

        // 2. Add the onboarding explanation
        message += `💡 چون این کلاس جلسات برگزار شده دارد، برای این افراد آمار پایه‌ای (متناسب با کلاس) ثبت شد تا در فرایند انتخاب اختلالی ایجاد نشود.`;

        // 3. Append duplicate info if any
        if (extraMessage) {
            message += `\n${extraMessage}`;
        }

        ui.showCustomConfirm(
            message,
            () => { },
            {
                confirmText: 'متوجه شدم',
                confirmClass: 'btn-success',
                onCancel: null
            }
        );
    }

    // Display app version and build count
    const appVersion = import.meta.env.VITE_APP_VERSION;

    // Check if the build count exists (injected by Vite)
    const buildCount = typeof __APP_BUILD_COUNT__ !== 'undefined' ? __APP_BUILD_COUNT__ : '';

    if (appVersion) {
        const buildText = buildCount ? ` (ساخت ${buildCount})` : '';
        document.getElementById('app-version').textContent = `نسخه ${appVersion}${buildText}`;
    }

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

    // To make the function accessible from the console:
    window.backfillWritingScoresForAll = backfillWritingScoresForAll;

    // --- Temporary Backfill Function for 'Exit' Counters ---
    // This function can be called once from the console to add the new properties
    // for the 'Exit' feature to all existing data.
    function backfillExitCounters() {
        console.log("Starting backfill for 'outOfClassCount' and 'wasOutOfClass' properties...");
        let studentsUpdated = 0;
        let sessionRecordsUpdated = 0;

        // We bypass the state module to work directly with the raw stored data.
        const savedData = localStorage.getItem('teacherAssistantData_v2');
        if (!savedData) {
            console.log("No data found in localStorage. Nothing to do.");
            return;
        }

        const plainData = JSON.parse(savedData);

        for (const className in plainData) {
            const classroom = plainData[className];

            // 1. Update Students
            if (classroom.students) {
                classroom.students.forEach(student => {
                    if (student.statusCounters && typeof student.statusCounters.outOfClassCount === 'undefined') {
                        student.statusCounters.outOfClassCount = 0;
                        studentsUpdated++;
                    }
                });
            }

            // 2. Update Session Records
            if (classroom.sessions) {
                classroom.sessions.forEach(session => {
                    if (session.studentRecords) {
                        for (const studentId in session.studentRecords) {
                            const record = session.studentRecords[studentId];
                            if (typeof record.wasOutOfClass === 'undefined') {
                                record.wasOutOfClass = false;
                                sessionRecordsUpdated++;
                            }
                        }
                    }
                });
            }
        }

        // Save the modified data back to localStorage
        localStorage.setItem('teacherAssistantData_v2', JSON.stringify(plainData));

        console.log(`Backfill complete. Updated ${studentsUpdated} students and ${sessionRecordsUpdated} session records. Data saved.`);

        // Reload the application's state from the newly updated data
        state.loadData();
        // Re-render the UI if a classroom is currently active
        if (state.currentClassroom) {
            ui.renderStudentStatsList();
        }
    }

    // To make the function accessible from the console:
    window.backfillExitCounters = backfillExitCounters;

    // --- Utility function to clean up orphaned data with detailed logging ---
    function cleanupOrphanedData() {
        console.log("🧹 Starting orphaned data cleanup...");
        let totalOrphansFound = 0;

        for (const className in state.classrooms) {
            const classroom = state.classrooms[className];
            if (classroom.isDeleted) continue;

            let classroomWasAffected = false;

            // List of *good* student IDs
            const existingStudentIds = new Set(
                classroom.students.filter(s => !s.isDeleted).map(s => s.identity.studentId)
            );

            // --- NEW: Map of ALL student IDs (including deleted) to their names ---
            const studentIdToNameMap = new Map(
                classroom.students.map(s => [s.identity.studentId, s.identity.name])
            );

            const classLogs = [];

            classroom.sessions.forEach(session => {
                if (session.isDeleted) return;

                const sessionLogs = [];

                // 1. Clean session.studentRecords
                for (const studentId in session.studentRecords) {
                    if (!existingStudentIds.has(studentId)) {
                        // --- UPDATED LOG ---
                        const studentName = studentIdToNameMap.get(studentId) || "Unknown/Deleted";
                        sessionLogs.push(`  - Removed student record for: ${studentName} (ID: ${studentId})`);
                        delete session.studentRecords[studentId];
                        totalOrphansFound++;
                        classroomWasAffected = true;
                    }
                }

                // 2. Clean session.lastWinnerByCategory
                for (const categoryName in session.lastWinnerByCategory) {
                    const studentId = session.lastWinnerByCategory[categoryName];
                    if (!existingStudentIds.has(studentId)) {
                        // --- UPDATED LOG ---
                        const studentName = studentIdToNameMap.get(studentId) || "Unknown/Deleted";
                        sessionLogs.push(`  - Removed '${categoryName}' last winner: ${studentName} (ID: ${studentId})`);
                        delete session.lastWinnerByCategory[categoryName];
                        totalOrphansFound++;
                        classroomWasAffected = true;
                    }
                }

                // 3. Clean session.lastSelectedWinnerId
                if (session.lastSelectedWinnerId && !existingStudentIds.has(session.lastSelectedWinnerId)) {
                    // --- UPDATED LOG ---
                    const studentId = session.lastSelectedWinnerId;
                    const studentName = studentIdToNameMap.get(studentId) || "Unknown/Deleted";
                    sessionLogs.push(`  - Cleared 'lastSelectedWinnerId': ${studentName} (ID: ${studentId})`);
                    session.lastSelectedWinnerId = null;
                    totalOrphansFound++;
                    classroomWasAffected = true;
                }

                // If this session had logs, add them to the class log buffer
                if (sessionLogs.length > 0) {
                    const sessionMap = getSessionDisplayMap(classroom);
                    const displayNum = sessionMap.get(session.sessionNumber) || `(#${session.sessionNumber})`;
                    classLogs.push({ sessionDisplayNumber: displayNum, logs: sessionLogs });
                }
            });

            // Now, if the class was affected, print its buffered logs
            if (classroomWasAffected) {
                console.group(`➡️ Class: ${className}`); // Start a group for the class
                classLogs.forEach(sessionLog => {
                    // Start a *collapsed* group for each session
                    console.groupCollapsed(`  Session ${sessionLog.sessionDisplayNumber}`);
                    sessionLog.logs.forEach(log => console.warn(log)); // Use warn to make it stand out
                    console.groupEnd(); // End session group
                });
                console.groupEnd(); // End class group
            }
        }

        // Final Report
        if (totalOrphansFound > 0) {
            state.saveData();
            console.log(`✅ Cleanup complete! Found and removed ${totalOrphansFound} orphaned references. Data saved.`);
        } else {
            console.log("✅ No orphaned data found. Your data is clean!");
        }
    }

    // Make it accessible from the console
    window.cleanupOrphanedData = cleanupOrphanedData;

    // In src/main.js, replace the entire function
    function handleLogClick(action) {
        if (!action || !action.classroomName) return;

        const classroom = state.classrooms[action.classroomName];
        if (!classroom) {
            ui.showNotification('⚠️ کلاس مربوط به این گزارش یافت نشد.');
            return;
        }

        // Set the current class context before navigating
        state.setCurrentClassroom(classroom);

        ui.closeActiveModal();

        setTimeout(() => {
            switch (action.type) {
                case 'VIEW_STUDENT_PROFILE': {
                    const student = classroom.students.find(s => s.identity.studentId === action.studentId);
                    if (student) {
                        ui.showStudentProfile(student);
                    } else {
                        ui.showNotification('⚠️ دانش‌آموز مورد نظر یافت نشد.');
                    }
                    break;
                }
                case 'VIEW_TRASH':
                    ui.renderTrashPage();
                    ui.showPage('trash-page');
                    break;

                case 'VIEW_SESSIONS':
                    ui.renderSessions();
                    ui.showPage('session-page');
                    break;

                case 'VIEW_CLASS_NOTE':
                    ui.showClassNoteModal(classroom);
                    break;

                case 'VIEW_CLASS_SETTINGS':
                    ui.showSettingsPage(classroom);
                    break;
            }
        }, 300);
    }

    // --- NEW: Mass Comment Event Listeners ---
    massCommentBtn.addEventListener('click', () => {
        ui.showMassCommentModal();
    });

    massCommentCancelBtn.addEventListener('click', () => {
        ui.closeActiveModal();
    });

    massCommentSaveBtn.addEventListener('click', () => {
        const commentText = massCommentContent.value.trim();
        const append = massCommentAppendCheckbox.checked;

        if (!commentText) {
            // Confirmation for clearing existing comments
            if (ui.massCommentAppendCheckbox.style.display === 'flex') {
                ui.showCustomConfirm(
                    'کادر یادداشت خالی است. آیا مطمئنید که می‌خواهید یادداشت‌های قبلی دانش‌آموزان انتخاب‌شده را پاک کنید؟',
                    () => {
                        ui.closeActiveModal();
                        ui.processMassHomeworkComment('', false); // Pass empty text to clear
                    },
                    { confirmText: 'پاک کردن', confirmClass: 'btn-warning' }
                );
            } else {
                ui.showNotification('⚠️ لطفاً متن یادداشت را وارد کنید.');
            }
            return;
        }

        // Execute the mass update logic
        ui.closeActiveModal(() => {
            ui.processMassHomeworkComment(commentText, append);
        });
    });

    // --- Screen Saver Logic (v3) ---
    const screenSaverOverlay = document.getElementById('screen-saver-overlay');

    let inactivityTimer;
    const INACTIVITY_TIMEOUT = 2 * 60 * 1000; // 2 minutes

    const eventTypes = ['mousemove', 'keypress', 'scroll', 'click', 'touchstart'];

    function showScreenSaver() {
        screenSaverOverlay.classList.add('visible');
    }

    function hideScreenSaver() {
        if (screenSaverOverlay.classList.contains('visible')) {
            screenSaverOverlay.classList.remove('visible');
        }
    }

    function resetInactivityTimer() {
        hideScreenSaver();
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(showScreenSaver, INACTIVITY_TIMEOUT);
    }

    function handleOverlayInteraction(e) {
        e.preventDefault();
        e.stopPropagation();
        setTimeout(resetInactivityTimer, 0);
    }

    function initializeScreenSaver() {
        resetInactivityTimer();
        eventTypes.forEach(event => window.addEventListener(event, resetInactivityTimer));
        screenSaverOverlay.addEventListener('click', handleOverlayInteraction);
        screenSaverOverlay.addEventListener('touchstart', handleOverlayInteraction);

        const appVersionForSaver = import.meta.env.VITE_APP_VERSION;
        if (appVersionForSaver) {
            const versionElement = document.getElementById('screen-saver-version');
            if (versionElement) {
                versionElement.textContent = `v${appVersionForSaver}`;
            }
        }
    }

    function deinitializeScreenSaver() {
        clearTimeout(inactivityTimer);
        hideScreenSaver();
        eventTypes.forEach(event => window.removeEventListener(event, resetInactivityTimer));
        screenSaverOverlay.removeEventListener('click', handleOverlayInteraction);
        screenSaverOverlay.removeEventListener('touchstart', handleOverlayInteraction);
    }

    // --- Initialize based on saved settings ---
    // --- App Settings Logic ---
    const appSettingsModal = document.getElementById('app-settings-modal');
    const appSettingsBtn = document.getElementById('app-settings-nav-btn');
    const closeSettingsBtn = document.getElementById('close-settings-btn');

    // Toggle Elements
    const soundToggle = document.getElementById('setting-sound-toggle');
    const vibrationToggle = document.getElementById('setting-vibration-toggle');
    const screensaverToggle = document.getElementById('setting-screensaver-toggle');

    // 1. Open Settings Modal
    if (appSettingsBtn) {
        appSettingsBtn.addEventListener('click', () => {
            closeSideNav();

            // Sync UI with current state
            soundToggle.checked = state.userSettings.isSoundEnabled;
            vibrationToggle.checked = state.userSettings.isVibrationEnabled;
            screensaverToggle.checked = state.userSettings.isScreenSaverEnabled;

            ui.openModal('app-settings-modal');
        });
    }

    // 2. Close Settings Modal
    if (closeSettingsBtn) {
        closeSettingsBtn.addEventListener('click', () => {
            ui.closeActiveModal();
        });
    }

    // 3. Handle Sound Toggle
    soundToggle.addEventListener('change', (e) => {
        state.setUserSettings({ isSoundEnabled: e.target.checked });
        // Optional: Play a test sound so user knows it's on
        if (e.target.checked) {
            playSuccessSound();
        }
    });

    // 4. Handle Vibration Toggle
    vibrationToggle.addEventListener('change', (e) => {
        state.setUserSettings({ isVibrationEnabled: e.target.checked });
        // Optional: Trigger a test vibration
        if (e.target.checked && navigator.vibrate) {
            navigator.vibrate(50);
        }
    });

    // 5. Handle Screen Saver Toggle (Moved from Side Nav)
    // Initialize state on load
    if (state.userSettings.isScreenSaverEnabled) {
        initializeScreenSaver();
    }

    screensaverToggle.addEventListener('change', (e) => {
        if (e.target.checked) {
            // Enable
            state.setUserSettings({ isScreenSaverEnabled: true });
            initializeScreenSaver();
        } else {
            // Disable
            state.setUserSettings({ isScreenSaverEnabled: false });
            deinitializeScreenSaver();
        }
    });

    ui.setupLongPress(ui.selectStudentBtn, () => {

        selectBtnLongPressActive = true;

        if (!state.selectedCategory) {
            ui.showNotification("⚠️ ابتدا یک دسته‌بندی انتخاب کنید.");
            return;
        }

        if (!state.selectedCategory.isGradedCategory) {
            ui.showNotification("⚠️ این دسته‌بندی نمره‌دار نیست.");
            return;
        }

        setIsAssessmentModeActive(!isAssessmentModeActive);

        state.setWinnerHistoryIndex(-1);
        state.setManualSelection(null);
        ui.displayWinner();
        ui.updateQuickGradeUIForCategory(state.selectedCategory);

        ui.selectStudentBtnWrapper.classList.toggle('assessment-mode-active', isAssessmentModeActive);

        const msg = isAssessmentModeActive ? "حالت انتخاب برای نمره‌دهی فعال شد." : "حالت انتخاب معمولی فعال شد.";
        ui.showNotification(msg);
    });





    openAddCategoryBtn.addEventListener('click', () => {
        state.setSaveCategoryCallback((name, isGraded, weight) => {
            if (!name) return;
            if (state.currentClassroom.categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
                ui.showNotification('⚠️ این دسته‌بندی قبلاً اضافه شده است.');
                return;
            }
            state.currentClassroom.categories.push(new Category(name, '', isGraded, weight));
            state.saveData();
            ui.renderSettingsCategories();
        });
        ui.openAddCategoryModal();
    });

    // Sync weight visibility in the category modal
    if (newCategoryModalIsGradedCheckbox) {
        newCategoryModalIsGradedCheckbox.addEventListener('change', ui.syncWeightGroupVisibility);
    }

});

export function handleUndoLastSelection(student, categoryName) {

    // 1. Check if we are in a valid state
    if (!state.selectedSession || state.selectedSession.isFinished) {
        ui.showNotification("⚠️ امکان لغو انتخاب در جلسه خاتمه یافته وجود ندارد.");
        return;
    }

    // --- Assessment Mode Undo Logic ---
    if (isAssessmentModeActive) {
        ui.showCustomConfirm(`آیا از لغو وضعیت نمره‌دهی «${student.identity.name}» مطمئن هستید؟ این دانش‌آموز به لیست انتظار بازمی‌گردد.`, () => {
            const categoryId = state.selectedCategory.id;
            const poolData = state.assessmentPools[categoryId];

            if (poolData) {
                // Simply remove them from this list; refreshAssessmentPool will naturally 
                // include them again on the next click because their score didn't increase.
                poolData.scoredThisSession = poolData.scoredThisSession.filter(id => id !== student.identity.studentId);
            }

            // 3. Reset UI state
            state.setManualSelection(null);
            ui.renderStudentStatsList();
            ui.displayWinner(); // Clears the display because there is no history entry to show.

            state.saveData();
            ui.showNotification(`✅ «${student.identity.name}» به لیست انتظار نمره بازگشت.`);
        });
        return; // Stop here so we don't run the standard history undo logic.
    }

    // 2. Check if we are viewing the MOST RECENT winner.
    // We use winnerHistoryIndex to know if the user is browsing past winners.
    const history = state.selectedSession.winnerHistory;
    const isLastWinner = state.winnerHistoryIndex === history.length - 1;

    if (!isLastWinner || history.length === 0) {
        ui.showNotification("⚠️ فقط آخرین انتخاب قابل لغو است.");
        return;
    }

    // 3. Final check to be extra sure the student matches
    if (history[history.length - 1].winner.identity.studentId !== student.identity.studentId) {
        console.error("Undo mismatch!"); // Safety check for us
        return;
    }

    // --- Confirmation ---
    ui.showCustomConfirm(
        `آیا از حذف انتخاب «${student.identity.name}» برای «${categoryName}» مطمئن هستید؟ آمار این انتخاب بازگردانی خواهد شد.`,
        () => {
            const history = state.selectedSession.winnerHistory;

            // 1. Pop the last winner off the history stack
            const undoneEntry = history.pop();
            if (!undoneEntry) return; // Should never happen, but good to check

            const student = undoneEntry.winner;
            const categoryName = undoneEntry.categoryName;
            const studentId = student.identity.studentId;

            // 2. Decrement student's global stats
            student.statusCounters.totalSelections = Math.max(0, student.statusCounters.totalSelections - 1);
            if (student.categoryCounts[categoryName]) {
                student.categoryCounts[categoryName] = Math.max(0, student.categoryCounts[categoryName] - 1);
            }

            // 3. Decrement session-specific stats
            const record = state.selectedSession.studentRecords[studentId];
            if (record && record.selections[categoryName]) {
                record.selections[categoryName] = Math.max(0, record.selections[categoryName] - 1);
            }

            // --- Revert Qualitative Stats (History Based) ---
            if (undoneEntry.rating) {
                const ratingToRemove = undoneEntry.rating;

                // Decrement global counter
                if (student.qualitativeStats &&
                    student.qualitativeStats[categoryName] &&
                    student.qualitativeStats[categoryName][ratingToRemove] > 0) {
                    student.qualitativeStats[categoryName][ratingToRemove]--;
                }
            }
            // -----------------------------------------------------

            // 4. Find the *new* last winner for this category
            let newLastWinnerId = null;
            // We iterate backward through the *remaining* history
            for (let i = history.length - 1; i >= 0; i--) {
                if (history[i].categoryName === categoryName) {
                    newLastWinnerId = history[i].winner.identity.studentId;
                    break; // Found it
                }
            }

            if (newLastWinnerId) {
                state.selectedSession.lastWinnerByCategory[categoryName] = newLastWinnerId;
            } else {
                // No one else was selected for this category in the history
                delete state.selectedSession.lastWinnerByCategory[categoryName];
            }

            // --- Step 6: Refresh UI ---

            // 5. Update the history index to point to the new last item
            state.setWinnerHistoryIndex(history.length - 1);

            // 6. Re-render the stats table and winner display
            ui.renderStudentStatsList();
            ui.displayWinner(); // This will now show the new last winner (or nothing if history is empty)

            // 7. Save and notify
            state.saveData();
            ui.showNotification(`✅ انتخاب «${student.identity.name}» لغو شد.`);
        },
        { confirmText: 'بله', confirmClass: 'btn-warning' }
    );
}

function setupSwipeNavigation() {
    const dashboardPage = document.getElementById('session-dashboard-page');
    const tableContainer = document.getElementById('student-stats-table-container');
    if (!dashboardPage) return;

    let touchStartX = 0;
    let touchEndX = 0;

    dashboardPage.addEventListener('touchstart', (event) => {
        // Check if the touch is inside the table container at all
        if (tableContainer && tableContainer.contains(event.target)) {

            // Find the specific cell (td or th) that was touched
            const touchedCell = event.target.closest('td, th');

            // Check if a cell was touched AND if it's the first child (the sticky 'Name' column)
            if (touchedCell && touchedCell.parentElement.firstElementChild === touchedCell) {
                // It's the 'Name' column. Treat as a TAB-SWITCH.
                touchStartX = event.changedTouches[0].screenX;
            } else {
                // It's any OTHER column or the scrollbar area. Treat as a SCROLL.
                touchStartX = 0; // Signal to ignore this swipe for tab switching
            }
        } else {
            // Touch was outside the table. Treat as a TAB-SWITCH.
            touchStartX = event.changedTouches[0].screenX;
        }
    }, { passive: true });

    dashboardPage.addEventListener('touchend', (event) => {
        if (touchStartX === 0) return; // Do nothing if it was flagged as a scroll

        touchEndX = event.changedTouches[0].screenX;
        handleSwipe();
    });

    function handleSwipe() {
        const minSwipeDistance = 150; // Minimum pixels for a valid swipe
        const swipeDistance = touchStartX - touchEndX;
        const absoluteSwipeDistance = Math.abs(swipeDistance);

        // 1. Check if a valid horizontal swipe occurred
        if (absoluteSwipeDistance > minSwipeDistance) {

            // 2. Check which tab is currently active
            const selectorTabBtn = document.getElementById('selector-tab-btn');
            const isSelectorTabActive = selectorTabBtn.classList.contains('active');

            // 3. Toggle to the *other* tab
            if (isSelectorTabActive) {
                // If Selector is active, switch to Attendance
                ui.showPage('session-dashboard-page', { tab: 'attendance' });
                switchDashboardTab('attendance');
            } else {
                // Otherwise (Attendance must be active), switch to Selector
                ui.showPage('session-dashboard-page', { tab: 'selector' });
                switchDashboardTab('selector');
            }
        }

        // Reset for the next touch
        touchStartX = 0;
        touchEndX = 0;
    }
}

// Calculates total scores for a student in a specific category across all history
function getTotalScoresForCategory(student, categoryName) {
    const skillKey = categoryName.toLowerCase();
    const scores = student.logs.scores[skillKey] || [];
    return scores.filter(s => !s.isDeleted).length;
}

// Generates or refreshes the toBeScored pool based on minimum score counts
function refreshAssessmentPool(classroom, category) {
    const categoryId = category.id;
    // 1. Initialize state object if missing
    if (!state.assessmentPools[categoryId]) {
        state.assessmentPools[categoryId] = { toBeScored: [], scoredThisSession: [] };
    }

    const poolData = state.assessmentPools[categoryId];
    const activeStudents = state.getActiveItems(classroom.students);

    // 2. Filter students not yet scored this session
    const eligibleStudents = activeStudents.filter(s => !poolData.scoredThisSession.includes(s.identity.studentId));

    if (eligibleStudents.length === 0) {
        poolData.toBeScored = [];
        return [];
    }

    // 3. Find candidates with the minimum score count
    const scoreCounts = eligibleStudents.map(s => getTotalScoresForCategory(s, category.name));
    const minScores = Math.min(...scoreCounts);

    // 4. Update the state property so you can see it in the console
    poolData.toBeScored = eligibleStudents
        .filter(s => getTotalScoresForCategory(s, category.name) === minScores)
        .map(s => s.identity.studentId);

    return poolData.toBeScored;
}

export function pickAssessmentWinner(classroom, category) {
    // 1. Always refresh the pool to get the latest min-score candidates
    const pool = refreshAssessmentPool(classroom, category);

    if (pool.length === 0) {
        return null;
    }

    // 2. Random selection from the fresh pool
    const randomIndex = Math.floor(Math.random() * pool.length);
    const winnerId = pool[randomIndex];

    // 3. Mark as scored for this session
    state.markStudentAsScoredInSession(category.id, winnerId);

    return classroom.students.find(s => s.identity.studentId === winnerId);
}