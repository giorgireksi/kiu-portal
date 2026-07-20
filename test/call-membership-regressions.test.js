import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('call membership regressions', () => {
    it('requires direct calls and signals to stay inside an existing chat membership boundary', () => {
        const store = readSource('backend/platform/store.js');
        const routeModule = readSource('backend/platform/routes/messenger-calls-routes.js');

        expect(store).toContain("const chat = this.state.chats[chatId];");
        expect(store).toContain("if (!chat || socialText(chat.type || '') !== 'direct') return null;");
        expect(store).toContain("if (!members.includes(fromUserId) || !members.includes(toUserId)) return null;");
        expect(store).toContain("if (!call || !asArray(call.members).includes(fromUserId)) return null;");
        expect(routeModule).toContain("const chat = store.state.chats[signal.chatId];");
        expect(routeModule).toContain("if (!chat || !members.includes(signal.fromUserId) || !members.includes(signal.toUserId)) {");
    });
});
