import { assignMissing } from './objects'
import { processDocTokens } from './doc-tokens'

export function buildRenderer(marked, options, result) {
  const renderer = result.renderer = new marked.Renderer();

  const markedOptions = { renderer };
  assignMissing(markedOptions, options.marked || {});

  // provide the render method, this will also be used later to render nested blocks
  result.render = (md) => marked(md, markedOptions);

  setupHeader(renderer, options, result);
  setupCode(options, result);
}

/**
 *
 * @param renderer
 */
function setupHeader(renderer, options, result) {
  // heading extensions
  renderer.heading = function (text, level) {
    // you can set icons via icon::name
    const icon = text.match(/icon::([a-z-]*)/);
    let attributes = '';
    if (icon) {
      // indicate that this icon has been used
      result.icons[icon[1]] = true;

      attributes = ` class="${options.iconClassPrefix}${icon[1]}"`;
      text = text.replace(/icon::[a-z-]*/, '');
    }

    // we track headers 1 - 4 and add ids to them so that we can link to them later if we want to
    if (level < 5) {
      const header = result.headers[`h${level}`];
      const index = header.length;
      attributes += ` id="h${level}_${index}"`;
      header.push(text);
    }

    return `<h${level}${attributes}>${text}</h${level}>`;
  }
}

/**
 * Handles code blocks in a variety of ways
 * @param options
 * @param result
 */
function setupCode(options, result) {
  const _code = result.renderer.code;

  // special version of render that will process doc tokens. Needed at times when
  // tokens are nested inside of pre and should be rendered without tags (but their labels should still be processed)
  const render = (code, preTokens) => {
    if (preTokens && options.docTokens) {
      code = processDocTokens(result, code, true);
    }

    return result.render(code);
  }


  result.renderer.code = function(code, language) {
    if (language) {
      if (language.match(/^if:/)) {
        return matchIfBlockLanguage(result, language) ? render(code) : '';
      }
      else if (language.match(/^if-not:/)) {
        return matchIfBlockLanguage(result, language) ? '' : render(code);
      }
      else if (language.match(/^tab:/)) {
        return handleTab(result, code, language);
      }
      else if (result.extensions.indexOf(language) >= 0) {
        return handleExtension(options, result, code, language);
      }
      else if (language === '%definitions' || language === '%doc') {
        return wrapInBlockDiv(language, renderDefinitions(result, code, render));
      }
      else if (language[0] === '%') {
        return wrapInBlockDiv(language, result.render(code));
      }

      // process line numbers, if they are set (i.e. ruby:10)
      if (options.lineNumbers) {
        code = lineNumbers(options, code, language);
      }

      // make sure this is a language and not some random tag
      const foundLanguage = options.findLanguage(language.split(':')[0]);

      if (foundLanguage) {
        // if filtering is enabled and this is not the active language then filter it out
        if (options.filterLanguages && foundLanguage !== result.language) {
          return '';
        }

        // if CodeMirror is provided then highlight using that instead
        if (options.cm) {
          return highlightCM(options, code, foundLanguage, language);
        }
      }
    }

    return wrapLanguage(options, _code.call(result.renderer, code, language), language);
  }
}

function lineNumbers(options, code, language) {
  let lineNumber = getLineNumber(language);

  // if there are line numbers, then add them now starting at the start index
  if (lineNumber > 0) {
    code = code.split('\n').map(line => {
      // pad out the spaces
      // TODO: this code is naive and can only handle line numbers less than 999
      let spaces = lineNumber < 10 ? '  ' : (lineNumber < 100 ? ' ' : '')
      return `${spaces}${lineNumber++} ${line}`
    }).join('\n');
  }

  return code;
}

function wrapLanguage(options, code, language) {
  // if we have reached this point then CM isn't enabled and we need to
  if (language && options.languageWrapper) {
    if (typeof options.languageWrapper === 'function') {
      code = options.languageWrapper(code, language);
    }
    else {
      code = options.languageWrapper.replace('{slot}', code);
    }
  }

  return code;
}

function highlightCM(options, code, language, raw) {
  let lineNumber = options.lineNumbers ? getLineNumber(raw) : null;
  const el = window.document.createElement('div');
  options.cm.runMode(code, options.findMode(language), el);

  const lnHtml = lineNumber > 0 ? `<div class="${options.lineNumbersGutter}"></div>` : '';
  const result = `<pre class="cm-runmode cm-s-${options.theme}"><code>${lnHtml}${el.innerHTML}</code></pre>`;
  return wrapLanguage(options, result, language);
}

function getLineNumber(language) {
  const parts = language.split(':');
  return parts.length > 1 ? parseInt(parts[1], 10) : null;
}

function wrapInBlockDiv(type, contents) {
  return `<div class="block block--${type.replace(/^%/, '')}">${contents}</div>`;
}

function matchIfBlockLanguage(result, language) {
  return language.replace(/^if(-not)?: ?/, '').split(',').indexOf(result.originalLanguage) >= 0;
}

function handleTab(result, code, language) {
  // parts should be up to tab:LABEL with language being optional
  const parts = language.split(':');
  let label = parts[1].replace(/\+/g, ' ');
  result.tabs[label] = `${result.render(code)}`;
  return '';
}

/**
 * If the extension value is a function, it will treat it as a render function, otherwise it will
 * assume the extension value is a string and treat it as a template with {code} as the code placeholder.
 * @param options
 * @param code
 * @param language
 */
function handleExtension(options, result, code, language) {
  const ext = options.extensions[language]

  if (typeof ext.code === 'function') {
    return ext.code(code, options);
  }
  else {
    return ext.code.replace('{code}', code);
  }
}

/**
 *
 * @param result
 * @param code
 * @returns {string}
 */
function renderDefinitions (result, code, render) {
  var html = '<dl>';
  if (code) {
    code.split('\n').forEach(line => {
      if (line.match(/^#/)) {
        html += render(line);
      }
      else if (line.match(/: *$/)) {
        html += `<dt>${line.replace(/:$/, '')}</dt>`;
      }
      else {
        // if line starts with 4 white spaces, a tab or a ` block, then consider it a pre tag and don't render dfn
        html += `<dd>${render(line, !!line.match(/^(\t|\s{4}|`)/))}</dd>`;
      }
    });
  }

  return html + '</dl>';
}
