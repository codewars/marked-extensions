import { camelCase } from '../strings';

export const STYLES = {
  Const: {
    upper: ['default'],
  },
  Method: {
    camel: ['php'],
    upperCamel: ['csharp'],
  },
  Prop: {
    upperCamel: ['csharp'],
  },
  Class: {
    upperCamel: ['default'],
  },
  // name acts as default
  Name: {
    camel: [
      'javascript',
      'java',
      'coffeescript',
      'typescript',
      'go',
      'kotlin',
      'scala',
      'objc',
      'swift',
      'csharp',
      'solidity',
      'haskell',
    ],
    dollarCamel: ['php'],
    kabob: ['clojure'],
  },
};

export function replaceDocNames(language, pre, content) {
  return content.replace(
    /`?@@doc(Name|Method|Const|Prop|Class|Param): ?([a-zA-Z0-9?_]*)`?/g,
    (shell, type, value) => {
      return wrap(shell, type, pre, () => {
        if (value) {
          const style = findStyle(type, language);

          switch (style) {
            case 'upper':
              return value.toUpperCase();

            case 'kabob':
              return value.replace(/_/g, '-');

            case 'camel':
              return camelCase(value);

            case 'dollarCamel':
              return '$' + camelCase(value);

            case 'upperCamel':
              return camelCase(value, true);

            default:
              return value;
          }
        } else {
          console.warn('replaceDocNames value is missing:', content); // eslint-disable-line no-console
          return '';
        }
      });
    }
  );
}

function findStyle(type, language) {
  let style = Object.keys(STYLES[type] || []).find((style) => {
    let _style = STYLES[type][style];
    return _style ? _style.indexOf(language) >= 0 : false;
  });

  // try to find a default style for the type
  if (!style && language !== 'default') {
    style = findStyle(type, 'default');
  }

  // default to name if no specific style is set
  if (!style && type !== 'Name') {
    style = findStyle('Name', language);
  }

  return style;
}

function wrap(shell, type, pre, value) {
  value = value();
  if (shell.indexOf('`') === 0 || pre) {
    return shell.replace(/@@doc(Name|Method|Const|Prop|Class|Param): ?([a-zA-Z0-9?_]*)/, value);
  }

  return `<dfn class="doc-name doc-name--${type.toLowerCase()}">${value}</dfn>`;
}
