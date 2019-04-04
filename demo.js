import { process } from "./src/index";

const editor = CodeMirror.fromTextArea(document.getElementById("input"), {
  lineNumbers: false,
  theme: "default",
  keyMap: "default",
  mode: "markdown"
});

function onChange(cm) {
  const result = process(marked, cm.getValue(), {});
  document.getElementById("output").innerHTML = result.html();
}

editor.on("change", onChange);
// render default text
onChange(editor);
