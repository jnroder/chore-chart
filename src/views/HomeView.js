import {
  listInstances,
  deleteInstance,
  saveInstance,
  getInstance,
} from "../db/idb.js";
import { templatesById } from "../data/templates/index.js";
import { ChartInstance } from "../classes/ChartInstance.js";
import { navigate } from "../router.js";

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmtDate(ts) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "";
  }
}

export async function renderHome(_params, root) {
  const instances = await listInstances();

  let html = `<div class="app-shell">
        <header class="app-header">
            <h1>Chore Charts</h1>
            <div class="app-actions">
                <button type="button" data-action="new">+ New from template</button>
                <label class="file-btn">
                    Import JSON
                    <input type="file" accept="application/json" data-action="import-file" hidden>
                </label>
            </div>
        </header>`;

  if (!instances.length) {
    html += `<p class="empty-state">No saved charts yet. Click "New from template" to get started.</p>`;
  } else {
    html += `<ul class="home-list">`;
    for (const inst of instances) {
      const tmpl = templatesById[inst.templateId];
      html += `<li class="home-row" data-id="${esc(inst.id)}">
                <div class="home-row-main">
                    <div class="home-row-name">${esc(inst.name)}</div>
                    <div class="home-row-meta">
                        <span>${esc(tmpl ? tmpl.name : inst.templateId || "unknown template")}</span>
                        <span>· updated ${esc(fmtDate(inst.updatedAt))}</span>
                    </div>
                </div>
                <div class="home-row-actions">
                    <button type="button" data-action="open"      data-id="${esc(inst.id)}">Open</button>
                    <button type="button" data-action="print"     data-id="${esc(inst.id)}">Print</button>
                    <button type="button" data-action="rename"    data-id="${esc(inst.id)}">Rename</button>
                    <button type="button" data-action="duplicate" data-id="${esc(inst.id)}">Duplicate</button>
                    <button type="button" data-action="export"    data-id="${esc(inst.id)}">Export</button>
                    <button type="button" data-action="delete"    data-id="${esc(inst.id)}" class="danger">Delete</button>
                </div>
            </li>`;
    }
    html += `</ul>`;
  }

  html += `</div>`;
  root.innerHTML = html;

  const onClick = async (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    const id = btn.dataset.id;

    if (action === "new") {
      navigate("#/new");
      return;
    }
    if (action === "open") {
      navigate(`#/edit/${encodeURIComponent(id)}`);
      return;
    }
    if (action === "print") {
      navigate(`#/print/${encodeURIComponent(id)}`);
      return;
    }

    if (action === "rename") {
      const inst = await getInstance(id);
      if (!inst) return;
      const next = prompt("Rename chart:", inst.name);
      if (next == null || next.trim() === "" || next === inst.name) return;
      inst.name = next.trim();
      await saveInstance(inst);
      renderHome(_params, root);
      return;
    }

    if (action === "duplicate") {
      const inst = await getInstance(id);
      if (!inst) return;
      const clone = ChartInstance.fromJSON(inst).toJSON();
      const { newId } = await import("../util/id.js");
      clone.id = newId();
      clone.name = `${inst.name} (copy)`;
      clone.createdAt = Date.now();
      clone.updatedAt = Date.now();
      await saveInstance(clone);
      renderHome(_params, root);
      return;
    }

    if (action === "export") {
      const inst = await getInstance(id);
      if (!inst) return;
      const blob = new Blob([JSON.stringify(inst, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${inst.name.replace(/[^a-z0-9\-_]+/gi, "_")}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      return;
    }

    if (action === "delete") {
      if (!confirm("Delete this chart? This cannot be undone.")) return;
      await deleteInstance(id);
      renderHome(_params, root);
      return;
    }
  };

  const onFile = async (e) => {
    const input = e.target.closest('input[data-action="import-file"]');
    if (!input || !input.files || !input.files[0]) return;
    const file = input.files[0];
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const { newId } = await import("../util/id.js");
      parsed.id = newId();
      parsed.createdAt = Date.now();
      parsed.updatedAt = Date.now();
      if (!parsed.templateId || !templatesById[parsed.templateId]) {
        // Fall back to blank template's id so editor uses permissive editability
        parsed.templateId = "blank";
      }
      await saveInstance(parsed);
      renderHome(_params, root);
    } catch (err) {
      alert(`Import failed: ${err.message}`);
    } finally {
      input.value = "";
    }
  };

  root.addEventListener("click", onClick);
  root.addEventListener("change", onFile);
  return () => {
    root.removeEventListener("click", onClick);
    root.removeEventListener("change", onFile);
  };
}
