const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Banoty-Key",
  "Access-Control-Max-Age": "86400"
};
const json = (data, status=200) => new Response(JSON.stringify(data), {status, headers:{...cors,"Content-Type":"application/json; charset=utf-8"}});
function authorized(request, env){ return Boolean(env.ROOM_KEY) && request.headers.get("X-Banoty-Key") === env.ROOM_KEY; }
function id(){ return crypto.randomUUID(); }
export default {
  async fetch(request, env){
    const url = new URL(request.url);
    if(request.method === "OPTIONS") return new Response(null,{headers:cors});
    if(!url.pathname.startsWith("/api/")) return json({error:"Not found"},404);
    if(!authorized(request,env)) return json({error:"Unauthorized"},401);
    try {
      if(url.pathname === "/api/health" && request.method === "GET") return json({ok:true,service:"BANOTY cloud"});
      if(url.pathname === "/api/messages" && request.method === "GET") {
        const {results=[]}=await env.DB.prepare("SELECT id,sender,body AS text,created_at AS createdAt FROM messages ORDER BY created_at DESC LIMIT 500").all(); return json({items:results});
      }
      if(url.pathname === "/api/messages" && request.method === "POST") {
        const b=await request.json(); if(!b.text || !['أحمد','بنوتي'].includes(b.sender) || String(b.text).length>3000) return json({error:"Invalid message"},400);
        const record={id:id(),sender:b.sender,text:String(b.text).trim(),createdAt:Date.now()};
        await env.DB.prepare("INSERT INTO messages(id,sender,body,created_at) VALUES(?,?,?,?)").bind(record.id,record.sender,record.text,record.createdAt).run(); return json(record,201);
      }
      const messageDelete=url.pathname.match(/^\/api\/messages\/([\w-]+)$/);
      if(messageDelete && request.method === "DELETE"){await env.DB.prepare("DELETE FROM messages WHERE id=?").bind(messageDelete[1]).run();return json({ok:true});}
      if(url.pathname === "/api/dreams" && request.method === "GET") {const {results=[]}=await env.DB.prepare("SELECT id,body AS text,created_at AS createdAt FROM dreams ORDER BY created_at DESC").all();return json({items:results});}
      if(url.pathname === "/api/dreams" && request.method === "POST") {const b=await request.json();if(!b.text||String(b.text).length>120)return json({error:"Invalid dream"},400);const r={id:id(),text:String(b.text).trim(),createdAt:Date.now()};await env.DB.prepare("INSERT INTO dreams(id,body,created_at) VALUES(?,?,?)").bind(r.id,r.text,r.createdAt).run();return json(r,201);}
      const dreamDelete=url.pathname.match(/^\/api\/dreams\/([\w-]+)$/);if(dreamDelete&&request.method==="DELETE"){await env.DB.prepare("DELETE FROM dreams WHERE id=?").bind(dreamDelete[1]).run();return json({ok:true});}
      if(url.pathname === "/api/media" && request.method === "GET") {const {results=[]}=await env.DB.prepare("SELECT id,filename,content_type AS type,size,created_at AS createdAt FROM media ORDER BY created_at DESC LIMIT 200").all();return json({items:results.map(x=>({...x,url:`${url.origin}/api/media/${x.id}`}))});}
      if(url.pathname === "/api/media" && request.method === "POST") {
        const form=await request.formData(),file=form.get("file");if(!(file instanceof File))return json({error:"Missing file"},400);
        if(!/^(image\/|video\/)/.test(file.type)||file.size>100*1024*1024)return json({error:"Unsupported file or size over 100MB"},400);
        const key=`${id()}-${file.name.replace(/[^\p{L}\p{N}._-]/gu,'_')}`;await env.MEDIA.put(key,file.stream(),{httpMetadata:{contentType:file.type}});
        const r={id:id(),object_key:key,filename:file.name,content_type:file.type,size:file.size,created_at:Date.now()};await env.DB.prepare("INSERT INTO media(id,object_key,filename,content_type,size,created_at) VALUES(?,?,?,?,?,?)").bind(r.id,r.object_key,r.filename,r.content_type,r.size,r.created_at).run();return json({id:r.id},201);
      }
      const mediaMatch=url.pathname.match(/^\/api\/media\/([\w-]+)$/);
      if(mediaMatch && request.method === "GET"){const r=await env.DB.prepare("SELECT * FROM media WHERE id=?").bind(mediaMatch[1]).first();if(!r)return json({error:"Not found"},404);const obj=await env.MEDIA.get(r.object_key);if(!obj)return json({error:"Missing object"},404);return new Response(obj.body,{headers:{...cors,"Content-Type":r.content_type,"Content-Disposition":"inline; filename*=UTF-8''"+encodeURIComponent(r.filename),"Cache-Control":"private, max-age=3600"}});}
      if(mediaMatch && request.method === "DELETE"){const r=await env.DB.prepare("SELECT object_key FROM media WHERE id=?").bind(mediaMatch[1]).first();if(r)await env.MEDIA.delete(r.object_key);await env.DB.prepare("DELETE FROM media WHERE id=?").bind(mediaMatch[1]).run();return json({ok:true});}
      return json({error:"Not found"},404);
    } catch(e){return json({error:"Server error",detail:env.ENVIRONMENT==="development"?String(e):undefined},500);}
  }
};
