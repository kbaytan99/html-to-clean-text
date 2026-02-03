/**
 * URL Fetcher - Fetch HTML from URLs using CORS proxies
 */

// List of CORS proxies to try (in order)
const CORS_PROXIES = [
  { url: 'https://api.allorigins.win/get?url=', isJson: true, contentKey: 'contents' },
  { url: 'https://corsproxy.io/?', isJson: false },
  { url: 'https://api.codetabs.com/v1/proxy?quest=', isJson: false },
];

export interface FetchResult {
  success: boolean;
  html?: string;
  error?: string;
  usedProxy?: string;
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Fetch HTML from a URL using CORS proxies
 */
export async function fetchUrl(url: string): Promise<FetchResult> {
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
  } catch {
    // Direct fetch failed, try proxies
  }

  // Try each CORS proxy
  for (const proxy of CORS_PROXIES) {
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
        let html = await response.text();
        
        // Handle JSON response from some proxies
        if (proxy.isJson && proxy.contentKey) {
          try {
            const jsonData = JSON.parse(html);
            html = jsonData[proxy.contentKey] || html;
          } catch {
            // Not valid JSON, use raw response
          }
        }
        
        // Validate it looks like HTML
        if (html.includes('<') && (html.includes('</') || html.includes('/>'))) {
          return { success: true, html, usedProxy: proxy.url };
        }
      }
    } catch {
      // This proxy failed, try next
      continue;
    }
  }

  return {
    success: false,
    error: 'Could not fetch URL. The site may be blocking requests. Try copying the HTML manually (Ctrl+U in browser, then copy all).'
  };
}
