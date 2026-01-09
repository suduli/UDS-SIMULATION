# Documentation Organization Guide

This guide explains the documentation structure and how to maintain it.

## 📁 Documentation Structure

```
docs/
├── README.md                          # Main documentation index
├── DOCUMENTATION_GUIDE.md             # This file - how to organize docs
│
├── getting-started/                   # Quick start guides and tutorials
│   ├── README.md                      # Category index
│   ├── QUICKSTART.md                  # 5-minute setup guide
│   ├── QUICK_VISUAL_DEMO.md           # Feature showcase
│   ├── QUICK_REFERENCE_CARD.md        # Command cheat sheet
│   └── START_TESTING_HERE.md          # Testing entry point
│
├── guides/                            # Implementation and development guides
│   ├── README.md                      # Category index
│   ├── IMPLEMENTATION_GUIDE.md        # Main implementation guide
│   ├── IMPLEMENTATION_SUMMARY.md      # What's implemented
│   ├── IMPLEMENTATION_PROGRESS.md     # Progress tracking
│   ├── IMPLEMENTATION_REVIEW.md       # Code review
│   └── QUICK_IMPLEMENTATION_GUIDE.md  # Quick reference
│
├── testing/                           # Testing documentation
│   ├── README.md                      # Category index
│   ├── TESTING_GUIDE_TOOLTIPS_TOUR.md # Main testing guide (28 tests)
│   ├── TESTING_CHECKLIST_WEEK3-4.md   # Testing checklist
│   ├── WEEK5_TESTING_PROTOCOL.md      # Week 5 testing
│   └── WEEK5_VISUAL_TESTING_GUIDE.md  # Visual testing guide
│
├── accessibility/                     # Accessibility documentation
│   ├── README.md                      # Category index
│   ├── ACCESSIBILITY_GUIDE.md         # Main accessibility guide
│   ├── ACCESSIBILITY_MOBILE_QUICK_GUIDE.md  # Mobile guide
│   └── WEEK5_ACCESSIBILITY_MOBILE_COMPLETE.md  # Week 5 completion
│
├── design/                            # Design proposals and specifications
│   ├── README.md                      # Category index
│   ├── DESIGN_SPECIFICATION_SHEET.md  # Design system specs
│   ├── CARD_REDESIGN_PROPOSAL.md      # Card component redesign
│   ├── FEATURE_CARDS_REDESIGN_PROPOSAL.md  # Feature cards
│   ├── REDESIGN_SUMMARY.md            # Redesign overview
│   ├── REDESIGN_VISUAL_COMPARISON.md  # Before/after comparison
│   ├── RESPONSE_REDESIGN_SUMMARY.md   # Response redesign
│   ├── VISUAL_MOCKUP_GUIDE.md         # Visual mockups
│   ├── VISUAL_GUIDE_WEEK3-4.md        # Week 3-4 visuals
│   └── VISUAL_GUIDE_IMPLEMENTATION_STATUS.md  # Implementation status
│
├── reports/                           # Progress and status reports
│   └── weekly/                        # Weekly progress reports
│       ├── README.md                  # Category index
│       ├── WEEK1_COMPLETE.md          # Week 1 summary
│       ├── WEEK1_QUICKWINS_COMPLETED.md  # Week 1 quick wins
│       ├── WEEK2_VISUAL_ENHANCEMENTS_COMPLETED.md  # Week 2
│       ├── WEEK3-4_SUMMARY.md         # Week 3-4 summary
│       ├── WEEK3-4_UX_FEATURES_COMPLETED.md  # Week 3-4 UX
│       ├── WEEK3-4_COMPLETE_REPORT.md  # Week 3-4 complete
│       ├── WEEK5_SUMMARY.md           # Week 5 summary
│       └── WEEK5_BUG_FIXES.md         # Week 5 bug fixes
│
├── planning/                          # Planning and roadmap
│   ├── README.md                      # Category index
│   ├── NEXT_STEPS.md                  # Future roadmap
│   └── IMPROVEMENTS.md                # Planned improvements
│
└── archive/                           # Legacy and historical documents
    ├── README.md                      # Category index
    └── Review.md                      # Historical review
```

## 🎯 Organization Principles

### 1. **Categorization by Purpose**
Documents are organized by their primary purpose:
- **Getting Started**: First-time user guides
- **Guides**: Implementation and development documentation
- **Testing**: Quality assurance and testing procedures
- **Accessibility**: WCAG compliance and accessibility features
- **Design**: Visual design, proposals, and specifications
- **Reports**: Progress tracking and status updates
- **Planning**: Future work and roadmap
- **Archive**: Historical or superseded content

### 2. **Clear Naming Conventions**
- Use descriptive names with underscores: `IMPLEMENTATION_GUIDE.md`
- Start with the main topic: `WEEK5_SUMMARY.md` not `SUMMARY_WEEK5.md`
- Use consistent prefixes for related documents
- ALL CAPS for markdown files (project convention)

### 3. **Index Files**
Every category has a `README.md` that:
- Lists all documents in the category
- Provides brief descriptions
- Links back to parent documentation
- Maintains navigation structure

## 🔧 Using the Organization Script

The project includes an automated organization script: `organize-docs.js`

### Basic Usage

