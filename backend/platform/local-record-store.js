const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function namespaceSlicePath(statePath, namespace = '') {
    return `${statePath}.${namespace}.json`;
}

class LocalRecordStore {
    constructor(options = {}) {
        this.statePath = String(options.statePath || '').trim();
        if (!this.statePath) {
            throw new Error('A local statePath is required for LocalRecordStore.');
        }
        this.writeQueue = Promise.resolve();
    }

    async init() {
        fs.mkdirSync(path.dirname(this.statePath), { recursive: true });
        if (!fs.existsSync(this.statePath)) {
            await fsp.writeFile(this.statePath, '{}\n', 'utf8');
        }
    }

    async loadState() {
        if (!fs.existsSync(this.statePath)) return null;
        const raw = await fsp.readFile(this.statePath, 'utf8');
        const trimmed = String(raw || '').trim();
        if (!trimmed) return null;
        const state = JSON.parse(trimmed);
        const portalSlicePath = namespaceSlicePath(this.statePath, 'portal');
        if (fs.existsSync(portalSlicePath)) {
            try {
                const portalRaw = await fsp.readFile(portalSlicePath, 'utf8');
                const portalTrimmed = String(portalRaw || '').trim();
                if (portalTrimmed) {
                    state.portal = JSON.parse(portalTrimmed);
                }
            } catch (error) {
                console.error('Failed to load portal state slice:', error?.message || error);
            }
        }
        return state;
    }

    queueWrite(task) {
        this.writeQueue = this.writeQueue
            .catch((error) => {
                console.error('LocalRecordStore write failed:', error?.message || error);
                throw error;
            })
            .then(task);
        return this.writeQueue;
    }

    async writeFileAtomically(targetPath, raw) {
        const tempPath = `${targetPath}.${process.pid}.${Date.now()}.tmp`;
        await fsp.writeFile(tempPath, raw, 'utf8');
        try {
            if (process.platform === 'win32' && fs.existsSync(targetPath)) {
                await fsp.unlink(targetPath);
            }
            await fsp.rename(tempPath, targetPath);
        } catch (error) {
            await fsp.unlink(tempPath).catch(() => null);
            throw error;
        }
    }

    async writeState(state = {}) {
        const nextRaw = `${JSON.stringify(state)}\n`;
        await this.queueWrite(() => this.writeFileAtomically(this.statePath, nextRaw));
    }

    async writeNamespaces(namespaces = {}) {
        const entries = Object.entries(namespaces || {});
        if (!entries.length) return;

        await this.queueWrite(async () => {
            for (const [namespace, payload] of entries) {
                if (namespace === 'portal') {
                    const portalRaw = `${JSON.stringify(payload)}\n`;
                    await this.writeFileAtomically(namespaceSlicePath(this.statePath, 'portal'), portalRaw);
                    continue;
                }
                const existing = (await this.loadState()) || {};
                existing[namespace] = clone(payload);
                await this.writeFileAtomically(this.statePath, `${JSON.stringify(existing)}\n`);
            }
        });
    }

    async close() {
        await this.writeQueue.catch(() => null);
        return Promise.resolve();
    }
}

module.exports = {
    LocalRecordStore
};