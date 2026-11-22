export async function fetchCodeChefUser(handle) {
  const url = `https://www.codechef.com/users/${encodeURIComponent(handle)}`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml'
    },
    signal: AbortSignal.timeout(12000)
  });

  if (!response.ok) {
    throw new Error(`CodeChef handle "${handle}" not found or service unavailable.`);
  }

  const html = await response.text();
  if (html.includes('Could not find') || html.includes('Page Not Found') || !html.includes('user-details-container')) {
    throw new Error(`That CodeChef handle "${handle}" was not found.`);
  }

  const ratingMatch = html.match(/class="rating-number">([^<]+)</i);
  const maxRatingMatch = html.match(/\(Highest Rating\s*(\d+)\)/i);
  const solvedMatch = html.match(/Total Problems Solved:\s*(\d+)/i) || html.match(/Problems Solved[^\d]+(\d+)/i);
  const starsMatch = html.match(/class="rating-star"[^>]*>([^<]+)/i) || html.match(/(\d+★)/);
  const nameMatch = html.match(/<h1[^>]*class="h2-style"[^>]*>([^<]+)<\/h1>/i);
  const countryMatch = html.match(/class="user-country-name">([^<]+)</i);

  const solved = solvedMatch ? parseInt(solvedMatch[1], 10) : 0;
  const rating = ratingMatch ? parseInt(ratingMatch[1].trim(), 10) : null;
  const maxRating = maxRatingMatch ? parseInt(maxRatingMatch[1], 10) : null;
  const rank = starsMatch ? (starsMatch[1] || starsMatch[0]).trim() : null;
  const displayName = nameMatch ? nameMatch[1].trim() : handle;

  return {
    handle,
    stats: {
      solved,
      rating,
      maxRating,
      rank
    },
    profile: {
      displayName,
      country: countryMatch ? countryMatch[1].trim() : null,
      profileUrl: url
    }
  };
}
