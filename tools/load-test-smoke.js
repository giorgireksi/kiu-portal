const http = require('http');
const https = require('https');
const { URL } = require('url');

const baseUrl = String(process.env.KIU_LOAD_TEST_BASE_URL || process.argv[2] || 'http://127.0.0.1:48933').replace(/\/$/, '');
const requests = Math.max(1, Number(process.env.KIU_LOAD_TEST_REQUESTS || process.argv[3] || 200));
const concurrency = Math.max(1, Number(process.env.KIU_LOAD_TEST_CONCURRENCY || process.argv[4] || 25));
const paths = String(process.env.KIU_LOAD_TEST_PATHS || '/health,/ready,/api/platform/status')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);

let completed = 0;
let started = 0;
let failed = 0;
const latencies = [];
const startedAt = Date.now();

function requestOnce(target) {
    return new Promise(resolve => {
        const url = new URL(target);
        const client = url.protocol === 'https:' ? https : http;
        const begin = Date.now();
        const req = client.get(url, response => {
            response.resume();
            response.on('end', () => {
                const ms = Date.now() - begin;
                latencies.push(ms);
                if (response.statusCode < 200 || response.statusCode >= 400) failed += 1;
                resolve();
            });
        });
        req.setTimeout(10000, () => {
            failed += 1;
            req.destroy(new Error('timeout'));
        });
        req.on('error', () => {
            failed += 1;
            resolve();
        });
    });
}

async function worker() {
    while (started < requests) {
        const index = started;
        started += 1;
        const path = paths[index % paths.length];
        await requestOnce(`${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`);
        completed += 1;
    }
}

(async () => {
    await Promise.all(Array.from({ length: Math.min(concurrency, requests) }, worker));
    latencies.sort((a, b) => a - b);
    const elapsed = Date.now() - startedAt;
    const percentile = p => latencies[Math.min(latencies.length - 1, Math.floor((p / 100) * latencies.length))] || 0;
    const rps = completed / Math.max(0.001, elapsed / 1000);
    console.log(JSON.stringify({
        baseUrl,
        requests,
        concurrency,
        completed,
        failed,
        elapsedMs: elapsed,
        requestsPerSecond: Number(rps.toFixed(2)),
        latencyMs: {
            p50: percentile(50),
            p95: percentile(95),
            p99: percentile(99)
        }
    }, null, 2));
    if (failed > 0) process.exit(1);
})();
