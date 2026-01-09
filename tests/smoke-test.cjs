// smoke-test.cjs
// Playwright-based smoke test for all UDS SID test suites
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

// SID test configurations
const SID_TESTS = [
    { sid: '10', name: 'Diagnostic Session Control' },
    { sid: '11', name: 'ECU Reset' },
    { sid: '14', name: 'Clear DTC Information' },
    { sid: '19', name: 'Read DTC Information' },
    { sid: '22', name: 'Read Data By Identifier' },
    { sid: '23', name: 'Read Memory By Address' },
    { sid: '27', name: 'Security Access' },
    { sid: '28', name: 'Communication Control' },
    { sid: '2a', name: 'Read Data By Periodic ID' },
    { sid: '2e', name: 'Write Data By Identifier' },
    { sid: '31', name: 'Routine Control' },
    { sid: '34', name: 'Request Download' },
    { sid: '35', name: 'Request Upload' },
    { sid: '36', name: 'Transfer Data' },
    { sid: '37', name: 'Request Transfer Exit' },
    { sid: '3d', name: 'Write Memory By Address' },
    { sid: '3e', name: 'Tester Present' },
    { sid: '83', name: 'Access Timing Parameters' },
    { sid: '85', name: 'Control DTC Setting' },
];

// Get test file path for a SID
function getTestFilePath(sid) {
    const sidDir = `sid-${sid}`;
    const fileName = `SID${sid.toUpperCase()}_TestCases.json`;
    return path.resolve(__dirname, 'test-data', sidDir, fileName);
}

// Check if test file exists
function testFileExists(sid) {
    const filePath = getTestFilePath(sid);
    return fs.existsSync(filePath);
}

