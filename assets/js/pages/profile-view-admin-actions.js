/* Profile-view-only admin bursar/transcript actions extracted from directories.js. */

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

    let html = `
        <html><head><title>Official Transcript - ${userId}</title>
        <style>body{font-family:Arial; padding:40px; color:#333;} table{width:100%; border-collapse:collapse; margin-top:20px;} th,td{border:1px solid #ddd; padding:10px; text-align:left;} th{background:#f4f4f4;} .header{text-align:center; margin-bottom:40px;} .stamp{color:red; border:3px solid red; display:inline-block; padding:10px; font-weight:bold; transform:rotate(-15deg); margin-top:30px;}</style>
        </head><body>
        <div class="header">
            <h2>KUTAISI INTERNATIONAL UNIVERSITY</h2>
            <h3>OFFICIAL ACADEMIC TRANSCRIPT</h3>
            <p>Generated on: ${new Date().toISOString().split('T')[0]}</p>
        </div>
        <div style="margin-bottom:20px;">
            <strong>Student ID:</strong> ${userId}<br>
            <strong>Full Name:</strong> ${studentName}<br>
            <strong>Status:</strong> Active
        </div>
        <table>
            <tr><th>Course Code</th><th>Final Score (/100)</th><th>Letter Grade</th></tr>
    `;

    let totalScore = 0;
    transcriptData.forEach((record) => {
        totalScore += record.final;
        html += `<tr><td>${record.course}</td><td>${record.final}</td><td><strong>${record.letter}</strong></td></tr>`;
    });

    html += `</table>
        <div style="margin-top:20px;"><strong>Cumulative GPA Average:</strong> ${(totalScore / transcriptData.length).toFixed(2)} / 100.00</div>
        <div style="text-align:center;"><div class="stamp">OFFICIAL KIU REGISTRAR<br>VERIFIED COPY</div></div>
        <script>window.print();<\/script>
        </body></html>
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
