import { ChartInstance } from "./ChartInstance.js";
import { Chore } from "./Chore.js";
import { HistoryStack } from "./HistoryStack.js";
import { renderChart } from "./ChartRenderer.js";
import { saveInstance } from "../db/idb.js";
import { newId } from "../util/id.js";

const clone = (obj) => JSON.parse(JSON.stringify(obj));

/**
 * Editor owns a working ChartInstance, an undo/redo history, and a dirty flag.
 * It renders into `chartMount` and wires delegated event listeners.
 */
export class Editor {
  /**
   * @param {object} opts
   * @param {ChartInstance} opts.instance
   * @param {import('../data/templateSchema.js').Editability} opts.editability
   * @param {HTMLElement} opts.toolbarMount
   * @param {HTMLElement} opts.chartMount
   * @param {() => void} [opts.onDirtyChange]
   */
  constructor({
    instance,
    editability,
    toolbarMount,
    chartMount,
    onDirtyChange,
  }) {
    this.instance = instance;
    this.editability = editability;
    this.toolbarMount = toolbarMount;
    this.chartMount = chartMount;
    this.onDirtyChange = onDirtyChange || (() => {});
    this.history = new HistoryStack({ cap: 50 });
    this.history.reset(clone(instance.toJSON()));
    this.dirty = false;
    this._bound = false;
    this._keyHandler = null;
    this._beforeUnload = null;
  }

  mount() {
    this.render();
    this._bindGlobal();
  }

  unmount() {
    if (this._keyHandler)
      window.removeEventListener("keydown", this._keyHandler);
    if (this._beforeUnload)
      window.removeEventListener("beforeunload", this._beforeUnload);
  }

  // ---------- rendering ----------
  render() {
    this.chartMount.innerHTML = renderChart(this.instance, {
      editable: true,
      editability: this.editability,
    });
    // Populate time-of-day select options (renderer left placeholders)
    this.chartMount
      .querySelectorAll('select[data-edit="chore-time"]')
      .forEach((sel) => {
        const current = sel.value;
        sel.innerHTML = this.instance.times
          .map(
            (t) =>
              `<option value="${escAttr(t.label)}"${t.label === current ? " selected" : ""}>${escHtml(t.label)}</option>`,
          )
          .join("");
      });
    this._renderToolbar();
    this._bindDelegates();
  }

  _renderToolbar() {
    const canUndo = this.history.canUndo();
    const canRedo = this.history.canRedo();
    this.toolbarMount.innerHTML = `
            <div class="editor-toolbar">
                <a href="#/" class="link-back">← Home</a>
                <label class="toolbar-name">
                    Name
                    <input type="text" data-tb="name" value="${escAttr(this.instance.name)}">
                </label>
                <button type="button" data-tb="undo" ${canUndo ? "" : "disabled"}>Undo</button>
                <button type="button" data-tb="redo" ${canRedo ? "" : "disabled"}>Redo</button>
                <button type="button" data-tb="save" class="primary">Save</button>
                <button type="button" data-tb="duplicate">Duplicate</button>
                <button type="button" data-tb="export">Export JSON</button>
                <span class="dirty-pill" data-tb="dirty" ${this.dirty ? "" : "hidden"}>● Unsaved changes</span>
            </div>
        `;
  }

  _bindGlobal() {
    if (this._bound) return;
    this._bound = true;

    this._keyHandler = (e) => {
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;
      const key = e.key.toLowerCase();
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        this.undo();
      } else if ((key === "z" && e.shiftKey) || key === "y") {
        e.preventDefault();
        this.redo();
      } else if (key === "s") {
        e.preventDefault();
        this.save();
      }
    };
    window.addEventListener("keydown", this._keyHandler);

