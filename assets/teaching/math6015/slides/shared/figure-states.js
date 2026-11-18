document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-figure-state]");
  if (!button) return;
  const figure = button.closest(".source-figure"),
    index = +button.dataset.figureState;
  figure.querySelectorAll(".figure-open").forEach((image, i) => (image.hidden = i !== index));
  figure.querySelectorAll("[data-figure-state]").forEach((control, i) => control.setAttribute("aria-pressed", String(i === index)));
  globalThis.Reveal?.layout();
});
