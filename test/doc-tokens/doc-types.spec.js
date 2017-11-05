import { expect } from 'chai';
import { replaceDocTypes } from '../../src/doc-tokens/doc-types'
import { escapeHtml } from '../../src/strings'

let _content = null;
function content(value) {
  if (value) {
    _content = `# header\n@@docType: ${value} some text to make sure we select correctly`;
  }

  return _content;
}

function check(language, expected) {
  it (`${language}: ${expected}`, function() {
    const actual = replaceDocTypes(language, false, content());
    expect(actual).to.include(`<dfn class="doc-type">${escapeHtml(expected)}</dfn>`);
  });
}

describe ('doc-types', function() {
  describe ('types', function() {
    describe('Arrays', function () {
      describe('Integers', function () {
        before(() => content('Array<Integer>'));

        check('javascript', 'Array (of Numbers)');
        check('ruby', 'Array (of Integers)');
        check('python', 'Array (of Integers)');
        check('csharp', 'int[]');
        check('java', 'List<Integer>');
        check('objc', 'NSArray* (of NSNumbers)');
      });

      describe('Strings', function () {
        before(() => content('Array<String>'));
        check('javascript', 'Array (of Strings)');
        check('ruby', 'Array (of Strings)');
        check('python', 'Array (of Strings)');
        check('csharp', 'string[]');
        check('java', 'List<String>');
        check('cpp', 'std::list<std::string>');
      });
    });

    describe('Lists', function () {
      describe('Integers', function () {
        before(() => content('List<Integer>'));
        check('javascript', 'Array (of Numbers)');
        check('ruby', 'Array (of Integers)');
        check('python', 'Array (of Integers)');
        check('csharp', 'List<int>');
        check('java', 'List<Integer>');
      });

      describe('Strings', function () {
        before(() => content('List<String>'));

        check('javascript', 'Array (of Strings)');
        check('ruby', 'Array (of Strings)');
        check('python', 'Array (of Strings)');
        check('csharp', 'List<string>');
        check('java', 'List<String>');
      });
    });

    describe('Typed Hashes', function () {
      describe('Hash Strings', function () {
        before(() => content('Hash<String>'));

        check('javascript', 'Object (of Strings)');
        check('ruby', 'Hash (of Strings)');
        check('python', 'dict (of Strings)');
        check('csharp', 'Dictionary<string>');
        check('java', 'HashMap<String>');
      });
    });

    describe('Key Typed Hashes', function () {
      describe('Hash Strings & Integers', function () {
        before(() => content('Hash<String, Integer>'));

        check('javascript', 'Object (of Strings/Numbers)');
        check('ruby', 'Hash (of Strings/Integers)');
        check('python', 'dict (of Strings/Integers)');
        check('csharp', 'Dictionary<string, int>');
        check('java', 'HashMap<String, Integer>');
      });
    });

    describe('Common Types', function () {
      describe('void', function () {
        before(() => content('void'));

        check('javascript', 'undefined');
        check('ruby', 'nil');
        check('python', 'None');
        check('csharp', 'void');
        check('java', 'void');
      });

      describe('null', function () {
        before(() => content('null'));

        check('javascript', 'null');
        check('ruby', 'nil');
        check('python', 'None');
        check('csharp', 'null');
        check('java', 'null');
        check('objc', 'NSNull');
      });

      describe('hash', function () {
        before(() => content('Hash'));

        check('javascript', 'Object');
        check('ruby', 'Hash');
        check('python', 'dict');
        check('csharp', 'Dictionary');
        check('java', 'HashMap');
      });

      describe('object', function () {
        before(() => content('Object'));

        check('javascript', 'Object');
        check('ruby', 'Hash');
        check('python', 'dict');
        check('csharp', 'Dictionary');
        check('java', 'HashMap');
        check('objc', 'NSObject');
      });

      describe('integer', function () {
        before(() => content('Integer'));

        check('javascript', 'Number');
        check('ruby', 'Integer');
        check('python', 'Integer');
        check('csharp', 'int');
        check('java', 'Integer');
        check('objc', 'NSNumber *');
      });
    });
  });

  describe ('parsing', function() {
    describe('when nested inside of code', function () {
      it ('should handle doc types within ``', function() {
        let example = replaceDocTypes('javascript', false, '`@@docType:Array<String>`');
        expect(example).to.equal('`Array (of Strings)`');
      });

      it ('should handle doc types within <p><code>@@docType:Array<String></code></p>', function() {
        let example = replaceDocTypes('javascript', false, '<p><code>@@docType:Array<String></code></p>');
        expect(example).to.equal('<p><code>Array (of Strings)</code></p>');
      });

      it ('should handle doc types without closing tag <code>@@docType:Array<String>', function() {
        let example = replaceDocTypes('javascript', false, '<code>@@docType:Array<String>');
        expect(example).to.equal('<code>Array (of Strings)');
      });

      it ('should handle doc types without ``', function() {
        let example = replaceDocTypes('javascript', false, 'test @@docType:Array<String> test');
        expect(example).to.equal('test <dfn class="doc-type">Array (of Strings)</dfn> test');
      });
    });
  });
});
