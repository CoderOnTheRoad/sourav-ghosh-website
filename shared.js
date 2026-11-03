(function(root){'use strict';
const clone=x=>JSON.parse(JSON.stringify(x));
const lists=['updates','notes','blog','quotes','memories','archives'];
function safeURL(value){try{const u=new URL(value);return ['http:','https:'].includes(u.protocol)&&!u.username&&!u.password?u.href:''}catch{return ''}}
function imageURL(value){return typeof value==='string'&&(/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(value)||['paper-placeholder.svg','catalyst-workflow.svg'].includes(value))?value:''}
function validCV(cv){return !!(cv&&cv.version===1&&cv.profile&&typeof cv.profile==='object'&&!Array.isArray(cv.profile)&&Object.values(cv.profile).every(v=>typeof v==='string')&&cv.settings&&['10','11','12'].includes(String(cv.settings.fontSize))&&Array.isArray(cv.sections)&&cv.sections.length<=100&&new Set(cv.sections.map(s=>s.id)).size===cv.sections.length&&cv.sections.every(s=>s&&typeof s.id==='string'&&typeof s.title==='string'&&['general','publication'].includes(s.type)&&typeof s.visible==='boolean'&&Array.isArray(s.entries)&&s.entries.length<=1000&&s.entries.every(e=>e&&typeof e.id==='string'&&Object.values(e).every(v=>typeof v==='string'))))}
function valid(data){if(!data||data.version!==1||!validCV(data.cv)||!data.website||typeof data.website!=='object'||Array.isArray(data.website))return false;const w=data.website;
if(!['subtitle','researchFocus','homeIntroduction','currentWork','featuredFigure','featuredCaption','featuredAlt'].every(k=>typeof w[k]==='string'))return false;
if(w.featuredFigure&&!imageURL(w.featuredFigure))return false;
if(!Array.isArray(w.featuredIds)||w.featuredIds.some(x=>typeof x!=='string'))return false;
if(!w.publicationImages||Array.isArray(w.publicationImages)||typeof w.publicationImages!=='object'||!Object.values(w.publicationImages).every(v=>typeof v==='string'&&!!imageURL(v)))return false;
if(!w.sectionVisibility||typeof w.sectionVisibility!=='object'||Array.isArray(w.sectionVisibility)||!Object.values(w.sectionVisibility).every(v=>typeof v==='boolean'))return false;
if(!Array.isArray(w.customPages)||w.customPages.length>30||!w.customPages.every(p=>p&&typeof p.id==='string'&&typeof p.title==='string'&&typeof p.details==='string'))return false;
return lists.every(k=>Array.isArray(w[k])&&w[k].length<=1000&&new Set(w[k].map(e=>e.id)).size===w[k].length&&w[k].every(e=>e&&typeof e.id==='string'&&Object.values(e).every(v=>typeof v==='string')&&(!e.url||!!safeURL(e.url))&&(!e.image||!!imageURL(e.image))))}
function publications(data){return data.cv.sections.filter(s=>s.type==='publication'&&data.website.sectionVisibility[s.id]!==false).flatMap(s=>s.entries)}
function visibleSections(data){return data.cv.sections.filter(s=>data.website.sectionVisibility[s.id]!==false)}
const Model={clone,lists,safeURL,imageURL,validCV,valid,publications,visibleSections};root.ProfileModel=Model;if(typeof module==='object'&&module.exports)module.exports=Model;
if(typeof document==='undefined')return;
let dbPromise;function db(){return dbPromise||(dbPromise=new Promise((resolve,reject)=>{const request=indexedDB.open('sourav-personal-website',1);request.onupgradeneeded=()=>request.result.createObjectStore('profiles');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)}))}
async function read(){const database=await db();return new Promise((resolve,reject)=>{const r=database.transaction('profiles').objectStore('profiles').get('draft');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
async function save(value){if(!valid(value))throw Error('The profile has invalid fields. Your saved draft was not replaced.');const database=await db();return new Promise((resolve,reject)=>{const tx=database.transaction('profiles','readwrite');tx.objectStore('profiles').put(clone(value),'draft');tx.oncomplete=()=>{window.dispatchEvent(new Event('profile-saved'));resolve(value)};tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)})}
let queue=Promise.resolve();function update(fn){const task=queue.catch(()=>{}).then(async()=>{const current=await draft();const next=await fn(clone(current));await save(next||current);return next||current});queue=task;return task}
async function published(){const url=new URL('shared-profile.json',scriptRoot);const response=await fetch(url,{cache:'no-store'});if(!response.ok)throw Error('Could not load the published profile.');const value=await response.json();if(!valid(value))throw Error('The published profile is invalid.');return value}
// Resolve relative to this script, including when loaded from the CV maker.
const scriptRoot=new URL('.',document.currentScript.src);root.__profileRoot=scriptRoot.href;
async function draft(){const saved=await read();if(saved&&valid(saved))return saved;return published()}
async function fileImage(file){if(!file||!['image/png','image/jpeg','image/webp','image/gif'].includes(file.type)||file.size>12*1024*1024)throw Error('Choose a PNG, JPG, WebP or GIF image up to 12 MB.');const bitmap=await createImageBitmap(file);const scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();return canvas.toDataURL('image/png') .length<1_000_000?canvas.toDataURL('image/png'):canvas.toDataURL('image/jpeg',.85)}
function download(value,name){const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
root.ProfileStore={read,save,update,published,draft,fileImage,download};
})(typeof globalThis!=='undefined'?globalThis:this);
