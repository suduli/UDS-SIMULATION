# Documentation Reorganization Plan
**Created:** 2026-01-06  
**Status:** Proposed

## Executive Summary

This document proposes a comprehensive reorganization of the UDS-SIMULATION project structure to improve maintainability, discoverability, and logical grouping of resources.

---

## 🎯 Goals

1. **Clear Separation of Concerns**: Separate learning materials, test data, reports, and documentation
2. **Eliminate Redundancy**: Remove duplicate backup directories from main tree
3. **Consistent File Organization**: Group similar file types together
4. **Better Discoverability**: Make it easy to find relevant documents
5. **Maintainable Structure**: Create a structure that scales with the project

---

## 📋 Current Issues

### 1. **Critical Problems**

| Issue | Impact | Current State |
|-------|--------|---------------|
| Duplicate backup folder | Doubles repo size | `.docs-backup/` mirrors entire `docs/` |
| Mixed file types | Confusion, hard to navigate | JSON, CSV, HTML, MD all mixed in `docs/learning/` |
| Scattered test data | Difficult to run tests | Test cases in docs, not near test code |
| No clear data/artifact separation | Messy project root | Outputs mixed with source |

### 2. **File Type Distribution** (Current)

```
docs/learning/
├── 📄 Markdown docs (50+ files)
├── 📊 JSON test cases (20+ files)
├── 📈 CSV reports (5+ files)
├── 🌐 HTML reports (10+ files)
├── 📝 TXT reports (2+ files)
└── 💻 JavaScript utilities (1 file)
```

---

## 🎨 Proposed Structure

### **Root Level** (Cleaned)
```
UDS-SIMULATION/
├── 📄 README.md                    # Main project readme
├── 📦 package.json                 # Dependencies
├── ⚙️ Configuration files          # vite, tsconfig, tailwind, etc.
├── 📂 .github/                     # GitHub workflows and prompts
├── 📂 .storybook/                  # Storybook config
├── 📂 .agent/                      # AI agent workflows
├── 📂 src/                         # Source code
├── 📂 public/                      # Public assets
├── 📂 scripts/                     # Build and utility scripts
├── 📂 tests/                       # Test suite (NEW - separate from docs)
├── 📂 docs/                        # Documentation only
├── 📂 artifacts/                   # Build outputs, logs, test results
└── 📂 node_modules/                # Dependencies
```

### **Documentation Directory** (`docs/`)
```
docs/
├── 📄 README.md                    # Documentation index
│
├── 📂 getting-started/             # For new users
│   ├── README.md
│   ├── QUICKSTART.md
│   ├── QUICK_VISUAL_DEMO.md
│   └── START_TESTING_HERE.md
│
├── 📂 guides/                      # Implementation guides
│   ├── README.md
│   ├── implementation/
│   │   ├── IMPLEMENTATION_GUIDE.md
│   │   ├── QUICK_IMPLEMENTATION_GUIDE.md
│   │   └── P2-04_IMPLEMENTATION_SUMMARY.md
│   ├── testing/
│   │   ├── SEQUENCE_BUILDER_TESTING_GUIDE.md
│   │   ├── SID_22_Test_Guide.md
│   │   └── IN_APP_DIAGNOSTIC_GUIDE.md
│   └── troubleshooting/
│       ├── BUILD_FIXES.md
│       ├── EXECUTION_STUCK_STATE_FIX.md
│       └── UDS_SEQUENCE_TROUBLESHOOTING.md
│
├── 📂 learning/                    # Educational content (MD only)
│   ├── README.md
│   ├── protocols/
│   │   ├── CAN_PROTOCOL.md
│   │   └── UDS_OVERVIEW.md
│   ├── services/                   # UDS Service documentation
│   │   ├── SID_10_DIAGNOSTIC_SESSION_CONTROL.md
│   │   ├── SID_11_ECU_RESET.md
│   │   ├── SID_22_READ_DATA_BY_IDENTIFIER.md
│   │   ├── SID_27_SECURITY_ACCESS.md
│   │   └── ... (all SID_XX_*.md files)
│   ├── dtc/                        # DTC-specific docs
│   │   ├── DTC_FUNDAMENTALS.md
│   │   ├── DTC_INTERPRETATION_GUIDE.md
│   │   └── DTC_CLEARING_PROCEDURES.md
│   └── practical/                  # Practical implementation
│       ├── SID_10_PRACTICAL_IMPLEMENTATION.md
│       ├── SID_27_SEED_KEY_EXPLAINED.md
│       └── ... (all PRACTICAL_*.md files)
│
├── 📂 features/                    # Feature-specific docs
│   ├── README.md
│   ├── packet-flow/
│   ├── sparkles/
│   ├── ui/
│   └── sid-36/
│
├── 📂 design/                      # Design documentation
│   ├── README.md
│   ├── specifications/
│   ├── visual-guides/
│   └── proposals/
│
├── 📂 accessibility/               # Accessibility docs
│   ├── README.md
│   └── ... (existing files)
│
├── 📂 reports/                     # Progress reports
│   ├── README.md
│   ├── weekly/
│   └── final/
│
├── 📂 planning/                    # Planning documents
│   ├── README.md
│   ├── roadmap/
│   └── backlog/
│
└── 📂 archive/                     # Historical/deprecated
    └── README.md
```

