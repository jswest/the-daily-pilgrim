export function oxford(items) {
  const conj = "and";
  const n = items.length;
  if (n === 1) {
    return items[0];
  } else if (n === 2) {
    return `${items[0]} ${conj} ${items[1]}`;
  } else if (n > 2) {
    return `${items.slice(0, -1).join(", ")}, ${conj} ${items[n - 1]}`;
  } else {
    return "";
  }
}

export function canonicalizeUrl(urlString) {
  if (!urlString || typeof urlString !== 'string') {
    return { canonical: null, hostname: null };
  }

  try {
    const url = new URL(urlString.trim());

    // Extract hostname and remove www prefix
    let hostname = url.hostname.toLowerCase();
    if (hostname.startsWith('www.')) {
      hostname = hostname.substring(4);
    }

    // Build canonical URL: protocol + hostname + pathname
    // Remove query strings, fragments, trailing slashes
    let pathname = url.pathname;
    if (pathname.endsWith('/') && pathname.length > 1) {
      pathname = pathname.slice(0, -1);
    }

    const canonical = `https://${hostname}${pathname}`;

    return { canonical, hostname };
  } catch (error) {
    // Invalid URL
    return { canonical: null, hostname: null };
  }
}