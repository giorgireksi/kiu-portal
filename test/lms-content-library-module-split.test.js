import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS content library module split', () => {
    it('moves LMS week and concept ownership out of lms.js and into the dedicated runtime module', () => {
        const lmsHtml = readSource('lms.html');
        const lmsSource = readSource('assets/js/pages/lms.js');
        const contentSource = readSource('assets/js/pages/lms-content-library-runtime.js');

        expect(lmsHtml).toContain('assets/js/pages/lms-content-library-runtime.js?v=20260518-lmscontent1');

        expect(contentSource).toContain('function ensureLmsWeeksForKey(resourceKey)');
        expect(contentSource).toContain('function renderLmsWeekManager(resourceKey)');
        expect(contentSource).toContain('function renderLmsConceptsLibrary(courseId)');
        expect(contentSource).toContain('async function createLmsConcept(resourceKey)');
        expect(contentSource).toContain('function updateLmsConceptReview(resourceKey, conceptId, reviewStatus = \'approved\')');
        expect(contentSource).toContain('function deleteLmsConcept(resourceKey, conceptId)');
        expect(contentSource).toContain('function rateLmsConcept(resourceKey, conceptId, score)');

        expect(lmsSource).not.toContain('function ensureLmsWeeksForKey(resourceKey)');
        expect(lmsSource).not.toContain('function renderLmsWeekManager(resourceKey)');
        expect(lmsSource).not.toContain('function renderLmsConceptsLibrary(courseId)');
        expect(lmsSource).not.toContain('async function createLmsConcept(resourceKey)');
        expect(lmsSource).not.toContain('function updateLmsConceptReview(resourceKey, conceptId, reviewStatus = \'approved\')');
        expect(lmsSource).not.toContain('function deleteLmsConcept(resourceKey, conceptId)');
        expect(lmsSource).not.toContain('function rateLmsConcept(resourceKey, conceptId, score)');
    });
});
