import { navigateUpHierarchy } from "./main";
import * as state from "./state";
import * as ui from "./ui";


export function keyDownShortcuts(selectStudentBtn, attendancePage) {
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
        // --- Global 'Escape' key handler ---
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
            // We use 'false' because this is a manual UI action, not a browser back event
            navigateUpHierarchy(false);

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
}
