#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");
const { execSync } = require("child_process");

const DATA_PATH = path.join(os.homedir(), ".aura.json");

const AI_PATTERNS = [
  /^\s*(claude)\b/i,
  /^\s*(gh\s+copilot)\b/i,
  /^\s*(ollama\s+(run|chat))\b/i,
  /^\s*(sgpt)\b/i,
  /^\s*(aichat)\b/i,
  /^\s*(chatgpt)\b/i,
  /^\s*(curl\b.*api\.openai\.com)/i,
  /^\s*(curl\b.*api\.anthropic\.com)/i,
];

const HISTORY_PATHS = [
  path.join(os.homedir(), ".zsh_history"),
  path.join(os.homedir(), ".bash_history"),
];

// ── Signal extraction (mirrors browser extension) ──

function extractSignals(text) {
  const words = text.split(/\s+/).filter(Boolean);
  const wc = words.length;
  return {
    timestamp: Date.now(),
    charCount: text.length,
    wordCount: wc,
    hasPlease: /\bplease\b/i.test(text),
    hasThankYou: /\bthank(s|\s*you)\b/i.test(text),
    hasSorry: /\bsorry\b/i.test(text),
    hasGreeting: /\b(hi|hey|hello|good morning|good evening)\b/i.test(text),
    questionCount: (text.match(/\?/g) || []).length,
    exclamationCount: (text.match(/!/g) || []).length,
    hasRepeatedPunctuation: /[!?]{2,}/.test(text),
    allCaps: wc > 2 && text === text.toUpperCase(),
    hasActAs: /\b(act as|you are a|pretend|role.?play|imagine you)\b/i.test(text),
    hasCodeBlock: /```/.test(text),
    isStructured: /^[\s]*[-*•#\d].*$/m.test(text),
    imperativeStart: /^(give|tell|write|create|make|show|list|explain|generate|build|help|find|do|get|set|add|remove|fix|update|summarize|translate|convert|analyze|compare|design)\b/i.test(text),
    hasPushback: /\b(wrong|incorrect|that's not|try again|not what i|you misunderstood|actually|still wrong|nope|redo)\b/i.test(text),
    hasEmoji: /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(text),
    hasFollowUp: /\b(also|another thing|one more|additionally|by the way|btw|and also|plus)\b/i.test(text),
    hasContext: /\b(because|context|background|for reference|fyi|note that|here's the thing)\b/i.test(text),
    hasHedging: /\b(maybe|i think|is it possible|perhaps|not sure|could you|might be|I guess)\b/i.test(text),
    hasUrgency: /\b(asap|urgent|deadline|quickly|hurry|rush|immediately|right now|time.?sensitive)\b/i.test(text),
  };
}

// ── Stats ──

function createEmptyStats() {
  return {
    totalMessages: 0, totalWords: 0, totalChars: 0,
    pleaseCount: 0, thankYouCount: 0, sorryCount: 0, greetingCount: 0,
    actAsCount: 0, codeBlockCount: 0, structuredCount: 0,
    imperativeCount: 0, pushbackCount: 0, emojiCount: 0, capsCount: 0,
    followUpCount: 0, contextCount: 0, hedgingCount: 0, urgencyCount: 0,
    repeatedPuncCount: 0, questionMarks: 0, exclamationMarks: 0,
    messageLengths: [], conversationDates: [],
    firstMessage: null, lastUpdated: null,
  };
}

function updateStats(stats, signals) {
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
  const lens = stats.messageLengths || [];
  lens.push(signals.wordCount);
  if (lens.length > 200) lens.shift();
  stats.messageLengths = lens;
  stats.lastUpdated = Date.now();
  if (!stats.firstMessage) stats.firstMessage = Date.now();
  const today = new Date().toISOString().slice(0, 10);
  if (!stats.conversationDates) stats.conversationDates = [];
  if (!stats.conversationDates.includes(today)) {
    stats.conversationDates.push(today);
    if (stats.conversationDates.length > 30) stats.conversationDates.shift();
  }
  return stats;
}

function loadStats() {
  try {
    return JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  } catch (_) {
    return createEmptyStats();
  }
}

function saveStats(stats) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(stats, null, 2));
}

// ── Scoring (mirrors analyzer.js) ──

function computeScores(stats) {
  const total = stats.totalMessages;
  if (total === 0) return null;
  const avgWords = stats.totalWords / total;
  const avgChars = stats.totalChars / total;
  const warmth = Math.min(100, Math.round(((stats.pleaseCount + stats.thankYouCount + stats.sorryCount + stats.greetingCount) / total) * 100));
  const intensity = Math.min(100, Math.round(((stats.capsCount / total) * 40 + (stats.repeatedPuncCount / total) * 30 + (stats.exclamationMarks / total) * 15 + (stats.urgencyCount / total) * 15) * 100));
  const depth = Math.min(100, Math.round(Math.min(avgChars / 500, 1) * 100));
  const clarity = Math.min(100, Math.round(((stats.structuredCount / total) * 40 + (stats.contextCount / total) * 30 + Math.min(avgWords / 40, 1) * 30) * 100));
  const curiosity = Math.min(100, Math.round(((stats.questionMarks / total) * 50 + (stats.followUpCount / total) * 30 + (1 - stats.imperativeCount / total) * 20) * 100));
  const directness = Math.min(100, Math.round(((stats.imperativeCount / total) * 50 + (1 - warmth / 100) * 25 + Math.max(0, 1 - avgWords / 40) * 25) * 100));
  const persistence = Math.min(100, Math.round(((stats.pushbackCount / total) * 50 + (stats.followUpCount / total) * 30 + (stats.hedgingCount / total) * 20) * 100));
  const sophistication = Math.min(100, Math.round(((stats.actAsCount / total) * 35 + (stats.codeBlockCount / total) * 30 + (stats.structuredCount / total) * 35) * 100));
  const brevity = Math.min(100, Math.round(Math.max(0, (1 - avgWords / 60)) * 100));
  const friendliness = Math.min(100, Math.round((warmth / 100 * 40 + (stats.emojiCount / total) * 30 + (stats.greetingCount / total) * 30) * 100));
  return { warmth, intensity, depth, clarity, curiosity, directness, persistence, sophistication, brevity, friendliness, avgWords: Math.round(avgWords), avgChars: Math.round(avgChars), totalMessages: total };
}

// ── Archetypes ──

const ARCHETYPES = {
  "polite-architect":  { emoji: "🏗️",  name: "The Polite Architect",    tagline: "detailed specs with a please on top" },
  "mood-seeker":       { emoji: "🌙",  name: "The Mood Seeker",         tagline: "vibes first, specs second" },
  "straight-shooter":  { emoji: "🎯",  name: "The Straight Shooter",    tagline: "no fluff, just the thing" },
  "rabbit-holer":      { emoji: "🕳️",  name: "The Rabbit Holer",        tagline: "one question leads to twelve" },
  "perfectionist":     { emoji: "💎",  name: "The Perfectionist",       tagline: "not quite right — try again" },
  "sprinter":          { emoji: "⚡",  name: "The Sprinter",            tagline: "fast in, fast out" },
  "deep-diver":        { emoji: "🌊",  name: "The Deep Diver",          tagline: "long prompts, longer sessions" },
  "skeptic":           { emoji: "🤨",  name: "The Skeptic",             tagline: "prove it" },
  "minimalist":        { emoji: "✨",  name: "The Minimalist",          tagline: "less is more" },
  "thinker":           { emoji: "🧠",  name: "The Thinker",             tagline: "let me think about this..." },
  "strategist":        { emoji: "♟️",  name: "The Strategist",          tagline: "playing the long game" },
  "director":          { emoji: "🎬",  name: "The Director",            tagline: "imperatives only" },
  "hacker":            { emoji: "💻",  name: "The Hacker",              tagline: "code blocks and structured chaos" },
  "context-king":      { emoji: "📋",  name: "The Context King",        tagline: "let me give you some background..." },
  "tinkerer":          { emoji: "🔧",  name: "The Tinkerer",            tagline: "what if we tweak this..." },
  "chaos-gremlin":     { emoji: "👹",  name: "The Chaos Gremlin",       tagline: "wildcard energy" },
  "overthinker":       { emoji: "🌀",  name: "The Overthinker",         tagline: "this prompt has layers" },
  "golden-retriever":  { emoji: "🐶",  name: "The Golden Retriever",    tagline: "AI is thriving on this energy" },
  "ghost":             { emoji: "👻",  name: "The Ghost",               tagline: "appeared. extracted. vanished." },
  "critic":            { emoji: "📝",  name: "The Critic",              tagline: "interesting, but wrong" },
  "interrogator":      { emoji: "🔦",  name: "The Interrogator",        tagline: "follow-up questions only" },
  "cold-commander":    { emoji: "🧊",  name: "The Cold Commander",      tagline: "no warmth, maximum efficiency" },
};

function pickArchetype(s) {
  const scores = {
    "polite-architect": s.warmth * 0.35 + s.clarity * 0.35 + s.sophistication * 0.3,
    "mood-seeker": s.friendliness * 0.3 + (100 - s.directness) * 0.3 + s.depth * 0.2 + (100 - s.brevity) * 0.2,
    "straight-shooter": s.directness * 0.5 + s.brevity * 0.3 + (100 - s.warmth) * 0.2,
    "rabbit-holer": s.curiosity * 0.5 + s.persistence * 0.25 + (100 - s.brevity) * 0.25,
    "perfectionist": s.persistence * 0.5 + s.clarity * 0.25 + (100 - s.brevity) * 0.25,
    "sprinter": s.brevity * 0.4 + s.directness * 0.3 + s.intensity * 0.3,
    "deep-diver": s.depth * 0.4 + (100 - s.brevity) * 0.3 + s.clarity * 0.3,
    "skeptic": s.persistence * 0.4 + s.curiosity * 0.3 + (100 - s.warmth) * 0.3,
    "minimalist": s.brevity * 0.6 + (100 - s.depth) * 0.2 + (100 - s.clarity) * 0.2,
    "thinker": s.depth * 0.3 + s.clarity * 0.3 + (100 - s.directness) * 0.2 + (100 - s.brevity) * 0.2,
    "strategist": s.sophistication * 0.4 + s.clarity * 0.3 + s.directness * 0.3,
    "director": s.directness * 0.5 + (100 - s.warmth) * 0.3 + s.intensity * 0.2,
    "hacker": s.sophistication * 0.5 + s.depth * 0.25 + s.directness * 0.25,
    "context-king": s.clarity * 0.4 + s.depth * 0.3 + (100 - s.brevity) * 0.3,
    "tinkerer": s.persistence * 0.4 + s.curiosity * 0.3 + (100 - s.intensity) * 0.3,
    "chaos-gremlin": s.intensity * 0.35 + (100 - s.clarity) * 0.35 + s.persistence * 0.3,
    "overthinker": s.depth * 0.4 + (100 - s.brevity) * 0.35 + s.persistence * 0.25,
    "golden-retriever": s.warmth * 0.35 + s.friendliness * 0.35 + (100 - s.directness) * 0.3,
    "ghost": s.brevity * 0.5 + (100 - s.persistence) * 0.3 + (100 - s.warmth) * 0.2,
    "critic": s.persistence * 0.4 + s.directness * 0.3 + (100 - s.warmth) * 0.3,
    "interrogator": s.curiosity * 0.6 + s.persistence * 0.2 + (100 - s.brevity) * 0.2,
    "cold-commander": s.directness * 0.4 + (100 - s.warmth) * 0.35 + (100 - s.friendliness) * 0.25,
  };
  let bestId = "straight-shooter";
  let bestScore = 0;
  for (const [id, score] of Object.entries(scores)) {
    if (score > bestScore) { bestScore = score; bestId = id; }
  }
  return ARCHETYPES[bestId];
}

// ── Traits ──

function generateTraits(scores) {
  const groups = [
    { score: Math.round((scores.warmth + scores.friendliness) / 2), high: "golden retriever energy", low: "robot mode" },
    { score: Math.round((scores.intensity + scores.persistence) / 2), high: "won't let it go", low: "one and done" },
    { score: Math.round((scores.depth + (100 - scores.brevity)) / 2), high: "writes essays", low: "tweets only" },
    { score: Math.round((scores.clarity + scores.sophistication) / 2), high: "has a spreadsheet", low: "vibes only" },
    { score: Math.round((scores.curiosity + (100 - scores.directness)) / 2), high: "asks why 5 times", low: "just do it" },
  ];
  return groups.map((g) => {
    const v = Math.max(0, Math.min(100, g.score));
    return { low: g.low, high: g.high, score: v };
  });
}

// ── Daily triggers ──

const DAILY_LINES = {
  "rapid-fire": ["you're speedrunning this", "prompt enter prompt enter"],
  "iteration-loop": ["version 9... we're locked in", "this prompt has seen things"],
  "overthinker": ["this prompt has layers. and sublayers.", "thorough is one word for it"],
  "under-spec": ["minimalist era", "few words. big energy."],
  "golden-retriever": ["AI is thriving on this energy", "please and thank you — the AI remembers this"],
  "flow": ["this is clean. you're in a groove.", "smooth session. chef's kiss."],
};

function checkTriggers(session) {
  const count = session.count;
  const chars = session.chars;
  const timestamps = session.timestamps;

  if (timestamps.length >= 10) {
    const last10 = timestamps.slice(-10);
    if (last10[last10.length - 1] - last10[0] <= 5 * 60 * 1000) return "rapid-fire";
  }
  if (count >= 12) return "iteration-loop";
  if (count >= 5 && chars.slice(-4).every((c) => c > 400)) return "overthinker";
  if (chars.length >= 3 && chars.slice(-3).every((c) => c < 30)) return "under-spec";
  if (count >= 5 && session.warmthHits / count > 0.7) return "golden-retriever";
  if (count >= 3 && count <= 8) {
    const avg = chars.reduce((a, b) => a + b, 0) / chars.length;
    if (avg > 50 && avg < 500 && session.pushbackHits < 1) return "flow";
  }
  return null;
}

// ── Display ──

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const MAGENTA = "\x1b[35m";
const WHITE = "\x1b[37m";
const GREEN = "\x1b[32m";

function printAura(stats) {
  const scores = computeScores(stats);
  if (!scores) {
    console.log(`\n${DIM}  ✦ no data yet. keep chatting with AI.${RESET}\n`);
    return;
  }

  const arch = pickArchetype(scores);
  const traits = generateTraits(scores);

  console.log();
  console.log(`  ${BOLD}${YELLOW}✦ aura${RESET}`);
  console.log();
  console.log(`  ${BOLD}${arch.emoji}  ${arch.name}${RESET}`);
  console.log(`  ${MAGENTA}${arch.tagline}${RESET}`);
  console.log();
  console.log(`  ${DIM}your signals${RESET}`);

  for (const t of traits) {
    const pos = Math.round(t.score / 5);
    const bar = "─".repeat(pos) + "●" + "─".repeat(20 - pos);
    const leftColor = t.score < 50 ? WHITE : DIM;
    const rightColor = t.score >= 50 ? WHITE : DIM;
    const left = t.low.padStart(22);
    const right = t.high;
    console.log(`  ${leftColor}${left}${RESET} ${CYAN}${bar}${RESET} ${rightColor}${right}${RESET}`);
  }

  console.log();
  console.log(`  ${DIM}${stats.totalMessages} prompts analyzed${RESET}`);
  console.log();
}

function notify(message) {
  try {
    if (process.platform === "darwin") {
      execSync(`osascript -e 'display notification "${message}" with title "✦ aura"'`);
    } else if (process.platform === "linux") {
      execSync(`notify-send "✦ aura" "${message}"`);
    }
  } catch (_) {}
}

// ── History parsing ──

function findHistoryFile() {
  for (const p of HISTORY_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function isAICommand(line) {
  const cleaned = line.replace(/^:\s*\d+:\d+;/, "").trim();
  return AI_PATTERNS.some((p) => p.test(cleaned)) ? cleaned : null;
}

function extractPromptFromCommand(cmd) {
  const quoted = cmd.match(/["']([^"']{3,})["']/);
  if (quoted) return quoted[1];
  const parts = cmd.split(/\s+/);
  if (parts.length > 2) return parts.slice(1).join(" ");
  return cmd;
}

// ── Watch mode ──

function watchHistory(historyPath) {
  let lastSize = 0;
  try {
    lastSize = fs.statSync(historyPath).size;
  } catch (_) {}

  const session = { count: 0, chars: [], timestamps: [], warmthHits: 0, pushbackHits: 0, triggered: false };

  console.log(`  ${DIM}watching ${path.basename(historyPath)} for AI prompts...${RESET}`);
  console.log(`  ${DIM}ctrl+c to stop${RESET}\n`);

  const watcher = setInterval(() => {
    let currentSize;
    try {
      currentSize = fs.statSync(historyPath).size;
    } catch (_) {
      return;
    }
    if (currentSize <= lastSize) return;

    const stream = fs.createReadStream(historyPath, { start: lastSize, encoding: "utf8" });
    let newData = "";
    stream.on("data", (chunk) => { newData += chunk; });
    stream.on("end", () => {
      lastSize = currentSize;
      const lines = newData.split("\n");
      for (const line of lines) {
        const cmd = isAICommand(line);
        if (!cmd) continue;

        const prompt = extractPromptFromCommand(cmd);
        const signals = extractSignals(prompt);

        let stats = loadStats();
        stats = updateStats(stats, signals);
        saveStats(stats);

        session.count++;
        session.chars.push(signals.charCount);
        session.timestamps.push(Date.now());
        if (signals.hasPlease || signals.hasThankYou || signals.hasSorry) session.warmthHits++;
        if (signals.hasPushback) session.pushbackHits++;

        console.log(`  ${GREEN}✦${RESET} ${DIM}prompt captured${RESET} (${signals.wordCount} words)`);

        if (!session.triggered) {
          const trigger = checkTriggers(session);
          if (trigger) {
            session.triggered = true;
            const lines = DAILY_LINES[trigger];
            if (lines) {
              const msg = lines[Math.floor(Math.random() * lines.length)];
              console.log(`\n  ${YELLOW}${BOLD}✦ ${msg}${RESET}\n`);
              notify(msg);
            }
          }
        }
      }
    });
  }, 2000);

  process.on("SIGINT", () => {
    clearInterval(watcher);
    console.log(`\n`);
    const stats = loadStats();
    printAura(stats);
    process.exit(0);
  });
}

// ── Scan mode (one-time) ──

function scanHistory(historyPath) {
  const content = fs.readFileSync(historyPath, "utf8");
  const lines = content.split("\n");
  let stats = loadStats();
  let found = 0;

  for (const line of lines) {
    const cmd = isAICommand(line);
    if (!cmd) continue;
    const prompt = extractPromptFromCommand(cmd);
    const signals = extractSignals(prompt);
    stats = updateStats(stats, signals);
    found++;
  }

  if (found > 0) {
    saveStats(stats);
  }
  return stats;
}

// ── Main ──

const args = process.argv.slice(2);
const command = args[0] || "";

if (command === "reset") {
  try { fs.unlinkSync(DATA_PATH); } catch (_) {}
  console.log(`\n  ${DIM}✦ aura reset${RESET}\n`);
  process.exit(0);
}

const historyPath = findHistoryFile();
if (!historyPath) {
  console.log(`\n  ${DIM}no shell history found${RESET}\n`);
  process.exit(1);
}

if (command === "watch") {
  console.log();
  console.log(`  ${BOLD}${YELLOW}✦ aura${RESET} ${DIM}— watching${RESET}`);
  console.log();
  watchHistory(historyPath);
} else {
  const stats = scanHistory(historyPath);
  printAura(stats);
}
