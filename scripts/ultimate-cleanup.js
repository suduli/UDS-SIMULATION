/**
 * Ultimate Cleanup - Moves ALL remaining misplaced files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const c = {
    reset: '\x1b[0m', bright: '\x1b[1m', green: '\x1b[32m',
    yellow: '\x1b[33m', blue: '\x1b[34m', cyan: '\x1b[36m',
    red: '\x1b[31m', magenta: '\x1b[35m'
};

function log(msg, color = 'reset') {
    console.log(`${c[color]}${msg}${c.reset}`);
}

function moveFile(src, dst) {
    if (!fs.existsSync(src)) return false;
    if (fs.existsSync(dst)) return false;

    try {
        const dir = path.dirname(dst);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.renameSync(src, dst);
        log(`  ✓ ${path.basename(src)}`, 'green');
        return true;
    } catch (e) {
        log(`  ✗ ${e.message}`, 'red');
        return false;
    }
}

// Move remaining test file
log('\n📂 Moving Remaining Test Files', 'magenta');
const sid22Test = path.join(ROOT_DIR, 'tests/SID_22_Test_Cases.json');
const sid22Dest = path.join(ROOT_DIR, 'tests/test-data/sid-22/SID_22_Test_Cases.json');
moveFile(sid22Test, sid22Dest);

log('\n✅ Complete!\n', 'green');
