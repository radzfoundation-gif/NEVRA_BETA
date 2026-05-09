const fs = require('fs');

const file = "/Volumes/RADZZZ/CODING/noir'/components/pages/ChatInterface.tsx";
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "updateChatSession(activeSessionId, { mode: 'builder' })\n              .catch(error => \n          }",
  "updateChatSession(activeSessionId, { mode: 'builder' })\n              .catch(error => {});\n          }"
);

content = content.replace(
  "updateProgress(topic, {\n          questionsAnswered: 1,\n          studyTime: studyDuration,\n        }).catch(err => \n\n        // Record study session",
  "updateProgress(topic, {\n          questionsAnswered: 1,\n          studyTime: studyDuration,\n        }).catch(err => {});\n\n        // Record study session"
);

content = content.replace(
  "          endedAt: new Date(),\n        }).catch(err => \n      }\n\n      // Update AI memory",
  "          endedAt: new Date(),\n        }).catch(err => {});\n      }\n\n      // Update AI memory"
);

fs.writeFileSync(file, content);
console.log('Fixed unclosed catch blocks');
