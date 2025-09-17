// ============ מצב אפליקציה ============
let currentTab = 'practice';
let metronomeInterval = null;
let metronomeAudioContext = null;
let metronomeIsRunning = false;
let currentBPM = 100;
let currentBeat = 0;
let timeSignature = '4/4';
let exerciseTimers = {};
let exerciseStartTimes = {};
let isTimerRunning = {};
let currentExercise = null;
let currentEditingExercise = null;
let lastExerciseContext = null; // { exerciseId, elapsedSec }

// אודיו
let clickBuffer = null;
let accentBuffer = null;
let gainNode = null;
const BPM_STEP = 3; // צעד התאמה בסיום תרגיל

// נתוני ברירת מחדל
const defaultExercises = [
  { id: 1, name: "תרגילי אצבעות", duration: 8, description: "סולמות ותרגילי זריזות", bpm: 100 },
  { id: 2, name: "חילופי אקורדים", duration: 8, description: "מעבר בין אקורדים שונים", bpm: 100 },
  { id: 3, name: "קואורדינציה", duration: 7, description: "תיאום ידיים ובלגן", bpm: 100 },
  { id: 4, name: "רפרטואר", duration: 7, description: "יצירות שלמות או קטעים", bpm: 100 }
];

// ============ אתחול ============
document.addEventListener('DOMContentLoaded', () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
  initializeApp();
  setupEventListeners();
  loadExercises();
  loadProgress();
  loadSettings();
  setupSliderOverlay();  // יוצר עטיפה + overlay לאנימציה על הסליידר
  setupAudioUnlock();    // דואג ל-AudioContext תקין על אינטראקציה
});

// ============ אחסון ============
function initializeApp(){
  if(!localStorage.getItem('accordionData')){
    const initialData = {
      exercises: defaultExercises,
      sessions: [],
      settings: { defaultBPM: 100, metronomeSound: 'click', volume: 70, autoIncreaseBPM: false, vibrateMode: false }
    };
    localStorage.setItem('accordionData', JSON.stringify(initialData));
  }
}
function getData(){ return JSON.parse(localStorage.getItem('accordionData')) || {exercises:[],sessions:[],settings:{}}; }
function setData(data){ localStorage.setItem('accordionData', JSON.stringify(data)); }
function getSettings(){ return getData().settings || {}; }

// ============ אירועים ============
function setupEventListeners(){
  // ניווט
  document.querySelectorAll('.nav-btn').forEach(btn => btn.addEventListener('click', e => switchTab(e.currentTarget.dataset.tab)));

  // מטרונום
  document.getElementById('metronome-toggle').addEventListener('click', toggleMetronome);
  document.getElementById('bpm-slider').addEventListener('input', e => {
    currentBPM = parseInt(e.target.value,10);
    document.getElementById('bpm-value').textContent = currentBPM;
    if (metronomeIsRunning){ stopMetronome(); startMetronome(); }
    updateThumbOverlay();
  });
  document.getElementById('time-signature').addEventListener('change', e => { timeSignature = e.target.value; currentBeat = 0; });

  // הגדרות
  document.getElementById('metronome-sound').addEventListener('change', () => {
    createMetronomeSounds();
    currentBeat = 0;   // ישמע מיד אקסנט אחרי שינוי
    saveSettings();
  });
  document.getElementById('volume-slider').addEventListener('input', () => { updateVolume(); saveSettings(); });
  document.getElementById('auto-increase-bpm').addEventListener('change', saveSettings);
  document.getElementById('vibrate-mode').addEventListener('change', saveSettings);
  document.getElementById('reset-data').addEventListener('click', () => { localStorage.removeItem('accordionData'); location.reload(); });

  // מקלדת: רווח מפעיל/עוצר, אבל לא כשפוקוס בשדה קלט
  document.addEventListener('keydown', e => {
    if (e.code === 'Space'){
      const el = document.activeElement;
      const tag = el && el.tagName ? el.tagName.toLowerCase() : '';
      const editable = el && (el.isContentEditable || tag === 'input' || tag === 'textarea');
      if (editable) return; // מאפשר רווח בשדות
      e.preventDefault();
      toggleMetronome();
    }
  });

  // מודאלים (עריכה + התאמת BPM)
  document.getElementById('save-exercise').addEventListener('click', saveExerciseEdit);
  document.getElementById('cancel-edit').addEventListener('click', closeFeedbackModal);
  document.getElementById('bpm-up').addEventListener('click', ()=>applyBpmAdjustment(+BPM_STEP));
  document.getElementById('bpm-down').addEventListener('click', ()=>applyBpmAdjustment(-BPM_STEP));
  document.getElementById('bpm-keep').addEventListener('click', ()=>applyBpmAdjustment(0));
}

