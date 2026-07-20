#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(import.meta.dirname, '..');
const path = join(ROOT, 'assets/js/pages/students-command-center.js');
let src = readFileSync(path, 'utf8');

const STUDENT_TYPE_ID = 'student';

// State defaults
src = src.replace(/modalRole: 'professor',\s*modalStaffTypeId: 'professor',/,
    `modalRole: 'student',\n                modalStudentTypeId: '${STUDENT_TYPE_ID}',`);
src = src.replace(/formSettingsTypeId: 'professor',/g, `formSettingsTypeId: '${STUDENT_TYPE_ID}',`);
src = src.replace(/copySourceTypeId: 'ta',/g, `copySourceTypeId: '${STUDENT_TYPE_ID}',`);
src = src.replace(/modalStaffTypeId/g, 'modalStudentTypeId');
src = src.replace(/if \(window\.__studentsCommandState\.formSettingsTypeId == null\) window\.__studentsCommandState\.formSettingsTypeId = 'professor';/,
    `if (window.__studentsCommandState.formSettingsTypeId == null) window.__studentsCommandState.formSettingsTypeId = '${STUDENT_TYPE_ID}';`);
src = src.replace(/if \(window\.__studentsCommandState\.modalStudentTypeId == null\) window\.__studentsCommandState\.modalStudentTypeId = 'professor';/,
    `if (window.__studentsCommandState.modalStudentTypeId == null) window.__studentsCommandState.modalStudentTypeId = '${STUDENT_TYPE_ID}';`);

// Default filters
src = src.replace(/platform: 'all',\s*field: \{\},\s*profile: 'all',\s*teaching: 'all',/,
    `mobility: 'all',\n                program: 'all',\n                field: {},\n                profile: 'all',`);

// Replace PLATFORM_ROLE_META block
src = src.replace(/const PLATFORM_ROLE_META = \{[\s\S]*?\};\n/, `const STUDENT_TYPE_ID = '${STUDENT_TYPE_ID}';\n`);

// Replace buildPlatformCandidates + buildStudentRecords
const buildStart = src.indexOf('    function buildPlatformCandidates(facultyCode) {');
const buildEnd = src.indexOf('    function isStudentEnrollmentActive(record) {');
if (buildStart >= 0 && buildEnd > buildStart) {
    const replacement = `    function getStudentDirectorySignalsSafe(student) {
        return typeof getStudentDirectorySignals === 'function'
            ? getStudentDirectorySignals(student)
            : { holdLabel: 'Clear', holdTone: 'success', balance: 0, probation: false, suspended: false, risk: false, holdLabels: [] };
    }

    function buildStudentRecords(facultyCode) {
        ensureStore();
        const normalizedFaculty = typeof normalizeFacultyCode === 'function'
            ? normalizeFacultyCode(facultyCode, 'ECON')
            : (facultyCode || 'ECON');
        const students = typeof getAllStudents === 'function'
            ? getAllStudents(normalizedFaculty)
            : [];
        const profile = KIU_STATE.facultyProfiles?.[normalizedFaculty] || { students: [] };
        const records = students.map((base) => {
            const id = String(base.id || '');
            const stored = getRecordStoreEntry(id) || {};
            const user = (KIU_STATE.users || []).find((item) => String(item?.id || '') === id) || null;
            const name = normalizeText(stored.name || base.name || base.nameEn, 'Unknown student');
            const program = normalizeText(stored.program || base.program || base.course || '', '');
            const semester = normalizeText(stored.semester || base.semester || '', '');
            const cohort = normalizeText(stored.cohort || base.cohort || base.joinYear || '', '');
            const mobility = stored.mobility && typeof stored.mobility === 'object'
                ? stored.mobility
                : {
                    category: stored.mobilityCategory || base.mobilityCategory || 'standard',
                    agreementMetadata: stored.agreementMetadata || {},
                    effectiveFrom: stored.effectiveFrom || '',
                    effectiveTo: stored.effectiveTo || ''
                };
            const signals = getStudentDirectorySignalsSafe({ ...base, ...stored, id, name, program, semester });
            return {
                id,
                studentTypeId: STUDENT_TYPE_ID,
                staffTypeId: STUDENT_TYPE_ID,
                studentId: normalizeText(stored.studentId || base.studentId || base.id || id, id),
                staffId: normalizeText(stored.studentId || base.studentId || base.id || id, id),
                name,
                nameEn: normalizeText(stored.nameEn || base.nameEn || base.name || '', ''),
                email: normalizeText(stored.email || base.email || user?.email || '', ''),
                phone: normalizeText(stored.phone || base.phone || '', ''),
                photo: scrubFakeMedia?.(stored.photo || base.photo || base.image) || '',
                status: normalizeText(stored.status || base.status || 'Active', 'Active'),
                program,
                semester,
                cohort,
                department: normalizeText(stored.department || departmentForFaculty(normalizedFaculty), departmentForFaculty(normalizedFaculty)),
                faculty: normalizeText(stored.faculty || humanizeFacultyName(normalizedFaculty), humanizeFacultyName(normalizedFaculty)),
                facultyCode: normalizedFaculty,
                gpa: Number(stored.gpa || base.gpa || 0),
                mobility,
                mobilityCategory: mobility.category,
                mobilityLabel: (window.MOBILITY_CATEGORIES || []).find((item) => item.value === mobility.category)?.label || 'Standard enrollment',
                accountStatus: getAccountStatus(user || base, stored),
                lmsRole: 'Student',
                lastLogin: normalizeText(stored.lastLogin || user?.lastLogin || base.lastLogin || '', ''),
                updatedAt: normalizeText(stored.updatedAt || base.updatedAt || todayIso(), todayIso()),
                createdBy: normalizeText(stored.createdBy || base.createdBy || 'Admin', 'Admin'),
                documents: Array.isArray(stored.documents) ? stored.documents : [],
                notes: normalizeText(stored.notes || '', ''),
                fieldValues: stored.fieldValues && typeof stored.fieldValues === 'object' ? stored.fieldValues : {},
                signals,
                profile: profile
            };
        });
        return { records, facultyProfile: profile };
    }

`;
    src = src.slice(0, buildStart) + replacement + src.slice(buildEnd);
}

