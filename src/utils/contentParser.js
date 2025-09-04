/**
 * Content parser for archived Google Docs with diff-aware code detection
 */

const axios = require('axios');
const cheerio = require('cheerio');
const { getArchivedContent, getCachedContent } = require('./archiveClient');

/**
 * Fetches and parses archived content
 * @param {string} archiveUrl - The archive URL or original URL if cached
 * @param {Object} options - Parsing options
 * @param {boolean} options.autoDetectCode - Whether to auto-detect code blocks
 * @param {boolean} options.showDeletions - Whether to include deleted lines
 * @returns {Promise<{html: string, blocks: Array}>} - Parsed content
 */
async function parseArchivedContent(archiveUrl, options = {}) {
  // Set default options
  const parseOptions = {
    autoDetectCode: options.autoDetectCode !== undefined ? options.autoDetectCode : true,
    showDeletions: options.showDeletions !== undefined ? options.showDeletions : true
  };

  try {
    console.log(`Fetching archived content from: ${archiveUrl}`);
    console.log('Parse options:', parseOptions);
    
    // Check if this is a direct URL with cached content
    let content = getCachedContent(archiveUrl);
    
    if (!content) {
      // Use the archive client to get content (handles various archive services)
      content = await getArchivedContent(archiveUrl);
    }

    // Validate content before parsing
    if (!content) {
      throw new Error('No content received from archive');
    }

    if (typeof content !== 'string') {
      console.error('Content is not a string:', typeof content);
      throw new Error('Invalid content type received from archive');
    }

    console.log('Raw content length:', content.length);
    console.log('Content preview (first 200 chars):', content.substring(0, 200));

    // Clean content to remove problematic scripts
    content = cleanArchiveContent(content);

    console.log('Content length after cleaning:', content.length);
    console.log('Content preview after cleaning:', content.substring(0, 500));

    let $;
    try {
      // Use safer cheerio options
      $ = cheerio.load(content, {
        decodeEntities: false,
        _useHtmlParser2: true,
        normalizeWhitespace: false,
        withStartIndices: false,
        withEndIndices: false
      });
    } catch (cheerioError) {
      console.error('Cheerio parsing error:', cheerioError.message);
      console.log('Attempting fallback parsing strategy...');
      
      // Create a minimal safe HTML structure
      const safeContent = extractSafeContent(content);
      
      try {
        $ = cheerio.load(safeContent, {
          decodeEntities: false,
          _useHtmlParser2: true
        });
      } catch (secondError) {
        console.error('Fallback parsing also failed:', secondError.message);
        // Return minimal structure if all parsing fails
        return {
          html: '<div class="error">Content could not be parsed safely</div>',
          blocks: [{
            type: 'error',
            content: 'Content parsing failed - please try a different document'
          }]
        };
      }
    }
    
    // Parse the content into blocks
    const blocks = parseContentBlocks($, parseOptions);
    
    // Generate sanitized HTML for rendering
    const html = generateSanitizedHtml(blocks);

    return {
      html,
      blocks
    };

  } catch (error) {
    console.error('Error parsing archived content:', error.message);
    console.error('Error stack:', error.stack);
    throw new Error(`Failed to parse archived content: ${error.message}`);
  }
}

/**
 * Cleans archived content to remove problematic scripts and code
 * @param {string} content - Raw HTML content
 * @returns {string} - Cleaned content
 */
function cleanArchiveContent(content) {
  try {
    // Remove all script tags and their content
    content = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    content = content.replace(/<script[^>]*\/>/gi, '');
    
    // Remove style tags that might contain problematic CSS
    content = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    
    // Remove all event handlers
    content = content.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
    content = content.replace(/\s+on\w+\s*=\s*[^"'\s>]*/gi, '');
    
    // Remove jQuery/$ references in any context
    content = content.replace(/\$\([^)]*\)/g, '');
    content = content.replace(/jQuery\([^)]*\)/gi, '');
    
    // Remove any remaining JavaScript snippets
    content = content.replace(/javascript:[^"';]*/gi, '');
    content = content.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, '');
    
    // Remove any remaining $ references that might be in the HTML
    content = content.replace(/\$[\w\.]+/g, '');
    
    // Remove problematic Google Docs scripts and dynamic content
    content = content.replace(/window\.[^=]*=.*?;/g, '');
    content = content.replace(/var\s+[^=]*=.*?;/g, '');
    content = content.replace(/function\s*\([^)]*\)\s*{[^}]*}/g, '');
    
    return content;
  } catch (error) {
    console.warn('Error cleaning archive content:', error.message);
    return content; // Return original content if cleaning fails
  }
}

