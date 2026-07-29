/* Mobility tab UI peeled from students-command-center.js. Load before host. */
(function () {
    if (window.__KIU_STUDENTS_COMMAND_MOBILITY_LOADED) return;
    window.__KIU_STUDENTS_COMMAND_MOBILITY_LOADED = true;
    window.__kiuCreateStudentsCommandMobilityApi = function createKiuStudentsCommandMobilityApi(deps = {}) {
        const escapeHtml = deps.escapeHtml;
        const normalizeText = deps.normalizeText;
        const facultyName = deps.facultyName;
    function renderMobilityTab(record) {
        const mobility = record.mobility || { category: 'standard', agreementMetadata: {}, effectiveFrom: '', effectiveTo: '', history: [] };
        const categories = window.MOBILITY_CATEGORIES || [
            { value: 'standard', label: 'Standard enrollment' },
            { value: 'exchange_incoming', label: 'Exchange incoming' },
            { value: 'exchange_outgoing', label: 'Exchange outgoing' },
            { value: 'internal_transfer', label: 'Internal transfer' }
        ];
        const options = categories.map((item) => {
            const selected = mobility.category === item.value ? ' selected' : '';
            return `<option value="${escapeHtml(item.value)}"${selected}>${escapeHtml(item.label)}</option>`;
        }).join('');
        const agreementNotes = normalizeText(mobility.agreementMetadata?.notes || mobility.agreementMetadata?.partner || '', '');
        const facultyCodes = Object.keys(KIU_FACULTY_METADATA || KIU_STATE?.facultyProfiles || {});
        const sourceFaculty = mobility.sourceFaculty || record.curriculumPlan?.sourceFaculty || record.facultyCode || '';
        const targetFaculty = mobility.targetFaculty || record.curriculumPlan?.targetFaculty || '';
        const facultyOptions = (facultyCodes.length ? facultyCodes : ['CS', 'ECON', 'LAW', 'MED', 'ARTS']).map((code) => {
            const sourceSelected = sourceFaculty === code ? ' selected' : '';
            const targetSelected = targetFaculty === code ? ' selected' : '';
            return {
                source: `<option value="${escapeHtml(code)}"${sourceSelected}>${escapeHtml(facultyName(code))}</option>`,
                target: `<option value="${escapeHtml(code)}"${targetSelected}>${escapeHtml(facultyName(code))}</option>`
            };
        });
        const sourceOptions = facultyOptions.map((item) => item.source).join('');
        const targetOptions = facultyOptions.map((item) => item.target).join('');
        const transferSubjects = (record.curriculumPlan?.subjectIds || mobility.history?.at(-1)?.subjectIds || []).join('\n');
        const historyRows = (mobility.history || []).length ? mobility.history.map((entry) => `
            <article class="students-hub-list-item">
                <strong>${escapeHtml(facultyName(entry.from || entry.sourceFaculty || '—'))} → ${escapeHtml(facultyName(entry.to || entry.targetFaculty || '—'))}</strong>
                <small>${escapeHtml(entry.effectiveFrom || 'Unknown date')} · ${escapeHtml((entry.subjectIds || []).length ? `${entry.subjectIds.length} subjects` : 'No subjects listed')}</small>
            </article>
        `).join('') : '<article class="students-hub-list-item"><strong>No transfer history</strong><small>Internal transfers will appear here after execution.</small></article>';
        const isInternalTransfer = mobility.category === 'internal_transfer';
        return `
            <section class="students-hub-form-section lux-data-card home-hover-chip">
                <div class="students-hub-section-head">
                    <h3>Mobility & transfer</h3>
                    <p>Track exchange programs, internal transfers, and agreement metadata for this student.</p>
                </div>
                <div class="students-hub-form-grid">
                    <div class="students-hub-field is-full">
                        <label for="student-mobility-category">Category</label>
                        <select class="students-hub-control lux-control" id="student-mobility-category" data-student-mobility-field="category" data-lux-picker-label="Mobility category">
                            ${options}
                        </select>
                    </div>
                    <div class="students-hub-field">
                        <label for="student-mobility-from">Effective from</label>
                        <input class="students-hub-control lux-control" id="student-mobility-from" type="date" value="${escapeHtml(mobility.effectiveFrom || '')}" data-student-mobility-field="effectiveFrom">
                    </div>
                    <div class="students-hub-field">
                        <label for="student-mobility-to">Effective to</label>
                        <input class="students-hub-control lux-control" id="student-mobility-to" type="date" value="${escapeHtml(mobility.effectiveTo || '')}" data-student-mobility-field="effectiveTo">
                    </div>
                    <div class="students-hub-field is-full${isInternalTransfer ? '' : ' is-hidden'}" data-student-transfer-panel="internal">
                        <label for="student-mobility-source-faculty">Source faculty</label>
                        <select class="students-hub-control lux-control" id="student-mobility-source-faculty" data-lux-picker-label="Source faculty">
                            ${sourceOptions}
                        </select>
                    </div>
                    <div class="students-hub-field is-full${isInternalTransfer ? '' : ' is-hidden'}" data-student-transfer-panel="internal">
                        <label for="student-mobility-target-faculty">Target faculty</label>
                        <select class="students-hub-control lux-control" id="student-mobility-target-faculty" data-lux-picker-label="Target faculty">
                            <option value="">Select target faculty</option>
                            ${targetOptions}
                        </select>
                    </div>
                    <div class="students-hub-field is-full${isInternalTransfer ? '' : ' is-hidden'}" data-student-transfer-panel="internal">
                        <label for="student-mobility-transfer-subjects">Transfer subject plan</label>
                        <textarea class="students-hub-control lux-control" id="student-mobility-transfer-subjects" placeholder="One subject ID per line">${escapeHtml(transferSubjects)}</textarea>
                    </div>
                    <div class="students-hub-field is-full">
                        <label for="student-mobility-notes">Agreement metadata</label>
                        <textarea class="students-hub-control lux-control" id="student-mobility-notes" data-student-mobility-field="notes" placeholder="Partner institution, agreement reference, notes">${escapeHtml(agreementNotes)}</textarea>
                    </div>
                </div>
                <div class="students-hub-inline-actions">
                    <button class="lux-primary-btn" type="button" data-student-action="save-mobility" data-staff-id="${escapeHtml(record.id)}"><i class="fas fa-save"></i> Save mobility</button>
                    <button class="lux-secondary-btn${isInternalTransfer ? '' : ' is-hidden'}" type="button" data-student-action="execute-transfer" data-staff-id="${escapeHtml(record.id)}"><i class="fas fa-right-left"></i> Execute internal transfer</button>
                </div>
            </section>
            <section class="students-hub-info-card is-full lux-data-card home-hover-chip">
                <span>Transfer history</span>
                <div class="students-hub-list students-hub-list--spaced">${historyRows}</div>
            </section>
        `;
    }


        return { renderMobilityTab };
    };
})();