### **Tests Directory** (`tests/`) - **NEW**
```
tests/
├── 📄 README.md                    # Testing documentation
│
├── 📂 unit/                        # Unit tests
│   └── (JavaScript/TypeScript test files)
│
├── 📂 integration/                 # Integration tests
│   └── (JavaScript/TypeScript test files)
│
├── 📂 test-data/                   # Test fixtures and data
│   ├── sid-10/
│   │   ├── SID10_TestCases.json
│   │   └── SID10_TestCases_report.json
│   ├── sid-11/
│   │   ├── SID11_TestCases.json
│   │   └── SID11_TestCases_report.json
│   ├── sid-22/
│   │   └── SID22_TestCases.json
│   └── ... (all SID test cases organized by service)
│
└── 📂 reports/                     # Test execution reports
    ├── SID_10_REPORT.csv
    ├── SID_11_REPORT.csv
    ├── SID_2A_Report.csv
    └── ... (CSV/HTML reports from test runs)
```

### **Artifacts Directory** (Reorganized)
```
artifacts/
├── 📂 build/                       # Build outputs
│   └── (compiled assets)
│
├── 📂 logs/                        # Application logs
│   ├── build_error.txt
│   ├── debug-storybook.log
│   └── ... (output_*.txt files)
│
├── 📂 test-results/                # Visual test results
│   ├── screenshots/
│   │   ├── dark-desktop.png
│   │   ├── light-mobile.png
│   │   └── ...
│   └── diffs/
│       └── ... (visual diff images)
│
├── 📂 reports/                     # Generated HTML reports
│   ├── SID2A_Report.html
│   ├── SID34_Report.html
│   └── ... (all HTML reports)
│
└── 📂 data/                        # Archived data exports
    └── ... (exported session data, etc.)
```

### **Scripts Directory** (Cleaned)
```
scripts/
├── organize-docs.js                # Documentation organizer (UPDATED)
├── organize-tests.js               # Test file organizer (NEW)
├── generate-test-reports.js        # Test report generator (NEW)
└── ... (other build/utility scripts)
```

---

## 📦 File Migration Map

### **Learning Materials Reorganization**

| Current Location | New Location | File Type |
|-----------------|--------------|-----------|
| `docs/learning/*.md` (SID docs) | `docs/learning/services/` | Markdown |
| `docs/learning/DTC_*.md` | `docs/learning/dtc/` | Markdown |
| `docs/learning/*PRACTICAL*.md` | `docs/learning/practical/` | Markdown |
| `docs/learning/*_TestCases.json` | `tests/test-data/sid-XX/` | JSON |
| `docs/learning/*_Report.csv` | `tests/reports/` | CSV |
| `docs/learning/*_Report.html` | `artifacts/reports/` | HTML |
| `docs/learning/security-key-calculator.js` | `scripts/utils/` | JavaScript |

### **Test Data Migration**

Move all test-related files from `docs/learning/` to appropriate test directories:

```
docs/learning/SID10_TestCases.json        → tests/test-data/sid-10/
docs/learning/SID10_TestCases_report.json → tests/test-data/sid-10/
docs/learning/SID_10_REPORT.csv           → tests/reports/
docs/learning/SID2A_Report.html           → artifacts/reports/
```

