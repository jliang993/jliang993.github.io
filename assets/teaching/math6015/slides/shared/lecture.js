(async function () {
  "use strict";
  const $ = (id) => document.getElementById(id),
    slides = [...document.querySelectorAll(".lecture-slide")],
    Labs = globalThis.LectureLabs;
  const resolveSlide = (id) => slides.find((s) => s.id === id || s.dataset.aliases?.split(" ").includes(id));
  const reading = document.documentElement.classList.contains("reading");
  let current = slides[0],
    toastTimer,
    scrollFrame,
    resizeTimer,
    resizeAnchor = null;
  const reviewLocked = () => document.documentElement.classList.contains("review-editing");
  function toast(text) {
    $("toast").textContent = text;
    $("toast").classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $("toast").classList.remove("show"), 3500);
  }
  function fromHash() {
    const id = decodeURIComponent(location.hash.replace(/^#\/?/, "").split("/")[0]);
    return resolveSlide(id) || slides[0];
  }
  function closeDialogs() {
    document.querySelectorAll("dialog[open]").forEach((d) => d.close());
  }
  function position(slide) {
    current = slide;
    const i = slides.indexOf(slide);
    $("page-position").textContent = `${i + 1} / ${slides.length}`;
    $("section-position").textContent = slide.dataset.section;
    $("prev").disabled = i === 0 && !globalThis.Reveal?.availableFragments?.().prev;
    $("next").disabled = i === slides.length - 1 && !globalThis.Reveal?.availableFragments?.().next;
    document.querySelectorAll("#toc-list a[aria-current]").forEach((a) => a.removeAttribute("aria-current"));
    document.querySelector(`#toc-list a[data-go="${slide.id}"]`)?.setAttribute("aria-current", "page");
    document.title = `${slide.dataset.title} · MATH6015`;
    Labs.activate(slide);
    document.dispatchEvent(new CustomEvent("lecture:page", { detail: { id: slide.id } }));
  }
  function go(id) {
    const slide = resolveSlide(id);
    if (!slide || reviewLocked()) return;
    id = slide.id;
    closeDialogs();
    if (reading) {
      position(slide);
      history.replaceState(null, "", `#/${id}`);
      slide.scrollIntoView({ behavior: "instant", block: "start" });
    } else Reveal.slide(slides.indexOf(slide));
  }
  function revealTarget(element) {
    const figure = element?.closest(".source-figure"),
      image = element?.closest(".figure-open");
    if (figure && image?.hidden) {
      const index = [...figure.querySelectorAll(".figure-open")].indexOf(image);
      figure.querySelector('[data-figure-state="' + index + '"]')?.click();
    }
    if (reading || !element || !Reveal.getConfig().fragments) return;
    const fragments = [element.closest(".fragment"), ...element.querySelectorAll(".fragment")].filter(Boolean);
    if (fragments.length) Reveal.navigateFragment(Math.max(...fragments.map((f) => +f.dataset.fragmentIndex)));
  }
  function restoreReviewStep(state) {
    if (reading) return;
    if (Reveal.getConfig().fragments !== state.steps) $("expand-toggle").click();
    if (state.steps) Reveal.navigateFragment(state.fragment);
  }
  function openTOC() {
    Labs.stop();
    $("toc-dialog").showModal();
    $("toc-search").value = "";
    $("toc-list")
      .querySelectorAll("a,h3")
      .forEach((el) => (el.hidden = false));
    $("toc-search").focus();
  }
  const figureDialog = $("figure-dialog"),
    figureImage = $("figure-image"),
    figureViewport = figureDialog.querySelector(".figure-viewport"),
    figureStage = figureDialog.querySelector(".figure-view-stage");
  let figureZoom = 1,
    figureRatio = 1,
    figureTrigger = null;
  function resizeFigure(reset = false) {
    if (!figureDialog.open) return;
    if (reset) figureZoom = 1;
    const width = Math.max(100, figureViewport.clientWidth - 42),
      height = Math.max(100, figureViewport.clientHeight - 42);
    const fitWidth = Math.min(width, height * figureRatio),
      fitHeight = fitWidth / figureRatio;
    figureImage.style.width = `${fitWidth * figureZoom}px`;
    figureImage.style.height = `${fitHeight * figureZoom}px`;
    figureStage.style.width = `${fitWidth * figureZoom + 40}px`;
    figureStage.style.height = `${fitHeight * figureZoom + 40}px`;
    $("figure-scale").value = figureZoom === 1 ? "适合窗口" : `${Math.round(figureZoom * 100)}%`;
    $("figure-zoom-out").disabled = figureZoom <= 0.5;
    $("figure-zoom-in").disabled = figureZoom >= 4;
    if (reset) {
      figureViewport.scrollLeft = 0;
      figureViewport.scrollTop = 0;
    }
  }
  function zoomFigure(factor) {
    const x = (figureViewport.scrollLeft + figureViewport.clientWidth / 2) / figureStage.offsetWidth,
      y = (figureViewport.scrollTop + figureViewport.clientHeight / 2) / figureStage.offsetHeight;
    figureZoom = Math.max(0.5, Math.min(4, figureZoom * factor));
    resizeFigure();
    figureViewport.scrollLeft = x * figureStage.offsetWidth - figureViewport.clientWidth / 2;
    figureViewport.scrollTop = y * figureStage.offsetHeight - figureViewport.clientHeight / 2;
  }
  function openFigure(trigger) {
    const img = trigger.querySelector("img");
    if (!img) return;
    Labs.stop();
    figureTrigger = trigger;
    figureRatio = +img.getAttribute("width") / +img.getAttribute("height");
    figureImage.src = img.src;
    figureImage.alt = img.alt;
    $("figure-title").textContent = trigger.closest(".lecture-slide")?.dataset.title || img.alt;
    figureDialog.showModal();
    resizeFigure(true);
    $("figure-fit").focus();
  }
  $("figure-zoom-in").onclick = () => zoomFigure(1.25);
  $("figure-zoom-out").onclick = () => zoomFigure(1 / 1.25);
  $("figure-fit").onclick = () => resizeFigure(true);
  figureDialog.addEventListener("close", () => figureTrigger?.focus({ preventScroll: true }));
  window.addEventListener("resize", () => resizeFigure());
  let figureDrag;
  figureViewport.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch" || e.button !== 0) return;
    figureDrag = { x: e.clientX, y: e.clientY, left: figureViewport.scrollLeft, top: figureViewport.scrollTop };
    figureViewport.setPointerCapture(e.pointerId);
    figureViewport.classList.add("is-dragging");
    e.preventDefault();
  });
  figureViewport.addEventListener("pointermove", (e) => {
    if (!figureDrag) return;
    figureViewport.scrollLeft = figureDrag.left + figureDrag.x - e.clientX;
    figureViewport.scrollTop = figureDrag.top + figureDrag.y - e.clientY;
  });
  for (const name of ["pointerup", "pointercancel", "lostpointercapture"])
    figureViewport.addEventListener(name, () => {
      figureDrag = null;
      figureViewport.classList.remove("is-dragging");
    });
  function fit(slide) {
    if (window.CourseLayout) {
      window.CourseLayout.fit(slide);
      return;
    }
    if (reading || slide.matches(".cover,.section-divider,.interactive-slide")) return;
    const body = slide.querySelector(".slide-body");
    let scale = 1;
    body.style.setProperty("--content-scale", "1");
    const footerTop = slide.querySelector(".slide-footer").offsetTop || (slide.clientHeight || 800) - 35;
    const available = footerTop - body.offsetTop - 16;
    if (slide.classList.contains("has-enrichment")) {
      slide.dataset.fits = String(body.scrollHeight <= available + 2);
      return;
    }
    const minimum = slide.className.includes("figure-") ? 0.91 : 0.79;
    while (body.scrollHeight > available && scale > minimum) {
      scale = Math.max(minimum, scale - 0.03);
      body.style.setProperty("--content-scale", String(scale));
    }
    // Preserve equations and text if a very dense slide needs extra space.
    slide.dataset.fits = String(body.scrollHeight <= available + 2);
  }
  function presentationSize() {
    const { clientWidth, clientHeight } = $("slide-content");
    // Keep the authored scale and allocate the unused axis to the slide.
    const scale = Math.min(clientWidth / 1280, clientHeight / 800);
    return scale ? { width: Math.round(clientWidth / scale), height: Math.round(clientHeight / scale) } : { width: 1280, height: 800 };
  }
  function cover() {
    if (!document.querySelector(".cover-art")) return;
    const N = globalThis.ChapterNonquadratic,
      point = ([x, y]) => [290 + x * 170, 330 - y * 170],
      path = (pts) =>
        "M" +
        pts
          .map((p) =>
            point(p)
              .map((v) => v.toFixed(2))
              .join(",")
          )
          .join("L");
    const state = globalThis.ChapterExamples.normalize("nonquadratic", { k: 10 }),
      data = N.calculate(state),
      run = data.runs.find((r) => r.method.id === "gd");
    const pts = run.path.slice(0, 11).map((r) => r.x);
    document.querySelector(".cover-art").innerHTML = `<svg viewBox="0 0 550 650"><title>式 (9.20) 的真实等高线与梯度路径</title>${[
      2.7, 3, 4, 6, 10, 20, 40, 80,
    ]
      .map((level) => `<path d="${path(N.contour(level))}"/>`)
      .join("")}<path class="cover-path" d="${path(pts)}"/>${pts
      .map((p) => {
        const [x, y] = point(p);
        return `<circle cx="${x}" cy="${y}" r="4"/>`;
      })
      .join("")}</svg>`;
  }
  cover();
  document.addEventListener("click", (e) => {
    const link = e.target.closest("[data-go]");
    if (link) {
      e.preventDefault();
      go(link.dataset.go);
    }
    const figure = e.target.closest(".figure-open");
    if (figure) openFigure(figure);
    if (e.target.closest("[data-close-dialog]")) e.target.closest("dialog").close();
  });
  for (const dialog of document.querySelectorAll("dialog"))
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) {
        const r = dialog.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close();
      }
    });
  $("toc-toggle").onclick = $("page-position").onclick = openTOC;
  $("toc-search").addEventListener("input", (e) => {
    const query = e.target.value.trim().toLowerCase();
    for (const a of $("toc-list").querySelectorAll("a")) a.hidden = !a.dataset.search.toLowerCase().includes(query);
    for (const h of $("toc-list").querySelectorAll("h3")) {
      let next = h.nextElementSibling,
        visible = false;
      while (next && next.tagName !== "H3") {
        if (!next.hidden) visible = true;
        next = next.nextElementSibling;
      }
      h.hidden = !visible;
    }
  });
  $("prev").onclick = () => {
    if (!reviewLocked()) reading ? go(slides[Math.max(0, slides.indexOf(current) - 1)].id) : Reveal.prev();
  };
  $("next").onclick = () => {
    if (!reviewLocked()) reading ? go(slides[Math.min(slides.length - 1, slides.indexOf(current) + 1)].id) : Reveal.next();
  };
  $("mode-toggle").textContent = reading ? "课堂幻灯片" : "连续阅读";
  $("mode-toggle").onclick = () => {
    Labs.stop();
    const url = new URL(location.href);
    url.searchParams.set("view", reading ? "slides" : "read");
    url.searchParams.set("lab", JSON.stringify(Labs.snapshot()));
    url.hash = "/" + current.id;
    location.href = url.href;
  };
  $("share").onclick = async () => {
    const url = new URL(location.href);
    url.hash = "/" + current.id;
    url.searchParams.set("lab", JSON.stringify(Labs.snapshot()));
    try {
      await navigator.clipboard.writeText(url.href);
      toast(location.protocol === "file:" ? "已复制本机链接，包含当前页面与实验参数。" : "已复制当前页面与实验参数链接。");
    } catch {
      history.replaceState(null, "", url.href);
      toast("页面与参数已写入地址栏，可直接复制地址。");
    }
  };
  $("fullscreen").onclick = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      toast("当前浏览器未提供全屏功能，可使用浏览器的全屏菜单。");
    }
  };
  document.addEventListener("keydown", (e) => {
    if (
      reviewLocked() ||
      e.metaKey ||
      e.ctrlKey ||
      e.altKey ||
      e.target.closest("input,select,textarea,button,[data-drag]") ||
      document.querySelector("dialog[open]")
    )
      return;
    if (e.key.toLowerCase() === "g") {
      e.preventDefault();
      openTOC();
    }
    if (e.key.toLowerCase() === "r") {
      e.preventDefault();
      $("mode-toggle").click();
    }
    if (reading && e.key === "ArrowLeft") {
      e.preventDefault();
      $("prev").click();
    }
    if (reading && e.key === "ArrowRight") {
      e.preventDefault();
      $("next").click();
    }
  });
  window.addEventListener("beforeprint", () => {
    Labs.stop();
    Labs.mountAll();
  });
  if (reading) {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) e.target.querySelectorAll(".lecture-lab").forEach(Labs.mount);
      },
      { rootMargin: "400px" }
    );
    slides.forEach((s) => observer.observe(s));
    window.addEventListener("resize", () => {
      resizeAnchor = resizeAnchor || current;
      if (scrollFrame) {
        cancelAnimationFrame(scrollFrame);
        scrollFrame = null;
      }
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const anchor = resizeAnchor;
        position(anchor);
        anchor.scrollIntoView({ behavior: "instant", block: "start" });
        history.replaceState(null, "", `#/${anchor.id}`);
        requestAnimationFrame(() => {
          resizeAnchor = null;
        });
      }, 160);
    });
    window.addEventListener(
      "scroll",
      () => {
        if (scrollFrame || resizeAnchor) return;
        scrollFrame = requestAnimationFrame(() => {
          scrollFrame = null;
          if (resizeAnchor) return;
          const candidate = slides.reduce((best, s) => (s.getBoundingClientRect().top < innerHeight * 0.3 ? s : best), slides[0]);
          if (candidate !== current) {
            position(candidate);
            history.replaceState(null, "", `#/${candidate.id}`);
          }
        });
      },
      { passive: true }
    );
    position(fromHash());
    requestAnimationFrame(() => fromHash().scrollIntoView({ block: "start", behavior: "instant" }));
    window.addEventListener("hashchange", () => go(fromHash().id));
  } else {
    const progressive = new URLSearchParams(location.search).get("steps") !== "all";
    const motion = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)");
    const syncProgressive = (enabled) => {
      document.documentElement.classList.toggle("all-visible", !enabled);
      $("expand-toggle").setAttribute("aria-pressed", String(enabled));
      $("expand-toggle").textContent = enabled ? "显示全部" : "逐步显示";
    };
    syncProgressive(progressive);
    for (const slide of slides) {
      if (
        slide.dataset.stepMode === "static" ||
        slide.classList.contains("interactive-slide") ||
        slide.classList.contains("cover") ||
        slide.hasAttribute("data-auto-animate") ||
        slide.querySelector(".fragment")
      )
        continue;
      const body = slide.querySelector(".slide-body");
      const units = [
        ...body.querySelectorAll(
          ":scope>.block,:scope>.columns,:scope>ul,:scope>ol,:scope>.model-rows>article,.figure-copy>.block,.figure-copy>.columns,.figure-copy>ul,.figure-copy>ol"
        ),
      ];
      // Reveal whole arguments, comparisons and lists; never individual lines.
      // Keep some opening context visible, then use at most two reveal batches.
      const hasIntro = units[0]?.previousElementSibling;
      const parts = hasIntro ? units : units.slice(1);
      parts.forEach((part, i) => {
        const index = String(Math.floor((i * Math.min(2, parts.length)) / parts.length));
        // Keep trailing captions, qualifications and figures with their content block.
        for (let node = part; node; node = node.nextElementSibling) {
          if (node !== part && units.includes(node)) break;
          node.classList.add("fragment", "lecture-step");
          node.dataset.fragmentIndex = index;
        }
      });
    }
    if (fromHash().id !== decodeURIComponent(location.hash.replace(/^#\/?/, "").split("/")[0]) && location.hash)
      history.replaceState(null, "", "#/" + fromHash().id);
    await Reveal.initialize({
      ...presentationSize(),
      margin: 0.02,
      minScale: 0.15,
      maxScale: 2,
      center: false,
      hash: true,
      hashOneBasedIndex: false,
      controls: false,
      progress: false,
      slideNumber: false,
      transition: motion?.matches ? "none" : "fade",
      transitionSpeed: "fast",
      backgroundTransition: "none",
      touch: false,
      overview: true,
      fragments: progressive,
      embedded: false,
      autoAnimate: !motion?.matches,
      autoAnimateDuration: 0.5,
      autoAnimateEasing: "ease-in-out",
      view: "slide",
      pdfSeparateFragments: false,
      keyboardCondition: (e) =>
        !reviewLocked() && !document.querySelector("dialog[open]") && !e.target.closest("input,select,textarea,button,.lecture-lab"),
    });
    Reveal.on("beforeslidechange", (e) => {
      if (reviewLocked()) e.preventDefault();
    });
    motion?.addEventListener("change", () => Reveal.configure({ transition: motion.matches ? "none" : "fade", autoAnimate: !motion.matches }));
    Reveal.on("slidechanged", (e) => {
      position(e.currentSlide);
      requestAnimationFrame(() => fit(e.currentSlide));
    });
    Reveal.on("fragmentshown", () => {
      const i = slides.indexOf(current);
      $("prev").disabled = false;
      $("next").disabled = i === slides.length - 1 && !Reveal.availableFragments().next;
    });
    Reveal.on("fragmenthidden", () => {
      $("prev").disabled = slides.indexOf(current) === 0 && !Reveal.availableFragments().prev;
    });
    position(Reveal.getCurrentSlide());
    fit(Reveal.getCurrentSlide());
    $("expand-toggle").onclick = () => {
      if (reviewLocked()) return;
      const enabled = $("expand-toggle").getAttribute("aria-pressed") !== "true";
      syncProgressive(enabled);
      Reveal.configure({ fragments: enabled });
      Reveal.slide(Reveal.getIndices().h, 0, enabled ? -1 : undefined);
      const url = new URL(location.href);
      url.searchParams.set("steps", enabled ? "on" : "all");
      history.replaceState(null, "", url);
    };
    window.addEventListener("resize", () =>
      requestAnimationFrame(() => {
        const size = presentationSize(),
          config = Reveal.getConfig();
        if (size.width !== config.width || size.height !== config.height) Reveal.configure(size);
        fit(Reveal.getCurrentSlide());
      })
    );
    for (const img of document.images)
      img.addEventListener("load", () => {
        if (img.closest(".lecture-slide") === Reveal.getCurrentSlide()) fit(Reveal.getCurrentSlide());
      });
  }
  globalThis.LectureDeck = {
    go,
    resolveSlide,
    revealTarget,
    restoreReviewStep,
    get current() {
      return current;
    },
    reading,
  };
  document.dispatchEvent(new CustomEvent("lecture:page", { detail: { id: current.id } }));
})();
