const API_BASE = 'http://localhost:5000/api';

async function benchmark() {
  console.log('=== BENCHMARKING BASELINE PERFORMANCE ===\n');

  // 1. Login to get JWT token
  const startLogin = Date.now();
  let token = '';
  try {
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@peoplepay360.com', password: 'Admin@123' })
    });
    const loginData = await loginRes.json();
    token = loginData.token;
    console.log(`[1] POST /api/auth/login: ${Date.now() - startLogin} ms (Success, Role: ${loginData.user?.role})`);
  } catch (err) {
    console.error('[1] POST /api/auth/login FAILED:', err.message);
    return;
  }

  const endpoints = [
    { name: 'GET /api/auth/me', url: '/auth/me' },
    { name: 'GET /api/dashboard', url: '/dashboard' },
    { name: 'GET /api/employees', url: '/employees' },
    { name: 'GET /api/contracts', url: '/contracts' },
    { name: 'GET /api/attendance', url: '/attendance' },
    { name: 'GET /api/time-off/requests', url: '/time-off/requests' },
    { name: 'GET /api/salary/structures', url: '/salary/structures' },
    { name: 'GET /api/payruns', url: '/payruns' },
    { name: 'GET /api/reports/employee', url: '/reports/employee' },
    { name: 'GET /api/reports/payroll', url: '/reports/payroll' },
  ];

  for (const ep of endpoints) {
    const times = [];
    let size = 0;
    for (let i = 0; i < 3; i++) {
      const t0 = Date.now();
      try {
        const res = await fetch(`${API_BASE}${ep.url}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const text = await res.text();
        const t1 = Date.now();
        times.push(t1 - t0);
        size = text.length;
      } catch (err) {
        console.error(`Error fetching ${ep.url}:`, err.message);
      }
    }
    const avg = times.length > 0 ? (times.reduce((a, b) => a + b, 0) / times.length).toFixed(1) : 'N/A';
    console.log(`${ep.name.padEnd(35)} | Avg Time: ${String(avg).padStart(6)} ms | Payload: ${(size / 1024).toFixed(2)} KB`);
  }

  console.log('\nBaseline Benchmark Completed.');
}

benchmark();
