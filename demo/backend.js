/* Who Has The Kangaroo? — in-browser demo backend.
 * The real system runs on Google Sheets + Apps Script. This file runs the SAME server logic
 * (ported line for line from Code.gs: apiCheckoutData, apiSubmitCheckout, apiCheckinData,
 * apiSubmitCheckin, apiDashData) against a pretend spreadsheet kept in this browser's storage,
 * so you can try the real pages without setting anything up. Nothing is sent anywhere.
 * Open two tabs and check out the same animal in both: the second one is refused, exactly
 * like the lock in the real thing. */
(function () {
const CFG = {"ACTIVITIES": [{"key": "pee", "label": "Peed 💦"}, {"key": "poop", "label": "Pooped 💩"}, {"key": "walk", "label": "Explored 🧭"}, {"key": "ran", "label": "Ran / zoomies 🌀"}, {"key": "played", "label": "Played with toys 🎾"}, {"key": "social", "label": "Socialized with others 🐾"}, {"key": "cuddles", "label": "Cuddles 🤗"}, {"key": "training", "label": "Training 🎓"}, {"key": "treat", "label": "Had a treat 🦴"}, {"key": "shy", "label": "Nervous / shy 🫣"}], "CLASSES": ["Mammals", "Birds", "Reptiles", "Amphibians", "Invertebrates", "Other"], "CLASS_EMOJI": {"Mammals": "🐾", "Birds": "🐦", "Reptiles": "🦎", "Amphibians": "🐸", "Invertebrates": "🕷️", "Other": "🐾"}, "CLASS_ALIASES": {"Aves": "Birds", "Bird": "Birds", "Avian": "Birds", "Mammal": "Mammals", "Reptile": "Reptiles", "Amphibian": "Amphibians", "Invertebrate": "Invertebrates", "Inverts": "Invertebrates", "Bugs": "Invertebrates"}, "CATEGORY_EMOJI": {"Chinchilla": "🐭", "Hedgehog": "🦔", "Sugar Glider": "🐿️", "Ferret": "🦦", "Skunk": "🦨", "Opossum": "🐀", "Cavy": "🐹", "Rabbit": "🐰", "Prairie Dog": "🦫", "Lemur": "🐒", "Sloth": "🦥", "Panther Chameleon": "🦎", "Veiled Chameleon": "🦎", "Bearded Dragon": "🐉", "Burmese Python": "🐍", "Ball Python": "🐍", "Corn Snake": "🐍", "Boa Constrictor": "🐍", "Blue Tongue Skink": "🦎", "Egyptian Uromastyx": "🦎", "Leopard Gecko": "🦎", "B&W Tegu": "🦎", "Red Tegu": "🦎", "Mata Mata Turtle": "🐢", "Alligator": "🐊", "Russian Tortoise": "🐢", "African Tortoise": "🐢", "Cane Toad": "🐸", "Bullfrog": "🐸", "Red Knee Tarantula": "🕷️", "Curly Haired Tarantula": "🕷️", "Desert Blonde Tarantula": "🕷️", "Giant Millipede": "🐛", "Scorpion": "🦂", "Hissing Cockroaches": "🪳", "Other": "🐾", "Kookaburra": "🐦", "Kangaroo": "🦘", "Parrot": "🦜", "Macaw": "🦜", "Cockatoo": "🦜", "Owl": "🦉", "Duck": "🦆", "Chicken": "🐔", "Peacock": "🦚", "Flamingo": "🦩", "Penguin": "🐧"}, "GEAR_CATEGORIES": ["Audio", "Vehicles", "Equipment"], "GEAR_EMOJI": {"Audio": "🎤", "Vehicles": "🚐", "Equipment": "🧰"}, "ROSTER_GEAR": [["PA speaker (small)", "Audio"], ["PA speaker (large)", "Audio"], ["Wireless mic", "Audio"], ["Van 1", "Vehicles"], ["Van 2", "Vehicles"], ["Folding table 1", "Equipment"], ["Folding table 2", "Equipment"], ["Folding table 3", "Equipment"], ["Tortoise carrier", "Equipment"], ["Display stand", "Equipment"], ["Banner", "Equipment"], ["Sign stand 1", "Equipment"], ["Sign stand 2", "Equipment"]], "ROSTER_ANIMALS": [["Jahli", "Kangaroo", "Mammals"], ["Hazel", "Chinchilla", "Mammals"], ["Sugar", "Rabbit", "Mammals"], ["Rosie", "Skunk", "Mammals"], ["Pip", "Hedgehog", "Mammals"], ["Biscuit", "Ferret", "Mammals"], ["Mango", "Parrot", "Birds"], ["Calypso", "Boa Constrictor", "Reptiles"], ["Tina", "B&W Tegu", "Reptiles"], ["Shelly", "Russian Tortoise", "Reptiles"], ["Noodle", "Corn Snake", "Reptiles"], ["Ziggy", "Bearded Dragon", "Reptiles"], ["Gus", "Leopard Gecko", "Reptiles"], ["Lily", "Bullfrog", "Amphibians"], ["Fuzz", "Red Knee Tarantula", "Invertebrates"], ["Pebble", "Giant Millipede", "Invertebrates"]], "ROSTER_PEOPLE": ["Alex R.", "Sam T.", "Jordan P.", "Casey L.", "Riley K.", "Morgan D.", "Taylor B.", "Jamie W."], "WARN_HOURS": 6, "LATE_HOURS": 8};
const { ACTIVITIES, CLASSES, CLASS_EMOJI, CLASS_ALIASES, CATEGORY_EMOJI, GEAR_CATEGORIES, GEAR_EMOJI,
        ROSTER_GEAR, ROSTER_ANIMALS, ROSTER_PEOPLE, WARN_HOURS, LATE_HOURS } = CFG;
const KEY = 'whtk-demo-log-v1';
const mem = { log: null };
function uid() { return Math.random().toString(16).slice(2, 10); }
function seed() {   // a few outings already in progress so the board has something to show
  const now = Date.now(), H = 3600e3, M = 60e3, rows = [];
  const add = (minsAgo, person, name, kind, back, extra) => {
    const a = ROSTER_ANIMALS.find(x => x[0] === name), g = ROSTER_GEAR.find(x => x[0] === name);
    const cat = a ? a[1] : (g ? g[1] : 'Other');
    const out = now - minsAgo * M, inn = back != null ? now - back * M : null;
    rows.push([uid(), out, person, name, cat, inn, inn ? Math.round((inn - out) / M) : null,
               (extra && extra.acts) || '', '', (extra && extra.comments) || '', inn ? person : '', kind, uid()]);
  };
  add(95, 'Alex R.', 'Calypso', 'Animal', null);
  add(95, 'Alex R.', 'Van 1', 'Equipment', null);
  add(400, 'Sam T.', 'Jahli', 'Animal', null);
  add(400, 'Sam T.', 'PA speaker (large)', 'Equipment', null);
  add(530, 'Jordan P.', 'Tina', 'Animal', null);
  add(300, 'Casey L.', 'Rosie', 'Animal', 120, { acts: 'Explored 🧭, Had a treat 🦴', comments: 'Great with the kids' });
  add(260, 'Riley K.', 'Shelly', 'Animal', 150, { acts: 'Explored 🧭' });
  add(200, 'Morgan D.', 'Hazel', 'Animal', 90, { acts: 'Cuddles 🤗' });
  return rows;
}
function load() {
  if (mem.log) { try { const s = localStorage.getItem(KEY); if (s) mem.log = JSON.parse(s); } catch (e) {} return mem.log; }
  try { const s = localStorage.getItem(KEY); if (s) { mem.log = JSON.parse(s); return mem.log; } } catch (e) {}
  mem.log = seed(); save(); return mem.log;
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(mem.log)); } catch (e) {} }
window.__demoReset = function () { try { localStorage.removeItem(KEY); } catch (e) {} mem.log = null; load(); };

