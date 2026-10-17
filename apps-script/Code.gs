/**
 * ═══════════════════════════════════════════════════════════════════
 *  ENCLOSURE CHECK-OUT STUDIO
 *  QR-driven animal check-out / check-in system on Google Sheets.
 *
 *  One-time setup:
 *    1. Run setup() from this editor (authorize when asked).
 *       → It creates & styles the spreadsheet, prints its URL in the log.
 *    2. Deploy ▸ New deployment ▸ Web app
 *       → Execute as: Me   |   Who has access: Anyone with the link
 *    3. Open  <web app URL>?page=qr  and print the two QR posters.
 *
 *  Pages served by the web app:
 *    ?page=out    Check-OUT form  (default) — animals AND equipment, many at once
 *    ?page=in     Check-IN form — bring back several items in one go
 *    ?page=board  Live status board (leave open on a wall iPad/TV)
 *    ?page=qr     Printable QR posters
 * ═══════════════════════════════════════════════════════════════════
 */

const APP_TITLE = 'Enclosure Check-Out';
const ORG_NAME  = 'Your Business Name';          // shown on web pages — edit freely

// Activity checklist shown at check-in. Edit freely; keep labels short.
const ACTIVITIES = [
  { key: 'pee',       label: 'Peed 💦' },
  { key: 'poop',      label: 'Pooped 💩' },
  { key: 'walk',      label: 'Explored 🧭' },
  { key: 'ran',       label: 'Ran / zoomies 🌀' },
  { key: 'played',    label: 'Played with toys 🎾' },
  { key: 'social',    label: 'Socialized with others 🐾' },  // key 'social' unlocks the playmate picker
  { key: 'cuddles',   label: 'Cuddles 🤗' },
  { key: 'training',  label: 'Training 🎓' },
  { key: 'treat',     label: 'Had a treat 🦴' },
  { key: 'shy',       label: 'Nervous / shy 🫣' },
];

// Link shown as a button on the Board page and the admin page.
const DAILY_LIST_URL = '';   // optional: paste a link to any sheet you want as a button on the Board and admin pages

// Elapsed-time colours: green until WARN_HOURS, amber until LATE_HOURS, then red.
const WARN_HOURS = 6;
const LATE_HOURS = 8;

const CLASSES = ['Mammals', 'Birds', 'Reptiles', 'Amphibians', 'Invertebrates', 'Other'];
const CLASS_EMOJI = {
  'Mammals': '🐾', 'Birds': '🐦', 'Reptiles': '🦎', 'Amphibians': '🐸',
  'Invertebrates': '🕷️', 'Other': '🐾',
};
// Other spellings people naturally type in the Class column.
const CLASS_ALIASES = {
  'Aves': 'Birds', 'Bird': 'Birds', 'Avian': 'Birds', 'Mammal': 'Mammals',
  'Reptile': 'Reptiles', 'Amphibian': 'Amphibians', 'Invertebrate': 'Invertebrates',
  'Inverts': 'Invertebrates', 'Bugs': 'Invertebrates',
};
// Dropdown suggestions for the Emoji column on the Animals / Equipment tabs.
// Any other emoji pasted into the cell works too.
const ANIMAL_EMOJI_CHOICES = ['🐾','🐭','🐹','🐰','🦔','🐿️','🦦','🦨','🐀','🦫','🐒','🦥','🐕','🐈','🐐','🐑','🐖','🐄','🐎','🦙','🦘','🦇','🦎','🐉','🐍','🐢','🐊','🐸','🕷️','🦂','🐛','🪳','🐌','🐝','🦋','🐞','🐦','🦜','🦉','🦆','🦅','🐧','🐔','🦚','🦩','🐟','🐠','🦈','🐙','🦀','🦞'];
const GEAR_EMOJI_CHOICES = ['🧰','🎤','🔊','🎧','📣','🚐','🚗','🚙','🛻','🪧','🎪','🌳','📦','🧺','🪑','🎒','🧯','🔦','🧹','🪜','🧲','🎨'];
// Species → emoji. A species missing here falls back to its class emoji.
const CATEGORY_EMOJI = {
  'Chinchilla': '🐭', 'Hedgehog': '🦔', 'Sugar Glider': '🐿️', 'Ferret': '🦦',
  'Skunk': '🦨', 'Opossum': '🐀', 'Cavy': '🐹', 'Rabbit': '🐰',
  'Prairie Dog': '🦫', 'Lemur': '🐒', 'Sloth': '🦥',
  'Panther Chameleon': '🦎', 'Veiled Chameleon': '🦎', 'Bearded Dragon': '🐉',
  'Burmese Python': '🐍', 'Ball Python': '🐍', 'Corn Snake': '🐍',
  'Boa Constrictor': '🐍', 'Blue Tongue Skink': '🦎', 'Egyptian Uromastyx': '🦎',
  'Leopard Gecko': '🦎', 'B&W Tegu': '🦎', 'Red Tegu': '🦎',
  'Mata Mata Turtle': '🐢', 'Alligator': '🐊', 'Russian Tortoise': '🐢',
  'African Tortoise': '🐢', 'Cane Toad': '🐸', 'Bullfrog': '🐸',
  'Red Knee Tarantula': '🕷️', 'Curly Haired Tarantula': '🕷️',
  'Desert Blonde Tarantula': '🕷️', 'Giant Millipede': '🐛', 'Scorpion': '🦂',
  'Hissing Cockroaches': '🪳', 'Other': '🐾',
  'Kookaburra': '🐦', 'Kangaroo': '🦘', 'Parrot': '🦜', 'Macaw': '🦜', 'Cockatoo': '🦜', 'Owl': '🦉',
  'Duck': '🦆', 'Chicken': '🐔', 'Peacock': '🦚', 'Flamingo': '🦩', 'Penguin': '🐧',
};

// Equipment that goes out alongside the animals. Lives on the Equipment tab
// (Item | Category | Notes) — add/retire items there, the forms follow.
const GEAR_CATEGORIES = ['Audio', 'Vehicles', 'Equipment'];
const GEAR_EMOJI = { 'Audio': '🎤', 'Vehicles': '🚐', 'Equipment': '🧰' };
const ROSTER_GEAR = [   // sample equipment — replace with your own
  ['PA speaker (small)', 'Audio'], ['PA speaker (large)', 'Audio'], ['Wireless mic', 'Audio'],
  ['Van 1', 'Vehicles'], ['Van 2', 'Vehicles'],
  ['Folding table 1', 'Equipment'], ['Folding table 2', 'Equipment'], ['Folding table 3', 'Equipment'],
  ['Tortoise carrier', 'Equipment'], ['Display stand', 'Equipment'],
  ['Banner', 'Equipment'], ['Sign stand 1', 'Equipment'], ['Sign stand 2', 'Equipment'],
];

