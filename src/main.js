import * as state from './state.js';
import * as demo from './demo.js';
import * as ui from './ui.js';
import * as logManager from './logManager.js';
import * as utils from './utils.js';
import * as db from './db.js';

import {
    resetAllStudentCounters, getActiveItems, permanentlyDeleteStudent,
    getSessionDisplayMap, isAssessmentModeActive, setIsAssessmentModeActive, setIsDemoMode
} from './state.js';


import {
    renderRestorePointsPage, newCategoryModalIsGradedCheckbox,
    quickGradeSubmitBtn, quickScoreInput, quickNoteTextarea
} from './ui.js';


import { Classroom, Student, Category } from './models.js';
import {
    normalizeText, normalizeKeyboard, parseStudentName, playSuccessSound,
    setupKeyboardShortcut, hideKeyboard, setupAutoSelectOnFocus, flashElement, scrollToElement,
    setupSwipeNavigation
} from './utils.js';
import { exposeToConsole } from './developer.js';
import { keyDownShortcuts } from './keyboard.js';
import { testClassHook } from './testclass.js';

import { prepareDemoModeButtons } from './demo.js';
import { prepareBackupBtn, prepareRestoreBtn, restoreButtonMainFunction } from './backup.js';
import {
    initializeScreenSaver,
    deinitializeScreenSaver, prepareScreenSaverToggle
} from './screensaver.js';


let selectBtnLongPressActive = false;

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

// Navigates and renders without adding a new entry to the browser history
function navigateSilently(pageId) {
    // 1. Perform state cleanup ONLY when going to the root page
    if (pageId === 'class-management-page') {
        state.setCurrentClassroom(null);
        state.setSelectedSession(null);

        // This "cleans" the current history entry so 'Back' won't 
        // find old class parameters in this slot.
        history.replaceState({ pageId }, '', '#class-management-page');
        ui._internalShowPage(pageId);
        return; // Exit early
    }
    // When going to the session list, only clear the selected session
    else if (pageId === 'session-page') {
        state.setSelectedSession(null);
        // Ensure UI is refreshed for the classroom we are still in
        if (state.currentClassroom) {
            ui.renderSessions();
        }
    }

    // 2. Update the URL to match the parent without pushing a new history item
    const params = new URLSearchParams();
    if (state.currentClassroom) params.set('class', state.currentClassroom.info.name);
    if (state.selectedSession) params.set('session', state.selectedSession.sessionNumber);

    const newHash = `#${pageId}${params.toString() ? '?' + params.toString() : ''}`;

    // This is the magic line: it updates the address bar but stays on the same history "slot"
    history.replaceState({ pageId }, '', newHash);

    // 3. Render the UI
    ui._internalShowPage(pageId);
}

