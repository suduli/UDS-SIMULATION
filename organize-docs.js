/**
 * Documentation Organization Script
 * 
 * This script automatically organizes all Markdown files in the project
 * into a logical, maintainable structure based on content type and purpose.
 * 
 * Usage: node organize-docs.js [--dry-run] [--verbose]
 * 
 * Options:
 *   --dry-run   Preview changes without moving files
 *   --verbose   Show detailed logging
 *   --restore   Restore files from backup
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module equivalents for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const ROOT_DIR = __dirname;
const DOCS_DIR = path.join(ROOT_DIR, 'docs');
const BACKUP_DIR = path.join(ROOT_DIR, '.docs-backup');
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const VERBOSE = args.includes('--verbose');
const RESTORE = args.includes('--restore');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

/**
 * File categorization rules
 * Each category maps files to their destination folder
 */
const FILE_CATEGORIES = {
  // Core documentation (stays in root)
  root: [
    'README.md'
  ],

  // Getting started guides
  'docs/getting-started': [
    'QUICKSTART.md',
    'QUICK_VISUAL_DEMO.md',
    'QUICK_REFERENCE_CARD.md',
    'START_TESTING_HERE.md'
  ],

  // Implementation guides
  'docs/guides': [
    'IMPLEMENTATION_GUIDE.md',
    'QUICK_IMPLEMENTATION_GUIDE.md',
    'IMPLEMENTATION_SUMMARY.md',
    'IMPLEMENTATION_PROGRESS.md',
    'IMPLEMENTATION_REVIEW.md'
  ],

  // Testing documentation
  'docs/testing': [
    'TESTING_GUIDE_TOOLTIPS_TOUR.md',
    'TESTING_CHECKLIST_WEEK3-4.md',
    'WEEK5_TESTING_PROTOCOL.md',
    'WEEK5_VISUAL_TESTING_GUIDE.md'
  ],

  // Accessibility documentation
  'docs/accessibility': [
    'ACCESSIBILITY_GUIDE.md',
    'ACCESSIBILITY_MOBILE_QUICK_GUIDE.md',
    'WEEK5_ACCESSIBILITY_MOBILE_COMPLETE.md'
  ],

  // Design proposals and specifications
  'docs/design': [
    'CARD_REDESIGN_PROPOSAL.md',
    'FEATURE_CARDS_REDESIGN_PROPOSAL.md',
    'DESIGN_SPECIFICATION_SHEET.md',
    'REDESIGN_SUMMARY.md',
    'REDESIGN_VISUAL_COMPARISON.md',
    'RESPONSE_REDESIGN_SUMMARY.md',
    'VISUAL_MOCKUP_GUIDE.md',
    'VISUAL_GUIDE_WEEK3-4.md',
    'VISUAL_GUIDE_IMPLEMENTATION_STATUS.md'
  ],

  // Weekly progress reports
  'docs/reports/weekly': [
    'WEEK1_COMPLETE.md',
    'WEEK1_QUICKWINS_COMPLETED.md',
    'WEEK2_VISUAL_ENHANCEMENTS_COMPLETED.md',
    'WEEK3-4_SUMMARY.md',
    'WEEK3-4_UX_FEATURES_COMPLETED.md',
    'WEEK3-4_COMPLETE_REPORT.md',
    'WEEK5_SUMMARY.md',
    'WEEK5_BUG_FIXES.md'
  ],

  // Planning and future work
  'docs/planning': [
    'NEXT_STEPS.md',
    'IMPROVEMENTS.md'
  ],

  // Legacy/archived content
  'docs/archive': [
    'Data/Review.md'
  ]
};

/**
 * Utility functions
 */
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logVerbose(message) {
  if (VERBOSE) {
    log(`  ${message}`, 'cyan');
  }
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    if (!DRY_RUN) {
      fs.mkdirSync(dir, { recursive: true });
    }
    logVerbose(`Created directory: ${dir}`);
  }
}

function moveFile(sourcePath, destPath) {
  if (!fs.existsSync(sourcePath)) {
    log(`⚠ Source file not found: ${sourcePath}`, 'yellow');
    return false;
  }

  if (fs.existsSync(destPath)) {
    log(`⚠ Destination already exists: ${destPath}`, 'yellow');
    return false;
  }

  if (DRY_RUN) {
    log(`  [DRY RUN] Would move: ${path.basename(sourcePath)} → ${path.relative(ROOT_DIR, destPath)}`, 'blue');
    return true;
  }

  try {
    ensureDir(path.dirname(destPath));
    fs.renameSync(sourcePath, destPath);
    logVerbose(`Moved: ${path.basename(sourcePath)}`);
    return true;
  } catch (error) {
    log(`✗ Error moving file: ${error.message}`, 'red');
    return false;
  }
}

