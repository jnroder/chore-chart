import { newId } from "../util/id.js";
import { Chore } from "./Chore.js";

/**
 * A ChartInstance is the in-memory + persisted state of a user's chart.
 * Templates produce these; the Editor mutates them; IndexedDB saves them.
 */
export class ChartInstance {
  constructor({
    id,
    templateId,
    name = "Untitled chart",
    heading = "",
    days = [],
    times = [],
    chores = [],
    createdAt,
    updatedAt,
  } = {}) {
    const now = Date.now();
    this.id = id || newId();
    this.templateId = templateId || "";
    this.name = name;
    this.heading = heading;
    this.days = days.map((d) => ({ ...d }));
    this.times = times.map((t) => ({ ...t }));
    this.chores = chores.map((c) => (c instanceof Chore ? c : new Chore(c)));
    this.createdAt = createdAt || now;
    this.updatedAt = updatedAt || now;
  }

  toJSON() {
    return {
      id: this.id,
      templateId: this.templateId,
      name: this.name,
      heading: this.heading,
      days: this.days.map((d) => ({ ...d })),
      times: this.times.map((t) => ({ ...t })),
      chores: this.chores.map((c) => c.toJSON()),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  static fromJSON(obj) {
    return new ChartInstance(obj || {});
  }

  /** Deep-clone a template into a fresh instance (new ids everywhere). */
  static fromTemplate(template, { name } = {}) {
    const defaults = template.defaults || {};
    return new ChartInstance({
      templateId: template.id,
      name: name || `${template.name} chart`,
      heading: defaults.heading || template.name || "",
      days: (defaults.days || []).map((d) => ({ ...d, id: newId() })),
      times: (defaults.times || []).map((t) => ({ ...t, id: newId() })),
      chores: (defaults.chores || []).map(
        (c) => new Chore({ ...c, id: newId() }),
      ),
    });
  }

  /** Sum of scheduled cells (points × multiplier) across all chores. */
  totalPoints() {
    let total = 0;
    const visibleLabels = new Set(
      this.days.filter((d) => d.visible !== false).map((d) => d.label),
    );
    for (const chore of this.chores) {
      const p = Number(chore.points) || 0;
      for (const dayLabel of chore.days) {
        if (!visibleLabels.has(dayLabel)) continue;
        const mult = Number(chore.multipliers?.[dayLabel]) || 1;
        total += p * mult;
      }
    }
    return total;
  }
}
