document.addEventListener("DOMContentLoaded", () => {
  const loadingEl = document.getElementById("loading");
  const noDataEl = document.getElementById("no-data");
  const waitingEl = document.getElementById("waiting");
  const resultsEl = document.getElementById("results");

  function showState(el) {
    loadingEl.classList.add("hidden");
    noDataEl.classList.add("hidden");
    waitingEl.classList.add("hidden");
    resultsEl.classList.add("hidden");
    el.classList.remove("hidden");
  }

  chrome.storage.local.get(["auraStats"], (result) => {
    const stats = result.auraStats;

    if (!stats || stats.totalMessages === 0) {
      showState(noDataEl);
      return;
    }

    if (stats.totalMessages < 2) {
      showState(waitingEl);
      return;
    }

    const scores = computeAuraScores(stats);
    const archetype = determineArchetype(scores);
    const insights = generateInsights(scores);
    const traits = generateTraits(scores);

    renderArchetype(archetype);
    renderTraits(traits);
    renderInsights(insights);
    setupActions(archetype, scores, traits);

    showState(resultsEl);
  });

  function renderArchetype(archetype) {
    document.getElementById("archetype-emoji").textContent = archetype.emoji;
    document.getElementById("archetype-name").textContent = archetype.name;
    document.getElementById("archetype-tagline").textContent = archetype.tagline;
    document.getElementById("archetype-description").textContent = archetype.description;
    document.getElementById("archetype-card").style.borderColor = archetype.color;
    document.getElementById("archetype-card").style.background =
      `linear-gradient(135deg, ${archetype.color}15, ${archetype.color}05)`;
  }

  function renderTraits(traits) {
    const container = document.getElementById("traits-list");
    container.innerHTML = traits
      .map(
        (t) =>
          `<div class="trait">
        <span class="trait-label-low ${t.score < 50 ? 'active' : ''}">${t.low}</span>
        <div class="trait-bar-bg">
          <div class="trait-dot" style="left:${t.score}%"></div>
        </div>
        <span class="trait-label-high ${t.score >= 50 ? 'active' : ''}">${t.high}</span>
      </div>`
      )
      .join("");
  }

  function renderInsights(insights) {
    const list = document.getElementById("insights-list");
    list.innerHTML = insights.map((i) => `<li>${i}</li>`).join("");
  }

  function setupActions(archetype, scores, traits) {
    document.getElementById("share-btn").addEventListener("click", () => {
      const text = [
        `✦ my ai aura: ${archetype.emoji} ${archetype.name}`,
        `"${archetype.tagline}"`,
        "",
        `traits: ${traits.map((t) => t.score >= 50 ? t.high : t.low).join(", ")}`,
        "",
        "✦ aura — what's yours?",
      ].join("\n");

      navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById("share-btn");
        btn.textContent = "copied ✦";
        setTimeout(() => {
          btn.textContent = "share aura";
        }, 2000);
      });
    });

    document.getElementById("reset-btn").addEventListener("click", () => {
      if (confirm("reset your aura?")) {
        chrome.storage.local.remove(
          ["auraStats", "auraSession", "auraWeekly"],
          () => {
            showState(noDataEl);
          }
        );
      }
    });
  }
});
