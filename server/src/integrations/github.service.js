export async function fetchGitHubUser(handle) {
  const url = `https://api.github.com/users/${encodeURIComponent(handle)}`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'CodeQuest-Dev-App',
      'Accept': 'application/vnd.github.v3+json'
    },
    signal: AbortSignal.timeout(12000)
  });

  if (response.status === 404) {
    throw new Error(`GitHub username "${handle}" was not found.`);
  }

  if (!response.ok) {
    throw new Error('GitHub API is temporarily unavailable.');
  }

  const data = await response.json();
  return {
    handle: data.login,
    stats: {
      solved: data.public_repos || 0,
      rating: data.followers || 0
    },
    profile: {
      displayName: data.name || data.login,
      avatar: data.avatar_url,
      profileUrl: data.html_url
    }
  };
}
