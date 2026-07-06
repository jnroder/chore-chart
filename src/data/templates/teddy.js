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

function dayStringToArray(dayString) {
  const days = [];
  if (dayString.includes("m")) days.push("Monday");
  if (dayString.includes("t") && dayString[dayString.indexOf("t") + 1] !== "h")
    days.push("Tuesday");
  if (dayString.includes("w")) days.push("Wednesday");
  if (dayString.includes("th")) days.push("Thursday");
  if (dayString.includes("f")) days.push("Friday");
  if (dayString.includes("s") && dayString[dayString.indexOf("s") + 1] !== "u")
    days.push("Saturday");
  if (dayString.includes("su")) days.push("Sunday");
  return days;
}

/** @type {import('../templateSchema.js').Template} */
export const teddyTemplate = {
  id: "teddy",
  name: "Teddy's Good Habits",
  description:
    "The original chart: morning/afternoon/night sections with fixed day labels.",
  defaults: {
    heading: "Teddy's Good Habits Chart",
    days: DAYS.map((label) => ({ label, visible: true })),
    times: [
      { label: "Morning", img: "img/morning.png" },
      { label: "Afternoon", img: "img/afternoon.png" },
      { label: "Night", img: "img/night.png" },
    ],
    chores: [
      { name: "Make your bed", points: 5, time: "Morning", days: [...DAYS] },
      { name: "Brush your teeth", points: 5, time: "Morning", days: [...DAYS] },
      { name: "Get Dressed", points: 5, time: "Morning", days: [...DAYS] },

      {
        name: "Put away your clothes",
        points: 5,
        time: "Afternoon",
        days: [...DAYS],
        multipliers: { Saturday: 2 },
      },
      {
        name: "Pick up toys in the house",
        points: 5,
        time: "Afternoon",
        days: dayStringToArray("mwfs"),
        multipliers: { Saturday: 2 },
      },
      {
        name: "Clean your room",
        points: 20,
        time: "Afternoon",
        days: ["Saturday"],
      },
      {
        name: "Vacuum couch & chairs",
        points: 10,
        time: "Afternoon",
        days: ["Saturday"],
      },
      {
        name: "Water the plants",
        points: 5,
        time: "Afternoon",
        days: dayStringToArray("thsu"),
        multipliers: { Sunday: 2 },
      },

      {
        name: "Read a book for 10 minutes",
        points: 5,
        time: "Night",
        days: [...DAYS],
      },
      {
        name: "Take a bath or shower",
        points: 5,
        time: "Night",
        days: [...DAYS],
      },
      { name: "Brush your teeth", points: 5, time: "Night", days: [...DAYS] },
    ],
  },
  editability: {
    ...ALL_EDITABLE,
    days: false, // day labels are fixed
    times: false, // time sections are fixed
    chore: { ...ALL_EDITABLE.chore },
  },
};