// Sample roster — replace with your own. ?page=loadroster&token=… loads it into the live sheet;
// fresh setups seed from it directly. Day-to-day additions happen right on
// the Animals / People tabs — these lists are only the starting point.
const ROSTER_ANIMALS = [   // sample animals — replace with your own
  // Mammals
  ['Jahli', 'Kangaroo', 'Mammals'], ['Hazel', 'Chinchilla', 'Mammals'], ['Sugar', 'Rabbit', 'Mammals'],
  ['Rosie', 'Skunk', 'Mammals'], ['Pip', 'Hedgehog', 'Mammals'], ['Biscuit', 'Ferret', 'Mammals'],
  // Birds
  ['Mango', 'Parrot', 'Birds'],
  // Reptiles
  ['Calypso', 'Boa Constrictor', 'Reptiles'], ['Tina', 'B&W Tegu', 'Reptiles'],
  ['Shelly', 'Russian Tortoise', 'Reptiles'], ['Noodle', 'Corn Snake', 'Reptiles'],
  ['Ziggy', 'Bearded Dragon', 'Reptiles'], ['Gus', 'Leopard Gecko', 'Reptiles'],
  // Amphibians
  ['Lily', 'Bullfrog', 'Amphibians'],
  // Invertebrates
  ['Fuzz', 'Red Knee Tarantula', 'Invertebrates'], ['Pebble', 'Giant Millipede', 'Invertebrates'],
];
const ROSTER_PEOPLE = ['Alex R.', 'Sam T.', 'Jordan P.', 'Casey L.',
                       'Riley K.', 'Morgan D.', 'Taylor B.', 'Jamie W.'];   // sample names — replace with your team
const ADMIN_TOKEN = 'change-me-' + 'to-something-only-you-know';   // CHANGE THIS before you deploy

// ─── Palette (used for sheet styling) ────────────────────────────
const PAL = {
  ink:      '#22301f',
  forest:   '#2e5339',
  deep:     '#233d2b',
  gold:     '#c9a24b',
  goldSoft: '#f3ead2',
  cream:    '#fbf9f4',
  sage:     '#e9efe6',
  sageDeep: '#d5e0d0',
  white:    '#ffffff',
  amber:    '#b97a2a',
  red:      '#a84632',
  grey:     '#7a8577',
};

// ════════════════════════════════════════════════════════════════
//  SETUP — run once (safe to re-run: it rebuilds structure/styling
//  but never touches rows already logged in the Log sheet)
// ════════════════════════════════════════════════════════════════
function setup() {
  const props = PropertiesService.getScriptProperties();
  let ss = null;
  const existing = props.getProperty('SPREADSHEET_ID');
  if (existing) {
    try { ss = SpreadsheetApp.openById(existing); } catch (e) { /* recreate below */ }
  }
  if (!ss) {
    ss = SpreadsheetApp.create(APP_TITLE + ' — Master');
    props.setProperty('SPREADSHEET_ID', ss.getId());
  }

  buildLogSheet_(ss);
  buildAnimalsSheet_(ss);
  buildEquipmentSheet_(ss);
  buildPeopleSheet_(ss);
  buildDashboard_(ss);
  buildReadme_(ss);

  const s1 = ss.getSheetByName('Sheet1');
  if (s1 && ss.getSheets().length > 1) ss.deleteSheet(s1);
  ss.setSpreadsheetTheme(ss.getPredefinedSpreadsheetThemes()[0]);

  Logger.log('✅ Spreadsheet ready: ' + ss.getUrl());
  Logger.log('Next: Deploy ▸ New deployment ▸ Web app (Execute as Me, access: Anyone with the link)');
  return ss.getUrl();
}

function sheetOf_(ss, name, index) {
  return ss.getSheetByName(name) || ss.insertSheet(name, index);
}

// ─── Log sheet ───────────────────────────────────────────────────
function buildLogSheet_(ss) {
  const sh = sheetOf_(ss, 'Log', 1);
  const HEAD = ['Log ID', 'Time Out', 'Handler', 'Animal / Item', 'Category',
                'Time In', 'Duration', 'Activities', 'Playmates', 'Comments', 'Returned By',
                'Kind', 'Batch'];
  sh.getRange(1, 1, 1, HEAD.length).setValues([HEAD])
    .setBackground(PAL.forest).setFontColor(PAL.cream)
    .setFontWeight('bold').setFontFamily('Georgia').setFontSize(11)
    .setVerticalAlignment('middle');
  sh.setRowHeight(1, 34);
  sh.setFrozenRows(1);
  sh.setColumnWidths(1, 1, 80);
  sh.setColumnWidth(2, 170); sh.setColumnWidth(3, 130); sh.setColumnWidth(4, 130);
  sh.setColumnWidth(5, 110); sh.setColumnWidth(6, 170); sh.setColumnWidth(7, 90);
  sh.setColumnWidth(8, 260); sh.setColumnWidth(9, 180); sh.setColumnWidth(10, 320);
  sh.setColumnWidth(11, 130); sh.setColumnWidth(12, 90); sh.setColumnWidth(13, 80);
  sh.getRange('B2:B').setNumberFormat('ddd mmm d, h:mm am/pm');
  sh.getRange('F2:F').setNumberFormat('ddd mmm d, h:mm am/pm');
  sh.getRange('G2:G').setNumberFormat('0" min"');
  sh.getRange('A2:M').setFontFamily('Arial').setFontSize(10).setFontColor(PAL.ink);
  sh.setTabColor(PAL.forest);

  // Rows logged before the Kind column existed are all animals — backfill so
  // the leaderboards can tell animals and equipment apart.
  const last = sh.getLastRow();
  if (last >= 2) {
    const names = sh.getRange(2, 4, last - 1, 1).getValues();
    const kinds = sh.getRange(2, 12, last - 1, 1).getValues();
    const fixed = kinds.map((k, i) => [k[0] ? k[0] : (names[i][0] ? 'Animal' : '')]);
    sh.getRange(2, 12, last - 1, 1).setValues(fixed);
  }

  // Amber row while an outing is open (Time In blank)
  sh.clearConditionalFormatRules();
  const openRule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND($B2<>"",$F2="")')
    .setBackground(PAL.goldSoft)
    .setRanges([sh.getRange('A2:M1000')])
    .build();
  sh.setConditionalFormatRules([openRule]);

  const p = sh.protect().setDescription('Log is written by the QR forms — edit with care.');
  p.setWarningOnly(true);
}

