/**
 * Repository Architectural Cleanup Script
 * Senior Repository Maintainer - Safe, Incremental Cleanup
 * 
 * Phases:
 * 1. Update .gitignore
 * 2. Create new directory structures
 * 3. Move meta documentation
 * 4. Consolidate automation files
 * 5. Verify and prepare for .docs-backup removal
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
    reset: '\x1b[0m', bright: '\x1b[1m', green: '\x1b[32m',
    yellow: '\x1b[33m', blue: '\x1b[34m', cyan: '\x1b[36m',
    red: '\x1b[31m', magenta: '\x1b[35m'
};

function log(msg, color = 'reset') {
    console.log(`${c[color]}${msg}${c.reset}`);
}

function ensureDir(dir) {
    if (!fs.existsSync(dir) && !DRY_RUN) {
        fs.mkdirSync(dir, { recursive: true });
        log(`  Created: ${path.relative(ROOT_DIR, dir)}`, 'cyan');
    }
}

function moveFile(src, dst) {
    if (!fs.existsSync(src)) {
        log(`  ⚠️  Source not found: ${path.basename(src)}`, 'yellow');
        return false;
    }
    if (fs.existsSync(dst)) {
        log(` ⏭️ Already exists: ${path.basename(dst)}`, 'yellow');
        return false;
    }

    if (DRY_RUN) {
        log(`  [DRY] ${path.basename(src)} → ${path.relative(ROOT_DIR, dst)}`, 'blue');
        return true;
    }

    try {
        ensureDir(path.dirname(dst));
        fs.renameSync(src, dst);
        log(`  ✓ ${path.basename(src)}`, 'green');
        return true;
    } catch (e) {
        log(`  ✗ Error: ${e.message}`, 'red');
        return false;
    }
}

function moveDirectory(src, dst) {
    if (!fs.existsSync(src)) {
        log(`  ⚠️  Directory not found: ${path.basename(src)}`, 'yellow');
        return false;
    }
    if (fs.existsSync(dst)) {
        log(`  ⏭️  Directory already exists: ${path.basename(dst)}`, 'yellow');
        return false;
    }

    if (DRY_RUN) {
        log(`  [DRY] Move dir: ${path.basename(src)} → ${path.relative(ROOT_DIR, dst)}`, 'blue');
        return true;
    }

    try {
        ensureDir(path.dirname(dst));
        fs.renameSync(src, dst);
        log(`  ✓ Directory: ${path.basename(src)}`, 'green');
        return true;
    } catch (e) {
        log(`  ✗ Error: ${e.message}`, 'red');
        return false;
    }
}

function cleanup() {
    log('\n' + '='.repeat(70), 'bright');
    log('  🏗️  Repository Architectural Cleanup', 'bright');
    log('='.repeat(70), 'bright');

    if (DRY_RUN) {
        log('\n🔍 DRY RUN MODE - No changes will be made\n', 'yellow');
    }

    let stats = { moved: 0, created: 0, skipped: 0, errors: 0 };

    // ============================================================
    // PHASE 1: Create New Directory Structures
    // ============================================================
    log('\n📁 Phase 1: Creating New Directory Structures', 'magenta');

    const newDirs = [
        'docs/meta',
        'project',
        'project/planning',
        'project/planning/roadmap',
        'project/planning/backlog',
        'project/automation',
        'project/automation/agent',
        'project/automation/claude',
        'artifacts/archive'
    ];

    newDirs.forEach(dir => {
        const fullPath = path.join(ROOT_DIR, dir);
        if (!fs.existsSync(fullPath)) {
            ensureDir(fullPath);
            stats.created++;
        }
    });

    // ============================================================
    // PHASE 2: Move Meta Documentation
    // ============================================================
    log('\n📚 Phase 2: Moving Meta Documentation to docs/meta/', 'magenta');

    const metaDocs = [
        ['REORGANIZATION_README.md', 'docs/meta/reorganization-readme.md'],
        ['FILE_STRUCTURE_SUMMARY.md', 'docs/meta/file-structure-summary.md'],
        ['VISUAL_REORGANIZATION_GUIDE.md', 'docs/meta/visual-reorganization-guide.md'],
        ['DOCUMENTATION_REORGANIZATION_PLAN.md', 'docs/meta/documentation-reorganization-plan.md'],
        ['REORGANIZATION_COMPLETE.md', 'docs/meta/reorganization-complete.md'],
        ['FINAL_CLEANUP_COMPLETE.md', 'docs/meta/final-cleanup-complete.md'],
        ['REPOSITORY_CLEANUP_PLAN.md', 'docs/meta/repository-cleanup-plan.md']
    ];

    metaDocs.forEach(([src, dst]) => {
        if (moveFile(path.join(ROOT_DIR, src), path.join(ROOT_DIR, dst))) {
            stats.moved++;
        } else if (fs.existsSync(path.join(ROOT_DIR, dst))) {
            stats.skipped++;
        }
    });

    // ============================================================
    // PHASE 3: Consolidate Automation Files
    // ============================================================
    log('\n🤖 Phase 3: Consolidating Automation Files', 'magenta');

    // Move .agent to project/automation/agent
    if (moveDirectory(
        path.join(ROOT_DIR, '.agent'),
        path.join(ROOT_DIR, 'project/automation/agent')
    )) {
        stats.moved++;
    } else {
        stats.skipped++;
    }

    // Move .claude to project/automation/claude
    if (moveDirectory(
        path.join(ROOT_DIR, '.claude'),
        path.join(ROOT_DIR, 'project/automation/claude')
    )) {
        stats.moved++;
    } else {
        stats.skipped++;
    }

    // ============================================================
    // PHASE 4: Move Planning Documentation
    // ============================================================
    log('\n📋 Phase 4: Moving Planning Documentation', 'magenta');

    // Move docs/planning to project/planning
    if (fs.existsSync(path.join(ROOT_DIR, 'docs/planning'))) {
        const planningFiles = fs.readdirSync(path.join(ROOT_DIR, 'docs/planning'));

        planningFiles.forEach(file => {
            const src = path.join(ROOT_DIR, 'docs/planning', file);
            const stat = fs.statSync(src);

            if (stat.isFile()) {
                const dst = path.join(ROOT_DIR, 'project/planning/roadmap', file);
                if (moveFile(src, dst)) {
                    stats.moved++;
                } else {
                    stats.skipped++;
                }
            } else if (file === 'backlog') {
                const dst = path.join(ROOT_DIR, 'project/planning/backlog');
                if (moveDirectory(src, dst)) {
                    stats.moved++;
                } else {
                    stats.skipped++;
                }
            }
        });
    }

    // ============================================================
    // PHASE 5: Verification Report for .docs-backup
    // ============================================================
    log('\n🔍 Phase 5: Verifying .docs-backup for Safe Deletion', 'magenta');

    const backupPath = path.join(ROOT_DIR, '.docs-backup');
    const docsPath = path.join(ROOT_DIR, 'docs');

    if (fs.existsSync(backupPath)) {
        log('  .docs-backup found - Ready for deletion after verification', 'yellow');
        log('  Run: node scripts/verify-backup-safe-delete.js', 'cyan');
    } else {
        log('  .docs-backup not found - Already removed', 'green');
    }

    // ============================================================
    // Summary
    // ============================================================
    log('\n' + '='.repeat(70), 'bright');
    log('  📊 Cleanup Summary', 'bright');
    log('='.repeat(70), 'bright');
    log(`  Directories created: ${stats.created}`, stats.created > 0 ? 'green' : 'reset');
    log(`  Items moved:         ${stats.moved}`, stats.moved > 0 ? 'green' : 'reset');
    log(`  Items skipped:       ${stats.skipped}`, stats.skipped > 0 ? 'yellow' : 'reset');
    log(`  Errors:              ${stats.errors}`, stats.errors > 0 ? 'red' : 'reset');

    if (DRY_RUN) {
        log('\n💡 Run without --dry-run to apply changes', 'cyan');
    } else {
        log('\n✅ Phase 1-4 Complete!', 'green');
        log('\n📋 Next Steps:', 'cyan');
        log('  1. Review changes', 'cyan');
        log('  2. Update .gitignore (see repository-cleanup-plan.md)', 'cyan');
        log('  3. Verify .docs-backup can be deleted', 'cyan');
        log('  4. Commit structural changes', 'cyan');
    }

    log('');
}

cleanup();