// ============ אודיו ============
function setupAudioUnlock(){
  const unlock = async () => {
    try{
      if(!metronomeAudioContext){
        metronomeAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        gainNode = metronomeAudioContext.createGain();
        gainNode.connect(metronomeAudioContext.destination);
      }
      if(metronomeAudioContext.state === 'suspended'){
        await metronomeAudioContext.resume();
      }
      createMetronomeSounds();
      updateVolume();
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
    }catch(e){ console.warn('Audio unlock failed', e); }
  };
  window.addEventListener('touchstart', unlock, { once:false });
  window.addEventListener('click', unlock, { once:false });
  window.addEventListener('keydown', unlock, { once:false });
}

function ensureAudioReady(){
  if(!metronomeAudioContext){
    metronomeAudioContext = new (window.AudioContext || window.webkitAudioContext)();
    gainNode = metronomeAudioContext.createGain();
    gainNode.connect(metronomeAudioContext.destination);
  }
  if(metronomeAudioContext.state === 'suspended'){ metronomeAudioContext.resume(); }
  if(!clickBuffer || !accentBuffer){ createMetronomeSounds(); }
  updateVolume();
}

function currentSound(){ return document.getElementById('metronome-sound')?.value || 'click'; }

function createMetronomeSounds(){
  if(!metronomeAudioContext) return;
  const sr = metronomeAudioContext.sampleRate;
  const dur = 0.11;
  const type = currentSound();

  const makeBuffer = (freq, decay, noiseAmt) => {
    const buf = metronomeAudioContext.createBuffer(1, Math.max(1, Math.floor(sr*dur)), sr);
    const ch = buf.getChannelData(0);
    for(let i=0;i<ch.length;i++){
      const t = i/sr;
      const noise = (Math.random()*2-1)*noiseAmt*Math.exp(-t*30);
      const tone = Math.sin(2*Math.PI*freq*t)*Math.exp(-t*decay);
      ch[i] = noise + tone;
    }
    return buf;
  };

  switch(type){
    case 'beep':    clickBuffer = makeBuffer(1000, 25, 0.05); accentBuffer = makeBuffer(1600, 23, 0.06); break;
    case 'tick':    clickBuffer = makeBuffer(3000, 40, 0.02); accentBuffer = makeBuffer(3800, 38, 0.02); break;
    case 'wood':    clickBuffer = makeBuffer(750,  32, 0.18); accentBuffer = makeBuffer(900,  30, 0.20); break;
    case 'cowbell': clickBuffer = makeBuffer(1200, 18, 0.08); accentBuffer = makeBuffer(1500, 16, 0.09); break;
    case 'click':
    default:        clickBuffer = makeBuffer(950,  22, 0.25); accentBuffer = makeBuffer(1400, 20, 0.28); break;
  }
}

function updateVolume(){
  const slider = document.getElementById('volume-slider');
  const v = slider ? slider.value/100 : 0.7;
  if(gainNode) gainNode.gain.value = v;
  const disp = document.getElementById('volume-display');
  if(disp) disp.textContent = Math.round(v*100)+'%';
}

function playClick(isAccent=false){
  const settings = getSettings();
  if(settings.vibrateMode && 'vibrate' in navigator){
    navigator.vibrate(isAccent?100:50); // רטט וגם צליל
  }
  if(!metronomeAudioContext) return;
  if(metronomeAudioContext.state === 'suspended') metronomeAudioContext.resume();

  const src = metronomeAudioContext.createBufferSource();
  src.buffer = (isAccent ? accentBuffer : clickBuffer) || clickBuffer;
  if(!src.buffer){
    const osc = metronomeAudioContext.createOscillator();
    osc.type = 'square';
    osc.frequency.value = isAccent ? 1400 : 900;
    const env = metronomeAudioContext.createGain();
    env.gain.value = 0.7;
    env.gain.exponentialRampToValueAtTime(0.0001, metronomeAudioContext.currentTime + 0.1);
    osc.connect(env).connect(gainNode);
    osc.start(); osc.stop(metronomeAudioContext.currentTime + 0.12);
  }else{
    src.connect(gainNode); src.start();
  }
  animateBeat(isAccent);
}

