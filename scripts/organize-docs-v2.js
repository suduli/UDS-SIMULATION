/**
 * Enhanced Documentation Organization Script
 * 
 * Organizes markdown documentation into a clean, logical structure
 * Separates test data, reports, and other file types appropriately
 * 
 * Usage: node organize-docs-v2.js [--dry-run] [--verbose]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const ROOT_DIR = path.resolve(__dirname, '..');
const BACKUP_DIR = path.join(ROOT_DIR, '.docs-backup');
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const VERBOSE = args.includes('--verbose');

// Colors
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

/**
 * Reorganization Map
 * Maps patterns to destination directories
 */
const REORGANIZATION_MAP = {
    // Learning materials - reorganize by topic
    'docs/learning/services': {
        pattern: /^SID_\d+_(?!PRACTICAL|SERVICE)(.*?)\.md$/,
        exclude: ['SID_83_PRACTICAL_IMPLEMENTATION_.txt', 'SID_85_CONTROL_DTC_SETTING_.txt'],
        description: 'UDS Service documentation'
    },
    'docs/learning/dtc': {
        pattern: /^DTC_(FUNDAMENTALS|INTERPRETATION|CLEARING|DOCUMENTATION|FAULT|IMPLEMENTATION).*\.md$/,
        description: 'DTC learning materials'
    },
    'docs/learning/practical': {
        pattern: /^SID_\d+_PRACTICAL.*\.md$/,
        description: 'Practical implementation guides'
    },
    'docs/learning/interactions': {
        pattern: /^SID_\d+_SERVICE_INTERACTIONS\.md$/,
        description: 'Service interaction documentation'
    },
    'docs/learning/reference': {
        pattern: /^SID\d+_Reference\.md$/,
        description: 'Quick reference guides'
    },

    // Test data - move to tests directory
    'tests/test-data/sid-10': {
        pattern: /^SID10_TestCases.*\.json$/,
        description: 'SID 10 test cases'
    },
    'tests/test-data/sid-11': {
        pattern: /^SID11_TestCases.*\.json$/,
        description: 'SID 11 test cases'
    },
    'tests/test-data/sid-14': {
        pattern: /^SID14_TestCases.*\.json$/,
        description: 'SID 14 test cases'
    },
    'tests/test-data/sid-19': {
        pattern: /^SID19_TestCases.*\.json$/,
        description: 'SID 19 test cases'
    },
    'tests/test-data/sid-22': {
        pattern: /^SID22_TestCases.*\.json$/,
        description: 'SID 22 test cases'
    },
    'tests/test-data/sid-23': {
        pattern: /^SID23_TestCases.*\.json$/,
        description: 'SID 23 test cases'
    },
    'tests/test-data/sid-27': {
        pattern: /^SID27_TestCases.*\.json$/,
        description: 'SID 27 test cases'
    },
    'tests/test-data/sid-28': {
        pattern: /^SID28_TestCases.*\.json$/,
        description: 'SID 28 test cases'
    },
    'tests/test-data/sid-2a': {
        pattern: /^SID2A_TestCases.*\.json$/,
        description: 'SID 2A test cases'
    },
    'tests/test-data/sid-2e': {
        pattern: /^SID2E_TestCases.*\.json$/,
        description: 'SID 2E test cases'
    },
    'tests/test-data/sid-31': {
        pattern: /^SID31_TestCases.*\.json$/,
        description: 'SID 31 test cases'
    },
    'tests/test-data/sid-34': {
        pattern: /^SID34_TestCases.*\.json$/,
        description: 'SID 34 test cases'
    },
    'tests/test-data/sid-35': {
        pattern: /^SID35_TestCases.*\.json$/,
        description: 'SID 35 test cases'
    },
    'tests/test-data/sid-36': {
        pattern: /^SID36_TestCases.*\.json$/,
        description: 'SID 36 test cases'
    },
    'tests/test-data/sid-37': {
        pattern: /^SID37_TestCases.*\.json$/,
        description: 'SID 37 test cases'
    },
    'tests/test-data/sid-3d': {
        pattern: /^SID3D_TestCases.*\.json$/,
        description: 'SID 3D test cases'
    },
    'tests/test-data/sid-3e': {
        pattern: /^SID3E_TestCases.*\.json$/,
        description: 'SID 3E test cases'
    },
    'tests/test-data/sid-83': {
        pattern: /^SID83.*TestCases.*\.json$/,
        description: 'SID 83 test cases'
    },
    'tests/test-data/sid-85': {
        pattern: /^SID85_TestCases.*\.json$/,
        description: 'SID 85 test cases'
    },

    // Test reports - CSV format
    'tests/reports': {
        pattern: /^SID_\d+_REPORT\.csv$|^SID_\d+_Test_Report\.json$|^terminal_report.*\.csv$/,
        description: 'Test execution reports (CSV/JSON)'
    },

    // HTML Reports - artifacts
    'artifacts/reports': {
        pattern: /^SID\d+[A-Z]?_Report\.html$/,
        description: 'HTML test reports'
    },

    // Build outputs and logs
    'artifacts/logs': {
        pattern: /^(output|build_error|debug|job-logs).*\.(txt|log)$/,
        description: 'Build and debug logs'
    },

    // Utility scripts
    'scripts/utils': {
        pattern: /^security-key-calculator\.js$/,
        description: 'Utility scripts'
    },

    // Guides - reorganize by subtopic
    'docs/guides/implementation': {
        files: [
            'IMPLEMENTATION_GUIDE.md',
            'QUICK_IMPLEMENTATION_GUIDE.md',
            'IMPLEMENTATION_SUMMARY.md',
            'IMPLEMENTATION_PROGRESS.md',
            'IMPLEMENTATION_REVIEW.md',
            'P2-04_IMPLEMENTATION_SUMMARY.md',
            'DOCS_QUICK_REFERENCE.md',
            'DOCUMENTATION_GUIDE.md'
        ],
        description: 'Implementation guides'
    },
    'docs/guides/testing': {
        files: [
            'SEQUENCE_BUILDER_TESTING_GUIDE.md',
            'SID_22_Test_Guide.md',
            'SID_3E_VERIFICATION.md',
            'SID2A_VERIFICATION.md',
            'IN_APP_DIAGNOSTIC_GUIDE.md',
            'EXECUTION_PANEL_FIX_TEST.md'
        ],
        description: 'Testing guides'
    },
    'docs/guides/troubleshooting': {
        files: [
            'BUILD_FIXES.md',
            'EXECUTION_STUCK_STATE_FIX.md',
            'UDS_SEQUENCE_TROUBLESHOOTING.md',
            'RESPONSE_DATA_STRETCHING_FIX.md',
            'TROUBLESHOOTING_RESPONSE_DATA_FIX.md',
            'TEMPLATE_UPDATES_NRC_FIX.md',
            'SEQUENCE_EXECUTION_FIX.md'
        ],
        description: 'Troubleshooting guides'
    },
    'docs/guides/development': {
        files: [
            'STORYBOOK_GUIDE.md',
            'ADVANCED_HEX_EDITOR_IMPLEMENTATION.md',
            'ADVANCED_HEX_EDITOR_USER_GUIDE.md',
            'ADVANCED_HEX_EDITOR_VISUAL_GUIDE.md',
            'RESPONSE_DATA_DISPLAY_GUIDE.md',
            'SEQUENCE_BUILDER_IMPLEMENTATION_SUMMARY.md',
            'TUTORIAL_SYSTEM_GUIDE.md',
            'DOCUMENTATION_ORGANIZATION_COMPLETE.md',
            'DOCUMENTATION_REORGANIZATION_SUMMARY.md',
            'DOCUMENTATION_VISUAL_GUIDE.md'
        ],
        description: 'Development guides'
    }
};

