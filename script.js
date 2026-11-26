// BANOTY — first mobile build
// Note: this client-side password is only a visual gate, NOT secure authentication.
const SITE_PASSWORD = "2009810";
const loginScreen = document.getElementById("loginScreen");
const website = document.getElementById("website");
const toast = document.getElementById("toast");
let toastTimer, typingTimer;

function notify(message){
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2300);
}
function showPage(id){
  document.querySelectorAll(".page").forEach(page => page.classList.remove("active"));
  const page = document.getElementById(id);
  if(page){ page.classList.add("active"); window.scrollTo({top:0, behavior:"smooth"}); }
}
document.getElementById("loginForm").addEventListener("submit", event => {
  event.preventDefault();
  const entered = document.getElementById("password").value;
  if(entered === SITE_PASSWORD){
    loginScreen.classList.add("hidden");
    website.classList.remove("hidden");
    sessionStorage.setItem("banoty-open","yes");
    showPage("home");
    notify("نورتي عالمنا يا بنوتي ❤️");
  }else{
    document.getElementById("loginError").textContent = "كلمة السر مش مظبوطة يا روحي، جربي تاني ❤️";
  }
});
document.addEventListener("click", event => {
  const pageButton = event.target.closest("[data-page]");
  if(pageButton){ event.preventDefault(); showPage(pageButton.dataset.page); }
});
if(sessionStorage.getItem("banoty-open") === "yes"){
  loginScreen.classList.add("hidden");
  website.classList.remove("hidden");
}

const audio = document.getElementById("audio");
const playButton = document.getElementById("playButton");
const progress = document.getElementById("progress");
const trackName = document.getElementById("trackName");
const trackTime = document.getElementById("trackTime");
const musicIndicator = document.getElementById("musicIndicator");
let bundledTracks = [];
let bundledTrackIndex = 0;
let loadedBundledTrack = false;

async function loadBundledPlaylist(){
  try{
    const response = await fetch("music/playlist.json", { cache: "no-store" });
    if(!response.ok) throw new Error("Playlist not found");
    const data = await response.json();
    bundledTracks = Array.isArray(data.tracks)
      ? data.tracks.filter(track => track && typeof track.src === "string" && track.src.startsWith("music/") && !track.src.includes(".."))
      : [];
    if(bundledTracks.length){
      trackName.textContent = bundledTracks[0].title || "أغنيتنا الخاصة";
      trackTime.textContent = "أغانينا المرفقة بالموقع";
    }else{
      trackName.textContent = "لا توجد أغنيات";
      trackTime.textContent = "تحققي من music/playlist.json";
    }
  }catch(error){
    bundledTracks = [];
    trackName.textContent = "تعذر تحميل قائمة الأغاني";
    trackTime.textContent = "تأكدي من رفع مجلد music";
  }
}
function playBundledTrack(index){
  if(!bundledTracks.length){
    notify("قائمة الأغاني غير موجودة. تأكدي من رفع مجلد music");
    return;
  }
  bundledTrackIndex = (index + bundledTracks.length) % bundledTracks.length;
  const track = bundledTracks[bundledTrackIndex];
  loadedBundledTrack = true;
  audio.src = track.src;
  trackName.textContent = track.title || track.src.split("/").pop();
  trackTime.textContent = "جاري تحميل الأغنية...";
  audio.load();
  audio.play().then(updateMusicUI).catch(() => notify("اضغطي زر التشغيل لبدء الأغنية"));
}
function chooseMusicSource(){
  if(!bundledTracks.length){
    notify("قائمة الأغاني غير جاهزة. تأكدي من رفع مجلد music");
    return;
  }
  if(loadedBundledTrack && audio.src){
    playBundledTrack(bundledTrackIndex + 1);
  }else{
    playBundledTrack(0);
  }
}
loadBundledPlaylist();

function updateMusicUI(){
  const playing = !audio.paused;
  playButton.textContent = playing ? "Ⅱ" : "▶";
  musicIndicator.classList.toggle("playing", playing);
  musicIndicator.innerHTML = `<i></i> ${playing ? "الموسيقى تعمل" : "الموسيقى متوقفة"}`;
  document.getElementById("musicPlayer").classList.toggle("playing", playing);
}
document.getElementById("chooseMusic").addEventListener("click", chooseMusicSource);
document.getElementById("cardMusic").addEventListener("click", chooseMusicSource);
playButton.addEventListener("click", () => {
  if(!audio.src){
    playBundledTrack(0);
  }else if(audio.paused){
    audio.play().then(updateMusicUI).catch(() => notify("تعذر تشغيل الأغنية"));
  }else{
    audio.pause();
    updateMusicUI();
  }
});
audio.addEventListener("play", updateMusicUI);
audio.addEventListener("pause", updateMusicUI);
audio.addEventListener("timeupdate", () => {
  if(!audio.duration) return;
  progress.value = audio.currentTime / audio.duration * 100;
  trackTime.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
});
progress.addEventListener("input", () => {
  if(audio.duration) audio.currentTime = Number(progress.value) / 100 * audio.duration;
});
audio.addEventListener("ended", () => {
  if(bundledTracks.length && loadedBundledTrack){
    playBundledTrack(bundledTrackIndex + 1);
  }else{
    updateMusicUI();
  }
});
audio.addEventListener("error", () => {
  if(audio.src) notify("تعذر تشغيل الأغنية. راجعي مسارها في playlist.json");
});
function formatTime(value){
  if(!Number.isFinite(value)) return "0:00";
  return `${Math.floor(value/60)}:${String(Math.floor(value%60)).padStart(2,"0")}`;
}

