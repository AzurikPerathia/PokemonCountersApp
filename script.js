const STORAGE_KEY = "pokemonCounters_v6";

let store = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
    counters: {},
    templates: {},
    firstRun: true,
    timers: { full:0, short:0 }
};

let activeCounter = null;
let timerIntervals = { full:null, short:null };

const statsBox = document.getElementById("stats");
const catchBox = document.getElementById("catch");

/* ===== SAVE ===== */
function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

/* ===== CREATE COUNTER ===== */
function createCounter(container, id, name){
    store.counters[id] ??= { value:0, name, img:null };

    const el = document.createElement("div");
    el.className = "counter";

    el.innerHTML = `
        <div class="img-buttons">
            <button onclick="document.getElementById('img-${id}').click()">🖼️</button>
            <input type="file" id="img-${id}" accept="image/*" style="display:none" onchange="importImage(event,'${id}')">
            <button onclick="removeImage(event,'${id}')">❌</button>
        </div>
        <div class="counter-info">
            <input class="counter-name" value="${store.counters[id].name}" onblur="rename('${id}',this.value)">
            <div class="counter-value" id="v-${id}">${store.counters[id].value}</div>
            <div class="controls">
                <button onclick="event.stopPropagation();apply(-1)">−</button>
                <button onclick="event.stopPropagation();apply(1)">+</button>
                <input class="cheat" type="number" placeholder="Set" onkeydown="cheat(event,'${id}')">
                <button class="reset-counter-btn" onclick="confirmResetCounter('${id}', this)">R</button>
                <label class="link">
                    <input type="checkbox" class="check" data-id="${id}" onchange="toggleHalo(this)">
                </label>
            </div>
        </div>
    `;

    if(store.counters[id].img){
        const img = document.createElement("img");
        img.src = store.counters[id].img;
        el.querySelector(".counter-info").prepend(img);
    }

    el.addEventListener("click", (e) => {
        if(e.target.tagName === "INPUT" || e.target.tagName === "BUTTON") return;
        const checkbox = el.querySelector(".check");
        checkbox.checked = !checkbox.checked;
        toggleHalo(checkbox);
    });

    container.appendChild(el);
}

/* ===== RESET COUNTER ===== */
let currentResetCounter = null;
function confirmResetCounter(id, btn){
    currentResetCounter = id;
    document.getElementById("resetCounterModal").style.display = "flex";
}
function closeResetCounterModal(){
    document.getElementById("resetCounterModal").style.display = "none";
}
document.getElementById("confirmResetCounterYes").onclick = function(){
    if(currentResetCounter){
        store.counters[currentResetCounter].value = 0;
        document.getElementById("v-"+currentResetCounter).textContent = 0;
        save();
    }
    closeResetCounterModal();
};

/* ===== APPLY DELTA ===== */
function apply(delta){
    const checked = [...document.querySelectorAll(".check:checked")].map(c=>c.dataset.id);
    const ids = checked.length ? checked : (activeCounter ? [activeCounter] : []);
    ids.forEach(id=>{
        store.counters[id].value = Math.max(0, store.counters[id].value + delta);
        document.getElementById("v-"+id).textContent = store.counters[id].value;
    });
    save();
}

/* ===== CHEAT SET ===== */
function cheat(e,id){
    if(e.key==="Enter"){
        store.counters[id].value = Math.max(0, parseInt(e.target.value)||0);
        document.getElementById("v-"+id).textContent = store.counters[id].value;
        e.target.value="";
        save();
    }
}

/* ===== RENAME ===== */
function rename(id,val){
    store.counters[id].name=val;
    save();
}

/* ===== DELETE COUNTERS ===== */
function deleteCounters(){
    document.querySelectorAll(".check:checked").forEach(c=>{
        const id=c.dataset.id;
        delete store.counters[id];
        c.closest(".counter").remove();
    });
    save();
}

/* ===== HALO ===== */
function toggleHalo(checkbox){
    const counter = checkbox.closest(".counter");
    if(checkbox.checked) counter.classList.add("selected");
    else counter.classList.remove("selected");
}

/* ===== IMAGE IMPORT/REMOVE ===== */
function importImage(event,id){
    const file = event.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = (e)=>{
        store.counters[id].img = e.target.result;
        save();
        refreshCounters();
    };
    reader.readAsDataURL(file);
}
function removeImage(e,id){
    e.stopPropagation();
    store.counters[id].img = null;
    save();
    refreshCounters();
}

/* ===== REFRESH ALL COUNTERS ===== */
function refreshCounters(){
    statsBox.innerHTML = "";
    catchBox.innerHTML = "";
    Object.keys(store.counters).forEach(id=>{
        if(id.startsWith("p")) createCounter(catchBox,id,store.counters[id].name);
        else createCounter(statsBox,id,store.counters[id].name);
    });
}

