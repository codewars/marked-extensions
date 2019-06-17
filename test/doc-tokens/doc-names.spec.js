import { expect } from 'chai';
import { replaceDocNames } from '../../src/doc-tokens/doc-names'

function check(language, type, expected, name = 'foo_bar') {
  it (`${language}: @@doc${type} = ${expected}`, function() {
    const actual = replaceDocNames(language, false, `@@doc${type}:${name}`);
    expect(actual).to.include(`<dfn class="doc-name doc-name--${type.toLowerCase()}">${expected}</dfn>`);
  });
}

describe ('doc names', function() {
  describe ('@@docName', function () {
    it ('should handle multiple @@docName calls', function () {
      let expected = replaceDocNames('javascript', false, '@@docName:test_foo\n`@@docName:test_foo`');
      expect(expected).to.include('testFoo');
      expect(expected).to.not.include('@@docName');
    });

    describe ('conversions', function() {
      check('javascript', 'Name', 'fooBar');
      check('ruby', 'Name', 'foo_bar');
      check('python', 'Name', 'foo_bar');
      check('csharp', 'Name', 'fooBar');
      check('java', 'Name', 'fooBar');
      check('swift', 'Name', 'fooBar');
      check('php', 'Name', '$fooBar');
    });
  });

  describe ('@@docParam', function() {
    it ('should handle multiple @@docParam calls', function () {
      let expected = replaceDocNames('javascript', false, '@@docParam:test_foo\n`@@docParam:test_foo`');
      expect(expected).to.include('testFoo');
      expect(expected).to.not.include('@@docParam');
    });

    describe ('conversions', function() {
      check('javascript', 'Param', 'fooBar');
      check('ruby', 'Param', 'foo_bar');
      check('python', 'Param', 'foo_bar');
      check('csharp', 'Param', 'fooBar');
      check('java', 'Param', 'fooBar');
      check('swift', 'Param', 'fooBar');
      check('php', 'Param', '$fooBar');
    });
  });

  describe ('@@docMethod', function() {
    it ('should handle multiple @@docMethod calls', function() {
      let expected = replaceDocNames('javascript', false, '@@docMethod:test_foo\n`@@docMethod:test_foo`');
      expect(expected).to.include('testFoo');
      expect(expected).to.not.include('@@docMethod');
    });

    describe ('conversions', function() {
      check('javascript', 'Method', 'fooBar');
      check('ruby', 'Method', 'foo_bar');
      check('python', 'Method', 'foo_bar');
      check('csharp', 'Method', 'FooBar');
      check('java', 'Method', 'fooBar');
      check('swift', 'Method', 'fooBar');
      check('haskell', 'Method', 'fooBar');
      check('clojure', 'Method', 'foo-bar');
      check('php', 'Method', 'fooBar');
    });
  });
});
