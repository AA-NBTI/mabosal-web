const { spawn } = require('child_process');
const fs = require('fs');

const cp = spawn('npx', ['vite', 'build'], { cwd: process.cwd(), shell: true });

let out = '';
let err = '';

cp.stdout.on('data', d => { out += d.toString(); });
cp.stderr.on('data', d => { err += d.toString(); });

cp.on('close', code => {
  fs.writeFileSync('build_result.txt', `CODE: ${code}\n--- OUT ---\n${out}\n--- ERR ---\n${err}`, 'utf8');
  console.log('EXIT CODE:', code);
});