// ============ אנימציה על אגודל הסליידר ============
function setupSliderOverlay(){
  const slider = document.getElementById('bpm-slider');
  if(!slider || slider.closest('.slider-wrap')) return;

  // עטיפה
  const wrap = document.createElement('div');
  wrap.className = 'slider-wrap';
  slider.parentNode.insertBefore(wrap, slider);
  wrap.appendChild(slider);

  // שכבת overlay מעל האגודל
  const overlay = document.createElement('div');
  overlay.id = 'thumb-overlay';
  overlay.className = 'thumb-overlay';
  wrap.appendChild(overlay);

  const update = () => updateThumbOverlay();
  slider.addEventListener('input', update);
  window.addEventListener('resize', update);
  updateThumbOverlay();
}

function updateThumbOverlay(){
  const slider = document.getElementById('bpm-slider');
  const overlay = document.getElementById('thumb-overlay');
  if(!slider || !overlay) return;

  const min = parseFloat(slider.min||'40');
  const max = parseFloat(slider.max||'200');
  const val = parseFloat(slider.value||'100');
  const ratio = (val - min) / (max - min);

  const width = slider.clientWidth;  // רוחב אפקטיבי
  const thumbW = 28;                 // חייב להתאים ל-CSS
  const x = ratio * (width - thumbW) + thumbW/2;

  overlay.style.left = x + 'px';
}

function animateBeat(isAccent){
  updateThumbOverlay();
  const overlay = document.getElementById('thumb-overlay');
  if(!overlay) return;
  overlay.classList.remove('pulse','accent');
  void overlay.offsetWidth; // reset
  if(isAccent) overlay.classList.add('accent');
  requestAnimationFrame(()=> overlay.classList.add('pulse'));
}

// ============ הפעלה/עצירה ============
function startMetronome(){
  ensureAudioReady();
  if (metronomeIsRunning) return;

  const beatsPerMeasure = parseInt(timeSignature.split('/')[0], 10);
  const interval = 60000 / currentBPM;

  // ביט ראשון מיידי ומניעת כפילות
  playClick(true);
  currentBeat = 1 % beatsPerMeasure;

  metronomeInterval = setInterval(() => {
    const isAccent = (currentBeat === 0);
    playClick(isAccent);
    currentBeat = (currentBeat + 1) % beatsPerMeasure;
  }, interval);

  metronomeIsRunning = true;
  const btn = document.getElementById('metronome-toggle');
  btn.textContent = '⏸️';
  btn.classList.add('playing');
}

function stopMetronome(){
  if(metronomeInterval){ clearInterval(metronomeInterval); metronomeInterval=null; }
  metronomeIsRunning=false; currentBeat=0;
  const btn = document.getElementById('metronome-toggle');
  btn.textContent = '▶️';
  btn.classList.remove('playing');
}

function toggleMetronome(){ metronomeIsRunning ? stopMetronome() : startMetronome(); }

// ============ לשוניות ============
function switchTab(tab){
  currentTab = tab;
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('nav-btn--active'));
  document.querySelector(`[data-tab="${tab}"]`).classList.add('nav-btn--active');
  document.querySelectorAll('.tab-content').forEach(c=>c.classList.remove('tab-content--active'));
  document.getElementById(tab).classList.add('tab-content--active');
  if(tab!=='practice'){ Object.keys(exerciseTimers).forEach(id=>stopExercise(parseInt(id,10))); }
  if(tab==='progress'){ drawProgressChart(); updateProgressStats(); }
}

// ============ תרגילים ============
function loadExercises(){
  const data = getData();
  const list = document.getElementById('exercises-list');
  list.innerHTML = '';
  data.exercises.forEach(ex => list.appendChild(createExerciseCard(ex)));
}

function createExerciseCard(ex){
  const el = document.createElement('div');
  el.className='exercise-card';
  el.innerHTML = `
    <div class="exercise-header">
      <div class="exercise-name">${ex.name}</div>
      <button class="exercise-edit" aria-label="ערוך" onclick="editExercise(${ex.id})">✏️</button>
    </div>
    <div class="exercise-info">
      <div class="exercise-duration">⏱️ ${ex.duration} דקות</div>
      <div class="exercise-bpm">🎵 ${ex.bpm || 100} BPM</div>
    </div>
    <div class="exercise-description">${ex.description || ''}</div>
    <div class="exercise-timer" id="timer-${ex.id}">${ex.duration}:00</div>
    <div class="exercise-controls">
      <button class="btn-primary" onclick="startExercise(${ex.id})">התחל תרגיל</button>
      <button class="btn-danger" id="stop-${ex.id}" style="display:none" onclick="stopExercise(${ex.id})">עצור</button>
    </div>`;
  return el;
}

