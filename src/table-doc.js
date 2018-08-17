export function tableDoc(code) {
  try {
    let json = JSON.parse(code);
    const td = [];

    td.push('<table>');
    td.push('<tr><th>Name</th><th>Type</th></tr>');

    if(json.columns){
      td.push(tableHeaders(json.columns));
    }

    td.push('</table>');
    return td.join('\n');
  }
  catch (ex) {
    return '`failed to render %jsonblock: `' + ex.message + '`';
  }
}

const tableHeaders = json =>
  Object.keys(json)
  .map(k => `<tr><td>${k}</td><td>${json[k]}</td></tr>`)
  .join('\n');