// ─── Animals roster ─────────────────────────────────────────────
function buildAnimalsSheet_(ss) {
  const sh = sheetOf_(ss, 'Animals', 2);
  // Migration: sheets built before the Emoji column had Notes in D — slide
  // everything right one column so no data or formulas are lost.
  if (String(sh.getRange('D1').getValue()) === 'Notes') sh.insertColumnBefore(4);
  const HEAD = ['Animal', 'Species', 'Class', 'Emoji', 'Notes', 'Status', 'Out With', 'Out Since'];
  sh.getRange(1, 1, 1, HEAD.length).setValues([HEAD])
    .setBackground(PAL.forest).setFontColor(PAL.cream)
    .setFontWeight('bold').setFontFamily('Georgia').setFontSize(11)
    .setVerticalAlignment('middle');
  sh.setRowHeight(1, 34);
  sh.setFrozenRows(1);
  sh.setColumnWidth(1, 140); sh.setColumnWidth(2, 170); sh.setColumnWidth(3, 120);
  sh.setColumnWidth(4, 70); sh.setColumnWidth(5, 240); sh.setColumnWidth(6, 90);
  sh.setColumnWidth(7, 130); sh.setColumnWidth(8, 170);
  sh.setTabColor(PAL.sageDeep);

  // Seed the sample roster only if the sheet is empty
  if (sh.getRange('A2').isBlank()) {
    sh.getRange(2, 1, ROSTER_ANIMALS.length, 3).setValues(ROSTER_ANIMALS);
  }

  // Class dropdown (species stays free text); Emoji dropdown accepts any emoji too
  const dv = SpreadsheetApp.newDataValidation().requireValueInList(CLASSES, true)
    .setAllowInvalid(true).build();
  sh.getRange('C2:C200').setDataValidation(dv);
  sh.getRange('D2:D200').setDataValidation(emojiValidation_(ANIMAL_EMOJI_CHOICES))
    .setHorizontalAlignment('center').setFontSize(14);

  // Live status formulas (computed from the Log)
  sh.getRange('F2').setFormula(
    '=BYROW(A2:A200, LAMBDA(a, IF(a="",, IF(COUNTIFS(Log!D:D,a,Log!F:F,"=")>0,"OUT ●","IN ✓"))))');
  sh.getRange('G2').setFormula(
    '=BYROW(A2:A200, LAMBDA(a, IF(a="",, IFERROR(INDEX(FILTER(Log!C:C,Log!D:D=a,Log!F:F=""),1),""))))');
  sh.getRange('H2').setFormula(
    '=BYROW(A2:A200, LAMBDA(a, IF(a="",, IFERROR(INDEX(FILTER(Log!B:B,Log!D:D=a,Log!F:F=""),1),""))))');
  sh.getRange('H2:H200').setNumberFormat('ddd h:mm am/pm');
  sh.getRange('A2:H200').setFontFamily('Arial').setFontSize(10).setFontColor(PAL.ink);
  sh.getRange('D2:D200').setFontSize(14);
  sh.getRange('F2:F200').setHorizontalAlignment('center').setFontWeight('bold');

  sh.clearConditionalFormatRules();
  const rules = [
    SpreadsheetApp.newConditionalFormatRule().whenTextContains('OUT')
      .setBackground(PAL.goldSoft).setFontColor(PAL.amber)
      .setRanges([sh.getRange('F2:F200')]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextContains('IN')
      .setBackground(PAL.sage).setFontColor(PAL.forest)
      .setRanges([sh.getRange('F2:F200')]).build(),
  ];
  sh.setConditionalFormatRules(rules);
}

function emojiValidation_(choices) {
  return SpreadsheetApp.newDataValidation().requireValueInList(choices, true)
    .setAllowInvalid(true)
    .setHelpText('Pick one from the list, or paste any emoji you like. Leave blank for the default.')
    .build();
}

// ─── Equipment roster ───────────────────────────────────────────
function buildEquipmentSheet_(ss) {
  const sh = sheetOf_(ss, 'Equipment', 3);
  if (String(sh.getRange('C1').getValue()) === 'Notes') sh.insertColumnBefore(3);   // migration (see Animals)
  const HEAD = ['Item', 'Category', 'Emoji', 'Notes', 'Status', 'Out With', 'Out Since'];
  sh.getRange(1, 1, 1, HEAD.length).setValues([HEAD])
    .setBackground(PAL.forest).setFontColor(PAL.cream)
    .setFontWeight('bold').setFontFamily('Georgia').setFontSize(11)
    .setVerticalAlignment('middle');
  sh.setRowHeight(1, 34);
  sh.setFrozenRows(1);
  sh.setColumnWidth(1, 180); sh.setColumnWidth(2, 120); sh.setColumnWidth(3, 70); sh.setColumnWidth(4, 240);
  sh.setColumnWidth(5, 90); sh.setColumnWidth(6, 130); sh.setColumnWidth(7, 170);
  sh.setTabColor(PAL.sageDeep);

  if (sh.getRange('A2').isBlank()) {
    sh.getRange(2, 1, ROSTER_GEAR.length, 2).setValues(ROSTER_GEAR);
  }
  const dv = SpreadsheetApp.newDataValidation().requireValueInList(GEAR_CATEGORIES, true)
    .setAllowInvalid(true).build();
  sh.getRange('B2:B200').setDataValidation(dv);
  sh.getRange('C2:C200').setDataValidation(emojiValidation_(GEAR_EMOJI_CHOICES))
    .setHorizontalAlignment('center').setFontSize(14);

  sh.getRange('E2').setFormula(
    '=BYROW(A2:A200, LAMBDA(a, IF(a="",, IF(COUNTIFS(Log!D:D,a,Log!F:F,"=")>0,"OUT ●","IN ✓"))))');
  sh.getRange('F2').setFormula(
    '=BYROW(A2:A200, LAMBDA(a, IF(a="",, IFERROR(INDEX(FILTER(Log!C:C,Log!D:D=a,Log!F:F=""),1),""))))');
  sh.getRange('G2').setFormula(
    '=BYROW(A2:A200, LAMBDA(a, IF(a="",, IFERROR(INDEX(FILTER(Log!B:B,Log!D:D=a,Log!F:F=""),1),""))))');
  sh.getRange('G2:G200').setNumberFormat('ddd h:mm am/pm');
  sh.getRange('A2:G200').setFontFamily('Arial').setFontSize(10).setFontColor(PAL.ink);
  sh.getRange('C2:C200').setFontSize(14);
  sh.getRange('E2:E200').setHorizontalAlignment('center').setFontWeight('bold');

  sh.clearConditionalFormatRules();
  sh.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule().whenTextContains('OUT')
      .setBackground(PAL.goldSoft).setFontColor(PAL.amber)
      .setRanges([sh.getRange('E2:E200')]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextContains('IN')
      .setBackground(PAL.sage).setFontColor(PAL.forest)
      .setRanges([sh.getRange('E2:E200')]).build(),
  ]);
}

// ─── People roster ──────────────────────────────────────────────
function buildPeopleSheet_(ss) {
  const sh = sheetOf_(ss, 'People', 3);
  const HEAD = ['Name', 'Role', 'Active'];
  sh.getRange(1, 1, 1, HEAD.length).setValues([HEAD])
    .setBackground(PAL.forest).setFontColor(PAL.cream)
    .setFontWeight('bold').setFontFamily('Georgia').setFontSize(11)
    .setVerticalAlignment('middle');
  sh.setRowHeight(1, 34);
  sh.setFrozenRows(1);
  sh.setColumnWidth(1, 160); sh.setColumnWidth(2, 160); sh.setColumnWidth(3, 80);
  sh.setTabColor(PAL.sageDeep);

  if (sh.getRange('A2').isBlank()) {
    sh.getRange(2, 1, ROSTER_PEOPLE.length, 3)
      .setValues(ROSTER_PEOPLE.map(n => [n, 'Staff', true]));
  }
  sh.getRange('C2:C200').insertCheckboxes();
  sh.getRange('A2:C200').setFontFamily('Arial').setFontSize(10).setFontColor(PAL.ink);
}

