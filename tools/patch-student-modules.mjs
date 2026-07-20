#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(import.meta.dirname, '..');

// --- student-form-blueprint.js: single schema ---
writeFileSync(join(ROOT, 'assets/js/pages/student-form-blueprint.js'), readFileSync(join(ROOT, 'assets/js/pages/student-form-blueprint.js'), 'utf8')
    .replace(/const BUILTIN_TYPES[\s\S]*?};\n    const INPUT_FIELD_TYPES/, `const STUDENT_TYPE_ID = 'student';
    const MOBILITY_CATEGORIES = [
        { value: 'standard', label: 'Standard enrollment' },
        { value: 'exchange_incoming', label: 'Exchange incoming' },
        { value: 'exchange_outgoing', label: 'Exchange outgoing' },
        { value: 'internal_transfer', label: 'Internal transfer' }
    ];
    const INPUT_FIELD_TYPES`)
    .replace(/staff_id: 'staffId'[\s\S]*?max_weekly_hours: 'maxHours'\n    };/, `student_id: 'studentId',
        full_name: 'name',
        institutional_email: 'email',
        english_name: 'nameEn',
        phone: 'phone',
        photo_url: 'photo',
        student_status: 'status',
        program: 'program',
        cohort: 'cohort',
        semester: 'semester',
        department: 'department',
        faculty_school: 'faculty',
        campus: 'campus',
        biography: 'bio',
        lms_account_status: 'accountStatus',
        last_login: 'lastLogin',
        internal_admin_notes: 'notes',
        mobility_category: 'mobilityCategory'
    };`)
    .replace(/'staff_type'/, "'student_field'")
    .replace(/function migrateStaffFormBlueprintV1ToV2/g, 'function migrateStudentFormBlueprintV1ToV2')
    .replace(/function ensureStudentFormBlueprint\(\) \{[\s\S]*?return blueprint;\n    \}/, `function defaultStudentSchema() {
        return {
            sections: [
                normalizeSection({
                    id: 'sec_identity',
                    title: 'Identity',
                    order: 0,
                    fields: [
                        { key: 'full_name', label: 'Full name', type: 'text', required: true, order: 0 },
                        { key: 'student_id', label: 'Student ID', type: 'text', required: true, order: 1 },
                        { key: 'institutional_email', label: 'Institutional email', type: 'email', required: true, order: 2 },
                        { key: 'phone', label: 'Phone', type: 'tel', order: 3 }
                    ]
                }, 0),
                normalizeSection({
                    id: 'sec_academic',
                    title: 'Academic',
                    order: 1,
                    filterGroup: true,
                    fields: [
                        { key: 'program', label: 'Program', type: 'text', required: true, order: 0 },
                        { key: 'cohort', label: 'Cohort', type: 'text', order: 1 },
                        { key: 'semester', label: 'Semester', type: 'text', order: 2 },
                        { key: 'student_status', label: 'Status', type: 'select', order: 3, options: [
                            { value: 'active', label: 'Active' },
                            { value: 'probation', label: 'Probation' },
                            { value: 'suspended', label: 'Suspended' },
                            { value: 'archived', label: 'Archived' }
                        ]}
                    ]
                }, 1)
            ]
        };
    }

    function ensureStudentFormBlueprint() {
        if (!window.KIU_STATE) window.KIU_STATE = {};
        if (!KIU_STATE[BLUEPRINT_KEY] || typeof KIU_STATE[BLUEPRINT_KEY] !== 'object') {
            KIU_STATE[BLUEPRINT_KEY] = {
                version: BLUEPRINT_VERSION,
                updatedAt: todayIso(),
                schema: defaultStudentSchema()
            };
        }
        const blueprint = KIU_STATE[BLUEPRINT_KEY];
        if (blueprint.schemas?.student) {
            blueprint.schema = migrateSchemaToV2(blueprint.schemas.student);
            delete blueprint.schemas;
            delete blueprint.staffTypes;
        }
        if (!blueprint.schema) blueprint.schema = defaultStudentSchema();
        blueprint.schema = migrateSchemaToV2(blueprint.schema);
        blueprint.version = BLUEPRINT_VERSION;
        return blueprint;
    }`)
    .replace(/function getStudentFormTypes\(\) \{[\s\S]*?\n    \}/, `function getStudentFormTypes() {
        return [{ id: STUDENT_TYPE_ID, label: 'Student', slug: 'student', isBuiltin: true, order: 0 }];
    }`)
    .replace(/function getStudentFormType\(typeId\) \{[\s\S]*?\n    \}/, `function getStudentFormType(typeId) {
        void typeId;
        return getStudentFormTypes()[0];
    }`)
    .replace(/function getStudentFormSchema\(typeId\) \{[\s\S]*?\n    \}/, `function getStudentFormSchema(typeId) {
        void typeId;
        const blueprint = ensureStudentFormBlueprint();
        return cloneJson(blueprint.schema || defaultStudentSchema());
    }`)
    .replace(/function ensureSchema\(typeId\) \{[\s\S]*?return blueprint\.schemas\[typeId\];\n    \}/, `function ensureSchema(typeId) {
        void typeId;
        const blueprint = ensureStudentFormBlueprint();
        if (!blueprint.schema) blueprint.schema = defaultStudentSchema();
        if (!Array.isArray(blueprint.schema.sections)) blueprint.schema = migrateSchemaToV2(blueprint.schema);
        return blueprint.schema;
    }`)
    .replace(/migrateStaffFormBlueprintV1ToV2\(blueprint\);[\s\S]*?blueprint\.staffTypes\.sort[\s\S]*?return blueprint;/, '')
    .replace(/within this staff type/g, 'within the student form')
    .replace(/function addStaffFormType[\s\S]*?function updateStaffFormType[\s\S]*?function removeStaffFormType[\s\S]*?function resolveStudentTypeId[\s\S]*?\n    \}/, `function resolveStudentTypeId() {
        return STUDENT_TYPE_ID;
    }

    function addStudentFormType() {
        return { error: 'Student form uses a single unified schema.' };
    }

    function updateStudentFormType() {
        return { error: 'Student form uses a single unified schema.' };
    }

    function removeStudentFormType() {
        return { error: 'Student form uses a single unified schema.' };
    }`)
    .replace(/function copyStudentFormBlueprint[\s\S]*?return \{ ok: true \};\n    \}/, `function copyStudentFormBlueprint() {
        return { error: 'Copy between types is not available for the unified student form.' };
    }`)
    .replace(/window\.addStaffFormType/g, 'window.addStudentFormType')
    .replace(/window\.updateStaffFormType/g, 'window.updateStudentFormType')
    .replace(/window\.removeStaffFormType/g, 'window.removeStudentFormType')
    .replace(/window\.MOBILITY_CATEGORIES = MOBILITY_CATEGORIES;\n    window\.STUDENT_TYPE_ID = STUDENT_TYPE_ID;/, '')
    + '\n    window.STUDENT_TYPE_ID = STUDENT_TYPE_ID;\n    window.MOBILITY_CATEGORIES = MOBILITY_CATEGORIES;\n');

