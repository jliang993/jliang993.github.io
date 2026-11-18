/* Local assets only, including MathJax 4's dynamically loaded font paths. */
(function () {
  const base = new URL("../../vendor/mathjax/", (document.currentScript || document.querySelector('script[src$="/mathjax-config.js"]')).src).href;
  window.MathJax = {
    loader: { paths: { mathjax: base, "mathjax-newcm": base + "fonts/mathjax-newcm" } },
    tex: { packages: ["base", "ams", "newcommand", "noundefined"] },
    svg: { fontCache: "none", linebreaks: { inline: false } },
    options: {
      enableMenu: false,
      enableEnrichment: false,
      enableSpeech: false,
      enableBraille: false,
      enableExplorer: false,
      menuOptions: { settings: { enrich: false, speech: false, braille: false, assistiveMml: false } },
    },
    startup: { typeset: false },
  };
})();
