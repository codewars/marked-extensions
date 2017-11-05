import { expect } from 'chai';
import { replaceDocNames } from '../../src/doc-tokens/doc-names'

describe ('doc names', function() {
  describe ('@@docName', function () {
    it ('should handle multiple @@docName calls', function () {
      let expected = replaceDocNames('javascript', false, '@@docName:test_foo\n`@@docName:test_foo`');
      expect(expected).to.include('testFoo');
      expect(expected).to.not.include('@@docName');
    });
  });

  describe ('@@docParam', function () {
    it ('should handle multiple @@docParam calls', function () {
      let expected = replaceDocNames('javascript', false, '@@docParam:test_foo\n`@@docParam:test_foo`');
      expect(expected).to.include('testFoo');
      expect(expected).to.not.include('@@docParam');
    });
  });

  describe ('@@docMethod', function () {
    it ('should handle multiple @@docMethod calls', function () {
      let expected = replaceDocNames('javascript', false, '@@docMethod:test_foo\n`@@docMethod:test_foo`');
      expect(expected).to.include('testFoo');
      expect(expected).to.not.include('@@docMethod');
    });
  });
});
