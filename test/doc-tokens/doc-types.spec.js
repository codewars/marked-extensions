import { expect } from 'chai';
import { replaceDocTypes } from '../../src/doc-tokens/doc-types'
import { unescapeHtml } from '../../src/strings'

let _content = null;
function content(value) {
  if (value) {
    _content = `# header\n@@docType: ${value} some text to make sure we select correctly`;
  }

  return _content;
}

function check(language, expected) {
  it (`${language}: ${expected}`, function() {
    const actual = unescapeHtml(replaceDocTypes(language, false, content()));
    expect(actual).to.include(`<dfn class="doc-type">${expected}</dfn>`);
  });
}

describe ('doc-types', function() {
  describe ('types', function() {
    describe('Arrays', function () {
      describe('Integers', function () {
        beforeEach(() => content('Array<Integer>'));

        check('javascript', 'Array<Number>');
        check('typescript', 'Array<number>');
        check('ruby', 'Array (of Integers)');
        check('python', 'Array (of Integers)');
        check('csharp', 'int[]');
        check('java', 'Integer[]');
        check('objc', 'NSArray* (of NSNumbers)');
        check('kotlin', 'Array<Int>');
      });

      describe('Strings', function () {
        beforeEach(() => content('Array<String>'));
        check('javascript', 'Array<String>');
        check('typescript', 'Array<string>');
        check('ruby', 'Array (of Strings)');
        check('python', 'Array (of Strings)');
        check('csharp', 'string[]');
        check('java', 'String[]');
        check('cpp', 'std::list<std::string>');
      });
    });

    describe('Arrays of Arrays', () => {
      describe('Integers', () => {
        beforeEach(() => content('Array<Array<Integer>>'));

        check('javascript', 'Array<Array<Number>>');
        check('csharp', 'Array<int[]>');
      });
    });

    describe('Nested Objects', () => {
      describe('Promises', () => {
        beforeEach(() => content('Promise<Array<Integer>>'));

        check('ruby', 'Promise<Array (of Integers)>');
        check('javascript', 'Promise<Array<Number>>');
      });
    });

    describe('Enumerables', () => {
      describe('Integers', () => {
        beforeEach(() => content('Enumerable<Integer>'));

        check('csharp', 'IEnumerable<int>');
        check('cpp', 'vector<int>');
        check('javascript', 'Array<Number>');
      });
    });

    describe('Lists', function () {
      describe('Integers', function () {
        beforeEach(() => content('List<Integer>'));

        check('javascript', 'Array<Number>');
        check('ruby', 'Array (of Integers)');
        check('python', 'Array (of Integers)');
        check('csharp', 'List<int>');
        check('java', 'List<Integer>');
        check('kotlin', 'List<Int>');
        check('swift', 'Array<Int>');
        check('c', 'int[]');
        check('haskell', '[Int]');
        check('go', '[]int');
      });

      describe('Strings', function () {
        beforeEach(() => content('List<String>'));

        check('javascript', 'Array<String>');
        check('typescript', 'Array<string>');
        check('ruby', 'Array (of Strings)');
        check('python', 'Array (of Strings)');
        check('csharp', 'List<string>');
        check('java', 'List<String>');
      });
    });

    describe('Typed Hashes', function () {
      describe('Hash Strings', function () {
        beforeEach(() => content('Hash<String>'));

        check('javascript', 'Object<String>');
        check('ruby', 'Hash (of Strings)');
        check('python', 'dict (of Strings)');
        check('csharp', 'Dictionary<string>');
        check('java', 'HashMap<String>');
      });
    });

    describe('Key Typed Hashes', function () {
      describe('Hash Strings & Integers', function () {
        beforeEach(() => content('Hash<String, Integer>'));

        check('javascript', 'Object<String, Number>');
        check('ruby', 'Hash (of Strings/Integers)');
        check('python', 'dict (of Strings/Integers)');
        check('csharp', 'Dictionary<string, int>');
        check('java', 'HashMap<String, Integer>');
      });
    });

    describe('Common Types', function () {
      describe('void', function () {
        beforeEach(() => content('void'));

        check('javascript', 'undefined');
        check('ruby', 'nil');
        check('python', 'None');
        check('csharp', 'void');
        check('java', 'void');
      });

      describe('null', function () {
        beforeEach(() => content('null'));

        check('javascript', 'null');
        check('ruby', 'nil');
        check('python', 'None');
        check('csharp', 'null');
        check('java', 'null');
        check('objc', 'NSNull');
      });

      describe('hash', function () {
        beforeEach(() => content('Hash'));

        check('javascript', 'Object');
        check('ruby', 'Hash');
        check('python', 'dict');
        check('csharp', 'Dictionary');
        check('java', 'HashMap');
      });

      describe('object', function () {
        beforeEach(() => content('Object'));

        check('javascript', 'Object');
        check('ruby', 'Hash');
        check('python', 'dict');
        check('csharp', 'Dictionary');
        check('java', 'HashMap');
        check('objc', 'NSObject');
      });

      describe('integer', function () {
        beforeEach(() => content('Integer'));

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
        let example = unescapeHtml(replaceDocTypes('javascript', false, '`@@docType:Array<String>`'));
        expect(example).to.equal('`Array<String>`');
      });

      it ('should handle doc types within <p><code>@@docType:Array<String></code></p>', function() {
        let example = unescapeHtml(replaceDocTypes('javascript', false, '<p><code>@@docType:Array<String></code></p>'));
        expect(example).to.equal('<p><code>Array<String></code></p>');
      });

      it ('should handle doc types without closing tag <code>@@docType:Array<String>', function() {
        let example = unescapeHtml(replaceDocTypes('javascript', false, '<code>@@docType:Array<String>'));
        expect(example).to.equal('<code>Array<String>');
      });

      it ('should handle doc types without ``', function() {
        let example = unescapeHtml(replaceDocTypes('javascript', false, 'test @@docType:Array<String> test'));
        expect(example).to.equal('test <dfn class="doc-type">Array<String></dfn> test');
      });
    });
  });
});
