/* A local, non-executing BibTeX reader for publication imports. */
(function(root){
'use strict';
function clean(value){
 const marks={"'":'\u0301','`':'\u0300','^':'\u0302','"':'\u0308','~':'\u0303','=':'\u0304','.':'\u0307',u:'\u0306',v:'\u030c',H:'\u030b',c:'\u0327',k:'\u0328',r:'\u030a',b:'\u0331',d:'\u0323'};
 return String(value||'').replace(/\$[_^]\{?([^{}$]+)\}?\$/g,'$1').replace(/\\(["'`^~=\.uvHckrbd])\s*\{([A-Za-z])\}/g,(_,m,c)=>(c+marks[m]).normalize('NFC')).replace(/\\(["'`^~=\.])([A-Za-z])/g,(_,m,c)=>(c+marks[m]).normalize('NFC')).replace(/\\(?:textit|textbf|emph|textrm|textnormal|textsubscript|textsuperscript|mathrm|mathbf|operatorname)\s*\{/g,'{').replace(/\\(aa|AA|ae|AE|oe|OE|ss|o|O|l|L)\b/g,(_,m)=>({aa:'å',AA:'Å',ae:'æ',AE:'Æ',oe:'œ',OE:'Œ',ss:'ß',o:'ø',O:'Ø',l:'ł',L:'Ł'}[m])).replace(/\\(?:LaTeX|TeX)\b/g,m=>m.slice(1)).replace(/\\([&%_$#{}])/g,'$1').replace(/[{}$]/g,'').replace(/---/g,'—').replace(/--/g,'–').replace(/~/g,' ').replace(/\s+/g,' ').trim();
}
function authors(value){
 // Split on BibTeX's author separator only outside protected corporate names.
 let depth=0,start=0,parts=[];for(let i=0;i<value.length;i++){if(value[i]==='\\'){i++;continue;}if(value[i]==='{')depth++;if(value[i]==='}')depth--;if(!depth&&/^\s+and\s+/i.test(value.slice(i))){const m=value.slice(i).match(/^\s+and\s+/i)[0];parts.push(value.slice(start,i));i+=m.length-1;start=i+1;}}parts.push(value.slice(start));
 return parts.map(part=>{const corporate=part.trim().startsWith('{');if(corporate)return clean(part);const chunks=part.split(',').map(clean);if(chunks.length===2)return [chunks[1],chunks[0]].join(' ');if(chunks.length>=3)return [chunks.slice(2).join(' '),chunks[0],chunks[1]].join(' ');return clean(part);}).filter(Boolean).join('; ');
}
function parse(text){
 if(typeof text!=='string'||text.length>2000000)throw Error('Choose a BibTeX export smaller than 2 MB.');
 text=text.replace(/^\uFEFF/,'');let pos=0;const records=[],warnings=[],macros=Object.assign(Object.create(null),{jan:'January',feb:'February',mar:'March',apr:'April',may:'May',jun:'June',jul:'July',aug:'August',sep:'September',oct:'October',nov:'November',dec:'December'});
 const error=message=>{throw Error(message+' (line '+(text.slice(0,pos).split('\n').length)+'). No publications were added.');};
 function skip(){while(pos<text.length){if(/\s/.test(text[pos]))pos++;else if(text[pos]==='%'){while(pos<text.length&&text[pos]!=='\n')pos++;}else break;}}
 function word(){const m=text.slice(pos).match(/^[A-Za-z_][A-Za-z0-9_:.+\/-]*/);if(!m)error('Expected a BibTeX name');pos+=m[0].length;return m[0];}
 function group(open,close){pos++;let depth=1,out='';while(pos<text.length){const c=text[pos++];if(c==='\\'){out+=c;if(pos<text.length)out+=text[pos++];continue;}if(c===open)depth++;if(c===close){depth--;if(!depth)return out;}out+=c;}error('Unclosed BibTeX entry or field');}
 function quoted(){pos++;let out='',depth=0;while(pos<text.length){const c=text[pos++];if(c==='\\'){out+=c;if(pos<text.length)out+=text[pos++];continue;}if(c==='{')depth++;if(c==='}')depth--;if(c==='"'&&!depth)return out;out+=c;}error('Unclosed quoted field');}
 function value(){let out='';do{skip();if(text[pos]==='#'){pos++;skip();}if(text[pos]==='{')out+=group('{','}');else if(text[pos]==='"')out+=quoted();else{const m=text.slice(pos).match(/^[^\s,#{}()]+/);if(!m)error('Expected a field value');pos+=m[0].length;const token=m[0];out+=Object.hasOwn(macros,token.toLowerCase())?macros[token.toLowerCase()]:token;}skip();}while(text[pos]==='#');return out;}
 while(true){skip();if(pos>=text.length)break;if(text[pos++]!=='@')error('This file is not a BibTeX export');skip();const type=word().toLowerCase();skip();const open=text[pos],close=open==='{'?'}':')';if(!['{','('].includes(open))error('Expected an entry opening brace');
 if(type==='comment'){group(open,close);continue;}pos++;skip();
 if(type==='preamble'){value();skip();if(text[pos++]!==close)error('Invalid preamble');continue;}
 if(type==='string'){const name=word().toLowerCase();skip();if(text[pos++]!=='=')error('Expected = in string definition');macros[name]=value();skip();if(text[pos]===','){pos++;skip();}if(text[pos++]!==close)error('Invalid string definition');continue;}
 const keyStart=pos;while(pos<text.length&&text[pos]!==','&&text[pos]!==close)pos++;const key=text.slice(keyStart,pos).trim();if(!key)error('Missing entry identifier');const fields=Object.create(null);if(text[pos]===',')pos++;
 while(true){skip();if(text[pos]===close){pos++;break;}if(pos>=text.length)error('Unclosed publication entry');const field=word().toLowerCase();skip();if(text[pos++]!=='=')error('Expected = after '+field);if(Object.hasOwn(fields,field))warnings.push('Entry '+key+': repeated '+field+' field; the last value is used.');fields[field]=value();skip();if(pos>=text.length)error('Unclosed publication entry');if(text[pos]===','){pos++;continue;}if(text[pos]!==close)error('Expected a comma between fields');}
 if(records.length>=1000)error('Import at most 1,000 publications at once');
 const title=clean(fields.title),author=authors(fields.author||''),year=clean(fields.year||''),journal=clean(fields.journal||fields.booktitle||fields.school||fields.publisher||'');
 if(!title){warnings.push('Skipped '+key+': no article title.');continue;}
 const doi=clean(fields.doi||'').replace(/^https?:\/\/(?:dx\.)?doi\.org\//i,'').replace(/^doi:\s*/i,'');
 const review=[];if(!author)review.push('Check authors');if(!journal)review.push('Add journal or venue');if(!year)review.push('Add publication year');if(!doi)review.push('DOI not supplied');if(/\\[A-Za-z]+/.test(title+author+journal))review.push('Check remaining LaTeX commands');
 records.push({title,authors:author,journal,year,volume:clean(fields.volume),issue:clean(fields.number||fields.issue),pages:clean(fields.pages||fields.eid||fields.articleno),doi,metrics:'',review:review.join('; '),source:'Imported from BibTeX: '+type+' / '+key});
 }
 if(!records.length)throw Error('No publications with titles found. Upload a .bib file exported as BibTeX.');return {records,warnings};
}
function normalTitle(t){return clean(t).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');}
function normalDOI(d){return String(d||'').trim().toLowerCase().replace(/^https?:\/\/(?:dx\.)?doi\.org\//,'').replace(/^doi:\s*/,'').replace(/[.\s]+$/,'');}
function duplicate(entry,existing){const d=normalDOI(entry.doi),t=normalTitle(entry.title);for(const old of existing){if(d&&d===normalDOI(old.doi))return 'Matching DOI';if(t&&t===normalTitle(old.title))return 'Matching title';const a=clean(entry.title).toLowerCase().match(/[\p{L}\p{N}]+/gu)||[],b=clean(old.title).toLowerCase().match(/[\p{L}\p{N}]+/gu)||[];if(a.length>=7&&b.length>=7){const sa=new Set(a),sb=new Set(b),common=[...sa].filter(w=>sb.has(w)).length;if(common/Math.max(sa.size,sb.size)>=.9)return 'Very similar title';}}return '';}
const api={parse,clean,authors,duplicate};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.BibtexImport=api;
})(typeof window!=='undefined'?window:globalThis);