/**
 * Utility Functions
 */
function log(message, color = 'reset') {
    console.log(`${c[color]}${message}${c.reset}`);
}

function logVerbose(message, color = 'cyan') {
    if (VERBOSE) {
        log(`  ${message}`, color);
    }
}

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        if (!DRY_RUN) {
            fs.mkdirSync(dir, { recursive: true });
        }
        logVerbose(`Created directory: ${path.relative(ROOT_DIR, dir)}`);
    }
}

function findFiles(dir, results = []) {
    if (!fs.existsSync(dir)) return results;

    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);

        // Skip node_modules, .git, dist, and backup dirs
        if (file === 'node_modules' || file === '.git' ||
            file === 'dist' || file === '.docs-backup' ||
            file === '.vite' || file === '.cache') {
            return;
        }

        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            findFiles(filePath, results);
        } else {
            results.push(filePath);
        }
    });

    return results;
}

function moveFile(source, dest) {
    if (!fs.existsSync(source)) {
        logVerbose(`⚠️  Source not found: ${path.basename(source)}`, 'yellow');
        return false;
    }

    if (fs.existsSync(dest)) {
        logVerbose(`⏭️  Already exists: ${path.basename(dest)}`, 'yellow');
        return false;
    }

    if (DRY_RUN) {
        log(`  [DRY RUN] ${path.basename(source)} → ${path.relative(ROOT_DIR, dest)}`, 'blue');
        return true;
    }

    try {
        ensureDir(path.dirname(dest));
        fs.renameSync(source, dest);
        logVerbose(`✓ Moved: ${path.basename(source)}`);
        return true;
    } catch (error) {
        log(`  ✗ Error: ${error.message}`, 'red');
        return false;
    }
}

