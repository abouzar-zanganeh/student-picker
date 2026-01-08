/* ==========================================================================
   notifyingMessaging.js introduction
   --------------------------------------------------------------------------
   This JS file manages notification and user alerting logic
   ========================================================================== */


import * as state from "./state";
import { undoMessage, undoToast } from "./ui";


export function showUndoToast(message) {

    clearTimeout(state.undoTimeout);

    if (!state.previousState) {
        state.setPreviousState(JSON.stringify(state.classrooms));
    }

    undoMessage.textContent = message;
    undoToast.classList.add('show');

    state.setUndoTimeout(setTimeout(() => {
        undoToast.classList.remove('show');
        state.setPreviousState(null);
    }, 5000));
}
