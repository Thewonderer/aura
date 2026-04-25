const ARCHETYPES = [
  { id: "polite-architect", name: "The Polite Architect", emoji: "🏗️", tagline: "detailed specs with a please on top", description: "You give AI clear, structured instructions and always keep it respectful. Good manners, better results.", color: "#4CAF50" },
  { id: "mood-seeker", name: "The Mood Seeker", emoji: "🌙", tagline: "vibes first, specs second", description: "You come to AI when you need to think out loud. The conversation is the point.", color: "#7C4DFF" },
  { id: "straight-shooter", name: "The Straight Shooter", emoji: "🎯", tagline: "no fluff, just the thing", description: "Direct, efficient, zero wasted words. You know what you want and you say it.", color: "#FF5722" },
  { id: "rabbit-holer", name: "The Rabbit Holer", emoji: "🕳️", tagline: "one question leads to twelve", description: "Your conversations branch and spiral. You follow curiosity wherever it goes.", color: "#9C27B0" },
  { id: "perfectionist", name: "The Perfectionist", emoji: "💎", tagline: "not quite right — try again", description: "You iterate until it's exactly right. The first draft is just a warm-up.", color: "#E91E63" },
  { id: "sprinter", name: "The Sprinter", emoji: "⚡", tagline: "fast in, fast out", description: "Quick bursts of high-intensity prompting. You get what you need and move on.", color: "#FF9800" },
  { id: "deep-diver", name: "The Deep Diver", emoji: "🌊", tagline: "long prompts, longer sessions", description: "You go deep. Your prompts are thorough, your sessions are long, your context is rich.", color: "#0097A7" },
  { id: "skeptic", name: "The Skeptic", emoji: "🤨", tagline: "prove it", description: "You push back, question outputs, and don't take the first answer at face value.", color: "#795548" },
  { id: "minimalist", name: "The Minimalist", emoji: "✨", tagline: "less is more", description: "Two words, three max. Maximum efficiency, minimum tokens.", color: "#9E9E9E" },
  { id: "thinker", name: "The Thinker", emoji: "🧠", tagline: "let me think about this...", description: "Hedging, context-setting, careful framing. You think before you prompt.", color: "#3F51B5" },
  { id: "strategist", name: "The Strategist", emoji: "♟️", tagline: "playing the long game", description: "Structured prompts, role assignments, clear constraints. You engineer conversations.", color: "#455A64" },
  { id: "director", name: "The Director", emoji: "🎬", tagline: "imperatives only", description: "Commands, not requests. You direct the AI like a film set — action, cut, again.", color: "#D32F2F" },
  { id: "hacker", name: "The Hacker", emoji: "💻", tagline: "code blocks and structured chaos", description: "Code-heavy, technical, formatted. You speak AI's native language.", color: "#00C853" },
  { id: "context-king", name: "The Context King", emoji: "📋", tagline: "let me give you some background...", description: "You front-load context, constraints, and examples. The AI never has to guess.", color: "#8D6E63" },
  { id: "tinkerer", name: "The Tinkerer", emoji: "🔧", tagline: "what if we tweak this...", description: "Small adjustments, follow-ups, refinements. You sculpt the output over multiple turns.", color: "#F57C00" },
  { id: "chaos-gremlin", name: "The Chaos Gremlin", emoji: "👹", tagline: "wildcard energy", description: "Mixed signals, wild pivots, caps lock surprises. You keep AI on its toes.", color: "#880E4F" },
  { id: "overthinker", name: "The Overthinker", emoji: "🌀", tagline: "this prompt has layers. and sublayers.", description: "Long, detailed, thorough. You cover every edge case before hitting enter.", color: "#6A1B9A" },
  { id: "golden-retriever", name: "The Golden Retriever", emoji: "🐶", tagline: "AI is thriving on this energy", description: "Warm, appreciative, emoji-friendly. You make AI feel like a good boy.", color: "#FFC107" },
  { id: "ghost", name: "The Ghost", emoji: "👻", tagline: "appeared. extracted. vanished.", description: "One prompt, maybe two. In and out. No small talk, no follow-ups.", color: "#546E7A" },
  { id: "critic", name: "The Critic", emoji: "📝", tagline: "interesting, but wrong", description: "You evaluate, correct, and refine. Quality control is your default mode.", color: "#C62828" },
  { id: "interrogator", name: "The Interrogator", emoji: "🔦", tagline: "follow-up questions only", description: "Question after question. You drill into topics until there's nothing left to ask.", color: "#1565C0" },
  { id: "cold-commander", name: "The Cold Commander", emoji: "🧊", tagline: "no warmth, maximum efficiency", description: "Zero pleasantries, zero emojis, pure function. The AI is a tool, period.", color: "#37474F" },
];

