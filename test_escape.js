// Test the HTML escaping issue
function escapeHtml(text) {
  const div = { innerHTML: '' };
  div.textContent = text;
  return div.innerHTML || text.replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[m]);
}

const testText = '<scope>provided</scope>';
console.log('Original text:', testText);
console.log('Escaped once:', escapeHtml(testText));
console.log('Escaped twice:', escapeHtml(escapeHtml(testText)));
