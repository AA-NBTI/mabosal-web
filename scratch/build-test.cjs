const { build } = require('vite');
const fs = require('fs');

async function run() {
  try {
    await build();
    fs.writeFileSync('build_status.txt', 'SUCCESS', 'utf8');
    console.log('BUILD FINISHED SUCCESSFULLY');
  } catch (err) {
    fs.writeFileSync('build_status.txt', String(err.stack || err), 'utf8');
    console.error('BUILD FAILED:', err);
  }
}

run();