function copyFile(sourcePath, destPath) {
  if (!fs.existsSync(sourcePath)) {
    return false;
  }

  ensureDir(path.dirname(destPath));
  fs.copyFileSync(sourcePath, destPath);
  return true;
}

/**
 * Create backup of all markdown files
 */
function createBackup() {
  log('\n📦 Creating backup...', 'bright');
  
  if (fs.existsSync(BACKUP_DIR)) {
    fs.rmSync(BACKUP_DIR, { recursive: true, force: true });
  }
  
  ensureDir(BACKUP_DIR);

  // Find all markdown files
  const findMarkdownFiles = (dir, fileList = []) => {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !filePath.includes('node_modules') && !filePath.includes('.git')) {
        findMarkdownFiles(filePath, fileList);
      } else if (file.endsWith('.md')) {
        fileList.push(filePath);
      }
    });
    
    return fileList;
  };

  const mdFiles = findMarkdownFiles(ROOT_DIR);
  let backedUp = 0;

  mdFiles.forEach(filePath => {
    const relativePath = path.relative(ROOT_DIR, filePath);
    const backupPath = path.join(BACKUP_DIR, relativePath);
    
    if (copyFile(filePath, backupPath)) {
      backedUp++;
    }
  });

  log(`✓ Backed up ${backedUp} markdown files to .docs-backup/`, 'green');
}

/**
 * Restore files from backup
 */
function restoreFromBackup() {
  if (!fs.existsSync(BACKUP_DIR)) {
    log('✗ No backup found to restore from', 'red');
    return;
  }

  log('\n🔄 Restoring from backup...', 'bright');

  // Remove docs directory if it exists
  if (fs.existsSync(DOCS_DIR)) {
    fs.rmSync(DOCS_DIR, { recursive: true, force: true });
  }

  // Restore all files
  const restoreFiles = (dir) => {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      const relativePath = path.relative(BACKUP_DIR, filePath);
      const restorePath = path.join(ROOT_DIR, relativePath);
      
      if (stat.isDirectory()) {
        restoreFiles(filePath);
      } else {
        ensureDir(path.dirname(restorePath));
        fs.copyFileSync(filePath, restorePath);
      }
    });
  };

  restoreFiles(BACKUP_DIR);
  log('✓ Restoration complete', 'green');
}

/**
 * Create index files for each category
 */
function createIndexFiles() {
  const indexContent = {
    'docs/getting-started': {
      title: '🚀 Getting Started',
      description: 'Quick guides to get up and running with the UDS Protocol Simulator',
      files: FILE_CATEGORIES['docs/getting-started']
    },
    'docs/guides': {
      title: '📖 Implementation Guides',
      description: 'Detailed guides for implementing and understanding the codebase',
      files: FILE_CATEGORIES['docs/guides']
    },
    'docs/testing': {
      title: '🧪 Testing Documentation',
      description: 'Testing guides, protocols, and checklists',
      files: FILE_CATEGORIES['docs/testing']
    },
    'docs/accessibility': {
      title: '♿ Accessibility',
      description: 'Accessibility guidelines and WCAG compliance documentation',
      files: FILE_CATEGORIES['docs/accessibility']
    },
    'docs/design': {
      title: '🎨 Design & Visual Guides',
      description: 'Design proposals, specifications, and visual mockups',
      files: FILE_CATEGORIES['docs/design']
    },
    'docs/reports/weekly': {
      title: '📊 Weekly Progress Reports',
      description: 'Week-by-week development progress and completion summaries',
      files: FILE_CATEGORIES['docs/reports/weekly']
    },
    'docs/planning': {
      title: '🗓️ Planning & Future Work',
      description: 'Planned improvements and next steps',
      files: FILE_CATEGORIES['docs/planning']
    },
    'docs/archive': {
      title: '📦 Archive',
      description: 'Historical documents and legacy content',
      files: FILE_CATEGORIES['docs/archive']
    }
  };

  Object.entries(indexContent).forEach(([dir, content]) => {
    const indexPath = path.join(ROOT_DIR, dir, 'README.md');
    
    let markdown = `# ${content.title}\n\n${content.description}\n\n## Contents\n\n`;
    
    content.files.forEach(file => {
      const fileName = path.basename(file, '.md');
      const displayName = fileName
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
      markdown += `- [${displayName}](./${path.basename(file)})\n`;
    });

    markdown += `\n---\n\n[← Back to Main Documentation](${dir === 'docs/getting-started' ? '../..' : '../../README.md'})\n`;

    if (!DRY_RUN) {
      ensureDir(path.dirname(indexPath));
      fs.writeFileSync(indexPath, markdown);
    }
    
    logVerbose(`Created index: ${path.relative(ROOT_DIR, indexPath)}`);
  });
}