// ---- "spreadsheet" reads, same shapes as Code.gs ----
function logRows_() {
  return load().map((v, i) => ({
    row: i, id: String(v[0]), timeOut: v[1] ? new Date(v[1]) : null, person: String(v[2]), animal: String(v[3]),
    category: String(v[4]), timeIn: v[5] ? new Date(v[5]) : null, minutes: typeof v[6] === 'number' ? v[6] : null,
    acts: String(v[7] || ''), mates: String(v[8] || ''), comments: String(v[9] || ''), returnedBy: String(v[10] || ''),
    kind: String(v[11] || 'Animal'), batch: String(v[12] || ''),
  })).filter(r => r.timeOut);
}
function activePeople_() { return ROSTER_PEOPLE.slice().sort(); }
function normClass_(raw) {
  const s = String(raw || '').trim(); if (!s) return 'Other';
  const hit = CLASSES.find(c => c.toLowerCase() === s.toLowerCase()); if (hit) return hit;
  const alias = Object.keys(CLASS_ALIASES).find(k => k.toLowerCase() === s.toLowerCase());
  return alias ? CLASS_ALIASES[alias] : 'Other';
}
function animals_() { return ROSTER_ANIMALS.map(v => ({ name: v[0], category: v[1] || 'Other', cls: normClass_(v[2]), emoji: '' })); }
function gear_() { return ROSTER_GEAR.map(v => ({ name: v[0], category: GEAR_CATEGORIES.indexOf(v[1]) >= 0 ? v[1] : 'Equipment', emoji: '' })); }
function emojiFor_(species, cls) { return CATEGORY_EMOJI[species] || CLASS_EMOJI[cls] || '🐾'; }
function emojiForAnimal_(a) { return (a && a.emoji) || emojiFor_(a && a.category, a && a.cls); }
function emojiForGear_(g) { return (g && g.emoji) || GEAR_EMOJI[g && g.category] || '🧰'; }
function emojiIndex_() { const idx = {}; animals_().forEach(a => { idx[a.name] = emojiForAnimal_(a); }); gear_().forEach(g => { idx[g.name] = emojiForGear_(g); }); return idx; }
function emojiForRow_(r, idx) { if (idx && idx[r.animal]) return idx[r.animal]; if (r.kind === 'Equipment') return GEAR_EMOJI[r.category] || '🧰'; return CATEGORY_EMOJI[r.category] || '🐾'; }
function fmtTime_(d) { return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); }

