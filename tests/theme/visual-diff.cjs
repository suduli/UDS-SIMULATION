// theme-test-visual-diff.cjs
// Visual regression testing with pixelmatch
const fs = require('fs')
const path = require('path')
const { PNG } = require('pngjs')
const pixelmatch = require('pixelmatch').default || require('pixelmatch')

function createDiff(img1Path, img2Path, diffPath) {
    const img1 = PNG.sync.read(fs.readFileSync(img1Path))
    const img2 = PNG.sync.read(fs.readFileSync(img2Path))

    const { width, height } = img1

    // Ensure images are same size
    if (img2.width !== width || img2.height !== height) {
        console.warn(`⚠️  Image size mismatch: ${img1Path} vs ${img2Path}`)
        return null
    }

    const diff = new PNG({ width, height })

    const numDiffPixels = pixelmatch(
        img1.data,
        img2.data,
        diff.data,
        width,
        height,
        { threshold: 0.1 }
    )

    fs.writeFileSync(diffPath, PNG.sync.write(diff))

    const totalPixels = width * height
    const diffPercentage = ((numDiffPixels / totalPixels) * 100).toFixed(2)

    return {
        numDiffPixels,
        totalPixels,
        diffPercentage,
        diffPath
    }
}

async function main() {
    const resultsDir = path.resolve('artifacts', 'results')
    const diffsDir = path.join(resultsDir, 'diffs')

    if (!fs.existsSync(diffsDir)) {
        fs.mkdirSync(diffsDir, { recursive: true })
    }

    console.log('\n🔍 Creating visual diffs...\n')

    // Desktop diff
    const lightDesktop = path.join(resultsDir, 'light-desktop.png')
    const darkDesktop = path.join(resultsDir, 'dark-desktop.png')
    const desktopDiff = path.join(diffsDir, 'desktop-diff.png')

    if (fs.existsSync(lightDesktop) && fs.existsSync(darkDesktop)) {
        const result = createDiff(lightDesktop, darkDesktop, desktopDiff)
        if (result) {
            console.log(`✅ Desktop diff: ${result.diffPercentage}% different (${result.numDiffPixels} pixels)`)
            console.log(`   Saved to: ${desktopDiff}`)
        }
    } else {
        console.log('❌ Desktop screenshots not found. Run theme-test-playwright.cjs first.')
    }

    // Mobile diff
    const lightMobile = path.join(resultsDir, 'light-mobile.png')
    const darkMobile = path.join(resultsDir, 'dark-mobile.png')
    const mobileDiff = path.join(diffsDir, 'mobile-diff.png')

    if (fs.existsSync(lightMobile) && fs.existsSync(darkMobile)) {
        const result = createDiff(lightMobile, darkMobile, mobileDiff)
        if (result) {
            console.log(`✅ Mobile diff: ${result.diffPercentage}% different (${result.numDiffPixels} pixels)`)
            console.log(`   Saved to: ${mobileDiff}`)
        }
    } else {
        console.log('❌ Mobile screenshots not found. Run theme-test-playwright.cjs first.')
    }

    console.log('\n✨ Visual diff complete!\n')
}

main().catch(err => {
    console.error('❌ Error:', err)
    process.exit(1)
})
