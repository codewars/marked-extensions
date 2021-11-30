import { escapeHtml } from './strings';
import { docGlobal } from './doc-tokens/doc-globals';
import { docName, docClass, docMethod } from './doc-tokens/doc-names';
import { docType } from './doc-tokens/doc-types';

export function methodDoc(code, language, render) {
  try {
    const json = JSON.parse(code);

    // support language specific overrides
    if (json.languages && json.languages[language]) {
      Object.assign(json, json.languages[language]);
    }

    const html = [];

    if (!json.examplesOnly) {
      if (json.method) {
        html.push(methodHeader(json, language));
      }
      if (json.desc) {
        html.push(render(json.desc));
      }

      html.push(`<div class="block block--doc">`);
      html.push(`<dl>`);
      if (json.args) {
        html.push(`<dt>Parameters</dt>`);
        html.push(parameters(json, language).map(markdownDefD(render)).join('\n'));
      }

      html.push(`<dt>Return Value</dt>`);
      html.push(`<dd>`);
      html.push(render(returnType(json, language)));
      html.push(`</dd>`);

      if (json.constraints && json.constraints.length) {
        html.push(`<dt>Constraints</dt>`);
        html.push(json.constraints.map(markdownDefD(render)).join('\n'));
      }
      if (json.errors && json.errors.length) {
        html.push(`<dt>Errors</dt>`);
        html.push(json.errors.map(markdownDefD(render)).join('\n'));
      }

      html.push(`</dl>`);
      html.push(`</div>`);
    }

    if (json.examples && json.examples.length) {
      html.push(`<div class="block block--doc-block">`);
      html.push(`<h4>Examples</h4>`);
      html.push(`<table>`);
      html.push(`<thead>`);
      html.push(exampleHeader(json));
      html.push(`</thead>`);
      html.push(`<tbody>`);
      html.push(exampleRows(json));
      html.push(`</tbody>`);
      html.push(`</table>`);
      html.push(`</div>`);
    }

    return html.join('\n');
  } catch (ex) {
    return `<code>Failed to render %method-doc: ${escapeHtml(ex.message)}</code>`;
  }
}

const markdownDefD = (render) => (dd) => `<dd>${render(dd)}</dd>`;

function hasExampleNames(json) {
  return json.examples && json.examples.filter((e) => !!e.name).length > 0;
}

function exampleRows(json) {
  const hasExamples = hasExampleNames(json);
  return json.examples.map((v) => `<tr>${exampleRow(v, hasExamples)}</tr>`).join('\n');
}

function exampleRow(example, hasExamples) {
  const tds = [];
  if (hasExamples) {
    tds.push(`<em>${example.name || 'Example'}</em>`);
  }
  if (example.args) tds.push(...example.args.map(formatExampleValue));
  tds.push(formatExampleValue(example.returns) || '');
  return tds.map((t) => `<td>${t}</td>`).join('');
}

function formatExampleValue(value) {
  return `<code>${JSON.stringify(value)}</code>`;
}

function exampleHeader(json) {
  const keys = hasExampleNames(json) ? [''] : [];
  keys.push(...Object.keys(getArgs(json)));
  keys.push('Return Value');
  return `<tr>${keys.map((k) => `<th>${k}</th>`).join('')}</tr>`;
}

function getArgs(json) {
  return json.args || json.params || json.parameters || {};
}

function methodName(json, language) {
  // if a class is provided, it will always be shown and overrides global
  const prefix = json.class
    ? docClass(json.class, language)
    : json.global !== false
    ? docGlobal(json.global || 'Challenge', language)
    : '';
  return `${prefix}${prefix ? '.' : ''}${docMethod(json.method, language)}`;
}

function methodHeader(json, language) {
  const args = Object.keys(getArgs(json)).map((key) => `<code>${docName(key, language)}</code>`);
  return `<h3><code>${methodName(json, language)}</code>(${args.join(', ')})</h3>`;
}

function parameters(json, language) {
  const args = getArgs(json);
  return Object.keys(args).map((key) => {
    const arg = args[key];
    const type = typeof arg === 'string' ? arg : arg.type;
    const md = `${docName(key, language)}: ${formatDocType(json, type, 'String', language)}`;
    return md + (arg.desc ? ` - ${arg.desc}` : '');
  });
}

function returnType(json, language) {
  if (json.returns) {
    const type = typeof json.returns === 'string' ? json.returns : json.returns.type;
    const md = formatDocType(json, type, 'void', language);
    return md + (json.returns.desc ? ` - ${json.returns.desc}` : '');
  }
  return docType('void', language);
}

function formatDocType(json, type, defaultValue, language) {
  if (json.formatTypes === false) {
    return `<dfn class="doc-type">${escapeHtml(type)}</dfn>`;
  }
  return docType(type || defaultValue || 'null', language);
}
