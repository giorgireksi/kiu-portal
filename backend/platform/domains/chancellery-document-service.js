const { asArray, clone, normalizeCode } = require('../utils');

const CHANCELLERY_DOCUMENT_SECTION_TYPES = Object.freeze([
    'title',
    'paragraph',
    'courseLabel',
    'examOptions',
    'description'
]);

function normalizeChancelleryDocumentFacultyCode(facultyCode = '') {
    return normalizeCode(facultyCode || 'ECON') || 'ECON';
}

function slugifyChancelleryDocumentToken(label = '', fallback = 'option') {
    const slug = String(label || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return slug || fallback;
}

function normalizeChancelleryDocumentExamOption(option = {}, index = 0) {
    const label = String(option?.label ?? option?.text ?? '').trim();
    if (!label) return null;
    const id = String(option?.id || option?.value || '').trim()
        || slugifyChancelleryDocumentToken(label, `exam_${index + 1}`);
    return { id, label };
}

function normalizeChancelleryDocumentSection(section = {}, index = 0) {
    const type = String(section?.type || '').trim();
    if (!CHANCELLERY_DOCUMENT_SECTION_TYPES.includes(type)) return null;
    const id = String(section?.id || '').trim() || `section_${type}_${index + 1}`;
    if (type === 'title') {
        const text = String(section?.text || section?.label || '').trim();
        if (!text) return null;
        return { id, type, text };
    }
    if (type === 'paragraph') {
        const text = String(section?.text || '').trim();
        if (!text) return null;
        return { id, type, text };
    }
    if (type === 'courseLabel') {
        const label = String(section?.label || 'საგანი/Course:').trim() || 'საგანი/Course:';
        return { id, type, label };
    }
    if (type === 'examOptions') {
        const options = asArray(section?.options)
            .map((option, optionIndex) => normalizeChancelleryDocumentExamOption(option, optionIndex))
            .filter(Boolean);
        if (!options.length) return null;
        return { id, type, options };
    }
    const label = String(section?.label || '').trim()
        || 'შეფასების გასაჩივრების შესახებ მოკლე აღწერილობა/Brief description on the assessment appeal:';
    return {
        id,
        type: 'description',
        label,
        helper: String(section?.helper || '').trim(),
        placeholder: String(section?.placeholder || '').trim()
    };
}

function buildDefaultChancelleryDocumentTemplate() {
    return {
        version: 1,
        letterhead: {
            institutionKa: 'სსიპ ქუთაისის საერთაშორისო უნივერსიტეტის',
            institutionEn: 'LEPL Kutaisi International University',
            schoolLabel: 'სკოლის/School',
            programLabel: 'პროგრამა/Program',
            nameEnLabel: 'სახელი გვარი ინგლისურად',
            nameKaLabel: 'სახელი გვარი ქართულად',
            personalNumberLabel: 'პირადი ნომერი'
        },
        sections: [
            {
                id: 'title_appeal',
                type: 'title',
                text: 'განცხადება აპელაციის თაობაზე / Appeal Request'
            },
            {
                id: 'course_line',
                type: 'courseLabel',
                label: 'საგანი/Course:'
            },
            {
                id: 'exam_choice',
                type: 'examOptions',
                options: [
                    { id: 'midterm', label: 'შუალედური გამოცდა Midterm Exam' },
                    { id: 'final', label: 'დასკვნითი გამოცდა Final Exam' },
                    { id: 'retake', label: 'დამატებითი გამოცდა Retake exam' }
                ]
            },
            {
                id: 'description',
                type: 'description',
                label: 'შეფასების გასაჩივრების შესახებ მოკლე აღწერილობა/Brief description on the assessment appeal:',
                helper: 'გთხოვთ, სააპელაციო განაცხადის შევსებისას აუცილებლად მიუთითოთ საკითხი ან ნომერი, რომლის შეფასებასაც ასაჩივრებთ, ასევე დაურთოთ მოკლე განმარტება, რატომ მიიჩნევთ, რომ შეფასება საჭიროებს გადახედვას.',
                placeholder: ''
            }
        ],
        submitLabel: 'გაგზავნა'
    };
}

function normalizeChancelleryDocumentLetterhead(letterhead = {}) {
    const defaults = buildDefaultChancelleryDocumentTemplate().letterhead;
    return {
        institutionKa: String(letterhead?.institutionKa ?? defaults.institutionKa).trim() || defaults.institutionKa,
        institutionEn: String(letterhead?.institutionEn ?? defaults.institutionEn).trim() || defaults.institutionEn,
        schoolLabel: String(letterhead?.schoolLabel ?? defaults.schoolLabel).trim() || defaults.schoolLabel,
        programLabel: String(letterhead?.programLabel ?? defaults.programLabel).trim() || defaults.programLabel,
        nameEnLabel: String(letterhead?.nameEnLabel ?? defaults.nameEnLabel).trim() || defaults.nameEnLabel,
        nameKaLabel: String(letterhead?.nameKaLabel ?? defaults.nameKaLabel).trim() || defaults.nameKaLabel,
        personalNumberLabel: String(letterhead?.personalNumberLabel ?? defaults.personalNumberLabel).trim()
            || defaults.personalNumberLabel
    };
}

function normalizeChancelleryDocumentTemplate(template = null) {
    const defaults = buildDefaultChancelleryDocumentTemplate();
    if (template == null || typeof template !== 'object') {
        return clone(defaults);
    }
    const sections = asArray(template.sections)
        .map((section, index) => normalizeChancelleryDocumentSection(section, index))
        .filter(Boolean);
    const seen = new Set();
    const deduped = [];
    sections.forEach((section) => {
        if (seen.has(section.id)) return;
        seen.add(section.id);
        deduped.push(section);
    });
    return {
        version: 1,
        letterhead: normalizeChancelleryDocumentLetterhead(template.letterhead),
        sections: deduped.length ? deduped : clone(defaults.sections),
        submitLabel: String(template.submitLabel || defaults.submitLabel).trim() || defaults.submitLabel
    };
}

module.exports = {
    CHANCELLERY_DOCUMENT_SECTION_TYPES,
    buildDefaultChancelleryDocumentTemplate,
    normalizeChancelleryDocumentFacultyCode,
    normalizeChancelleryDocumentLetterhead,
    normalizeChancelleryDocumentSection,
    normalizeChancelleryDocumentExamOption,
    normalizeChancelleryDocumentTemplate,
    slugifyChancelleryDocumentToken
};
