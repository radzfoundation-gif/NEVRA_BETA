import fs from 'fs';
import path from 'path';

const serverFile = "/Volumes/RADZZZ/CODING/noir'/server/index.js";
let content = fs.readFileSync(serverFile, 'utf8');

// Replace all console logs and errors in the server file to be production ready
content = content.replace(/console\.log\(/g, '// console.log(');
content = content.replace(/console\.error\(/g, '// console.error(');
content = content.replace(/console\.warn\(/g, '// console.warn(');
content = content.replace(/console\.info\(/g, '// console.info(');
content = content.replace(/console\.dir\(/g, '// console.dir(');
content = content.replace(/console\.trace\(/g, '// console.trace(');

fs.writeFileSync(serverFile, content);
console.log('Patched all consoles in server');