/**
 * Extracts safe content when normal parsing fails
 * @param {string} content - Raw HTML content
 * @returns {string} - Safe minimal HTML
 */
function extractSafeContent(content) {
  try {
    // Strip everything except basic HTML tags and text
    let safeContent = content
      // Remove all script and style content first
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<link[^>]*>/gi, '')
      .replace(/<meta[^>]*>/gi, '')
      
      // Remove all attributes except basic ones
      .replace(/<(\w+)[^>]*>/g, '<$1>')
      .replace(/<\/(\w+)>/g, '</$1>')
      
      // Keep only safe tags
      .replace(/<(?!\/?(?:p|div|span|h[1-6]|ul|ol|li|br|strong|em|b|i|a)\b)[^>]*>/gi, '');

    // Ensure we have a basic HTML structure
    if (!safeContent.includes('<body')) {
      safeContent = `<body>${safeContent}</body>`;
    }
    
    if (!safeContent.includes('<html')) {
      safeContent = `<html>${safeContent}</html>`;
    }

    return safeContent;
  } catch (error) {
    console.warn('Error extracting safe content:', error.message);
    return '<html><body><div>Error extracting content</div></body></html>';
  }
}

/**
 * Parses content into structured blocks with intelligent grouping
 * @param {CheerioAPI} $ - Cheerio instance
 * @param {Object} options - Parsing options
 * @param {boolean} options.autoDetectCode - Whether to auto-detect code blocks
 * @param {boolean} options.showDeletions - Whether to include deleted lines
 * @returns {Array} - Array of content blocks
 */
function parseContentBlocks($, options = {}) {
  const blocks = [];
  
  // Find the main content area (Google Docs mobilebasic structure)
  const contentSelectors = [
    '.doc-content',
    '[role="main"]',
    '.contents',
    'body'
  ];
  
  let $content = null;
  for (const selector of contentSelectors) {
    $content = $(selector);
    if ($content.length > 0) {
      break;
    }
  }
  
  if (!$content || $content.length === 0) {
    $content = $('body');
  }

  // Get all elements in document order
  const allElements = $content.find('*').toArray();
  let i = 0;
  
  while (i < allElements.length) {
    const element = allElements[i];
    const $el = $(element);
    
    if ($el.hasClass('processed')) {
        i++;
        continue;
    }

    const tagName = element.tagName.toLowerCase();
    
    let block = null;
    
    switch (tagName) {
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        block = parseHeading($, $el, tagName);
        if (block) {
          blocks.push(block);
        }
        $el.addClass('processed');
        i++;
        break;
        
      case 'p':
      case 'div':
        // First, check if this starts a numbered list group
        const numberedListResult = parseNumberedListGroup($, allElements, i, options);
        if (numberedListResult.isNumberedList) {
          blocks.push(numberedListResult.block);
          for (let j = 0; j < numberedListResult.elementsProcessed; j++) {
            $(allElements[i + j]).addClass('processed');
          }
          i += numberedListResult.elementsProcessed;
        } else {
          // Then check for code groups (only if auto-detect is enabled)
          if (options.autoDetectCode !== false) {
            const codeGroupResult = parseCodeGroup($, allElements, i, options);
            if (codeGroupResult.isCodeGroup) {
              blocks.push(codeGroupResult.block);
              for (let j = 0; j < codeGroupResult.elementsProcessed; j++) {
                $(allElements[i + j]).addClass('processed');
              }
              i += codeGroupResult.elementsProcessed;
            } else {
              if (tagName === 'p') {
                block = parseParagraph($, $el);
                if (block) {
                  blocks.push(block);
                }
              }
              $el.addClass('processed');
              i++;
            }
          } else {
            // When auto-detect is disabled, treat as regular paragraph
            if (tagName === 'p') {
              block = parseParagraph($, $el);
              if (block) {
                blocks.push(block);
              }
            }
            $el.addClass('processed');
            i++;
          }
        }
        break;
        
      case 'pre':
      case 'code':
        block = parseCodeBlock($, $el, options);
        if (block) {
          blocks.push(block);
        }
        $el.addClass('processed');
        i++;
        break;
        
      case 'ul':
      case 'ol':
        block = parseList($, $el, options);
        if (block) {
          blocks.push(block);
        }
        $el.addClass('processed');
        i++;
        break;
        
      case 'blockquote':
        block = parseBlockquote($, $el, options);
        if (block) {
          blocks.push(block);
        }
        $el.addClass('processed');
        i++;
        break;
      
      default:
        i++;
        break;
    }
  }
  
  return blocks;
}

