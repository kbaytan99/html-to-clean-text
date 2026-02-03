/**
 * URL Fetcher - Fetch HTML from URLs using CORS proxies
 */
export interface FetchResult {
    success: boolean;
    html?: string;
    error?: string;
    usedProxy?: string;
}
/**
 * Validate URL format
 */
export declare function isValidUrl(url: string): boolean;
/**
 * Fetch HTML from a URL using CORS proxies
 */
export declare function fetchUrl(url: string): Promise<FetchResult>;