// ─── Master dashboard ───────────────────────────────────────────
function buildDashboard_(ss) {
  const sh = sheetOf_(ss, 'Dashboard', 0);
  sh.clear();
  sh.clearConditionalFormatRules();
  sh.setHiddenGridlines(true);
  sh.setTabColor(PAL.gold);
  ss.setActiveSheet(sh);
  ss.moveActiveSheet(1);

  const maxCols = 11;
  sh.getRange(1, 1, 60, maxCols).setBackground(PAL.cream).setFontColor(PAL.ink)
    .setFontFamily('Arial');
  sh.setColumnWidth(1, 24);                       // left margin
  for (let c = 2; c <= 10; c++) sh.setColumnWidth(c, 132);
  sh.setColumnWidth(11, 24);                      // right margin

  // ── Title band ──
  sh.getRange('A1:K3').setBackground(PAL.deep);
  sh.getRange('B2').setValue('🐾  ' + APP_TITLE.toUpperCase() + ' — MASTER DASHBOARD')
    .setFontFamily('Georgia').setFontSize(20).setFontWeight('bold').setFontColor(PAL.cream);
  sh.getRange('B2:J2').merge().setVerticalAlignment('middle');
  sh.getRange('B3:J3').merge()
    .setValue('Who is out · with whom · for how long — animals and equipment, live from the QR forms')
    .setFontSize(10).setFontStyle('italic').setFontColor(PAL.gold)
    .setVerticalAlignment('top');
  sh.setRowHeight(1, 12); sh.setRowHeight(2, 40); sh.setRowHeight(3, 26);

  // ── Stat tiles (row 5 label / row 6 value) ──
  const tiles = [
    ['OUT RIGHT NOW',   '=COUNTIFS(Log!D2:D,"<>",Log!F2:F,"=")',                                        'B', 'C'],
    ['OUTINGS TODAY',   '=COUNTIFS(Log!B2:B,">="&TODAY(),Log!B2:B,"<"&TODAY()+1)',                      'D', 'E'],
    ['THIS MONTH',      '=COUNTIFS(Log!B2:B,">="&DATE(YEAR(TODAY()),MONTH(TODAY()),1),Log!B2:B,"<"&EOMONTH(TODAY(),0)+1)', 'F', 'G'],
    ['THIS YEAR',       '=COUNTIFS(Log!B2:B,">="&DATE(YEAR(TODAY()),1,1))',                             'H', 'I'],
    ['AVG OUTING · 30D', '=IFERROR(ROUND(AVERAGEIFS(Log!G2:G,Log!B2:B,">="&TODAY()-30,Log!G2:G,">0"))&" min","—")', 'J', 'J'],
  ];
  sh.setRowHeight(4, 14); sh.setRowHeight(5, 22); sh.setRowHeight(6, 42); sh.setRowHeight(7, 14);
  tiles.forEach(([label, formula, c1, c2]) => {
    const labelRange = sh.getRange(c1 + '5:' + c2 + '5');
    const valueRange = sh.getRange(c1 + '6:' + c2 + '6');
    if (c1 !== c2) { labelRange.merge(); valueRange.merge(); }
    labelRange.setValue(label).setFontSize(9).setFontWeight('bold')
      .setFontColor(PAL.grey).setHorizontalAlignment('center')
      .setBackground(PAL.white).setVerticalAlignment('bottom');
    valueRange.setFormula(formula).setFontFamily('Georgia').setFontSize(24)
      .setFontWeight('bold').setFontColor(PAL.forest)
      .setHorizontalAlignment('center').setVerticalAlignment('middle')
      .setBackground(PAL.white);
    sh.getRange(c1 + '5:' + c2 + '6')
      .setBorder(true, true, true, true, false, false, PAL.sageDeep, SpreadsheetApp.BorderStyle.SOLID);
  });
  sh.getRange('J6').setFontSize(18);

  // ── Section: OUT RIGHT NOW ──
  sectionHeader_(sh, 'B9:J9', '🔓  OUT RIGHT NOW');
  const outHead = ['Animal / Item', 'Category', 'Handler', 'Out Since', 'Elapsed'];
  sh.getRange('B10:F10').setValues([outHead])
    .setFontWeight('bold').setFontSize(10).setFontColor(PAL.forest)
    .setBackground(PAL.sage);
  sh.getRange('G10:J10').setBackground(PAL.sage);
  sh.getRange('B11').setFormula(
    '=IFERROR(SORT(FILTER({Log!D2:D, Log!E2:E, Log!C2:C, Log!B2:B, NOW()-Log!B2:B}, Log!F2:F="", Log!B2:B<>""),4,TRUE),"All animals are home  🏡")');
  sh.getRange('E11:E24').setNumberFormat('ddd h:mm am/pm');
  sh.getRange('F11:F24').setNumberFormat('[h]"h "mm"m"').setFontWeight('bold');
  sh.getRange('B11:F24').setFontSize(10);
  // Green under WARN_HOURS, amber until LATE_HOURS, red after that.
  const outRules = [
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=AND($F11<>"",$F11>=TIME(' + LATE_HOURS + ',0,0))')
      .setFontColor(PAL.red).setBold(true)
      .setRanges([sh.getRange('F11:F24')]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=AND($F11<>"",$F11>=TIME(' + WARN_HOURS + ',0,0))')
      .setFontColor(PAL.amber).setBold(true)
      .setRanges([sh.getRange('F11:F24')]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=AND($F11<>"",ISNUMBER($F11))')
      .setFontColor(PAL.forest)
      .setRanges([sh.getRange('F11:F24')]).build(),
  ];
  sh.getRange('B25:J25').merge()
    .setValue('Green under ' + WARN_HOURS + ' h · amber from ' + WARN_HOURS + ' h · red from ' + LATE_HOURS + ' h. Elapsed ticks once per minute — turn on File ▸ Settings ▸ Calculation ▸ “On change and every minute”. The wall Board page ticks every second.')
    .setFontSize(8).setFontStyle('italic').setFontColor(PAL.grey);

  // ── Section: STAFF SPOTLIGHT ──
  sectionHeader_(sh, 'B27:J27', '👤  STAFF SPOTLIGHT — pick a name for their full history');
  sh.getRange('B28').setValue('Handler:').setFontWeight('bold').setFontSize(10)
    .setHorizontalAlignment('right').setVerticalAlignment('middle');
  const sel = sh.getRange('C28');
  sel.setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInRange(ss.getSheetByName('People').getRange('A2:A200'), true)
    .setAllowInvalid(false).build());
  sel.setBackground(PAL.white).setFontSize(11).setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setBorder(true, true, true, true, false, false, PAL.gold, SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  sh.getRange('D28:G28').merge().setFormula(
    '=IF($C$28="","← choose a handler",COUNTIF(Log!C:C,$C$28)&" check-outs · "&COUNTIF(Log!K:K,$C$28)&" returns handled · "&COUNTIFS(Log!C:C,$C$28,Log!B:B,">="&DATE(YEAR(TODAY()),MONTH(TODAY()),1))&" check-outs this month")')
    .setFontStyle('italic').setFontSize(10).setFontColor(PAL.grey).setVerticalAlignment('middle');
  sh.setRowHeight(28, 30);
  const histHead = ['Out', 'Animal / Item', 'Back', 'Duration', 'Returned By', 'Comments'];
  sh.getRange('B29:G29').setValues([histHead])
    .setFontWeight('bold').setFontSize(10).setFontColor(PAL.forest).setBackground(PAL.sage);
  sh.getRange('H29:J29').setBackground(PAL.sage);
  sh.getRange('B30').setFormula(
    '=IFERROR(SORT(FILTER({Log!B2:B, Log!D2:D, IF(Log!F2:F="", "— still out —", Log!F2:F), Log!G2:G, Log!K2:K, Log!J2:J}, Log!C2:C=$C$28, Log!B2:B<>""),1,FALSE),IF($C$28="","","No outings recorded yet."))');
  sh.getRange('B30:B41').setNumberFormat('mmm d, h:mm am/pm');
  sh.getRange('D30:D41').setNumberFormat('mmm d, h:mm am/pm');
  sh.getRange('E30:E41').setNumberFormat('0" min"');
  sh.getRange('B30:G41').setFontSize(10);

  // Accountability: animals this person brought home for someone else
  sh.getRange('B43:F43').merge()
    .setValue('🤝  Returns for colleagues — animals they brought home for someone else')
    .setFontWeight('bold').setFontSize(10).setFontColor(PAL.forest).setBackground(PAL.sage);
  sh.getRange('G43:J43').setBackground(PAL.sage);
  sh.getRange('B44:D44').setValues([['When', 'Animal / Item', 'Checked out by']])
    .setFontWeight('bold').setFontSize(9).setFontColor(PAL.grey);
  sh.getRange('B45').setFormula(
    '=IFERROR(SORT(FILTER({Log!F2:F, Log!D2:D, Log!C2:C}, Log!K2:K=$C$28, Log!C2:C<>$C$28),1,FALSE),IF($C$28="","","None yet — every return so far was their own outing."))');
  sh.getRange('B45:B50').setNumberFormat('mmm d, h:mm am/pm');
  sh.getRange('B45:D50').setFontSize(10);

  // ── Section: THIS MONTH'S LEADERBOARD ──
  sectionHeader_(sh, 'B52:J52', '🏆  THIS MONTH');
  const monthDate = 'TEXT(DATE(YEAR(TODAY()),MONTH(TODAY()),1),"yyyy-mm-dd")';
  sh.getRange('B53:C53').merge().setValue('Top handlers (check-outs)')
    .setFontWeight('bold').setFontSize(10).setFontColor(PAL.forest).setBackground(PAL.sage);
  sh.getRange('E53:F53').merge().setValue('Top returners (check-ins)')
    .setFontWeight('bold').setFontSize(10).setFontColor(PAL.forest).setBackground(PAL.sage);
  sh.getRange('H53:I53').merge().setValue('Most-loved animals')
    .setFontWeight('bold').setFontSize(10).setFontColor(PAL.forest).setBackground(PAL.sage);
  sh.getRange('B54').setFormula(
    '=IFERROR(QUERY(Log!B2:M,"select C, count(D) where B >= date \'"&' + monthDate + '&"\' and C is not null and L != \'Equipment\' group by C order by count(D) desc limit 5 label C \'\', count(D) \'\'"),"No outings yet this month")');
  sh.getRange('E54').setFormula(
    '=IFERROR(QUERY(Log!B2:M,"select K, count(D) where B >= date \'"&' + monthDate + '&"\' and K is not null and L != \'Equipment\' group by K order by count(D) desc limit 5 label K \'\', count(D) \'\'"),"No returns yet this month")');
  sh.getRange('H54').setFormula(
    '=IFERROR(QUERY(Log!B2:M,"select D, count(C) where B >= date \'"&' + monthDate + '&"\' and D is not null and L != \'Equipment\' group by D order by count(C) desc limit 5 label D \'\', count(C) \'\'"),"No outings yet this month")');
  sh.getRange('B54:I59').setFontSize(10);
  sh.getRange('C54:C59').setHorizontalAlignment('center');
  sh.getRange('F54:F59').setHorizontalAlignment('center');
  sh.getRange('I54:I59').setHorizontalAlignment('center');

  sh.setConditionalFormatRules(outRules);

  const p = sh.protect().setDescription('Dashboard is formula-driven — no data entry here.');
  p.setWarningOnly(true);
}

function sectionHeader_(sh, a1, text) {
  const r = sh.getRange(a1);
  r.merge().setValue(text)
    .setFontFamily('Georgia').setFontSize(13).setFontWeight('bold')
    .setFontColor(PAL.cream).setBackground(PAL.forest)
    .setVerticalAlignment('middle');
  sh.setRowHeight(r.getRow(), 30);
}

// ─── Read Me tab ────────────────────────────────────────────────
function buildReadme_(ss) {
  const sh = sheetOf_(ss, 'Read Me', 4);
  sh.clear();
  sh.setHiddenGridlines(true);
  sh.setTabColor(PAL.gold);
  sh.getRange(1, 1, 40, 8).setBackground(PAL.cream);
  sh.setColumnWidth(1, 24); sh.setColumnWidth(2, 700);
  const lines = [
    ['🐾  HOW THIS SYSTEM WORKS', 'title'],
    ['', ''],
    ['• Staff scan the OUT poster → pick their name → tap every animal AND every piece of equipment they are taking → go.', ''],
    ['• Staff scan the BACK poster → everything they have out is pre-selected → checklist + comments → done.', ''],
    ['• Anyone can bring back a colleague\'s animal or equipment; the Log records who returned it.', ''],
    ['• The Dashboard tab (and the live wall Board page) always shows who is out, with whom, for how long.', ''],
    ['• Timers: green under ' + WARN_HOURS + ' hours, amber from ' + WARN_HOURS + ' hours, red from ' + LATE_HOURS + ' hours.', ''],
    ['', ''],
    ['🛠  EVERYDAY ADMIN', 'title'],
    ['', ''],
    ['• Add an animal: type a new row on the Animals tab — Animal name, Species, Class (dropdown), Emoji, Notes.', ''],
    ['  Emoji: pick from the dropdown or paste ANY emoji (Mac: Ctrl+Cmd+Space · iPad/iPhone: emoji keyboard).', ''],
    ['  Leave Emoji blank and it is chosen from the species/class. New rows show on the forms straight away.', ''],
    ['• Classes: ' + CLASSES.join(' · ') + '   (“Aves” is understood as Birds).', ''],
    ['• Add equipment the same way on the Equipment tab — Item, Category (Audio / Vehicles / Equipment), Emoji, Notes.', ''],
    ['• Retire an animal or item: delete its row (or clear the name). Its history stays in the Log.', ''],
    ['• Add/retire people on the People tab. Untick “Active” to hide someone from the forms.', ''],
    ['• Never edit the Log tab by hand unless fixing a mistake (e.g. someone forgot to check in:', ''],
    ['  just type the real Time In and Duration in their row).', ''],
    ['', ''],
    ['⚙️  ONE-TIME SETTINGS (do these once)', 'title'],
    ['', ''],
    ['• File ▸ Settings ▸ set your Time zone, and Calculation ▸ “On change and every minute”', ''],
    ['  (this makes the Dashboard Elapsed column tick).', ''],
    ['• In the Apps Script editor: Project Settings ▸ set the same time zone.', ''],
    ['• Print the QR posters from  <web-app-URL>?page=qr  — laminate and mount them.', ''],
    ['', ''],
    ['📺  THE LIVE BOARD', 'title'],
    ['', ''],
    ['• Open  <web-app-URL>?page=board  on a wall iPad or TV browser.', ''],
    ['• It refreshes itself and ticks every second — no spreadsheet needed.', ''],
  ];
  lines.forEach((row, i) => {
    const r = sh.getRange(i + 2, 2);
    r.setValue(row[0]).setFontFamily(row[1] === 'title' ? 'Georgia' : 'Arial')
      .setFontSize(row[1] === 'title' ? 14 : 11)
      .setFontWeight(row[1] === 'title' ? 'bold' : 'normal')
      .setFontColor(row[1] === 'title' ? PAL.forest : PAL.ink);
  });
}

// ════════════════════════════════════════════════════════════════
//  WEB APP
// ════════════════════════════════════════════════════════════════
function doGet(e) {
  // First-ever visit builds the spreadsheet automatically — no editor needed.
  if (!PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID')) {
    setup();
  }
  const page = (e && e.parameter && e.parameter.page) || 'out';
  if (page === 'admin') return adminPage_();
  if (page === 'loadroster') {
    if ((e.parameter.token || '') !== ADMIN_TOKEN) {
      return HtmlService.createHtmlOutput('Not authorized.');
    }
    return loadRoster_();
  }
  if (page === 'addanimal' || page === 'addgear') {   // token-gated: append a roster row if the name is new
    if ((e.parameter.token || '') !== ADMIN_TOKEN) {
      return ContentService.createTextOutput('Not authorized.');
    }
    return ContentService.createTextOutput(addRosterRow_(page === 'addanimal', e.parameter));
  }
  if (page === 'peek') {      // token-gated smoke test: what the forms would receive, as JSON
    if ((e.parameter.token || '') !== ADMIN_TOKEN) {
      return ContentService.createTextOutput('Not authorized.');
    }
    const d = apiDashData();
    const c = apiCheckoutData();
    return ContentService.createTextOutput(JSON.stringify({
      people: c.people.length, classes: c.classes.map(x => x.cls + ':' + x.total),
      gear: c.gear.map(x => x.cat + ':' + x.items.length), outCount: c.outCount, gearOutCount: c.gearOutCount,
      warnMs: d.warnMs, lateMs: d.lateMs, animals: d.animals.length, gearItems: d.gear.length,
      openNow: d.log.filter(r => !r.inn).map(r => r.kind + ' ' + r.animal + ' / ' + r.person),
      byClass: c.classes.map(x => x.cls + ' ' + x.emoji + ': ' + x.species.map(s => s.emoji + ' ' + s.species + ' (' + s.animals.join(', ') + ')').join('; ')),
      lastAnimals: d.animals.slice(-3), lastGear: d.gear.slice(-2),
      logRows: d.log.length, dailyListUrl: d.dailyListUrl,
    }, null, 1)).setMimeType(ContentService.MimeType.JSON);
  }
  if (page === 'rebuild') {   // re-runs setup(): refreshes structure/styling, never touches logged rows
    if ((e.parameter.token || '') !== ADMIN_TOKEN) {
      return HtmlService.createHtmlOutput('Not authorized.');
    }
    setup();
    const d = ss_().getSheetByName('Dashboard');
    const checks = ['C6', 'D28', 'B54', 'E54', 'H54']
      .map(a1 => a1 + '=[' + d.getRange(a1).getDisplayValue() + ']').join(' · ');
    return HtmlService.createHtmlOutput('Sheet structure rebuilt. Checks: ' + checks);
  }
  const files = { out: 'CheckOut', in: 'CheckIn', board: 'Board', qr: 'QR' };
  const t = HtmlService.createTemplateFromFile(files[page] || 'CheckOut');
  t.appUrl = ScriptApp.getService().getUrl();
  t.orgName = ORG_NAME;
  t.dailyListUrl = DAILY_LIST_URL;
  const titles = { out: 'Check Out', in: 'Welcome Back', board: 'Status Board', qr: 'QR Posters' };
  return t.evaluate()
    .setTitle(ORG_NAME + ' · ' + (titles[page] || 'Check Out'))
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1');
}

function include(name) {
  return HtmlService.createHtmlOutputFromFile(name).getContent();
}

/** Replaces the Animals/People rosters with ROSTER_ANIMALS / ROSTER_PEOPLE.
 *  Token-gated; leaves the Log and all formulas untouched. */
function loadRoster_() {
  const ss = ss_();
  const a = ss.getSheetByName('Animals');
  a.getRange(2, 1, 199, 5).clearContent();   // name, species, class, emoji, notes (clears stale formulas too)
  a.getRange('B2:B200').setDataValidation(null);
  a.getRange(2, 1, ROSTER_ANIMALS.length, 3).setValues(ROSTER_ANIMALS);
  const dv = SpreadsheetApp.newDataValidation()
    .requireValueInList(CLASSES, true).setAllowInvalid(true).build();
  a.getRange('C2:C200').setDataValidation(dv);
  a.getRange('D2:D200').setDataValidation(emojiValidation_(ANIMAL_EMOJI_CHOICES));
  const g = ss.getSheetByName('Equipment') || (buildEquipmentSheet_(ss), ss.getSheetByName('Equipment'));
  g.getRange(2, 1, 199, 4).clearContent();
  g.getRange('C2:C200').setDataValidation(emojiValidation_(GEAR_EMOJI_CHOICES));
  g.getRange(2, 1, ROSTER_GEAR.length, 2).setValues(ROSTER_GEAR);
  const p = ss.getSheetByName('People');
  p.getRange(2, 1, 199, 3).clearContent();
  p.getRange(2, 1, ROSTER_PEOPLE.length, 3)
    .setValues(ROSTER_PEOPLE.map(n => [n, 'Staff', true]));
  const back = a.getRange(2, 1, ROSTER_ANIMALS.length, 1).getValues().map(r => r[0]).join(', ');
  return HtmlService.createHtmlOutput(
    'Roster loaded — ' + ROSTER_ANIMALS.length + ' animals (' + back + '), ' +
    ROSTER_GEAR.length + ' equipment items and ' +
    ROSTER_PEOPLE.length + ' people. You can close this tab.');
}

/** Appends one animal (name, species, class, emoji, notes) or one item
 *  (name, category, emoji, notes) to its roster tab unless the name already exists. */
function addRosterRow_(isAnimal, p) {
  const name = String(p.name || '').trim();
  if (!name) return 'Missing name.';
  const ss = ss_();
  const sh = ss.getSheetByName(isAnimal ? 'Animals' : 'Equipment');
  const last = sh.getLastRow();
  const names = last >= 2 ? sh.getRange(2, 1, last - 1, 1).getValues().map(r => String(r[0]).trim().toLowerCase()) : [];
  if (names.indexOf(name.toLowerCase()) >= 0) return name + ' is already on the ' + sh.getName() + ' tab.';
  const row = last + 1;
  const vals = isAnimal
    ? [name, String(p.species || '').trim(), normClass_(p['class']), String(p.emoji || '').trim(), String(p.notes || '').trim()]
    : [name, GEAR_CATEGORIES.indexOf(String(p.category || '').trim()) >= 0 ? String(p.category).trim() : 'Equipment',
       String(p.emoji || '').trim(), String(p.notes || '').trim()];
  sh.getRange(row, 1, 1, vals.length).setValues([vals]);
  return 'Added ' + name + ' to the ' + sh.getName() + ' tab (row ' + row + '): ' + vals.filter(String).join(' · ');
}

/** Everything the administrator needs, in one place: <web-app-URL>?page=admin */
function adminPage_() {
  const ss = ss_();
  const base = ScriptApp.getService().getUrl();
  const link = (url, label) =>
    '<a href="' + url + '" target="_blank" style="display:block;background:#fff;border:1px solid #d5e0d0;' +
    'border-radius:12px;padding:16px 20px;margin-top:12px;text-decoration:none;color:#233d2b;' +
    'font-weight:600;box-shadow:0 2px 10px rgba(34,48,31,.07)">' + label + '</a>';
  const html =
    '<div style="max-width:520px;margin:0 auto;padding:40px 20px;font-family:Georgia,serif;background:#fbf9f4">' +
    '<h1 style="color:#233d2b">🐾 ' + ORG_NAME + ' — Admin</h1>' +
    '<p style="color:#7a8577;font-family:Arial">Bookmark this page. Everything lives here.</p>' +
    link(ss.getUrl(), '📊 Open the master spreadsheet & dashboard') +
    link(DAILY_LIST_URL, '📋 Daily Animals List') +
    link(base + '?page=qr', '🖨️ Print the QR posters') +
    link(base + '?page=board', '📺 Open the live wall board') +
    link(base + '?page=out', '🐕 Check-out form (what the OUT poster opens)') +
    link(base + '?page=in', '🏡 Check-in form (what the BACK poster opens)') +
    '</div>';
  return HtmlService.createHtmlOutput(html).setTitle(ORG_NAME + ' · Admin')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// ─── Data access helpers ────────────────────────────────────────
function ss_() {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) throw new Error('Run setup() in the script editor first.');
  return SpreadsheetApp.openById(id);
}
function tz_(ss) { return ss.getSpreadsheetTimeZone(); }

function logRows_(ss) {
  const sh = ss.getSheetByName('Log');
  const last = sh.getLastRow();
  if (last < 2) return [];
  const vals = sh.getRange(2, 1, last - 1, 13).getValues();
  return vals.map((v, i) => ({
    row: i + 2,
    id: String(v[0]),
    timeOut: v[1] instanceof Date ? v[1] : null,
    person: String(v[2]),
    animal: String(v[3]),
    category: String(v[4]),
    timeIn: v[5] instanceof Date ? v[5] : null,
    minutes: typeof v[6] === 'number' ? v[6] : null,
    acts: String(v[7] || ''),
    mates: String(v[8] || ''),
    comments: String(v[9] || ''),
    returnedBy: String(v[10] || ''),
    kind: String(v[11] || 'Animal'),        // 'Animal' | 'Equipment'
    batch: String(v[12] || ''),             // shared by items checked out together
  })).filter(r => r.timeOut);
}

function activePeople_(ss) {
  const sh = ss.getSheetByName('People');
  const last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, 3).getValues()
    .filter(v => v[0] && v[2] === true)
    .map(v => String(v[0]))
    .sort();
}

function animals_(ss) {
  const sh = ss.getSheetByName('Animals');
  const last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, 4).getValues()
    .filter(v => v[0])
    .map(v => ({
      name: String(v[0]).trim(),
      category: String(v[1]).trim() || 'Other',
      cls: normClass_(v[2]),
      emoji: String(v[3] || '').trim(),          // optional, from the Emoji column
    }));
}

