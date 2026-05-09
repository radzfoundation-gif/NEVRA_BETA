import fs from 'fs';
const chatInput = "/Volumes/RADZZZ/CODING/noir'/components/chat/ChatInput.tsx";
let c = fs.readFileSync(chatInput, 'utf8');

c = c.replace(
  'className="absolute bottom-full left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0 mb-2 flex items-end gap-1 z-50"',
  'className="absolute bottom-full left-0 md:left-0 mb-2 flex flex-col md:flex-row items-start md:items-end gap-1 z-50"'
);

fs.writeFileSync(chatInput, c);
console.log('Fixed ChatInput');

const rw = "/Volumes/RADZZZ/CODING/noir'/components/ResearchWelcome.tsx";
let rc = fs.readFileSync(rw, 'utf8');

rc = rc.replace(
  'className="absolute bottom-full left-0 mb-2 flex items-end gap-1 z-50"',
  'className="absolute bottom-full left-0 mb-2 flex flex-col sm:flex-row items-start sm:items-end gap-1 z-50"'
);

fs.writeFileSync(rw, rc);
console.log('Fixed ResearchWelcome');
