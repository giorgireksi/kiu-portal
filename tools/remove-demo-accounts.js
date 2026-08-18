#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const root = path.resolve(__dirname, '..');
const envPath = process.env.KIU_PRODUCTION_ENV_FILE || path.join(root, '.env.production');
const envText = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
for (const line of envText.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]] !== undefined) continue;
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
}

const ids = new Set([
    'admin-testing-econ-professor',
    'admin-testing-econ-student',
    'admin-testing-econ-service',
    'admin-testing-econ-ta',
    'demo-1',
    'demo-2',
    'student-12',
    'ta-54'
]);
const table = process.env.KIU_DATABASE_TABLE_NAME || 'kiu_platform_state_records';
const pool = new Pool({ connectionString: process.env.KIU_DATABASE_URL });

function matches(value) {
    return value != null && ids.has(String(value).trim());
}
function objectBelongsToRemovedAccount(value) {
    if (!value || typeof value !== 'object') return false;
    return ['id', 'userId', 'accountId', 'ownerUserId', 'actorUserId', 'createdBy', 'senderUserId', 'recipientUserId', 'authorUserId'].some(key => matches(value[key]));
}
function prune(value) {
    if (Array.isArray(value)) return value.filter(item => !objectBelongsToRemovedAccount(item)).map(prune);
    if (!value || typeof value !== 'object') return value;
    const output = {};
    for (const [key, child] of Object.entries(value)) {
        if (ids.has(key)) continue;
        output[key] = prune(child);
    }
    return output;
}
function cleanPortalState(state) {
    const next = prune(state || {});
    if (Array.isArray(next.users)) next.users = next.users.filter(item => !matches(item?.id));
    for (const profile of Object.values(next.facultyProfiles || {})) {
        for (const role of ['students', 'professors', 'tas']) {
            if (Array.isArray(profile?.[role])) profile[role] = profile[role].filter(item => !matches(item?.id));
        }
    }
    if (next.studentSchedulesByStudent && typeof next.studentSchedulesByStudent === 'object') {
        for (const id of ids) delete next.studentSchedulesByStudent[id];
    }
    for (const groups of Object.values(next.availableGroups || {})) {
        if (!Array.isArray(groups)) continue;
        groups.forEach(group => {
            if (matches(group.profId) || matches(group.professorId)) {
                group.prof = 'TBD'; group.profId = ''; group.professorId = '';
            }
            const taIds = Array.isArray(group.taIds) ? group.taIds.filter(id => !matches(id)) : [];
            if (matches(group.taId) || matches(group.assistantId) || matches(group.taUserId)) {
                group.taId = taIds[0] || ''; group.assistantId = ''; group.taUserId = '';
                group.ta = taIds.length ? group.ta : '';
            }
            group.taIds = taIds;
        });
    }
    return next;
}

(async () => {
    if (!process.env.KIU_DATABASE_URL) throw new Error('KIU_DATABASE_URL is required');
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const rows = await client.query(`SELECT namespace, payload FROM ${table}`);
        const state = Object.fromEntries(rows.rows.map(row => [row.namespace, row.payload]));
        for (const namespace of ['accounts', 'authCredentials', 'people']) {
            if (state[namespace] && typeof state[namespace] === 'object') {
                for (const id of ids) delete state[namespace][id];
            }
        }
        if (state.sessions && typeof state.sessions === 'object') {
            for (const [key, session] of Object.entries(state.sessions)) {
                if (matches(session?.userId) || matches(session?.impersonatedUserId)) delete state.sessions[key];
            }
        }
        if (state.portal?.state) state.portal.state = cleanPortalState(state.portal.state);
        for (const namespace of Object.keys(state)) {
            await client.query(`UPDATE ${table} SET payload = $2::jsonb, updated_at = NOW() WHERE namespace = $1`, [namespace, JSON.stringify(state[namespace])]);
        }
        await client.query('COMMIT');
        console.log(`Removed ${ids.size} demo/testing accounts from production state.`);
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
})().catch(error => { console.error(error.message); process.exit(1); });
