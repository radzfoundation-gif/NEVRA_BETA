import fs from 'fs';

const file = "/Volumes/RADZZZ/CODING/noir'/components/pages/ChatInterface.tsx";
let content = fs.readFileSync(file, 'utf8');

// Fix TypeError by removing featureUsage from destructuring (not used elsewhere)
content = content.replace(
  "const { hasExceeded, isSubscribed, refreshLimit, tokensUsed, incrementTokenUsage, loading: tokenLoading, checkFeatureLimit, incrementFeatureUsage, featureUsage, credits, softLimitReached } = useTokenLimit();",
  "const { hasExceeded, isSubscribed, refreshLimit, tokensUsed, incrementTokenUsage, loading: tokenLoading, checkFeatureLimit, incrementFeatureUsage, credits, softLimitReached } = useTokenLimit();"
);

// Fix async checkFeatureLimit
content = content.replace(
  "const chatStatus = checkFeatureLimit('chat');",
  "const chatStatus = await checkFeatureLimit('chat');"
);
content = content.replace(
  "const checkChatLimit = (): boolean => {",
  "const checkChatLimit = async (): Promise<boolean> => {"
);

// We need to find where checkChatLimit is called and await it
content = content.replace(
  "if (!checkChatLimit()) return;",
  "if (!await checkChatLimit()) return;"
);

fs.writeFileSync(file, content);
console.log('Fixed ChatInterface types and async calls');
