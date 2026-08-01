const updateParisTime = () => {
  const formatted = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date());

  document.querySelectorAll(".paris-time").forEach((time) => {
    time.textContent = formatted;
    time.dateTime = new Date().toISOString();
  });
};

updateParisTime();
setInterval(updateParisTime, 1000);

document.querySelectorAll("[data-year]").forEach((year) => {
  year.textContent = new Date().getFullYear();
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 },
);

document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

document.querySelectorAll("[data-video-id]").forEach((videoShell) => {
  const launchButton = videoShell.querySelector(".video-launch");

  launchButton?.addEventListener("click", () => {
    const iframe = document.createElement("iframe");
    iframe.src = `https://www.youtube-nocookie.com/embed/${videoShell.dataset.videoId}?autoplay=1&rel=0&modestbranding=1`;
    iframe.title = "Showreel de Killian Quelavoine";
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.allowFullscreen = true;
    videoShell.replaceChildren(iframe);
  });
});

const filterButtons = document.querySelectorAll("[data-filter]");
const workItems = document.querySelectorAll("[data-category]");

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const selectedFilter = button.dataset.filter;

    filterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");

    workItems.forEach((item) => {
      const shouldShow = selectedFilter === "all" || item.dataset.category === selectedFilter;
      item.classList.toggle("is-hidden", !shouldShow);
    });
  });
});