function startExercise(id){
  Object.keys(exerciseTimers).forEach(otherId => { if (parseInt(otherId,10)!==id) stopExercise(parseInt(otherId,10)); });

  const data = getData();
  const ex = data.exercises.find(e=>e.id===id); if(!ex) return;

  currentExercise = id;
  currentBPM = ex.bpm || 100;
  document.getElementById('bpm-slider').value = currentBPM;
  document.getElementById('bpm-value').textContent = currentBPM;
  updateThumbOverlay();

  if(!metronomeIsRunning) startMetronome();

  exerciseStartTimes[id] = Date.now();
  isTimerRunning[id] = true;

  document.getElementById(`stop-${id}`).style.display='inline-block';
  document.querySelector(`button[onclick="startExercise(${id})"]`).style.display='none';

  exerciseTimers[id] = setInterval(()=>updateExerciseTimer(id, ex.duration), 1000);
}

function updateExerciseTimer(id, durationMin){
  if(!isTimerRunning[id]) return;

  const elapsedSec = Math.floor((Date.now()-exerciseStartTimes[id])/1000);
  const totalSec = durationMin*60;
  const remaining = totalSec - elapsedSec;

  if(remaining<=0){ finishExercise(id, elapsedSec); return; }

  const mm = Math.floor(remaining/60);
  const ss = (remaining%60).toString().padStart(2,'0');
  document.getElementById(`timer-${id}`).textContent = `${mm}:${ss}`;
}

function stopExercise(id){
  if(exerciseTimers[id]){ clearInterval(exerciseTimers[id]); delete exerciseTimers[id]; }
  if(isTimerRunning[id]){
    const elapsedSec = Math.max(0, Math.floor((Date.now()-exerciseStartTimes[id])/1000));
    finishExercise(id, elapsedSec);
  }
}

function finishExercise(id, elapsedSec){
  isTimerRunning[id] = false;
  delete exerciseStartTimes[id];

  stopMetronome();

  const data = getData();
  const ex = data.exercises.find(e=>e.id===id);
  if(ex){ document.getElementById(`timer-${id}`).textContent = `${ex.duration}:00`; }

  const startBtn = document.querySelector(`button[onclick="startExercise(${id})"]`);
  const stopBtn = document.getElementById(`stop-${id}`);
  if(startBtn) startBtn.style.display='inline-block';
  if(stopBtn) stopBtn.style.display='none';

  // מודאל התאמת BPM בסיום תרגיל
  lastExerciseContext = { exerciseId:id, elapsedSec };
  showBpmAdjustModal();
}

function editExercise(id){
  const data = getData();
  const ex = data.exercises.find(e=>e.id===id);
  if(!ex) return;

  currentEditingExercise = ex.id;
  document.getElementById('edit-exercise-name').value = ex.name;
  document.getElementById('edit-exercise-duration').value = ex.duration;
  document.getElementById('edit-exercise-bpm').value = ex.bpm || 100;
  document.getElementById('edit-exercise-description').value = ex.description || '';
  document.getElementById('feedback-modal').style.display='flex';
}

function saveExerciseEdit(){
  if(!currentEditingExercise) return;

  const data = getData();
  const i = data.exercises.findIndex(e=>e.id===currentEditingExercise);
  if(i===-1) return;

  data.exercises[i].name = document.getElementById('edit-exercise-name').value.trim();
  data.exercises[i].duration = parseInt(document.getElementById('edit-exercise-duration').value,10);
  data.exercises[i].bpm = parseInt(document.getElementById('edit-exercise-bpm').value,10) || 100;
  data.exercises[i].description = document.getElementById('edit-exercise-description').value.trim();

  setData(data);
  loadExercises();
  closeFeedbackModal();
}

function closeFeedbackModal(){
  document.getElementById('feedback-modal').style.display='none';
  currentEditingExercise = null;
}

// מודאל התאמת BPM
function showBpmAdjustModal(){ document.getElementById('bpm-adjust-modal').style.display='flex'; }
function hideBpmAdjustModal(){ document.getElementById('bpm-adjust-modal').style.display='none'; }
function applyBpmAdjustment(delta){
  if(!lastExerciseContext) return hideBpmAdjustModal();

  const data = getData();
  const ex = data.exercises.find(e=>e.id===lastExerciseContext.exerciseId);
  if(ex){ ex.bpm = Math.min(200, Math.max(40, (ex.bpm||100) + delta)); }

  data.sessions.push({
    date: new Date().toISOString(),
    exerciseId: lastExerciseContext.exerciseId,
    durationSec: lastExerciseContext.elapsedSec,
    bpm: ex ? ex.bpm : currentBPM,
    timeSignature
  });

  setData(data);
  loadExercises();
  updateProgressStats();

  lastExerciseContext = null;
  hideBpmAdjustModal();
}

