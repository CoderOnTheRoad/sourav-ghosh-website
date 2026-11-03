/* Read Scopus CSV exports locally as text, never as executable spreadsheet cells. */
(function(root){
'use strict';
const text=value=>String(value??'').replace(/\s+/g,' ').trim();
function csvRows(input){
 if(typeof input!=='string'||input.length>2000000)throw Error('Choose a Scopus CSV export smaller than 2 MB.');
 input=input.replace(/^\uFEFF/,'');const rows=[];let row=[],cell='',quoted=false,closed=false,line=1;
 const fail=message=>{throw Error(message+' (line '+line+'). No publications were added.');};
 function endCell(){row.push(cell);cell='';closed=false;}
 function endRow(){endCell();if(row.some(value=>value.trim()))rows.push(row);row=[];if(rows.length>1001)fail('Import at most 1,000 publications at once');}
 for(let i=0;i<input.length;i++){
  const c=input[i];if(quoted){if(c==='"'){if(input[i+1]==='"'){cell+='"';i++;}else{quoted=false;closed=true;}}else{cell+=c;if(c==='\n')line++;}continue;}
  if(c===','){endCell();continue;}
  if(c==='\n'||c==='\r'){if(c==='\r'&&input[i+1]==='\n')i++;endRow();line++;continue;}
  if(c==='"'){if(cell.trim()||closed)fail('Unexpected quote in CSV field');cell='';quoted=true;continue;}
  if(closed){if(c===' '||c==='\t')continue;fail('Unexpected text after a quoted CSV field');}
  cell+=c;
 }
 if(quoted)fail('Unclosed quoted CSV field');if(cell||row.length||closed)endRow();return rows;
}
function fullAuthors(value){return String(value||'').split(';').map(name=>{
 name=text(name).replace(/\s*\(\s*\d+\s*\)\s*$/,'').trim();
 const parts=name.split(',').map(text);if(parts.length===2)return [parts[1],parts[0]].filter(Boolean).join(' ');if(parts.length>=3)return [parts.slice(2).join(' '),parts[0],parts[1]].filter(Boolean).join(' ');return name;
}).filter(Boolean).join('; ');}
function shortAuthors(value){
 // Current Scopus exports separate authors with semicolons; older exports may use commas.
 const parts=String(value||'').includes(';')?String(value).split(';'):String(value||'').split(/,\s*(?=[^,]+(?:\s+[A-ZÀ-Ž](?:\.|\b)))/u);
 return parts.map(raw=>{const name=text(raw);if(name.includes(','))return fullAuthors(name);const match=name.match(/^(.+?)\s+((?:[\p{Lu}]\.?[ -]?){1,8})$/u);return match?text(match[2]+' '+match[1]):name;}).filter(Boolean).join('; ');
}
function parse(input){
 const rows=csvRows(input);if(rows.length<2)throw Error('No publication rows found. Choose a Scopus CSV export with a header and at least one publication.');
 const normal=value=>text(value).toLowerCase();const headers=rows.shift().map(normal),index=Object.create(null);
 headers.forEach((header,i)=>{if(header&&Object.hasOwn(index,header))throw Error('Repeated CSV column: '+header+'. No publications were added.');index[header]=i;});
 if(!Object.hasOwn(index,'title')||!Object.hasOwn(index,'source title')||(!Object.hasOwn(index,'authors')&&!Object.hasOwn(index,'author full names')))throw Error('This CSV does not have the Scopus publication columns. Include Title, Source title, and Authors or Author full names.');
 const records=[],warnings=[];
 rows.forEach((row,i)=>{
  if(row.length!==headers.length)throw Error('CSV row '+(i+2)+' has '+row.length+' fields; expected '+headers.length+'. No publications were added.');
  const get=(...names)=>{for(const name of names){if(Object.hasOwn(index,name)&&text(row[index[name]]))return text(row[index[name]]);}return '';};
  const title=get('title');if(!title){warnings.push('Skipped CSV row '+(i+2)+': no article title.');return;}
  const authors=get('author full names')?fullAuthors(get('author full names')):shortAuthors(get('authors'));
  const journal=get('source title'),year=get('year'),start=get('page start'),end=get('page end'),article=get('art. no.','article number','article no.');
  const pages=start?(end&&end!==start?start+'–'+end:start):article||end;
  const doi=get('doi').replace(/^https?:\/\/(?:dx\.)?doi\.org\//i,'').replace(/^doi:\s*/i,'');
  const review=[];if(!authors)review.push('Check authors');if(!journal)review.push('Add journal or venue');if(!year)review.push('Add publication year');if(!doi)review.push('DOI not supplied');
  if(get('publication stage')&&get('publication stage').toLowerCase()!=='final')review.push('Publication stage: '+get('publication stage'));
  const source=['Imported from Scopus CSV',get('eid'),get('document type'),get('publication stage')].filter(Boolean).join(' / ');
  records.push({title,authors,journal,year,volume:get('volume'),issue:get('issue'),pages,doi,metrics:'',review:review.join('; '),source});
 });
 if(!records.length)throw Error('No publications with titles found in this Scopus CSV export.');return {records,warnings};
}
const api={parse,csvRows,fullAuthors,shortAuthors};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ScopusImport=api;
})(typeof window!=='undefined'?window:globalThis);
