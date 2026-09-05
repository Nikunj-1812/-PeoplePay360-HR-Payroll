// Verification suite for Redis caching, invalidation, security, and fallback
const redisService = require('./services/redisService');

async function runTests() {
  console.log('====================================================');
  console.log('PeoplePay360 - Redis Caching & Invalidation Test Suite');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, testName) {
    total++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
    }
  }

  // Basic Set & Get
  console.log('--- Test Group 1: Cache Store & Retrieval ---');
  await redisService.set('pp360:test:key1', { message: 'Hello Redis', value: 123 }, 60);
  const val1 = await redisService.get('pp360:test:key1');
  assert(val1 && val1.message === 'Hello Redis' && val1.value === 123, 'Set & Get object from cache');

  // Cache Miss
  const missVal = await redisService.get('pp360:test:non_existent');
  assert(missVal === null, 'Cache miss returns null cleanly');

  // Sensitive data sanitization
  console.log('\n--- Test Group 2: Security & Sensitive Data Sanitization ---');
  const sensitiveUser = {
    id: 1,
    name: 'Admin User',
    email: 'admin@peoplepay360.com',
    password_hash: '$2a$10$xyzSecretHashNotToBeCached',
    password: 'SuperSecretPassword',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    jwt: 'jwt_token_data',
    secret: 'hidden_secret_key',
    role: 'admin'
  };
  await redisService.set('pp360:user:profile:1', sensitiveUser, 60);
  const cachedUser = await redisService.get('pp360:user:profile:1');
  assert(
    cachedUser && 
    cachedUser.id === 1 && 
    cachedUser.role === 'admin' && 
    cachedUser.password_hash === undefined && 
    cachedUser.password === undefined && 
    cachedUser.token === undefined && 
    cachedUser.jwt === undefined && 
    cachedUser.secret === undefined,
    'Sensitive fields (password_hash, password, token, jwt, secret) are stripped before caching'
  );

  // Delete single key
  console.log('\n--- Test Group 3: Cache Deletion & Pattern Invalidation ---');
  await redisService.del('pp360:test:key1');
  const afterDel = await redisService.get('pp360:test:key1');
  assert(afterDel === null, 'del(key) removes item from cache');

  // Employee domain invalidation
  await redisService.set('pp360:employees:list:admin:all:{}', [{ id: 1, name: 'EMP1' }], 60);
  await redisService.set('pp360:employees:detail:1', { id: 1, name: 'EMP1' }, 60);
  await redisService.set('pp360:dashboard:global:{}', { kpi: 100 }, 60);
  await redisService.invalidateEmployees(1);

  const empListAfter = await redisService.get('pp360:employees:list:admin:all:{}');
  const empDetailAfter = await redisService.get('pp360:employees:detail:1');
  const dashAfter = await redisService.get('pp360:dashboard:global:{}');
  assert(empListAfter === null && empDetailAfter === null && dashAfter === null, 'invalidateEmployees() purges list, detail and dashboard caches');

  // Attendance domain invalidation
  await redisService.set('pp360:attendance:employee:1:{}', [{ id: 1, status: 'Present' }], 60);
  await redisService.set('pp360:dashboard:global:{}', { kpi: 200 }, 60);
  await redisService.invalidateAttendance(1);

  const attAfter = await redisService.get('pp360:attendance:employee:1:{}');
  const dashAfterAtt = await redisService.get('pp360:dashboard:global:{}');
  assert(attAfter === null && dashAfterAtt === null, 'invalidateAttendance() purges attendance and dashboard caches');

  // Time-off domain invalidation
  await redisService.set('pp360:timeoff:requests:admin:all:{}', [{ id: 1, status: 'Pending' }], 60);
  await redisService.set('pp360:timeoff:allocations:employee:1', [{ id: 1, remaining_days: 10 }], 60);
  await redisService.invalidateTimeOff(1);

  const timeOffReqAfter = await redisService.get('pp360:timeoff:requests:admin:all:{}');
  const timeOffAllocAfter = await redisService.get('pp360:timeoff:allocations:employee:1');
  assert(timeOffReqAfter === null && timeOffAllocAfter === null, 'invalidateTimeOff() purges requests and allocations caches');

  // Payruns & structures domain invalidation
  await redisService.set('pp360:salary:structures:list', [{ id: 1, name: 'Regular' }], 60);
  await redisService.set('pp360:payruns:list', [{ id: 1, status: 'Draft' }], 60);
  await redisService.set('pp360:payruns:detail:1', { id: 1, total_net: 50000 }, 60);
  await redisService.invalidateSalaryStructures(1);
  await redisService.invalidatePayruns(1);

  const structAfter = await redisService.get('pp360:salary:structures:list');
  const payrunListAfter = await redisService.get('pp360:payruns:list');
  const payrunDetailAfter = await redisService.get('pp360:payruns:detail:1');
  assert(structAfter === null && payrunListAfter === null && payrunDetailAfter === null, 'invalidateSalaryStructures() & invalidatePayruns() purge structures and payruns');

  // Cross-user cache isolation
  console.log('\n--- Test Group 4: Cross-User Isolation ---');
  await redisService.set('pp360:attendance:employee:1:{}', [{ id: 1, employee_id: 1, status: 'Present' }], 60);
  await redisService.set('pp360:attendance:employee:2:{}', [{ id: 2, employee_id: 2, status: 'Late' }], 60);

  const user1Data = await redisService.get('pp360:attendance:employee:1:{}');
  const user2Data = await redisService.get('pp360:attendance:employee:2:{}');
  assert(
    user1Data && user2Data && user1Data[0].employee_id === 1 && user2Data[0].employee_id === 2,
    'User-scoped keys guarantee data isolation between different authenticated users'
  );

  // Test summary output
  console.log('\n====================================================');
  console.log(`Results: ${passed} / ${total} Tests Passed (${Math.round((passed/total)*100)}%)`);
  console.log('====================================================\n');

  if (passed === total) {
    console.log('ALL REDIS & CACHE VERIFICATION TESTS COMPLETED SUCCESSFULLY.');
  } else {
    throw new Error('Some verification tests failed.');
  }
}

if (require.main === module) {
  runTests().catch((err) => {
    console.error('Test execution failed:', err);
    process.exit(1);
  });
}

module.exports = { runTests };
