export function initAddApplyButton() {
  // Attach the addApplyButton function to the relevant hooks
  Hooks.on("renderTileConfig", addApplyButton);
  Hooks.on("renderDrawingConfig", addApplyButton);
  Hooks.on("renderSceneConfig", addApplyButton);
  Hooks.on("renderNoteConfig", addApplyButton);
}

function addApplyButton(app, html) {
  if (
    !app.options.form.closeOnSubmit ||
    app?.token?.schema?.name === "PrototypeToken"
  )
    return;

  const injectPoint = html.querySelector("footer");
  if (!injectPoint) return;

  const existingBtn = injectPoint.querySelector("button[data-apply]");
  if (existingBtn) return;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.dataset.apply = true;
  btn.innerHTML = `<i class="fas fa-check"></i> Apply`;
  injectPoint.appendChild(btn);
  btn.addEventListener("click", (e) => {
    app.submit({ preventClose: true, preventRender: true });
    e.currentTarget.blur();
  });
}