/**
 * Parses a potential numbered list group starting from the given index
 * @param {CheerioAPI} $ - Cheerio instance
 * @param {Array} allElements - Array of all elements
 * @param {number} startIndex - Starting index to check
 * @returns {Object} - Object with isNumberedList, block, and elementsProcessed
 */
function parseNumberedListGroup($, allElements, startIndex, options = {}) {
  const firstElement = allElements[startIndex];
  if (!firstElement) {
    return { isNumberedList: false, elementsProcessed: 0 };
  }

  const $firstEl = $(firstElement);
  const firstText = $firstEl.text().trim();
  
  // Check if this looks like a numbered list item
  const numberMatch = firstText.match(/^(\d+(?:\.\d+)*)\.\s*(.*)$/);
  if (!numberMatch) {
    return { isNumberedList: false, elementsProcessed: 0 };
  }

  // Found the start of a numbered list, now collect consecutive numbered items
  const items = [];
  let currentIndex = startIndex;
  let lastMainNumber = null;
  let subItemCounter = 0;
  
  while (currentIndex < allElements.length) {
    const element = allElements[currentIndex];
    const $el = $(element);
    
    if ($el.hasClass('processed')) {
      break;
    }
    
    const tagName = element.tagName.toLowerCase();
    if (tagName !== 'p' && tagName !== 'div') {
      break;
    }
    
    const text = $el.text().trim();
    const match = text.match(/^(\d+(?:\.\d+)*)\.\s*(.*)$/);
    
    if (!match) {
      // If this paragraph doesn't start with a number, stop here
      // Don't try to merge non-numbered content into list items
      break;
    }
    
    const [, number, content] = match;
    
    // Determine the appropriate numbering
    let displayNumber = number;
    
    // If this is a simple integer number, check if we need to convert to hierarchical
    if (/^\d+$/.test(number)) {
      const numValue = parseInt(number, 10);
      
      if (lastMainNumber === null) {
        // First item
        lastMainNumber = numValue;
        subItemCounter = 0;
        displayNumber = number;
      } else if (numValue === lastMainNumber) {
        // Same main number as previous - make it a sub-item
        subItemCounter++;
        displayNumber = `${lastMainNumber}.${subItemCounter}`;
      } else if (numValue === lastMainNumber + 1) {
        // Next sequential number - new main item
        lastMainNumber = numValue;
        subItemCounter = 0;
        displayNumber = number;
      } else {
        // Non-sequential jump - treat as new main item
        lastMainNumber = numValue;
        subItemCounter = 0;
        displayNumber = number;
      }
    }
    
    // Create the list item
    const isCodeLike = options.autoDetectCode !== false && isCodeLikeParagraph($el, content);
    
    if (isCodeLike) {
      const codeBlock = parseCodeContent(content, 'list-item', options);
      codeBlock.customNumber = displayNumber;
      items.push(codeBlock);
    } else {
      items.push({
        type: 'list-item',
        text: content,
        customNumber: displayNumber,
        lines: [{ text: content, op: 'unchanged' }]
      });
    }
    
    currentIndex++;
  }
  
  if (items.length === 0) {
    return { isNumberedList: false, elementsProcessed: 0 };
  }
  
  // Create the ordered list block
  const block = {
    type: 'ordered-list',
    items: items,
    startValue: 1
  };
  
  return {
    isNumberedList: true,
    block: block,
    elementsProcessed: currentIndex - startIndex
  };
}

