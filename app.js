const PASSWORD = "2009810";
const startDate = new Date("2026-06-21T00:00:00+02:00");
const login = document.getElementById("login");
const site = document.getElementById("site");
const toast = document.getElementById("toast");
let toastTimer, typeTimer;

function showToast(message){
  toast.textContent = message; toast.classList.add("show");
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>toast.classList.remove("show"),2400);
}
function go(page){
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active-page"));
  const target=document.getElementById(page);
  if(target){target.classList.add("active-page");window.scrollTo({top:0,behavior:"smooth"});}
}
document.getElementById("login-form").addEventListener("submit",e=>{
  e.preventDefault();
  const value=document.getElementById("password").value;
  if(value===PASSWORD){
    login.classList.add("hidden");site.classList.remove("hidden");go("home");
    sessionStorage.setItem("banoty-session","open");showToast("نورتي عالمنا يا بنوتي ❤️");
  }else{
    document.getElementById("login-error").textContent="كلمة السر مش مظبوطة يا روحي، جربي تاني ❤️";
  }
});
document.addEventListener("click",e=>{
  const nav=e.target.closest("[data-go]");
  if(nav){e.preventDefault();go(nav.dataset.go);}
  const action=e.target.closest("[data-action]");
  if(action?.dataset.action==="music"){document.getElementById("audio-upload").click();showToast("اختاري أغنيتكم من جهازك 🎵");}
  const env=e.target.closest("[data-message]");
  if(env){
    const messages={
      morning:"صباحك حلو شبه قلبك يا بنوتي. أتمنى يومك يكون خفيف على قلبك ومليان حاجات تفرحك. ❤️",
      miss:"لو وحشتيني، افتكري إنك في بالي حتى وسط زحمة اليوم. ربنا يديم وجودك في حياتي يا حبوبتي. 🥹",
      proud:"أنا فخور بيكي وبكل خطوة بتاخديها، حتى الخطوات الصغيرة اللي محدش بياخد باله منها. إنتِ قدها يا قلبي. ❤️"
    };
    const box=document.getElementById("message-box");box.textContent=messages[env.dataset.message];box.classList.remove("hidden");
  }
});
const audio=document.getElementById("audio"), playBtn=document.getElementById("play-toggle");
const seek=document.getElementById("seek"), trackName=document.getElementById("track-name"), trackTime=document.getElementById("track-time");
const status=document.getElementById("music-status");
document.getElementById("audio-upload").addEventListener("change",e=>{
  const file=e.target.files?.[0];if(!file)return;
  audio.src=URL.createObjectURL(file);trackName.textContent=file.name;trackTime.textContent="جاهزة للتشغيل";
  audio.play().then(updatePlay).catch(()=>showToast("اضغطي تشغيل لبدء الأغنية"));
});
function updatePlay(){const playing=!audio.paused;playBtn.textContent=playing?"Ⅱ":"▶";status.classList.toggle("playing",playing);status.innerHTML=`<i></i> ${playing?"الموسيقى تعمل":"الموسيقى متوقفة"}`;}
playBtn.addEventListener("click",()=>{
  if(!audio.src){document.getElementById("audio-upload").click();return;}
  if(audio.paused)audio.play().then(updatePlay);else{audio.pause();updatePlay();}
});
audio.addEventListener("play",updatePlay);audio.addEventListener("pause",updatePlay);
audio.addEventListener("timeupdate",()=>{
  if(audio.duration){seek.value=(audio.currentTime/audio.duration)*100;trackTime.textContent=`${fmt(audio.currentTime)} / ${fmt(audio.duration)}`;}
});
seek.addEventListener("input",()=>{if(audio.duration)audio.currentTime=(seek.value/100)*audio.duration;});
audio.addEventListener("ended",()=>{updatePlay();seek.value=0;});
function fmt(s){if(!Number.isFinite(s))return"0:00";return `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,"0")}`;}

function updateCounter(){
  let diff=Math.max(0,Date.now()-startDate.getTime());
  const d=Math.floor(diff/86400000);diff%=86400000;
  const h=Math.floor(diff/3600000);diff%=3600000;
  const m=Math.floor(diff/60000);const s=Math.floor((diff%60000)/1000);
  document.getElementById("days").textContent=d;
  document.getElementById("hours").textContent=h;
  document.getElementById("minutes").textContent=m;
  document.getElementById("seconds").textContent=s;
}
updateCounter();setInterval(updateCounter,1000);

document.getElementById("photo-upload").addEventListener("change",e=>{
  const grid=document.getElementById("photo-grid");
  if(grid.querySelector(".empty-state"))grid.innerHTML="";
  [...e.target.files].forEach(file=>{
    if(!file.type.startsWith("image/"))return;
    const img=document.createElement("img");img.alt="ذكرى جميلة";img.src=URL.createObjectURL(file);grid.appendChild(img);
  });
  showToast("اتضافت الصور للجلسة دي ❤️");
});
document.getElementById("dream-form").addEventListener("submit",e=>{
  e.preventDefault();const input=document.getElementById("dream-input");const value=input.value.trim();if(!value)return;
  const li=document.createElement("li");li.textContent=value+" ♡";document.getElementById("dream-list").appendChild(li);input.value="";
});
document.getElementById("gift-button").addEventListener("click",()=>{
  document.getElementById("gift-message").classList.remove("hidden");
  document.getElementById("gift-button").textContent="💝";showToast("مفاجأة من قلبي ليكي ❤️");
});

const letter = `أنا من أول ما اتكلمت معاكي وأنا حسيت إني لقيت نصي التاني، روحي اللي ضاعت مني.
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
function typeLetter(){
  clearInterval(typeTimer);const box=document.getElementById("typed-letter");box.textContent="";
  let i=0;typeTimer=setInterval(()=>{box.textContent=letter.slice(0,i+=4);if(i>=letter.length)clearInterval(typeTimer);},24);
}
document.getElementById("open-heart").addEventListener("click",()=>{
  document.getElementById("open-heart").classList.add("hidden");
  document.getElementById("love-letter").classList.remove("hidden");
  typeLetter();showToast("رسالة من قلب أحمد لقلبك ❤️");
});
document.getElementById("replay-letter").addEventListener("click",typeLetter);

// Gentle falling petals, created only while the site is open.
const petals=document.getElementById("petals");
setInterval(()=>{
  if(site.classList.contains("hidden"))return;
  const p=document.createElement("span");p.className="petal";p.textContent=["✿","♥","❀"][Math.floor(Math.random()*3)];
  p.style.left=Math.random()*100+"vw";p.style.fontSize=(10+Math.random()*10)+"px";p.style.animationDuration=(7+Math.random()*7)+"s";
  petals.appendChild(p);setTimeout(()=>p.remove(),15000);
},900);

// Return to login on a fresh tab; session stays open while navigating this tab.
if(sessionStorage.getItem("banoty-session")==="open"){login.classList.add("hidden");site.classList.remove("hidden");go("home");}
