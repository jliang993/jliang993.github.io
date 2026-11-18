document.addEventListener("click", (event) => {
  const rowChoice = event.target.closest("[data-row-state]");
  if (rowChoice) {
    const group = rowChoice.parentElement,
      table = group.previousElementSibling,
      index = +rowChoice.dataset.rowState;
    if (!table?.matches("table[data-row-states]")) return;
    [...table.tBodies[0].rows].forEach((row, i) => {
      if (i === index) row.setAttribute("aria-current", "step");
      else row.removeAttribute("aria-current");
    });
    group.querySelectorAll("button").forEach((control, i) => control.setAttribute("aria-pressed", String(i === index)));
    return;
  }
  const button = event.target.closest("[data-figure-state]");
  if (!button) return;
  const figure = button.closest(".source-figure"),
    index = +button.dataset.figureState;
  figure.querySelectorAll(".figure-open").forEach((image, i) => (image.hidden = i !== index));
  figure.querySelectorAll("[data-figure-state]").forEach((control, i) => control.setAttribute("aria-pressed", String(i === index)));
  globalThis.Reveal?.layout();
});
