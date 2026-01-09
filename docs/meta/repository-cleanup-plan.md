# Repository Cleanup Plan - Senior Architecture Review

**Date:** 2026-01-06  
**Author:** Senior Repository Maintainer  
**Status:** Planning Phase  

---

## 🎯 Objectives

1. **Eliminate Duplication** - Remove `.docs-backup` after verification
2. **Establish Single Source of Truth** - Consolidate all documentation
3. **Normalize Naming Conventions** - Enforce lowercase kebab-case
4. **Separate Concerns** - Generated artifacts vs source code
5. **Improve Discoverability** - Logical, scalable structure

---

## 🔍 Current State Analysis

### Root-Level Directories

```
✅ Keep (Source Code & Config)
├── .github/          - GitHub workflows, prompts
├── .storybook/       - Storybook configuration
├── .vscode/          - VS Code settings
├── public/           - Public assets
├── src/              - Application source code
├── scripts/          - Build and utility scripts
├── tests/            - Test files
└── node_modules/     - Dependencies (gitignored)

⚠️ Review (Generated/Build)
├── dist/             - Build output (should be gitignored)
├── storybook-static/ - Storybook build (should be gitignored)
└── artifacts/        - Test results, logs, reports

❌ Remove After Verification
├── .docs-backup/     - Duplicate of docs/
├── .agent/           - Move to project/automation/
└── .claude/          - Move to project/automation/

✅ Keep (Primary Documentation)
└── docs/             - CANONICAL documentation location
```

---

## 📊 Detailed Cleanup Actions

### Phase 1: Verify & Remove Duplicates (SAFE)

#### Action 1.1: Verify .docs-backup Contents
```bash
# Compare .docs-backup with docs/
# Ensure no unique files in .docs-backup
# IF verified identical → DELETE .docs-backup
```

**Risk:** LOW - Backup is duplicate  
**Impact:** Removes ~19,569 lines from tree (50% reduction)

#### Action 1.2: Consolidate Automation Files
```bash
# Move .agent/ → project/automation/agent/
# Move .claude/ → project/automation/claude/
```

**Risk:** LOW - No runtime dependencies  
**Impact:** Better organization of AI/automation configs

---

### Phase 2: Update .gitignore (CRITICAL)

Add these entries:
```gitignore
# Build outputs
/dist
/storybook-static

# Documentation backup (local only)
.docs-backup/

# Artifacts (generated)
artifacts/logs/*.txt
artifacts/logs/*.log
artifacts/test-results/
artifacts/build/

# Test reports (regenerable)
tests/reports/*.csv
tests/reports/*.html

# Node
node_modules/
```

**Risk:** NONE - Only affects what's tracked  
**Impact:** Cleaner repository, faster clones

---

### Phase 3: Normalize Naming Conventions

#### Current Issues:
- `REORGANIZATION_README.md` → should be `reorganization-readme.md`
- `FILE_STRUCTURE_SUMMARY.md` → should be `file-structure-summary.md`
- Mixed case in filenames

#### Proposed Renames:
```
Root Documentation Files:
  REORGANIZATION_README.md           → docs/meta/reorganization-readme.md
  FILE_STRUCTURE_SUMMARY.md          → docs/meta/file-structure-summary.md
  VISUAL_REORGANIZATION_GUIDE.md     → docs/meta/visual-reorganization-guide.md
  DOCUMENTATION_REORGANIZATION_PLAN.md → docs/meta/documentation-reorganization-plan.md
  REORGANIZATION_COMPLETE.md         → docs/meta/reorganization-complete.md
  FINAL_CLEANUP_COMPLETE.md          → docs/meta/final-cleanup-complete.md
```

**Risk:** LOW - Documentation only  
**Impact:** Consistent naming, better SEO

---

### Phase 4: Consolidate Planning & Automation

Create new structure:
```
project/
├── planning/
│   ├── roadmap/
│   ├── backlog/
│   └── improvements/
└── automation/
    ├── agent/           (from .agent/)
    │   └── workflows/
    ├── claude/          (from .claude/)
    │   └── agents/
    └── github/          (from .github/prompts/)
        └── prompts/
```

**Risk:** LOW - Non-runtime files  
**Impact:** Clear separation of concerns

---

### Phase 5: Artifact Management

#### Current State:
```
artifacts/
├── Data/              - Mixed test data
├── outputs/           - Build logs
└── results/           - Test screenshots
```

#### Proposed Structure:
```
artifacts/
├── reports/           - HTML test reports (keep few recent)
├── logs/              - Build logs (gitignored)
├── test-results/      - Screenshots, diffs (gitignored)
└── archive/           - Old artifacts (manual cleanup)
```

#### .gitignore Updates:
```
artifacts/logs/
artifacts/test-results/
artifacts/archive/
```

**Risk:** NONE - All regenerable  
**Impact:** Smaller repo size, faster operations

---

## 🚀 Implementation Plan

### Step 1: Safety First - Create Snapshot (DONE)
- ✅ Backup already exists in .docs-backup

### Step 2: Update .gitignore
```bash
1. Add build outputs (dist/, storybook-static/)
2. Add artifact directories
3. Add test reports
4. Commit .gitignore changes
```

### Step 3: Remove Verified Duplicates
```bash
1. Verify .docs-backup matches docs/
2. Delete .docs-backup/
3. Commit deletion
```

### Step 4: Reorganize Meta Documentation
```bash
1. Create docs/meta/ directory
2. Move reorganization documentation files
3. Update README to reference new locations
4. Commit structural changes
```

### Step 5: Consolidate Automation
```bash
1. Create project/ directory structure
2. Move .agent/ → project/automation/agent/
3. Move .claude/ → project/automation/claude/
4. Update any references
5. Commit automation consolidation
```

### Step 6: Clean Generated Artifacts
```bash
1. Review artifacts/ contents
2. Move to archive/ if historical value
3. Delete truly regenerable items
4. Commit artifact cleanup
```

### Step 7: Normalize File Names (Optional)
```bash
1. Rename files to kebab-case
2. Update internal references
3. Test documentation links
4. Commit naming normalization
```

---

## 📏 Success Criteria

✅ **No duplicate content** - Single source of truth  
✅ **Clean .gitignore** - Only source code tracked  
✅ **Logical structure** - Easy to navigate  
✅ **Consistent naming** - kebab-case throughout  
✅ **No broken links** - All markdown references valid  
✅ **Smaller repo size** - Faster clones/operations  

---

## 📊 Expected Impact

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Root directories | 15 | 11 | -27% |
| Tracked files | ~1,000 | ~500 | -50% |
| Repo size | ~70MB | ~35MB | -50% |
| Tree file lines | 19,569 | ~10,000 | -49% |
| Documentation duplicates | Yes | No | 100% |

---

## ⚠️ Risks & Mitigation

### Risk 1: Data Loss
**Mitigation:** Full verification before any deletion

### Risk 2: Broken Links
**Mitigation:** Systematic link checking after moves

### Risk 3: Build Failures
**Mitigation:** Only touch non-runtime files

### Risk 4: Team Disruption
**Mitigation:** Clear communication, documentation

---

## 🔄 Rollback Plan

If issues arise:
1. Restore from .docs-backup (before deletion)
2. Revert .gitignore changes
3. Restore moved files from git history
4. Document what went wrong

---

## 📝 Next Steps

1. **Review this plan** - Get approval
2. **Execute Step 2** - Update .gitignore
3. **Execute Step 3** - Remove duplicates
4. **Validate** - Check repo state
5. **Continue** - Steps 4-7 as approved
6. **Document** - Create cleanup summary

---

**Ready to proceed with implementation?**
