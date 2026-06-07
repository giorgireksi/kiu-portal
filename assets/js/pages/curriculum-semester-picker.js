/* Scroll-snap semester picker for admin-tools curriculum subject builder. */
(function curriculumSemesterPickerModule() {
    'use strict';

    const MAX_SEMESTER = typeof window.MAX_SEMESTER_DROPDOWN === 'number' ? window.MAX_SEMESTER_DROPDOWN : 12;
    let customSemesters = [];
    let panelCloseBound = false;
    let addSemestersMode = false;

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function normalizeList(value) {
        if (typeof window.setBuilderSubjectSemesters === 'function') {
            return window.setBuilderSubjectSemesters(value);
        }
        const source = Array.isArray(value) ? value : [value];
        return [...new Set(source
            .map((entry) => parseInt(String(entry || '').trim(), 10))
            .filter((entry) => Number.isFinite(entry) && entry > 0))]
            .sort((left, right) => left - right);
    }

    function readSelection() {
        if (typeof window.getBuilderSubjectSemesters === 'function') {
            return window.getBuilderSubjectSemesters();
        }
        const hidden = document.getElementById('new-subject-semesters');
        if (!hidden) return [1];
        try {
            return normalizeList(JSON.parse(hidden.value || '[1]'));
        } catch (error) {
            return [1];
        }
    }

    function writeSelection(semesters) {
        const resolved = normalizeList(semesters);
        const hidden = document.getElementById('new-subject-semesters');
        if (hidden) {
            hidden.value = JSON.stringify(resolved);
            hidden.dispatchEvent(new Event('change', { bubbles: true }));
        }
        if (typeof window.setBuilderSubjectSemesters === 'function') {
            window.setBuilderSubjectSemesters(resolved);
        }
        return resolved;
    }

    function formatButtonLabel(semesters) {
        if (typeof window.formatSubjectSemestersLabel === 'function') {
            return window.formatSubjectSemestersLabel(semesters);
        }
        const list = normalizeList(semesters);
        if (list.length === 1) return `Semester ${list[0]}`;
        return `Semesters ${list.join(', ')}`;
    }

    function getPickerCaption() {
        return addSemestersMode ? 'Add to selection' : 'Select semester';
    }

    function getModeHintText() {
        return addSemestersMode
            ? 'Multiple semesters — each selection is added to the subject.'
            : 'One semester — each selection replaces the current choice.';
    }

    function getScrollOptions() {
        const options = [];
        for (let semester = 1; semester <= MAX_SEMESTER; semester += 1) {
            options.push(semester);
        }
        customSemesters.forEach((semester) => {
            if (semester > MAX_SEMESTER && !options.includes(semester)) {
                options.push(semester);
            }
        });
        return options.sort((left, right) => left - right);
    }

    function promptCustomSemester() {
        const entered = prompt('Enter a semester number:', String(MAX_SEMESTER + 1));
        const parsed = parseInt(String(entered || '').trim(), 10);
        if (!Number.isFinite(parsed) || parsed < 1) return null;
        if (parsed > MAX_SEMESTER && !customSemesters.includes(parsed)) {
            customSemesters.push(parsed);
            customSemesters.sort((left, right) => left - right);
        }
        return parsed;
    }

    function renderScrollList(listNode, selection) {
        if (!listNode) return;
        const selectedSet = new Set(selection);
        listNode.innerHTML = getScrollOptions().map((semester) => {
            const active = selectedSet.has(semester);
            return `
                <button type="button" class="lux-semester-scroll-option${active ? ' is-selected' : ''}" data-semester-value="${semester}" role="option" aria-selected="${active ? 'true' : 'false'}">
                    <span class="lux-semester-scroll-option__label">Semester ${semester}</span>
                    ${active ? '<span class="lux-semester-scroll-option__mark"><i class="fas fa-check"></i></span>' : ''}
                </button>
            `;
        }).join('') + `
            <button type="button" class="lux-semester-scroll-option lux-semester-scroll-option--custom" data-semester-custom="1" role="option">
                <span class="lux-semester-scroll-option__label">Custom semester…</span>
                <span class="lux-semester-scroll-option__mark"><i class="fas fa-plus"></i></span>
            </button>
        `;
    }

    function renderChipTray(trayNode, selection) {
        if (!trayNode) return;
        const semesters = normalizeList(selection);
        if (!semesters.length) {
            trayNode.innerHTML = '<span class="lux-semester-chip-tray__empty">No semesters selected</span>';
            return;
        }
        trayNode.innerHTML = semesters.map((semester) => `
            <button type="button" class="lux-semester-chip" data-semester-chip-remove="${semester}">
                <span>S${escapeHtml(String(semester))}</span>
                <i class="fas fa-times" aria-hidden="true"></i>
            </button>
        `).join('');
    }

    function syncModeSegmentUi(config = {}) {
        const segmentRoot = document.querySelector(config.segmentSelector || '.lux-semester-mode-segment');
        const hintNode = document.getElementById(config.modeHintId || 'new-subject-semester-mode-hint');
        const pickerButton = document.getElementById(config.buttonId || 'new-subject-semester-lux-btn');
        const captionNode = pickerButton?.querySelector('.lux-picker-caption');
        if (segmentRoot) {
            segmentRoot.querySelectorAll('[data-semester-mode]').forEach((button) => {
                const isAdd = button.dataset.semesterMode === 'add';
                const active = isAdd === addSemestersMode;
                button.classList.toggle('is-active', active);
                button.setAttribute('aria-pressed', active ? 'true' : 'false');
            });
        }
        if (hintNode) hintNode.textContent = getModeHintText();
        if (captionNode) captionNode.textContent = getPickerCaption();
    }

    function syncUi(config = {}) {
        const button = document.getElementById(config.buttonId || 'new-subject-semester-lux-btn');
        const valueNode = document.getElementById('new-subject-semester-lux-value') || button?.querySelector('.lux-picker-value');
        const listNode = document.getElementById(config.listId || 'new-subject-semester-scroll-list');
        const trayNode = document.getElementById(config.trayId || 'new-subject-semesters-tray');
        const selection = readSelection();
        if (valueNode) valueNode.textContent = formatButtonLabel(selection);
        renderScrollList(listNode, selection);
        renderChipTray(trayNode, selection);
        syncModeSegmentUi(config);
        if (typeof config.onChange === 'function') config.onChange(selection);
    }

    function removeSemester(semester, config) {
        const selection = readSelection();
        const set = new Set(selection);
        if (!set.has(semester) || set.size <= 1) return;
        set.delete(semester);
        writeSelection([...set]);
        syncUi(config);
    }

    function applySemesterSelection(semester, config) {
        if (!addSemestersMode) {
            const selection = readSelection();
            if (selection.length === 1 && selection[0] === semester) return;
            writeSelection([semester]);
            syncUi(config);
            return;
        }

        const selection = readSelection();
        const set = new Set(selection);
        if (set.has(semester)) {
            if (set.size <= 1) return;
            set.delete(semester);
        } else {
            set.add(semester);
        }
        writeSelection([...set]);
        syncUi(config);
    }

    function applyCustomSemester(custom, config) {
        if (!custom) return;
        if (!addSemestersMode) {
            writeSelection([custom]);
            syncUi(config);
            return;
        }
        const selection = new Set(readSelection());
        selection.add(custom);
        writeSelection([...selection]);
        syncUi(config);
    }

    function setAddSemestersMode(enabled, config = {}) {
        addSemestersMode = Boolean(enabled);
        syncUi(config);
    }

    function closePanel(panel, button) {
        if (!panel) return;
        panel.classList.remove('is-open');
        panel.setAttribute('aria-hidden', 'true');
        panel.hidden = true;
        if (button) button.setAttribute('aria-expanded', 'false');
    }

    function openPanel(panel, button) {
        if (!panel) return;
        panel.classList.add('is-open');
        panel.setAttribute('aria-hidden', 'false');
        panel.hidden = false;
        if (button) button.setAttribute('aria-expanded', 'true');
        const active = panel.querySelector('.lux-semester-scroll-option.is-selected');
        if (active) active.scrollIntoView({ block: 'center' });
    }

    function bindPanelDismiss(panel, button) {
        if (panelCloseBound) return;
        document.addEventListener('click', (event) => {
            const field = document.getElementById('new-subject-semester-picker');
            if (!field || !panel?.classList.contains('is-open')) return;
            if (field.contains(event.target)) return;
            closePanel(panel, button);
        });
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') closePanel(panel, button);
        });
        panelCloseBound = true;
    }

    function initCurriculumSemesterPicker(config = {}) {
        const button = document.getElementById(config.buttonId || 'new-subject-semester-lux-btn');
        const panel = document.getElementById(config.panelId || 'new-subject-semester-lux-panel');
        const listNode = document.getElementById(config.listId || 'new-subject-semester-scroll-list');
        const trayNode = document.getElementById(config.trayId || 'new-subject-semesters-tray');
        const hidden = document.getElementById(config.hiddenId || 'new-subject-semesters');
        const segmentRoot = document.querySelector(config.segmentSelector || '.lux-semester-mode-segment');
        if (!button || !panel || !listNode || !trayNode || !hidden) return false;
        if (button.dataset.curriculumSemesterPickerBound === '1') {
            syncUi(config);
            return true;
        }

        if (!hidden.value) hidden.value = '[1]';

        if (segmentRoot && segmentRoot.dataset.curriculumSemesterModeBound !== '1') {
            segmentRoot.querySelectorAll('[data-semester-mode]').forEach((segmentButton) => {
                segmentButton.addEventListener('click', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setAddSemestersMode(segmentButton.dataset.semesterMode === 'add', config);
                });
            });
            segmentRoot.dataset.curriculumSemesterModeBound = '1';
        }

        button.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (panel.classList.contains('is-open')) {
                closePanel(panel, button);
            } else {
                if (typeof closePickerPanels === 'function') closePickerPanels();
                openPanel(panel, button);
                syncUi(config);
            }
        });

        listNode.addEventListener('click', (event) => {
            const customTrigger = event.target.closest('[data-semester-custom]');
            if (customTrigger) {
                applyCustomSemester(promptCustomSemester(), config);
                return;
            }
            const option = event.target.closest('[data-semester-value]');
            if (!option) return;
            const semester = parseInt(option.dataset.semesterValue || '', 10);
            if (!Number.isFinite(semester)) return;
            applySemesterSelection(semester, config);
        });

        trayNode.addEventListener('click', (event) => {
            const chip = event.target.closest('[data-semester-chip-remove]');
            if (!chip) return;
            const semester = parseInt(chip.dataset.semesterChipRemove || '', 10);
            if (!Number.isFinite(semester)) return;
            removeSemester(semester, config);
        });

        bindPanelDismiss(panel, button);
        button.dataset.curriculumSemesterPickerBound = '1';
        syncUi(config);
        return true;
    }

    window.initCurriculumSemesterPicker = initCurriculumSemesterPicker;
    window.syncCurriculumSemesterPickerUi = function syncCurriculumSemesterPickerUi(config) {
        syncUi(config || {});
    };
    window.setCurriculumSemesterAddMode = setAddSemestersMode;
})();