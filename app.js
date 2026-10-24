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
      <div class="episode-thumb">
        <img
          src="${episode.image}"
          alt="EP${episode.number} ${episode.title}成品預覽"
          width="1280"
          height="720"
          loading="lazy"
        >
        <span class="episode-status">${episode.stateLabel}</span>
      </div>
      <div class="episode-body">
        <div class="episode-meta">
          <span class="episode-number">EP${episode.number}</span>
        </div>
        <h3>${episode.title}</h3>
        <p class="episode-description">${episode.description}</p>
        <div class="episode-actions">
          <a href="episodes/${episode.slug}/site/">
            <i data-lucide="play" aria-hidden="true"></i>
            線上成品
          </a>
          <a href="episodes/${episode.slug}/">
            <i data-lucide="book-open" aria-hidden="true"></i>
            本集資源
          </a>
          <a href="${episode.downloadUrl}" download>
            <i data-lucide="download" aria-hidden="true"></i>
            下載原始碼
          </a>
          <button
            class="progress-toggle${done ? " completed" : ""}"
            type="button"
            data-progress="${episode.slug}"
            aria-pressed="${String(done)}"
          >
            <i data-lucide="${done ? "circle-check" : "circle"}" aria-hidden="true"></i>
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
  window.lucide?.createIcons();
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
    const response = await fetch("episodes/manifest.json");
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
