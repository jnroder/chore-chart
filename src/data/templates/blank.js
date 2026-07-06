import { ALL_EDITABLE } from "../templateSchema.js";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

/** @type {import('../templateSchema.js').Template} */
export const blankTemplate = {
  id: "blank",
  name: "Blank Chart",
  description:
    "A blank 7-day chart with Morning/Afternoon/Night. Add your own chores.",
  defaults: {
    heading: "My Chore Chart",
    days: DAYS.map((label) => ({ label, visible: true })),
    times: [
      { label: "Morning", img: "img/morning.png" },
      { label: "Afternoon", img: "img/afternoon.png" },
      { label: "Night", img: "img/night.png" },
    ],
    chores: [],
  },
  editability: { ...ALL_EDITABLE, chore: { ...ALL_EDITABLE.chore } },
};