const DYNAMIC_STATES = [
  { id: "short-fuse", name: "Short Fuse", emoji: "🌶️", tagline: "this started calm... and got spicy", color: "#FF1744" },
  { id: "caps-warrior", name: "Caps Lock Warrior", emoji: "📢", tagline: "OKAY WE GET IT", color: "#FF6D00" },
];

function computeAuraScores(stats) {
  if (!stats || stats.totalMessages === 0) return null;

  const total = stats.totalMessages;
  const avgWords = stats.totalWords / total;
  const avgChars = stats.totalChars / total;

  const warmth = Math.min(100, Math.round(
    ((stats.pleaseCount + stats.thankYouCount + stats.sorryCount + stats.greetingCount) / total) * 100
  ));

  const intensity = Math.min(100, Math.round(
    ((stats.capsCount / total) * 40 +
     (stats.repeatedPuncCount / total) * 30 +
     (stats.exclamationMarks / total) * 15 +
     (stats.urgencyCount / total) * 15) * 100
  ));

  const depth = Math.min(100, Math.round(Math.min(avgChars / 500, 1) * 100));

  const clarity = Math.min(100, Math.round(
    ((stats.structuredCount / total) * 40 +
     (stats.contextCount / total) * 30 +
     (Math.min(avgWords / 40, 1)) * 30) * 100
  ));

  const curiosity = Math.min(100, Math.round(
    ((stats.questionMarks / total) * 50 +
     (stats.followUpCount / total) * 30 +
     (1 - stats.imperativeCount / total) * 20) * 100
  ));

  const directness = Math.min(100, Math.round(
    ((stats.imperativeCount / total) * 50 +
     (1 - warmth / 100) * 25 +
     Math.max(0, 1 - avgWords / 40) * 25) * 100
  ));

  const persistence = Math.min(100, Math.round(
    ((stats.pushbackCount / total) * 50 +
     (stats.followUpCount / total) * 30 +
     (stats.hedgingCount / total) * 20) * 100
  ));

  const sophistication = Math.min(100, Math.round(
    ((stats.actAsCount / total) * 35 +
     (stats.codeBlockCount / total) * 30 +
     (stats.structuredCount / total) * 35) * 100
  ));

  const brevity = Math.min(100, Math.round(Math.max(0, (1 - avgWords / 60)) * 100));

  const friendliness = Math.min(100, Math.round(
    (warmth / 100 * 40 +
     (stats.emojiCount / total) * 30 +
     (stats.greetingCount / total) * 30) * 100
  ));

  return {
    warmth,
    intensity,
    depth,
    clarity,
    curiosity,
    directness,
    persistence,
    sophistication,
    brevity,
    friendliness,
    avgWords: Math.round(avgWords),
    avgChars: Math.round(avgChars),
    totalMessages: total,
    platformCount: Object.keys(stats.platforms).length,
    platforms: stats.platforms,
    daysSinceFirst: stats.firstMessage
      ? Math.max(1, Math.round((Date.now() - stats.firstMessage) / 86400000))
      : 0,
  };
}