// Relationship counter: date chosen in the project brief.
const relationshipStart = new Date("2026-06-21T00:00:00+02:00");
function updateCounter(){
  let remaining = Math.max(0, Date.now() - relationshipStart.getTime());
  const days = Math.floor(remaining / 86400000); remaining %= 86400000;
  const hours = Math.floor(remaining / 3600000); remaining %= 3600000;
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  document.getElementById("days").textContent = days;
  document.getElementById("hours").textContent = hours;
  document.getElementById("minutes").textContent = minutes;
  document.getElementById("seconds").textContent = seconds;
}
updateCounter();
setInterval(updateCounter, 1000);

// Persistent local database (IndexedDB): media, messages and dreams survive reloads.
const DB_NAME = "BANOTY_MEMORIES";
const DB_VERSION = 1;
let dbPromise;
function openBanotyDB(){
  if(dbPromise) return dbPromise;
  dbPromise = new Promise((resolve,reject)=>{
    const request = indexedDB.open(DB_NAME,DB_VERSION);
    request.onupgradeneeded = () => {
      const db=request.result;
      if(!db.objectStoreNames.contains("media")){const s=db.createObjectStore("media",{keyPath:"id"});s.createIndex("createdAt","createdAt");}
      if(!db.objectStoreNames.contains("messages")){const s=db.createObjectStore("messages",{keyPath:"id"});s.createIndex("createdAt","createdAt");}
      if(!db.objectStoreNames.contains("dreams")) db.createObjectStore("dreams",{keyPath:"id"});
    };
    request.onsuccess=()=>resolve(request.result); request.onerror=()=>reject(request.error);
  });
  return dbPromise;
}
async function storeRecord(store,record){const db=await openBanotyDB();return new Promise((res,rej)=>{const tx=db.transaction(store,"readwrite");tx.objectStore(store).put(record);tx.oncomplete=()=>res(record);tx.onerror=()=>rej(tx.error);});}
async function getRecords(store){const db=await openBanotyDB();return new Promise((res,rej)=>{const r=db.transaction(store).objectStore(store).getAll();r.onsuccess=()=>res(r.result||[]);r.onerror=()=>rej(r.error);});}
async function deleteRecord(store,id){const db=await openBanotyDB();return new Promise((res,rej)=>{const tx=db.transaction(store,"readwrite");tx.objectStore(store).delete(id);tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error);});}
function safeDate(value){return new Date(value).toLocaleString("ar-EG",{dateStyle:"medium",timeStyle:"short"});}
async function renderMedia(){
  const grid=document.getElementById("photoGrid"); grid.replaceChildren();
  const items=(await getRecords("media")).sort((a,b)=>b.createdAt-a.createdAt);
  if(!items.length){grid.innerHTML='<p class="empty">لسه مستنيين أول ذكرى تتحط هنا 🌹</p>';return;}
  for(const item of items){
    const card=document.createElement("div");card.className="photo-item";
    const url=URL.createObjectURL(item.blob);let media;
    if(item.type.startsWith("video/")){media=document.createElement("video");media.controls=true;media.preload="metadata";}else{media=document.createElement("img");media.alt="ذكرى جميلة";}
    media.src=url;card.append(media);
    const del=document.createElement("button");del.className="delete-memory";del.textContent="حذف الذكرى";del.addEventListener("click",async()=>{if(confirm("تحب تحذف الذكرى دي نهائيًا؟")){await deleteRecord("media",item.id);URL.revokeObjectURL(url);renderMedia();notify("اتحذفت الذكرى ❤️");}});card.append(del);grid.append(card);
  }
}
document.getElementById("photoInput").addEventListener("change",async event=>{
  const files=[...event.target.files];
  for(const file of files){if(!file.type.startsWith("image/")&&!file.type.startsWith("video/"))continue;if(file.size>100*1024*1024){notify("الملف أكبر من 100 ميجابايت");continue;}await storeRecord("media",{id:crypto.randomUUID(),name:file.name,type:file.type,blob:file,createdAt:Date.now()});}
  event.target.value="";await renderMedia();notify("ذكرياتك اتحفظت على الجهاز ❤️");
});
renderMedia().catch(()=>notify("تعذر فتح مساحة حفظ الذكريات"));

