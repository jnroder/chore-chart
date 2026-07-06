import { newId } from "../util/id.js";

const DEFAULT_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export class Chore {
  /**
   * @param {object} opts
   * @param {string} [opts.id]
   * @param {string} opts.name
   * @param {number} opts.points
   * @param {string} opts.time - Time-of-day label (matches a ChartInstance time.label)
   * @param {string[]} opts.days - Day labels this chore is scheduled on
   * @param {Object<string, number>} [opts.multipliers] - map of day label -> multiplier
   */
  constructor({ id, name, points, time, days, multipliers } = {}) {
    this.id = id || newId();
    this.name = name || "";
    this.points = Number.isFinite(points) ? points : Number(points) || 0;
    this.time = time || "";
    this.days = Array.isArray(days) ? [...days] : [];
    this.multipliers = { ...(multipliers || {}) };
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      points: this.points,
      time: this.time,
      days: [...this.days],
      multipliers: { ...this.multipliers },
    };
  }

  static fromJSON(obj) {
    return new Chore(obj || {});
  }

  /** Expand a legacy `'all'` days spec against a list of day labels. */
  static expandDays(days, allDayLabels = DEFAULT_DAYS) {
    if (days === "all") return [...allDayLabels];
    if (Array.isArray(days)) return [...days];
    return [];
  }
}
