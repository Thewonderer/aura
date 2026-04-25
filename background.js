// ── Daily trigger notification lines ──

const DAILY_LINES = {
  "rapid-fire": [
    "you're speedrunning this",
    "prompt enter prompt enter",
    "that was... a lot of prompts in not a lot of time",
    "someone's on a roll today",
  ],
  "iteration-loop": [
    "version 9... we're locked in",
    "this prompt has seen things",
    "you and this thread are going through something",
    "the iteration is strong with this one",
  ],
  "short-fuse": [
    "this started calm... and got spicy",
    "you and this prompt are going through something",
    "the vibe shifted mid-conversation",
    "that escalated at a healthy pace",
  ],
  "caps-warrior": [
    "OKAY WE GET IT",
    "that one had volume",
    "caps lock was doing overtime today",
    "loud and clear. literally.",
  ],
  "overthinker": [
    "this prompt has layers. and sublayers.",
    "you've been writing novels to an AI today",
    "that prompt could have been a dissertation",
    "thorough is one word for it",
  ],
  "under-spec": [
    "minimalist era",
    "keeping it mysterious today",
    "you're really trusting the AI to read your mind",
    "few words. big energy.",
  ],
  "exploration": [
    "you're in 'what happens if...' mode today",
    "curiosity is running the show",
    "you've been asking a lot of questions. we love that.",
    "the rabbit hole has a rabbit hole",
  ],
  "flow": [
    "this is clean. you're in a groove.",
    "you nailed that one",
    "smooth session. chef's kiss.",
    "focused energy. nice.",
  ],
  "rephrase-loop": [
    "same question, different outfit",
    "you've asked this a few ways now",
    "the prompt keeps changing but the vibe is the same",
    "iteration or indecision? either way, respect.",
  ],
  "golden-retriever": [
    "AI is thriving on this energy",
    "you're so polite the AI probably feels appreciated",
    "please and thank you — the AI remembers this",
  ],
  "ghost": [
    "you appeared. you extracted. you vanished.",
    "one and done. efficient.",
    "blink and you'd miss that session",
  ],
  "chaos": [
    "somewhere today, you confused an AI",
    "that session had range",
    "chaotic neutral energy detected",
  ],
};

// ── Weekly archetype notification data ──

const ARCHETYPE_DATA = {
  "polite-architect":  { emoji: "🏗️", line: "Polite Architect — structured, respectful, effective" },
  "mood-seeker":       { emoji: "🌙", line: "Mood Seeker — you came to AI to think out loud" },
  "straight-shooter":  { emoji: "🎯", line: "Straight Shooter — no fluff, just the thing" },
  "rabbit-holer":      { emoji: "🕳️", line: "Rabbit Holer — one question led to twelve" },
  "perfectionist":     { emoji: "💎", line: "Perfectionist — the AI's first draft was never enough" },
  "sprinter":          { emoji: "⚡", line: "Sprinter — fast in, fast out, things got done" },
  "deep-diver":        { emoji: "🌊", line: "Deep Diver — long prompts, longer sessions" },
  "skeptic":           { emoji: "🤨", line: "Skeptic — you didn't take the first answer" },
  "minimalist":        { emoji: "✨", line: "Minimalist — few words, big results" },
  "thinker":           { emoji: "🧠", line: "Thinker — you thought before you prompted" },
  "strategist":        { emoji: "♟️", line: "Strategist — structured, deliberate, engineered" },
  "director":          { emoji: "🎬", line: "Director — commands, not requests" },
  "hacker":            { emoji: "💻", line: "Hacker — code blocks and structured chaos" },
  "context-king":      { emoji: "📋", line: "Context King — the AI never had to guess" },
  "tinkerer":          { emoji: "🔧", line: "Tinkerer — small tweaks, big differences" },
  "chaos-gremlin":     { emoji: "👹", line: "Chaos Gremlin — you kept AI on its toes" },
  "overthinker":       { emoji: "🌀", line: "Overthinker — your prompts had layers" },
  "golden-retriever":  { emoji: "🐶", line: "Golden Retriever — AI thrived on your energy" },
  "ghost":             { emoji: "👻", line: "Ghost — appeared, extracted, vanished" },
  "critic":            { emoji: "📝", line: "Critic — quality control was your default" },
  "interrogator":      { emoji: "🔦", line: "Interrogator — questions until nothing was left" },
  "cold-commander":    { emoji: "🧊", line: "Cold Commander — zero pleasantries, pure function" },
};

