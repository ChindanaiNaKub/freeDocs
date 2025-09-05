const { escapeHtmlPreserveFormatting } = require('./src/utils/formatParser');

// Test the escape function
const testHtml = '<u>Objective:</u> In this session, You will start using Spring Boot development';

console.log('Input:', testHtml);
console.log('Output:', escapeHtmlPreserveFormatting(testHtml));

// Test if it's working correctly
const result = escapeHtmlPreserveFormatting(testHtml);
console.log('Contains <u>:', result.includes('<u>'));
console.log('Contains </u>:', result.includes('</u>'));
