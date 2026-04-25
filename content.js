(() => {
  const PLATFORMS = {
    "chatgpt.com":          "ChatGPT",
    "chat.openai.com":      "ChatGPT",
    "claude.ai":            "Claude",
    "gemini.google.com":    "Gemini",
    "copilot.microsoft.com": "Copilot",
  };

  const platformName = PLATFORMS[window.location.hostname];
  if (!platformName) return;

  let lastText = "";
  let lastTime = 0;
  let stash = "";

  function readInput(el) {
    if (!el) return "";
    return (el.value || el.innerText || "").trim();
  }

  function isInputElement(el) {
    if (!el) return false;
    const tag = el.tagName;
    if (tag === "TEXTAREA" || tag === "INPUT") return true;
    if (el.getAttribute("contenteditable") === "true") return true;
    if (el.closest && el.closest("[contenteditable='true']")) return true;
    return false;
  }

  function findNearestInput(el) {
    if (!el) return null;
    if (isInputElement(el)) return el;
    let parent = el.parentElement;
    for (let i = 0; i < 6 && parent; i++) {
      if (parent.getAttribute("contenteditable") === "true") return parent;
      if (parent.tagName === "TEXTAREA") return parent;
      parent = parent.parentElement;
    }
    return document.querySelector(
      "#prompt-textarea, [contenteditable='true'][role='textbox'], " +
      "div[contenteditable='true'].ProseMirror, .ql-editor, " +
      "textarea, div[contenteditable='true']"
    );
  }

  function getTextFromContext() {
    const active = document.activeElement;
    const input = findNearestInput(active);
    return readInput(input);
  }

  function extractSignals(text) {
    const words = text.split(/\s+/);
    const wc = words.length;
    return {
      timestamp: Date.now(),
      platform: platformName,
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

  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function createEmptyStats() {
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

    return stats;
  }

  function send(text) {
    if (!text || text.length < 2) return;
    const now = Date.now();
    if (text === lastText && now - lastTime < 3000) return;
    lastText = text;
    lastTime = now;

    const signals = extractSignals(text);

    // Write directly to chrome.storage.local (no service worker needed)
    chrome.storage.local.get(["auraStats"], (result) => {
      const stats = result.auraStats || createEmptyStats();
      const updated = updateStats(stats, signals);
      chrome.storage.local.set({ auraStats: updated });
    });

    // Still notify background for daily/weekly notifications
    try {
      chrome.runtime.sendMessage(
        { type: "PROMPT_CAPTURED", signals: signals },
        () => { void chrome.runtime.lastError; }
      );
    } catch (_) {}
  }

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" || e.shiftKey) return;
    const text = getTextFromContext();
    if (text) {
      stash = text;
      setTimeout(() => send(stash), 0);
    }
  }, true);

  function isSendButton(el) {
    if (!el || el.tagName !== "BUTTON") return false;
    const testId = el.getAttribute("data-testid") || "";
    const label = el.getAttribute("aria-label") || "";
    return /send/i.test(testId) || /send/i.test(label);
  }

  function findSendButton(el) {
    for (let i = 0; i < 4 && el; i++) {
      if (isSendButton(el)) return el;
      el = el.parentElement;
    }
    return null;
  }

  document.addEventListener("mousedown", (e) => {
    if (!findSendButton(e.target)) return;
    const text = getTextFromContext();
    if (text) stash = text;
  }, true);

  document.addEventListener("click", (e) => {
    if (!findSendButton(e.target)) return;
    if (stash) {
      const captured = stash;
      stash = "";
      setTimeout(() => send(captured), 0);
    }
  }, true);
})();