function determineArchetype(scores) {
  if (!scores) return ARCHETYPES[0];

  const s = scores;
  const archetypeScores = {
    "polite-architect":     s.warmth * 0.35 + s.clarity * 0.35 + s.sophistication * 0.3,
    "mood-seeker":          s.friendliness * 0.3 + (100 - s.directness) * 0.3 + s.depth * 0.2 + (100 - s.brevity) * 0.2,
    "straight-shooter":     s.directness * 0.5 + s.brevity * 0.3 + (100 - s.warmth) * 0.2,
    "rabbit-holer":         s.curiosity * 0.5 + s.persistence * 0.25 + (100 - s.brevity) * 0.25,
    "perfectionist":        s.persistence * 0.5 + s.clarity * 0.25 + (100 - s.brevity) * 0.25,
    "sprinter":             s.brevity * 0.4 + s.directness * 0.3 + s.intensity * 0.3,
    "deep-diver":           s.depth * 0.4 + (100 - s.brevity) * 0.3 + s.clarity * 0.3,
    "skeptic":              s.persistence * 0.4 + s.curiosity * 0.3 + (100 - s.warmth) * 0.3,
    "minimalist":           s.brevity * 0.6 + (100 - s.depth) * 0.2 + (100 - s.clarity) * 0.2,
    "thinker":              s.depth * 0.3 + s.clarity * 0.3 + (100 - s.directness) * 0.2 + (100 - s.brevity) * 0.2,
    "strategist":           s.sophistication * 0.4 + s.clarity * 0.3 + s.directness * 0.3,
    "director":             s.directness * 0.5 + (100 - s.warmth) * 0.3 + s.intensity * 0.2,
    "hacker":               s.sophistication * 0.5 + s.depth * 0.25 + s.directness * 0.25,
    "context-king":         s.clarity * 0.4 + s.depth * 0.3 + (100 - s.brevity) * 0.3,
    "tinkerer":             s.persistence * 0.4 + s.curiosity * 0.3 + (100 - s.intensity) * 0.3,
    "chaos-gremlin":        s.intensity * 0.35 + (100 - s.clarity) * 0.35 + s.persistence * 0.3,
    "overthinker":          s.depth * 0.4 + (100 - s.brevity) * 0.35 + s.persistence * 0.25,
    "golden-retriever":     s.warmth * 0.35 + s.friendliness * 0.35 + (100 - s.directness) * 0.3,
    "ghost":                s.brevity * 0.5 + (100 - s.persistence) * 0.3 + (100 - s.warmth) * 0.2,
    "critic":               s.persistence * 0.4 + s.directness * 0.3 + (100 - s.warmth) * 0.3,
    "interrogator":         s.curiosity * 0.6 + s.persistence * 0.2 + (100 - s.brevity) * 0.2,
    "cold-commander":       s.directness * 0.4 + (100 - s.warmth) * 0.35 + (100 - s.friendliness) * 0.25,
  };

  let bestId = "straight-shooter";
  let bestScore = 0;
  for (const [id, score] of Object.entries(archetypeScores)) {
    if (score > bestScore) {
      bestScore = score;
      bestId = id;
    }
  }

  return ARCHETYPES.find((a) => a.id === bestId);
}

function generateInsights(scores) {
  const insights = [];

  if (scores.warmth > 70) {
    insights.push("you're consistently warm with AI — please and thank you are your defaults");
  } else if (scores.warmth < 15) {
    insights.push("no pleasantries detected. you and AI have a strictly professional relationship");
  }

  if (scores.intensity > 50) {
    insights.push("your messages carry weight — caps, exclamation marks, urgency words");
  }

  if (scores.depth > 60) {
    insights.push(`your average prompt is ${scores.avgChars} characters — you give AI a lot to chew on`);
  } else if (scores.avgWords < 12) {
    insights.push(`${scores.avgWords} words per message. you say more with less`);
  }

  if (scores.curiosity > 60) {
    insights.push("question marks everywhere. you use AI to explore, not just execute");
  }

  if (scores.persistence > 50) {
    insights.push("you don't accept the first answer. the AI has to earn your approval");
  }

  if (scores.sophistication > 50) {
    insights.push("role prompts, code blocks, structured formatting — you know the tricks");
  }

  if (scores.platformCount > 1) {
    const names = Object.entries(scores.platforms)
      .sort(([, a], [, b]) => b - a)
      .map(([n]) => n)
      .join(", ");
    insights.push(`you spread across ${scores.platformCount} platforms: ${names}`);
  }

  if (scores.directness > 70 && scores.warmth > 60) {
    insights.push("direct AND polite — the golden zone");
  }

  if (insights.length < 2) {
    insights.push(`${scores.totalMessages} messages over ${scores.daysSinceFirst} day${scores.daysSinceFirst !== 1 ? "s" : ""} — keep chatting for deeper reads`);
  }

  return insights.slice(0, 5);
}

function generateTraits(scores) {
  const groups = [
    {
      score: Math.round((scores.warmth + scores.friendliness) / 2),
      high: "golden retriever energy",
      low: "robot mode",
    },
    {
      score: Math.round((scores.intensity + scores.persistence) / 2),
      high: "won't let it go",
      low: "one and done",
    },
    {
      score: Math.round((scores.depth + (100 - scores.brevity)) / 2),
      high: "writes essays",
      low: "tweets only",
    },
    {
      score: Math.round((scores.clarity + scores.sophistication) / 2),
      high: "has a spreadsheet",
      low: "vibes only",
    },
    {
      score: Math.round((scores.curiosity + (100 - scores.directness)) / 2),
      high: "asks why 5 times",
      low: "just do it",
    },
  ];

  return groups.map((g) => ({
    low: g.low,
    high: g.high,
    score: Math.max(0, Math.min(100, g.score)),
  }));
}
