import { process } from '../src/index';
import marked from 'marked'
import { expect } from 'chai'
import { fixture } from './test-utils'

describe('%method-doc', () => {
  it('should render json as formatted markdown', () => {
    const example = process(marked, fixture('method-doc')).html();
    expect(example).to.include('>Examples</h4>');
    expect(example).to.include('<th>files</th>');
    expect(example).to.include('<code><dfn class="doc-class">');
    expect(example).to.include('- A filtered array of files that were opened</p>');
    expect(example).to.include('<td><code>[1,2,3]</code></td>');
    expect(example).to.include('<td><code>&quot;js&quot;</code></td>');
  });

  it('should render json as formatted markdown', () => {
    const example = process(marked, fixture('method-doc-invalid')).html();
    expect(example).to.not.include('>Examples</h4>');
    expect(example).to.include('openFiles');
    expect(example).to.include('<table>');
  });

});
