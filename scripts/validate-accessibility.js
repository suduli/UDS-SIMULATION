#!/usr/bin/env node

/**
 * Automated Pre-Testing Validation Script
 * Checks code for common accessibility issues before manual testing
 * 
 * Run: node validate-accessibility.js
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 UDS Simulator - Accessibility Pre-Test Validation\n');
console.log('=' .repeat(60));

let issues = [];
let warnings = [];
let passes = [];

// Check 1: Verify meta viewport tag exists
console.log('\n📱 Checking viewport meta tag...');
const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
if (indexHtml.includes('<meta name="viewport"')) {
  passes.push('✅ Viewport meta tag found');
} else {
  issues.push('❌ CRITICAL: Missing viewport meta tag in index.html');
}

// Check 2: Verify skip link implementation
console.log('⏭️  Checking skip navigation link...');
const appTsx = fs.readFileSync(path.join(__dirname, 'src/App.tsx'), 'utf8');
if (appTsx.includes('Skip to main content') && appTsx.includes('id="main-content"')) {
  passes.push('✅ Skip navigation link implemented');
} else {
  issues.push('❌ CRITICAL: Skip navigation link missing or incomplete');
}

// Check 3: Verify high contrast CSS exists
console.log('🎨 Checking high contrast mode styles...');
const indexCss = fs.readFileSync(path.join(__dirname, 'src/index.css'), 'utf8');
if (indexCss.includes('[data-contrast="high"]')) {
  passes.push('✅ High contrast mode CSS found');
} else {
  issues.push('❌ CRITICAL: High contrast mode styles missing');
}

// Check 4: Verify mobile styles exist
console.log('📱 Checking mobile responsive styles...');
if (indexCss.includes('@media (max-width: 768px)')) {
  passes.push('✅ Mobile responsive styles found');
} else {
  issues.push('❌ CRITICAL: Mobile responsive styles missing');
}

// Check 5: Verify touch target sizes
console.log('👆 Checking touch target CSS...');
if (indexCss.includes('min-height: 44px') || indexCss.includes('min-width: 44px')) {
  passes.push('✅ Touch target size CSS found (44px)');
} else {
  warnings.push('⚠️  WARNING: Touch target size CSS not explicitly set to 44px');
}

// Check 6: Verify reduced motion support
console.log('🎬 Checking reduced motion support...');
if (indexCss.includes('prefers-reduced-motion')) {
  passes.push('✅ Reduced motion support found');
} else {
  warnings.push('⚠️  WARNING: Reduced motion preferences not handled');
}

// Check 7: Verify focus-visible styles
console.log('🎯 Checking focus indicators...');
if (indexCss.includes(':focus-visible')) {
  passes.push('✅ Focus-visible styles implemented');
} else {
  warnings.push('⚠️  WARNING: :focus-visible styles not found (may use :focus)');
}

// Check 8: Verify ARIA attributes
console.log('♿ Checking ARIA attributes...');
const headerTsx = fs.readFileSync(path.join(__dirname, 'src/components/Header.tsx'), 'utf8');
if (headerTsx.includes('aria-label') || headerTsx.includes('aria-expanded')) {
  passes.push('✅ ARIA attributes found in Header component');
} else {
  warnings.push('⚠️  WARNING: Limited ARIA attributes in Header component');
}

// Check 9: Verify screen reader utilities
console.log('🔊 Checking screen reader utilities...');
if (indexCss.includes('.sr-only')) {
  passes.push('✅ Screen reader only utility class found');
} else {
  warnings.push('⚠️  WARNING: .sr-only utility class not found');
}

// Check 10: Verify ThemeContext has high contrast
console.log('🌓 Checking ThemeContext...');
const themeContext = fs.readFileSync(path.join(__dirname, 'src/context/ThemeContext.tsx'), 'utf8');
if (themeContext.includes('highContrast') && themeContext.includes('toggleHighContrast')) {
  passes.push('✅ High contrast state management found in ThemeContext');
} else {
  issues.push('❌ CRITICAL: High contrast state missing in ThemeContext');
}

// Print Results
console.log('\n' + '='.repeat(60));
console.log('\n📊 VALIDATION RESULTS\n');

if (passes.length > 0) {
  console.log('✅ PASSED CHECKS (' + passes.length + '):\n');
  passes.forEach(p => console.log('   ' + p));
}

if (warnings.length > 0) {
  console.log('\n⚠️  WARNINGS (' + warnings.length + '):\n');
  warnings.forEach(w => console.log('   ' + w));
}

if (issues.length > 0) {
  console.log('\n❌ CRITICAL ISSUES (' + issues.length + '):\n');
  issues.forEach(i => console.log('   ' + i));
}

console.log('\n' + '='.repeat(60));

// Summary
if (issues.length === 0 && warnings.length === 0) {
  console.log('\n✅ ✅ ✅ ALL CHECKS PASSED! ✅ ✅ ✅');
  console.log('\n🚀 Ready for manual testing!');
  console.log('\nNext steps:');
  console.log('1. Run: npm run dev');
  console.log('2. Open: http://localhost:5173/UDS-SIMULATION/');
  console.log('3. Follow: WEEK5_TESTING_PROTOCOL.md');
  process.exit(0);
} else if (issues.length === 0) {
  console.log('\n⚠️  VALIDATION PASSED WITH WARNINGS');
  console.log('\nYou can proceed with testing, but review warnings above.');
  console.log('\nNext steps:');
  console.log('1. Run: npm run dev');
  console.log('2. Open: http://localhost:5173/UDS-SIMULATION/');
  console.log('3. Follow: WEEK5_TESTING_PROTOCOL.md');
  process.exit(0);
} else {
  console.log('\n❌ VALIDATION FAILED');
  console.log('\n⚠️  Fix critical issues above before proceeding with testing.');
  process.exit(1);
}
