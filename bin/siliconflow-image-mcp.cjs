#!/usr/bin/env node
// Universal launcher - works on Windows, Linux, macOS
const { spawn } = require('child_process');
const path = require('path');
const { existsSync } = require('fs');

const distPath = path.join(__dirname, '..', 'dist', 'index.js');

if (!existsSync(distPath)) {
    console.error('Error: dist/index.js not found at', distPath);
    process.exit(1);
}

spawn(process.execPath, [distPath, ...process.argv.slice(2)], {
    stdio: 'inherit',
    windowsHide: true
}).on('exit', (code) => process.exit(code));