/**
 * Create main documentation index
 */
function createMainDocsIndex() {
  const indexPath = path.join(DOCS_DIR, 'README.md');
  
  const content = `# Documentation Index

Welcome to the UDS Protocol Simulator documentation. This directory contains all project documentation organized by topic.

## 📚 Documentation Categories

### [🚀 Getting Started](./getting-started/)
Quick guides to get up and running with the simulator
- Quickstart guides
- Visual demos
- Testing entry points

### [📖 Implementation Guides](./guides/)
Detailed guides for implementing and understanding the codebase
- Implementation guides
- Code reviews
- Progress tracking

### [🧪 Testing Documentation](./testing/)
Testing guides, protocols, and checklists
- Testing guides
- Test protocols
- Checklists

### [♿ Accessibility](./accessibility/)
Accessibility guidelines and WCAG compliance documentation
- WCAG compliance guides
- Mobile accessibility
- High contrast mode documentation

### [🎨 Design & Visual Guides](./design/)
Design proposals, specifications, and visual mockups
- Redesign proposals
- Visual specifications
- Design comparisons

### [📊 Weekly Progress Reports](./reports/weekly/)
Week-by-week development progress and completion summaries
- Weekly summaries
- Completion reports
- Bug fixes

### [🗓️ Planning & Future Work](./planning/)
Planned improvements and next steps
- Roadmap
- Improvement proposals
- Future enhancements

### [📦 Archive](./archive/)
Historical documents and legacy content

---

## Quick Links

- [Main README](../README.md)
- [Quickstart Guide](./getting-started/QUICKSTART.md)
- [Testing Guide](./testing/START_TESTING_HERE.md)
- [Accessibility Guide](./accessibility/ACCESSIBILITY_GUIDE.md)

## Contributing to Documentation

When adding new documentation:
1. Choose the appropriate category folder
2. Use descriptive filenames with underscores
3. Update the category's README.md
4. Link from relevant documents
5. Run \`node organize-docs.js --dry-run\` to validate

---

**Last Updated:** ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
`;

  if (!DRY_RUN) {
    ensureDir(DOCS_DIR);
    fs.writeFileSync(indexPath, content);
  }
  
  logVerbose(`Created main docs index: ${path.relative(ROOT_DIR, indexPath)}`);
}

/**
 * Organize all markdown files
 */
function organizeFiles() {
  log('\n📁 Organizing documentation files...', 'bright');
  
  let moved = 0;
  let skipped = 0;
  let errors = 0;

  Object.entries(FILE_CATEGORIES).forEach(([category, files]) => {
    if (category === 'root') {
      logVerbose(`Skipping root files: ${files.join(', ')}`);
      return;
    }

    log(`\n📂 ${category}`, 'yellow');
    
    files.forEach(file => {
      const sourcePath = path.join(ROOT_DIR, file);
      const destPath = path.join(ROOT_DIR, category, path.basename(file));
      
      if (moveFile(sourcePath, destPath)) {
        moved++;
      } else {
        if (fs.existsSync(destPath)) {
          skipped++;
        } else {
          errors++;
        }
      }
    });
  });

  return { moved, skipped, errors };
}

/**
 * Main execution
 */
function main() {
  log('\n' + '='.repeat(60), 'bright');
  log('  📚 Documentation Organization Script', 'bright');
  log('='.repeat(60) + '\n', 'bright');

  if (RESTORE) {
    restoreFromBackup();
    return;
  }

  if (DRY_RUN) {
    log('🔍 DRY RUN MODE - No files will be moved\n', 'yellow');
  }

  // Create backup before making changes
  if (!DRY_RUN) {
    createBackup();
  }

  // Organize files
  const stats = organizeFiles();

  // Create index files
  log('\n📝 Creating index files...', 'bright');
  createIndexFiles();
  createMainDocsIndex();

  // Summary
  log('\n' + '='.repeat(60), 'bright');
  log('  📊 Summary', 'bright');
  log('='.repeat(60), 'bright');
  log(`  Files moved: ${stats.moved}`, stats.moved > 0 ? 'green' : 'reset');
  log(`  Files skipped: ${stats.skipped}`, stats.skipped > 0 ? 'yellow' : 'reset');
  log(`  Errors: ${stats.errors}`, stats.errors > 0 ? 'red' : 'reset');
  
  if (DRY_RUN) {
    log('\n💡 Run without --dry-run to apply changes', 'cyan');
  } else {
    log('\n✅ Documentation organization complete!', 'green');
    log('💾 Backup saved to .docs-backup/', 'green');
    log('🔄 To restore: node organize-docs.js --restore', 'cyan');
  }
  
  log('');
}

// Run the script
main();
