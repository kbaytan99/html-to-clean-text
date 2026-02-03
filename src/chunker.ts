import type { ContentChunk, JSONOutput } from './types.js';

/**
 * Approximate token count using a simple heuristic
 * ~4 characters per token on average (GPT-style tokenization)
 */
export function estimateTokens(text: string): number {
  // More accurate estimation:
  // - Words are roughly 1.3 tokens on average
  // - Punctuation and special chars add tokens
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const wordTokens = words.length * 1.3;
  
  // Count punctuation and special characters
  const specialChars = (text.match(/[^\w\s]/g) || []).length;
  
  return Math.ceil(wordTokens + specialChars * 0.5);
}

/**
 * Find the best break point in text (sentence or paragraph boundary)
 */
function findBreakPoint(text: string, maxPos: number): number {
  // Look for paragraph breaks first
  const paragraphBreak = text.lastIndexOf('\n\n', maxPos);
  if (paragraphBreak > maxPos * 0.5) {
    return paragraphBreak + 2;
  }
  
  // Look for single line breaks
  const lineBreak = text.lastIndexOf('\n', maxPos);
  if (lineBreak > maxPos * 0.6) {
    return lineBreak + 1;
  }
  
  // Look for sentence endings (. ! ?)
  const sentenceEnders = ['. ', '! ', '? ', '.\n', '!\n', '?\n'];
  let bestBreak = -1;
  
  for (const ender of sentenceEnders) {
    const pos = text.lastIndexOf(ender, maxPos);
    if (pos > bestBreak && pos > maxPos * 0.5) {
      bestBreak = pos + ender.length;
    }
  }
  
  if (bestBreak > 0) {
    return bestBreak;
  }
  
  // Fall back to word boundary
  const spacePos = text.lastIndexOf(' ', maxPos);
  if (spacePos > maxPos * 0.7) {
    return spacePos + 1;
  }
  
  // Absolute fallback
  return maxPos;
}

/**
 * Split text into chunks of approximately the target token size
 */
export function chunkText(text: string, targetTokens: number = 1000): ContentChunk[] {
  const chunks: ContentChunk[] = [];
  
  // Normalize text
  const normalizedText = text.trim();
  if (!normalizedText) return [];
  
  const totalTokens = estimateTokens(normalizedText);
  
  // If text is small enough, return as single chunk
  if (totalTokens <= targetTokens * 1.2) {
    return [{
      chunk: 1,
      text: normalizedText,
      approx_tokens: totalTokens
    }];
  }
  
  // Calculate approximate characters per token
  const charsPerToken = normalizedText.length / totalTokens;
  const targetChars = Math.floor(targetTokens * charsPerToken);
  const minChars = Math.floor(targetChars * 0.8);
  const maxChars = Math.floor(targetChars * 1.2);
  
  let remaining = normalizedText;
  let chunkNumber = 1;
  
  while (remaining.length > 0) {
    let chunkText: string;
    
    if (remaining.length <= maxChars) {
      // Remaining text fits in one chunk
      chunkText = remaining;
      remaining = '';
    } else {
      // Find best break point
      const breakPos = findBreakPoint(remaining, maxChars);
      chunkText = remaining.slice(0, breakPos).trim();
      remaining = remaining.slice(breakPos).trim();
    }
    
    if (chunkText) {
      chunks.push({
        chunk: chunkNumber++,
        text: chunkText,
        approx_tokens: estimateTokens(chunkText)
      });
    }
  }
  
  return chunks;
}

/**
 * Detect the primary language of the text
 */
export function detectLanguage(text: string): string {
  // Simple heuristic based on character ranges
  const sample = text.slice(0, 1000);
  
  // Check for CJK characters
  if (/[\u4e00-\u9fff]/.test(sample)) return 'zh';
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(sample)) return 'ja';
  if (/[\uac00-\ud7af]/.test(sample)) return 'ko';
  
  // Check for Cyrillic
  if (/[\u0400-\u04ff]/.test(sample)) return 'ru';
  
  // Check for Arabic
  if (/[\u0600-\u06ff]/.test(sample)) return 'ar';
  
  // Check for Hebrew
  if (/[\u0590-\u05ff]/.test(sample)) return 'he';
  
  // Check for Devanagari (Hindi)
  if (/[\u0900-\u097f]/.test(sample)) return 'hi';
  
  // Check for Thai
  if (/[\u0e00-\u0e7f]/.test(sample)) return 'th';
  
  // Check for common European language patterns
  const lowerSample = sample.toLowerCase();
  
  if (/\b(der|die|das|und|ist|für)\b/.test(lowerSample)) return 'de';
  if (/\b(le|la|les|et|est|pour)\b/.test(lowerSample)) return 'fr';
  if (/\b(el|la|los|las|es|para)\b/.test(lowerSample)) return 'es';
  if (/\b(il|la|gli|le|è|per)\b/.test(lowerSample)) return 'it';
  if (/\b(o|a|os|as|é|para)\b/.test(lowerSample)) return 'pt';
  if (/\b(de|het|een|en|is|voor)\b/.test(lowerSample)) return 'nl';
  
  // Default to English
  return 'en';
}

/**
 * Create JSON output for LLMs
 */
export function toJSON(text: string, targetTokens: number = 1000): JSONOutput {
  const chunks = chunkText(text, targetTokens);
  const language = detectLanguage(text);
  
  return {
    source: 'user-pasted-html',
    language,
    content: chunks
  };
}
