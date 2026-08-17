const workCatalog = Array.isArray(window.WORK_VIDEOS) ? window.WORK_VIDEOS : [];

const workGrid = document.querySelector("[data-work-grid]");
const workCount = document.querySelector("[data-work-count]");
const workEmpty = document.querySelector("[data-work-empty]");
const workMore = document.querySelector("[data-work-more]");
const shuffleButton = document.querySelector("[data-shuffle]");
const formatButtons = [...document.querySelectorAll("[data-format-filter]")];
const roleButtons = [...document.querySelectorAll("[data-role-filter]")];
const categoryButtons = [...document.querySelectorAll("[data-category-filter]")];
const sortButtons = [...document.querySelectorAll("[data-sort]")];

const state = {
  format: "all",
  role: "all",
  category: "all",
  sort: "random",
  visible: 24,
  videos: [...workCatalog],
};

const shuffle = (items) => {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }
  return result;
};

const creatorKeys = (video) => {
  const channel = video.channel
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const aliases = [
    ["zack", "zack"],
    ["kaatsup", "kaatsup"],
    ["jacksons", "les-jacksons"],
    ["darko", "darko"],
    ["benjamin mollier", "benjamin-mollier"],
    ["ben films", "benjamin-mollier"],
    ["before production", "before-production"],
    ["final cut school", "final-cut-school"],
    ["cogiteur", "cogiteur"],
    ["natoo", "natoo"],
    ["henry tran", "henry-tran"],
    ["candice", "candice"],
    ["anaonair", "anaonair"],
    ["killian", "killian"],
  ];
  const matches = aliases.filter(([needle]) => channel.includes(needle)).map(([, key]) => key);
  return matches.length ? matches : [channel.replace(/[^a-z0-9]+/g, "-")];
};

const primaryCreator = (video) => creatorKeys(video)[0];

const minimumRunLimit = (groups, preferredLimit = 2) => {
  const total = [...groups.values()].reduce((sum, group) => sum + group.queue.length, 0);
  const largestGroup = Math.max(0, ...[...groups.values()].map((group) => group.queue.length));
  return Math.max(preferredLimit, Math.ceil(largestGroup / Math.max(1, total - largestGroup + 1)));
};

const canFinishWithoutLongerRun = (groups, lastCreator, runLength, runLimit) => {
  const total = [...groups.values()].reduce((sum, group) => sum + group.queue.length, 0);
  return [...groups.entries()].every(([creator, group]) => {
    const count = group.queue.length;
    const otherCreators = total - count;
    const firstBlock = creator === lastCreator ? Math.max(0, runLimit - runLength) : runLimit;
    return count <= firstBlock + (runLimit * otherCreators);
  });
};

const diversifyCreators = (items) => {
  const groups = new Map();
  items.forEach((video, originalIndex) => {
    const creator = primaryCreator(video);
    if (!groups.has(creator)) groups.set(creator, { queue: [] });
    groups.get(creator).queue.push({ video, originalIndex });
  });

  const runLimit = minimumRunLimit(groups);
  const result = [];
  let lastCreator = "";
  let runLength = 0;

  while (result.length < items.length) {
    const candidates = [...groups.entries()]
      .filter(([, group]) => group.queue.length)
      .filter(([creator]) => creator !== lastCreator || runLength < runLimit)
      .sort((first, second) => first[1].queue[0].originalIndex - second[1].queue[0].originalIndex);

    const selected = candidates.find(([creator, group]) => {
      const item = group.queue.shift();
      const nextRunLength = creator === lastCreator ? runLength + 1 : 1;
      const feasible = canFinishWithoutLongerRun(groups, creator, nextRunLength, runLimit);
      group.queue.unshift(item);
      return feasible;
    }) || candidates[0];

    if (!selected) break;
    const [creator, group] = selected;
    const { video } = group.queue.shift();
    result.push(video);
    if (creator === lastCreator) runLength += 1;
    else {
      lastCreator = creator;
      runLength = 1;
    }
  }

  return result;
};

