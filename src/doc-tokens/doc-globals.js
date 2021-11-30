export function replaceDocGlobals(language, pre, content) {
  return content.replace(/@@docGlobal: ?.*`?/g, function (value) {
    switch (language) {
      // languages which should keep the global class
      case 'java':
      case 'csharp':
      case 'scala':
        return wrap(value.replace(/@@docGlobal: ?/, ''), pre);

      // all other languages remove the global class
      default:
        return wrap(value.replace(/@@docGlobal: ?[a-zA-Z\d]*\./, ''), pre);
    }
  });
}

function wrap(value, pre) {
  return pre ? value : `<dfn class="doc-class">${value}</dfn>`;
}
