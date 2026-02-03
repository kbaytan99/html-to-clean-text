/**
 * HTML Cleaner - Core cleaning logic using DOMParser
 * Removes all noise and extracts meaningful text content
 */

// Tags to completely remove (including their content)
const REMOVE_TAGS = new Set([
  'script', 'style', 'noscript', 'iframe', 'svg', 'canvas',
  'link', 'meta', 'head', 'template', 'object', 'embed',
  'applet', 'audio', 'video', 'source', 'track', 'map', 'area'
]);

// Semantic tags that typically contain non-content
// More conservative approach - only remove obvious noise
const NOISE_SELECTORS = [
  '.sidebar', '#sidebar', '[role="navigation"]',
  '[role="complementary"]',
  '.ad', '.ads', '.advertisement', '.sponsored', '.promo',
  '.cookie', '.cookie-banner', '.cookie-notice', '.consent',
  '.popup', '.modal', '.overlay',
  '.social-share', '.share-buttons',
  '[hidden]', '[aria-hidden="true"]', '.hidden',
  '.sr-only', '.visually-hidden', '.screen-reader-text'
];

// Block-level elements that should create paragraph breaks
const BLOCK_ELEMENTS = new Set([
  'p', 'div', 'section', 'article', 'main', 'blockquote',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'dl', 'dt', 'dd',
  'table', 'tr', 'th', 'td',
  'pre', 'code', 'figure', 'figcaption',
  'address', 'hr', 'br'
]);

export interface ExtractedElement {
  type: 'text' | 'heading' | 'paragraph' | 'list-item' | 'blockquote' | 'code' | 'break';
  level?: number; // For headings
  content: string;
  listType?: 'ordered' | 'unordered';
}

/**
 * Parse and clean HTML content
 */
export function parseAndClean(html: string): ExtractedElement[] {
  // Handle potential JSON wrapper from some proxies
  let cleanHtml = html;
  try {
    const parsed = JSON.parse(html);
    if (parsed.contents) {
      cleanHtml = parsed.contents;
    } else if (parsed.html) {
      cleanHtml = parsed.html;
    } else if (typeof parsed === 'string') {
      cleanHtml = parsed;
    }
  } catch {
    // Not JSON, use as-is
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(cleanHtml, 'text/html');
  
  // Remove unwanted tags
  removeUnwantedElements(doc);
  
  // Remove noise selectors
  removeNoiseElements(doc);
  
  // Try to find main content area first
  const mainContent = doc.querySelector('main, article, [role="main"], #content, .content, #main, .main, .post, .article, .entry-content, .post-content');
  const body = mainContent || doc.body || doc.documentElement;
  
  // Extract structured content
  let elements = extractElements(body);
  
  // Fallback: if no elements found, try to get ALL text from body
  if (elements.length === 0 && doc.body) {
    const fallbackText = doc.body.textContent?.trim() || '';
    if (fallbackText.length > 50) {
      // Split by newlines and create paragraphs
      const lines = fallbackText.split(/\n+/).filter(line => line.trim().length > 10);
      elements = lines.map(line => ({
        type: 'paragraph' as const,
        content: line.trim()
      }));
    }
  }
  
  return elements;
}

/**
 * Remove tags that should be completely eliminated
 */
function removeUnwantedElements(doc: Document): void {
  REMOVE_TAGS.forEach(tag => {
    const elements = doc.getElementsByTagName(tag);
    // Convert to array since we're modifying the collection
    Array.from(elements).forEach(el => el.remove());
  });
}

/**
 * Remove noise elements (navigation, ads, etc.)
 */
function removeNoiseElements(doc: Document): void {
  NOISE_SELECTORS.forEach(selector => {
    try {
      const elements = doc.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    } catch (e) {
      // Invalid selector, skip
    }
  });
  
  // Remove elements with suspicious attributes
  const allElements = doc.querySelectorAll('*');
  allElements.forEach(el => {
    // Remove elements with display:none or visibility:hidden in inline styles
    const style = el.getAttribute('style') || '';
    if (style.includes('display:none') || 
        style.includes('display: none') ||
        style.includes('visibility:hidden') ||
        style.includes('visibility: hidden')) {
      el.remove();
      return;
    }
    
    // Remove event handlers
    Array.from(el.attributes).forEach(attr => {
      if (attr.name.startsWith('on')) {
        el.removeAttribute(attr.name);
      }
    });
  });
}

/**
 * Extract structured elements from the DOM
 */
function extractElements(root: Element): ExtractedElement[] {
  const elements: ExtractedElement[] = [];
  
  function processNode(node: Node, context: { inList?: 'ordered' | 'unordered' } = {}): void {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = normalizeWhitespace(node.textContent || '');
      if (text) {
        elements.push({ type: 'text', content: text });
      }
      return;
    }
    
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    
    const el = node as Element;
    const tagName = el.tagName.toLowerCase();
    
    // Skip if already removed or empty
    if (!el.isConnected) return;
    
    // Handle specific elements
    switch (tagName) {
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6': {
        const level = parseInt(tagName[1]);
        const content = getTextContent(el);
        if (content) {
          elements.push({ type: 'heading', level, content });
        }
        return;
      }
      
      case 'p': {
        const content = getTextContent(el);
        if (content) {
          elements.push({ type: 'paragraph', content });
        }
        return;
      }
      
      case 'blockquote': {
        const content = getTextContent(el);
        if (content) {
          elements.push({ type: 'blockquote', content });
        }
        return;
      }
      
      case 'pre':
      case 'code': {
        const content = el.textContent?.trim() || '';
        if (content) {
          elements.push({ type: 'code', content });
        }
        return;
      }
      
      case 'ul':
      case 'ol': {
        const listType = tagName === 'ol' ? 'ordered' : 'unordered';
        Array.from(el.children).forEach(child => {
          processNode(child, { inList: listType });
        });
        return;
      }
      
      case 'li': {
        const content = getTextContent(el);
        if (content) {
          elements.push({ 
            type: 'list-item', 
            content, 
            listType: context.inList || 'unordered' 
          });
        }
        return;
      }
      
      case 'br': {
        elements.push({ type: 'break', content: '' });
        return;
      }
      
      case 'hr': {
        elements.push({ type: 'break', content: '---' });
        return;
      }
      
      default: {
        // Process children
        Array.from(el.childNodes).forEach(child => {
          processNode(child, context);
        });
        
        // Add break after block elements
        if (BLOCK_ELEMENTS.has(tagName) && elements.length > 0) {
          const lastElement = elements[elements.length - 1];
          if (lastElement.type !== 'break') {
            elements.push({ type: 'break', content: '' });
          }
        }
      }
    }
  }
  
  processNode(root);
  
  return consolidateElements(elements);
}

