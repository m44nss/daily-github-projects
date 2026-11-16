const $ = s => document.querySelector(s);
const KEY = "fetchlab.history.v1";
const demos = {
  get: { method:"GET", url:"https://jsonplaceholder.typicode.com/posts/1", body:"" },
  post: { method:"POST", url:"https://jsonplaceholder.typicode.com/posts", body:JSON.stringify({title:"Learning Fetch API",body:"Hello from FetchLab",userId:1},null,2) }
};
let controller = null, latest = "", latestHeaders = "", timer;
let historyItems = loadHistory();

function loadHistory(){try{const v=JSON.parse(localStorage.getItem(KEY)||"[]");return Array.isArray(v)?v.slice(0,8):[]}catch{return []}}
function toast(text){$("#toast").textContent=text;$("#toast").classList.add("show");clearTimeout(timer);timer=setTimeout(()=>$("#toast").classList.remove("show"),2200)}
function message(text,error=false){$("#message").textContent=text;$("#message").style.color=error?"#ffadb6":"#9be3c2"}
function renderHistory(){
 const box=$("#history");box.replaceChildren();$("#count").textContent=historyItems.length;$("#clearHistory").disabled=!historyItems.length;
 if(!historyItems.length){const e=document.createElement("div");e.className="empty-history";e.textContent="Your recent requests will be saved in this browser.";box.append(e);return}
 historyItems.forEach(item=>{
  const row=document.createElement("div");row.className="history-item";
  const method=document.createElement("b");method.textContent=item.method;method.style.color=item.method==="GET"?"#9be3c2":"#c9b8f0";
  const url=document.createElement("code");url.textContent=item.url;url.title=item.url;
  const status=document.createElement("small");status.textContent=item.status||"ERR";
  const replay=document.createElement("button");replay.textContent="Replay";replay.type="button";
  replay.addEventListener("click",()=>{$("#method").value=item.method;$("#url").value=item.url;$("#headers").value=JSON.stringify(item.headers||{},null,2);$("#body").value=item.body||"";message("Request restored. Press Send to run it again.");window.scrollTo({top:0,behavior:"smooth"})});
  row.append(method,url,status,replay);box.append(row);
 });
}
function saveHistory(item){
 historyItems=[item,...historyItems.filter(x=>x.url!==item.url||x.method!==item.method)].slice(0,8);
 try{localStorage.setItem(KEY,JSON.stringify(historyItems))}catch{message("Could not save history: browser storage may be full.",true)}
 renderHistory();
}
function showView(name){
 document.querySelectorAll("[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===name));
 const data=name==="body"?latest:latestHeaders;
 $("#empty").hidden=!!data;$("#output").hidden=!data;$("#output").textContent=data||"";
}
async function send(event){
 event?.preventDefault();if(controller)return;
 let url,headers,body=$("#body").value,method=$("#method").value,headerObject;
 try{
  url=new URL($("#url").value.trim());
  if(!["http:","https:"].includes(url.protocol))throw Error("Only HTTP and HTTPS URLs are supported.");
  headerObject=JSON.parse($("#headers").value||"{}");
  if(!headerObject||Array.isArray(headerObject)||typeof headerObject!=="object")throw Error("Headers must be a JSON object.");
  headers=new Headers(headerObject);
  if(!["GET","HEAD"].includes(method)&&body.trim()){
   if(!headers.has("content-type"))headers.set("Content-Type","application/json");
   if(headers.get("content-type").includes("application/json"))JSON.parse(body);
  }
 }catch(e){message(e.message||"Check the request URL, headers and JSON body.",true);return}

 const ctl=new AbortController();controller=ctl;const start=performance.now();
 $("#send").hidden=true;$("#cancel").hidden=false;$("#state").textContent="RUNNING";
 $("#status").textContent="…";$("#status").className="";$("#time").textContent="…";$("#size").textContent="…";message("Sending request…");
 const timeout=setTimeout(()=>ctl.abort("timeout"),20000);
 try{
  const opts={method,headers,signal:ctl.signal};
  if(!["GET","HEAD"].includes(method)&&body.trim())opts.body=body;
  const res=await fetch(url.toString(),opts);
  const text=method==="HEAD"?"":await res.text();
  const elapsed=Math.round(performance.now()-start);
  let display=text,kind="TEXT";
  if(text&&((res.headers.get("content-type")||"").includes("json")||/^[\s]*[\[{]/.test(text))){
   try{display=JSON.stringify(JSON.parse(text),null,2);kind="JSON"}catch{}
  }
  if(!display)display="The response body is empty.";
  latest=display;
  latestHeaders=[...res.headers.entries()].map(([k,v])=>k+": "+v).join("\n")||"No response headers.";
  $("#state").textContent=res.ok?"SUCCESS":"HTTP ERROR";
  $("#status").textContent=res.status+" "+res.statusText;$("#status").className=res.ok?"good":"bad";
  $("#time").textContent=elapsed+" ms";$("#size").textContent=new TextEncoder().encode(text).length+" B";
  $("#responseType").textContent=kind+" RESPONSE";$("#copy").disabled=false;showView("body");
  message("Completed in "+elapsed+" ms.");
  saveHistory({method,url:url.toString(),headers:headerObject,body,status:res.status,ok:res.ok});
 }catch(e){
  const reason=ctl.signal.aborted?(ctl.signal.reason==="timeout"?"Request timed out after 20 seconds.":"Request cancelled."):"Network request failed: "+(e.message||"Unknown error")+". This may be a CORS restriction.";
  latest=reason;latestHeaders="";$("#state").textContent="ERROR";$("#status").textContent="ERR";$("#status").className="bad";
  $("#time").textContent=Math.round(performance.now()-start)+" ms";$("#size").textContent="—";
  $("#responseType").textContent="REQUEST FAILED";$("#copy").disabled=false;showView("body");message("The request did not complete.",true);
 }finally{
  clearTimeout(timeout);controller=null;$("#send").hidden=false;$("#cancel").hidden=true;
 }
}
function loadDemo(name){
 const d=demos[name];$("#method").value=d.method;$("#url").value=d.url;$("#body").value=d.body;
 $("#headers").value=JSON.stringify({Accept:"application/json"},null,2);
 message(name.toUpperCase()+" sample loaded. Press Send.");
}
$("#requestForm").addEventListener("submit",send);
document.querySelectorAll("[data-demo]").forEach(b=>b.addEventListener("click",()=>loadDemo(b.dataset.demo)));
document.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.view)));
$("#cancel").addEventListener("click",()=>controller?.abort("cancelled"));
$("#clear").addEventListener("click",()=>{loadDemo("get");message("Request fields reset.")});
$("#copy").addEventListener("click",async()=>{
 if(!latest)return;
 try{await navigator.clipboard.writeText(latest);toast("Response copied.")}
 catch{toast("Clipboard permission was blocked.")}
});
$("#clearHistory").addEventListener("click",()=>{
 if(!confirm("Clear all saved request history?"))return;
 historyItems=[];localStorage.removeItem(KEY);renderHistory();toast("History cleared.");
});
loadDemo("get");renderHistory();