// Two-way love notes. Sender chooses their name; each entry remains until deleted.
let activeInbox="all";
async function renderMessages(){
  const list=document.getElementById("messageList");list.replaceChildren();
  const records=(await getRecords("messages")).sort((a,b)=>b.createdAt-a.createdAt).filter(m=>activeInbox==="all"||m.sender===activeInbox);
  if(!records.length){list.innerHTML='<p class="empty">لسه مفيش رسائل في الصندوق ده ❤️</p>';return;}
  for(const m of records){const card=document.createElement("article");card.className="message-entry";const meta=document.createElement("small");meta.textContent=`من ${m.sender} • ${safeDate(m.createdAt)}`;const body=document.createElement("p");body.textContent=m.text;const actions=document.createElement("div");actions.className="message-actions";const del=document.createElement("button");del.className="delete-message";del.textContent="حذف الرسالة";del.addEventListener("click",async()=>{if(confirm("متأكد إنك عايز تحذف الرسالة؟")){await deleteRecord("messages",m.id);renderMessages();notify("اتحذفت الرسالة");}});actions.append(del);card.append(meta,body,actions);list.append(card);}
}
document.getElementById("sendMessage").addEventListener("click",async()=>{const input=document.getElementById("messageText"),text=input.value.trim();if(!text){notify("اكتب الرسالة الأول يا روحي ❤️");return;}const sender=document.getElementById("messageSender").value;await storeRecord("messages",{id:crypto.randomUUID(),sender,text,createdAt:Date.now(),read:false});input.value="";activeInbox="all";document.querySelectorAll("[data-inbox]").forEach(b=>b.classList.toggle("active",b.dataset.inbox==="all"));await renderMessages();notify("رسالتك اتحفظت في صندوق الرسائل 💌");});
document.querySelectorAll("[data-inbox]").forEach(button=>button.addEventListener("click",()=>{activeInbox=button.dataset.inbox;document.querySelectorAll("[data-inbox]").forEach(b=>b.classList.toggle("active",b===button));renderMessages();}));
renderMessages().catch(()=>{});


// Envelope messages
const envelopeMessages = {
  morning: "صباحك حلو شبه قلبك يا بنوتي. أتمنى يومك يكون خفيف على قلبك ومليان حاجات تفرحك. ❤️",
  miss: "لو وحشتيني، افتكري إنك في بالي حتى وسط زحمة اليوم. ربنا يديم وجودك في حياتي يا حبوبتي. 🥹",
  proud: "أنا فخور بيكي وبكل خطوة بتاخديها، حتى الخطوات الصغيرة اللي محدش بياخد باله منها. إنتِ قدها يا قلبي. ❤️"
};
document.querySelectorAll("[data-letter]").forEach(button => {
  button.addEventListener("click", () => {
    const box = document.getElementById("envelopeMessage");
    box.textContent = envelopeMessages[button.dataset.letter];
    box.classList.remove("hidden");
  });
});

// Dreams are persistent too, with a delete action.
async function renderDreams(){const list=document.getElementById("dreamList");list.replaceChildren();const dreams=await getRecords("dreams");if(!dreams.length){const li=document.createElement("li");li.textContent="نفضل دايمًا سند وراحة لبعض ❤️";list.append(li);return;}for(const dream of dreams){const li=document.createElement("li");li.textContent=dream.text+" ♡ ";const del=document.createElement("button");del.className="delete-memory";del.textContent="حذف";del.addEventListener("click",async()=>{await deleteRecord("dreams",dream.id);renderDreams();});li.append(del);list.append(li);}}
document.getElementById("dreamForm").addEventListener("submit",async event=>{event.preventDefault();const input=document.getElementById("dreamInput"),dream=input.value.trim();if(!dream)return;await storeRecord("dreams",{id:crypto.randomUUID(),text:dream,createdAt:Date.now()});input.value="";await renderDreams();notify("اتضاف حلم جديد واتحفظ ✨");});
renderDreams().catch(()=>{});

document.getElementById("giftButton").addEventListener("click", () => {
  document.getElementById("giftMessage").classList.remove("hidden");
  document.getElementById("giftButton").textContent = "💝";
  notify("مفاجأة من قلبي ليكي ❤️");
});

