import { describe, expect, it } from 'vitest';
import { expectRetiredCss, readSource as readBareSource } from './helpers/bare-shell-css.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (typeof existsSync === 'function' && !existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

function extractCaseBlock(source, action) {
    const marker = `case '${action}':`;
    const start = source.indexOf(marker);
    if (start < 0) return '';
    const nextCase = source.indexOf("\n            case '", start + marker.length);
    const nextDefault = source.indexOf("\n            default:", start + marker.length);
    const end = [nextCase, nextDefault].filter((index) => index > start).sort((a, b) => a - b)[0] ?? start + 1200;
    return source.slice(start, end);
}

describe('staff form studio flicker guard', () => {
    

    it('uses surgical DOM updates for toggle actions instead of full refresh', () => {
        const builderJs = readSource('assets/js/pages/form-builder-runtime.js');

        expect(builderJs).toContain('function syncFieldRequiredUi');
        expect(builderJs).toContain('function syncFieldTypeUi');
        expect(builderJs).toContain('function syncFieldRemovePendingUi');
        expect(builderJs).toContain('function syncFieldAdvancedDrawerUi');

        const requiredCase = extractCaseBlock(builderJs, 'toggle-field-required');
        const typeCase = extractCaseBlock(builderJs, 'set-field-type');
        const requestRemoveCase = extractCaseBlock(builderJs, 'request-remove-field');
        const cancelRemoveCase = extractCaseBlock(builderJs, 'cancel-remove-field');

        expect(requiredCase).toContain('syncFieldRequiredUi');
        expect(requiredCase).not.toContain('onRefresh?.()');
        expect(typeCase).toContain('syncFieldTypeUi');
        const typeCaseWithoutSelectRefresh = typeCase.replace(/if \(data\.fieldType === 'select'\) callbacks\.onRefresh\?\.\(\);/g, '');
        expect(typeCaseWithoutSelectRefresh).not.toContain('onRefresh?.()');
        expect(requestRemoveCase).toContain('syncFieldRemovePendingUi');
        expect(requestRemoveCase).not.toContain('onRefresh?.()');
        expect(cancelRemoveCase).toContain('syncFieldRemovePendingUi');
        expect(cancelRemoveCase).not.toContain('onRefresh?.()');
    });

    

});