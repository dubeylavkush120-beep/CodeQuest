const API_ROOT = 'https://codeforces.com/api';
let requestQueue = Promise.resolve();
let lastRequestAt = 0;

async function waitForRateLimit() {
  const task = requestQueue.then(async () => {
    const waitMs = Math.max(0, 2200 - (Date.now() - lastRequestAt));
    if (waitMs) await new Promise(resolve => setTimeout(resolve, waitMs));
    lastRequestAt = Date.now();
  });
  requestQueue = task.catch(() => {});
  await task;
}

export async function fetchCodeforcesUser(handle) {
  await waitForRateLimit();
  const url = new URL(`${API_ROOT}/user.info`);
  url.searchParams.set('handles', handle);
  const response = await fetch(url, { signal: AbortSignal.timeout(12000), headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error('Codeforces is temporarily unavailable. Try syncing again shortly.');
  const payload = await response.json();
  if (payload.status !== 'OK') {
    if (/not found|failed to find/i.test(payload.comment || '')) {
      throw new Error(`That Codeforces handle "${handle}" was not found.`);
    }
    throw new Error(payload.comment || 'Codeforces could not return this public profile.');
  }
  const user = payload.result?.[0];
  if (!user) throw new Error(`That Codeforces handle "${handle}" was not found.`);

  // Wait for rate limit before fetching status to avoid Codeforces 429
  let solvedCount = 0;
  const dailyHistory = {};
  try {
    await waitForRateLimit();
    const statusUrl = new URL(`${API_ROOT}/user.status`);
    statusUrl.searchParams.set('handle', handle);
    statusUrl.searchParams.set('from', '1');
    statusUrl.searchParams.set('count', '10000');
    const subRes = await fetch(statusUrl, { signal: AbortSignal.timeout(15000), headers: { Accept: 'application/json' } });
    if (subRes.ok) {
      const subPayload = await subRes.json();
      if (subPayload.status === 'OK' && Array.isArray(subPayload.result)) {
        const solvedSet = new Set();
        for (const sub of subPayload.result) {
          if (sub.verdict === 'OK' && sub.problem?.contestId && sub.problem?.index) {
            const key = `${sub.problem.contestId}-${sub.problem.index}`;
            if (!solvedSet.has(key)) {
              solvedSet.add(key);
              if (sub.creationTimeSeconds) {
                const d = new Date(sub.creationTimeSeconds * 1000).toISOString().slice(0, 10);
                dailyHistory[d] = (dailyHistory[d] || 0) + 1;
              }
            }
          }
        }
        solvedCount = solvedSet.size;
      }
    }
  } catch (err) {
    console.error('Codeforces user.status error:', err.message);
  }

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.handle;
  return {
    handle: user.handle,
    stats: {
      solved: solvedCount,
      rating: Number.isFinite(user.rating) ? user.rating : null,
      maxRating: Number.isFinite(user.maxRating) ? user.maxRating : null,
      rank: user.rank || null,
      maxRank: user.maxRank || null,
      history: dailyHistory
    },
    profile: {
      displayName,
      country: user.country || null,
      organization: user.organization || null,
      avatar: user.titlePhoto || user.avatar || null,
      profileUrl: `https://codeforces.com/profile/${encodeURIComponent(user.handle)}`
    }
  };
}
