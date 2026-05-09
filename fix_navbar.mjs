import fs from 'fs';
const file = "/Volumes/RADZZZ/CODING/noir'/components/Navbar.tsx";
let c = fs.readFileSync(file, 'utf8');

c = c.replace(
  'className="absolute right-1/2 translate-x-1/2 md:right-0 md:translate-x-0 top-full mt-2 w-[70vw] max-w-[192px] sm:w-48 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-2 z-50"',
  'className="absolute right-0 sm:right-0 top-full mt-2 w-[70vw] max-w-[192px] sm:w-48 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-2 z-50 origin-top-right"'
);

fs.writeFileSync(file, c);
console.log('Fixed Navbar');