### **Artifact Cleanup**

```
artifacts/outputs/*.txt               → artifacts/logs/
artifacts/Data/test-results/*.png     → artifacts/test-results/screenshots/
artifacts/Data/*.html                 → artifacts/reports/
```

### **Documentation Enhancements**

Split large mixed directories:
```
docs/guides/
  (current files)                     → docs/guides/implementation/
  (testing guides)                    → docs/guides/testing/
  (troubleshooting)                   → docs/guides/troubleshooting/
```

---

## 🛠️ Implementation Steps

### Phase 1: Backup & Preparation
1. ✅ Create complete backup (automated by script)
2. ✅ Document current structure (this file)
3. ⏳ Update `organize-docs.js` script
4. ⏳ Create new `organize-tests.js` script

### Phase 2: Core Reorganization
1. ⏳ Create new directory structure
2. ⏳ Move test data to `tests/test-data/`
3. ⏳ Move test reports to `tests/reports/` and `artifacts/reports/`
4. ⏳ Reorganize `docs/learning/` by topic
5. ⏳ Move build artifacts to proper locations

### Phase 3: Cleanup
1. ⏳ Remove `.docs-backup/` from repository (keep in .gitignore)
2. ⏳ Delete empty directories
3. ⏳ Update all internal documentation links
4. ⏳ Update README files in each directory

### Phase 4: Validation
1. ⏳ Verify all links work
2. ⏳ Test that tests can find their data
3. ⏳ Run build to ensure no broken imports
4. ⏳ Update any CI/CD paths

---

## 📝 Script Updates Required

### Update `organize-docs.js`

**Changes needed:**
1. Remove backup directory from organization scope
2. Add file type filters (only .md files in docs)
3. Add subdirectory organization for `guides/` and `learning/`
4. Update path mappings

### Create `organize-tests.js`

**Responsibilities:**
1. Move all `*TestCases.json` to `tests/test-data/sid-XX/`
2. Move all `*_Report.csv` to `tests/reports/`
3. Move all `*_Report.html` to `artifacts/reports/`
4. Create proper directory structure
5. Update test runner paths

### Create `cleanup-artifacts.js`

**Responsibilities:**
1. Organize `artifacts/outputs/` into `artifacts/logs/`
2. Organize test screenshots
3. Remove duplicate/temp files
4. Compress old logs

---

## 🔍 Gitignore Updates

Add to `.gitignore`:
```gitignore
# Backups (keep local only)
.docs-backup/

# Artifacts that shouldn't be committed
artifacts/logs/*.txt
artifacts/test-results/
artifacts/build/

# Test reports (can regenerate)
tests/reports/*.csv
tests/reports/*.html

# Node modules (already there)
node_modules/
```

---

## 📊 Expected Benefits

### Before Reorganization
- 19,569 lines in treefile
- Mixed file types in 5+ locations
- Duplicate content in backup directory
- Hard to find specific resources
- Test data disconnected from tests

### After Reorganization
- Clear separation of concerns
- Test data lives with tests
- Documentation is purely markdown
- Artifacts clearly separated
- 30-40% reduction in confusing structure

---

## ✅ Success Criteria

1. ✅ All markdown docs in `docs/`
2. ✅ All test data in `tests/`
3. ✅ All build outputs in `artifacts/`
4. ✅ No duplicate backup directories tracked in git
5. ✅ All internal links working
6. ✅ Tests can locate their data files
7. ✅ README files in every major directory
8. ✅ Clear naming conventions followed

---

## 🚀 Next Steps

1. **Review this plan** - Get approval from team/stakeholders
2. **Update scripts** - Modify organization scripts
3. **Test in dry-run** - Run with `--dry-run` flag
4. **Execute migration** - Run actual reorganization
5. **Validate** - Check all functionality works
6. **Document** - Update main README with new structure
7. **Commit** - Commit changes with detailed commit message

---

## 📖 References

- Current organization script: `scripts/organize-docs.js`
- Current structure: `treefile.txt`
- Package configuration: `package.json`

---

**Author:** AI Assistant  
**Review Required:** Yes  
**Breaking Changes:** No (preserves all content, just reorganizes)  
**Risks:** Low (full backup created automatically)
