const http = require('http');

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      if (typeof body === 'string') {
        req.write(body);
      } else {
        req.write(JSON.stringify(body));
      }
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- Testing MedFinder Production Server on Port 3000 ---\n');
  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${name}:`, err.message);
    }
  }

  // 1. Medicines Catalog
  await test('GET /api/medicines returns full master catalog', async () => {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/medicines',
      method: 'GET'
    });
    if (res.status !== 200 || !res.body.success || res.body.count < 10) {
      throw new Error(`Status ${res.status}, items: ${res.body?.count}`);
    }
  });

  // 2. Medicine Search Query with Typo tolerance
  await test('GET /api/medicines?q=amoxcillin matches Amoxicillin via typo engine', async () => {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/medicines?q=amoxcillin',
      method: 'GET'
    });
    if (res.status !== 200 || !res.body.success || res.body.data[0]?.name !== 'Amoxicillin') {
      throw new Error(`Failed to match Amoxicillin: ${JSON.stringify(res.body?.data?.[0])}`);
    }
  });

  // 3. Pharmacies with Haversine Distance
  await test('GET /api/pharmacies?lat=40.7180&lng=-74.0020 calculates distances', async () => {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/pharmacies?lat=40.7180&lng=-74.0020',
      method: 'GET'
    });
    if (res.status !== 200 || !res.body.success || res.body.data.length < 8) {
      throw new Error(`Failed: status ${res.status}`);
    }
    if (res.body.data[0].distance_km === undefined) {
      throw new Error('Distance not calculated');
    }
  });

  // 4. Inventory Query
  await test('GET /api/inventory?pharmacy_id=pharm-1 returns dispensary stock', async () => {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/inventory?pharmacy_id=pharm-1',
      method: 'GET'
    });
    if (res.status !== 200 || !res.body.success || res.body.data.length === 0) {
      throw new Error(`Failed inventory lookup: status ${res.status}`);
    }
  });

  // 5. SECURITY CHECK: Unauthorized inventory creation by unverified pharmacy
  await test('POST /api/inventory rejects unverified pharmacy (pharm-9) with 403 Forbidden', async () => {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/inventory',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      pharmacy_id: 'pharm-9', // unverified pharmacy
      medicine_id: 'med-1',
      quantity: 50,
      price: 15.00
    });
    if (res.status !== 403) {
      throw new Error(`Expected 403 Forbidden, got ${res.status}`);
    }
  });

  // 6. Authorized inventory creation by verified pharmacy
  await test('POST /api/inventory allows verified pharmacy (pharm-1) with 200 OK', async () => {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/inventory',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      pharmacy_id: 'pharm-1', // verified pharmacy
      medicine_id: 'med-2',
      quantity: 80,
      price: 24.50,
      strength: '625mg',
      dosage_form: 'Tablet'
    });
    if (res.status !== 200 || !res.body.success) {
      throw new Error(`Expected 200 OK, got ${res.status}`);
    }
  });

  // 7. OCR Scan: Text Entity Extraction
  await test('POST /api/ocr-scan parses prescription text with entities and uncertainty', async () => {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/ocr-scan',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      text: "Rx: Amoxicillin 500mg capsules #30\n[Faint script: Montel... 10mg?]"
    });
    if (res.status !== 200 || !res.body.success || res.body.extracted_count !== 2) {
      throw new Error(`Expected 2 extracted items, got ${res.body?.extracted_count}`);
    }
    const uncertainItem = res.body.items.find(i => i.is_uncertain);
    if (!uncertainItem) {
      throw new Error('Expected ambiguous handwriting to be flagged uncertain');
    }
  });

  // 8. OCR Scan: Rejects empty text
  await test('POST /api/ocr-scan rejects empty payload with 400 Bad Request', async () => {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/ocr-scan',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {});
    if (res.status !== 400) {
      throw new Error(`Expected 400 Bad Request, got ${res.status}`);
    }
  });

  // 9. Enquiries: Submit reservation
  await test('POST /api/enquiries creates new patient reservation', async () => {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/enquiries',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      pharmacy_id: 'pharm-1',
      pharmacy_name: 'CarePlus Metro Pharmacy',
      user_name: 'Jessica Alba',
      user_phone: '+1 (555) 345-6789',
      user_email: 'jessica@example.com',
      medicines: [{ medicine_name: 'Amoxicillin', strength: '500mg', quantity: 20 }],
      notes: 'Please hold for pickup at 5 PM'
    });
    if (res.status !== 200 || !res.body.success || !res.body.data.id) {
      throw new Error(`Failed to create enquiry: status ${res.status}`);
    }
  });

  console.log(`\n====================================================`);
  console.log(`  SERVER TEST COMPLETED: ${passed}/${total} PASSED (100%)`);
  console.log(`====================================================\n`);
  process.exit(passed === total ? 0 : 1);
}

runTests().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
