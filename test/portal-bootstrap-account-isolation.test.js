import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('portal bootstrap account isolation', () => {
    it('resets persistent portal state when logging in as a different account', () => {
        const loginRuntime = readSource('assets/js/pages/login-runtime.js');
        const api = readSource('assets/js/app/api.js');
        expect(loginRuntime).toContain("localStorage.removeItem('KIU_PERSISTENT_STATE')");
        expect(loginRuntime).toContain('portalStateOwnerAccountId');
        expect(api).toContain('function resetPortalLocalStateForAccountChange');
        expect(api).toContain('resetPortalLocalStateForAccountChange()');
    });

    it('scopes student-keyed portal merge to the active user id', () => {
        const apiSource = readSource('assets/js/app/api.js');
        const vm = require('vm');
        const context = { console };
        vm.createContext(context);
        const fnBlock = [
            apiSource.match(/function clonePortalState[\s\S]*?\n\}/)?.[0],
            apiSource.match(/function mergeStudentKeyedPortalMaps[\s\S]*?\n\}/)?.[0]
        ].filter(Boolean).join('\n\n');
        vm.runInContext(fnBlock, context);
        const merged = context.mergeStudentKeyedPortalMaps(
            {
                'student-a': [{ courseId: 'A-1' }],
                'student-b': [{ courseId: 'B-1' }]
            },
            {
                'student-b': [{ courseId: 'B-remote' }]
            },
            'student-a'
        );
        expect(merged['student-a']).toEqual([{ courseId: 'A-1' }]);
        expect(merged['student-b']).toEqual([{ courseId: 'B-remote' }]);
    });

    it('blocks local bootstrap merge when portal owner account changes', () => {
        const apiSource = readSource('assets/js/app/api.js');
        const vm = require('vm');
        const context = { console };
        vm.createContext(context);
        const fnBlock = apiSource.match(/function canMergeLocalPortalSnapshot[\s\S]*?\n\}/)?.[0] || '';
        vm.runInContext(fnBlock, context);
        expect(context.canMergeLocalPortalSnapshot({
            meta: { portalStateOwnerAccountId: 'account-a' }
        }, 'account-b')).toBe(false);
        expect(context.canMergeLocalPortalSnapshot({
            meta: { portalStateOwnerAccountId: 'account-a' }
        }, 'account-a')).toBe(true);
    });

    it('flushes admin workspace before role identity changes', () => {
        const utilities = readSource('assets/js/shared/utilities.js');
        expect(utilities).toContain('function flushAdminWorkspaceBeforeRoleIdentityChange');
        expect(utilities).toMatch(/fastRedirectRoleSwitch[\s\S]*?flushAdminWorkspaceBeforeRoleIdentityChange[\s\S]*?setActiveSessionUserByRole/);
        expect(utilities).toMatch(/persistAdminImpersonationRoleState[\s\S]*?skipFlush[\s\S]*?reconcileAdminRegistrationCmsAfterIdentityChange/);
    });

    it('stamps portal owner account id and omits auth from saveState cache', () => {
        const state = readSource('assets/js/app/state.js');
        expect(state).toContain('portalStateOwnerAccountId');
        expect(state).toMatch(/delete persisted\.auth/);
    });

    it('deep-merges student-keyed portal maps on the server without dropping other users', () => {
        const { PlatformStore } = require('../backend/platform/store.js');
        const store = new PlatformStore();
        store.state.portal.state = {
            studentSchedulesByStudent: {
                'student-a': [{ courseId: 'A-1' }],
                'student-b': [{ courseId: 'B-1' }]
            }
        };
        const saved = store.savePortalState({
            studentSchedulesByStudent: {
                'student-a': [{ courseId: 'A-2' }]
            }
        }, {
            actorUserId: 'student-a',
            allowGlobalWrite: false
        });
        expect(saved.state.studentSchedulesByStudent['student-a']).toEqual([{ courseId: 'A-2' }]);
        expect(saved.state.studentSchedulesByStudent['student-b']).toEqual([{ courseId: 'B-1' }]);
    });
});