export function replaceDocGlobals (language, content) {
  return content.replace(/@@docGlobal: ?.*`?/g, function (value) {
    switch (language) {
      // languages which should keep the global class
      case 'java':
      case 'csharp':
        return wrap(value.replace(/@@docGlobal: ?/, ''))

      // all other languages remove the global class
      default:
        return wrap(value.replace(/@@docGlobal: ?[a-zA-Z\d]*\./, ''))
    }
  })
}

function wrap (value) {
  return `<dfn class="doc-method">${value}</dfn>`
}
