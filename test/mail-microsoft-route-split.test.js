import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('mail and microsoft route split', () => {
    it('mounts Microsoft sign-in and mail routes from dedicated route modules', () => {
        const server = readSource('backend/platform/server.js');
        const microsoftRoutes = readSource('backend/platform/routes/microsoft-auth-routes.js');
        const mailRoutes = readSource('backend/platform/routes/mail-routes.js');

        expect(server).toContain("require('./routes/microsoft-auth-routes')");
        expect(server).toContain("require('./routes/mail-routes')");
        expect(server).toContain('registerMicrosoftAuthRoutes(app, {');
        expect(server).toContain('registerMailRoutes(app, {');

        expect(microsoftRoutes).toContain("app.get('/api/portal/microsoft/config'");
        expect(microsoftRoutes).toContain("app.get('/api/portal/microsoft/start'");
        expect(microsoftRoutes).toContain("app.post('/api/portal/microsoft/complete'");
        expect(microsoftRoutes).toContain("app.get('/api/portal/microsoft/callback'");

        expect(mailRoutes).toContain("app.get('/api/mail/bootstrap'");
        expect(mailRoutes).toContain("app.get('/api/mail/connect/start'");
        expect(mailRoutes).toContain("app.get('/api/mail/connect/callback'");
        expect(mailRoutes).toContain("app.delete('/api/mail/connection'");
        expect(mailRoutes).toContain("app.post('/api/mail/sync'");
        expect(mailRoutes).toContain("app.get('/api/mail/messages'");
        expect(mailRoutes).toContain("app.get('/api/mail/messages/:id'");
        expect(mailRoutes).toContain("app.get('/api/mail/messages/:id/attachments/:attachmentId'");
        expect(mailRoutes).toContain("app.post('/api/mail/messages/send'");
        expect(mailRoutes).toContain("app.post('/api/mail/messages/:id/reply'");
        expect(mailRoutes).toContain("app.post('/api/mail/messages/:id/read-state'");
    });
});