/** 'Aves' → 'Birds', 'mammals' → 'Mammals', anything unknown → 'Other'. */
function normClass_(raw) {
  const s = String(raw || '').trim();
  if (!s) return 'Other';
  const hit = CLASSES.find(c => c.toLowerCase() === s.toLowerCase());
  if (hit) return hit;
  const alias = Object.keys(CLASS_ALIASES).find(k => k.toLowerCase() === s.toLowerCase());
  return alias ? CLASS_ALIASES[alias] : 'Other';
}

function gear_(ss) {
  const sh = ss.getSheetByName('Equipment');
  if (!sh) return [];
  const last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, 3).getValues()
    .filter(v => v[0])
    .map(v => ({
      name: String(v[0]).trim(),
      category: GEAR_CATEGORIES.indexOf(String(v[1]).trim()) >= 0 ? String(v[1]).trim() : 'Equipment',
      emoji: String(v[2] || '').trim(),
    }));
}

// Emoji precedence: the Emoji cell on the roster tab → species → class → paw.
function emojiFor_(species, cls) {
  return CATEGORY_EMOJI[species] || CLASS_EMOJI[cls] || '🐾';
}
function emojiForAnimal_(a) {
  return (a && a.emoji) || emojiFor_(a && a.category, a && a.cls);
}
function emojiForGear_(g) {
  return (g && g.emoji) || GEAR_EMOJI[g && g.category] || '🧰';
}
/** name → emoji for every animal and item on the roster tabs (one read per request). */
function emojiIndex_(ss) {
  const idx = {};
  animals_(ss).forEach(a => { idx[a.name] = emojiForAnimal_(a); });
  gear_(ss).forEach(g => { idx[g.name] = emojiForGear_(g); });
  return idx;
}
function emojiForRow_(r, idx) {
  if (idx && idx[r.animal]) return idx[r.animal];
  if (r.kind === 'Equipment') return GEAR_EMOJI[r.category] || '🧰';
  return CATEGORY_EMOJI[r.category] || '🐾';
}

