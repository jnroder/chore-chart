import { getInstance } from "../db/idb.js";
import { ChartInstance } from "../classes/ChartInstance.js";
import { renderChart } from "../classes/ChartRenderer.js";

/**
 * Read-only, print-optimized view of a chart. Auto-invokes the browser
 * print dialog on mount so the user can print to paper or Save-as-PDF.
 */
export async function renderPrint(params, root) {
  const id = params.id;
  const data = await getInstance(id);
  if (!data) {
    root.innerHTML = `<div class="app-shell">
            <p>Chart not found. <a href="#/">Go home</a></p>
        </div>`;
    return;
  }
  const instance = ChartInstance.fromJSON(data);

  root.innerHTML = `<div class="app-shell print-shell">
        <div class="print-actions">
            <a href="#/" class="link-back">← Home</a>
            <button type="button" data-tb="print" class="primary">Print / Save as PDF</button>
        </div>
        <div class="chart-mount" id="chart-container">${renderChart(instance, { editable: false })}</div>
    </div>`;

  const onClick = (e) => {
    if (e.target.closest('[data-tb="print"]')) {
      window.print();
    }
  };
  root.addEventListener("click", onClick);

  // Auto-open the print dialog once layout is ready. Wrapping in rAF gives the
  // browser a tick to paint before opening the dialog (avoids blank previews).
  requestAnimationFrame(() => requestAnimationFrame(() => window.print()));

  return () => root.removeEventListener("click", onClick);
}