/**
 * Parses a potential code group starting from the given index
 * @param {CheerioAPI} $ - Cheerio instance
 * @param {Array} allElements - Array of all elements
 * @param {number} startIndex - Starting index to check
 * @returns {Object} - Result with isCodeGroup flag, block, and elementsProcessed count
 */
function parseCodeGroup($, allElements, startIndex, options = {}) {
  const codeElements = [];
  let elementsProcessed = 0;

  // The first element must be a strong candidate for code to start a group.
  const $firstEl = $(allElements[startIndex]);
  const firstElement = allElements[startIndex];
  if (!firstElement || (firstElement.tagName.toLowerCase() !== 'p' && firstElement.tagName.toLowerCase() !== 'div') || $firstEl.hasClass('processed') || !isCodeLikeParagraph($firstEl, $firstEl.text())) {
      return { isCodeGroup: false, elementsProcessed: 0 };
  }

  // If it is, then start grouping.
  for (let i = startIndex; i < allElements.length; i++) {
    const $currentEl = $(allElements[i]);
    const element = allElements[i];

    if ($currentEl.hasClass('processed') || $currentEl.parents('.processed').length > 0) {
      break;
    }

    const tagName = element.tagName.toLowerCase();
    // Only group paragraphs and divs. Other elements break the group.
    if (tagName !== 'p' && tagName !== 'div') {
      break;
    }

    const currentText = $currentEl.text();
    
    // After starting, use the more lenient check.
    if (canBeInCodeBlock($currentEl, currentText)) {
      codeElements.push($currentEl);
      elementsProcessed++;
    } else {
      // This paragraph breaks the code block.
      break;
    }
  }

  if (codeElements.length === 0) {
    return { isCodeGroup: false, elementsProcessed: 0 };
  }
  
  const hasNonEmptyContent = codeElements.some($el => $el.text().trim().length > 0);
  if (!hasNonEmptyContent) {
    return { isCodeGroup: false, elementsProcessed: 0 };
  }

  const combinedText = codeElements.map($el => unescapeHtml($el.text())).join('\n');
  const codeBlock = parseCodeContent(combinedText, 'paragraph-group', options);

  return {
    isCodeGroup: true,
    block: codeBlock,
    elementsProcessed: elementsProcessed
  };
}

/**
 * Parses a heading element
 */
function parseHeading($, $el, tagName) {
  return {
    type: 'heading',
    level: parseInt(tagName.substring(1)),
    text: $el.text().trim(),
    html: $el.html()
  };
}

/**
 * Parses a paragraph element with diff-aware detection
 */
function parseParagraph($, $el) {
  let text = $el.text();
  
  // Unescape HTML entities for accurate text representation
  if (text.includes('&lt;') || text.includes('&gt;') || text.includes('&amp;')) {
    text = unescapeHtml(text);
  }
  
  // This function no longer detects code. It just creates paragraph blocks.
  // Code detection is handled by parseCodeGroup in parseContentBlocks.
  return {
    type: 'paragraph',
    text: text.trim(),
    html: $el.html(),
    lines: text.trim() ? [{ text: text.trim(), op: 'unchanged' }] : []
  };
}

/**
 * Parses a code block element
 */
function parseCodeBlock($, $el, options = {}) {
  let text = $el.text().trim();
  
  // Check if the text contains HTML entities that need to be unescaped
  if (text.includes('&lt;') || text.includes('&gt;') || text.includes('&amp;')) {
    text = unescapeHtml(text);
  }
  
  return parseCodeContent(text, 'code', options);
}

