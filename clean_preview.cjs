const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'components/pages/ChatInterface.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Normalize line endings
content = content.replace(/\r\n/g, '\n');

// Marker 1: End of PreviewContainer
const previewEndMarker = `selectedFile={selectedFile}\n        />`;
// Marker 2: Start of File Explorer (The else block of activeTab === 'preview')
const fileExplorerMarker = `<div className="flex-1 flex overflow-hidden">`;

const previewEndIndex = content.indexOf(previewEndMarker);
const fileExplorerIndex = content.indexOf(fileExplorerMarker);

if (previewEndIndex !== -1 && fileExplorerIndex !== -1 && fileExplorerIndex > previewEndIndex) {
    console.log('Found Preview remnant range.');

    // We want to keep PreviewContainer end.
    // We want to keep FileExplorer start.
    // AND we want to keep the `) : (` that connects them.
    // The structure should be: `PreviewContainer /> ) : ( <div ...`

    const beforePart = content.substring(0, previewEndIndex + previewEndMarker.length);
    const afterPart = content.substring(fileExplorerIndex);

    // The bridge string
    const bridge = '\n      ) : (\n        ';

    // Check if we need to locate `) : (` explicitly? 
    // The previous script might have messed up the `) : (` part.
    // In Step 294, line 3616 starts with `) : (` but implies logic follows.
    // We just want to hard reset the connection.

    // However, we must be careful if `) : (` is already part of `afterPart`?
    // `fileExplorerMarker` is `<div ...`. It is inside `) : ( ... )`.
    // So `afterPart` starts with `<div`.
    // We need to provide the `) : (`.

    content = beforePart + bridge + afterPart;

    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Successfully cleaned Preview remnants.');
} else {
    console.log('Could not locate markers.');
    console.log('previewEndIndex:', previewEndIndex);
    console.log('fileExplorerIndex:', fileExplorerIndex);

    // Debug snippet
    if (previewEndIndex !== -1) {
        console.log('Snippet after preview:', content.substring(previewEndIndex + previewEndMarker.length, previewEndIndex + previewEndMarker.length + 100));
    }
}
