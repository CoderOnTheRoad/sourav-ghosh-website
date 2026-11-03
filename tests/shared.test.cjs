const assert=require('node:assert/strict');const fs=require('node:fs');const M=require('../shared.js');
const data=JSON.parse(fs.readFileSync(new URL('../shared-profile.json','file://'+__filename)));
assert(M.valid(data));assert.equal(M.publications(data).length,14);assert(M.validCV(data.cv));
const draft=M.clone(data);draft.cv.sections.find(s=>s.type==='publication').entries.push({id:'new-paper',title:'A new paper',authors:'Sourav Ghosh',journal:'Test journal',year:'2026',doi:''});assert(M.valid(draft));assert.equal(M.publications(draft).length,15);assert.equal(M.publications(data).length,14,'Draft mutation must not change the published profile');
const pubSection=draft.cv.sections.find(s=>s.type==='publication');pubSection.visible=false;assert.equal(M.publications(draft).length,15,'CV visibility is independent of website visibility');draft.website.sectionVisibility[pubSection.id]=false;assert.equal(M.publications(draft).length,0);
for(const value of ['javascript:alert(1)','data:text/html,test','https://name:secret@example.com'])assert.equal(M.safeURL(value),'');assert.equal(M.safeURL('https://example.com'),'https://example.com/');assert.equal(M.imageURL('data:image/svg+xml;base64,PHN2Zz4='),'');
const invalid=M.clone(data);invalid.cv.sections[0].entries[0].title={html:'bad'};assert(!M.valid(invalid));const bad=M.clone(data);bad.website.archives.push({id:'x',title:'unsafe',url:'javascript:alert(1)'});assert(!M.valid(bad));
const image=M.clone(data);image.website.publicationImages['new-paper']='data:image/png;base64,YQ==';assert(M.valid(image));image.website.publicationImages['new-paper']='https://example.com/tracker';assert(!M.valid(image));
console.log('Shared profile validation, draft isolation, visibility and URL/image checks passed.');
