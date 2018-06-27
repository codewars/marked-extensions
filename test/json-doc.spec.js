import { process } from '../src/index';
import marked from 'marked'
import { expect } from 'chai'
import { fixture } from './test-utils'

describe('%jsondoc', () => {
  it('should render json as formatted markdown', () => {
    const example = process(marked, fixture('docjson')).html();
    expect(example).to.include('>Examples</h4>');
    expect(example).to.include('<th>files</th>');
    expect(example).to.include('<code><dfn class="doc-class">');
    expect(example).to.include('- A filtered array of files that were opened</p>');
    expect(example).to.include('<td>[1,2,3]</td>');
    expect(example).to.include('<td>&quot;js&quot;</td>');
    expect(example).to.include('<td><strong>Example #2</strong></td>');
  });

  it('should render json as formatted markdown', () => {
    const example = process(marked, fixture('docjson-invalid')).html();
    expect(example).to.not.include('>Examples</h4>');
    expect(example).to.include('openFiles');
  });
});
