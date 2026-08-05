import { describe, expect, it } from 'vitest';
import {
    readLmsLiveQuizSource,
    readLmsLiveQuizUiChain,
    readLmsLiveQuizAccessRuntime,
    readLmsLiveQuizWorkspaceRuntime,
    readLmsLiveQuizSessionRuntime,
    readLmsLiveQuizUiStaffRuntime,
    readLmsLiveQuizMainUiRuntime
} from './helpers/lms-live-quiz-source.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function extractFunctionBody(source, functionName) {
    const match = source.match(new RegExp(`function ${functionName}[\\s\\S]*?\\n\\}`));
    return match ? match[0] : '';
}

describe('LMS live quiz session auto-save', () => {
    it('removes Save details and wires title/topic inputs for auto-save', () => {
        const uiSource = readLmsLiveQuizUiChain();

        expect(uiSource).not.toContain('Save details');
        expect(uiSource).toContain("data-lms-input=\"updateLmsLiveSessionField(${lmsInlineArg(resourceKey)}, 'title', this.value)\"");
        expect(uiSource).toContain("data-lms-input=\"updateLmsLiveSessionField(${lmsInlineArg(resourceKey)}, 'topic', this.value)\"");
    });

    it('persists session fields on input with debounced workspace sync', () => {
        const uiSource = readLmsLiveQuizUiChain();
        const updateBlock = extractFunctionBody(uiSource, 'updateLmsLiveSessionField');

        expect(updateBlock).toContain("['title', 'topic'].includes(normalizedField)");
        expect(updateBlock).toContain("saveLmsLiveQuizChange(canonicalKey, 'session-details-updated')");
        expect(updateBlock).toContain('patchLmsLiveSessionSwitcherOptionLabel');
    });

    it('flushes DOM session details before switching or creating sessions', () => {
        const uiSource = readLmsLiveQuizUiChain();

        const switchBlock = extractFunctionBody(uiSource, 'setLmsLiveActiveSession');
        const createBlock = extractFunctionBody(uiSource, 'createLmsLiveSession');
        const startBlock = extractFunctionBody(uiSource, 'startLmsLiveSession');

        expect(switchBlock).toContain('syncLmsLiveSessionDetailsFromDom(canonicalKey)');
        expect(createBlock).toContain('syncLmsLiveSessionDetailsFromDom(canonicalKey)');
        expect(startBlock).toContain('syncLmsLiveSessionDetailsFromDom(resourceKey)');
    });

    it('keeps title and topic on the per-session model instead of draft snapshots', () => {
        const uiSource = readLmsLiveQuizUiChain();
        const captureBlock = extractFunctionBody(uiSource, 'captureLmsLiveQuizDraftFields');
        const restoreBlock = extractFunctionBody(uiSource, 'restoreLmsLiveQuizDraftFields');

        expect(captureBlock).not.toContain('lms-live-title-');
        expect(captureBlock).not.toContain('lms-live-topic-');
        expect(restoreBlock).not.toContain('lms-live-title-');
        expect(restoreBlock).not.toContain('lms-live-topic-');
    });

    it('exports auto-save handlers for delegated LMS input events', () => {
        const uiSource = readLmsLiveQuizUiChain();

        expect(uiSource).toContain('updateLmsLiveSessionField,');
        expect(uiSource).toContain('function syncLmsLiveSessionDetailsFromDom');
    });
});