function fmtTime_(ss, d) { return Utilities.formatDate(d, tz_(ss), 'h:mm a'); }

// ─── API: check-out ─────────────────────────────────────────────
function apiCheckoutData() {
  const ss = ss_();
  const outNow = new Set(logRows_(ss).filter(r => !r.timeIn).map(r => r.animal));
  const byClass = {};   // class → species → [animal objects]
  const emojis = {};    // name → emoji, for every animal and item (custom or default)
  animals_(ss).forEach(a => {
    emojis[a.name] = emojiForAnimal_(a);
    if (outNow.has(a.name)) return;               // hide animals already out
    const c = byClass[a.cls] = byClass[a.cls] || {};
    (c[a.category] = c[a.category] || []).push(a);
  });
  const classes = CLASSES.filter(cls => byClass[cls]).map(cls => ({
    cls: cls,
    emoji: CLASS_EMOJI[cls] || '🐾',
    total: Object.keys(byClass[cls]).reduce((s, sp) => s + byClass[cls][sp].length, 0),
    species: Object.keys(byClass[cls]).sort().map(sp => ({
      species: sp,
      // a species inherits the first custom emoji one of its animals carries
      emoji: (byClass[cls][sp].find(x => x.emoji) || {}).emoji || emojiFor_(sp, cls),
      animals: byClass[cls][sp].map(x => x.name).sort(),
    })),
  }));
  const byCat = {};     // gear category → [items], in sheet order
  let gearOut = 0;
  gear_(ss).forEach(g => {
    emojis[g.name] = emojiForGear_(g);
    if (outNow.has(g.name)) { gearOut++; return; }
    (byCat[g.category] = byCat[g.category] || []).push(g.name);
  });
  const gear = GEAR_CATEGORIES.filter(c => byCat[c]).map(c => ({
    cat: c, emoji: GEAR_EMOJI[c], items: byCat[c],
  }));
  return { people: activePeople_(ss), classes: classes, gear: gear, emojis: emojis,
           outCount: outNow.size - gearOut, gearOutCount: gearOut };
}

