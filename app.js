let episodes = [];

const progressKey = "vibe-coding-18-progress";
const episodeGrid = document.querySelector("#episode-grid");
const emptyState = document.querySelector("#empty-state");
const searchInput = document.querySelector("#course-search");
const filterButtons = [...document.querySelectorAll("[data-filter]")];
const releaseStat = document.querySelector("#release-stat");
const progressStat = document.querySelector("#progress-stat");

let activeFilter = "all";
let searchTerm = "";
let completed = loadProgress();

function isReady(episode) {
  return episode.state === "published" || episode.state === "prepared";
}

function loadProgress() {
  try {
    const value = JSON.parse(localStorage.getItem(progressKey) || "[]");
    return new Set(Array.isArray(value) ? value : []);
  } catch {
    return new Set();
  }
}

function saveProgress() {
  localStorage.setItem(progressKey, JSON.stringify([...completed]));
}

function isVisible(episode) {
  const matchesFilter =
    activeFilter === "all"
    || (activeFilter === "published" && isReady(episode))
    || (activeFilter === "upcoming" && !isReady(episode));
  const searchable = `EP${episode.number} ${episode.title} ${episode.description}`
    .toLocaleLowerCase("zh-Hant");
  return matchesFilter && searchable.includes(searchTerm);
}

function renderPublishedCard(episode) {
  const done = completed.has(episode.slug);
  return `
    <article class="episode-card published">
      <a class="episode-thumb" href="episodes/${episode.slug}/site/" aria-label="開啟 EP${episode.number} ${episode.title}">
        <img
          src="${episode.image}"
          alt="EP${episode.number} ${episode.title}成品預覽"
          width="1280"
          height="720"
          loading="lazy"
        >
        <span class="episode-status">${episode.stateLabel}</span>
      </a>
      <div class="episode-body">
        <div class="episode-meta">
          <span class="episode-number">EP${episode.number}</span>
        </div>
        <h3><a href="episodes/${episode.slug}/site/">${episode.title}</a></h3>
        <p class="episode-description">${episode.description}</p>
        <div class="episode-actions">
          <a href="episodes/${episode.slug}/site/">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m8 4 12 8-12 8z"/></svg>
            線上成品
          </a>
          <a href="episodes/${episode.slug}/">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 5C8 2 4 3 2 3v16c4-1 7 0 10 2 3-2 6-3 10-2V3c-4-1-7 0-10 2v16"/></svg>
            本集資源
          </a>
          <a href="${episode.downloadUrl}" download>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/></svg>
            下載原始碼
          </a>
          <button
            class="progress-toggle${done ? " completed" : ""}"
            type="button"
            data-progress="${episode.slug}"
            aria-pressed="${String(done)}"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"/>${done ? '<path d="m7 12 3 3 7-7"/>' : ""}</svg>
            ${done ? "已完成" : "標記完成"}
          </button>
        </div>
      </div>
    </article>
  `;
}

function renderUpcomingCard(episode) {
  return `
    <article class="episode-card">
      <div class="episode-body">
        <div class="episode-meta">
          <span class="episode-number">EP${episode.number}</span>
          <span class="status-chip ${episode.state}">${episode.stateLabel}</span>
        </div>
        <h3>${episode.title}</h3>
        <p class="episode-description">${episode.description}</p>
      </div>
    </article>
  `;
}

function renderEpisodes() {
  const visibleEpisodes = episodes.filter(isVisible);
  episodeGrid.innerHTML = visibleEpisodes
    .map((episode) =>
      isReady(episode)
        ? renderPublishedCard(episode)
        : renderUpcomingCard(episode),
    )
    .join("");
  emptyState.hidden = visibleEpisodes.length > 0;
  bindProgressButtons();
  updateProgressStat();
}

function bindProgressButtons() {
  document.querySelectorAll("[data-progress]").forEach((button) => {
    button.addEventListener("click", () => {
      const slug = button.dataset.progress;
      if (completed.has(slug)) {
        completed.delete(slug);
      } else {
        completed.add(slug);
      }
      saveProgress();
      renderEpisodes();
    });
  });
}

function updateProgressStat() {
  const publishedSlugs = new Set(
    episodes
      .filter(isReady)
      .map((episode) => episode.slug),
  );
  const completedCount = [...completed].filter((slug) =>
    publishedSlugs.has(slug),
  ).length;
  releaseStat.textContent = `${publishedSlugs.size} / ${episodes.length} 可開啟`;
  progressStat.textContent = `${completedCount} / ${publishedSlugs.size} 已完成`;
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach((item) => {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    renderEpisodes();
  });
});

searchInput.addEventListener("input", () => {
  searchTerm = searchInput.value.trim().toLocaleLowerCase("zh-Hant");
  renderEpisodes();
});

async function startCourse() {
  try {
    const response = await fetch("episodes/manifest.json?v=20261024fix", { cache: "no-cache" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    episodes = await response.json();
    renderEpisodes();
  } catch (error) {
    emptyState.textContent = "課程資料暫時無法載入，請稍後再試。";
    emptyState.hidden = false;
    console.error("Unable to load course manifest:", error);
  }
}

startCourse();
