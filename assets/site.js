// Generated pages provide their language and content in HTML.
const messages = JSON.parse(document.getElementById("ui-messages").textContent);

(() => {
  document.documentElement.classList.add("js");
  const menuToggle = document.querySelector(".menu-toggle");
  const mobileNav = document.getElementById("mobile-nav");
  const filterButtons = [...document.querySelectorAll("[data-filter]")];
  const groups = [...document.querySelectorAll("[data-category]")];
  const language = document.documentElement.lang === "en" ? "en" : "cs";
  let category = "matcha-latte";
  const text = (key) => messages[key]?.[language] ?? key;

  function setNavigation(open, returnFocus = false) {
    mobileNav.hidden = !open;
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.dataset.i18nLabel = open ? "menuClose" : "menuToggle";
    menuToggle.setAttribute("aria-label", text(menuToggle.dataset.i18nLabel));
    if (returnFocus) menuToggle.focus();
  }

  function updateResults() {
    const visible = groups.filter((group) => !group.hidden);
    const count = visible.reduce(
      (total, group) => total + group.querySelectorAll(".product").length,
      0,
    );
    const title = filterButtons.find((button) => button.dataset.filter === category)?.textContent.trim() ?? "";
    document.getElementById("menu-status").textContent =
      `${title}: ${count} ${text("results")}`;
  }

  function selectCategory(next) {
    category = next;
    for (const group of groups)
      group.hidden = next !== "all" && group.dataset.category !== next;
    for (const button of filterButtons)
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.filter === next),
      );
    updateResults();
  }


  setNavigation(false);
  menuToggle.addEventListener("click", () => setNavigation(mobileNav.hidden));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !mobileNav.hidden) setNavigation(false, true);
  });
  document.addEventListener("click", (event) => {
    if (!mobileNav.hidden && !event.target.closest(".site-header"))
      setNavigation(false);
  });
  mobileNav.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (!link) return;
    setNavigation(false);
    const hash = link.getAttribute("href");
    if (hash?.startsWith("#")) {
      const destination = document.querySelector(hash);
      if (destination) {
        destination.setAttribute("tabindex", "-1");
        destination.focus({ preventScroll: true });
      }
    }
  });
  const mobileBreakpoint = matchMedia("(max-width: 800px)");
  mobileBreakpoint.addEventListener("change", () => setNavigation(false));
  // Ordinary language links still work without JavaScript.
  document.querySelectorAll("a[data-lang]").forEach((link) => {
    const destination = new URL(link.getAttribute("href"), location.origin);
    const preserveSection = () => {
      destination.hash = location.hash;
      link.href = destination.pathname + destination.hash;
    };
    preserveSection();
    window.addEventListener("hashchange", preserveSection);
  });
  filterButtons.forEach((button) =>
    button.addEventListener("click", () =>
      selectCategory(button.dataset.filter),
    ),
  );
  const filters = document.querySelector(".menu-filters");
  if (filters) {
    filters.hidden = false;
    selectCategory(category);
  }
  // Add the real, public Elfsight widget UUID to data-widget-id in site/home.html.
  // No provider request is made until that ID exists and the section is nearby.
  const feed = document.getElementById("instagram-feed");
  if (!feed) return;
  const widgetId = feed.dataset.widgetId.trim();
  if (
    !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
      widgetId,
    )
  )
    return;
  const mount = document.getElementById("instagram-mount");
  const fallback = document.getElementById("feed-fallback");
  const fallbackText = fallback.querySelector('[data-i18n="feed.fallback"]');
  let started = false;

  function loadFeed() {
    if (started) return;
    started = true;
    feed.classList.add("is-loading");
    feed.setAttribute("aria-busy", "true");
    mount.hidden = false;
    fallbackText.dataset.i18n = "feed.loading";
    fallbackText.textContent = text("feed.loading");
    const widget = document.createElement("div");
    widget.className = `elfsight-app-${widgetId}`;
    mount.append(widget);

    function fail() {
      if (feed.classList.contains("is-ready")) return;
      feed.classList.remove("is-loading");
      feed.setAttribute("aria-busy", "false");
      mount.hidden = true;
      fallback.hidden = false;
      fallbackText.dataset.i18n = "feed.failed";
      fallbackText.textContent = text("feed.failed");
    }

    const timeout = setTimeout(fail, 15000);
    // Watch the provider's rendered post elements, not just script download success.
    const observer = new MutationObserver(() => {
      if (!mount.querySelector(".eapps-instagram-feed-posts-item, iframe"))
        return;
      clearTimeout(timeout);
      observer.disconnect();
      mount.hidden = false;
      fallback.hidden = true;
      feed.classList.remove("is-loading");
      feed.classList.add("is-ready");
      feed.setAttribute("aria-busy", "false");
    });
    observer.observe(mount, { childList: true, subtree: true });
    const script = document.createElement("script");
    script.src = "https://elfsightcdn.com/platform.js";
    script.async = true;
    script.addEventListener("error", () => {
      clearTimeout(timeout);
      observer.disconnect();
      fail();
    });
    document.head.append(script);
  }

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          loadFeed();
        }
      },
      { rootMargin: "400px" },
    );
    observer.observe(feed);
  } else loadFeed();
})();
