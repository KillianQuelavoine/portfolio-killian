const workCatalog = Array.isArray(window.WORK_VIDEOS) ? window.WORK_VIDEOS : [];

const workGrid = document.querySelector("[data-work-grid]");
const workCount = document.querySelector("[data-work-count]");
const workEmpty = document.querySelector("[data-work-empty]");
const workMore = document.querySelector("[data-work-more]");
const shuffleButton = document.querySelector("[data-shuffle]");
const formatButtons = [...document.querySelectorAll("[data-format-filter]")];
const roleButtons = [...document.querySelectorAll("[data-role-filter]")];

const state = {
  format: "all",
  role: "all",
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

const formatViews = (views) => {
  if (views >= 1_000_000) return `${(views / 1_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} M`;
  if (views >= 1_000) return `${Math.round(views / 1_000).toLocaleString("fr-FR")} k`;
  return views.toLocaleString("fr-FR");
};

const roleLabel = {
  camera: "Cadreur",
  editing: "Monteur",
  both: "Cadreur & Monteur",
};

const matchesRole = (video) => {
  if (state.role === "all") return true;
  if (state.role === "both") return video.role === "both";
  return video.role === state.role || video.role === "both";
};

const filteredVideos = () => state.videos.filter((video) => {
  const matchesFormat = state.format === "all" || video.format === state.format;
  return matchesFormat && matchesRole(video);
});

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
  thumb.append(createMeta("catalog-duration", video.duration || (video.format === "short" ? "Court" : "Long")));
  thumb.append(createMeta("catalog-play", "Voir ↗"));

  const body = document.createElement("div");
  body.className = "catalog-body";
  const channel = document.createElement("p");
  channel.textContent = video.channel;
  const title = document.createElement("h2");
  title.textContent = video.title;
  const footer = document.createElement("div");
  footer.append(createMeta("catalog-role", roleLabel[video.role]));
  footer.append(createMeta("catalog-views", `${formatViews(video.views)} vues`));
  body.append(channel, title, footer);
  card.append(thumb, body);
  return card;
};

const render = () => {
  if (!workGrid) return;
  const matches = filteredVideos();
  const visibleVideos = matches.slice(0, state.visible);
  workGrid.replaceChildren(...visibleVideos.map(createCard));
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

workMore?.addEventListener("click", () => {
  state.visible += 24;
  render();
});

shuffleButton?.addEventListener("click", () => {
  state.videos = shuffle(state.videos);
  state.visible = 24;
  render();
});

state.videos = shuffle(state.videos);
render();