/* ===== TIMERS ===== */
function startTimer(name){
    if(timerIntervals[name]) return;
    timerIntervals[name] = setInterval(()=>{ incrementTimer(name); },1000);
}
function pauseTimer(name){ clearInterval(timerIntervals[name]); timerIntervals[name]=null; }
function incrementTimer(name){
    store.timers[name]++;
    updateTimerDisplay(name);
}
function updateTimerDisplay(name){
    let t = store.timers[name];
    let sec = t%60;
    let min = Math.floor(t/60)%60;
    let hr = Math.floor(t/3600)%24;
    let day = Math.floor(t/86400)%30;
    let mon = Math.floor(t/2592000)%12;
    let yr = Math.floor(t/31104000);
    if(name==="full")
        document.getElementById("fullTimer").textContent=`${yr}Y/${mon}M/${day}D ${hr}H:${min}M:${sec}S`;
    else
        document.getElementById("shortTimer").textContent=`${day}D/${hr}H/${min}M/${sec}S`;
    save();
}

/* ===== SET TIME MODAL ===== */
let currentSetTimer = null;
function openSetTimeModal(name){ currentSetTimer = name; document.getElementById("setTimeModal").style.display="flex"; }
function closeSetTimeModal(){ document.getElementById("setTimeModal").style.display="none"; }
function applySetTime(){
    let yr=parseInt(document.getElementById("setY").value)||0;
    let mon=parseInt(document.getElementById("setM").value)||0;
    let day=parseInt(document.getElementById("setD").value)||0;
    let hr=parseInt(document.getElementById("setH").value)||0;
    let min=parseInt(document.getElementById("setMin").value)||0;
    let sec=parseInt(document.getElementById("setS").value)||0;
    store.timers[currentSetTimer] = sec + min*60 + hr*3600 + day*86400 + mon*2592000 + yr*31104000;
    updateTimerDisplay(currentSetTimer);
    closeSetTimeModal();
}

/* ===== ADD COUNTER MODAL ===== */
function openAddCounterModal(){ document.getElementById("addCounterModal").style.display="flex"; }
function closeAddCounterModal(){ document.getElementById("addCounterModal").style.display="none"; }
function confirmAddCounter(target){
    const id="user_"+Date.now();
    createCounter(target==="stats"?statsBox:catchBox,id,"New Counter");
    closeAddCounterModal();
    save();
}

/* ===== SHORTCUTS ===== */
document.addEventListener("keydown",(e)=>{
    if(e.key==="+") apply(1);
    if(e.key==="−"||e.key==="-") apply(-1);
});

/* ===== TEMPLATES ===== */
function saveTemplate(){
    const name = document.getElementById("templateName").value.trim();
    if(!name) return;

    const checked = [...document.querySelectorAll(".check:checked")];
    const data = checked.map(c=>{
        const id = c.dataset.id;
        return { id, value: store.counters[id].value };
    });

    store.templates[name] = data;
    document.getElementById("templateName").value = "";
    save();
    renderTemplates();
}

function renderTemplates(){
    const templateList = document.getElementById("templateList");
    templateList.innerHTML = "";
    Object.keys(store.templates).forEach(name=>{
        const row = document.createElement("div");
        row.className="template-row";
        row.innerHTML = `<button onclick="applyTemplate('${name}')">⭐ ${name}</button>
                         <button onclick="deleteTemplate('${name}')">🗑</button>`;
        templateList.appendChild(row);
    });
}

function applyTemplate(name){
    // Décoche tout
    document.querySelectorAll(".check").forEach(c=>{
        c.checked = false;
        toggleHalo(c);
    });

    const data = store.templates[name];

    data.forEach(item=>{
        // Crée le compteur si il n'existe pas encore
        if(!store.counters[item.id]){
            store.counters[item.id] = { value:0, name:item.id, img:null };
            const container = item.id.startsWith("p") ? catchBox : statsBox;
            createCounter(container, item.id, item.id);
        }

        // Applique la valeur sauvegardée
        store.counters[item.id].value = item.value;

        // Met à jour l'affichage
        const valueEl = document.getElementById("v-"+item.id);
        if(valueEl) valueEl.textContent = item.value;

        // Coche le compteur
        const el = document.querySelector(`.check[data-id="${item.id}"]`);
        if(el){
            el.checked = true;
            toggleHalo(el);
        }
    });

    save();
    refreshCounters();
}

function deleteTemplate(name){
    delete store.templates[name];
    save();
    renderTemplates();
}

/* ===== IMPORT/EXPORT JSON ===== */
function exportCounters(){
    const dataStr = JSON.stringify(store.counters, null, 2);
    const blob = new Blob([dataStr], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "counters.json";
    a.click();
    URL.revokeObjectURL(url);
}
function importCounters(event){
    const file = event.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = e=>{
        const data = JSON.parse(e.target.result);
        store.counters = data;
        save();
        refreshCounters();
    };
    reader.readAsText(file);
}

/* ===== INIT ===== */
renderTemplates();
if(store.firstRun){
    createCounter(catchBox,"p1","Phase 1");
    createCounter(catchBox,"p2","Phase 2");
    createCounter(catchBox,"p3","Phase 3");
    store.firstRun=false;
    save();
}
refreshCounters();
updateTimerDisplay("full");
updateTimerDisplay("short");