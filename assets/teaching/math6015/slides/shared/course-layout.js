/* Allocate page space to prose and geometry independently. */
(() => {
  const fit = (slide) => {
    if (!slide || document.documentElement.classList.contains("reading") || slide.matches(".cover,.section-divider")) return;
    const body = slide.querySelector(".slide-body");
    if (!body) return;
    const footer = slide.querySelector(".slide-footer");
    const scale = slide.getBoundingClientRect().width / slide.offsetWidth || 1;
    const available = footer
      ? (footer.getBoundingClientRect().top - body.getBoundingClientRect().top) / scale - 16
      : slide.clientHeight - body.offsetTop - 48;
    if (available < 100) return;
    const supplement = body.querySelector(":scope > [data-teaching-supplement]");
    const layout = body.querySelector(":scope > .figure-layout");
    const leading = layout ? (layout.getBoundingClientRect().top - body.getBoundingClientRect().top) / scale : 0;
    const layoutRoom = available - (supplement ? supplement.offsetHeight + 26 : 0) - leading;
    body.style.setProperty("--content-scale", "1");
    body.style.setProperty("--body-room", available + "px");
    const contentHeight = () => {
      const top = body.getBoundingClientRect().top;
      const children = [...body.querySelectorAll("p,li,h3,table,.typeset-math.is-display,.source-figure,.worked-example")];
      return Math.max(
        body.scrollHeight,
        ...children.map((el) => {
          const r = el.getBoundingClientRect();
          return r.width && r.height ? (r.bottom - top) / scale : 0;
        })
      );
    };
    const overflow = () => contentHeight() > available + 2;
    if (layout) {
      const copy = layout.querySelector(".figure-copy"),
        art = layout.querySelector(".figure-art");
      const initial = slide.dataset.figureLayout || (slide.dataset.figureLayout = slide.classList.contains("figure-wide") ? "wide" : "side");
      slide.classList.toggle("figure-wide", initial === "wide");
      slide.classList.toggle("figure-side", initial === "side");
      // A dense explanation often fits much better above the diagram. Keep it on
      // the same page, using full width before considering any smaller text size.
      if (initial === "side" && copy.scrollHeight > layoutRoom) {
        slide.classList.replace("figure-side", "figure-wide");
        if (copy.scrollHeight > layoutRoom - 150) slide.classList.replace("figure-wide", "figure-side");
      }
      const size = () =>
        art.style.setProperty(
          "--figure-height",
          (slide.classList.contains("figure-wide") ? Math.max(100, layoutRoom - copy.offsetHeight - 24) : layoutRoom - 12) + "px"
        );
      size();
      if (overflow() && (slide.classList.contains("figure-wide") || slide.classList.contains("formula-led"))) {
        const excess = contentHeight() - available;
        const imageHeights = [...art.querySelectorAll("img")].map((img) => img.getBoundingClientRect().height / scale).filter((height) => height > 0);
        const cap = Math.min(parseFloat(art.style.getPropertyValue("--figure-height")), ...imageHeights);
        art.style.setProperty("--figure-height", Math.max(100, cap - excess - 3) + "px");
      }
    } else if (slide.classList.contains("figure-original") || slide.classList.contains("figure-multiple")) {
      // Original two/three-column comparisons retain their pairing. Allocate
      // height across figure rows, so the second row cannot run into the footer.
      let cap = slide.classList.contains("figure-original") ? 500 : 400;
      body.style.setProperty("--multi-figure-height", cap + "px");
      while (overflow() && cap > 160) {
        cap -= 20;
        body.style.setProperty("--multi-figure-height", cap + "px");
      }
    }
    slide.dataset.fits = String(!overflow());
  };
  window.CourseLayout = { fit };
})();
