import fs from 'fs';

const file = "/Volumes/RADZZZ/CODING/noir'/components/ResearchWelcome.tsx";
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "const { checkFeatureLimit, incrementFeatureUsage, isSubscribed, credits, softLimitReached, featureUsage } = useTokenLimit();",
  "const { checkFeatureLimit, incrementFeatureUsage, isSubscribed, credits, softLimitReached, tokensUsed, maxCredits } = useTokenLimit();"
);

content = content.replace(
  "tokensUsed={featureUsage.convert.used}",
  "tokensUsed={tokensUsed}"
);

content = content.replace(
  "tokensLimit={featureUsage.convert.limit}",
  "tokensLimit={maxCredits}"
);

fs.writeFileSync(file, content);
console.log('Fixed ResearchWelcome');