/**
 * Main reorganization logic
 */
function reorganize() {
    log('\n' + '='.repeat(70), 'bright');
    log('  📚 Enhanced Documentation Reorganization', 'bright');
    log('='.repeat(70), 'bright');

    if (DRY_RUN) {
        log('\n🔍 DRY RUN MODE - No files will be moved\n', 'yellow');
    }

    let stats = { moved: 0, skipped: 0, errors: 0 };

    // Find all files in docs/learning and artifacts/outputs
    const docsLearning = path.join(ROOT_DIR, 'docs', 'learning');
    const artifactsOutputs = path.join(ROOT_DIR, 'artifacts', 'outputs');
    const guidesDir = path.join(ROOT_DIR, 'docs', 'guides');

    const allFiles = [
        ...findFiles(docsLearning),
        ...findFiles(artifactsOutputs),
        ...findFiles(guidesDir)
    ];

    log(`\n📊 Found ${allFiles.length} files to process\n`, 'cyan');

    // Process each reorganization rule
    Object.entries(REORGANIZATION_MAP).forEach(([destDir, rule]) => {
        log(`\n📂 ${destDir}`, 'magenta');
        log(`   ${rule.description}`, 'cyan');

        let categoryMoved = 0;

        // Handle pattern-based matching
        if (rule.pattern) {
            allFiles.forEach(filePath => {
                const fileName = path.basename(filePath);

                // Check exclusions
                if (rule.exclude && rule.exclude.includes(fileName)) {
                    return;
                }

                // Check pattern match
                if (rule.pattern.test(fileName)) {
                    const destPath = path.join(ROOT_DIR, destDir, fileName);
                    if (moveFile(filePath, destPath)) {
                        categoryMoved++;
                        stats.moved++;
                    } else if (fs.existsSync(destPath)) {
                        stats.skipped++;
                    } else {
                        stats.errors++;
                    }
                }
            });
        }

        // Handle explicit file list
        if (rule.files) {
            rule.files.forEach(fileName => {
                // Find file in allFiles
                const filePath = allFiles.find(f => path.basename(f) === fileName);

                if (filePath) {
                    const destPath = path.join(ROOT_DIR, destDir, fileName);
                    if (moveFile(filePath, destPath)) {
                        categoryMoved++;
                        stats.moved++;
                    } else if (fs.existsSync(destPath)) {
                        stats.skipped++;
                    } else {
                        stats.errors++;
                    }
                }
            });
        }

        if (categoryMoved > 0 || VERBOSE) {
            log(`   ✓ ${categoryMoved} files`, categoryMoved > 0 ? 'green' : 'reset');
        }
    });

    // Summary
    log('\n' + '='.repeat(70), 'bright');
    log('  📊 Summary', 'bright');
    log('='.repeat(70), 'bright');
    log(`  Files moved:   ${stats.moved}`, stats.moved > 0 ? 'green' : 'reset');
    log(`  Files skipped: ${stats.skipped}`, stats.skipped > 0 ? 'yellow' : 'reset');
    log(`  Errors:        ${stats.errors}`, stats.errors > 0 ? 'red' : 'reset');

    if (DRY_RUN) {
        log('\n💡 Run without --dry-run to apply changes', 'cyan');
    } else {
        log('\n✅ Reorganization complete!', 'green');
    }

    log('');
}

// Run
reorganize();
