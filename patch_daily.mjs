import fs from 'fs';

const file = "/Volumes/RADZZZ/CODING/noir'/lib/dailyCreditManager.ts";
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "const channel = supabase.channel(`credits:${userId}`);",
  "// Use a unique channel name to avoid React StrictMode re-subscription errors\n    const channel = supabase.channel(`credits:${userId}-${Date.now()}-${Math.random()}`);"
);

fs.writeFileSync(file, content);
console.log('Fixed Supabase channel name conflict');