// ── Helpers ──

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function weekKey() {
  const d = new Date();
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${week}`;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Daily session (resets each day) ──

function createEmptySession() {
  return {
    date: todayKey(),
    promptCount: 0,
    promptTimestamps: [],
    charCounts: [],
    warmthHits: 0,
    pushbackHits: 0,
    capsHits: 0,
    repeatedPuncHits: 0,
    questionHits: 0,
    structuredHits: 0,
    followUpHits: 0,
    contextHits: 0,
    hedgingHits: 0,
    urgencyHits: 0,
    emojiHits: 0,
    imperativeHits: 0,
    actAsHits: 0,
    codeBlockHits: 0,
    platforms: {},
    notifiedToday: false,
    triggerFired: null,
  };
}

async function getSession() {
  const result = await chrome.storage.local.get(["auraSession"]);
  const session = result.auraSession;
  if (session && session.date === todayKey()) return session;
  return createEmptySession();
}

async function saveSession(session) {
  await chrome.storage.local.set({ auraSession: session });
}

function updateSession(session, signals) {
  session.promptCount++;
  session.promptTimestamps.push(signals.timestamp);
  session.charCounts.push(signals.charCount);

  if (session.promptTimestamps.length > 50) {
    session.promptTimestamps = session.promptTimestamps.slice(-50);
  }
  if (session.charCounts.length > 50) {
    session.charCounts = session.charCounts.slice(-50);
  }

  if (signals.hasPlease || signals.hasThankYou || signals.hasSorry || signals.hasGreeting) {
    session.warmthHits++;
  }
  if (signals.hasPushback) session.pushbackHits++;
  if (signals.allCaps) session.capsHits++;
  if (signals.hasRepeatedPunctuation) session.repeatedPuncHits++;
  if (signals.questionCount > 0) session.questionHits++;
  if (signals.isStructured) session.structuredHits++;
  if (signals.hasFollowUp) session.followUpHits++;
  if (signals.hasContext) session.contextHits++;
  if (signals.hasHedging) session.hedgingHits++;
  if (signals.hasUrgency) session.urgencyHits++;
  if (signals.hasEmoji) session.emojiHits++;
  if (signals.imperativeStart) session.imperativeHits++;
  if (signals.hasActAs) session.actAsHits++;
  if (signals.hasCodeBlock) session.codeBlockHits++;

  if (!session.platforms[signals.platform]) {
    session.platforms[signals.platform] = 0;
  }
  session.platforms[signals.platform]++;

  return session;
}

// ── Daily triggers ──

function checkDailyTriggers(session) {
  if (session.notifiedToday) return null;

  const timestamps = session.promptTimestamps;
  const count = session.promptCount;
  const chars = session.charCounts;

  if (timestamps.length >= 10) {
    const last10 = timestamps.slice(-10);
    const span = last10[last10.length - 1] - last10[0];
    if (span <= 5 * 60 * 1000) return "rapid-fire";
  }

  if (count >= 9 && session.followUpHits >= 3) return "iteration-loop";
  if (count >= 12) return "iteration-loop";

  if (count >= 5) {
    const warmthRate = session.warmthHits / count;
    const pushbackRate = session.pushbackHits / count;
    if (pushbackRate > 0.4 && warmthRate < 0.2) return "short-fuse";
  }

  if (session.capsHits >= 2 || session.repeatedPuncHits >= 3) return "caps-warrior";

  if (count >= 4) {
    const recentChars = chars.slice(-4);
    if (recentChars.every((c) => c > 400) && count >= 5) return "overthinker";
  }

  if (chars.length >= 3) {
    const last4 = chars.slice(-Math.min(4, chars.length));
    if (last4.every((c) => c < 30)) return "under-spec";
  }

  if (count >= 5 && session.pushbackHits >= 3 && session.followUpHits >= 2) {
    return "rephrase-loop";
  }

  if (count >= 5) {
    const qRate = session.questionHits / count;
    if (qRate > 0.6 && session.followUpHits >= 2) return "exploration";
  }

  if (count >= 5) {
    const warmthRate = session.warmthHits / count;
    if (warmthRate > 0.7 && session.emojiHits >= 2) return "golden-retriever";
  }

  if (count >= 1 && count <= 2 && timestamps.length >= 1) {
    const elapsed = Date.now() - timestamps[timestamps.length - 1];
    if (elapsed > 10 * 60 * 1000) return "ghost";
  }

  if (count >= 6) {
    const hasVariety =
      session.capsHits >= 1 &&
      session.questionHits >= 2 &&
      session.pushbackHits >= 1;
    const charSpread = Math.max(...chars) - Math.min(...chars);
    if (hasVariety && charSpread > 300) return "chaos";
  }

  if (count >= 3 && count <= 6) {
    const warmthRate = session.warmthHits / count;
    const pushbackRate = session.pushbackHits / count;
    const avgChars = chars.reduce((a, b) => a + b, 0) / chars.length;
    if (pushbackRate < 0.1 && warmthRate > 0.2 && avgChars > 50 && avgChars < 500) {
      const sessionMinutes = (timestamps[timestamps.length - 1] - timestamps[0]) / 60000;
      if (sessionMinutes > 3 && sessionMinutes < 30) return "flow";
    }
  }

  return null;
}

function sendDailyNotification(triggerId) {
  const lines = DAILY_LINES[triggerId];
  if (!lines) return;

  chrome.notifications.create(`aura-daily-${Date.now()}`, {
    type: "basic",
    iconUrl: "icons/icon128.png",
    title: "",
    message: pickRandom(lines),
    priority: 0,
  });
}

// ── Weekly archetype notification ──

function computeScoresForNotification(stats) {
  const total = stats.totalMessages;
  const avgWords = stats.totalWords / total;
  const avgChars = stats.totalChars / total;

  const warmth = Math.min(100, Math.round(
    ((stats.pleaseCount + stats.thankYouCount + stats.sorryCount + stats.greetingCount) / total) * 100
  ));
  const intensity = Math.min(100, Math.round(
    ((stats.capsCount / total) * 40 + (stats.repeatedPuncCount / total) * 30 +
     (stats.exclamationMarks / total) * 15 + (stats.urgencyCount / total) * 15) * 100
  ));
  const depth = Math.min(100, Math.round(Math.min(avgChars / 500, 1) * 100));
  const clarity = Math.min(100, Math.round(
    ((stats.structuredCount / total) * 40 + (stats.contextCount / total) * 30 +
     Math.min(avgWords / 40, 1) * 30) * 100
  ));
  const curiosity = Math.min(100, Math.round(
    ((stats.questionMarks / total) * 50 + (stats.followUpCount / total) * 30 +
     (1 - stats.imperativeCount / total) * 20) * 100
  ));
  const directness = Math.min(100, Math.round(
    ((stats.imperativeCount / total) * 50 + (1 - warmth / 100) * 25 +
     Math.max(0, 1 - avgWords / 40) * 25) * 100
  ));
  const persistence = Math.min(100, Math.round(
    ((stats.pushbackCount / total) * 50 + (stats.followUpCount / total) * 30 +
     (stats.hedgingCount / total) * 20) * 100
  ));
  const sophistication = Math.min(100, Math.round(
    ((stats.actAsCount / total) * 35 + (stats.codeBlockCount / total) * 30 +
     (stats.structuredCount / total) * 35) * 100
  ));
  const brevity = Math.min(100, Math.round(Math.max(0, (1 - avgWords / 60)) * 100));
  const friendliness = Math.min(100, Math.round(
    (warmth / 100 * 40 + (stats.emojiCount / total) * 30 +
     (stats.greetingCount / total) * 30) * 100
  ));

  return { warmth, intensity, depth, clarity, curiosity, directness, persistence, sophistication, brevity, friendliness };
}

function pickArchetype(s) {
  const scores = {
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
  for (const [id, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestId = id;
    }
  }
  return bestId;
}

async function checkWeeklyNotification() {
  const result = await chrome.storage.local.get(["auraStats", "auraLastWeeklyNotif"]);
  const stats = result.auraStats;
  const lastNotifWeek = result.auraLastWeeklyNotif;

  if (!stats || stats.totalMessages < 5) return;

  const currentWeek = weekKey();
  if (lastNotifWeek === currentWeek) return;

  const convDates = stats.conversationDates || [];
  if (convDates.length < 2) return;

  const scores = computeScoresForNotification(stats);
  const archetypeId = pickArchetype(scores);
  const data = ARCHETYPE_DATA[archetypeId];
  if (!data) return;

  chrome.notifications.create(`aura-weekly-${Date.now()}`, {
    type: "basic",
    iconUrl: "icons/icon128.png",
    title: `this week's aura: ${data.emoji}`,
    message: data.line,
    priority: 0,
  });

  await chrome.storage.local.set({ auraLastWeeklyNotif: currentWeek });
}

