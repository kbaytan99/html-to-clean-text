/**
 * HTML Cleaner - Core cleaning logic using DOMParser
 * Removes all noise and extracts meaningful text content
 */
export interface ExtractedElement {
    type: 'text' | 'heading' | 'paragraph' | 'list-item' | 'blockquote' | 'code' | 'break';
    level?: number;
    content: string;
    listType?: 'ordered' | 'unordered';
}
/**
 * Parse and clean HTML content
 */
export declare function parseAndClean(html: string): ExtractedElement[];
/**
 * Convert extracted elements to plain text
 */
export declare function toPlainText(elements: ExtractedElement[]): string;
/**
 * Convert extracted elements to Markdown
 */
export declare function toMarkdown(elements: ExtractedElement[]): string;
