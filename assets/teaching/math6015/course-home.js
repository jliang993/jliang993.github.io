/* The directory itself is static. Preserve old experiment links and the local theme control. */
(() => {
  "use strict";
  const root = document.querySelector(".course-home");
  if (!root) return;
  function legacyLink() {
    const params = new URLSearchParams(location.hash.slice(1));
    if (!params.has("chapter") && !params.has("example")) return;
    const url = new URL(root.dataset.examplesUrl, location.href);
    url.hash = location.hash;
    location.replace(url.href);
  }
  legacyLink();
  window.addEventListener("hashchange", legacyLink);
  const theme = document.getElementById("course-preview-theme");
  if (!theme) return;
  const apply = (dark) => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    theme.setAttribute("aria-label", dark ? "切换为浅色主题" : "切换为深色主题");
  };
  let stored;
  try {
    stored = localStorage.getItem("math6015-preview-theme");
  } catch {}
  apply(stored ? stored === "dark" : matchMedia("(prefers-color-scheme: dark)").matches);
  theme.hidden = false;
  theme.addEventListener("click", () => {
    const dark = document.documentElement.dataset.theme !== "dark";
    apply(dark);
    try {
      localStorage.setItem("math6015-preview-theme", dark ? "dark" : "light");
    } catch {}
  });
})();
