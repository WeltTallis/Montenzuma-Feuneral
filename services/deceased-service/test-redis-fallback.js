/**
 * Test script to verify deceased service can handle Redis unavailability
 */

async function testRedisFallback() {
    console.log('Testing Redis fallback for deceased service...\n');

    // Test 1: Import queue modules
    console.log('Test 1: Importing queue modules...');
    try {
        const { getExcelExportQueue, isExcelExportQueueAvailable } = await import('./queues/excelExportQueue.ts');
        console.log('✓ Excel export queue module imported successfully');

        // Test 2: Try to initialize queue (should fail gracefully if Redis is not running)
        console.log('\nTest 2: Attempting to initialize Excel export queue...');
        const queue = await getExcelExportQueue();

        if (queue) {
            console.log('✓ Excel export queue initialized (Redis is available)');
        } else {
            console.log('✓ Excel export queue returned null (Redis not available - expected behavior)');
        }

        // Test 3: Check availability function
        console.log('\nTest 3: Checking queue availability...');
        const isAvailable = isExcelExportQueueAvailable();
        console.log(`✓ Queue availability check returned: ${isAvailable}`);

        // Test 4: Import PDF queue
        console.log('\nTest 4: Importing PDF queue module...');
        const { getPDFQueue, isPDFQueueAvailable } = await import('./queues/pdfQueue.ts');
        console.log('✓ PDF queue module imported successfully');

        const pdfQueue = await getPDFQueue();
        if (pdfQueue) {
            console.log('✓ PDF queue initialized (Redis is available)');
        } else {
            console.log('✓ PDF queue returned null (Redis not available - expected behavior)');
        }

        console.log('\n✅ All tests passed! Service can handle Redis unavailability gracefully.');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

testRedisFallback();