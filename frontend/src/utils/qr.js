export function parseQrCode(value) {
 const raw=String(value||'').trim();let code=raw;
 if(/^https?:\/\//i.test(raw)||raw.startsWith('/')){
  let url;try{url=new URL(raw,'https://hoianguide.invalid');}catch{return null;}
  const path=url.pathname.match(/^\/poi\/([^/]+)\/?$/i);code=url.searchParams.get('qr');
  if(code==null && path){try{code=decodeURIComponent(path[1]);}catch{return null;}}
 }
 return typeof code==='string' && /^[^\s/?#:\\]{1,100}$/u.test(code)?code:null;
}
