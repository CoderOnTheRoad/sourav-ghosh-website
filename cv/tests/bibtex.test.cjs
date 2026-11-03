const assert=require('node:assert/strict');
const {parse,clean,authors,duplicate}=require('../bibtex.js');
const source=String.raw`
% Scholar-style export
@article{ghosh2025,
 title={Discovery of {CO$_2$} catalysts, with {DFT} and machine learning},
 author={Ghosh, Sourav and P{\"o}hls, Jonas F. and {Materials and Energy Consortium}},
 journal="Journal of {Materials}, Chemistry",
 year={2025}, volume=12, number="3", pages={123--135},
 doi={https://doi.org/10.1234/example}, publisher={Publisher}
}
@inproceedings(second,
 title="Electronic structure \"tools\" and models",
 author={Doe, Jr., Jane and van der Waals, Johannes},
 booktitle={A conference}, year=2024
)
`;
const result=parse(source);assert.equal(result.records.length,2);const a=result.records[0];assert.equal(a.authors,'Sourav Ghosh; Jonas F. Pöhls; Materials and Energy Consortium');assert.equal(a.journal,'Journal of Materials, Chemistry');assert.equal(a.pages,'123–135');assert.equal(a.doi,'10.1234/example');assert.equal(a.issue,'3');assert.equal(a.title,'Discovery of CO2 catalysts, with DFT and machine learning');assert.equal(result.records[1].authors,'Jane Doe Jr.; Johannes van der Waals');
assert.equal(parse('@string{venue="Journal"}\n@article{k,title={A {nested} title},journal=venue # " of Physics",year=2026}').records[0].journal,'Journal of Physics');
assert.equal(parse('@comment{ignored {nested} text}\n@preamble{"ignored"}\n@article{k,title={One}}').records.length,1);
assert.equal(clean(String.raw`N{\'e}da and {\v{S}} and \&`),'Néda and Š and &');
assert.equal(authors('Ghosh, Sourav and Jane Doe'),'Sourav Ghosh; Jane Doe');
assert.equal(duplicate({title:'A {New} Title!',doi:''},[{title:'A new title',doi:''}]),'Matching title');
assert.equal(duplicate({title:'Different',doi:'https://doi.org/10.1234/ABC'},[{title:'Title',doi:'10.1234/abc'}]),'Matching DOI');
assert.equal(duplicate({title:'A completely different study',doi:''},[{title:'Other title',doi:''}]),'');
assert.match(duplicate({title:'Machine learning for the accelerated design of efficient catalytic materials',doi:''},[{title:'Machine learning for the accelerated design of efficient catalytic material',doi:''}]),/similar/);
assert.throws(()=>parse('@article{k,title={Broken}'),/Unclosed/);
assert.throws(()=>parse('@article{k,title="Broken}'),/Unclosed/);
assert.throws(()=>parse('@article{ok,title={Good}}\n@article{bad,title={Oops}'),/No publications were added/);
assert.throws(()=>parse('This is not BibTeX'),/not a BibTeX/);
assert.throws(()=>parse('@article{k,author={Ghosh, Sourav}}'),/No publications/);
assert.throws(()=>parse(''),/No publications/);
const mixed=parse('@article{k,author={Name}}\n@article{valid,title={Real title}}');assert.equal(mixed.records.length,1);assert.match(mixed.warnings[0],/Skipped k/);
const hostile=parse('@string{__proto__={No pollution}}\n@article{x,title={<img src=x onerror=alert(1)>},author={Doe, Jane}}');assert.equal(hostile.records[0].title,'<img src=x onerror=alert(1)>');assert.equal({}.polluted,undefined);
console.log('BibTeX parser tests passed.');