/**
 * Parses a list element
 */
function parseList($, $el, options = {}) {
  const items = [];
  const isOrderedList = $el[0].tagName.toLowerCase() === 'ol';
  let startValue = 1;
  
  // Check if the ordered list has a custom start value
  if (isOrderedList && $el.attr('start')) {
    startValue = parseInt($el.attr('start'), 10) || 1;
  }
  
  $el.find('li').each((index, li) => {
    const $li = $(li);
    let text = $li.text().trim();
    
    // Check if the text contains HTML entities that need to be unescaped
    if (text.includes('&lt;') || text.includes('&gt;') || text.includes('&amp;')) {
      text = unescapeHtml(text);
    }
    
    const isCodeLike = options.autoDetectCode !== false && isCodeLikeParagraph($li, text);
    
    // For ordered lists, try to preserve or detect custom numbering
    let customNumber = null;
    if (isOrderedList) {
      // Check if the li has a value attribute
      if ($li.attr('value')) {
        customNumber = parseInt($li.attr('value'), 10);
      } else {
        // Try to extract number from the beginning of the text
        const numberMatch = text.match(/^(\d+(?:\.\d+)*)\.\s*/);
        if (numberMatch) {
          customNumber = numberMatch[1];
          // Remove the number prefix from the text since we'll handle it in rendering
          text = text.replace(/^\d+(?:\.\d+)*\.\s*/, '');
        }
      }
    }
    
    if (isCodeLike) {
      const codeBlock = parseCodeContent(text, 'list-item', options);
      if (customNumber !== null) {
        codeBlock.customNumber = customNumber;
      }
      items.push(codeBlock);
    } else {
      const item = {
        type: 'list-item',
        text: text,
        lines: [{ text: text, op: 'unchanged' }]
      };
      if (customNumber !== null) {
        item.customNumber = customNumber;
      }
      items.push(item);
    }
  });
  
  return {
    type: isOrderedList ? 'ordered-list' : 'unordered-list',
    items: items,
    startValue: startValue
  };
}

/**
 * Parses a blockquote element
 */
function parseBlockquote($, $el, options = {}) {
  let text = $el.text().trim();
  
  // Check if the text contains HTML entities that need to be unescaped
  if (text.includes('&lt;') || text.includes('&gt;') || text.includes('&amp;')) {
    text = unescapeHtml(text);
  }
  
  const isCodeLike = options.autoDetectCode !== false && isCodeLikeParagraph($el, text);
  
  if (isCodeLike) {
    const codeBlock = parseCodeContent(text, 'blockquote', options);
    return {
      ...codeBlock,
      type: 'blockquote-code'
    };
  }
  
  return {
    type: 'blockquote',
    text: text,
    html: $el.html(),
    lines: [{ text: text, op: 'unchanged' }]
  };
}

/**
 * Determines if a paragraph is a likely candidate to start a code block.
 */
function isCodeLikeParagraph($el, text) {
    const trimmedText = text.replace(/&nbsp;/g, ' ').trim();

    if (trimmedText.length === 0) {
        return false;
    }

    const instructionalPattern = /^(Add|Create|Update|Now|Next|Wait|Open|If|See|Note|The component|Creating the entity|In this lab|As given|With the given information|Now we will create)\b/i;
    if (instructionalPattern.test(trimmedText) && !/[<>{}=;]/.test(trimmedText)) {
        return false;
    }
    if (/^\d+\.\d*\.?\s/.test(trimmedText) && !/[<>{}=;]/.test(trimmedText)) {
        return false;
    }

    // Check for indentation (spaces or tabs at the beginning of the original text)
    if (/^(\s{2,}|\t)/.test(text)) return true;
    if (/^\s*[+\-@]/.test(trimmedText)) return true;
    if (/<(dependency|groupId|artifactId|version|scope)>/.test(trimmedText)) return true;
    if (/\b(import|package|public|class|static|final|void|long|string|boolean)\b/i.test(trimmedText)) return true;
    if (trimmedText.endsWith(';') || trimmedText.endsWith('{') || trimmedText.endsWith('}')) return true;
    if ($el.css('font-family')?.includes('monospace')) return true;
    if (/[<>{}=]/.test(trimmedText)) return true;

    return false;
}

