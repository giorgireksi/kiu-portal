const fs = require('fs');
const path = require('path');

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

class LocalRecordStore {
    constructor(options = {}) {
        this.statePath = String(options.statePath || '').trim();
        if (!this.statePath) {
            throw new Error('A local statePath is required for LocalRecordStore.');
        }
    }

    async init() {
        fs.mkdirSync(path.dirname(this.statePath), { recursive: true });
        if (!fs.existsSync(this.statePath)) {
            fs.writeFileSync(this.statePath, '{}\n', 'utf8');
        }
    }

    async loadState() {
        if (!fs.existsSync(this.statePath)) return null;
        const raw = fs.readFileSync(this.statePath, 'utf8');
        const trimmed = String(raw || '').trim();
        if (!trimmed) return null;
        return JSON.parse(trimmed);
    }

    async writeState(state = {}) {
        const nextRaw = `${JSON.stringify(clone(state), null, 2)}\n`;
        const tempPath = `${this.statePath}.tmp`;
        fs.writeFileSync(tempPath, nextRaw, 'utf8');
        fs.renameSync(tempPath, this.statePath);
    }

    async close() {
        return Promise.resolve();
    }
}

module.exports = {
    LocalRecordStore
};
