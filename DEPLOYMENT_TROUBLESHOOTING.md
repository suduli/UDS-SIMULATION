# GitHub Actions Deployment Troubleshooting Guide

## Current Status
- ✅ Local build succeeds (`npm run build`)
- ✅ Dist folder created with index.html
- ✅ Vite config has correct base path: `/UDS-SIMULATION/`
- ❌ GitHub Actions deployment failing

## Steps to Diagnose

### 1. Check GitHub Actions Logs
Go to: https://github.com/suduli/UDS-SIMULATION/actions

Look for the latest workflow run and check:
- Which step is failing? (build or deploy?)
- What is the exact error message?

### 2. Common Issues and Solutions

#### Issue: "Resource not accessible by integration" or Permission Errors
**Solution**: Check GitHub Pages permissions
1. Go to repository Settings → Pages
2. Ensure "Source" is set to **GitHub Actions** (not "Deploy from a branch")
3. Go to Settings → Actions → General
4. Under "Workflow permissions", select "Read and write permissions"

#### Issue: Build fails with "Module not found" or dependency errors
**Solution**: Check package-lock.json is committed
```bash
git add package-lock.json
git commit -m "chore: add package-lock.json"
git push
```

#### Issue: 404 on deployment
**Solution**: Verify vite.config.ts base path matches repository name
- Current: `base: '/UDS-SIMULATION/'` ✓ Correct

#### Issue: Artifacts not uploading
**Solution**: Check .github/workflows/main.yml path
- Current: `path: './dist'` ✓ Correct

### 3. Manual Deployment Test

If GitHub Actions continues to fail, you can deploy manually:

```bash
# Build the project
npm run build

# Install GitHub Pages deployment tool (if not already)
npm install -D gh-pages

# Deploy to gh-pages branch
npx gh-pages -d dist
```

### 4. Verify Package.json Scripts

Check that these scripts exist:
```json
{
  "scripts": {
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  }
}
```

### 5. Check Node Version Compatibility

GitHub Actions uses Node 20. Verify locally:
```bash
node --version  # Should be compatible with v20
```

## What to Share for Further Help

Please provide:
1. Screenshot or text of the error from GitHub Actions
2. Which step is failing (build or deploy)?
3. Any red error messages in the logs

## Quick Fixes to Try

### Fix 1: Re-trigger the workflow
Go to Actions → Failed workflow → Click "Re-run all jobs"

### Fix 2: Verify GitHub Pages is enabled
Settings → Pages → Should show:
```
Your site is published at https://suduli.github.io/UDS-SIMULATION/
```

### Fix 3: Check if there are TypeScript errors
```bash
npm run build  # Should complete without errors
```

## Current Workflow Configuration

File: `.github/workflows/main.yml`
- ✓ Checkout code
- ✓ Setup Node.js 20
- ✓ Install dependencies (npm ci)
- ✓ Build project (npm run build)
- ✓ Upload dist folder as artifact
- ✓ Deploy to GitHub Pages

Everything looks configured correctly!
