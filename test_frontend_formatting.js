// Test the frontend formatting directly
const mockBlock = {
  type: 'paragraph',
  text: 'Objective: In this session, You will start using Spring Boot development',
  html: '<u>Objective:</u> In this session, You will start using Spring Boot development',
  hasFormatting: true
};

console.log('Mock block:', mockBlock);

// Simulate the preserveFormatting function
function preserveFormatting(html) {
  if (typeof html !== 'string') return escapeHtml(html || '');
  
  const allowedTags = ['strong', 'em', 'u', 'a'];
  const placeholders = {};
  let counter = 0;
  
  allowedTags.forEach(tag => {
    const openRegex = new RegExp('<' + tag + '(\\s[^>]*)?>', 'gi');
    html = html.replace(openRegex, (match) => {
      const placeholder = '__PLACEHOLDER_' + counter + '__';
      placeholders[placeholder] = match;
      counter++;
      return placeholder;
    });
    
    const closeRegex = new RegExp('</' + tag + '>', 'gi');
    html = html.replace(closeRegex, (match) => {
      const placeholder = '__PLACEHOLDER_' + counter + '__';
      placeholders[placeholder] = match;
      counter++;
      return placeholder;
    });
  });
  
  // Simulate escaping
  html = html.replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[m]);
  
  // Restore allowed tags
  Object.keys(placeholders).forEach(placeholder => {
    html = html.replace(placeholder, placeholders[placeholder]);
  });
  
  return html;
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[m]);
}

console.log('Input HTML:', mockBlock.html);
console.log('Processed HTML:', preserveFormatting(mockBlock.html));
console.log('Should contain <u>:', preserveFormatting(mockBlock.html).includes('<u>'));
