import { describe, expect, it } from 'vitest';
import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { join } from 'path';

const require = createRequire(import.meta.url);
const { PlatformStore } = require('../backend/platform/store.js');

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function seedAccounts(store) {
    store.state.accounts['stu-a'] = {
        id: 'stu-a', displayName: 'Student A', email: 'a@example.com', role: 'student', facultyCode: 'ECON'
    };
    store.state.accounts['stu-b'] = {
        id: 'stu-b', displayName: 'Student B', email: 'b@example.com', role: 'student', facultyCode: 'ECON'
    };
    store.state.accounts['stu-c'] = {
        id: 'stu-c', displayName: 'Student C', email: 'c@example.com', role: 'student', facultyCode: 'BM'
    };
}

function futureClosesAt() {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
}

function sampleQuestions() {
    return [{ questionType: 'short_text', prompt: 'Thoughts?', required: true }];
}

describe('social-survey-audience-visibility', () => {
    it('student create defaults to faculty audience in form model + create dialog', () => {
        const model = readSource('assets/js/pages/social-form-model.js');
        const surveys = readSource('assets/js/pages/social-surveys.js');
        expect(model).toContain("audience: isOfficial ? 'campus' : 'faculty'");
        expect(surveys).toContain("isOfficial ? 'campus' : 'faculty'");
        expect(surveys).toContain("if (!isOfficial && audience === 'campus') audience = 'faculty'");
        expect(surveys).toContain('Student polls reach your faculty, connections, group, or page');
        expect(surveys).toMatch(/value: 'faculty'[\s\S]*?value: 'connections'/);
    });

    it('faculty audience lists for same faculty; connections stay gated', () => {
        const store = new PlatformStore({});
        seedAccounts(store);

        const facultySurvey = store.createSocialSurvey({
            title: 'Faculty poll',
            audience: 'faculty',
            closesAt: futureClosesAt(),
            questions: sampleQuestions(),
            publish: true
        }, 'stu-a');
        expect(facultySurvey).toBeTruthy();
        expect(facultySurvey.audience).toBe('faculty');
        expect(facultySurvey.audienceFacultyCode).toBe('ECON');

        const sameFaculty = store.listSocialSurveys({}, 'stu-b');
        const otherFaculty = store.listSocialSurveys({}, 'stu-c');
        expect(sameFaculty.some((item) => item.id === facultySurvey.id && item.viewerCanRespond)).toBe(true);
        expect(otherFaculty.some((item) => item.id === facultySurvey.id)).toBe(false);

        const connectionsSurvey = store.createSocialSurvey({
            title: 'Connections only',
            audience: 'connections',
            closesAt: futureClosesAt(),
            questions: sampleQuestions(),
            publish: true
        }, 'stu-a');
        expect(connectionsSurvey).toBeTruthy();

        const peerWithoutConnection = store.listSocialSurveys({}, 'stu-b');
        expect(peerWithoutConnection.some((item) => item.id === connectionsSurvey.id)).toBe(false);
        expect(peerWithoutConnection.some((item) => item.id === facultySurvey.id)).toBe(true);

        const authorSeesOwn = store.listSocialSurveys({}, 'stu-a');
        expect(authorSeesOwn.some((item) => item.id === connectionsSurvey.id)).toBe(true);
    });
});
