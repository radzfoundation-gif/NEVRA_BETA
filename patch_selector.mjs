import fs from 'fs';

const file = "/Volumes/RADZZZ/CODING/noir'/components/ui/ModelSelector.tsx";
let content = fs.readFileSync(file, 'utf8');

// For mobile friendly: we need to position the popover properly
// Currently it's: "absolute bottom-full right-0 mb-2 w-[90vw] max-w-[280px] sm:w-[260px]"
// We'll change it to be centered or proper sized on mobile
content = content.replace(
  "className=\"absolute bottom-full right-0 mb-2 w-[90vw] max-w-[280px] sm:w-[260px] bg-white border border-stone-200 shadow-xl rounded-[18px] overflow-hidden flex flex-col z-[100]\"",
  "className=\"absolute bottom-full -right-4 sm:right-0 mb-2 w-[90vw] max-w-[280px] sm:w-[260px] bg-white border border-stone-200 shadow-xl rounded-[18px] overflow-hidden flex flex-col z-[100] origin-bottom-right\""
);

fs.writeFileSync(file, content);
console.log('Fixed ModelSelector');

// Also do the same for ProviderSelector
const pFile = "/Volumes/RADZZZ/CODING/noir'/components/ui/ProviderSelector.tsx";
let pContent = fs.readFileSync(pFile, 'utf8');

pContent = pContent.replace(
  "className=\"absolute bottom-full left-1/2 -translate-x-1/2 md:left-auto md:right-0 md:translate-x-0 mb-2 w-[85vw] max-w-[224px] sm:w-56 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 backdrop-blur-xl\"",
  "className=\"absolute bottom-full -right-4 md:right-0 mb-2 w-[85vw] max-w-[224px] sm:w-56 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 backdrop-blur-xl origin-bottom-right\""
);

fs.writeFileSync(pFile, pContent);
console.log('Fixed ProviderSelector');
