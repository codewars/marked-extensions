export function jsonDoc(code) {
  try {
    let json = JSON.parse(code);
    const md = [methodName(json)];
    if (json.desc) {
      md.push(json.desc);
    }
    md.push('```%doc\nParameters:');
    md.push(parameters(json));
    md.push('Return Value:');
    md.push(returnType(json));
    if (json.constraints && json.constraints.length) {
      md.push('Constraints:');
      md.push(json.constraints.join('\n'));
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
  return json.examples.map(exampleRow).join('\n');
}

function exampleRow(example, index) {
  const name = example.name || `Example #${index+1}`;
  let md = `**${name}**|`;
  md += example.args.map(arg => JSON.stringify(arg)).join('|');
  md += `|${example.returns || ''}`;
  return md;
}

function exampleHeader(json) {
  const line1 = [''];
  const line2 = [''];
  Object.keys(getArgs(json)).forEach(key => {
    line1.push(key)
    line2.push('');
  });
  line1.push('returns');
  return `${line1.join('|')}\n-${line2.join('|-')}|-`;
}

function getArgs(json) {
  return json.args || json.params || json.parameters || {};
}

function methodName(json) {
  const args = Object.keys(getArgs(json)).map(key => `\`@@docName:${key}\``);
  return `### \`@@docGlobal:Challenge.@@docMethod:${json.method}\`(${args.join(', ')})`;
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
