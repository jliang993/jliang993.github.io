(() => {
  const initializePublicationDisclosures = () => {
    document.querySelectorAll("[data-site-publication-toggle]").forEach((button) => {
      if (button.dataset.siteDisclosureReady === "true") return;
      button.dataset.siteDisclosureReady = "true";

      button.addEventListener("click", () => {
        const publication = button.closest("[data-site-publication]");
        const panelId = button.getAttribute("aria-controls");
        const panel = publication ? Array.from(publication.querySelectorAll(".site-publication-panel")).find(({ id }) => id === panelId) : null;
        if (!publication || !panel) return;

        const willOpen = panel.hidden;
        publication.querySelectorAll("[data-site-publication-toggle]").forEach((otherButton) => {
          otherButton.setAttribute("aria-expanded", "false");
        });
        publication.querySelectorAll(".site-publication-panel").forEach((otherPanel) => {
          otherPanel.hidden = true;
        });

        panel.hidden = !willOpen;
        button.setAttribute("aria-expanded", willOpen.toString());
      });
    });

    document.querySelectorAll("[data-site-more-authors]").forEach((button) => {
      if (button.dataset.siteAuthorsReady === "true") return;
      button.dataset.siteAuthorsReady = "true";

      button.addEventListener("click", () => {
        const expanded = button.getAttribute("aria-expanded") === "true";
        button.setAttribute("aria-expanded", (!expanded).toString());
        button.querySelector("[data-site-more-authors-collapsed]").hidden = !expanded;
        button.querySelector("[data-site-more-authors-expanded]").hidden = expanded;
      });
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializePublicationDisclosures, { once: true });
  } else {
    initializePublicationDisclosures();
  }
})();
