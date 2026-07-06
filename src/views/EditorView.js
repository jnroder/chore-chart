import { getInstance } from "../db/idb.js";
import { ChartInstance } from "../classes/ChartInstance.js";
import { Editor } from "../classes/Editor.js";
import { getTemplate, blankTemplate } from "../data/templates/index.js";
import { ALL_EDITABLE } from "../data/templateSchema.js";

export async function renderEditor(params, root) {
  const id = params.id;
  const data = await getInstance(id);
  if (!data) {
    root.innerHTML = `<div class="app-shell">
            <p>Chart not found. <a href="#/">Go home</a></p>
        </div>`;
    return;
  }
  const instance = ChartInstance.fromJSON(data);
  const template = getTemplate(instance.templateId) || blankTemplate;
  const editability = template.editability || ALL_EDITABLE;

  root.innerHTML = `<div class="app-shell editor-shell">
        <div class="editor-toolbar-mount"></div>
        <div class="chart-mount" id="chart-container"></div>
    </div>`;

  const toolbarMount = root.querySelector(".editor-toolbar-mount");
  const chartMount = root.querySelector(".chart-mount");

  const editor = new Editor({
    instance,
    editability,
    toolbarMount,
    chartMount,
  });
  editor.mount();

  return () => editor.unmount();
}