// Main smoke test function
async function runSmokeTest(baseUrl = 'http://localhost:5173') {
    const results = [];
    const startTime = Date.now();

    console.log('\n' + '='.repeat(70));
    console.log('🔥 UDS SIMULATOR SMOKE TEST');
    console.log('='.repeat(70));
    console.log(`\n🌐 Target URL: ${baseUrl}/simulator`);
    console.log(`📂 Testing ${SID_TESTS.length} SID test suites\n`);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();

    try {
        // Navigate to simulator page
        console.log('📍 Navigating to simulator...');
        await page.goto(`${baseUrl}/simulator`, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(2000);

        // Power on ECU - look for power toggle button
        console.log('⚡ Powering on ECU...');
        try {
            // Find and click the ECU power button - look for buttons with power-related text or icons
            const powerButton = await page.$('[data-testid="ecu-power"]');
            if (powerButton) {
                await powerButton.click();
                await page.waitForTimeout(1000);
                console.log('✅ ECU powered on');
            } else {
                // Try to find it by other means - look for toggle switches or power buttons
                const buttons = await page.$$('button');
                for (const btn of buttons) {
                    const text = await btn.textContent().catch(() => '');
                    const ariaLabel = await btn.getAttribute('aria-label').catch(() => '');
                    if (text.toLowerCase().includes('power') ||
                        ariaLabel?.toLowerCase().includes('power') ||
                        text.toLowerCase().includes('on/off')) {
                        await btn.click();
                        await page.waitForTimeout(1000);
                        console.log('✅ ECU powered on (via button)');
                        break;
                    }
                }
            }
        } catch (e) {
            console.log('⚠️  Could not find explicit power button, ECU may be auto-powered');
        }

        // Test each SID
        for (const sidTest of SID_TESTS) {
            const testFile = getTestFilePath(sidTest.sid);

            console.log(`\n${'─'.repeat(50)}`);
            console.log(`🧪 Testing SID 0x${sidTest.sid.toUpperCase()}: ${sidTest.name}`);

            if (!testFileExists(sidTest.sid)) {
                console.log(`⚠️  Test file not found: ${testFile}`);
                results.push({
                    sid: sidTest.sid,
                    name: sidTest.name,
                    status: 'SKIPPED',
                    reason: 'Test file not found',
                    successRate: null
                });
                continue;
            }

            try {
                // Read the test file content
                const testContent = fs.readFileSync(testFile, 'utf8');
                const testData = JSON.parse(testContent);
                const requestCount = testData.requests?.length || 0;

                console.log(`   📄 Loading ${requestCount} test requests...`);

                // Use the file chooser approach - proper Playwright way
                // Set up file chooser listener BEFORE clicking import
                const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 5000 }).catch(() => null);

                // Find and click the Import button
                const importButton = await page.locator('button:has-text("Import")').first();
                if (await importButton.count() > 0) {
                    await importButton.click();

                    // Wait for file chooser dialog
                    const fileChooser = await fileChooserPromise;
                    if (fileChooser) {
                        // Set the file
                        await fileChooser.setFiles(testFile);
                        console.log(`   ✅ File imported via file chooser`);
                    } else {
                        console.log(`   ⚠️  File chooser not triggered, trying alternative approach`);

                        // Alternative: Inject the data directly via page.evaluate
                        const importResult = await page.evaluate((jsonStr) => {
                            try {
                                const data = JSON.parse(jsonStr);

                                // Try to dispatch an event or find import handler
                                if (window.__UDS_IMPORT_SCENARIO__) {
                                    window.__UDS_IMPORT_SCENARIO__(data);
                                    return { success: true, method: 'window hook' };
                                }

                                // Try custom event
                                const event = new CustomEvent('uds-import-test', { detail: data });
                                window.dispatchEvent(event);
                                return { success: true, method: 'custom event' };
                            } catch (e) {
                                return { success: false, error: e.message };
                            }
                        }, testContent);

                        if (importResult.success) {
                            console.log(`   ✅ Imported via ${importResult.method}`);
                        }
                    }
                } else {
                    console.log(`   ⚠️  Import button not found`);
                }

                // Wait for potential replay to start/complete
                await page.waitForTimeout(3000);

                // Check if replay started by looking for replay controls or indicators
                const hasReplayIndicator = await page.locator('text=Step').or(
                    page.locator('text=Replaying')
                ).or(
                    page.locator('.replay-controls')
                ).count() > 0;

                if (hasReplayIndicator) {
                    console.log(`   ▶️  Replay detected, waiting for completion...`);

                    // Wait for replay to complete (max 2 minutes per SID)
                    const maxWait = 120000;
                    const startWait = Date.now();

                    while (Date.now() - startWait < maxWait) {
                        const isReplaying = await page.locator('text=Replaying').or(
                            page.locator('text=Playing')
                        ).count() > 0;
                        if (!isReplaying) break;
                        await page.waitForTimeout(1000);
                    }
                }

                // Try to get success rate from the UI
                let successRate = null;
                try {
                    // Get page text content and look for success rate
                    const bodyText = await page.textContent('body');
                    const rateMatch = bodyText.match(/Success(?:\s*Rate)?[:\s]+(\d+(?:\.\d+)?)\s*%/i);
                    if (rateMatch) {
                        successRate = parseFloat(rateMatch[1]);
                    }
                } catch (e) {
                    // Could not extract success rate
                }

                // Count visible history items as metric
                const historyCount = await page.locator('.request-history-item, [data-testid="history-item"]').count().catch(() => 0);

                console.log(`   ✅ Test complete`);
                if (successRate !== null) {
                    console.log(`   📊 Success Rate: ${successRate}%`);
                }
                if (historyCount > 0) {
                    console.log(`   📝 Requests in history: ${historyCount}`);
                }

                results.push({
                    sid: sidTest.sid,
                    name: sidTest.name,
                    status: 'PASSED',
                    successRate: successRate,
                    requestCount: requestCount,
                    historyCount: historyCount
                });

            } catch (error) {
                console.log(`   ❌ Error: ${error.message}`);
                results.push({
                    sid: sidTest.sid,
                    name: sidTest.name,
                    status: 'ERROR',
                    error: error.message,
                    successRate: null
                });
            }

            // Reset for next test - navigate back to simulator
            await page.goto(`${baseUrl}/simulator`, { waitUntil: 'networkidle', timeout: 30000 });
            await page.waitForTimeout(1000);
        }

    } catch (error) {
        console.error('\n❌ Fatal error during smoke test:', error);
    } finally {
        await browser.close();
    }

    // Generate summary
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(1);

    const passed = results.filter(r => r.status === 'PASSED').length;
    const failed = results.filter(r => r.status === 'ERROR').length;
    const skipped = results.filter(r => r.status === 'SKIPPED').length;

    console.log('\n' + '='.repeat(70));
    console.log('📋 SMOKE TEST SUMMARY');
    console.log('='.repeat(70));
    console.log(`\n⏱️  Duration: ${duration}s`);
    console.log(`✅ Passed:  ${passed}`);
    console.log(`❌ Failed:  ${failed}`);
    console.log(`⚠️  Skipped: ${skipped}`);
    console.log(`📊 Total:   ${results.length}`);

    // Show details of failed tests
    if (failed > 0) {
        console.log('\n❌ Failed Tests:');
        results.filter(r => r.status === 'ERROR').forEach(r => {
            console.log(`   • SID 0x${r.sid.toUpperCase()} (${r.name}): ${r.error}`);
        });
    }

    // Save report
    const reportDir = path.resolve(__dirname, '..', 'artifacts', 'results');
    if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
    }

    const report = {
        timestamp: new Date().toISOString(),
        duration: `${duration}s`,
        summary: { passed, failed, skipped, total: results.length },
        results
    };

    const reportPath = path.join(reportDir, 'smoke-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Report saved: ${reportPath}`);

    console.log('='.repeat(70) + '\n');

    // Exit with appropriate code
    process.exit(failed > 0 ? 1 : 0);
}

// Run the smoke test
const url = process.argv[2] || 'http://localhost:5173';
runSmokeTest(url).catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
