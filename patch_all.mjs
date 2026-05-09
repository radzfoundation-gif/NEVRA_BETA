import fs from 'fs';
import path from 'path';

function patchFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      patchFiles(fullPath);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // We only want to patch files in specific directories
      if (
        fullPath.includes('/server/') || 
        fullPath.includes('/components/') || 
        fullPath.includes('/hooks/') || 
        fullPath.includes('/lib/')
      ) {
        // Skip node_modules and .git
        if (fullPath.includes('node_modules') || fullPath.includes('.git')) continue;
        
        let changed = false;
        
        // Skip specific files where console.log is actually needed or used for code execution/linting
        if (fullPath.includes('codeExecutor.ts') || fullPath.includes('eslint.ts')) continue;
        
        if (content.match(/([^\/])console\.(log|error|warn|info|debug)\(/)) {
          content = content.replace(/([^\/])console\.(log|error|warn|info|debug)\(/g, '$1// console.$2(');
          changed = true;
        }
        
        // Handle start of line
        if (content.match(/^console\.(log|error|warn|info|debug)\(/m)) {
          content = content.replace(/^console\.(log|error|warn|info|debug)\(/gm, '// console.$1(');
          changed = true;
        }
        
        if (changed) {
          fs.writeFileSync(fullPath, content);
          console.log('Patched: ' + fullPath);
        }
      }
    }
  }
}

patchFiles("/Volumes/RADZZZ/CODING/noir'/server");
console.log('Done');
