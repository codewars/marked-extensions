import { process } from '../src/index';
import { marked } from 'marked';
import { fixture } from './test-utils';

describe('%method-doc', () => {
  it('should render json as formatted markdown', () => {
    const example = process(marked, fixture('method-doc')).html();
    expect(example).toEqual(expect.stringContaining('>Examples</h4>'));
    expect(example).toEqual(expect.stringContaining('<th>files</th>'));
    // Used to have empty `<dfn class="doc-class"></dfn>` after global prefix was removed
    // expect(example).toEqual(expect.stringContaining('<code><dfn class="doc-class">'));
    expect(example).toEqual(
      expect.stringContaining('- A filtered array of files that were opened</p>')
    );
    expect(example).toEqual(expect.stringContaining('<td><code>[1,2,3]</code></td>'));
    expect(example).toEqual(expect.stringContaining('<td><code>"js"</code></td>'));
    expect(example).toEqual(expect.stringContaining('<table>'));
  });

  it('should render json as formatted markdown', () => {
    const example = process(marked, fixture('method-doc-invalid')).html();
    expect(example).not.toEqual(expect.stringContaining('>Examples</h4>'));
    expect(example).toEqual(expect.stringContaining('openFiles'));
  });

  it('should match snapshot', () => {
    // Uses https://github.com/algolia/jest-serializer-html to make the snapshot diff readable
    const example = process(marked, fixture('method-doc')).html();
    expect(example).toMatchSnapshot();
  });

  it('should match snapshot with language: javascript', () => {
    const example = process(marked, fixture('method-doc'), { language: 'javascript' }).html();
    expect(example).toMatchSnapshot();
  });

  it('should match snapshot with language: csharp', () => {
    const example = process(marked, fixture('method-doc'), { language: 'csharp' }).html();
    expect(example).toMatchSnapshot();
  });
});
