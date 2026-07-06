/**
 * @typedef {Object} DayDef
 * @property {string} id
 * @property {string} label   - Display name (e.g. "Monday")
 * @property {boolean} visible
 */

/**
 * @typedef {Object} TimeDef
 * @property {string} id
 * @property {string} label   - Display name (e.g. "Morning")
 * @property {string} [img]   - Optional icon path
 */

/**
 * @typedef {Object} ChoreData
 * @property {string} id
 * @property {string} name
 * @property {number} points
 * @property {string} time    - Matches a TimeDef.label
 * @property {string[]} days  - Subset of DayDef.label
 * @property {Object<string, number>} multipliers - day label -> multiplier
 */

/**
 * @typedef {Object} ChartInstanceData
 * @property {string} id
 * @property {string} templateId
 * @property {string} name          - User-facing instance name
 * @property {string} heading       - Chart title displayed on chart
 * @property {DayDef[]} days
 * @property {TimeDef[]} times
 * @property {ChoreData[]} chores
 * @property {number} createdAt
 * @property {number} updatedAt
 */

/**
 * @typedef {Object} ChoreEditability
 * @property {boolean} name
 * @property {boolean} points
 * @property {boolean} time
 * @property {boolean} days
 * @property {boolean} multipliers
 */

/**
 * @typedef {Object} Editability
 * @property {boolean} heading
 * @property {boolean} days             - can rename/hide days
 * @property {boolean} times            - can rename/add/remove time sections
 * @property {boolean} addRemoveChores
 * @property {boolean} reorderChores
 * @property {ChoreEditability} chore
 */

/**
 * @typedef {Object} Template
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {Omit<ChartInstanceData, 'id'|'templateId'|'name'|'createdAt'|'updatedAt'>} defaults
 * @property {Editability} editability
 */

export const ALL_EDITABLE = Object.freeze({
  heading: true,
  days: true,
  times: true,
  addRemoveChores: true,
  reorderChores: true,
  chore: {
    name: true,
    points: true,
    time: true,
    days: true,
    multipliers: true,
  },
});