// ── All-time stats ──

async function updateAllTimeStats(signals) {
  const result = await chrome.storage.local.get(["auraStats"]);
  const stats = result.auraStats || createEmptyAllTimeStats();

  stats.totalMessages++;
  stats.totalChars += signals.charCount;
  stats.totalWords += signals.wordCount;

  if (signals.hasPlease) stats.pleaseCount++;
  if (signals.hasThankYou) stats.thankYouCount++;
  if (signals.hasSorry) stats.sorryCount++;
  if (signals.hasGreeting) stats.greetingCount++;
  if (signals.hasActAs) stats.actAsCount++;
  if (signals.hasCodeBlock) stats.codeBlockCount++;
  if (signals.isStructured) stats.structuredCount++;
  if (signals.imperativeStart) stats.imperativeCount++;
  if (signals.hasPushback) stats.pushbackCount++;
  if (signals.hasEmoji) stats.emojiCount++;
  if (signals.allCaps) stats.capsCount++;
  if (signals.hasFollowUp) stats.followUpCount++;
  if (signals.hasContext) stats.contextCount++;
  if (signals.hasHedging) stats.hedgingCount++;
  if (signals.hasUrgency) stats.urgencyCount++;
  if (signals.hasRepeatedPunctuation) stats.repeatedPuncCount++;
  stats.questionMarks += signals.questionCount;
  stats.exclamationMarks += signals.exclamationCount;

  if (!stats.platforms[signals.platform]) {
    stats.platforms[signals.platform] = 0;
  }
  stats.platforms[signals.platform]++;

  const lens = stats.messageLengths || [];
  lens.push(signals.wordCount);
  if (lens.length > 200) lens.shift();
  stats.messageLengths = lens;

  stats.lastUpdated = Date.now();
  if (!stats.firstMessage) stats.firstMessage = Date.now();

  if (!stats.conversationDates) stats.conversationDates = [];
  const today = todayKey();
  if (!stats.conversationDates.includes(today)) {
    stats.conversationDates.push(today);
    if (stats.conversationDates.length > 30) stats.conversationDates.shift();
  }

  await chrome.storage.local.set({ auraStats: stats });
}