```bash
# Preview changes (recommended first step)
node organize-docs.js --dry-run

# Preview with detailed logging
node organize-docs.js --dry-run --verbose

# Execute organization (creates backup automatically)
node organize-docs.js

# Restore from backup if needed
node organize-docs.js --restore
```

### Features

- ✅ **Automatic Backup**: Creates `.docs-backup/` before making changes
- ✅ **Dry Run Mode**: Preview changes without moving files
- ✅ **Index Generation**: Automatically creates README.md files for each category
- ✅ **Safe Operation**: Validates files exist before moving
- ✅ **Restore Function**: Easy rollback if needed

## 📝 Adding New Documentation

### Step 1: Create the Document
Create your markdown file following naming conventions:
```bash
# Example: Adding a new testing guide
touch docs/testing/TESTING_GUIDE_NEW_FEATURE.md
```

### Step 2: Update the Category Index
Edit the appropriate `docs/[category]/README.md`:
```markdown
- [Testing Guide New Feature](./TESTING_GUIDE_NEW_FEATURE.md)
```

### Step 3: Add to Organization Script (Optional)
If you want the script to manage this file:

1. Edit `organize-docs.js`
2. Add the filename to the appropriate category in `FILE_CATEGORIES`
3. Run `node organize-docs.js --dry-run` to test

### Step 4: Link from Main Documentation
If the document is important, add it to:
- `docs/README.md` (main docs index)
- Root `README.md` (if it's a key document)

## 🗂️ Category Guidelines

### Getting Started
**Purpose**: Help new users get up and running quickly  
**Content**: Quick starts, demos, introductions  
**Audience**: First-time users  
**Length**: Short (< 5 pages)

### Guides
**Purpose**: Detailed implementation and development documentation  
**Content**: How-tos, architecture, code reviews  
**Audience**: Developers  
**Length**: Medium to Long

### Testing
**Purpose**: Quality assurance procedures  
**Content**: Test plans, checklists, protocols  
**Audience**: QA and developers  
**Length**: Medium

### Accessibility
**Purpose**: WCAG compliance and accessibility features  
**Content**: Guidelines, implementations, testing  
**Audience**: Accessibility specialists, developers  
**Length**: Medium

### Design
**Purpose**: Visual design and UI/UX specifications  
**Content**: Proposals, mockups, comparisons  
**Audience**: Designers, developers  
**Length**: Long (visual-heavy)

### Reports/Weekly
**Purpose**: Track progress over time  
**Content**: Weekly summaries, completion reports  
**Audience**: Project stakeholders  
**Length**: Medium

### Planning
**Purpose**: Future work and roadmap  
**Content**: Next steps, improvement proposals  
**Audience**: Project team  
**Length**: Short to Medium

### Archive
**Purpose**: Historical reference  
**Content**: Superseded docs, legacy content  
**Audience**: Researchers, historians  
**Length**: Varies

## 🔄 Maintenance Tasks

### Weekly
- [ ] Review new documentation for proper categorization
- [ ] Update category README files if new docs added
- [ ] Check for broken internal links

### Monthly
- [ ] Run `node organize-docs.js --dry-run` to verify structure
- [ ] Archive outdated weekly reports (older than 3 months)
- [ ] Update main README documentation section

### Quarterly
- [ ] Review archive folder - consider removing very old content
- [ ] Update this guide with any new patterns or categories
- [ ] Regenerate all index files for consistency

## 🔍 Finding Documentation

### By Category
Navigate to `docs/[category]/README.md` for a complete list

### By Topic
Use the main documentation index: `docs/README.md`

### By Search
```bash
# Find all docs mentioning "accessibility"
grep -r "accessibility" docs/ --include="*.md"

# List all testing documents
find docs/testing -name "*.md"
```

## 🚨 Common Issues

### Issue: File in Wrong Category
**Solution**: 
1. Move file manually: `git mv docs/old-cat/FILE.md docs/new-cat/FILE.md`
2. Update both category README files
3. Update organize-docs.js if managed by script

### Issue: Broken Links After Reorganization
**Solution**:
1. Search for the old path: `grep -r "old/path" docs/`
2. Update all references to new path
3. Consider using relative paths: `./GUIDE.md` instead of `/docs/guides/GUIDE.md`

### Issue: Need to Restore Organization
**Solution**:
```bash
node organize-docs.js --restore
```

## 📚 Best Practices

1. **One Document, One Purpose**: Each file should have a clear, single purpose
2. **Link Liberally**: Cross-reference related documents
3. **Keep Indexes Updated**: Update README files when adding content
4. **Use Relative Links**: More portable than absolute paths
5. **Regular Cleanup**: Archive or delete outdated content
6. **Descriptive Names**: Filenames should indicate content clearly
7. **Consistent Format**: Follow project markdown style guide

## 🤝 Contributing to Documentation

When contributing documentation:

1. Read this guide first
2. Choose the appropriate category
3. Follow naming conventions
4. Add entry to category README
5. Test all links
6. Run organization script in dry-run mode
7. Submit PR with clear description

## 📞 Questions?

If you're unsure about:
- Where a document should go
- How to name a file
- Whether to archive something

Open an issue for discussion before making major changes.

---

**Last Updated**: October 5, 2025  
**Maintained By**: Project Team  
**Version**: 1.0.0
