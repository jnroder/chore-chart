import { ALL_EDITABLE } from "../templateSchema.js";

/** @type {import('../templateSchema.js').Template} */
export const weekendOnlyTemplate = {
  id: "weekend-only",
  name: "Weekend Chores",
  description:
    "Saturday and Sunday only, one time slot. Great for weekend-only routines.",
  defaults: {
    heading: "Weekend Chores",
    days: [
      { label: "Saturday", visible: true },
      { label: "Sunday", visible: true },
    ],
    times: [{ label: "Anytime", img: "" }],
    chores: [],
  },
  editability: { ...ALL_EDITABLE, chore: { ...ALL_EDITABLE.chore } },
};