// ---- API: check-out ----
function apiCheckoutData() {
  const outNow = new Set(logRows_().filter(r => !r.timeIn).map(r => r.animal));
  const byClass = {}, emojis = {};
  animals_().forEach(a => {
    emojis[a.name] = emojiForAnimal_(a);
    if (outNow.has(a.name)) return;
    const c = byClass[a.cls] = byClass[a.cls] || {};
    (c[a.category] = c[a.category] || []).push(a);
  });
  const classes = CLASSES.filter(cls => byClass[cls]).map(cls => ({
    cls: cls, emoji: CLASS_EMOJI[cls] || '🐾',
    total: Object.keys(byClass[cls]).reduce((s, sp) => s + byClass[cls][sp].length, 0),
    species: Object.keys(byClass[cls]).sort().map(sp => ({
      species: sp, emoji: (byClass[cls][sp].find(x => x.emoji) || {}).emoji || emojiFor_(sp, cls),
      animals: byClass[cls][sp].map(x => x.name).sort(),
    })),
  }));
  const byCat = {}; let gearOut = 0;
  gear_().forEach(g => { emojis[g.name] = emojiForGear_(g); if (outNow.has(g.name)) { gearOut++; return; } (byCat[g.category] = byCat[g.category] || []).push(g.name); });
  const gear = GEAR_CATEGORIES.filter(c => byCat[c]).map(c => ({ cat: c, emoji: GEAR_EMOJI[c], items: byCat[c] }));
  return { people: activePeople_(), classes: classes, gear: gear, emojis: emojis, outCount: outNow.size - gearOut, gearOutCount: gearOut };
}
function apiSubmitCheckout(person, animals, gear) {
  const wantA = [].concat(animals || []).map(String).filter(Boolean);
  const wantG = [].concat(gear || []).map(String).filter(Boolean);
  if (!person || (!wantA.length && !wantG.length)) return { ok: false, message: 'Pick your name and at least one animal or piece of equipment.' };
  // the lock: re-read what is actually out right now (another tab may have taken it a second ago)
  const outNow = new Set(logRows_().filter(r => !r.timeIn).map(r => r.animal));
  const taken = wantA.concat(wantG).filter(n => outNow.has(n));
  if (taken.length) return { ok: false, stale: true, taken: taken, message: taken.join(', ') + (taken.length === 1 ? ' was' : ' were') + ' just checked out by someone else — the list has been refreshed.' };
  const aMap = {}; animals_().forEach(a => { aMap[a.name] = a; });
  const gMap = {}; gear_().forEach(g => { gMap[g.name] = g; });
  const now = new Date(), batch = uid(), items = [], log = load();
  wantA.forEach(n => { const a = aMap[n] || {}; const cat = a.category || 'Other';
    log.push([uid(), now.getTime(), person, n, cat, null, null, '', '', '', '', 'Animal', batch]);
    items.push({ name: n, emoji: emojiForAnimal_(Object.assign({ category: cat }, a)), kind: 'Animal' }); });
  wantG.forEach(n => { const cat = (gMap[n] || {}).category || 'Equipment';
    log.push([uid(), now.getTime(), person, n, cat, null, null, '', '', '', '', 'Equipment', batch]);
    items.push({ name: n, emoji: emojiForGear_(Object.assign({ category: cat }, gMap[n] || {})), kind: 'Equipment' }); });
  save();
  return { ok: true, person: person, items: items, time: fmtTime_(now), animal: items[0].name, emoji: items[0].emoji };
}
// ---- API: check-in ----
function playmatesFor_(rows, mine, idx) {
  const myStart = mine.timeOut.getTime(), myEnd = Date.now();
  const names = rows.filter(o => o.kind !== 'Equipment' && o.animal !== mine.animal && o.timeOut.getTime() < myEnd && (!o.timeIn || o.timeIn.getTime() > myStart)).map(o => emojiForRow_(o, idx) + ' ' + o.animal);
  return [...new Set(names)].sort();
}
function apiCheckinData(person) {
  const rows = logRows_(), idx = emojiIndex_();
  const result = { people: activePeople_(), activities: ACTIVITIES, open: [], others: [] };
  if (!person) return result;
  const now = Date.now();
  rows.filter(r => !r.timeIn).forEach(r => {
    const card = { id: r.id, animal: r.animal, category: r.category, kind: r.kind, batch: r.batch, emoji: emojiForRow_(r, idx),
      handler: r.person, outSince: fmtTime_(r.timeOut), minutes: Math.max(1, Math.round((now - r.timeOut.getTime()) / 60000)),
      playmates: r.kind === 'Equipment' ? [] : playmatesFor_(rows, r, idx) };
    (r.person === person ? result.open : result.others).push(card);
  });
  return result;
}
function apiSubmitCheckin(logIds, payload, returnedBy) {
  const ids = [].concat(logIds || []).map(String).filter(Boolean);
  if (!ids.length) return { ok: false, message: 'Pick at least one thing to bring back.' };
  const rows = logRows_(), idx = emojiIndex_(), log = load();
  const targets = ids.map(id => rows.find(r => r.id === id)).filter(Boolean);
  if (!targets.length) return { ok: false, message: 'Those outings were not found.' };
  const todo = targets.filter(r => !r.timeIn);
  if (!todo.length) return { ok: false, message: targets.map(r => r.animal).join(', ') + (targets.length === 1 ? ' is' : ' are') + ' already back home.' };
  const now = new Date();
  const acts = (payload && payload.activities || []).join(', '), mates = (payload && payload.playmates || []).join(', ');
  const comments = String(payload && payload.comments || '').slice(0, 2000), items = [];
  todo.forEach(row => {
    const minutes = Math.max(1, Math.round((now.getTime() - row.timeOut.getTime()) / 60000)), isGear = row.kind === 'Equipment';
    const v = log[row.row]; v[5] = now.getTime(); v[6] = minutes; v[7] = isGear ? '' : acts; v[8] = isGear ? '' : mates; v[9] = comments; v[10] = String(returnedBy || row.person);
    items.push({ name: row.animal, kind: row.kind, minutes: minutes, emoji: emojiForRow_(row, idx) });
  });
  save();
  return { ok: true, items: items, animal: items[0].name, minutes: items[0].minutes, emoji: items[0].emoji };
}
// ---- API: dashboard ----
function apiDashData() {
  const rows = logRows_(), idx = emojiIndex_(), now = new Date();
  return {
    now: now.getTime(), dateLabel: now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }),
    truncated: 0, sheetUrl: '#', logUrl: '#', dailyListUrl: '',
    warnMs: WARN_HOURS * 3600e3, lateMs: LATE_HOURS * 3600e3,
    animals: animals_().map(a => ({ name: a.name, category: a.category, cls: a.cls, emoji: emojiForAnimal_(a) })),
    gear: gear_().map(g => ({ name: g.name, category: g.category, emoji: emojiForGear_(g) })),
    people: activePeople_(),
    log: rows.map(r => ({ id: r.id, out: r.timeOut.getTime(), inn: r.timeIn ? r.timeIn.getTime() : null, person: r.person, animal: r.animal,
      category: r.category, kind: r.kind, batch: r.batch, emoji: emojiForRow_(r, idx), minutes: r.minutes, acts: r.acts, mates: r.mates,
      comments: r.comments, returnedBy: r.returnedBy })),
  };
}
const API = { apiCheckoutData, apiSubmitCheckout, apiCheckinData, apiSubmitCheckin, apiDashData };
// ---- google.script.run look-alike: chainable handlers, answers asynchronously like the real thing ----
function runner(ok, fail) {
  const r = {
    withSuccessHandler: f => runner(f, fail),
    withFailureHandler: f => runner(ok, f),
  };
  Object.keys(API).forEach(name => {
    r[name] = function () {
      const args = Array.prototype.slice.call(arguments);
      setTimeout(() => {
        try { const out = API[name].apply(null, JSON.parse(JSON.stringify(args))); ok && ok(JSON.parse(JSON.stringify(out))); }
        catch (e) { if (fail) fail(e); else console.error(e); }
      }, 250 + Math.random() * 200);
    };
  });
  return r;
}
window.google = { script: { run: runner(null, null) } };

