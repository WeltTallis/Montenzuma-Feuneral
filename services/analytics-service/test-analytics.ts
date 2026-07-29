/**
 * Test script for deceased analytics
 * Run with: npx ts-node test-analytics.ts
 */

import { getDeceasedAnalytics } from './controllers/deceasedAnalytics.controller';
import { processDeceasedAnalyticsStream } from './services/backgroundAnalytics.service';

// Mock request object
const mockReq = {
  query: {
    timeRange: '3m',
    startDate: undefined,
    endDate: undefined,
    status: undefined,
    pmFilter: undefined,
    searchQuery: undefined,
    selectedDate: undefined,
    branchId: undefined
  },
  headers: {
    'x-tenant-slug': 'system_shared',
    'x-tenant-id': 'system_shared',
    'x-branch-id': null
  },
  app: {
    get: () => null
  }
} as any;

// Mock response object
const mockRes = {
  status: (code: number) => ({
    json: (data: any) => {
      console.log(`\n=== Response Status: ${code} ===`);
      console.log('Response Data:', JSON.stringify(data, null, 2));
      return mockRes;
    }
  })
} as any;

async function testAnalytics() {
  console.log('🧪 Testing Deceased Analytics Controller...\n');
  
  try {
    // Test 1: Basic analytics request
    console.log('Test 1: Basic analytics request (system_shared tenant)');
    await getDeceasedAnalytics(mockReq, mockRes);
    
    // Test 2: Streaming analytics
    console.log('\n\nTest 2: Streaming background analytics');
    console.log('Starting streaming analytics...');
    
    let progressCount = 0;
    const result = await processDeceasedAnalyticsStream(
      'system_shared',
      undefined,
      (progress) => {
        progressCount++;
        console.log(`Progress update #${progressCount}: ${progress}%`);
      }
    );
    
    console.log('\n✅ Streaming analytics completed!');
    console.log('Result keys:', Object.keys(result));
    console.log('Total deceased:', result.total);
    console.log('Active cases:', result.active);
    console.log('Released:', result.released);
    
    console.log('\n\n✅ All tests passed!');
    
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run tests
testAnalytics().catch(console.error);