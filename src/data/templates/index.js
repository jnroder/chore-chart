import { teddyTemplate } from "./teddy.js";
import { blankTemplate } from "./blank.js";
import { weekendOnlyTemplate } from "./weekend-only.js";

export const templates = [teddyTemplate, blankTemplate, weekendOnlyTemplate];

export const templatesById = Object.fromEntries(
  templates.map((t) => [t.id, t]),
);

export function getTemplate(id) {
  return templatesById[id] || null;
}

export { teddyTemplate, blankTemplate, weekendOnlyTemplate };
