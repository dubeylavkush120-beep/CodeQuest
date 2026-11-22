export async function fetchLeetCodeUser(username) {
  const query = `
    query getUserProfileAndContest($username: String!) {
      matchedUser(username: $username) {
        username
        submissionCalendar
        submitStats: submitStatsGlobal {
          acSubmissionNum {
            difficulty
            count
          }
        }
        profile {
          ranking
          userAvatar
          realName
          countryName
        }
      }
      userContestRanking(username: $username) {
        attendedContestsCount
        rating
        globalRanking
        topPercentage
        badge {
          name
        }
      }
    }
  `;

  const response = await fetch('https://leetcode.com/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Referer': 'https://leetcode.com',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    },
    body: JSON.stringify({ query, variables: { username } }),
    signal: AbortSignal.timeout(12000)
  });

  if (!response.ok) {
    throw new Error('LeetCode is currently unreachable. Please try again shortly.');
  }

  const payload = await response.json();
  const matchedUser = payload?.data?.matchedUser;
  if (!matchedUser) {
    throw new Error(`LeetCode handle "${username}" was not found. Please check spelling.`);
  }

  const submissions = matchedUser.submitStats?.acSubmissionNum || [];
  let solved = 0, easy = 0, medium = 0, hard = 0;
  for (const s of submissions) {
    if (s.difficulty === 'All') solved = s.count || 0;
    else if (s.difficulty === 'Easy') easy = s.count || 0;
    else if (s.difficulty === 'Medium') medium = s.count || 0;
    else if (s.difficulty === 'Hard') hard = s.count || 0;
  }

  const contest = payload?.data?.userContestRanking;
  // Actual Contest Rating (e.g. 1594, 1850), rounded to integer
  const contestRating = contest?.rating ? Math.round(contest.rating) : null;
  // Global Contest Ranking or Badge
  const contestRank = contest?.badge?.name
    || (contest?.globalRanking ? `#${contest.globalRanking.toLocaleString()}` : null)
    || (matchedUser.profile?.ranking ? `Global #${matchedUser.profile.ranking.toLocaleString()}` : null);

  // Parse submission calendar into daily solve map: { 'YYYY-MM-DD': count }
  const dailyHistory = {};
  if (matchedUser.submissionCalendar) {
    try {
      const cal = JSON.parse(matchedUser.submissionCalendar);
      for (const [timestamp, count] of Object.entries(cal)) {
        const d = new Date(Number(timestamp) * 1000).toISOString().slice(0, 10);
        dailyHistory[d] = (dailyHistory[d] || 0) + Number(count);
      }
    } catch {}
  }

  return {
    handle: matchedUser.username,
    stats: {
      solved,
      easy,
      medium,
      hard,
      rating: contestRating, // Contest rating points (e.g. 1594)
      maxRating: contestRating,
      rank: contestRank,
      history: dailyHistory
    },
    profile: {
      displayName: matchedUser.profile?.realName || matchedUser.username,
      country: matchedUser.profile?.countryName || null,
      avatar: matchedUser.profile?.userAvatar || null,
      profileUrl: `https://leetcode.com/u/${encodeURIComponent(matchedUser.username)}`
    }
  };
}