/** One submission may hold several animals and several pieces of equipment.
 *  Each becomes its own Log row (so they can come back separately) sharing a
 *  Batch id. Accepts a single name for `animals` too, for older clients. */
function apiSubmitCheckout(person, animals, gear) {
  const wantA = [].concat(animals || []).map(String).filter(Boolean);
  const wantG = [].concat(gear || []).map(String).filter(Boolean);
  if (!person || (!wantA.length && !wantG.length)) {
    return { ok: false, message: 'Pick your name and at least one animal or piece of equipment.' };
  }
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = ss_();
    const outNow = new Set(logRows_(ss).filter(r => !r.timeIn).map(r => r.animal));
    const taken = wantA.concat(wantG).filter(n => outNow.has(n));
    if (taken.length) {
      return { ok: false, stale: true, taken: taken,
               message: taken.join(', ') + (taken.length === 1 ? ' was' : ' were') +
                        ' just checked out by someone else — the list has been refreshed.' };
    }
    const aMap = {}; animals_(ss).forEach(a => { aMap[a.name] = a; });
    const gMap = {}; gear_(ss).forEach(g => { gMap[g.name] = g; });
    const now = new Date();
    const batch = Utilities.getUuid().slice(0, 8);
    const lines = [], items = [];
    wantA.forEach(n => {
      const a = aMap[n] || {};
      const cat = a.category || 'Other';
      lines.push([Utilities.getUuid().slice(0, 8), now, person, n, cat, '', '', '', '', '', '', 'Animal', batch]);
      items.push({ name: n, emoji: emojiForAnimal_(Object.assign({ category: cat }, a)), kind: 'Animal' });
    });
    wantG.forEach(n => {
      const cat = (gMap[n] || {}).category || 'Equipment';
      lines.push([Utilities.getUuid().slice(0, 8), now, person, n, cat, '', '', '', '', '', '', 'Equipment', batch]);
      items.push({ name: n, emoji: emojiForGear_(Object.assign({ category: cat }, gMap[n] || {})), kind: 'Equipment' });
    });
    const sh = ss.getSheetByName('Log');
    sh.getRange(sh.getLastRow() + 1, 1, lines.length, lines[0].length).setValues(lines);
    return { ok: true, person: person, items: items, time: fmtTime_(ss, now),
             // legacy single-item fields
             animal: items[0].name, emoji: items[0].emoji };
  } finally {
    lock.releaseLock();
  }
}

