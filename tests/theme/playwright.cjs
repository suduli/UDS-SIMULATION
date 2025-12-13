// theme-test-playwright.cjs
const fs = require('fs')
const path = require('path')
const { chromium } = require('playwright')

// helpers
function toHex(rgb) {
    // rgb like "rgb(255, 255, 255)" or "#fff"
    if (!rgb) return null
    if (rgb.startsWith('#')) {
        const hex = rgb
        if (hex.length === 4) { // #fff
            return '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3]
        }
        return hex
    }
    const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
    if (!m) return null
    const r = parseInt(m[1]).toString(16).padStart(2, '0')
    const g = parseInt(m[2]).toString(16).padStart(2, '0')
    const b = parseInt(m[3]).toString(16).padStart(2, '0')
    return `#${r}${g}${b}`
}

// relative luminance and contrast per WCAG
function luminance(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255
    const srgb = [r, g, b].map(c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
    return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2]
}

function contrastRatio(hex1, hex2) {
    const L1 = luminance(hex1)
    const L2 = luminance(hex2)
    const light = Math.max(L1, L2)
    const dark = Math.min(L1, L2)
    return (light + 0.05) / (dark + 0.05)
}

async function runForScheme(url, scheme, outDir) {
    const browser = await chromium.launch()
    const context = await browser.newContext({
        viewport: { width: 1366, height: 768 },
        colorScheme: scheme // 'light' or 'dark'
    })
    const page = await context.newPage()
    await page.goto(url, { waitUntil: 'domcontentloaded' })

    // Wait for initial render
    await page.waitForTimeout(1000)

    // Try to find and click theme toggle
    const toggleSelectors = [
        '[data-theme-toggle]',
        '[aria-label*="theme"]',
        '[aria-label*="Theme"]',
        '.theme-toggle',
        '.color-scheme-toggle',
        '#theme-toggle',
        'button[title*="theme"]',
        'button[title*="Theme"]'
    ]

    let toggleFound = false
    for (const sel of toggleSelectors) {
        try {
            const el = await page.$(sel)
            if (el) {
                await el.click()
                await page.waitForTimeout(500)
                toggleFound = true
                console.log(`✓ Found and clicked theme toggle: ${sel}`)
                break
            }
        } catch (e) {
            // Continue to next selector
        }
    }

    if (!toggleFound) {
        console.log(`⚠ No theme toggle found for ${scheme} mode`)
    }

    // Check localStorage/cookie persistence
    const persistence = await page.evaluate(() => {
        return {
            localStorage: Object.keys(localStorage).filter(k => k.includes('theme') || k.includes('color')),
            cookies: document.cookie
        }
    })

    // Key selectors to inspect
    const inspectSelectors = {
        pageBackground: 'body',
        header: 'header',
        nav: 'nav',
        mainText: 'main, .main-content, article, p',
        primaryButton: 'button:not([disabled]), .btn:not([disabled]), .button:not([disabled])',
        disabledButton: 'button[disabled], .btn[disabled]',
        input: 'input, textarea, select',
        footer: 'footer',
        codeBlock: 'code, pre',
        modal: '.modal, [role="dialog"]',
        card: '.card, .panel, [class*="card"]'
    }

    const colors = {}
    for (const key of Object.keys(inspectSelectors)) {
        const sel = inspectSelectors[key]
        const el = await page.$(sel)
        if (!el) {
            colors[key] = { found: false }
            continue
        }
        const style = await el.evaluate(el => {
            const s = window.getComputedStyle(el)
            return {
                color: s.color,
                background: s.backgroundColor,
                borderColor: s.borderColor,
                boxShadow: s.boxShadow
            }
        })
        colors[key] = {
            found: true,
            color: toHex(style.color),
            background: toHex(style.background),
            borderColor: toHex(style.borderColor)
        }
    }

    // Extract CSS variables
    const cssVars = await page.evaluate(() => {
        const root = getComputedStyle(document.documentElement)
        const vars = {}
        for (let i = 0; i < root.length; i++) {
            const prop = root[i]
            if (prop.startsWith('--')) {
                vars[prop] = root.getPropertyValue(prop).trim()
            }
        }
        return vars
    })

    // Check focus outline visibility: tab to first interactive element
    await page.keyboard.press('Tab')
    await page.waitForTimeout(200)
    const focus = await page.evaluate(() => {
        const el = document.activeElement
        if (!el || el === document.body) return null
        const s = window.getComputedStyle(el)
        return {
            tag: el.tagName,
            outline: s.outline,
            outlineColor: s.outlineColor,
            outlineWidth: s.outlineWidth,
            boxShadow: s.boxShadow
        }
    })

    // Screenshot full page desktop
    const screenshotPath = path.join(outDir, `${scheme}-desktop.png`)
    await page.screenshot({ path: screenshotPath, fullPage: true })

    // Mobile screenshot
    await page.setViewportSize({ width: 375, height: 812 })
    await page.waitForTimeout(300)
    const screenshotMobile = path.join(outDir, `${scheme}-mobile.png`)
    await page.screenshot({ path: screenshotMobile, fullPage: true })

    await browser.close()

    return {
        colors,
        focus,
        persistence,
        cssVars,
        toggleFound,
        screenshots: {
            desktop: screenshotPath,
            mobile: screenshotMobile
        }
    }
}

