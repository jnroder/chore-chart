import { templates } from "../data/templates/index.js";
import { ChartInstance } from "../classes/ChartInstance.js";
import { saveInstance } from "../db/idb.js";
import { navigate } from "../router.js";

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function renderTemplatePicker(_params, root) {
  let html = `<div class="app-shell">
        <header class="app-header">
            <h1>Pick a template</h1>
            <a href="#/" class="link-back">← Back</a>
        </header>
        <div class="template-grid">`;
  for (const t of templates) {
    html += `<button type="button" class="template-card" data-template-id="${esc(t.id)}">
            <div class="template-card-name">${esc(t.name)}</div>
            <div class="template-card-desc">${esc(t.description || "")}</div>
        </button>`;
  }
  html += `</div></div>`;
  root.innerHTML = html;

  const onClick = async (e) => {
    const card = e.target.closest("[data-template-id]");
    if (!card) return;
    const t = templates.find((t) => t.id === card.dataset.templateId);
    if (!t) return;
    const instance = ChartInstance.fromTemplate(t);
    await saveInstance(instance.toJSON());
    navigate(`#/edit/${encodeURIComponent(instance.id)}`);
  };
  root.addEventListener("click", onClick);
  return () => root.removeEventListener("click", onClick);
}