// Completeness + role label
src = src.replace(/function isStudentEnrollmentActive\(record\) \{[\s\S]*?\n    \}/,
    `function isStudentEnrollmentActive(record) {
        return String(record?.status || '').toLowerCase() !== 'archived';
    }`);
src = src.replace(/function studentProfileCompleteness\(record\) \{[\s\S]*?return \{ percent: earned, missing, checks \};\n    \}/,
    `function studentProfileCompleteness(record) {
        const typeId = STUDENT_TYPE_ID;
        if (typeof getAllStudentFormFields === 'function' && typeof computeStudentFormCompleteness === 'function') {
            const fields = getAllStudentFormFields(typeId);
            if (fields.length) {
                const values = record?.fieldValues && typeof record.fieldValues === 'object'
                    ? record.fieldValues
                    : (typeof hydrateFieldValuesFromRecord === 'function' ? hydrateFieldValuesFromRecord(record, typeId) : {});
                return computeStudentFormCompleteness(typeId, values);
            }
        }
        const checks = [
            { key: 'basic', label: 'basic information', ok: Boolean(record.name && record.email && record.studentId), weight: 25 },
            { key: 'program', label: 'program details', ok: Boolean(record.program && record.semester), weight: 25 },
            { key: 'contact', label: 'contact information', ok: Boolean(record.email && record.phone), weight: 20 },
            { key: 'mobility', label: 'mobility category', ok: Boolean(record.mobility?.category), weight: 15 },
            { key: 'status', label: 'enrollment status', ok: Boolean(record.status), weight: 15 }
        ];
        const earned = checks.reduce((sum, item) => sum + (item.ok ? item.weight : 0), 0);
        const missing = checks.filter((item) => !item.ok).map((item) => item.label);
        return { percent: earned, missing, checks };
    }`);
src = src.replace(/function getStudentRoleLabel\(platformRole\) \{[\s\S]*?\n    \}/,
    `function getStudentRoleLabel() {
        return 'Student';
    }`);
src = src.replace(/return PLATFORM_ROLE_META\[platformRole\]\?\.label \|\| 'Staff';/g, "return 'Student';");

// Misc string fixes
src = src.replace(/normalizeText\(name, 'Staff'\)/g, "normalizeText(name, 'Student')");
src = src.replace(/showToast\('Staff filters cleared\.'\)/g, "showToast('Student filters cleared.')");
src = src.replace(/'professor'/g, `'${STUDENT_TYPE_ID}'`);
src = src.replace(/resolveRecordTypeId\(record\) \{[\s\S]*?\n    \}/,
    `resolveRecordTypeId(record) {
        void record;
        return STUDENT_TYPE_ID;
    }`);

