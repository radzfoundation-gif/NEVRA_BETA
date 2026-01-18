const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'components/pages/ChatInterface.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove ChatInput Duplicate
// Logic: Find the end of validity (approx line 2934) and the start of next section (workbenchContent).
// Valid end marker: `      )}\r\n    </div>\r\n  );`
// Next section marker: `const workbenchContent = (`
// We want to keep the valid end, and the next section. Remove everything in between.

const validEndMarker = `      )}\n    </div>\n  );`;
const nextSectionMarker = `const workbenchContent = (`;

// Normalize line endings for search
const normalizedContent = content.replace(/\r\n/g, '\n');
const validEndIndex = normalizedContent.indexOf(validEndMarker);
const nextSectionIndex = normalizedContent.indexOf(nextSectionMarker);

if (validEndIndex !== -1 && nextSectionIndex !== -1 && nextSectionIndex > validEndIndex) {
    console.log('Found ChatInput duplicate block ranges.');
    // Keep content up to validEnd + marker length
    const beforePart = normalizedContent.substring(0, validEndIndex + validEndMarker.length);
    // Keep content from nextSection onwards
    const afterPart = normalizedContent.substring(nextSectionIndex);

    // There might be some whitespace we want to keep/clean? 
    // Just inserting two newlines is safe.
    content = beforePart + '\n\n' + afterPart;
    console.log('Removed ChatInput duplicate.');
} else {
    console.log('Could not locate ChatInput duplicate markers precisely.');
    console.log('validEndIndex:', validEndIndex);
    console.log('nextSectionIndex:', nextSectionIndex);
}

// 2. Remove Preview Duplicate
// Logic: Find `<PreviewContainer ... />` (self closing) inside `activeTab === 'preview' ? (`
// And find `) : (` which is the else branch.
// Remove content between PreviewContainer and `) : (`.

// Update content reference after first edit
// Re-normalize just in case
let currentContent = content.replace(/\r\n/g, '\n');

const previewMarker = `selectedFile={selectedFile}\n        />`;
const elseBranchMarker = `) : (`;

const previewIndex = currentContent.indexOf(previewMarker);
// We need to find the `) : (` that COMES AFTER the preview marker.
const elseBranchIndex = currentContent.indexOf(elseBranchMarker, previewIndex);

if (previewIndex !== -1 && elseBranchIndex !== -1) {
    console.log('Found Preview duplicate block ranges.');
    // Keep content up to previewMarker + length
    // Wait, PreviewContainer was self-closing `/>`.
    const beforePart = currentContent.substring(0, previewIndex + previewMarker.length);
    // Keep content from elseBranch onwards
    // But we need to keep the closing parenthesis of the ternary true branch?
    // Original: `( <PreviewContainer /> DUPLICATE ) : (`
    // If I keep `) : (`, I just need to remove DUPLICATE.
    // Wait, `<PreviewContainer />` is ONE element.
    // If I have `( <PreviewContainer /> ) : (`, that is correct.
    // So I remove everything between `/>` and `) : (`.
    const afterPart = currentContent.substring(elseBranchIndex);

    // Check if there is a closing div for the duplicate in between?
    // The duplicate was `<div ...> ... </div>`.
    // My deletion logic simply removes it all.

    content = beforePart + '\n' + afterPart;
    console.log('Removed Preview duplicate.');
} else {
    console.log('Could not locate Preview duplicate markers.');
    console.log('previewIndex:', previewIndex);
    console.log('elseBranchIndex:', elseBranchIndex);
    // Try simpler marker for PreviewContainer
    // It has many props.
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully wrote changes to ChatInterface.tsx');