/**
 * A more lenient check to see if a line can be part of an *existing* code block.
 */
function canBeInCodeBlock($el, text) {
    const trimmedText = text.replace(/&nbsp;/g, ' ').trim();
    if (trimmedText.length === 0) {
        return true;
    }
    
    if (/^\d+\.\d*\.?\s/.test(trimmedText) && !/[<>{}=;]/.test(trimmedText)) {
        return false;
    }
    const instructionalPattern = /^(Now we will create|Next, add|Then, update)\b/i;
    if(instructionalPattern.test(trimmedText)){
        return false;
    }

    return true;
}

/**
 * Parses text content with diff-aware line classification and intelligent grouping
 * @param {string} text - Text content to parse
 * @param {string} sourceType - Type of source (e.g., 'paragraph-group', 'list-item')
 * @param {Object} options - Parsing options
 * @param {boolean} options.showDeletions - Whether to include deleted lines
 */
function parseCodeContent(text, sourceType, options = {}) {
  // Check if the text contains HTML entities that need to be unescaped
  // This often happens with Google Docs content
  if (text.includes('&lt;') || text.includes('&gt;') || text.includes('&amp;')) {
    text = unescapeHtml(text);
  }
  
  const detectedLanguage = detectLanguage(text);
  const rawLines = text.split('\n').map(line => {
    const trimmedLine = line.trimStart();
    
    let op = 'unchanged';
    let cleanText = line;
    
    // Detect diff markers
    if (trimmedLine.startsWith('+ ')) {
      op = 'added';
      cleanText = line.replace(/^(\s*)\+ /, '$1'); // Preserve indentation, remove + and space
    } else if (trimmedLine.startsWith('- ')) {
      op = 'removed';
      cleanText = line.replace(/^(\s*)\- /, '$1'); // Preserve indentation, remove - and space
    } else if (trimmedLine.startsWith('+')) {
      op = 'added';
      cleanText = line.replace(/^(\s*)\+/, '$1');
    } else if (trimmedLine.startsWith('-')) {
      op = 'removed';
      cleanText = line.replace(/^(\s*)\-/, '$1');
    }
    
    return {
      text: cleanText,
      originalText: line,
      op: op
    };
  });

  // Filter out deleted lines if showDeletions is false
  let processedLines = rawLines;
  if (options.showDeletions === false) {
    processedLines = rawLines.filter(line => line.op !== 'removed');
  }
  
  // Group lines intelligently for XML content (like Maven dependencies)
  const groupedLines = groupXmlLines(processedLines, detectedLanguage);
  
  return {
    type: 'code',
    sourceType: sourceType,
    language: detectedLanguage,
    lines: groupedLines,
    hasChanges: groupedLines.some(line => line.op !== 'unchanged')
  };
}

/**
 * Groups XML lines into logical blocks (e.g., complete dependencies)
 */
