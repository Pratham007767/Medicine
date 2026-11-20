const { spawn } = require('child_process');
const http = require('http');

console.log('Starting Next.js production server for test verification...');

const nextProc = spawn('node', ['node_modules/next/dist/bin/next', 'start', '-p', '3005'], {
  stdio: 'inherit',
  shell: true
});

function checkServerReady(retries = 20) {
  return new Promise((resolve, reject) => {
    function tryConnect() {
      const req = http.get('http://localhost:3005/api/medicines', (res) => {
        resolve();
      });
      req.on('error', (err) => {
        if (retries > 0) {
          retries--;
          setTimeout(tryConnect, 500);
        } else {
          reject(new Error('Server failed to start within timeout'));
        }
      });
    }
    tryConnect();
  });
}

async function run() {
  try {
    await checkServerReady();
    console.log('Server is ready on port 3005. Executing audit tests...');

    // Run test script targeting port 3005
    const testProc = spawn('node', ['scripts/test_port_3005.js'], {
      stdio: 'inherit'
    });

    testProc.on('exit', (code) => {
      console.log('Tests completed with exit code:', code);
      try {
        process.kill(nextProc.pid);
      } catch {}
      process.exit(code || 0);
    });
  } catch (err) {
    console.error('Failed to run tests:', err);
    try {
      process.kill(nextProc.pid);
    } catch {}
    process.exit(1);
  }
}

run();
