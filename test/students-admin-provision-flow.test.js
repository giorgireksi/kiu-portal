import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('students-admin provision flow', () => {
    it('routes pending student provisioning through students command center', () => {
        const registration = readSource('assets/js/pages/registration.js');
        const commandCenter = readSource('assets/js/pages/students-command-center.js');

        expect(registration).toContain("navigate('students-admin')");
        expect(registration).not.toContain("document.getElementById('student-register-overlay')");
        expect(registration).toContain('typeof openStudentRegistration === \'function\'');

        expect(commandCenter).toContain("pending === 'student'");
        expect(commandCenter).toContain('openStudentRegistration()');
    });
});