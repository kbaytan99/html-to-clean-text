export type OutputMode = 'plaintext' | 'markdown' | 'json';

export interface ContentChunk {
  chunk: number;
  text: string;
  approx_tokens: number;
}

export interface JSONOutput {
  source: string;
  language: string;
  content: ContentChunk[];
}

export interface CleaningResult {
  plainText: string;
  markdown: string;
  json: JSONOutput;
  stats: CleaningStats;
}

export interface CleaningStats {
  originalLength: number;
  cleanedLength: number;
  reductionPercent: number;
  wordCount: number;
  estimatedTokens: number;
  chunkCount: number;
}

export interface CleanerOptions {
  chunkSize: number;
}
