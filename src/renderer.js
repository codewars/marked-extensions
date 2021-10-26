import { assignMissing } from './objects';
import { processDocTokens } from './doc-tokens';
import { methodDoc } from './method-doc';
import { tableDoc } from './table-doc';

export function buildRenderer(marked, options, result) {
  const renderer = (result.renderer = new marked.Renderer());

  const markedOptions = { renderer };
  assignMissing(markedOptions, options.marked || {});

  // provide the render method, this will also be used later to render nested blocks
  result.render = (md) => marked(md, markedOptions);

  setupCode(options, result);
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
  };

  result.renderer.code = function (code, language) {
    if (language) {
      if (language.match(/^if:/)) {
        return matchIfBlockLanguage(result, language) ? render(code) : '';
      } else if (language.match(/^if-not:/)) {
        return matchIfBlockLanguage(result, language) ? '' : render(code);
      } else if (language === '%definitions' || language === '%doc') {
        return wrapInBlockDiv(language, renderDefinitions(result, code, render));
      } else if (language === '%method-doc') {
        return wrapInBlockDiv('docs method-doc', render(methodDoc(code, result.originalLanguage)));
      } else if (language === '%table-doc') {
        return wrapInBlockDiv('docs table-doc', tableDoc(code));
      } else if (language[0] === '%') {
        return wrapInBlockDiv(language, result.render(code));
      }
    }

    return wrapLanguage(options, _code.call(result.renderer, code, language), language);
  };
}

function wrapLanguage(options, code, language) {
  // if we have reached this point then CM isn't enabled and we need to
  if (language && options.languageWrapper) {
    if (typeof options.languageWrapper === 'function') {
      code = options.languageWrapper(code, language);
    } else {
      code = options.languageWrapper.replace('{slot}', code);
    }
  }

  return code;
}

function wrapInBlockDiv(type, contents) {
  return `<div class="block block--${type.replace(/^%/, '')}">${contents}</div>`;
}

function matchIfBlockLanguage(result, language) {
  return (
    language
      .replace(/^if(-not)?: ?/, '')
      .split(',')
      .indexOf(result.originalLanguage) >= 0
  );
}

/**
 *
 * @param result
 * @param code
 * @returns {string}
 */
function renderDefinitions(result, code, render) {
  var html = '<dl>';
  if (code) {
    code.split('\n').forEach((line) => {
      if (line.match(/^#/)) {
        html += render(line);
      } else if (line.match(/: *$/)) {
        html += `<dt>${line.replace(/:$/, '')}</dt>`;
      } else {
        // if line starts with 4 white spaces, a tab or a ` block, then consider it a pre tag and don't render dfn
        html += `<dd>${render(line, !!line.match(/^(\t|\s{4}|`)/))}</dd>`;
      }
    });
  }

  return html + '</dl>';
}