function createEmptyAllTimeStats() {
  return {
    totalMessages: 0,
    totalWords: 0,
    totalChars: 0,
    pleaseCount: 0,
    thankYouCount: 0,
    sorryCount: 0,
    greetingCount: 0,
    actAsCount: 0,
    codeBlockCount: 0,
    structuredCount: 0,
    imperativeCount: 0,
    pushbackCount: 0,
    emojiCount: 0,
    capsCount: 0,
    followUpCount: 0,
    contextCount: 0,
    hedgingCount: 0,
    urgencyCount: 0,
    repeatedPuncCount: 0,
    questionMarks: 0,
    exclamationMarks: 0,
    platforms: {},
    messageLengths: [],
    conversationDates: [],
    firstMessage: null,
    lastUpdated: null,
  };
}

// ── Message handler ──

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type !== "PROMPT_CAPTURED") return false;

  (async () => {
    let session = await getSession();

    if (session.date !== todayKey()) {
      session = createEmptySession();
    }

    session = updateSession(session, msg.signals);

    // daily trigger: max one per day
    const trigger = checkDailyTriggers(session);
    if (trigger) {
      sendDailyNotification(trigger);
      session.notifiedToday = true;
      session.triggerFired = trigger;
    }

    await saveSession(session);
    await updateAllTimeStats(msg.signals);

    // weekly archetype: max one per week
    await checkWeeklyNotification();
    sendResponse({ done: true });
  })();

  // keep service worker alive until async work completes
  return true;
});

// ── Alarms ──

// ghost trigger needs silence detection
chrome.alarms.create("ghost-check", { periodInMinutes: 10 });

// weekly aura check in case user doesn't chat that day
chrome.alarms.create("weekly-aura-check", { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "ghost-check") {
    const session = await getSession();
    if (session.notifiedToday || session.promptCount === 0) return;

    const trigger = checkDailyTriggers(session);
    if (trigger) {
      sendDailyNotification(trigger);
      session.notifiedToday = true;
      session.triggerFired = trigger;
      await saveSession(session);
    }
  }

  if (alarm.name === "weekly-aura-check") {
    await checkWeeklyNotification();
  }
});