const fullLetter = `أنا من أول ما اتكلمت معاكي وأنا حسيت إني لقيت نصي التاني، روحي اللي ضاعت مني.
كنت بطلت أحلم، بطلت أحب، بطلت أعيش. كنت بضحك علشان بس الناس متقوليش مالك.
إنما من ساعة ما بقيت معاكي وأنا حسيت قد إيه أنا عايش، وحياتي بقت مهمة عندك وحياتك مهمة عندي.
أنا حبيتك من كل قلبي، وحبي ليكي بيزيد يوم بعد يوم. بشوفك دايمًا جوه قلبي، بفكر فيكي كل ثانية بتعدي. بفكر فيكي: هل إنتِ كويسة؟ هل إنتِ بخير؟
دايمًا بفكر فيكي وفي كلامك وفي حبك ليا 🥹♥️
دايمًا بشوفك أجمل حاجة شافتها عيني. بحبك، ولو قلتها ألف مرة مش هتكفي.
حبك سكن جوه قلبي وخلاص. مش هحب غيرك ولا هسيبك ولا هبعد عنك، حتى لو الكل وقف ضدنا 🥹♥️
بعشقك يا عسلية 🥹😍❤️
بموت فيكي يا قلب بابا 🥹❤️
بدمنك يا مراتي 🥰❤️
بدوب في جمالك يا أم العيال 🥹😍❤️

عايزك تعرفي إن كل كلمة هنا مش مجرد كلام مكتوب على شاشة، دي مشاعر حقيقية جوايا.
يمكن ساعات معرفش أعبّر بالطريقة اللي تستحقيها، ويمكن ساعات الكلام يخوني، لكن ده مش معناه إن إحساسي قليل.
أنا بحب تفاصيلك، بحب وجودك، وبحب إن ليكي مكانة مختلفة محدش يقدر ياخدها.
نفسي أفضل أشوفك مبسوطة، وأكون شخص تقدري تحكيله من غير خوف، وتكوني على طبيعتك معاه.
مش بوعدك إن كل الأيام هتكون مثالية، لكن بوعدك إني أحاول أكون صادق معاكي، وأسمعك، وأحترمك، وأقدّر وجودك.
نفسي نكبر ونحقق أحلامنا ونفتكر الأيام دي ونضحك ونقول: فاكرة الموقع اللي اتعمل علشانك؟
أنا عملته علشانك لأنك تستاهلي تعرفي مكانتك عندي.
ولو في يوم نسيتي قد إيه إنتِ غالية، افتحي الصفحة دي واقري الكلام من أوله.
هتلاقي فيه قلب اختارك، وبيحبك، وبيتمنى يشوفك سعيدة.

بحبك يا بنوتي، يا عسلية، يا أم العيال.
ومن قلبي لقلبك...
إنتِ أجمل حكاية. 🥹❤️`;
function typeLoveLetter(){
  clearInterval(typingTimer);
  const target = document.getElementById("typedText");
  target.textContent = "";
  let position = 0;
  typingTimer = setInterval(() => {
    position += 4;
    target.textContent = fullLetter.slice(0, position);
    if(position >= fullLetter.length) clearInterval(typingTimer);
  }, 22);
}
document.getElementById("openHeart").addEventListener("click", () => {
  document.getElementById("openHeart").classList.add("hidden");
  document.getElementById("loveLetter").classList.remove("hidden");
  typeLoveLetter();
  notify("رسالة من قلب أحمد لقلبك ❤️");
});
document.getElementById("replayLetter").addEventListener("click", typeLoveLetter);

// Soft falling hearts and petals.
setInterval(() => {
  if(website.classList.contains("hidden")) return;
  const petal = document.createElement("span");
  petal.className = "petal";
  petal.textContent = ["♥","✿","❀"][Math.floor(Math.random()*3)];
  petal.style.left = Math.random()*100 + "vw";
  petal.style.fontSize = (10 + Math.random()*11) + "px";
  petal.style.animationDuration = (7 + Math.random()*7) + "s";
  document.getElementById("petals").appendChild(petal);
  setTimeout(() => petal.remove(), 15000);
}, 900);

// Hearts burst gently wherever the visitor taps or clicks.
(() => {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const layer = document.createElement('div');
  layer.className = 'click-heart-layer';
  layer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(layer);
  let lastBurst = 0;
  document.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const now = Date.now();
    if (now - lastBurst < 65) return;
    lastBurst = now;
    const symbols = ['♥', '❤', '💕', '♡'];
    const count = 3;
    for (let i = 0; i < count; i++) {
      const heart = document.createElement('span');
      heart.className = 'click-heart';
      heart.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      heart.style.left = `${event.clientX + (Math.random() - .5) * 34}px`;
      heart.style.top = `${event.clientY + (Math.random() - .5) * 22}px`;
      heart.style.fontSize = `${17 + Math.random() * 15}px`;
      heart.style.setProperty('--heart-drift', `${(Math.random() - .5) * 95}px`);
      heart.style.setProperty('--heart-rotate', `${(Math.random() - .5) * 65}deg`);
      layer.appendChild(heart);
      heart.addEventListener('animationend', () => heart.remove(), { once: true });
    }
  }, { passive: true });
})();
