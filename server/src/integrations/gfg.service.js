export async function fetchGFGUser(handle) {
  const url = `https://www.geeksforgeeks.org/user/${encodeURIComponent(handle)}/`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml'
    },
    signal: AbortSignal.timeout(12000)
  });

  if (!response.ok) {
    throw new Error(`GeeksforGeeks handle "${handle}" not found.`);
  }

  const html = await response.text();
  if (html.includes('Page Not Found') || html.includes('User does not exist') || html.includes('404_error')) {
    throw new Error(`That GeeksforGeeks handle "${handle}" was not found.`);
  }

  const solvedMatch = html.match(/total_problems_solved\\*":\s*(\d+)/i) || html.match(/"total_problems_solved":\s*(\d+)/i);
  const scoreMatch = html.match(/score\\*":\s*(\d+)/i) || html.match(/coding_score\\*":\s*(\d+)/i);
  const mentorMatch = html.match(/\\"mentor\\":\{[^}]*?\\"name\\":\\*"([^\\\\"]+)/i) || html.match(/"name":\s*"([^"]+)"/i);
  const avatarMatch = html.match(/profile_image_url\\*":\s*\\*"([^\\"]+)/i) || html.match(/"profile_image_url":\s*"([^"]+)"/i);

  const solved = solvedMatch ? parseInt(solvedMatch[1], 10) : 0;
  const rating = scoreMatch ? parseInt(scoreMatch[1], 10) : null;
  const displayName = mentorMatch ? mentorMatch[1].replace(/\\/g, '').trim() : handle;
  const avatar = avatarMatch ? avatarMatch[1].replace(/\\/g, '') : null;

  return {
    handle,
    stats: {
      solved,
      rating
    },
    profile: {
      displayName,
      avatar,
      profileUrl: url
    }
  };
}
