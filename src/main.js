import { defineRoute, startRouter } from "./router.js";
import { renderHome } from "./views/HomeView.js";
import { renderTemplatePicker } from "./views/TemplatePickerView.js";
import { renderEditor } from "./views/EditorView.js";

defineRoute("/", renderHome);
defineRoute("/new", renderTemplatePicker);
defineRoute("/edit/:id", renderEditor);

const root =
  document.getElementById("app") || document.getElementById("chart-container");
startRouter(root);
