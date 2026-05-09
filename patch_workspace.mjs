import fs from 'fs';

const file = "/Volumes/RADZZZ/CODING/noir'/components/WorkspaceMenu.tsx";
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "className=\"absolute top-full right-0 mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl overflow-hidden z-[102] backdrop-blur-xl\"",
  "className=\"absolute top-full right-0 sm:right-0 -mr-2 sm:mr-0 mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl overflow-hidden z-[102] backdrop-blur-xl origin-top-right\""
);

fs.writeFileSync(file, content);
console.log('Fixed WorkspaceMenu');
