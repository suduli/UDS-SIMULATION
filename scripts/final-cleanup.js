/**
 * Final Cleanup - Complete File Organization
 * 
 * This script moves remaining files that weren't caught by the first pass
 * Organizes test cases, reports, and other files by SID
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const c = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    red: '\x1b[31m',
    magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
    console.log(`${c[color]}${message}${c.reset}`);
}

function ensureDir(dir) {
    if (!fs.existsSync(dir) && !DRY_RUN) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function moveFile(source, dest) {
    if (!fs.existsSync(source)) {
        return false;
    }

    if (fs.existsSync(dest)) {
        log(`  ⏭️  Already exists: ${path.basename(dest)}`, 'yellow');
        return false;
    }

    if (DRY_RUN) {
        log(`  [DRY RUN] ${path.basename(source)} → ${path.relative(ROOT_DIR, dest)}`, 'blue');
        return true;
    }

    try {
        ensureDir(path.dirname(dest));
        fs.renameSync(source, dest);
        log(`  ✓ Moved: ${path.basename(source)}`, 'green');
        return true;
    } catch (error) {
        log(`  ✗ Error: ${error.message}`, 'red');
        return false;
    }
}

function moveDirectory(source, dest) {
    if (!fs.existsSync(source)) {
        return false;
    }

    if (fs.existsSync(dest)) {
        log(`  ⏭️  Directory already exists: ${path.basename(dest)}`, 'yellow');
        return false;
    }

    if (DRY_RUN) {
        log(`  [DRY RUN] Move dir: ${path.basename(source)} → ${path.relative(ROOT_DIR, dest)}`, 'blue');
        return true;
    }

    try {
        ensureDir(path.dirname(dest));
        fs.renameSync(source, dest);
        log(`  ✓ Moved directory: ${path.basename(source)}`, 'green');
        return true;
    } catch (error) {
        log(`  ✗ Error: ${error.message}`, 'red');
        return false;
    }
}

// Cleanup rules
const CLEANUP_RULES = [
    // Remaining files in docs/learning that should move
    {
        title: 'Service Documentation (remaining)',
        moves: [
            ['docs/learning/SID_2A_READ_DATA_BY_PERIODIC_IDENTIFIER.md', 'docs/learning/services/SID_2A_READ_DATA_BY_PERIODIC_IDENTIFIER.md'],
            ['docs/learning/SID_2E_WRITE_DATA_BY_IDENTIFIER.md', 'docs/learning/services/SID_2E_WRITE_DATA_BY_IDENTIFIER.md'],
            ['docs/learning/SID_3D_WRITE_MEMORY_BY_ADDRESS.md', 'docs/learning/services/SID_3D_WRITE_MEMORY_BY_ADDRESS.md'],
            ['docs/learning/SID_3E_TESTER_PRESENT.md', 'docs/learning/services/SID_3E_TESTER_PRESENT.md'],
            ['docs/learning/SID_83_PRACTICAL_IMPLEMENTATION_.txt', 'docs/learning/services/SID_83_PRACTICAL_IMPLEMENTATION.txt'],
            ['docs/learning/SID_85_CONTROL_DTC_SETTING_.txt', 'docs/learning/services/SID_85_CONTROL_DTC_SETTING.txt']
        ]
    },
    {
        title: 'Practical Implementation Guides (remaining)',
        moves: [
            ['docs/learning/SID_2A_PRACTICAL_IMPLEMENTATION.md', 'docs/learning/practical/SID_2A_PRACTICAL_IMPLEMENTATION.md'],
            ['docs/learning/SID_2E_PRACTICAL_IMPLEMENTATION.md', 'docs/learning/practical/SID_2E_PRACTICAL_IMPLEMENTATION.md'],
            ['docs/learning/SID_3D_PRACTICAL_IMPLEMENTATION.md', 'docs/learning/practical/SID_3D_PRACTICAL_IMPLEMENTATION.md'],
            ['docs/learning/SID_3E_PRACTICAL_IMPLEMENTATION.md', 'docs/learning/practical/SID_3E_PRACTICAL_IMPLEMENTATION.md'],
            ['docs/learning/DTC_PRACTICAL_IMPLEMENTATION.md', 'docs/learning/dtc/DTC_PRACTICAL_IMPLEMENTATION.md']
        ]
    },
    {
        title: 'Service Interactions (remaining)',
        moves: [
            ['docs/learning/SID_2A_SERVICE_INTERACTIONS.md', 'docs/learning/interactions/SID_2A_SERVICE_INTERACTIONS.md'],
            ['docs/learning/SID_2E_SERVICE_INTERACTIONS.md', 'docs/learning/interactions/SID_2E_SERVICE_INTERACTIONS.md'],
            ['docs/learning/SID_3D_SERVICE_INTERACTIONS.md', 'docs/learning/interactions/SID_3D_SERVICE_INTERACTIONS.md'],
            ['docs/learning/SID_3E_SERVICE_INTERACTIONS.md', 'docs/learning/interactions/SID_3E_SERVICE_INTERACTIONS.md']
        ]
    },
    {
        title: 'DTC Documentation (remaining)',
        moves: [
            ['docs/learning/DTC_Documentation.md', 'docs/learning/dtc/DTC_Documentation.md']
        ]
    },
    {
        title: 'Test Case Documentation → Testing Guides',
        moves: [
            ['docs/learning/SID10_TestCases.md', 'docs/guides/testing/SID10_TestCases.md'],
            ['docs/learning/SID11_TestCases.md', 'docs/guides/testing/SID11_TestCases.md'],
            ['docs/learning/SID19_TestCases.md', 'docs/guides/testing/SID19_TestCases.md'],
            ['docs/learning/SID_2A_VERIFICATION.md', 'docs/guides/testing/SID_2A_VERIFICATION.md'],
            ['docs/learning/SID2E_Verified.md', 'docs/guides/testing/SID2E_Verified.md']
        ]
    },
    {
        title: 'CSV Report Files → Test Reports',
        moves: [
            ['docs/learning/SID_2A_Report.csv', 'tests/reports/SID_2A_Report.csv']
        ]
    },
    {
        title: 'Report Support Directories → Artifacts',
        moves: [
            ['docs/learning/SID2E_Report_files', 'artifacts/reports/SID2E_Report_files'],
            ['docs/learning/SID35_Report_files', 'artifacts/reports/SID35_Report_files'],
            ['docs/learning/SID37_Report_files', 'artifacts/reports/SID37_Report_files'],
            ['docs/learning/SID3D_Report_files', 'artifacts/reports/SID3D_Report_files'],
            ['docs/learning/SID85_Report_files', 'artifacts/reports/SID85_Report_files']
        ]
    },
    {
        title: 'UDS Report File → Test Reports',
        moves: [
            ['docs/learning/uds_report.txt', 'tests/reports/uds_export_report.txt']
        ]
    }
];

function cleanup() {
    log('\n' + '='.repeat(70), 'bright');
    log('  🧹 Final Cleanup - Complete File Organization', 'bright');
    log('='.repeat(70), 'bright');

    if (DRY_RUN) {
        log('\n🔍 DRY RUN MODE - No files will be moved\n', 'yellow');
    }

    let totalMoved = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    CLEANUP_RULES.forEach(rule => {
        log(`\n📂 ${rule.title}`, 'magenta');

        let categoryMoved = 0;

        rule.moves.forEach(([source, dest]) => {
            const sourcePath = path.join(ROOT_DIR, source);
            const destPath = path.join(ROOT_DIR, dest);

            // Check if it's a directory
            if (fs.existsSync(sourcePath) && fs.statSync(sourcePath).isDirectory()) {
                if (moveDirectory(sourcePath, destPath)) {
                    categoryMoved++;
                    totalMoved++;
                } else {
                    totalSkipped++;
                }
            } else {
                if (moveFile(sourcePath, destPath)) {
                    categoryMoved++;
                    totalMoved++;
                } else if (fs.existsSync(destPath)) {
                    totalSkipped++;
                } else {
                    totalErrors++;
                }
            }
        });

        log(`   → ${categoryMoved} items`, categoryMoved > 0 ? 'green' : 'reset');
    });

    // Summary
    log('\n' + '='.repeat(70), 'bright');
    log('  📊 Cleanup Summary', 'bright');
    log('='.repeat(70), 'bright');
    log(`  Items moved:   ${totalMoved}`, totalMoved > 0 ? 'green' : 'reset');
    log(`  Items skipped: ${totalSkipped}`, totalSkipped > 0 ? 'yellow' : 'reset');
    log(`  Errors:        ${totalErrors}`, totalErrors > 0 ? 'red' : 'reset');

    if (DRY_RUN) {
        log('\n💡 Run without --dry-run to apply changes', 'cyan');
    } else {
        log('\n✅ Cleanup complete!', 'green');
    }

    log('');
}

cleanup();
