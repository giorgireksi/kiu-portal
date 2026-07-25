/* Profile-view-only admin bursar/transcript actions extracted from directories.js. */

function escapeProfileViewAdminHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        '\'': '&#39;'
    })[character]);
}

function resolveProfileViewAdminAssetUrl(relativePath) {
    try {
        return new URL(String(relativePath || '').trim(), window.location.href).toString();
    } catch (error) {
        return String(relativePath || '').trim();
    }
}

function toggleProbationForUser(userId) {
    if (getCurrentUser()?.role !== USER_ROLES.ADMIN) return;
    if (!KIU_STATE.probationStatus) KIU_STATE.probationStatus = {};

    if (KIU_STATE.probationStatus[userId]) {
        delete KIU_STATE.probationStatus[userId];
    } else {
        KIU_STATE.probationStatus[userId] = true;
    }
    saveState();

    if (typeof renderProfile === 'function') {
        renderProfile('student', userId, sessionStorage.getItem('pv_fac'));
    }
}

function applyHoldForUser(userId, amount) {
    if (getCurrentUser()?.role !== USER_ROLES.ADMIN) return;
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;

    if (!KIU_STATE.tuitionBalances) KIU_STATE.tuitionBalances = {};
    KIU_STATE.tuitionBalances[userId] = (KIU_STATE.tuitionBalances[userId] || 0) + amt;
    saveState();

    if (typeof renderProfile === 'function') {
        renderProfile('student', userId, sessionStorage.getItem('pv_fac'));
    }
}

function applyScholarshipForUser(userId, amount) {
    if (getCurrentUser()?.role !== USER_ROLES.ADMIN) return;
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;

    if (!KIU_STATE.tuitionBalances) KIU_STATE.tuitionBalances = {};
    KIU_STATE.tuitionBalances[userId] = Math.max(0, (KIU_STATE.tuitionBalances[userId] || 0) - amt);
    saveState();

    if (typeof renderProfile === 'function') {
        renderProfile('student', userId, sessionStorage.getItem('pv_fac'));
    }
}

function generateTranscriptForUser(userId) {
    const debt = (KIU_STATE.tuitionBalances && KIU_STATE.tuitionBalances[userId]) || 0;
    if (debt > 0) {
        alert(`ACCESS DENIED: Student ${userId} has an active Financial Hold. Outstanding Balance: ${debt} GEL.`);
        return;
    }

    let transcriptData = [];
    let studentName = 'Unknown Student';
    Object.keys(KIU_STATE.studentGrades || {}).forEach((courseKey) => {
        let roster = KIU_STATE.studentGrades[courseKey] || [];
        let st = roster.find((entry) => entry.id === userId);
        if (st) {
            studentName = st.name;
            transcriptData.push({
                course: courseKey.toUpperCase(),
                final: st.final || 0,
                letter: st.letter || 'F'
            });
        }
    });

    if (transcriptData.length === 0) {
        alert(`No academic records found for ID: ${userId}`);
        return;
    }

    let totalScore = 0;
    const transcriptRows = transcriptData.map((record) => {
        totalScore += record.final;
        return `
            <tr class="pv-transcript-record">
                <td class="pv-transcript-cell">${escapeProfileViewAdminHtml(record.course)}</td>
                <td class="pv-transcript-cell pv-transcript-cell--numeric">${escapeProfileViewAdminHtml(record.final)}</td>
                <td class="pv-transcript-cell pv-transcript-cell--grade"><strong>${escapeProfileViewAdminHtml(record.letter)}</strong></td>
            </tr>
        `;
    }).join('');
    const transcriptAverage = (totalScore / transcriptData.length).toFixed(2);
    const transcriptDate = escapeProfileViewAdminHtml(new Date().toISOString().split('T')[0]);
    const transcriptStylesheetUrl = escapeProfileViewAdminHtml(
        resolveProfileViewAdminAssetUrl('assets/css/lux-tokens.css?v=20260723-chipsurf1')
    );
    const safeUserId = escapeProfileViewAdminHtml(userId);
    const safeStudentName = escapeProfileViewAdminHtml(studentName);
    const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Official Transcript - ${safeUserId}</title>
            <link rel="stylesheet" href="${transcriptStylesheetUrl}">
        </head>
        <body class="pv-transcript-export">
            <main class="pv-transcript-sheet">
                <header class="pv-transcript-header">
                    <p class="pv-transcript-eyebrow">Kutaisi International University</p>
                    <h1 class="pv-transcript-title">OFFICIAL ACADEMIC TRANSCRIPT</h1>
                    <p class="pv-transcript-generated">Generated on: ${transcriptDate}</p>
                </header>
                <section class="pv-transcript-student-card" aria-label="Student transcript summary">
                    <dl class="pv-transcript-student-grid">
                        <div class="pv-transcript-student-row">
                            <dt class="pv-transcript-label">Student ID</dt>
                            <dd class="pv-transcript-value">${safeUserId}</dd>
                        </div>
                        <div class="pv-transcript-student-row">
                            <dt class="pv-transcript-label">Full Name</dt>
                            <dd class="pv-transcript-value">${safeStudentName}</dd>
                        </div>
                        <div class="pv-transcript-student-row">
                            <dt class="pv-transcript-label">Status</dt>
                            <dd class="pv-transcript-value">Active</dd>
                        </div>
                    </dl>
                </section>
                <section class="pv-transcript-table-shell" aria-label="Transcript course records">
                    <table class="pv-transcript-table">
                        <thead>
                            <tr class="pv-transcript-head-row">
                                <th class="pv-transcript-head" scope="col">Course Code</th>
                                <th class="pv-transcript-head pv-transcript-head--numeric" scope="col">Final Score (/100)</th>
                                <th class="pv-transcript-head pv-transcript-head--grade" scope="col">Letter Grade</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${transcriptRows}
                        </tbody>
                    </table>
                </section>
                <section class="pv-transcript-summary" aria-label="Transcript summary">
                    <div class="pv-transcript-summary-card">
                        <span class="pv-transcript-summary-label">Cumulative GPA Average</span>
                        <strong class="pv-transcript-summary-value">${escapeProfileViewAdminHtml(transcriptAverage)} / 100.00</strong>
                    </div>
                </section>
                <footer class="pv-transcript-stamp-shell">
                    <div class="pv-transcript-stamp" aria-label="Registrar verification stamp">
                        <span class="pv-transcript-stamp-line">OFFICIAL KIU REGISTRAR</span>
                        <span class="pv-transcript-stamp-line">VERIFIED COPY</span>
                    </div>
                </footer>
            </main>
            <script>window.print();<\/script>
        </body>
        </html>
    `;

    const blob = new Blob([html], { type: 'text/html' });
    const objectUrl = URL.createObjectURL(blob);
    const newWindow = window.open(objectUrl, '_blank');
    if (newWindow) {
        const revoke = () => URL.revokeObjectURL(objectUrl);
        newWindow.addEventListener('load', () => setTimeout(revoke, 0), { once: true });
    } else {
        URL.revokeObjectURL(objectUrl);
    }
}