function groupXmlLines(lines, language) {
  if (language !== 'xml') {
    return lines; // No grouping for non-XML content
  }
  
  const groupedLines = [];
  let currentGroup = [];
  let groupOp = 'unchanged';
  let insideDependency = false;
  let insideGroupId = false;
  let insideArtifactId = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const cleanText = line.text.trim();
    
    // Detect start of a dependency
    if (cleanText.includes('<dependency>')) {
      // If we have a current group, finish it first
      if (currentGroup.length > 0) {
        groupedLines.push(createGroupedLine(currentGroup, groupOp));
        currentGroup = [];
      }
      insideDependency = true;
      currentGroup.push(line);
      groupOp = line.op;
    }
    // Detect end of a dependency
    else if (cleanText.includes('</dependency>')) {
      currentGroup.push(line);
      insideDependency = false;
      groupedLines.push(createGroupedLine(currentGroup, groupOp));
      currentGroup = [];
      groupOp = 'unchanged';
    }
    // Detect start of groupId, artifactId tags
    else if (cleanText.includes('<groupId>') || cleanText.includes('<artifactId>')) {
      // If we have a current group, finish it first
      if (currentGroup.length > 0 && !insideDependency) {
        groupedLines.push(createGroupedLine(currentGroup, groupOp));
        currentGroup = [];
      }
      
      if (cleanText.includes('<groupId>')) {
        insideGroupId = true;
      } else if (cleanText.includes('<artifactId>')) {
        insideArtifactId = true;
      }
      
      currentGroup.push(line);
      groupOp = line.op;
    }
    // Detect end of groupId, artifactId tags
    else if (cleanText.includes('</groupId>') || cleanText.includes('</artifactId>')) {
      currentGroup.push(line);
      
      if (!insideDependency) {
        groupedLines.push(createGroupedLine(currentGroup, groupOp));
        currentGroup = [];
        groupOp = 'unchanged';
      }
      
      insideGroupId = false;
      insideArtifactId = false;
    }
    // If we're inside a dependency or groupId/artifactId, keep adding to current group
    else if (insideDependency || insideGroupId || insideArtifactId) {
      currentGroup.push(line);
      // Update group operation if it's more significant (added/removed vs unchanged)
      if (line.op !== 'unchanged' && groupOp === 'unchanged') {
        groupOp = line.op;
      }
    }
    // For standalone lines, add them individually
    else {
      // Finish any current group first
      if (currentGroup.length > 0) {
        groupedLines.push(createGroupedLine(currentGroup, groupOp));
        currentGroup = [];
        groupOp = 'unchanged';
      }
      groupedLines.push(line);
    }
  }
  
  // Add any remaining group
  if (currentGroup.length > 0) {
    groupedLines.push(createGroupedLine(currentGroup, groupOp));
  }
  
  return groupedLines;
}

/**
 * Creates a grouped line from multiple lines
 */
function createGroupedLine(lines, op) {
  if (lines.length === 1) {
    return lines[0];
  }
  
  const combinedText = lines.map(line => line.text).join('\n');
  const combinedOriginalText = lines.map(line => line.originalText).join('\n');
  
  return {
    text: combinedText,
    originalText: combinedOriginalText,
    op: op,
    isGrouped: true,
    groupSize: lines.length
  };
}

/**
 * Simple language detection based on content patterns
 */
function detectLanguage(text) {
  // Check for Maven/XML patterns first (more specific)
  if (/<(dependency|dependencies|project|groupId|artifactId|version|scope|plugin)/.test(text)) {
    return 'xml';
  }
  
  // Check for HTML patterns (less specific than Maven but still specific)
  if (/<(html|head|body|div|p|span|h[1-6]|ul|ol|li|a|img|script|style)/.test(text)) {
    return 'html';
  }
  
  // Generic XML check (after specific patterns)
  if (/<[^>]+>/.test(text) && /<\/[^>]+>/.test(text)) {
    return 'xml';
  }
  
  // CSS check
  if (/\{[^}]*\}/.test(text) && /[a-z-]+:\s*[^;]+;/.test(text)) {
    return 'css';
  }
  
  // Programming language checks
  if (/\b(public|private|class|interface)\b/.test(text) && !/\b(def|import)\b/.test(text)) {
    return 'java';
  }
  if (/\b(function|const|let|var|import|export)\b/.test(text)) {
    return 'javascript';
  }
  if (/\b(def|import|class|if __name__)\b/.test(text)) {
    return 'python';
  }
  
  return 'text';
}

/**
 * Generates sanitized HTML for rendering
 */
