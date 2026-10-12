const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else if (file.endsWith('.html')) {
      results.push(filePath);
    }
  }
  return results;
}

const files = walk('stitch_');
const imgMap = new Map();

for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  // Match src="..." or url('...')
  const regex = /(?:src=["']|url\(['"]?)(https:\/\/lh3\.googleusercontent\.com\/[^"'\)\s]+)(?:["']|\))/g;
  let m;
  while ((m = regex.exec(content)) !== null) {
    const url = m[1];
    const folder = path.basename(path.dirname(f));
    if (!imgMap.has(url)) {
      imgMap.set(url, new Set());
    }
    imgMap.get(url).add(folder);
  }
}

const report = [];
for (const [url, folders] of imgMap.entries()) {
  report.push({
    url,
    count: folders.size,
    folders: Array.from(folders)
  });
}

console.log(JSON.stringify(report, null, 2));
