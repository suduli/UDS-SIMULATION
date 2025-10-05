# Documentation Quick Reference

> **🚀 Quick commands for working with the organized documentation**

## 📂 Directory Structure

```
docs/
├── getting-started/    # New user guides
├── guides/            # Developer documentation  
├── testing/           # QA and testing
├── accessibility/     # WCAG compliance
├── design/            # UI/UX specifications
├── reports/weekly/    # Progress tracking
├── planning/          # Future roadmap
└── archive/           # Historical content
```

## 🔧 NPM Commands

```bash
# Preview reorganization (safe, no changes)
npm run docs:preview

# Execute reorganization (creates backup)
npm run docs:organize

# Restore from backup
npm run docs:restore
```

## 📖 Essential Links

| What | Where |
|------|-------|
| **Main Index** | [docs/README.md](./docs/README.md) |
| **Quickstart** | [docs/getting-started/QUICKSTART.md](./docs/getting-started/QUICKSTART.md) |
| **Testing Guide** | [docs/testing/TESTING_GUIDE_TOOLTIPS_TOUR.md](./docs/testing/TESTING_GUIDE_TOOLTIPS_TOUR.md) |
| **Accessibility** | [docs/accessibility/ACCESSIBILITY_GUIDE.md](./docs/accessibility/ACCESSIBILITY_GUIDE.md) |
| **Latest Report** | [docs/reports/weekly/WEEK5_SUMMARY.md](./docs/reports/weekly/WEEK5_SUMMARY.md) |
| **Maintenance Guide** | [docs/DOCUMENTATION_GUIDE.md](./docs/DOCUMENTATION_GUIDE.md) |

## ✍️ Adding New Documentation

### 1. Choose Category
```bash
getting-started/  # First-time user guides (< 5 pages)
guides/           # Developer guides (detailed)
testing/          # Test procedures and checklists
accessibility/    # WCAG compliance docs
design/           # UI/UX specs and proposals
reports/weekly/   # Weekly progress reports
planning/         # Roadmap and future work
archive/          # Legacy content
```

### 2. Create File
```bash
# Example: Add testing guide
code docs/testing/MY_NEW_TEST.md
```

### 3. Update Category Index
```bash
# Edit the category README
code docs/testing/README.md

# Add your file to the list
# - [My New Test](./MY_NEW_TEST.md)
```

### 4. Verify
```bash
npm run docs:preview
```

## 🔍 Finding Documentation

### Browse by Category
```bash
# Windows
explorer docs\getting-started

# macOS/Linux
open docs/getting-started
```

### Search by Content
```bash
# Find all mentions of "accessibility"
grep -r "accessibility" docs/ --include="*.md"

# List all testing docs
ls docs/testing/*.md
```

### View Index
```bash
# Main documentation hub
cat docs/README.md

# Category-specific index
cat docs/guides/README.md
```

## 🔄 Reorganization Workflow

### First Time
```bash
# 1. Preview what will happen
npm run docs:preview

# 2. Review the output carefully

# 3. Execute (creates backup automatically)
npm run docs:organize

# 4. Verify structure
tree docs /F
```

### If Something Goes Wrong
```bash
# Restore everything from backup
npm run docs:restore
```

## 📋 Common Tasks

### Task: Find a specific guide
**Solution**: Check `docs/README.md` main index

### Task: Add weekly report
**Location**: `docs/reports/weekly/`  
**Update**: `docs/reports/weekly/README.md`

### Task: Update accessibility docs
**Location**: `docs/accessibility/`  
**Update**: `docs/accessibility/README.md`

### Task: Archive old content
**Move to**: `docs/archive/`  
**Update script**: `organize-docs.js` FILE_CATEGORIES

## 🎯 Category Guidelines

| Category | Length | Audience | Example |
|----------|--------|----------|---------|
| **Getting Started** | Short (< 5 pages) | New users | QUICKSTART.md |
| **Guides** | Medium-Long | Developers | IMPLEMENTATION_GUIDE.md |
| **Testing** | Medium | QA/Devs | TESTING_GUIDE_TOOLTIPS_TOUR.md |
| **Accessibility** | Medium | A11y specialists | ACCESSIBILITY_GUIDE.md |
| **Design** | Long (visual) | Designers | CARD_REDESIGN_PROPOSAL.md |
| **Reports** | Medium | Stakeholders | WEEK5_SUMMARY.md |
| **Planning** | Short-Medium | Team | NEXT_STEPS.md |
| **Archive** | Varies | Researchers | Review.md |

## 🚨 Troubleshooting

### Issue: Can't find a document
```bash
# Search by name
find docs -name "*KEYWORD*.md"

# Search by content
grep -r "keyword" docs/
```

### Issue: Broken link after reorganization
```bash
# Find all references to old path
grep -r "old/path" docs/

# Update to: docs/category/FILE.md
```

### Issue: Need to reorganize manually
```bash
# Move file
git mv docs/old-cat/FILE.md docs/new-cat/FILE.md

# Update both category READMEs
# Update organize-docs.js if needed
```

## 📊 Statistics

- **Total Files**: 36 markdown files organized
- **Categories**: 8 specialized categories
- **Index Files**: 9 (1 main + 8 category)
- **Backup Safety**: Automatic (.docs-backup/)
- **NPM Scripts**: 3 convenience commands

## 🎓 Learning Path

1. **Start Here**: [Main README](./README.md)
2. **Get Running**: [Quickstart](./docs/getting-started/QUICKSTART.md)
3. **Understand Code**: [Implementation Guide](./docs/guides/IMPLEMENTATION_GUIDE.md)
4. **Test Features**: [Testing Guide](./docs/testing/TESTING_GUIDE_TOOLTIPS_TOUR.md)
5. **Check Accessibility**: [A11y Guide](./docs/accessibility/ACCESSIBILITY_GUIDE.md)

## 💡 Pro Tips

✅ **Always preview first**: `npm run docs:preview`  
✅ **Keep indexes updated**: Edit category README when adding files  
✅ **Use relative paths**: `./GUIDE.md` instead of `/docs/guides/GUIDE.md`  
✅ **Archive old reports**: Move weekly reports >3 months to archive  
✅ **Test links**: Click through after reorganization  

## 📞 Need Help?

- **Maintenance Guide**: [docs/DOCUMENTATION_GUIDE.md](./docs/DOCUMENTATION_GUIDE.md)
- **Reorganization Summary**: [DOCUMENTATION_REORGANIZATION_SUMMARY.md](./DOCUMENTATION_REORGANIZATION_SUMMARY.md)
- **Script Source**: [organize-docs.js](./organize-docs.js)

---

**Version**: 1.0.0  
**Last Updated**: October 5, 2025  
**Quick Access**: Bookmark this file for fast reference!