function generateSanitizedHtml(blocks) {
  let html = '<div class="freedocs-content">\n';
  
  blocks.forEach(block => {
    switch (block.type) {
      case 'heading':
        html += `<h${block.level} class="freedocs-heading">${escapeHtml(block.text)}</h${block.level}>\n`;
        break;
        
      case 'paragraph':
        html += `<p class="freedocs-paragraph">${escapeHtml(block.text)}</p>\n`;
        break;
        
      case 'code':
        html += generateCodeBlockHtml(block);
        break;
        
      case 'blockquote-code':
        html += `<blockquote class="freedocs-blockquote">\n${generateCodeBlockHtml(block)}</blockquote>\n`;
        break;
        
      case 'blockquote':
        html += `<blockquote class="freedocs-blockquote">${escapeHtml(block.text)}</blockquote>\n`;
        break;
        
      case 'unordered-list':
      case 'ordered-list':
        const tag = block.type === 'ordered-list' ? 'ol' : 'ul';
        const startAttr = block.startValue && block.startValue !== 1 ? ` start="${block.startValue}"` : '';
        html += `<${tag} class="freedocs-list"${startAttr}>\n`;
        block.items.forEach((item, index) => {
          const valueAttr = item.customNumber !== null && item.customNumber !== undefined ? 
            ` value="${item.customNumber}"` : '';
          
          if (item.type === 'code') {
            html += `<li${valueAttr}>${generateCodeBlockHtml(item)}</li>\n`;
          } else {
            // For custom decimal numbering like 1.1, 1.2, use CSS to display it
            if (item.customNumber && typeof item.customNumber === 'string' && item.customNumber.includes('.')) {
              html += `<li${valueAttr} data-custom-number="${item.customNumber}" style="list-style: none; position: relative;">`;
              html += `<span class="custom-number" style="position: absolute; left: -2em; font-weight: bold;">${item.customNumber}.</span>`;
              html += `${escapeHtml(item.text)}</li>\n`;
            } else {
              html += `<li${valueAttr}>${escapeHtml(item.text)}</li>\n`;
            }
          }
        });
        html += `</${tag}>\n`;
        break;
    }
  });
  
  html += '</div>';
  return html;
}

/**
 * Generates HTML for code blocks with diff highlighting
 */
function generateCodeBlockHtml(block) {
  const hasChanges = block.hasChanges;
  const copyId = `code-${Math.random().toString(36).substr(2, 9)}`;
  
  let html = `<div class="freedocs-code-block ${hasChanges ? 'has-changes' : ''}" data-language="${block.language}">\n`;
  
  if (hasChanges) {
    html += `<div class="freedocs-code-controls">
      <button class="copy-btn" data-mode="clean" data-target="${copyId}">Copy Clean</button>
      <button class="copy-btn" data-mode="additions" data-target="${copyId}">Copy Additions</button>
      <label class="toggle-deletions">
        <input type="checkbox" checked> Show deletions
      </label>
    </div>\n`;
  } else {
    html += `<div class="freedocs-code-controls">
      <button class="copy-btn" data-mode="all" data-target="${copyId}">Copy</button>
    </div>\n`;
  }
  
  html += `<pre class="freedocs-code" id="${copyId}"><code>`;
  
  block.lines.forEach(line => {
    const classes = [`line-${line.op}`];
    const dataAttrs = `data-op="${line.op}"`;
    
    // Use the original text but ensure proper escaping without double-encoding
    const textToDisplay = unescapeHtml(line.originalText);
    const safeText = escapeHtml(textToDisplay);
    
    html += `<span class="${classes.join(' ')}" ${dataAttrs}>${safeText}</span>\n`;
  });
  
  html += '</code></pre>\n</div>\n';
  
  return html;
}

/**
 * Unescapes HTML entities
 */
function unescapeHtml(text) {
  if (typeof text !== 'string') return text;
  
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
}

/**
 * Escapes HTML characters
 */
function escapeHtml(text) {
  if (typeof text !== 'string') return text;
  
  return text.replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[m]);
}

module.exports = {
  parseArchivedContent,
  parseContentBlocks,
  parseCodeGroup,
  parseCodeContent,
  isCodeLikeParagraph,
  detectLanguage,
  generateSanitizedHtml,
  escapeHtml,
  unescapeHtml
};