// Draft record + IDs
src = src.replace(/function buildStudentDraftRecord\(facultyCode, platformRole\) \{[\s\S]*?\n    \}/,
    `function buildStudentDraftRecord(facultyCode) {
        const faculty = humanizeFacultyName(facultyCode);
        return {
            id: '',
            studentTypeId: STUDENT_TYPE_ID,
            staffTypeId: STUDENT_TYPE_ID,
            fieldValues: {},
            studentId: nextStudentNumber(),
            staffId: nextStudentNumber(),
            name: '',
            nameEn: '',
            email: '',
            phone: '',
            photo: '',
            status: 'Active',
            program: '',
            semester: '',
            cohort: String(new Date().getFullYear()),
            department: departmentForFaculty(facultyCode),
            faculty,
            facultyCode,
            mobility: { category: 'standard', agreementMetadata: {}, effectiveFrom: '', effectiveTo: '' },
            mobilityCategory: 'standard',
            accountStatus: 'Not Invited',
            lmsRole: 'Student',
            lastLogin: '',
            updatedAt: todayIso(),
            createdBy: normalizeText(getCurrentUser?.()?.name || getCurrentUser?.()?.email || 'Admin', 'Admin'),
            documents: [],
            notes: ''
        };
    }`);
src = src.replace(/function nextStaffNumber\(\) \{[\s\S]*?return `STF-\$\{new Date\(\)\.getFullYear\(\)\}-\$\{String\(next\)\.padStart\(3, '0'\)\}`;\n    \}/,
    `function nextStudentNumber() {
        const store = ensureStore();
        const numbers = Object.values(store).map((entry) => Number(String(entry.studentId || entry.staffId || '').match(/(\\d+)$/)?.[1] || 0));
        const next = Math.max(0, ...numbers) + 1;
        return \`STU-\${new Date().getFullYear()}-\${String(next).padStart(3, '0')}\`;
    }`);
src = src.replace(/nextStaffNumber/g, 'nextStudentNumber');
src = src.replace(/function nextUserId\(platformRole, facultyCode\) \{[\s\S]*?return `\$\{prefix\}-\$\{normalizedFaculty\}-\$\{Date\.now\(\)\}`;\n    \}/,
    `function nextUserId(facultyCode) {
        const normalizedFaculty = typeof normalizeFacultyCode === 'function'
            ? normalizeFacultyCode(facultyCode, 'ECON')
            : (facultyCode || 'ECON');
        return \`STU-\${normalizedFaculty}-\${Date.now()}\`;
    }`);

// Persist - replace upsertFacultyMirror
src = src.replace(/function upsertFacultyMirror\(nextRecord\) \{[\s\S]*?\n    \}/,
    `function upsertFacultyMirror(nextRecord) {
        if (!KIU_STATE.facultyProfiles[nextRecord.facultyCode]) {
            KIU_STATE.facultyProfiles[nextRecord.facultyCode] = { professors: [], tas: [], curriculum: [], students: [] };
        }
        const profile = KIU_STATE.facultyProfiles[nextRecord.facultyCode];
        profile.students = (profile.students || []).filter((member) => String(member?.id || '') !== String(nextRecord.id));
        profile.students.push({
            id: nextRecord.id,
            studentId: nextRecord.studentId,
            name: nextRecord.name,
            nameEn: nextRecord.nameEn,
            email: nextRecord.email,
            program: nextRecord.program,
            semester: nextRecord.semester,
            cohort: nextRecord.cohort,
            course: nextRecord.program,
            status: nextRecord.status,
            phone: nextRecord.phone,
            photo: nextRecord.photo,
            gpa: nextRecord.gpa
        });
    }`);

src = src.replace(/role: nextRecord\.platformRole,/g, "role: 'student',");

// consumePendingAdminAccountFlow at end - ensure student flow
if (!src.includes("pending === 'student'")) {
    src = src.replace(/function consumePendingAdminAccountFlow\(\) \{[\s\S]*?\n    \}/,
        `function consumePendingAdminAccountFlow() {
        const pending = localStorage.getItem(FLOW_KEY);
        if (!pending) return;
        if (pending === 'student' || pending === USER_ROLES?.STUDENT) {
            localStorage.removeItem(FLOW_KEY);
            openStudentRegistration();
            return;
        }
    }`);
}

// Export renderStudentsAdminLmsPage alias
if (!src.includes('renderStudentsAdminLmsPage')) {
    src = src.replace(/window\.renderStudentsPage = renderStudentsPage;/,
        `window.renderStudentsPage = renderStudentsPage;
    window.renderStudentsAdminLmsPage = renderStudentsPage;`);
}

writeFileSync(path, src);
console.log('patched students-command-center.js');