import { escapeHTML } from './strings';

export function tableDoc(code) {
    try {
        let json = JSON.parse(code);
        // support language specific overrides
        // if (json.languages && json.langauges[language]) {
        //     Object.assign(json, json.languages[language]);
        // }
        
        const td = [];

        td.push(`<table>`);
        td.push(`<tr><th>Name</th><th>Type</th></tr>`);
        
        if(json.columns){
            td.push(tableHeaders(json.columns));
        }
        // if(json.example){
        //     td.push(tableData(json.data));
        // }

        td.push(`</table>`);
        return td.join('\n');

    }
    catch (ex) {
        console.log(ex);
        return '`failed to render %jsonblock: `' + ex.message + '`';
    }
}

function tableData(json) {
    return json.map(elem => '<tr>' + elem.map(a => `<td>${a}</td>`).join('') + '</tr>').join('\n');
}

const tableHeaders = json =>
  Object.keys(json)
    .map(k => `<tr><td>${k}</td><td>${json[k]}</td></tr>`)
    .join('\n');