async function main() {
    const url = process.argv[2] || 'http://localhost:5173'
    console.log(`\n🎨 Testing themes for: ${url}\n`)

    const outDir = path.resolve('artifacts', 'results')
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir)

    console.log('📸 Testing LIGHT theme...')
    const light = await runForScheme(url, 'light', outDir)

    console.log('📸 Testing DARK theme...')
    const dark = await runForScheme(url, 'dark', outDir)

    // Compute contrasts between text and background
    const checks = []
    const targets = ['mainText', 'primaryButton', 'input', 'header', 'footer', 'codeBlock']

    for (const t of targets) {
        // Light theme
        const L = light.colors[t]
        if (L?.found && L.color && L.background) {
            const fg = L.color
            const bg = L.background
            const ratio = contrastRatio(fg, bg)
            const wcagAA = ratio >= 4.5
            const wcagAAA = ratio >= 7.0
            checks.push({
                theme: 'light',
                selector: t,
                fg,
                bg,
                ratio: Number(ratio.toFixed(2)),
                wcagAA,
                wcagAAA,
                pass: wcagAA
            })
        }

        // Dark theme
        const D = dark.colors[t]
        if (D?.found && D.color && D.background) {
            const fg = D.color
            const bg = D.background
            const ratio = contrastRatio(fg, bg)
            const wcagAA = ratio >= 4.5
            const wcagAAA = ratio >= 7.0
            checks.push({
                theme: 'dark',
                selector: t,
                fg,
                bg,
                ratio: Number(ratio.toFixed(2)),
                wcagAA,
                wcagAAA,
                pass: wcagAA
            })
        }
    }

    // Analyze results
    const failures = checks.filter(c => !c.pass)
    const warnings = checks.filter(c => c.wcagAA && !c.wcagAAA)

    const summary = {
        pass: failures.length === 0,
        totalChecks: checks.length,
        failures: failures.map(f => ({
            theme: f.theme,
            selector: f.selector,
            ratio: f.ratio,
            expected: 4.5,
            recommendation: `Increase contrast between ${f.fg} and ${f.bg}. Current: ${f.ratio}:1, Required: 4.5:1`
        })),
        warnings: warnings.map(w => ({
            theme: w.theme,
            selector: w.selector,
            ratio: w.ratio,
            note: `Meets AA (${w.ratio}:1) but not AAA (7.0:1)`
        })),
        suggestions: []
    }

    // Add specific suggestions
    if (!light.toggleFound && !dark.toggleFound) {
        summary.suggestions.push('Add a visible theme toggle button with proper aria-label')
    }

    if (!light.focus && !dark.focus) {
        summary.suggestions.push('Ensure focus outlines are visible for keyboard navigation')
    }

    if (light.persistence.localStorage.length === 0) {
        summary.suggestions.push('Consider persisting theme preference in localStorage')
    }

    const report = {
        url,
        timestamp: new Date().toISOString(),
        light,
        dark,
        checks,
        summary
    }

    const reportPath = path.join(outDir, 'report.json')
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

    // Console summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 THEME TEST RESULTS')
    console.log('='.repeat(60))
    console.log(`\n✅ Total checks: ${checks.length}`)
    console.log(`${failures.length === 0 ? '✅' : '❌'} Failures: ${failures.length}`)
    console.log(`⚠️  Warnings (AA but not AAA): ${warnings.length}`)

    if (failures.length > 0) {
        console.log('\n❌ CONTRAST FAILURES:')
        failures.forEach(f => {
            console.log(`  • ${f.theme} - ${f.selector}: ${f.ratio}:1 (need 4.5:1)`)
        })
    }

    if (summary.suggestions.length > 0) {
        console.log('\n💡 SUGGESTIONS:')
        summary.suggestions.forEach(s => console.log(`  • ${s}`))
    }

    console.log(`\n📄 Full report: ${reportPath}`)
    console.log(`📸 Screenshots: ${outDir}/`)
    console.log('='.repeat(60) + '\n')
}

main().catch(err => {
    console.error('❌ Error:', err)
    process.exit(1)
})