// ============ התקדמות שבועית (ראשון-שבת) ============
function getWeekDatesSundayStart(){
  const now = new Date(); now.setHours(0,0,0,0);
  const day = now.getDay(); // 0=Sunday
  const sunday = new Date(now); sunday.setDate(now.getDate() - day);
  const days = [];
  for(let i=0;i<7;i++){ const d = new Date(sunday); d.setDate(sunday.getDate()+i); days.push(d); }
  return days;
}

function aggregateCurrentWeek(){
  const data = getData();
  const days = getWeekDatesSundayStart();
  const map = days.map(d=>({ key:d.toISOString().slice(0,10), minutes:0, sessions:0, bpms:[] }));
  data.sessions.forEach(s=>{
    const key = s.date.slice(0,10);
    const idx = map.findIndex(x=>x.key===key);
    if(idx>-1){
      map[idx].minutes += Math.round((s.durationSec||0)/60);
      map[idx].sessions += 1;
      if(s.bpm) map[idx].bpms.push(s.bpm);
    }
  });
  return map;
}

function updateProgressStats(){
  const week = aggregateCurrentWeek();
  const totalMin = week.reduce((a,x)=>a+x.minutes,0);
  const totalSessions = week.reduce((a,x)=>a+x.sessions,0);
  const allBpms = week.flatMap(x=>x.bpms);
  const avgBpm = allBpms.length ? Math.round(allBpms.reduce((a,b)=>a+b,0)/allBpms.length) : 0;
  document.getElementById('stat-minutes').textContent = totalMin;
  document.getElementById('stat-sessions').textContent = totalSessions;
  document.getElementById('stat-avg-bpm').textContent = avgBpm;
}

function drawProgressChart(){
  const canvas = document.getElementById('progress-chart');
  const parentWidth = canvas.clientWidth || canvas.parentElement.clientWidth || 360;
  const baseHeight = 220;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(parentWidth * dpr);
  canvas.height = Math.floor(baseHeight * dpr);
  canvas.style.width = parentWidth + 'px';
  canvas.style.height = baseHeight + 'px';
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr,0,0,dpr,0,0);

  const week = aggregateCurrentWeek(); // Sunday..Saturday
  const labels = ['א','ב','ג','ד','ה','ו','ש'];
  const maxVal = Math.max(20, ...week.map(x=>x.minutes));
  const W = parentWidth, H = baseHeight;

  ctx.clearRect(0,0,W,H);
  ctx.fillStyle = '#0b1220'; ctx.fillRect(0,0,W,H);

  ctx.strokeStyle = '#263241'; ctx.lineWidth = 1;
  for(let i=0;i<=4;i++){ const y = 10 + i*((H-20)/4); ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

  const padL = 28, padB = 24;
  const plotW = W - padL - 10;
  const plotH = H - padB - 10;
  const barW = plotW / 7 * 0.62;
  const gap = plotW / 7 * 0.38;

  week.forEach((d,idx)=>{
    const x = padL + idx*(barW+gap) + gap*0.5;
    const h = Math.round((d.minutes/maxVal)*plotH);
    const y = H - padB - h;
    const grad = ctx.createLinearGradient(x, y, x, y+h);
    grad.addColorStop(0, '#1f6feb'); grad.addColorStop(1, '#1856bb');
    ctx.fillStyle = grad; ctx.fillRect(x, y, barW, h);
    ctx.fillStyle = '#9aa4b2'; ctx.font = '12px Segoe UI, Arial, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(labels[idx], x+barW/2, H-8);
    if(h>14){ ctx.fillStyle = '#dbe6ff'; ctx.font = '11px Segoe UI, Arial, sans-serif'; ctx.fillText(String(d.minutes), x+barW/2, y-4); }
  });
}

// ============ הגדרות ============
function saveSettings(){
  const data = getData();
  data.settings = {
    ...data.settings,
    metronomeSound: document.getElementById('metronome-sound').value,
    volume: parseInt(document.getElementById('volume-slider').value,10),
    autoIncreaseBPM: document.getElementById('auto-increase-bpm').checked,
    vibrateMode: document.getElementById('vibrate-mode').checked
  };
  setData(data);
}

// חשיפה לגלובל
window.startExercise = startExercise;
window.stopExercise = stopExercise;
window.editExercise = editExercise;
