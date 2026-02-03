import type { ContentChunk, JSONOutput } from './types.js';
/**
 * Approximate token count using a simple heuristic
 * ~4 characters per token on average (GPT-style tokenization)
 */
export declare function estimateTokens(text: string): number;
/**
 * Split text into chunks of approximately the target token size
 */
export declare function chunkText(text: string, targetTokens?: number): ContentChunk[];
/**
 * Detect the primary language of the text
 */
export declare function detectLanguage(text: string): string;
/**
 * Create JSON output for LLMs
 */
export declare function toJSON(text: string, targetTokens?: number): JSONOutput;
