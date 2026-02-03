/**
 * URL Fetcher - Fetch HTML from URLs using CORS proxies
 */
/**
 * Check if URL is from a blocked domain
 */
export declare function isBlockedDomain(url: string): {
    blocked: boolean;
    domain?: string;
};
export interface FetchResult {
    success: boolean;
    html?: string;
    error?: string;
    usedProxy?: string;
}
export interface FetchProgress {
    stage: 'connecting' | 'trying-proxy' | 'downloading' | 'done' | 'error';
    message: string;
    percent: number;
    proxyIndex?: number;
    totalProxies?: number;
}
export type ProgressCallback = (progress: FetchProgress) => void;
/**
 * Validate URL format
 */
export declare function isValidUrl(url: string): boolean;
/**
 * Fetch HTML from a URL using CORS proxies
 */
export declare function fetchUrl(url: string, onProgress?: ProgressCallback): Promise<FetchResult>;