// ─── API: check-in ──────────────────────────────────────────────
function apiCheckinData(person) {
  const ss = ss_();
  const rows = logRows_(ss);
  const idx = emojiIndex_(ss);
  // `open` = this person's outings; `others` = animals out with someone else,
  // so anyone can bring home an animal a colleague checked out.
  const result = { people: activePeople_(ss), activities: ACTIVITIES, open: [], others: [] };
  if (!person) return result;
  const now = Date.now();
  rows.filter(r => !r.timeIn).forEach(r => {
    const card = {
      id: r.id,
      animal: r.animal,
      category: r.category,
      kind: r.kind,
      batch: r.batch,
      emoji: emojiForRow_(r, idx),
      handler: r.person,
      outSince: fmtTime_(ss, r.timeOut),
      minutes: Math.max(1, Math.round((now - r.timeOut.getTime()) / 60000)),
      playmates: r.kind === 'Equipment' ? [] : playmatesFor_(rows, r, idx),
    };
    (r.person === person ? result.open : result.others).push(card);
  });
  return result;
}

/** Animals whose open interval overlapped this outing's interval. */
function playmatesFor_(rows, mine, idx) {
  const myStart = mine.timeOut.getTime();
  const myEnd = Date.now();
  const names = rows
    .filter(o => o.kind !== 'Equipment' &&
                 o.animal !== mine.animal &&
                 o.timeOut.getTime() < myEnd &&
                 (!o.timeIn || o.timeIn.getTime() > myStart))
    .map(o => emojiForRow_(o, idx) + ' ' + o.animal);
  return [...new Set(names)].sort();
}

/** Check in one or many open Log rows at once. Activities/playmates apply to
 *  the animals only; comments and the returner go on every row. */
function apiSubmitCheckin(logIds, payload, returnedBy) {
  const ids = [].concat(logIds || []).map(String).filter(Boolean);
  if (!ids.length) return { ok: false, message: 'Pick at least one thing to bring back.' };
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = ss_();
    const sh = ss.getSheetByName('Log');
    const rows = logRows_(ss);
  const idx = emojiIndex_(ss);
    const targets = ids.map(id => rows.find(r => r.id === id)).filter(Boolean);
    if (!targets.length) return { ok: false, message: 'Those outings were not found.' };
    const todo = targets.filter(r => !r.timeIn);
    if (!todo.length) {
      return { ok: false, message: targets.map(r => r.animal).join(', ') +
               (targets.length === 1 ? ' is' : ' are') + ' already back home.' };
    }
    const now = new Date();
    const acts = (payload && payload.activities || []).join(', ');
    const mates = (payload && payload.playmates || []).join(', ');
    const comments = String(payload && payload.comments || '').slice(0, 2000);
    const items = [];
    todo.forEach(row => {
      const minutes = Math.max(1, Math.round((now.getTime() - row.timeOut.getTime()) / 60000));
      const isGear = row.kind === 'Equipment';
      sh.getRange(row.row, 6, 1, 6).setValues([[
        now, minutes, isGear ? '' : acts, isGear ? '' : mates, comments, String(returnedBy || row.person)]]);
      items.push({ name: row.animal, kind: row.kind, minutes: minutes, emoji: emojiForRow_(row, idx) });
    });
    return { ok: true, items: items,
             // legacy single-item fields
             animal: items[0].name, minutes: items[0].minutes, emoji: items[0].emoji };
  } finally {
    lock.releaseLock();
  }
}

// ─── API: interactive dashboard ─────────────────────────────────
// One payload with roster + recent log; the Board page computes every
// view client-side so taps respond instantly with no extra round-trips.
function apiDashData() {
  const ss = ss_();
  const rows = logRows_(ss);
  const idx = emojiIndex_(ss);
  const now = new Date();
  const MAX = 800;
  const recent = rows.slice(-MAX);
  return {
    now: now.getTime(),
    dateLabel: Utilities.formatDate(now, tz_(ss), 'EEEE, MMMM d'),
    truncated: Math.max(0, rows.length - MAX),
    sheetUrl: ss.getUrl(),
    logUrl: ss.getUrl() + '#gid=' + ss.getSheetByName('Log').getSheetId(),
    dailyListUrl: DAILY_LIST_URL,
    warnMs: WARN_HOURS * 3600e3,
    lateMs: LATE_HOURS * 3600e3,
    animals: animals_(ss).map(a => ({
      name: a.name, category: a.category, cls: a.cls,
      emoji: emojiForAnimal_(a),
    })),
    gear: gear_(ss).map(g => ({
      name: g.name, category: g.category, emoji: emojiForGear_(g),
    })),
    people: activePeople_(ss),
    log: recent.map(r => ({
      id: r.id,
      out: r.timeOut.getTime(),
      inn: r.timeIn ? r.timeIn.getTime() : null,
      person: r.person,
      animal: r.animal,
      category: r.category,
      kind: r.kind,
      batch: r.batch,
      emoji: emojiForRow_(r, idx),
      minutes: r.minutes,
      acts: r.acts,
      mates: r.mates,
      comments: r.comments,
      returnedBy: r.returnedBy,
    })),
  };
}
