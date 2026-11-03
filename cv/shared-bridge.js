/* The website draft and this CV editor share one CV object. */
(async()=>{
const banner=document.createElement('div');banner.className='shared-banner';banner.textContent='Loading connected profile…';document.body.prepend(banner);
const style=document.createElement('style');style.textContent='.shared-banner{position:sticky;top:0;z-index:100;background:#eff5ef;padding:12px 22px;font:14px Arial;color:#243b2c;border-bottom:1px solid #c2d0c3}.shared-banner a{color:#234e72;margin-left:15px}';document.head.append(style);
try{
const readOnly=new URLSearchParams(location.search).get('published')==='1';
const data=readOnly?await ProfileStore.published():await ProfileStore.draft();cv=clone(data.cv);normaliseStyle();selected=cv.sections[0]?.id||'personal';editing=null;renderEditor();renderPreview();renderNav();
if(readOnly){banner.replaceChildren(document.createTextNode('Published CV · use the PDF or Word buttons to download.'));const back=document.createElement('a');back.href='../index.html';back.textContent='Back to website';banner.append(back);style.textContent+=' .workspace{display:block!important}.sidebar,.editor,.mode-switch,#backup{display:none!important}.preview-panel{width:100%;max-width:100%;height:calc(100vh - 120px)}';return}
const originalSave=save;save=function(){originalSave();const snapshot=clone(cv);ProfileStore.update(d=>{d.cv=snapshot;return d}).then(()=>{banner.firstChild.textContent='Shared draft saved. Website preview and CV use these details. '}).catch(()=>{banner.firstChild.textContent='Shared draft could not be saved. Download a CV backup before leaving. '})};
banner.replaceChildren(document.createTextNode('Connected profile · changes update your shared draft. '));for(const [label,href] of [['Website editor','../admin.html'],['Preview website','../index.html?preview=1']]){const a=document.createElement('a');a.textContent=label;a.href=href;banner.append(a)}
// Keep changes made in the other editor tab when returning to the CV maker.
window.addEventListener('focus',async()=>{try{const latest=await ProfileStore.draft();if(JSON.stringify(latest.cv)!==JSON.stringify(cv)){cv=clone(latest.cv);normaliseStyle();renderEditor();renderPreview();renderNav()}}catch{}});
}catch(error){banner.textContent='Could not connect the shared profile: '+error.message}
})();