// Centralized function to navigate one level up the hierarchy
export function navigateUpHierarchy(isSilent = false) {
    if (state.activeModal) {
        ui.closeActiveModal();
        return;
    }

    const activePage = document.querySelector('.page.active');
    if (!activePage) return;

    const parentPageId = NAVIGATION_HIERARCHY[activePage.id];

    if (parentPageId) {
        if (isSilent) {
            navigateSilently(parentPageId);
        } else {
            ui.showPage(parentPageId);
        }
    }
}

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
    } = ui;
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
            flashElement(newCategoryModalNameInput, 3000);
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
        ui.renderStudentStatsList();
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

    testClassHook(classListHeader);


    // --- Developer Mode Activation ---
    // This developer mode will expose internal modules to the global 'dev' object after 10 clicks on the header.
    exposeToConsole();

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
            ui.showNotification("⚠️لطفاً ابتدا با دکمه «ثبت»، تغییرات را ذخیره کنید و یا نمره و یادداشت را پاک کنید.", 4200);

            flashElement(ui.quickScoreInput);
            flashElement(ui.quickNoteTextarea);

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
            flashElement(pasteArea, 3000);
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
            flashElement(newStudentNameInput, 3000);
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
                ui.showNotification(`⚠️ جلسه ${unfinishedSession.sessionNumber} هنوز تمام نشده است. لطفاً ابتدا با دکمه «پایان جلسه» آن را خاتمه دهید.`, 4500);
                const endSessionBtn = document.querySelector('#session-list > li:nth-child(1) > div.list-item-buttons > button.btn-success');
                if (endSessionBtn) {
                    flashElement(endSessionBtn);
                }
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
                flashElement(nameInput, 3000);
                ui.showNotification('لطفاً نام کلاس را وارد کنید.');
                return;
            }
            if (state.classrooms[name]) {
                flashElement(nameInput, 3000);
                ui.showNotification('کلاسی با این نام قبلاً ایجاد شده است.');
                return;
            }

            try {
                // --- Read & validate class name ---
                const newClassName = ui.modalNewClassNameInput.value.trim();
                if (!newClassName) {
                    ui.showNotification('⚠️ لطفاً نام کلاس را وارد کنید.');
                    return;
                }
                if (state.classrooms[newClassName]) {
                    ui.showNotification('⚠️ کلاسی با این نام وجود دارد.');
                    return;
                }

                // --- Read class type ---
                const typeRadio = document.querySelector('input[name="modal-class-type"]:checked');
                if (!typeRadio) {
                    console.error('Class type radio not selected');
                    return;
                }
                const classType = typeRadio.value;

                // --- Read educational info ---
                const eduSystem = ui.modalAddClassSystemSelect.value;
                const level = ui.modalAddClassLevelSelect.value || null;

                // --- Read schedule info ---
                const scheduleText = ui.modalScheduleTextInput.value.trim() || null;
                const scheduleDays = Array.from(
                    ui.modalScheduleDaysContainer.querySelectorAll('input:checked')
                ).map(cb => parseInt(cb.value, 10));

                const scheduleStartTime = ui.modalScheduleStartTimeInput.value || null;
                const scheduleEndTime = ui.modalScheduleEndTimeInput.value || null;

                // --- Create classroom ---
                const newClassroom = new Classroom({
                    name: newClassName,
                    type: classType,
                    educationalSystem: eduSystem,
                    level,
                    scheduleText,
                    scheduleDays,
                    scheduleStartTime,
                    scheduleEndTime
                });

                // --- Persist state (ONCE) ---
                state.classrooms[newClassName] = newClassroom;
                state.saveData();

                // --- Update UI (ONCE) ---
                ui.renderClassList();
                ui.closeAddClassModal();
                ui.showNotification(`✅ کلاس «${newClassName}» ایجاد شد.`);

            } catch (error) {
                console.error('CRASH ERROR:', error);
                ui.showNotification('خطایی رخ داد: ' + error.message);
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

    quickGradeSubmitBtn.addEventListener('click', () => {
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

    setupKeyboardShortcut(quickScoreInput, 'Enter', () => {
        hideKeyboard(quickScoreInput);
        quickGradeSubmitBtn.click();
    });

    setupAutoSelectOnFocus(quickScoreInput);

    setupKeyboardShortcut(quickNoteTextarea, 'Enter', () => {
        hideKeyboard(quickNoteTextarea);
        quickGradeSubmitBtn.click();
    });

    cancelNoteBtn.addEventListener('click', () => {
        ui.closeActiveModal();
    });

    classSaveNoteBtn.addEventListener('click', () => {
        const content = newNoteContent.value.trim();
        const callback = state.saveNoteCallback;

        if (typeof callback === 'function') {
            // execute the callback first
            const result = callback(content);



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


    prepareDemoModeButtons();

    prepareBackupBtn(backupDataBtn);

    prepareRestoreBtn(restoreDataBtn, restoreFileInput);

    restoreButtonMainFunction(restoreFileInput);

    window.addEventListener('popstate', (event) => {
        // If a modal is open OR we just closed one manually
        if (state.activeModal || state.isModalTransitioning) {
            ui.closeActiveModal(null, true);
            state.setIsModalTransitioning(false); // Reset the flag
            return;
        }

        ui.closeContextMenu();

        // Pass 'true' to ensure we don't create new history entries
        navigateUpHierarchy(true);
    });


    // All keyboard shortcust will be defined here
    keyDownShortcuts(selectStudentBtn, attendancePage);





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

    function showOnboardingNotification(addedCount, extraMessage = '') {
        const studentWord = addedCount > 1 ? 'دانش‌آموزان جدید' : 'دانش‌آموز جدید';

        // success header
        let message = `✅ ${addedCount} ${studentWord} با موفقیت اضافه شدند.\n`;

        // onboarding explanation
        message += `💡 چون این کلاس جلسات برگزار شده دارد، برای این افراد آمار پایه‌ای (متناسب با کلاس) ثبت شد تا در فرایند انتخاب اختلالی ایجاد نشود.`;

        // Appending duplicate info if any
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

    // Displaying app version and build count
    const appVersion = import.meta.env.VITE_APP_VERSION;

    // Checking if the build count exists (injected by Vite)
    const buildCount = typeof __APP_BUILD_COUNT__ !== 'undefined' ? __APP_BUILD_COUNT__ : '';

    if (appVersion) {
        const buildText = buildCount ? ` (ساخت ${buildCount})` : '';
        document.getElementById('app-version').textContent = `نسخه ${appVersion}${buildText}`;
    }

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

    // --- Mass Comment Event Listeners ---
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



    // --- Initialize based on saved settings ---
    // --- App Settings Logic ---
    const appSettingsModal = document.getElementById('app-settings-modal');
    const appSettingsBtn = document.getElementById('app-settings-nav-btn');
    const closeSettingsBtn = document.getElementById('close-settings-btn');

    // Toggle Elements
    const soundToggle = document.getElementById('setting-sound-toggle');
    const vibrationToggle = document.getElementById('setting-vibration-toggle');
    const screensaverToggle = document.getElementById('setting-screensaver-toggle');

    //screensaver toggle
    // Initial state
    if (state.userSettings.isScreenSaverEnabled) {
        initializeScreenSaver();
    }

    // Toggle handling
    prepareScreenSaverToggle(
        screensaverToggle,
        initializeScreenSaver,
        deinitializeScreenSaver
    );


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



export function closeSideNav() {
    ui.sideNavMenu.style.width = '0';
    ui.overlay.classList.add('modal-closing'); // Use the modal's closing class

    setTimeout(() => {
        // This removes all classes after the animation finishes
        overlay.classList.remove('modal-visible', 'modal-closing');
    }, 300); // This duration must match your CSS animation time
}

exposeToConsole();

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