    this._beforeUnload = (e) => {
      if (!this.dirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", this._beforeUnload);
  }

  _bindDelegates() {
    // The chart region uses full re-render on every commit, so listeners are attached fresh.
    const chart = this.chartMount;

    chart.onclick = (e) => this._onChartClick(e);
    chart.onchange = (e) => this._onChartChange(e);
    chart.onkeydown = (e) => this._onChartKeydown(e);
    chart.onfocusout = (e) => this._onChartBlur(e);
    chart.ondragstart = (e) => this._onDragStart(e);
    chart.ondragover = (e) => this._onDragOver(e);
    chart.ondrop = (e) => this._onDrop(e);

    // Toolbar listeners
    this.toolbarMount.onclick = (e) => this._onToolbarClick(e);
    this.toolbarMount.onchange = (e) => this._onToolbarChange(e);
  }

  // ---------- state mutations ----------
  _commit(message) {
    this.instance.updatedAt = Date.now();
    this.history.push(clone(this.instance.toJSON()));
    this._setDirty(true);
    this.render();
  }

  _setDirty(v) {
    if (this.dirty === v) return;
    this.dirty = v;
    this.onDirtyChange(v);
  }

  undo() {
    const snap = this.history.undo();
    if (!snap) return;
    this.instance = ChartInstance.fromJSON(clone(snap));
    this._setDirty(true);
    this.render();
  }

  redo() {
    const snap = this.history.redo();
    if (!snap) return;
    this.instance = ChartInstance.fromJSON(clone(snap));
    this._setDirty(true);
    this.render();
  }

  async save() {
    await saveInstance(this.instance.toJSON());
    this._setDirty(false);
    this._renderToolbar();
  }

  // ---------- toolbar handlers ----------
  _onToolbarClick(e) {
    const btn = e.target.closest("[data-tb]");
    if (!btn) return;
    const action = btn.dataset.tb;
    if (action === "undo") this.undo();
    else if (action === "redo") this.redo();
    else if (action === "save") this.save();
    else if (action === "duplicate") this._duplicate();
    else if (action === "export") this._export();
  }

  _onToolbarChange(e) {
    const el = e.target.closest('[data-tb="name"]');
    if (!el) return;
    const v = el.value.trim() || "Untitled chart";
    if (v !== this.instance.name) {
      this.instance.name = v;
      this._commit("rename");
    }
  }

  async _duplicate() {
    const data = this.instance.toJSON();
    data.id = newId();
    data.name = `${data.name} (copy)`;
    data.createdAt = Date.now();
    data.updatedAt = Date.now();
    await saveInstance(data);
    location.hash = `#/edit/${encodeURIComponent(data.id)}`;
  }

  _export() {
    const blob = new Blob([JSON.stringify(this.instance.toJSON(), null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(this.instance.name || "chart").replace(/[^a-z0-9\-_]+/gi, "_")}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // ---------- chart interaction handlers ----------
  _onChartClick(e) {
    const btn = e.target.closest("[data-action]");
    if (btn) {
      e.preventDefault();
      this._handleAction(btn.dataset.action, btn);
      return;
    }

    const dayCell = e.target.closest('[data-edit="day-cell"]');
    if (dayCell) {
      this._toggleDayCell(dayCell, e.shiftKey);
      return;
    }

    const editable = e.target.closest("[data-edit]");
    if (editable && this._isTextEditable(editable.dataset.edit)) {
      this._startInlineEdit(editable);
      return;
    }
  }

  _isTextEditable(kind) {
    return (
      kind === "heading" ||
      kind === "day-label" ||
      kind === "time-label" ||
      kind === "chore-name" ||
      kind === "chore-points"
    );
  }

  _onChartChange(e) {
    const sel = e.target.closest('select[data-edit="chore-time"]');
    if (sel) {
      const choreId = sel.dataset.choreId;
      const chore = this.instance.chores.find((c) => c.id === choreId);
      if (chore && chore.time !== sel.value) {
        chore.time = sel.value;
        this._commit("chore-time");
      }
    }
  }

  _onChartKeydown(e) {
    // Enter commits, Escape cancels active contenteditable edits
    const editing = e.target.closest('[data-editing="true"]');
    if (!editing) return;
    if (e.key === "Enter") {
      e.preventDefault();
      editing.blur();
    } else if (e.key === "Escape") {
      e.preventDefault();
      editing.textContent = editing.dataset.originalValue || "";
      editing.dataset.cancelled = "true";
      editing.blur();
    }
  }

  _onChartBlur(e) {
    const el = e.target.closest('[data-editing="true"]');
    if (!el) return;
    this._finishInlineEdit(el);
  }

  _startInlineEdit(el) {
    const kind = el.dataset.edit;
    el.dataset.editing = "true";
    el.dataset.originalValue = el.textContent;
    el.contentEditable = "true";
    el.focus();
    // select all
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  _finishInlineEdit(el) {
    const kind = el.dataset.edit;
    const cancelled = el.dataset.cancelled === "true";
    const original = el.dataset.originalValue || "";
    const raw = el.textContent.trim();
    el.contentEditable = "false";
    delete el.dataset.editing;
    delete el.dataset.cancelled;
    delete el.dataset.originalValue;

    if (cancelled || raw === original) {
      // no-op; still re-render to normalize
      this.render();
      return;
    }

    if (kind === "heading") {
      this.instance.heading = raw;
      this._commit("heading");
      return;
    }
    if (kind === "day-label") {
      const id = el.dataset.dayId;
      const day = this.instance.days.find((d) => d.id === id);
      if (day && raw) {
        const oldLabel = day.label;
        day.label = raw;
        // update chores that referenced this label
        this.instance.chores.forEach((c) => {
          c.days = c.days.map((d) => (d === oldLabel ? raw : d));
          if (c.multipliers && oldLabel in c.multipliers) {
            c.multipliers[raw] = c.multipliers[oldLabel];
            delete c.multipliers[oldLabel];
          }
        });
        this._commit("day-label");
      } else this.render();
      return;
    }
    if (kind === "time-label") {
      const id = el.dataset.timeId;
      const t = this.instance.times.find((x) => x.id === id);
      if (t && raw) {
        const oldLabel = t.label;
        t.label = raw;
        this.instance.chores.forEach((c) => {
          if (c.time === oldLabel) c.time = raw;
        });
        this._commit("time-label");
      } else this.render();
      return;
    }
    if (kind === "chore-name") {
      const id = el.dataset.choreId;
      const chore = this.instance.chores.find((c) => c.id === id);
      if (chore) {
        chore.name = raw;
        this._commit("chore-name");
      }
      return;
    }
    if (kind === "chore-points") {
      const id = el.dataset.choreId;
      const chore = this.instance.chores.find((c) => c.id === id);
      if (chore) {
        const n = parseInt(raw, 10);
        if (Number.isFinite(n) && n >= 0) {
          chore.points = n;
          this._commit("chore-points");
        } else {
          this.render();
        }
      }
      return;
    }
    this.render();
  }

  _toggleDayCell(cell, shift) {
    const choreId = cell.dataset.choreId;
    const dayLabel = cell.dataset.dayLabel;
    const chore = this.instance.chores.find((c) => c.id === choreId);
    if (!chore) return;

    if (shift && this.editability.chore?.multipliers) {
      // Ensure it's scheduled; then prompt for multiplier
      if (!chore.days.includes(dayLabel)) chore.days.push(dayLabel);
      const current = chore.multipliers[dayLabel] || "";
      const input = prompt(
        `Multiplier for ${dayLabel} (blank to clear):`,
        current,
      );
      if (input === null) {
        this.render();
        return;
      }
      if (input.trim() === "") {
        delete chore.multipliers[dayLabel];
      } else {
        const n = parseInt(input, 10);
        if (!Number.isFinite(n) || n < 1) {
          alert("Multiplier must be a positive integer.");
          this.render();
          return;
        }
        chore.multipliers[dayLabel] = n;
      }
      this._commit("multiplier");
      return;
    }

    if (!this.editability.chore?.days) return;

    // Cycle: scheduled -> blocked -> scheduled
    if (chore.days.includes(dayLabel)) {
      chore.days = chore.days.filter((d) => d !== dayLabel);
      if (chore.multipliers[dayLabel]) delete chore.multipliers[dayLabel];
    } else {
      chore.days.push(dayLabel);
    }
    this._commit("day-toggle");
  }

  _handleAction(action, btn) {
    switch (action) {
      case "add-chore": {
        const timeId = btn.dataset.timeId;
        const time = this.instance.times.find((t) => t.id === timeId);
        if (!time) return;
        this.instance.chores.push(
          new Chore({
            name: "New chore",
            points: 5,
            time: time.label,
            days: this.instance.days
              .filter((d) => d.visible !== false)
              .map((d) => d.label),
            multipliers: {},
          }),
        );
        this._commit("add-chore");
        return;
      }
      case "remove-chore": {
        const id = btn.dataset.choreId;
        if (!confirm("Remove this chore?")) return;
        this.instance.chores = this.instance.chores.filter((c) => c.id !== id);
        this._commit("remove-chore");
        return;
      }
      case "add-time": {
        const label = prompt("Name for the new time section:", "New Section");
        if (!label || !label.trim()) return;
        this.instance.times.push({ id: newId(), label: label.trim(), img: "" });
        this._commit("add-time");
        return;
      }
      case "remove-time": {
        const id = btn.dataset.timeId;
        const t = this.instance.times.find((x) => x.id === id);
        if (!t) return;
        const hasChores = this.instance.chores.some((c) => c.time === t.label);
        if (
          hasChores &&
          !confirm(
            `Section "${t.label}" has chores. Remove section and all its chores?`,
          )
        )
          return;
        this.instance.times = this.instance.times.filter((x) => x.id !== id);
        this.instance.chores = this.instance.chores.filter(
          (c) => c.time !== t.label,
        );
        this._commit("remove-time");
        return;
      }
      case "add-day": {
        const label = prompt("Name for the new day:", "New Day");
        if (!label || !label.trim()) return;
        this.instance.days.push({
          id: newId(),
          label: label.trim(),
          visible: true,
        });
        this._commit("add-day");
        return;
      }
      case "hide-day": {
        const id = btn.dataset.dayId;
        const d = this.instance.days.find((x) => x.id === id);
        if (!d) return;
        d.visible = false;
        this._commit("hide-day");
        return;
      }
      case "show-day": {
        const id = btn.dataset.dayId;
        const d = this.instance.days.find((x) => x.id === id);
        if (!d) return;
        d.visible = true;
        this._commit("show-day");
        return;
      }
    }
  }

  // ---------- drag & drop for reorder ----------
  _onDragStart(e) {
    const handle = e.target.closest(".drag-handle");
    if (!handle) return;
    const row = handle.closest("[data-chore-id]");
    if (!row) return;
    this._dragChoreId = row.dataset.choreId;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", this._dragChoreId);
  }

  _onDragOver(e) {
    if (!this._dragChoreId) return;
    const row = e.target.closest(".chore[data-chore-id]");
    if (!row) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  _onDrop(e) {
    if (!this._dragChoreId) return;
    const row = e.target.closest(".chore[data-chore-id]");
    if (!row) return;
    e.preventDefault();
    const targetId = row.dataset.choreId;
    const srcId = this._dragChoreId;
    this._dragChoreId = null;
    if (srcId === targetId) return;

    const chores = this.instance.chores;
    const srcIdx = chores.findIndex((c) => c.id === srcId);
    const tgtIdx = chores.findIndex((c) => c.id === targetId);
    if (srcIdx < 0 || tgtIdx < 0) return;

    const [moved] = chores.splice(srcIdx, 1);
    // Adopt the drop target's time section, so cross-section drags work.
    const target = chores[tgtIdx > srcIdx ? tgtIdx - 1 : tgtIdx];
    if (target) moved.time = target.time;
    chores.splice(tgtIdx > srcIdx ? tgtIdx - 1 : tgtIdx, 0, moved);
    this._commit("reorder");
  }
}

function escHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
function escAttr(s) {
  return escHtml(s).replace(/"/g, "&quot;");
}
