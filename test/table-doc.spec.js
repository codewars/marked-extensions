import { process } from '../src/index';
import marked from 'marked'
import { expect } from 'chai'
import { fixture } from './test-utils'

describe('%table-doc', () => {
  it('should render json as formatted markdown', () => {
    const example = process(marked, fixture('table-doc')).html();
    expect(example).to.include('<td>id</td>\n<td>INT</td>');
    expect(example).to.include('<tr>\n<td>title</td>\n<td>VARCHAR(100)</td>\n</tr>');
    expect(example).to.include('<tr>\n<td>email</td>\n<td>VARCHAR(100)</td>\n</tr>');
  });
});
