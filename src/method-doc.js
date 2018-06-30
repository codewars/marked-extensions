export function methodDoc(code) {
  try {
    let json = JSON.parse(code);
    const md = [methodHeader(json)];
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

function exampleRows(json) {
  return json.examples.map((v, i) => exampleRow(json, v, i)).join('\n');
}

function exampleRow(json, example, index) {
  const name = example.name || `Ex. #${index+1}`;
  let md = `*${name}*|`;
  if (example.args) {
    md += example.args.map(arg => '`' + JSON.stringify(arg) + '`').join('|');
  }
  md += `|\`${JSON.stringify(example.returns) || ''}\``;
  return md;
}

function exampleHeader(json) {
  const line1 = [''];
  const line2 = [''];
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
    let md = `@@docName:${key}: @@docType:${type || 'String'}`;
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
    let md = `@@docType:${type || 'void'}`;
    if (json.returns.desc) {
      md += ` - ${json.returns.desc}`;
    }

    return md;
  }
  return '@@docType:void';
}
