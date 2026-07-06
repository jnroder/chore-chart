/** Small HTML-escape helper. */
function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Stateless renderer for a ChartInstance.
 * @param {import('./ChartInstance.js').ChartInstance} instance
 * @param {object} [options]
 * @param {boolean} [options.editable=false]
 * @param {import('../data/templateSchema.js').Editability} [options.editability]
 * @returns {string} HTML
 */
export function renderChart(instance, options = {}) {
  const editable = !!options.editable;
  const ed = options.editability || {};
  const choreEd = ed.chore || {};

  const visibleDays = instance.days.filter((d) => d.visible !== false);
  const dayLabels = visibleDays.map((d) => d.label);
  const colCount = visibleDays.length;

  const gridStyle = `grid-template-columns: 2fr repeat(${Math.max(colCount, 1)}, 1fr);`;

  let html = "";

  // Header
  html += `<div class="chart-header">`;
  if (editable && ed.heading) {
    html += `<h1 class="editable" data-edit="heading" title="Click to rename">${esc(instance.heading)}</h1>`;
  } else {
    html += `<h1>${esc(instance.heading)}</h1>`;
  }
  html += `</div>`;

  // Chart grid
  html += `<div class="chart-content" style="${gridStyle}">`;

  // Points cell — sits in column 1, alongside the day headers to its right
  const pointsLabel = instance.pointsLabel || "Chore Points:";
  const labelEditable = editable && ed.pointsLabel;
  html += `<div class="points-container">
        ${
          labelEditable
            ? `<span class="editable" data-edit="points-label">${esc(pointsLabel)}</span>`
            : `<span>${esc(pointsLabel)}</span>`
        }
        <div class="points-total"></div>
    </div>`;

  // Day header row
  visibleDays.forEach((day) => {
    const canEdit = editable && ed.days;
    html += `<div class="day${canEdit ? " editable" : ""}" data-day-id="${esc(day.id)}"${canEdit ? ` data-edit="day-label"` : ""}>`;
    html += esc(day.label);
    if (canEdit) {
      html += ` <button type="button" class="day-hide-btn" data-action="hide-day" data-day-id="${esc(day.id)}" title="Hide this day">×</button>`;
    }
    html += `</div>`;
  });

  // Time sections + chore rows
  const timesToRender = editable
    ? instance.times
    : instance.times.filter((t) =>
        instance.chores.some((c) => c.time === t.label),
      );

  timesToRender.forEach((time) => {
    const chores = instance.chores.filter((c) => c.time === time.label);
    const timeClass = (time.label || "").toLowerCase().replace(/\s+/g, "-");
    const canEditTime = editable && ed.times;

    html += `<div class="${esc(timeClass)} time-section full-row" data-time-id="${esc(time.id)}">`;
    if (time.img) html += `<img src="${esc(time.img)}" alt="">`;
    if (canEditTime) {
      html += `<span class="editable" data-edit="time-label" data-time-id="${esc(time.id)}">${esc(time.label)}</span>`;
      html += ` <button type="button" class="time-remove-btn" data-action="remove-time" data-time-id="${esc(time.id)}" title="Remove section">×</button>`;
    } else {
      html += `<span>${esc(time.label)}</span>`;
    }
    html += `</div>`;

    chores.forEach((chore) => {
      html += renderChoreRow(chore, dayLabels, editable, choreEd, ed);
    });

    if (editable && ed.addRemoveChores) {
      html += `<div class="add-chore-row full-row">
                <button type="button" data-action="add-chore" data-time-id="${esc(time.id)}">+ Add chore</button>
            </div>`;
    }
  });

  // Bottom "add time section" row
  if (editable && ed.times) {
    html += `<div class="add-time-row full-row">
            <button type="button" data-action="add-time">+ Add time section</button>
        </div>`;
  }

  html += `</div>`; // chart-content

  // Hidden-days re-show controls
  if (editable && ed.days) {
    const hidden = instance.days.filter((d) => d.visible === false);
    if (hidden.length) {
      html += `<div class="hidden-days">Hidden days: `;
      hidden.forEach((d) => {
        html += `<button type="button" data-action="show-day" data-day-id="${esc(d.id)}">Show ${esc(d.label)}</button> `;
      });
      html += `</div>`;
    }
    html += `<div class="add-day-row">
            <button type="button" data-action="add-day">+ Add day</button>
        </div>`;
  }

  return html;
}

function renderChoreRow(chore, dayLabels, editable, choreEd, ed) {
  let html = "";
  const idAttr = `data-chore-id="${esc(chore.id)}"`;

  // Chore label cell
  html += `<div class="chore" ${idAttr}>`;

  if (editable && ed.reorderChores) {
    html += `<span class="drag-handle" draggable="true" title="Drag to reorder">⋮⋮</span>`;
  }

  if (editable && choreEd.name) {
    html += `<span class="chore-name editable" data-edit="chore-name" ${idAttr}>${esc(chore.name || "(unnamed)")}</span>`;
  } else {
    html += `<span class="chore-name">${esc(chore.name)}</span>`;
  }

  if (editable && choreEd.time) {
    html += `<select class="chore-time-select" data-edit="chore-time" ${idAttr} title="Time section">`;
    // Options are populated by the editor after render (needs times list); render placeholder
    html += `<option value="${esc(chore.time)}" selected>${esc(chore.time)}</option>`;
    html += `</select>`;
  }

  if (editable && choreEd.points) {
    html += `<span class="points editable" data-edit="chore-points" ${idAttr}>${esc(chore.points)}</span>`;
  } else {
    html += `<span class="points">${esc(chore.points)}</span>`;
  }

  if (editable && ed.addRemoveChores) {
    html += ` <button type="button" class="chore-remove-btn" data-action="remove-chore" ${idAttr} title="Remove chore">×</button>`;
  }

  html += `</div>`;

  // Day cells
  dayLabels.forEach((label) => {
    const scheduled = chore.days.includes(label);
    const mult = chore.multipliers?.[label];
    let cls,
      content = "";
    if (!scheduled) {
      cls = "filled";
    } else if (mult) {
      cls = "multiplier";
      // Split "x" prefix from the number so only the number is inline-editable.
      const numHtml =
        editable && choreEd.multipliers
          ? `<span class="multiplier-value editable" data-edit="multiplier" data-chore-id="${esc(chore.id)}" data-day-label="${esc(label)}">${esc(mult)}</span>`
          : `<span class="multiplier-value">${esc(mult)}</span>`;
      content = `<span class="multiplier-prefix">x</span>${numHtml}`;
    } else {
      cls = "empty";
    }
    const cellEditable = editable && (choreEd.days || choreEd.multipliers);
    html += `<div class="${cls}${cellEditable ? " cell-editable" : ""}"`;
    html += ` data-chore-id="${esc(chore.id)}" data-day-label="${esc(label)}"`;
    if (cellEditable) html += ` data-edit="day-cell"`;
    html += ` title="${cellEditable ? "Click to cycle scheduled → multiplier → blocked. Click the number to edit it." : ""}">`;
    html += content;
    html += `</div>`;
  });

  return html;
}