const arrangeCreatorsInRows = (items, columnCount) => {
  if (columnCount <= 2) return [...items];

  const remaining = [...items];
  const result = [];
  let previousCreator = "";
  let runLength = 0;

  while (remaining.length) {
    const rowCounts = new Map();
    const rowSize = Math.min(columnCount, remaining.length);

    for (let slot = 0; slot < rowSize; slot += 1) {
      const creatorAvailability = new Map();
      remaining.forEach((video) => {
        const creator = primaryCreator(video);
        creatorAvailability.set(creator, (creatorAvailability.get(creator) || 0) + 1);
      });

      const candidates = remaining
        .map((video, index) => ({
          video,
          index,
          creator: primaryCreator(video),
          keys: creatorKeys(video),
        }))
        .filter(({ creator, keys }) => (
          (slot === 0 || creator !== previousCreator || runLength < 2)
          && keys.every((key) => (rowCounts.get(key) || 0) < 2)
        ))
        .sort((first, second) => (
          (creatorAvailability.get(second.creator) || 0) - (creatorAvailability.get(first.creator) || 0)
          || first.index - second.index
        ));

      const selected = candidates[0];
      if (!selected) break;

      const [video] = remaining.splice(selected.index, 1);
      result.push(video);
      selected.keys.forEach((key) => rowCounts.set(key, (rowCounts.get(key) || 0) + 1));

      if (selected.creator === previousCreator) runLength += 1;
      else {
        previousCreator = selected.creator;
        runLength = 1;
      }
    }
  }

  return result;
};

const formatViews = (views) => {
  if (!Number.isFinite(views)) return null;
  if (views >= 1_000_000) return `${(views / 1_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} M`;
  if (views >= 1_000) return `${Math.round(views / 1_000).toLocaleString("fr-FR")} k`;
  return views.toLocaleString("fr-FR");
};

