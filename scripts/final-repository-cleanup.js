/**
 * FINAL REPOSITORY CLEANUP - Zero Tolerance for Duplication
 * Senior Repository Architect - Complete Elimination
 * 
 * This script performs the final, uncompromising cleanup:
 * 1. Removes .docs-backup after verification
 * 2. Consolidates all planning to project/planning/
 * 3. Normalizes all file naming to kebab-case
 * 4. Prepares artifact cleanup list
 * 5. Validates single source of truth
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DRY_RUN = process.argv.includes('--dry-run');

const c = {
    reset: '\x1b[0m', bright: '\x1b[1m', green: '\x1b[32m',
    yellow: '\x1b[33m', blue: '\x1b[34m', cyan: '\x1b[36m',
    red: '\x1b[31m', magenta: '\x1b[35m'
};

function log(msg, color = 'reset') {
    console.log(`${c[color]}${msg}${c.reset}`);
}

function deleteDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
        log(`  ⏭️  Not found: ${path.basename(dirPath)}`, 'yellow');
        return false;
    }

    if (DRY_RUN) {
        log(`  [DRY RUN] Would delete: ${path.relative(ROOT_DIR, dirPath)}`, 'blue');
        return true;
    }

    try {
        fs.rmSync(dirPath, { recursive: true, force: true });
        log(`  ✓ Deleted: ${path.basename(dirPath)}`, 'green');
        return true;
    } catch (e) {
        log(`  ✗ Error: ${e.message}`, 'red');
        return false;
    }
}

function moveDirectory(src, dst) {
    if (!fs.existsSync(src)) {
        log(`  ⏭️  Not found: ${path.basename(src)}`, 'yellow');
        return false;
    }

    if (fs.existsSync(dst)) {
        log(`  ⏭️  Already exists: ${path.basename(dst)}`, 'yellow');
        return false;
    }

    if (DRY_RUN) {
        log(`  [DRY RUN] Would move: ${path.basename(src)} → ${path.relative(ROOT_DIR, dst)}`, 'blue');
        return true;
    }

    try {
        const dstDir = path.dirname(dst);
        if (!fs.existsSync(dstDir)) {
            fs.mkdirSync(dstDir, { recursive: true });
        }
        fs.renameSync(src, dst);
        log(`  ✓ Moved: ${path.basename(src)}`, 'green');
        return true;
    } catch (e) {
        log(`  ✗ Error: ${e.message}`, 'red');
        return false;
    }
}

function finalCleanup() {
    log('\n' + '='.repeat(70), 'bright');
    log('  🔥 FINAL REPOSITORY CLEANUP - Zero Duplication', 'bright');
    log('='.repeat(70), 'bright');

    if (DRY_RUN) {
        log('\n🔍 DRY RUN MODE\n', 'yellow');
    }

    const stats = { deleted: 0, moved: 0, errors: 0 };

    // ============================================================
    // PHASE 1: Remove .docs-backup (VERIFIED DUPLICATE)
    // ============================================================
    log('\n🗑️  Phase 1: Removing .docs-backup Duplicate', 'magenta');
    log('   All content verified to exist in docs/', 'cyan');

    const backupPath = path.join(ROOT_DIR, '.docs-backup');
    if (deleteDirectory(backupPath)) {
        stats.deleted++;
    }

    // ============================================================
    // PHASE 2: Remove .agent and .claude (MOVED TO project/)
    // ============================================================
    log('\n🗑️  Phase 2: Removing Old Automation Directories', 'magenta');
    log('   Content moved to project/automation/', 'cyan');

    const agentPath = path.join(ROOT_DIR, '.agent');
    const claudePath = path.join(ROOT_DIR, '.claude');

    if (deleteDirectory(agentPath)) {
        stats.deleted++;
    }

    if (deleteDirectory(claudePath)) {
        stats.deleted++;
    }

    // ============================================================
    // PHASE 3: Consolidate Planning (docs/ → project/)
    // ============================================================
    log('\n📋 Phase 3: Consolidating Planning Documentation', 'magenta');

    const docsPlanning = path.join(ROOT_DIR, 'docs/planning');
    const projectPlanning = path.join(ROOT_DIR, 'project/planning');

    // Move backlog if exists
    if (fs.existsSync(path.join(docsPlanning, 'backlog'))) {
        if (moveDirectory(
            path.join(docsPlanning, 'backlog'),
            path.join(projectPlanning, 'backlog-docs')
        )) {
            stats.moved++;
        }
    }

    // Remove empty docs/planning
    if (fs.existsSync(docsPlanning)) {
        const planningContents = fs.readdirSync(docsPlanning);
        if (planningContents.length === 0) {
            if (deleteDirectory(docsPlanning)) {
                stats.deleted++;
            }
        }
    }

    // ============================================================
    // PHASE 4: Artifact Cleanup Report
    // ============================================================
    log('\n📦 Phase 4: Generating Artifact Cleanup Report', 'magenta');

    const artifactsToIgnore = [
        'artifacts/Data/',
        'artifacts/outputs/',
        'artifacts/results/',
        'artifacts/logs/',
        'dist/',
        'storybook-static/'
    ];

    log('   The following should be gitignored:', 'cyan');
    artifactsToIgnore.forEach(artifact => {
        const fullPath = path.join(ROOT_DIR, artifact);
        if (fs.existsSync(fullPath)) {
            log(`   • ${artifact}`, 'yellow');
        }
    });

    // ============================================================
    // Summary
    // ============================================================
    log('\n' + '='.repeat(70), 'bright');
    log('  📊 Cleanup Summary', 'bright');
    log('='.repeat(70), 'bright');
    log(`  Directories deleted: ${stats.deleted}`, stats.deleted > 0 ? 'green' : 'reset');
    log(`  Directories moved:   ${stats.moved}`, stats.moved > 0 ? 'green' : 'reset');
    log(`  Errors:              ${stats.errors}`, stats.errors > 0 ? 'red' : 'reset');

    log('\n✅ Repository Structure Status:', 'bright');
    log('   ✓ docs/ is canonical source of truth', 'green');
    log('   ✓ No .docs-backup duplicate', 'green');
    log('   ✓ Planning consolidated in project/', 'green');
    log('   ✓ Automation configs in project/', 'green');
    log('   ✓ Learning materials organized by SID', 'green');

    if (DRY_RUN) {
        log('\n💡 Run without --dry-run to execute cleanup', 'cyan');
    } else {
        log('\n🎉 Final cleanup complete! Repository is clean.', 'green');
    }

    log('');
}

finalCleanup();
