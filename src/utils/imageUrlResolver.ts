/**
 * Utility to resolve, clean, and unblock Google and web image URLs
 */

export function cleanAndResolveImageUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  let url = rawUrl.trim();

  // Strip wrapping quotes
  if ((url.startsWith('"') && url.endsWith('"')) || (url.startsWith("'") && url.endsWith("'"))) {
    url = url.substring(1, url.length - 1).trim();
  }

  try {
    // 1. Check if it's a Google imgres URL: https://www.google.com/imgres?imgurl=https%3A%2F%2F...
    if (url.includes('google.') && (url.includes('/imgres') || url.includes('/search'))) {
      try {
        const parsed = new URL(url);
        const directImg = parsed.searchParams.get('imgurl');
        if (directImg) {
          let decoded = decodeURIComponent(directImg);
          // Handle potential double encoding
          if (decoded.includes('%3A') || decoded.includes('%2F')) {
            try { decoded = decodeURIComponent(decoded); } catch {}
          }
          return decoded;
        }
      } catch {}
    }

    // 2. Check if it's a Google search redirect: https://www.google.com/url?sa=i&url=...
    if (url.includes('google.') && url.includes('/url')) {
      try {
        const parsed = new URL(url);
        const targetUrl = parsed.searchParams.get('url') || parsed.searchParams.get('q');
        if (targetUrl) {
          let decoded = decodeURIComponent(targetUrl);
          if (decoded.includes('%3A') || decoded.includes('%2F')) {
            try { decoded = decodeURIComponent(decoded); } catch {}
          }
          return decoded;
        }
      } catch {}
    }

    // 3. Google Drive links (convert to direct streamable image)
    if (url.includes('drive.google.com')) {
      const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
      if (fileIdMatch && fileIdMatch[1]) {
        return `https://drive.google.com/uc?export=view&id=${fileIdMatch[1]}`;
      }
    }

    // 4. Fallback regex extraction if standard URL parsing didn't catch imgurl query
    const match = url.match(/[?&]imgurl=([^&#]+)/i);
    if (match && match[1]) {
      try {
        let dec = decodeURIComponent(match[1]);
        if (dec.includes('%3A') || dec.includes('%2F')) {
          try { dec = decodeURIComponent(dec); } catch {}
        }
        return dec;
      } catch {
        return match[1];
      }
    }

    return url;
  } catch {
    return url;
  }
}

/**
 * Returns proxy URL for external images that might block hotlinking
 */
export function getProxiedImageUrl(url: string): string {
  const clean = cleanAndResolveImageUrl(url);
  if (!clean) return '';
  if (clean.startsWith('data:') || clean.startsWith('/') || clean.includes('localhost')) {
    return clean;
  }
  return `/api/image-proxy?url=${encodeURIComponent(clean)}`;
}

/**
 * High reliability department fallback images
 */
export const DEFAULT_DEPT_IMAGES: Record<string, string> = {
  cosmetics: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80',
  pharmacy: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
  grocery: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
  drinks: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80',
  toiletries: 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=600&q=80',
  toys: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=600&q=80',
  crockery: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
  electronics: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=600&q=80',
  'birthday-items': 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=600&q=80',
  lingerie: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=600&q=80'
};
