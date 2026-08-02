import { describe, expect, it } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { PlatformStore } = require('../backend/platform/store.js');

function seedStudent(store, id = 'student-1') {
    store.state.accounts[id] = {
        id,
        displayName: 'Student One',
        email: 'student@example.com',
        role: 'student',
        facultyCode: 'ECON'
    };
}

describe('portfolio service', () => {
    it('migrates existing showcase projects into a portfolio document', () => {
        const store = new PlatformStore({});
        seedStudent(store, 'student-1');
        store.createSocialProject({
            title: 'Capstone App',
            summary: 'Marketplace prototype',
            status: 'published',
            visibilityMode: 'students_only',
            skillTags: ['react', 'research']
        }, 'student-1');

        const portfolio = store.getPortfolioForUser('student-1', 'student-1');
        expect(portfolio?.sections?.projects?.entries?.length).toBeGreaterThan(0);
        expect(portfolio?.sections?.skills?.entries?.[0]?.fields?.tags?.value).toContain('react');
    });

    it('requires resume and about before peer publish, extras optional', () => {
        const store = new PlatformStore({});
        seedStudent(store, 'student-1');

        let portfolio = store.getPortfolioForUser('student-1', 'student-1');
        expect(() => store.publishPortfolioForUser('student-1', {
            visibilityMode: 'staff_only',
            consentAcknowledged: true
        }, 'student-1')).toThrow(/resume/i);

        portfolio = store.savePortfolioForUser('student-1', {
            basics: {
                name: 'Student One',
                headline: 'ECON student',
                summary: 'Interested in product and research.'
            },
            resume: {
                id: 'resume-1',
                name: 'resume.pdf',
                type: 'application/pdf',
                dataUrl: 'data:application/pdf;base64,AAA'
            },
            extras: [
                { kind: 'subject', title: 'Microeconomics', detail: 'Core course' },
                { kind: 'project', title: 'Capstone', detail: 'Marketplace prototype', url: 'https://example.com' }
            ]
        }, 'student-1');

        expect(portfolio.resume?.name).toBe('resume.pdf');
        expect(portfolio.extras?.length).toBe(2);

        expect(() => store.publishPortfolioForUser('student-1', {
            visibilityMode: 'students_only',
            consentAcknowledged: false
        }, 'student-1')).toThrow(/Confirm campus visibility/);

        const published = store.publishPortfolioForUser('student-1', {
            visibilityMode: 'students_only',
            consentAcknowledged: true
        }, 'student-1');
        expect(published.status).toBe('published');
    });

    it('marks missing resume files as storageMissing in decorated portfolio', () => {
        const store = new PlatformStore({});
        seedStudent(store, 'student-1');
        store.state.files['file_missing_resume'] = {
            id: 'file_missing_resume',
            name: 'resume.pdf',
            type: 'application/pdf',
            path: '/tmp/does-not-exist-resume.pdf',
            ownerUserId: 'student-1'
        };
        store.savePortfolioForUser('student-1', {
            basics: { name: 'Student One', summary: 'About me' },
            resume: {
                id: 'file_missing_resume',
                storageKey: 'file_missing_resume',
                storageBackend: 'bridge',
                name: 'resume.pdf',
                type: 'application/pdf'
            }
        }, 'student-1');

        const portfolio = store.getPortfolioForUser('student-1', 'student-1');
        expect(portfolio.resume?.storageMissing).toBe(true);
    });
});
