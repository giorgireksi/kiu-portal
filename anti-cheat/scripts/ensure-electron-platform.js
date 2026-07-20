#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const { downloadArtifact } = require('@electron/get');
const extract = require('extract-zip');

const ROOT = path.resolve(__dirname, '..');
const ELECTRON_DIR = path.join(ROOT, 'node_modules', 'electron');
const DIST_DIR = path.join(ELECTRON_DIR, 'dist');
const PATH_FILE = path.join(ELECTRON_DIR, 'path.txt');
const VERSION_FILE = path.join(DIST_DIR, 'version');
const { version } = require(path.join(ELECTRON_DIR, 'package.json'));

function getPlatformExecutable() {
    if (process.platform === 'win32') return 'electron.exe';
    if (process.platform === 'darwin') return path.join('Electron.app', 'Contents', 'MacOS', 'Electron');
    return 'electron';
}

function getExecutablePath() {
    return path.join(DIST_DIR, getPlatformExecutable());
}

function readPathFile() {
    try {
        return String(fs.readFileSync(PATH_FILE, 'utf8') || '').trim();
    } catch (error) {
        return '';
    }
}

function hasWrongPlatformBinary() {
    const expected = getPlatformExecutable();
    if (process.platform !== 'win32' && fs.existsSync(path.join(DIST_DIR, 'electron.exe'))) {
        return true;
    }
    if (process.platform === 'win32' && fs.existsSync(path.join(DIST_DIR, 'electron')) && !fs.existsSync(path.join(DIST_DIR, 'electron.exe'))) {
        return true;
    }
    const executablePath = getExecutablePath();
    if (!fs.existsSync(executablePath)) {
        return true;
    }
    if (readPathFile() !== expected) {
        return true;
    }
    try {
        const distVersion = String(fs.readFileSync(VERSION_FILE, 'utf8') || '').trim().replace(/^v/, '');
        if (distVersion !== String(version).replace(/^v/, '')) {
            return true;
        }
    } catch (error) {
        return true;
    }
    return false;
}

function hasUnzipCli() {
    try {
        execFileSync('unzip', ['-v'], { stdio: 'ignore' });
        return true;
    } catch (error) {
        return false;
    }
}

function extractZipWithUnzip(zipPath, destDir) {
    execFileSync('unzip', ['-oq', zipPath, '-d', destDir], { stdio: 'inherit' });
}

async function extractElectronZip(zipPath, destDir) {
    if (process.platform !== 'win32' && hasUnzipCli()) {
        extractZipWithUnzip(zipPath, destDir);
        return;
    }
    await extract(zipPath, { dir: destDir });
    if (fs.existsSync(getExecutablePath())) {
        return;
    }
    if (process.platform === 'win32' || !hasUnzipCli()) {
        throw new Error('Electron archive extraction was incomplete and unzip is unavailable.');
    }
    console.log('[anti-cheat] extract-zip was incomplete; retrying with unzip...');
    extractZipWithUnzip(zipPath, destDir);
}

async function installElectronForPlatform() {
    const platform = process.env.npm_config_platform || process.platform;
    const arch = process.env.npm_config_arch || process.arch;
    console.log(`[anti-cheat] Installing Electron ${version} for ${platform}-${arch}...`);
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
    fs.mkdirSync(DIST_DIR, { recursive: true });
    const zipPath = await downloadArtifact({
        version,
        artifactName: 'electron',
        platform,
        arch,
        force: true
    });
    await extractElectronZip(zipPath, DIST_DIR);
    const executableName = getPlatformExecutable();
    fs.writeFileSync(PATH_FILE, executableName.includes(path.sep) ? path.basename(executableName) : executableName);
    if (process.platform === 'darwin') {
        fs.writeFileSync(PATH_FILE, 'Electron.app/Contents/MacOS/Electron');
    }
    const versionSource = path.join(DIST_DIR, 'version');
    if (!fs.existsSync(versionSource)) {
        fs.writeFileSync(VERSION_FILE, version);
    }
    const executablePath = getExecutablePath();
    if (!fs.existsSync(executablePath)) {
        throw new Error(`Electron executable was not found at ${executablePath}`);
    }
    if (process.platform !== 'win32') {
        fs.chmodSync(executablePath, 0o755);
    }
    console.log(`[anti-cheat] Electron ready at ${executablePath}`);
}

async function main() {
    if (!fs.existsSync(ELECTRON_DIR)) {
        throw new Error('electron package is missing. Run npm install in anti-cheat/.');
    }
    if (hasWrongPlatformBinary()) {
        await installElectronForPlatform();
        return;
    }
    const executablePath = getExecutablePath();
    if (process.platform !== 'win32') {
        fs.chmodSync(executablePath, 0o755);
    }
    const pathValue = process.platform === 'darwin'
        ? 'Electron.app/Contents/MacOS/Electron'
        : (process.platform === 'win32' ? 'electron.exe' : 'electron');
    fs.writeFileSync(PATH_FILE, pathValue);
    console.log(`[anti-cheat] Electron already installed for ${os.platform()}.`);
}

main().catch((error) => {
    console.error('[anti-cheat] Electron platform setup failed:', error?.message || error);
    process.exit(1);
});
