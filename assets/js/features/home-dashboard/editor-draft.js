/* Home dashboard editor stub — customize mode removed; keep stopHomeEditor for defensive shell calls. */
    stopHomeEditor = function ({ message = '', refresh = true } = {}) {
        if (typeof HOME_EDITOR_STATE === 'object' && HOME_EDITOR_STATE) {
            HOME_EDITOR_STATE.editing = false;
            HOME_EDITOR_STATE.role = '';
            HOME_EDITOR_STATE.draftLayout = null;
            HOME_EDITOR_STATE.draftCustomShortcuts = [];
            HOME_EDITOR_STATE.dragState = null;
            HOME_EDITOR_STATE.selectedWidgetId = '';
        }
        if (message && typeof showToast === 'function') showToast(message);
        if (refresh && typeof renderHomeShell === 'function') renderHomeShell();
    };