// ---- the little demo bar at the bottom of every page ----
function bar() {
  const here = location.pathname.split('/').pop();
  const link = (href, label) => '<a href="' + href + '"' + (here === href ? ' class="on"' : '') + '>' + label + '</a>';
  const d = document.createElement('div');
  d.id = 'demobar';
  d.innerHTML = '<span class="tag">DEMO · sample data · stays in this browser</span>' +
    link('checkout.html', '🐕 Check out') + link('checkin.html', '🏡 Check in') + link('board.html', '📺 Wall board') +
    '<a href="../index.html">↩ Back</a><button type="button" id="demoreset">Reset demo</button>';
  document.body.appendChild(d);
  const st = document.createElement('style');
  st.textContent = '#demobar{position:fixed;left:0;right:0;bottom:0;z-index:9999;display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;justify-content:center;padding:8px 12px;background:#16201a;color:#f4efe6;font:600 13px Inter,Arial,sans-serif;box-shadow:0 -2px 10px rgba(0,0,0,.2)}#demobar .tag{font-weight:500;opacity:.7;letter-spacing:.04em}#demobar a{color:#9fd8b0;text-decoration:none;padding:4px 6px;border-radius:6px}#demobar a.on{background:#2e5339;color:#fff}#demobar button{background:transparent;color:#f4efe6;border:1px solid #4a5a4f;border-radius:6px;padding:4px 10px;font:inherit;cursor:pointer}body{padding-bottom:64px!important}.nav a.daily{display:none!important}';
  document.head.appendChild(st);
  document.getElementById('demoreset').onclick = () => { if (confirm('Put the demo back to its starting state?')) { window.__demoReset(); location.reload(); } };
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bar); else bar();
})();
