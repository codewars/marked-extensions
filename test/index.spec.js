import { process } from '../src/index';
import marked from 'marked';
import yaml from 'js-yaml';
import { expect } from 'chai';
import { fixture } from './test-utils';
import { escapeHtml } from '../src/strings';

describe('process', function () {
  const basicExample = process(marked, fixture('basic'));

  describe('Basic', function () {
    it('should return a valid object', function () {
      expect(basicExample)
        .to.be.an('object')
        .and.to.have.all.keys(
          'raw',
          'languages',
          'language',
          'originalLanguage',
          'extensions',
          'renderer',
          'preprocessed',
          'html',
          'render',
          'afterRender'
        );
    });

    it('should escape scripts in backticks', function () {
      const example = process(marked, '`<script>test</script>`');
      expect(example.html()).to.contain('&lt;script&gt;').and.to.not.contain('<script>');
    });
  });

  describe('language filtering', function () {
    it('should filter by first language if non is set', function () {
      expect(basicExample.html()).to.include('javascript').and.not.to.include('ruby');
    });

    describe('if/not blocks', function () {
      it('should filter language by original langauge', function () {
        const example = process(marked, fixture('if-not'), { language: 'javascript' });
        expect(example.html())
          .to.include('<strong>Javascript!</strong>')
          .and.not.to.include('Other!');
      });

      it('should only filter language by original langauge', function () {
        const example = process(marked, fixture('if-not'));
        expect(example.html())
          .to.not.include('<strong>Javascript!</strong>')
          .and.not.to.include('Other!');
      });

      it('should filter languages separated by a comma', function () {
        const example = process(marked, fixture('if-not'), { language: 'csharp' });
        expect(example.html())
          .to.include('<strong>Other!</strong>')
          .and.not.to.include('Javascript!');
      });
    });

    it('should not filter out code blocks within lists', function () {
      const example = process(marked, fixture('code-lists'), { language: 'c' });
      expect(example.html())
        .to.include('<code class="language-c">')
        .and.to.include('<code class="language-cpp">');
    });

    it('should not break if language is not found', function () {
      const example = process(marked, fixture('invalid-language'), { language: 'ruby' });
      expect(example.html()).to.include('<code class="language-rub">');
    });
  });

  describe('YAML/Meta', function () {
    const metaExample = process(marked, fixture('meta'), { jsYaml: yaml });
    it('should extract meta data', function () {
      expect(metaExample.meta.options.theme).to.equal('test');
    });
  });

  describe('Docs', function () {
    it('should process javascript', function () {
      let example = process(marked, fixture('doc'), { language: 'javascript' });
      expect(example.html())
        .to.include('<dfn class="doc-type">Number</dfn>')
        .and.to.include(escapeHtml('Array<String>'))
        .and.to.include('firstNames')
        .and.to.not.include('Challenge.')
        .and.to.not.include('first_names');
    });

    it('should process ruby', function () {
      let example = process(marked, fixture('doc'), { language: 'ruby' });
      expect(example.html())
        .to.include('<dfn class="doc-type">Integer</dfn>')
        .and.to.include('Array (of Strings)')
        .and.to.include('first_names')
        .and.to.not.include('Challenge.')
        .and.to.not.include('firstNames');
    });

    it('should process csharp', function () {
      let example = process(marked, fixture('doc'), { language: 'csharp' });
      expect(example.html())
        .to.include('<dfn class="doc-type">int</dfn>')
        .and.to.include('string[]')
        .and.to.include('TestFoo')
        .and.to.include('firstNames')
        .and.to.include('Challenge.')
        .and.to.not.include('first_names');
    });

    it('should not render doc type tags within pre > code elements', function () {
      let example = process(marked, fixture('doc-constraints'), { language: 'javascript' });
      expect(example.html()).to.include('<code>').to.not.include('<dfn').to.not.include('&lt;dfn');
    });

    // test a specific bug that was found
    it('should handle doc types within ``', function () {
      let example = process(marked, '`@@docType:Array`', { language: 'javascript' });
      expect(example.html()).to.include('Array').to.not.include('of /codes');
    });

    // test a specific bug that was found
    it('should handle Array doc types within ``', function () {
      let example = process(marked, '`@@docType:Array<String>`', { language: 'javascript' });
      expect(example.html()).to.include(escapeHtml('Array<String>')).to.not.include('of /codes');
    });

    // test a specific bug that was found
    it('should handle doc types without ``', function () {
      let example = process(marked, '@@docType:Array<String>', { language: 'javascript' });
      expect(example.html()).to.include(escapeHtml('Array<String>')).to.not.include('of /codes');
    });
  });

  describe('extensions', function () {
    const extensions = {
      mermaid: {
        code: (code) => `<div class="mermaid">${code}</div>`,
      },
    };

    it('should add html wrapper', function () {
      let example = process(marked, fixture('extensions'), { extensions });
      expect(example.html()).to.include('<div class="mermaid">');
    });

    it('should detect as an extension', function () {
      let example = process(marked, fixture('extensions'), { extensions });
      expect(example.extensions[0]).to.equal('mermaid');
    });
  });

  describe('languageWrapper', function () {
    it('should wrap when using a function', function () {
      let example = process(marked, fixture('basic'), {
        languageWrapper: (code, l) => `<test class="${l}">${code}</test>`,
      });
      expect(example.html()).to.include('<test class="javascript"><pre><code');
    });
  });
});
