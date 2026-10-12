const fs = require('fs');
const filePath = 'src/modules/product-generator/customer-deliverable-builder.ts';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// Keep lines 0 to 973 (inclusive, up to line 974 `return report.join('\n');`)
// Then add `  }`
// Then keep from line 1234 (inclusive, line 1235 `\n`, line 1236 `/**`)
const part1 = lines.slice(0, 974);
const part2 = lines.slice(1234);

const newContent = [...part1, '  }', ...part2].join('\n');
fs.writeFileSync(filePath, newContent, 'utf8');
console.log('Successfully cleaned customer-deliverable-builder.ts! Total lines:', newContent.split('\n').length);