const formatPublishedDate = (video) => {
  if (!video.publishedAt) return "Date non précisée";
  const formatted = new Intl.DateTimeFormat("fr-FR", {
    day: video.dateApproximate ? undefined : "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${video.publishedAt}T12:00:00Z`));
  return video.dateApproximate ? `Période estimée · ${formatted}` : formatted;
};

const roleLabel = {
  camera: "Cadreur",
  editing: "Monteur",
  both: "Cadreur & Monteur",
};

const categoryLabel = {
  sport: "Sport",
  lifestyle: "Lifestyle",
  vlog: "Vlog",
  divertissement: "Divertissement",
  corporate: "Corporate",
  tutoriel: "Tutoriel",
};

const formatDuration = (duration) => {
  if (typeof duration === "string") return duration;
  if (!Number.isFinite(duration)) return "";
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const seconds = duration % 60;
  const shortTime = `${minutes}:${String(seconds).padStart(2, "0")}`;
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}` : shortTime;
};

const matchesRole = (video) => {
  if (state.role === "all") return true;
  if (state.role === "both") return video.role === "both";
  return video.role === state.role || video.role === "both";
};

const filteredVideos = (columnCount = getGridColumnCount()) => {
  const matches = state.videos.filter((video) => {
    const matchesFormat = state.format === "all" || video.format === state.format;
    const matchesCategory = state.category === "all" || video.category === state.category;
    return matchesFormat && matchesRole(video) && matchesCategory;
  });

  let ordered = [...matches];
  if (state.sort === "views") {
    ordered.sort((first, second) => {
      const firstViews = Number.isFinite(first.views) ? first.views : -1;
      const secondViews = Number.isFinite(second.views) ? second.views : -1;
      return secondViews - firstViews || second.publishedAt.localeCompare(first.publishedAt);
    });
    return ordered;
  }
  if (state.sort === "date") {
    const byNewest = (first, second) => second.publishedAt.localeCompare(first.publishedAt);
    ordered.sort(byNewest);
    return ordered;
  }
  return arrangeCreatorsInRows(diversifyCreators(ordered), columnCount);
};

const createMeta = (className, text) => {
  const element = document.createElement("span");
  element.className = className;
  element.textContent = text;
  return element;
};

const createCard = (video) => {
  const card = document.createElement("a");
  card.className = "catalog-card";
  card.href = `https://www.youtube.com/watch?v=${video.id}`;
  card.target = "_blank";
  card.rel = "noreferrer";
  card.setAttribute("aria-label", `${video.title} sur YouTube`);

  const thumb = document.createElement("div");
  thumb.className = "catalog-thumb";
  const image = document.createElement("img");
  image.src = `https://i.ytimg.com/vi_webp/${video.id}/maxresdefault.webp`;
  image.alt = "";
  image.loading = "lazy";
  image.addEventListener("error", () => {
    image.src = `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;
  }, { once: true });
  thumb.append(image);
  thumb.append(createMeta("catalog-duration", formatDuration(video.duration) || (video.format === "short" ? "Court" : "Long")));
  const play = createMeta("catalog-play", "Voir");
  play.insertAdjacentHTML("beforeend", '<svg class="icon" aria-hidden="true"><use href="../assets/iconoir.svg#arrow-up-right"></use></svg>');
  thumb.append(play);

  const body = document.createElement("div");
  body.className = "catalog-body";
  const channel = document.createElement("p");
  channel.textContent = `${video.channel} · ${categoryLabel[video.category] || "Projet"}`;
  const title = document.createElement("h2");
  title.textContent = video.title;
  const footer = document.createElement("div");
  const views = formatViews(video.views);
  footer.append(createMeta("catalog-role", roleLabel[video.role]));
  footer.append(createMeta("catalog-date", formatPublishedDate(video)));
  footer.append(createMeta("catalog-views", views ? `${views} vues` : "Vues non précisées"));
  body.append(channel, title, footer);
  card.append(thumb, body);
  return card;
};

const getGridColumnCount = () => {
  if (!workGrid || typeof window.getComputedStyle !== "function") return 4;
  const template = window.getComputedStyle(workGrid).gridTemplateColumns;
  if (!template || template === "none") return 4;
  return template.trim().split(/\s+/).length;
};

const prepareGridLayout = (videos) => {
  return videos.map((video) => ({ video, startsNewRow: false }));
};

const render = () => {
  if (!workGrid) return;
  const matches = filteredVideos();
  const visibleVideos = matches.slice(0, state.visible);
  workGrid.replaceChildren(...prepareGridLayout(visibleVideos).map(({ video }) => createCard(video)));
  if (workCount) workCount.textContent = `${matches.length} vidéo${matches.length > 1 ? "s" : ""}`;
  if (workEmpty) workEmpty.hidden = matches.length !== 0;
  if (workMore) {
    workMore.hidden = state.visible >= matches.length;
    workMore.textContent = `Afficher plus · ${matches.length - state.visible}`;
  }
};

const activateFilter = (buttons, activeButton) => {
  buttons.forEach((button) => {
    const active = button === activeButton;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
};

formatButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.format = button.dataset.formatFilter;
    state.visible = 24;
    activateFilter(formatButtons, button);
    render();
  });
});

roleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.role = button.dataset.roleFilter;
    state.visible = 24;
    activateFilter(roleButtons, button);
    render();
  });
});

categoryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.category = button.dataset.categoryFilter;
    state.visible = 24;
    activateFilter(categoryButtons, button);
    render();
  });
});

sortButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.sort = button.dataset.sort;
    if (state.sort === "random") state.videos = shuffle(workCatalog);
    state.visible = 24;
    activateFilter(sortButtons, button);
    render();
  });
});

workMore?.addEventListener("click", () => {
  state.visible += 24;
  render();
});

shuffleButton?.addEventListener("click", () => {
  state.sort = "random";
  state.videos = shuffle(workCatalog);
  state.visible = 24;
  const randomButton = sortButtons.find((button) => button.dataset.sort === "random");
  if (randomButton) activateFilter(sortButtons, randomButton);
  render();
});

state.videos = shuffle(state.videos);
render();

let resizeTimer;
window.addEventListener("resize", () => {
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(render, 120);
});
