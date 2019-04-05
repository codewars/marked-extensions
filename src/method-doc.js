import { escapeHtml } from './strings';


export function methodDoc(code, language) {
  try {
    let json = JSON.parse(code);

    // support language specific overrides
    if (json.languages && json.languages[language]) {
      Object.assign(json, json.languages[language]);
    }

    const md = [];

    if (!json.examplesOnly) {
      if (json.method) {
        md.push(methodHeader(json));
      }
      if (json.desc) {
        md.push(json.desc);
      }

      md.push('```%doc');

      if (json.args) {
        md.push('Parameters:');
        md.push(parameters(json));
      }
      md.push('Return Value:');
      md.push(returnType(json));
      if (json.constraints && json.constraints.length) {
        md.push('Constraints:');
        md.push(json.constraints.join('\n'));
      }
      if (json.errors && json.errors.length) {
        md.push('Errors:');
        md.push(json.errors.join('\n'));
      }
      md.push('```');
    }

    if (json.examples && json.examples.length) {
      md.push('```%doc-block');
      md.push('#### Examples');
      md.push(exampleHeader(json));
      md.push(exampleRows(json));
      md.push('```');
    }

    return md.join('\n');
  }
  catch (ex) {
    return '`Failed to render %jsonblock: ' + ex.message + '`';
  }
}

function hasExampleNames(json) {
  return json.examples && json.examples.filter(e => !!e.name).length > 0;
}
function exampleRows(json) {
  const hasExamples = hasExampleNames(json);
  return json.examples.map(v => exampleRow(json, v, hasExamples)).join('\n');
}

function exampleRow(json, example, hasExamples) {
  let md = '';
  if (hasExamples) {
    const name = example.name;
    md = `*${name || 'Example'}*|`;
  }

  if (example.args) {
    md += example.args.map(arg => formatExampleValue(arg)).join('|');
  }
  md += `|${formatExampleValue(example.returns) || ''}`;
  return md;
}

function formatExampleValue(value) {
  return `<code>${JSON.stringify(value)}</code>`;
}

function exampleHeader(json) {
  const line1 = [];
  const line2 = [];
  if (hasExampleNames(json)){
    line1.push('|');
    line2.push('');
  }

  Object.keys(getArgs(json)).forEach(key => {
    line1.push(key)
    line2.push('');
  });
  line1.push('Return Value');
  return `${line1.join('|')}\n-${line2.join('|-')}|-`;
}

function getArgs(json) {
  return json.args || json.params || json.parameters || {};
}

function methodName(json) {
  let globalName = json.global !== false ? `@@docGlobal:${json.global || 'Challenge'}.` : '';
  // if a class is provided, it will always be shown and overrides global
  if (json.class) {
    globalName = `@@docClass:${json.class}.`;
  }

  return `${globalName}@@docMethod:${json.method}`;
}

function methodHeader(json) {
  const args = Object.keys(getArgs(json)).map(key => `\`@@docName:${key}\``);
  return `### \`${methodName(json)}\`(${args.join(', ')})`;
}

function parameters(json) {
  const args = getArgs(json);
  const params = Object.keys(args).map(key => {
    const arg = args[key];
    const type = typeof arg === 'string' ? arg : arg.type;
    let md = `@@docName:${key}: ${formatDocType(json, type, 'String')}`;
    if (arg.desc) {
      md += ` - ${arg.desc}`;
    }

    return md;
  });

  return params.join('\n');
}

function returnType(json) {
  if (json.returns) {
    const type = typeof json.returns === 'string' ? json.returns : json.returns.type;
    let md = formatDocType (json, type, 'void');
    if (json.returns.desc) {
      md += ` - ${json.returns.desc}`;
    }

    return md;
  }
  return '@@docType:void';
}

function formatDocType(json, type, defaultValue) {
  if (json.formatTypes === false) {
    return `<dfn class="doc-type">${escapeHtml(type)}</dfn>`;
  }
  else {
    return `@@docType:${type || defaultValue || 'null'}`
  }
}
