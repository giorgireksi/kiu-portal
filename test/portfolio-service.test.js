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

    it('limits custom sections and validates peer publish consent', () => {
        const store = new PlatformStore({});
        seedStudent(store, 'student-1');

        let portfolio = store.getPortfolioForUser('student-1', 'student-1');
        portfolio = store.savePortfolioForUser('student-1', {
            basics: { name: 'Student One', summary: 'Ready for campus.' },
            sections: portfolio.sections
        }, 'student-1');

        expect(() => store.publishPortfolioForUser('student-1', {
            visibilityMode: 'students_only',
            consentAcknowledged: false
        }, 'student-1')).toThrow(/Confirm campus visibility/);

        for (let index = 0; index < 8; index += 1) {
            portfolio = store.addCustomPortfolioSection('student-1', {
                label: `Custom ${index}`,
                fieldDefinitions: [{ key: `field_${index}`, type: 'text', label: 'Note' }],
                entries: []
            }, 'student-1');
        }
        expect(Object.keys(portfolio.sections).filter((key) => key.startsWith('custom_')).length).toBe(8);

        expect(() => store.addCustomPortfolioSection('student-1', {
            label: 'Too many',
            fieldDefinitions: [{ key: 'extra', type: 'text', label: 'Extra' }]
        }, 'student-1')).toThrow(/8 custom sections/);
    });
});