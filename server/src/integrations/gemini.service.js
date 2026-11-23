export async function generateGeminiReadiness({ user, accounts = [], stats = {}, defaultData = {} }) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return { ...defaultData, isAiPowered: false, aiInsight: null };
  }

  const prompt = `You are a Principal Software Engineering Bar Raiser & Technical Interview Coach for Tier-1 companies (Google, Meta, Amazon, Microsoft, Top Startups).
Evaluate this developer's interview readiness based on their multi-platform coding metrics:

Candidate: ${user.name || user.username || 'Developer'}
- Total Problems Solved: ${stats.totalSolved || 0}
- Easy: ${stats.easy || 0}
- Medium: ${stats.medium || 0}
- Hard: ${stats.hard || 0}
- Highest Contest Rating: ${stats.highestRating || 0}
Platform Profiles:
${accounts.map(a => `- ${a.platform} (@${a.handle}): ${a.stats?.solved || 0} solved, rating: ${a.stats?.rating || 'N/A'}`).join('\n') || 'None connected'}

Provide an honest, data-backed assessment. Return STRICT JSON with this exact format without any markdown fences:
{
  "aiInsight": "A 2-3 sentence strategic technical evaluation of their interview bar and hiring readiness.",
  "strengths": [
    "Specific algorithmic strength 1",
    "Specific algorithmic strength 2",
    "Specific consistency or contest strength 3"
  ],
  "focusAreas": [
    "Specific algorithmic topic to target next (e.g. Graph BFS, DP, Tries)",
    "Specific contest/speed recommendation",
    "Specific preparation milestone"
  ]
}`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          response_mime_type: 'application/json',
          temperature: 0.3
        }
      }),
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.warn(`[Gemini API] Returned HTTP ${response.status}:`, errText.slice(0, 200));
      return { ...defaultData, isAiPowered: false, aiInsight: null };
    }

    const payload = await response.json();
    const rawText = payload.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return { ...defaultData, isAiPowered: false, aiInsight: null };

    const parsed = JSON.parse(rawText);
    return {
      companies: defaultData.companies,
      strengths: Array.isArray(parsed.strengths) && parsed.strengths.length > 0 ? parsed.strengths : defaultData.strengths,
      focusAreas: Array.isArray(parsed.focusAreas) && parsed.focusAreas.length > 0 ? parsed.focusAreas : defaultData.focusAreas,
      aiInsight: parsed.aiInsight || null,
      isAiPowered: true,
      overview: defaultData.overview
    };
  } catch (err) {
    console.warn('[Gemini API] Request failed or timed out:', err.message);
    return { ...defaultData, isAiPowered: false, aiInsight: null };
  }
}
