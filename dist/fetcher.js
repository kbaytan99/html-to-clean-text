/**
 * URL Fetcher - Fetch HTML from URLs using CORS proxies
 */
// List of CORS proxies to try (in order)
const CORS_PROXIES = [
    { url: 'https://api.allorigins.win/get?url=', isJson: true, contentKey: 'contents' },
    { url: 'https://corsproxy.io/?', isJson: false },
    { url: 'https://api.codetabs.com/v1/proxy?quest=', isJson: false },
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
export async function fetchUrl(url, onProgress) {
    if (!isValidUrl(url)) {
        return { success: false, error: 'Invalid URL format' };
    }
    const totalSteps = CORS_PROXIES.length + 1; // +1 for direct attempt
    // Try direct fetch first (might work for some sites)
    onProgress?.({
        stage: 'connecting',
        message: 'Trying direct connection...',
        percent: 10
    });
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
        });
        if (response.ok) {
            onProgress?.({
                stage: 'downloading',
                message: 'Downloading content...',
                percent: 80
            });
            const html = await response.text();
            onProgress?.({
                stage: 'done',
                message: 'Complete!',
                percent: 100
            });
            return { success: true, html, usedProxy: 'direct' };
        }
    }
    catch {
        // Direct fetch failed, try proxies
    }
    // Try each CORS proxy
    for (let i = 0; i < CORS_PROXIES.length; i++) {
        const proxy = CORS_PROXIES[i];
        const progressPercent = 20 + ((i + 1) / totalSteps) * 60;
        onProgress?.({
            stage: 'trying-proxy',
            message: `Trying proxy ${i + 1}/${CORS_PROXIES.length}...`,
            percent: progressPercent,
            proxyIndex: i + 1,
            totalProxies: CORS_PROXIES.length
        });
        try {
            const proxyUrl = proxy.url + encodeURIComponent(url);
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout
            const response = await fetch(proxyUrl, {
                method: 'GET',
                signal: controller.signal,
            });
            clearTimeout(timeout);
            if (response.ok) {
                onProgress?.({
                    stage: 'downloading',
                    message: 'Downloading content...',
                    percent: 85
                });
                let html = await response.text();
                // Handle JSON response from some proxies
                if (proxy.isJson && proxy.contentKey) {
                    try {
                        const jsonData = JSON.parse(html);
                        html = jsonData[proxy.contentKey] || html;
                    }
                    catch {
                        // Not valid JSON, use raw response
                    }
                }
                // Validate it looks like HTML
                if (html.includes('<') && (html.includes('</') || html.includes('/>'))) {
                    onProgress?.({
                        stage: 'done',
                        message: 'Complete!',
                        percent: 100
                    });
                    return { success: true, html, usedProxy: proxy.url };
                }
            }
        }
        catch {
            // This proxy failed, try next
            continue;
        }
    }
    onProgress?.({
        stage: 'error',
        message: 'All methods failed',
        percent: 100
    });
    return {
        success: false,
        error: 'Could not fetch URL. The site may be blocking requests. Try copying the HTML manually (Ctrl+U in browser, then copy all).'
    };
}
//# sourceMappingURL=fetcher.js.map