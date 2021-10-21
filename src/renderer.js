import { assignMissing } from './objects'
import { processDocTokens } from './doc-tokens'
import { methodDoc } from './method-doc';
import { tableDoc } from './table-doc';

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
      else if (result.extensions.indexOf(language) >= 0) {
        return handleExtension(options, code, language);
      }
      else if (language === '%definitions' || language === '%doc') {
        return wrapInBlockDiv(language, renderDefinitions(result, code, render));
      }
      else if (language === '%method-doc') {
        return wrapInBlockDiv('docs method-doc', render(methodDoc(code, result.originalLanguage)));
      }
      else if (language === '%table-doc') {
        return wrapInBlockDiv('docs table-doc', tableDoc(code))
      }
      else if (language[ 0 ] === '%') {
        return wrapInBlockDiv(language, result.render(code));
      }

      // at this point just assume that whatever is left is a language that needs to be formatted
      const codeLanguage = language.split(':')[0]

      if (codeLanguage) {
        // if filtering is enabled and this is not the active language then filter it out
        if (options.filterLanguages && codeLanguage !== result.language && result.language) {
          return '';
        }
      }
    }

    return wrapLanguage(options, _code.call(result.renderer, code, language), language);
  }
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

function wrapInBlockDiv(type, contents) {
  return `<div class="block block--${type.replace(/^%/, '')}">${contents}</div>`;
}

function matchIfBlockLanguage(result, language) {
  return language.replace(/^if(-not)?: ?/, '').split(',').indexOf(result.originalLanguage) >= 0;
}

/**
 * If the extension value is a function, it will treat it as a render function, otherwise it will
 * assume the extension value is a string and treat it as a template with {code} as the code placeholder.
 * @param options
 * @param code
 * @param language
 */
function handleExtension(options, code, language) {
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
