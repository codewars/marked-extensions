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
        console.log(td.join('\n'));
        return td.join('\n');
        
    }
    catch (ex) {
        console.log(ex);
        return '`failed to render %jsonblock: `' + ex.message + '`';
    }
}

function tableData(json){
    let data = [];
    json.map(elem => '<tr>' + elem.map(a => `<td>${a}</td>`).join('') + '</tr>').join('\n');
    return data.map((a) => a.join('')).join('\n');
}

function tableHeaders(json) {
    const data = Object.keys(json).map(key => `<td>${key}</td>`);
    const val = Object.values(json).map(key => `<td>${key}</td>`);
    let arr = [];
    for(var i=0; i < data.length; i++ ){
        arr.push(`<tr>`);
        arr.push(data[i]);
        arr.push(val[i]);
        arr.push(`</tr>`);
    }
    // const column1 = Object.keys(json).map(key => `<td>${key}</td>`);
    // column1.push(Object.values(json).map((val) => `<td>${val}</td>`));
    return arr.join('\n');
}
