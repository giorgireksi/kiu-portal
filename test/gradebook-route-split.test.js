import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('gradebook route split', () => {
    it('does not mount unused gradebook REST handlers (client uses KIU_STATE)', () => {
        const server = readSource('backend/platform/server.js');

        expect(existsSync(join(process.cwd(), 'backend/platform/routes/gradebook-routes.js'))).toBe(false);
        expect(server).not.toContain("require('./routes/gradebook-routes')");
        expect(server).not.toContain('registerGradebookRoutes');
        expect(server).not.toContain('/api/gradebook/');
        expect(server).not.toContain('requireGradebookCourseAccess');
    });
});
