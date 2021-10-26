export function tableDoc(code) {
  try {
    let json = JSON.parse(code);
    const html = [];

    if (json.table) {
      html.push(`<h3>${json.table}</h3>`);
    }

    if (json.desc) {
      html.push(`<p>${json.desc}</p>`);
    }

    html.push('<table>');
    html.push('<thead><tr><th>Column</th><th>Type</th></tr></thead>');
    if (json.columns) {
      html.push('<tbody>');
      html.push(tableHeaders(json.columns));
      html.push('</tbody>');
    }

    html.push('</table>');
    return html.join('\n');
  } catch (ex) {
    return '`failed to render %jsonblock: `' + ex.message + '`';
  }
}

const tableHeaders = (json) =>
  Object.keys(json)
    .map((k) => `<tr><td>${k}</td><td>${json[k]}</td></tr>`)
    .join('\n');
