/**
 * URL Fetcher - Fetch HTML from URLs using CORS proxies
 */
// List of CORS proxies to try (in order)
const CORS_PROXIES = [
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?',
    'https://api.codetabs.com/v1/proxy?quest=',
];
/**
 * Validate URL format
 */
export function isValidUrl(url) {
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    }
    catch {
        return false;
    }
}
/**
 * Fetch HTML from a URL using CORS proxies
 */
export async function fetchUrl(url) {
    if (!isValidUrl(url)) {
        return { success: false, error: 'Invalid URL format' };
    }
    // Try direct fetch first (might work for some sites)
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
        });
        if (response.ok) {
            const html = await response.text();
            return { success: true, html, usedProxy: 'direct' };
        }
    }
    catch {
        // Direct fetch failed, try proxies
    }
    // Try each CORS proxy
    for (const proxy of CORS_PROXIES) {
        try {
            const proxyUrl = proxy + encodeURIComponent(url);
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout
            const response = await fetch(proxyUrl, {
                method: 'GET',
                signal: controller.signal,
            });
            clearTimeout(timeout);
            if (response.ok) {
                const html = await response.text();
                // Validate it looks like HTML
                if (html.includes('<') && (html.includes('</') || html.includes('/>'))) {
                    return { success: true, html, usedProxy: proxy };
                }
            }
        }
        catch {
            // This proxy failed, try next
            continue;
        }
    }
    return {
        success: false,
        error: 'Could not fetch URL. The site may be blocking requests. Try copying the HTML manually (Ctrl+U in browser, then copy all).'
    };
}
//# sourceMappingURL=fetcher.js.map