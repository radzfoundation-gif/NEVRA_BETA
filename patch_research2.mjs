import fs from 'fs';

const file = "/Volumes/RADZZZ/CODING/noir'/components/ResearchWelcome.tsx";
let content = fs.readFileSync(file, 'utf8');

// There is one place that still uses checkFeatureLimit which returns an object.
content = content.replace(
  "const { exceeded } = checkFeatureLimit('convert');",
  "const { exceeded } = await checkFeatureLimit('convert');"
);
content = content.replace(
  "const checkConvertLimit = (): boolean => {",
  "const checkConvertLimit = async (): Promise<boolean> => {"
);

fs.writeFileSync(file, content);
console.log('Fixed async checkFeatureLimit');
