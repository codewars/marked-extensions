import { process } from '../src/index';
import { marked } from 'marked';
import { expect } from 'chai';
import { fixture } from './test-utils';

describe('%table-doc', () => {
  it('should render a table in HTML format', () => {
    const example = process(marked, fixture('table-doc')).html();
    expect(example).to.include('<td>id</td><td>INT</td>');
    expect(example).to.include('<td>title</td><td>VARCHAR(100)</td>');
    expect(example).to.include('<tr><td>email</td><td>VARCHAR(100)</td></tr>');
  });
});