/**
 * Get clean text content from an element
 */
function getTextContent(el: Element): string {
  // Clone to avoid modifying original
  const clone = el.cloneNode(true) as Element;
  
  // Remove any nested block elements' content that was already processed
  const nestedBlocks = clone.querySelectorAll('script, style, noscript');
  nestedBlocks.forEach(block => block.remove());
  
  return normalizeWhitespace(clone.textContent || '');
}

/**
 * Normalize whitespace in text
 */
function normalizeWhitespace(text: string): string {
  return text
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Consolidate extracted elements (merge adjacent text, remove redundant breaks)
 */
function consolidateElements(elements: ExtractedElement[]): ExtractedElement[] {
  const result: ExtractedElement[] = [];
  
  for (const el of elements) {
    if (!el.content && el.type !== 'break') continue;
    
    const last = result[result.length - 1];
    
    // Skip consecutive breaks
    if (el.type === 'break' && last?.type === 'break') continue;
    
    // Merge adjacent text elements
    if (el.type === 'text' && last?.type === 'text') {
      last.content += ' ' + el.content;
      continue;
    }
    
    result.push(el);
  }
  
  // Remove leading/trailing breaks
  while (result.length && result[0].type === 'break') result.shift();
  while (result.length && result[result.length - 1].type === 'break') result.pop();
  
  return result;
}

/**
 * Convert extracted elements to plain text
 */
export function toPlainText(elements: ExtractedElement[]): string {
  const lines: string[] = [];
  
  for (const el of elements) {
    switch (el.type) {
      case 'heading':
        if (lines.length) lines.push('');
        lines.push(el.content.toUpperCase());
        lines.push('');
        break;
      
      case 'paragraph':
      case 'text':
        lines.push(el.content);
        break;
      
      case 'blockquote':
        lines.push(`"${el.content}"`);
        break;
      
      case 'code':
        lines.push(el.content);
        break;
      
      case 'list-item':
        lines.push(`• ${el.content}`);
        break;
      
      case 'break':
        if (el.content === '---') {
          lines.push('');
          lines.push('---');
          lines.push('');
        } else if (lines.length && lines[lines.length - 1] !== '') {
          lines.push('');
        }
        break;
    }
  }
  
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Convert extracted elements to Markdown
 */
export function toMarkdown(elements: ExtractedElement[]): string {
  const lines: string[] = [];
  let inOrderedList = false;
  let listCounter = 0;
  
  for (const el of elements) {
    switch (el.type) {
      case 'heading': {
        if (lines.length) lines.push('');
        const hashes = '#'.repeat(el.level || 1);
        lines.push(`${hashes} ${el.content}`);
        lines.push('');
        inOrderedList = false;
        break;
      }
      
      case 'paragraph':
      case 'text':
        lines.push(el.content);
        lines.push('');
        inOrderedList = false;
        break;
      
      case 'blockquote':
        lines.push(`> ${el.content}`);
        lines.push('');
        inOrderedList = false;
        break;
      
      case 'code':
        lines.push('```');
        lines.push(el.content);
        lines.push('```');
        lines.push('');
        inOrderedList = false;
        break;
      
      case 'list-item':
        if (el.listType === 'ordered') {
          if (!inOrderedList) {
            listCounter = 0;
            inOrderedList = true;
          }
          listCounter++;
          lines.push(`${listCounter}. ${el.content}`);
        } else {
          inOrderedList = false;
          lines.push(`- ${el.content}`);
        }
        break;
      
      case 'break':
        if (el.content === '---') {
          lines.push('');
          lines.push('---');
          lines.push('');
        }
        inOrderedList = false;
        break;
    }
  }
  
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}
