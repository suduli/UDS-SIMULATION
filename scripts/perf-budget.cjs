#!/usr/bin/env node
// Performance and bundle budget checks

const fs = require('fs');
const path = require('path');

const BUDGET_KB = {
  total: 500,
  js: 300,
  css: 50,
};

function checkBudget() {
  const distPath = path.join(__dirname, '..', 'dist');
  
  if (!fs.existsSync(distPath)) {
    console.log('⚠️  Dist folder not found. Run build first.');
    return process.exit(1);
  }

  const files = fs.readdirSync(distPath, { recursive: true });
  let totalSize = 0;
  let jsSize = 0;
  let cssSize = 0;

  files.forEach((file) => {
    const filePath = path.join(distPath, file);
    if (fs.statSync(filePath).isFile()) {
      const stats = fs.statSync(filePath);
      const sizeKB = stats.size / 1024;
      
      totalSize += sizeKB;
      
      if (file.endsWith('.js')) {
        jsSize += sizeKB;
      } else if (file.endsWith('.css')) {
        cssSize += sizeKB;
      }
    }
  });

  console.log('📊 Bundle Size Report:');
  console.log(`   Total: ${totalSize.toFixed(2)} KB (budget: ${BUDGET_KB.total} KB)`);
  console.log(`   JS: ${jsSize.toFixed(2)} KB (budget: ${BUDGET_KB.js} KB)`);
  console.log(`   CSS: ${cssSize.toFixed(2)} KB (budget: ${BUDGET_KB.css} KB)`);

  let failed = false;

  if (totalSize > BUDGET_KB.total) {
    console.error(`❌ Total bundle size exceeds budget by ${(totalSize - BUDGET_KB.total).toFixed(2)} KB`);
    failed = true;
  }

  if (jsSize > BUDGET_KB.js) {
    console.error(`❌ JS bundle size exceeds budget by ${(jsSize - BUDGET_KB.js).toFixed(2)} KB`);
    failed = true;
  }

  if (cssSize > BUDGET_KB.css) {
    console.error(`❌ CSS bundle size exceeds budget by ${(cssSize - BUDGET_KB.css).toFixed(2)} KB`);
    failed = true;
  }

  if (!failed) {
    console.log('✅ All budgets passed!');
  }

  process.exit(failed ? 1 : 0);
}

checkBudget();
