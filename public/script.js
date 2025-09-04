/**
 * FreeDocs Client-Side JavaScript
 * Handles UI interactions, API calls, and copy functionality
 */

class FreeDocs {
  constructor() {
    this.currentBlocks = [];
    this.currentArchiveUrl = '';
    this.init();
  }

  init() {
    this.bindEvents();
    this.setupClipboardSupport();
  }

  bindEvents() {
    // Load button
    document.getElementById('loadBtn').addEventListener('click', () => {
      this.loadDocument();
    });

    // Enter key in URL input
    document.getElementById('docsUrl').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.loadDocument();
      }
    });

    // Global copy buttons
    document.getElementById('copyAllClean').addEventListener('click', () => {
      this.copyAllContent('clean');
    });

    document.getElementById('copyAllAdditions').addEventListener('click', () => {
      this.copyAllContent('additions');
    });

    // Show deletions toggle
    document.getElementById('showDeletions').addEventListener('change', (e) => {
      // First update the display immediately
      this.toggleDeletions(e.target.checked);
      
      // Then reload the document with new settings if we have a current URL
      if (this.currentArchiveUrl) {
        this.loadDocument();
      }
    });

    // Treat as code toggle
    document.getElementById('treatAsCode').addEventListener('change', (e) => {
      // Reload the document with new settings if we have a current URL
      if (this.currentArchiveUrl) {
        this.loadDocument();
      }
    });
  }

  setupClipboardSupport() {
    // Check if clipboard API is available
    this.hasClipboardAPI = navigator.clipboard && typeof navigator.clipboard.writeText === 'function';
    
    if (!this.hasClipboardAPI) {
      console.warn('Clipboard API not available, using fallback');
    }
  }

  async loadDocument() {
    const urlInput = document.getElementById('docsUrl');
    const url = urlInput.value.trim();
    
    if (!url) {
      this.showStatus('Please enter a Google Docs URL', 'error');
      return;
    }

    if (!this.isValidGoogleDocsUrl(url)) {
      this.showStatus('Please enter a valid Google Docs URL', 'error');
      return;
    }

    this.showStatus('Loading document...', 'loading');
    this.setLoadingState(true);

    try {
      // Get the current toggle states
      const autoDetectCode = document.getElementById('treatAsCode').checked;
      const showDeletions = document.getElementById('showDeletions').checked;
      
      // Build query parameters
      const params = new URLSearchParams({
        url: url,
        autoDetectCode: autoDetectCode.toString(),
        showDeletions: showDeletions.toString()
      });
      
      // First try to parse the content
      const response = await fetch(`/api/parse?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      this.currentBlocks = data.blocks;
      this.currentArchiveUrl = data.archiveUrl;

      // Render the content
      this.renderContent(data.blocks);
      this.showArchiveLink(data.archiveUrl);
      this.showStatus('Document loaded successfully!', 'success');

      // Show content area
      document.getElementById('contentArea').style.display = 'block';

    } catch (error) {
      console.error('Error loading document:', error);
      this.showStatus(`Error: ${error.message}`, 'error');
    } finally {
      this.setLoadingState(false);
    }
  }

  isValidGoogleDocsUrl(url) {
    const patterns = [
      /^https:\/\/docs\.google\.com\/document\/d\/[a-zA-Z0-9-_]+/,
      /^https:\/\/drive\.google\.com\/file\/d\/[a-zA-Z0-9-_]+/
    ];
    
    return patterns.some(pattern => pattern.test(url));
  }

  renderContent(blocks) {
    const contentDiv = document.getElementById('documentContent');
    // Normalize blocks to support Google Docs-style split ordered lists
    const normalizedBlocks = this.normalizeHierarchicalLists(blocks);

    let html = '<div class="freedocs-content">\n';

    normalizedBlocks.forEach((block, index) => {
      html += this.renderBlock(block, index);
    });

    html += '</div>';
    contentDiv.innerHTML = html;

    // Bind copy button events
    this.bindCopyButtons();
    this.bindDeletionToggles();
  }

  // Detect pattern: an ordered list with a single item (e.g., "1. ...")
  // followed by another ordered list representing its subitems. Assign
  // custom numbers like "1.1", "1.2" to the following list items.
  normalizeHierarchicalLists(blocks) {
    const result = [];
    let pendingParentNumber = null;

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];

      if (block.type === 'ordered-list') {
        const items = block.items || [];

        // If we already have a parent number, apply hierarchical numbering
        if (pendingParentNumber !== null && items.length > 0) {
          const newItems = items.map((item, idx) => {
            // Preserve existing custom numbers if already present
            if (item.customNumber !== null && item.customNumber !== undefined) {
              return item;
            }
            const customNumber = `${pendingParentNumber}.${idx + 1}`;
            return { ...item, customNumber };
          });
          result.push({ ...block, items: newItems });
          // Keep pendingParentNumber active in case multiple consecutive ol blocks appear
          continue;
        }

        // No parent yet: if this ordered list looks like a single top-level item,
        // capture its number (default to 1 when not specified)
        if (items.length === 1) {
          const first = items[0];
          // Determine its visible number
          let numberStr = '1';
          if (first.customNumber !== null && first.customNumber !== undefined) {
            numberStr = String(first.customNumber).split('.')[0];
          } else if (block.startValue && block.startValue > 1) {
            numberStr = String(block.startValue);
          }
          pendingParentNumber = numberStr;
          result.push(block);
          continue;
        }

        // Regular ordered list without hierarchy context
        pendingParentNumber = null;
        result.push(block);
        continue;
      }

      // Any non-ordered-list block resets the hierarchy context
      pendingParentNumber = null;
      result.push(block);
    }

    return result;
  }

  renderBlock(block, index) {
    switch (block.type) {
      case 'heading':
        return `<h${block.level} class="freedocs-heading">${this.escapeHtml(block.text)}</h${block.level}>\n`;
      
      case 'paragraph':
        return `<p class="freedocs-paragraph">${this.escapeHtml(block.text)}</p>\n`;
      
      case 'code':
      case 'blockquote-code':
        return this.renderCodeBlock(block, index);
      
      case 'blockquote':
        return `<blockquote class="freedocs-blockquote">${this.escapeHtml(block.text)}</blockquote>\n`;
      
      case 'unordered-list':
      case 'ordered-list':
        return this.renderList(block);
      
      default:
        return '';
    }
  }

  renderCodeBlock(block, index) {
    const hasChanges = block.hasChanges;
    const blockId = `code-block-${index}`;
    
    let html = `<div class="freedocs-code-block ${hasChanges ? 'has-changes' : ''}" data-language="${block.language || 'text'}">\n`;
    
    // Controls
    html += '<div class="freedocs-code-controls">';
    
    if (hasChanges) {
      html += `
        <div style="display: flex; gap: 0.5rem;">
          <button class="copy-btn" data-mode="clean" data-target="${blockId}">Copy Clean</button>
          <button class="copy-btn" data-mode="additions" data-target="${blockId}">Copy Additions</button>
        </div>
        <label class="toggle-deletions">
          <input type="checkbox" class="deletion-toggle" data-target="${blockId}" checked> Show deletions
        </label>
      `;
    } else {
      html += `<button class="copy-btn" data-mode="all" data-target="${blockId}">Copy</button>`;
    }
    
    html += '</div>\n';
    
    // Code content
    html += `<pre class="freedocs-code" id="${blockId}"><code>`;
    
    block.lines.forEach(line => {
      const classes = [`line-${line.op}`];
      html += `<span class="${classes.join(' ')}" data-op="${line.op}" data-clean="${this.escapeHtml(line.text)}">${this.escapeHtml(line.originalText)}</span>\n`;
    });
    
    html += '</code></pre>\n</div>\n';
    
    return html;
  }

  renderList(block) {
    const tag = block.type === 'ordered-list' ? 'ol' : 'ul';
    const startAttr = block.startValue && block.startValue !== 1 ? ` start="${block.startValue}"` : '';
    let html = `<${tag} class="freedocs-list"${startAttr}>\n`;

    block.items.forEach(item => {
      if (item.type === 'code') {
        html += `<li>${this.renderCodeBlock(item, Math.random().toString(36).substr(2, 9))}</li>\n`;
      } else {
        const hasCustom = item.customNumber !== null && item.customNumber !== undefined;
        if (hasCustom) {
          const custom = this.escapeHtml(String(item.customNumber));
          html += `<li data-custom-number="${custom}"><span class="custom-number">${custom}</span>${this.escapeHtml(item.text)}</li>\n`;
        } else {
          html += `<li>${this.escapeHtml(item.text)}</li>\n`;
        }
      }
    });

    html += `</${tag}>\n`;
    return html;
  }

  bindCopyButtons() {
    document.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mode = e.target.dataset.mode;
        const targetId = e.target.dataset.target;
        this.copyCodeBlock(targetId, mode, e.target);
      });
    });
  }

  bindDeletionToggles() {
    document.querySelectorAll('.deletion-toggle').forEach(toggle => {
      toggle.addEventListener('change', (e) => {
        const targetId = e.target.dataset.target;
        this.toggleBlockDeletions(targetId, e.target.checked);
      });
    });
  }

  async copyCodeBlock(blockId, mode, buttonElement) {
    const codeBlock = document.getElementById(blockId);
    if (!codeBlock) return;

    const lines = Array.from(codeBlock.querySelectorAll('span[data-op]'));
    let textToCopy = '';

    lines.forEach(line => {
      const op = line.dataset.op;
      const cleanText = line.dataset.clean;
      const originalText = line.textContent;

      if (mode === 'clean') {
        if (op !== 'removed') {
          textToCopy += cleanText + '\n';
        }
      } else if (mode === 'additions') {
        if (op === 'added') {
          textToCopy += cleanText + '\n';
        }
      } else { // mode === 'all'
        textToCopy += originalText + '\n';
      }
    });

    // Remove trailing newline
    textToCopy = textToCopy.replace(/\n$/, '');

    try {
      await this.copyToClipboard(textToCopy);
      this.showCopySuccess(buttonElement);
    } catch (error) {
      console.error('Copy failed:', error);
      this.showStatus('Copy failed. Please try manually selecting the text.', 'error');
    }
  }

  async copyAllContent(mode) {
    let allText = '';
    
    this.currentBlocks.forEach(block => {
      if (block.type === 'code' || block.type === 'blockquote-code') {
        block.lines.forEach(line => {
          const op = line.op;
          
          if (mode === 'clean') {
            if (op !== 'removed') {
              allText += line.text + '\n';
            }
          } else if (mode === 'additions') {
            if (op === 'added') {
              allText += line.text + '\n';
            }
          }
        });
      } else if (block.text) {
        if (mode === 'clean' || mode === 'additions') {
          allText += block.text + '\n\n';
        }
      }
    });

    try {
      await this.copyToClipboard(allText.trim());
      this.showStatus(`All content copied (${mode})!`, 'success');
    } catch (error) {
      console.error('Copy failed:', error);
      this.showStatus('Copy failed. Please try manually selecting the text.', 'error');
    }
  }

  async copyToClipboard(text) {
    if (this.hasClipboardAPI) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  }

  showCopySuccess(buttonElement) {
    const originalText = buttonElement.textContent;
    buttonElement.textContent = 'Copied!';
    buttonElement.classList.add('success');
    
    setTimeout(() => {
      buttonElement.textContent = originalText;
      buttonElement.classList.remove('success');
    }, 2000);
  }

  toggleDeletions(show) {
    document.querySelectorAll('.line-removed').forEach(line => {
      if (show) {
        line.classList.remove('hidden');
      } else {
        line.classList.add('hidden');
      }
    });

    // Also update individual block toggles
    document.querySelectorAll('.deletion-toggle').forEach(toggle => {
      toggle.checked = show;
    });
  }

  toggleBlockDeletions(blockId, show) {
    const codeBlock = document.getElementById(blockId);
    if (!codeBlock) return;

    codeBlock.querySelectorAll('.line-removed').forEach(line => {
      if (show) {
        line.classList.remove('hidden');
      } else {
        line.classList.add('hidden');
      }
    });
  }

  showStatus(message, type) {
    const statusDiv = document.getElementById('status');
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    
    if (type === 'success') {
      setTimeout(() => {
        statusDiv.classList.add('hidden');
      }, 5000);
    }
  }

  showArchiveLink(archiveUrl) {
    const archiveLinkSpan = document.getElementById('archiveLink');
    const archiveUrlLink = document.getElementById('archiveUrl');
    
    archiveUrlLink.href = archiveUrl;
    archiveLinkSpan.style.display = 'inline';
  }

  setLoadingState(loading) {
    const loadBtn = document.getElementById('loadBtn');
    const urlInput = document.getElementById('docsUrl');
    
    loadBtn.disabled = loading;
    urlInput.disabled = loading;
    
    if (loading) {
      loadBtn.textContent = 'Loading...';
    } else {
      loadBtn.textContent = 'Load Document';
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new FreeDocs();
});
