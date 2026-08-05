const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
    return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

const compose = read('docker-compose.production.yml');
const dockerfile = read('Dockerfile');
const caddyfile = read('infra/caddy/Caddyfile');
const coturn = read('infra/coturn/turnserver.conf.template');
const envExample = read('.env.production.example');

const checks = [
    ['production Compose file exists', compose.length > 0],
    ['Docker build source directories exist', ['backend', 'kiu-realtime-bridge', 'tools', 'infra', 'assets'].every(directory => fs.existsSync(path.join(root, directory)))],
    ['Compose has the required production services', ['caddy:', 'portal-backend:', 'postgres:', 'coturn:'].every(value => compose.includes(value))],
    ['Compose does not start unused Redis or MinIO services', !/^\s{2}(redis|minio):/m.test(compose)],
    ['backend uses the canonical internal port', compose.includes('expose:\n      - "47833"')],
    ['backend healthcheck uses the canonical internal port', compose.includes('http://127.0.0.1:47833/ready')],
    ['Caddy proxies the canonical internal port', caddyfile.includes('reverse_proxy @api portal-backend:47833')],
    ['Docker image exposes the canonical internal port', dockerfile.includes('EXPOSE 47833')],
    ['Docker image runs as the unprivileged node user', dockerfile.includes('\nUSER node\n') && !dockerfile.includes('su-exec')],
    ['container runs migrations before the platform server', dockerfile.includes('node tools/migrate-postgres.js && exec node backend/platform/server.js')],
    ['backend drops Linux capabilities', compose.includes('cap_drop:\n      - ALL')],
    ['production storage uses PostgreSQL', envExample.includes('KIU_STORAGE_DRIVER=postgres') && envExample.includes('KIU_ALLOW_LOCAL_PLATFORM_FALLBACK=false')],
    ['production uses one public origin', envExample.includes('KIU_PUBLIC_APP_URL=https://lms.youruniversity.edu')
        && envExample.includes('KIU_PUBLIC_BACKEND_URL=https://lms.youruniversity.edu')],
    ['Compose postgres variables are documented', ['POSTGRES_DB=', 'POSTGRES_USER=', 'POSTGRES_PASSWORD=', 'KIU_DATABASE_URL=', 'KIU_DATABASE_TABLE_NAME='].every(value => envExample.includes(value))],
    ['calls and push configuration are documented', ['KIU_TURN_URLS=', 'KIU_TURN_USERNAME=', 'KIU_TURN_CREDENTIAL=', 'KIU_TURN_CERT_HOST_PATH=', 'KIU_TURN_KEY_HOST_PATH=', 'KIU_VAPID_PUBLIC_KEY=', 'KIU_VAPID_PRIVATE_KEY='].every(value => envExample.includes(value))],
        ['native Android push configuration is documented and mounted', ['KIU_FIREBASE_PROJECT_ID=', 'KIU_FIREBASE_SERVICE_ACCOUNT_FILE=', 'KIU_FIREBASE_SERVICE_ACCOUNT_HOST_PATH='].every(value => envExample.includes(value)) && compose.includes('firebase_service_account') && compose.includes('file: ${KIU_FIREBASE_SERVICE_ACCOUNT_HOST_PATH')],
    ['coturn TLS certificate paths are wired', coturn.includes('cert=__TURN_CERT_FILE__')
        && coturn.includes('pkey=__TURN_KEY_FILE__')
        && compose.includes('__TURN_CERT_FILE__')
        && compose.includes('__TURN_KEY_FILE__')],
    ['Caddy hides repository-only paths', ['/backend', '/.env.*', '/node_modules', '/tools', '/test'].every(value => caddyfile.includes(`hide ${value}`))]
];

const failed = checks.filter(([, passed]) => !passed);
checks.forEach(([label, passed]) => console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`));
if (failed.length) {
    console.error(`\nProduction stack contract failed: ${failed.length} check(s).`);
    process.exit(1);
}
console.log(`\nProduction stack contract passed: ${checks.length} checks.`);