// Fix the blueprint file ending
let bp = readFileSync(join(ROOT, 'assets/js/pages/student-form-blueprint.js'), 'utf8');
if (!bp.includes('window.STUDENT_TYPE_ID')) {
    bp = bp.replace(/\}\)\(\);$/, `    window.STUDENT_TYPE_ID = STUDENT_TYPE_ID;
    window.MOBILITY_CATEGORIES = MOBILITY_CATEGORIES;
})();`);
}
writeFileSync(join(ROOT, 'assets/js/pages/student-form-blueprint.js'), bp);

// --- student-directory-filters-runtime.js ---
let filters = readFileSync(join(ROOT, 'assets/js/pages/student-directory-filters-runtime.js'), 'utf8');
filters = filters.replace(/const STUDENT_DIRECTORY_DEFAULT_FILTERS = \{[\s\S]*?\};/, `const STUDENT_DIRECTORY_DEFAULT_FILTERS = {
        query: '',
        droplistQuery: '',
        mobility: 'all',
        program: 'all',
        field: {},
        profile: 'all',
        archive: 'active',
        sort: 'name'
    };`);
filters = filters.replace(/platform: 'platform',\n        profile: 'profile',\n        teaching: 'teaching',/g, "mobility: 'mobility',\n        program: 'program',\n        profile: 'profile',");
filters = filters.replace(/function fallbackIsTeachingRole[\s\S]*?}\n\n    function fallbackProfileCompleteness/, `function fallbackMobilityCategory(record) {
        return String(record?.mobility?.category || record?.mobilityCategory || 'standard').trim() || 'standard';
    }

    function fallbackProfileCompleteness`);
filters = filters.replace(/isTeachingRole: typeof helpers\.isTeachingRole === 'function' \? helpers\.isTeachingRole : fallbackIsTeachingRole,/,
    'getMobilityCategory: typeof helpers.getMobilityCategory === "function" ? helpers.getMobilityCategory : fallbackMobilityCategory,');
writeFileSync(join(ROOT, 'assets/js/pages/student-directory-filters-runtime.js'), filters);

console.log('patched student-form-blueprint.js and student-directory-filters-runtime.js');