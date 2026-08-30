// Turns any `textarea[data-easymde]` in the admin into a EasyMDE markdown
// editor (see vendored easymde.min.js/css, registered alongside this file in
// config/initializers/active_admin.rb).
//
// The app's public pages don't render full Markdown -- each model parses its
// own narrow subset (see CourseModule#sections and Exercise::Show's
// renderBoldText on the frontend). Rather than silently let admins write
// Markdown that never shows up on the real page, each textarea can carry a
// `data-easymde-hint` attribute with a short reminder of what actually
// renders for that field; we print it under the toolbar.
(function () {
  function pixelHeightFor(textarea) {
    var rows = Number.parseInt(textarea.getAttribute("rows"), 10);
    var safeRows = Number.isFinite(rows) && rows > 0 ? rows : 20;
    return safeRows * 20 + "px";
  }

  function addHint(editor, hint) {
    if (!hint) return;
    var note = document.createElement("p");
    note.className = "admin-content-editor-hint";
    note.textContent = hint;
    editor.codemirror.getWrapperElement().insertAdjacentElement("afterend", note);
  }

  function initEasyMDE(textarea) {
    if (textarea.dataset.easymdeInitialized === "true") return;
    textarea.dataset.easymdeInitialized = "true";

    var editor = new EasyMDE({
      element: textarea,
      spellChecker: false,
      status: false,
      minHeight: pixelHeightFor(textarea),
      toolbar: [
        "bold", "heading-2", "unordered-list", "ordered-list", "|",
        "preview", "side-by-side", "fullscreen", "|", "guide"
      ]
    });

    addHint(editor, textarea.getAttribute("data-easymde-hint"));
  }

  function initAll() {
    document.querySelectorAll("textarea[data-easymde]").forEach(initEasyMDE);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();
