/* OFFICE – interaktive Montageanleitung
   Ablauf: Startseite (Produkt) → Variantenwahl (B2…C4, gerade/Ecke) → interaktive 3D-Anleitung.
   Das 3D-Modell wird aus der Variante parametrisch erzeugt. Maßeinheit: Meter; Wand in der x/y-Ebene, z zeigt zum Betrachter. */
(function () {
  'use strict';

const { PARTS, PART_ORDER, VARIANTS, PHASES, STEPS, GENERAL } = window.OFFICE;

// ================================================================ Sprache (je Marke: OFFICE de/en, FALLBROOK en/es)
// Die Inhalte sind deutsch hinterlegt; T() liefert die Übersetzung aus en.js / es.js (Schlüssel = deutscher Text).
// Fehlt eine spanische Übersetzung, gilt die englische.
const I18N = {
  en: { dict: window.I18N_EN, html: window.I18N_EN_HTML, general: window.I18N_EN_GENERAL },
  es: { dict: window.I18N_ES, html: window.I18N_ES_HTML, general: window.I18N_ES_GENERAL }
};
let LANG = null;
try { LANG = localStorage.getItem(BR.storageKey); } catch (e) { /* ohne Speicher */ }
if (!BR.langs.includes(LANG)) {
  const nav = (navigator.language || '').slice(0, 2).toLowerCase();
  LANG = BR.langs.includes(nav) ? nav : BR.langs[0];
}
// BR.text: markenspezifische Anpassung (FALLBROOK: CRL-Artikelnummern, Zoll, Produktname)
// Funktionen, die auf einer Seite ausgeblendet werden können (z. B. Kunden-Version: window.FEATURES = { cable: false })
const FEAT = Object.assign({ cable: true }, window.FEATURES || {});
if (!FEAT.cable) { const o = document.querySelector('#optCable'); if (o) o.remove(); }
const RT = BR.product.toLowerCase();   // Adresse: #/office/… bzw. #/fallbrook/…
const lookup = (l, s) => I18N[l] && I18N[l].dict && I18N[l].dict[s] != null ? I18N[l].dict[s] : null;
const T = s => {
  if (s == null || LANG === 'de') return BR.text(s);
  const v = lookup(LANG, s) ?? lookup('en', s);
  return BR.text(v ?? s);
};
const THtml = h => {
  if (LANG === 'de' || !h) return BR.text(h);
  let o = h; ((I18N[LANG] && I18N[LANG].html) || []).forEach(([a, b]) => { o = o.split(a).join(b); }); return BR.text(o);
};
// Sprachumschalter mit den Sprachen der Marke
const LANG_NAMES = { de: 'Deutsch', en: 'English', es: 'Español' };
document.querySelector('.lang-switch').innerHTML = BR.langs.map(l => `<button data-lang="${l}" title="${LANG_NAMES[l]}">${l.toUpperCase()}</button>`).join('');
function setLang(l) {
  LANG = l;
  try { localStorage.setItem(BR.storageKey, l); } catch (e) { /* ohne Speicher */ }
  document.documentElement.lang = l;
  // statische Texte der Seite (data-i18n = deutscher Originaltext)
  document.querySelectorAll('[data-i18n]').forEach(el => { el.innerHTML = T(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-title]').forEach(el => { el.title = T(el.dataset.i18nTitle); el.setAttribute('aria-label', T(el.dataset.i18nTitle)); });
  document.querySelectorAll('.lang-switch button').forEach(b => b.classList.toggle('active', b.dataset.lang === l));
}
// Marke: Titel und Logo bzw. Schriftzug
document.documentElement.dataset.brand = BR.id;
document.title = BR.title;
if (!BR.logo) { const lg = document.querySelector('.logo'); if (lg) lg.outerHTML = `<span class="wordmark">${BR.product}</span>`; }
// statische Texte merken, bevor sie übersetzt werden
document.querySelectorAll('.i18n').forEach(el => { if (!el.dataset.i18n) el.dataset.i18n = el.innerHTML.trim(); });
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const val = (v, cfg) => typeof v === 'function' ? v(cfg) : v;

  // ================================================================ Routing
  // #/                       Startseite
  // #/office?ecke=1          Variantenwahl
  // #/office/B4?ecke=1&glasstoss=1&toplight=1&swing=1&schritt=j   Anleitung
  // ccEdit: ＋/− zum Setzen der Kabelkanäle sichtbar – direkt nach dem Anwählen der Option oder nach Klick auf einen Kabelkanal
  const state = { cfg: null, sel: null, tab: 'steps', cornerPick: false, ccEdit: false };

  function route() {
    const h = location.hash.replace(/^#\/?/, '');
    const [path, query] = h.split('?');
    const parts = path.split('/').filter(Boolean);
    const q = new URLSearchParams(query || '');
    if (parts[0] !== RT && parts[0] !== 'office') return showStart();
    const code = (parts[1] || '').toUpperCase();
    if (!VARIANTS[code]) return showVariants(q.get('ecke') === '1');
    const v = VARIANTS[code];
    showGuide({
      code, type: v.type, door: v.door,
      corner: q.get('ecke') === '1',
      frameT: q.get('glasstoss') === '1',
      topLight: v.type === 'C' && q.get('toplight') === '1',
      // Top Light und Swing Door sind nicht kombinierbar – Top Light hat Vorrang
      swing: q.get('swing') === '1' && !(v.type === 'C' && q.get('toplight') === '1'),
      // Kabelkanal: Option + gewählte Positionen (L/R = links/rechts neben der Tür)
      cable: FEAT.cable && q.get('kabel') === '1',
      cc: (q.get('kk') || '').split(',').filter((p, i, a) => ['L', 'R'].includes(p) && a.indexOf(p) === i).sort()
    }, q.get('schritt'));
  }

  function guideHash(cfg, step) {
    const q = [];
    if (cfg.corner) q.push('ecke=1');
    if (cfg.frameT) q.push('glasstoss=1');
    if (cfg.topLight) q.push('toplight=1');
    if (cfg.swing) q.push('swing=1');
    if (cfg.cable) q.push('kabel=1');
    if (cfg.cc && cfg.cc.length) q.push('kk=' + cfg.cc.join(','));
    if (step) q.push('schritt=' + step);
    return '#/' + RT + '/' + cfg.code + (q.length ? '?' + q.join('&') : '');
  }

  // Adresse aktualisieren, ohne neu zu navigieren (in eingebetteten Ansichten ggf. nicht erlaubt – dann ignorieren)
  function quietHash(h) { try { history.replaceState(null, '', h); } catch (e) { /* ohne Adresszeile weiterarbeiten */ } }

  function setView(id) {
    ['view-start', 'view-variants', 'view-guide'].forEach(v => { $('#' + v).hidden = v !== id; });
    $('#guideControls').hidden = id !== 'view-guide';
    $('.brand').href = id === 'view-guide' ? '#/' + RT : '#/';
  }

// ================================================================ Sprachauswahl (klein auf der Startseite)
document.querySelectorAll('[data-lang]').forEach(b => b.addEventListener('click', () => {
  setLang(b.dataset.lang);
  rerender();
}));
// nach Sprachwechsel die aktuelle Ansicht neu aufbauen
function rerender() {
  if (!$('#view-guide').hidden && state.cfg) { buildHotspots(); renderPanel(); updateGuideTexts(state.cfg); }
  else route();
}

// ================================================================ Startseite
  function showStart() {
    setView('view-start');
    $('#crumb').textContent = T('Montageanleitungen');
    // Nur fertig ausgearbeitete Produkte
    $('#productTiles').innerHTML = `
      <a class="tile" href="#/${RT}">
        <div class="art">${variantSVG('B4', false)}</div>
        <div class="cap"><b>${BR.product}</b><span>${T('Glastrennwand-System · 6 Varianten')}</span></div>
      </a>`;
  }

  // ================================================================ Variantenwahl
  function showVariants(corner) {
    setView('view-variants');
    state.cornerPick = corner;
    $('#crumb').textContent = BR.product;
    document.querySelectorAll('#mountSeg button').forEach(b => b.classList.toggle('active', (b.dataset.corner === '1') === corner));
    $('#variantTiles').innerHTML = Object.keys(VARIANTS).map(code => `
      <a class="tile" href="#/${RT}/${code}${corner ? '?ecke=1' : ''}">
        <div class="art">${variantSVG(code, corner)}</div>
        <div class="cap"><b>${code}</b><span>${esc(T(VARIANTS[code].label))}</span></div>
      </a>`).join('');
  }
  document.querySelectorAll('#mountSeg button').forEach(b => b.addEventListener('click', () => {
    location.hash = '#/' + RT + (b.dataset.corner === '1' ? '?ecke=1' : '');
  }));

  // Schlichte Ansichtszeichnung einer Variante (Front, optional mit Rückwand der Ecklösung)
  function variantSVG(code, corner) {
    const v = VARIANTS[code];
    const top = 12, bot = 138, Hh = bot - top;
    const PW = 62, DW = 50, R = 34, skew = 16;
    const segs = v.door === 'L' ? ['d', 'p'] : v.door === 'R' ? ['p', 'd'] : ['p', 'd', 'p'];
    const W = segs.reduce((a, s) => a + (s === 'd' ? DW : PW), 0);
    const cornerSide = corner ? (v.door === 'L' ? 'R' : 'L') : null;
    const total = W + (corner ? R : 0);
    let x0 = (220 - total) / 2 + (cornerSide === 'L' ? R : 0);
    const doorTop = v.type === 'B' ? top + Hh * (1 - 2.15 / 2.7) : top + 3;
    const hingeRight = v.door !== 'L';
    let out = '';
    // Rückwand (Ecklösung) als zurückweichende Fläche
    if (cornerSide) {
      const xe = cornerSide === 'L' ? x0 : x0 + W;
      const dx = cornerSide === 'L' ? -R : R;
      out += `<polygon points="${xe},${top} ${xe + dx},${top - skew} ${xe + dx},${bot - skew} ${xe},${bot}" fill="#e3e6e7" stroke="#000" stroke-width="1.5"/>`;
    }
    let x = x0;
    segs.forEach(s => {
      const w = s === 'd' ? DW : PW;
      if (s === 'p') {
        out += `<rect x="${x}" y="${top}" width="${w}" height="${Hh}" fill="#eef2f3" stroke="#000" stroke-width="1.5"/>`;
      } else {
        if (v.type === 'B') out += `<rect x="${x}" y="${top}" width="${w}" height="${doorTop - top}" fill="#eef2f3" stroke="#000" stroke-width="1.5"/>`;
        out += `<rect x="${x}" y="${doorTop}" width="${w}" height="${bot - doorTop}" fill="#fff" stroke="#000" stroke-width="3"/>`;
        out += `<rect x="${x + 4}" y="${doorTop + 4}" width="${w - 8}" height="${bot - doorTop - 5}" fill="#dfe6e8" stroke="#000" stroke-width=".8"/>`;
        const hx = hingeRight ? x + w - 6 : x + 3;
        const hs = v.type === 'C' ? [doorTop + 14, (doorTop + bot) / 2, bot - 16] : [doorTop + 14, bot - 16];
        hs.forEach(y => { out += `<rect x="${hx}" y="${y - 4}" width="3" height="8" fill="#000"/>`; });
        const lx = hingeRight ? x + 8 : x + w - 14;
        out += `<line x1="${lx}" y1="${bot - 50}" x2="${lx + 6}" y2="${bot - 50}" stroke="#000" stroke-width="2"/>`;
      }
      x += w;
    });
    out += `<rect x="${x0}" y="${top}" width="${W}" height="${Hh}" fill="none" stroke="#000" stroke-width="3"/>`;
    return `<svg viewBox="0 0 220 150" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Variante ${code}">${out}</svg>`;
  }

  // ================================================================ 3D-Szene
  const canvas = $('#c');
  const stage = $('#stage');
  let sun, renderer, scene, camera, controls, model = null, anchors = {}, pickables = [], homeView = null;

  const M = {};
  function initScene() {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf4f4f1);
    camera = new THREE.PerspectiveCamera(40, 1, 0.02, 100);
    controls = new THREE.OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 0.25;
    controls.maxDistance = 14;
    controls.maxPolarAngle = Math.PI * 0.95;
    controls.addEventListener('start', () => { anim = null; setTimeout(hideHint, 2500); });

    scene.add(new THREE.HemisphereLight(0xffffff, 0xc4c4bc, 0.9));
    // Schattenlicht fast senkrecht von oben: der Schatten liegt genau unter den Profilen (Grundriss),
    // statt schräg durch Wände und hinter die Ecke zu fallen. Folgt dem Modell (siehe buildModel).
    sun = new THREE.DirectionalLight(0xffffff, 0.6);
    sun.position.set(0.6, 12, 1.4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.radius = 4;
    sun.shadow.bias = -0.0005;
    Object.assign(sun.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 1, far: 30 });
    scene.add(sun.target);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xffffff, 0.35);
    fill.position.set(4, 3, -4);
    scene.add(fill);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), new THREE.ShadowMaterial({ opacity: 0.12 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    const grid = new THREE.GridHelper(16, 32, 0xe2e2dc, 0xe9e9e4);
    grid.position.y = 0.001;
    scene.add(grid);

    Object.assign(M, {
      alu: new THREE.MeshStandardMaterial({ color: 0xb3b7bc, metalness: 0.1, roughness: 0.55 }),
      gasket: new THREE.MeshStandardMaterial({ color: 0x2a2b2d, roughness: 0.8 }),
      glass: new THREE.MeshPhysicalMaterial({ color: 0xc5dfe4, transparent: true, opacity: 0.22, roughness: 0.05, depthWrite: false, side: THREE.DoubleSide }),
      steel: new THREE.MeshStandardMaterial({ color: 0xd0d3d6, metalness: 0.2, roughness: 0.35 }),
      hw: new THREE.MeshStandardMaterial({ color: 0xc8ccd1, metalness: 0.55, roughness: 0.32 }),
      hwDark: new THREE.MeshStandardMaterial({ color: 0x2a2b2d, roughness: 0.6 }),
      wood: new THREE.MeshStandardMaterial({ color: 0x8a6a4a, roughness: 0.9 }),
      wall: new THREE.MeshStandardMaterial({ color: 0xebe9e4, transparent: true, opacity: 0.35, roughness: 1, depthWrite: false }),
      edge: new THREE.LineBasicMaterial({ color: 0x33363b }),
      edgeGlass: new THREE.LineBasicMaterial({ color: 0x6f9aa3, transparent: true, opacity: 0.7 }),
      edgeWall: new THREE.LineBasicMaterial({ color: 0xc9c6bf }),
      edgeHl: new THREE.LineBasicMaterial({ color: BR.hl3d ? BR.hl3d.edge : 0x000000 }),
      hl: new THREE.MeshStandardMaterial({ color: BR.hl3d ? BR.hl3d.mesh : 0x1a1a1a, metalness: 0.1, roughness: 0.5 }),
      hlGlass: new THREE.MeshPhysicalMaterial({ color: BR.hl3d ? BR.hl3d.mesh : 0x555555, transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide }),
      marker: new THREE.MeshBasicMaterial({ color: BR.hl3d ? BR.hl3d.mesh : 0x000000, transparent: true, opacity: 0.15, depthWrite: false })
    });

    // Klick auf ein Bauteil → passender Montageschritt
    const ray = new THREE.Raycaster();
    let down = null;
    canvas.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY }; });
    canvas.addEventListener('pointerup', e => {
      if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5) return;
      const r = canvas.getBoundingClientRect();
      ray.setFromCamera({ x: ((e.clientX - r.left) / r.width) * 2 - 1, y: -((e.clientY - r.top) / r.height) * 2 + 1 }, camera);
      const hits = ray.intersectObjects(pickables, false);
      const hit = hits.find(h => h.object.userData.base !== M.glass) || hits[0];
      if (!hit) return;
      if (hit.object.userData.tags.includes('cc')) { setCcEdit(true); return; }
      const cand = activeSteps().filter(s => (s.hl || []).some(t => hit.object.userData.tags.includes(t)) && s.spots);
      setCcEdit(false);
      if (!cand.length) return;
      const i = cand.findIndex(s => s.id === state.sel);
      select(cand[(i + 1) % cand.length].id);
    });

    window.addEventListener('resize', resize);
    new ResizeObserver(resize).observe(stage);
    requestAnimationFrame(loop);
  }

  // Profilmaße (vereinfacht, für die Sichtbarkeit leicht verbreitert)
  const F = 0.032, FD = 0.034, DF = 0.048, DD = 0.05, GT = 0.01;
  const H = 2.70, PW = 0.95, DW = 0.90, HD = 2.15, R = 0.8, TL_BOTTOM = 2.17;
  const CCW = 0.08, CCD = DD;      // Kabelkanal CC 80: 80 mm breit, Tiefe bündig mit dem Türzargenprofil (48 mm)

  function box(group, x0, y0, z0, x1, y1, z1, mat, tags = []) {
    const g = new THREE.BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0));
    const m = new THREE.Mesh(g, mat);
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    m.userData = { tags, base: mat };
    if (mat !== M.glass && mat !== M.wall) { m.castShadow = true; m.receiveShadow = true; }
    const em = mat === M.glass ? M.edgeGlass : mat === M.wall ? M.edgeWall : M.edge;
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(g), em);
    edges.userData.base = em;
    m.add(edges);
    group.add(m);
    if (tags.length) pickables.push(m);
    return m;
  }

function addMesh(group, geo, mat, tags, pos, rot) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(...pos);
  if (rot) m.rotation.set(...rot);
  m.userData = { tags, base: mat };
  m.castShadow = true; m.receiveShadow = true;
  const em = M.edge;
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 35), em);
  edges.userData.base = em;
  m.add(edges);
  group.add(m);
  if (tags.length) pickables.push(m);
  return m;
}
// Platte mit abgerundeten Ecken (w × h in der x/y-Ebene, Dicke d in z), Mittelpunkt bei pos
function roundPlate(group, w, h, d, r, mat, tags, pos) {
  const sh = new THREE.Shape(), x = -w / 2, y = -h / 2;
  sh.moveTo(x + r, y); sh.lineTo(x + w - r, y); sh.quadraticCurveTo(x + w, y, x + w, y + r);
  sh.lineTo(x + w, y + h - r); sh.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  sh.lineTo(x + r, y + h); sh.quadraticCurveTo(x, y + h, x, y + h - r);
  sh.lineTo(x, y + r); sh.quadraticCurveTo(x, y, x + r, y);
  const geo = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: true, bevelThickness: d * 0.25, bevelSize: Math.min(r, d) * 0.4, bevelSegments: 2, curveSegments: 6 });
  geo.translate(0, 0, -d / 2);
  return addMesh(group, geo, mat, tags, pos);
}
// Zylinder entlang x, y oder z
function cyl(group, r, len, axis, mat, tags, pos) {
  const geo = new THREE.CylinderGeometry(r, r, len, 24);
  const rot = axis === 'x' ? [0, 0, Math.PI / 2] : axis === 'z' ? [Math.PI / 2, 0, 0] : null;
  return addMesh(group, geo, mat, tags, pos, rot);
}

  function buildModel(cfg) {
    if (model) {
      scene.remove(model);
      model.traverse(o => o.geometry && o.geometry.dispose());
    }
    pickables = [];
    const g = new THREE.Group();
    const A = { H: [], I: [], J: [], K: [], L: [], M: [], N: [], glass: [], over: [], blocks: [], frameT: [], hinge: [], strike: [], handle: [], notch: [], door: [], transom: [], tlCarrier: [], sd: [], frameMid: [], cc: [], ccSlots: [] };
    const zf = 0.03; // Anker leicht vor der Wandebene

    const ccL = cfg.cable && cfg.cc.includes('L'), ccR = cfg.cable && cfg.cc.includes('R');
    const segs = [];
    (cfg.door === 'L' ? ['door', 'panel'] : cfg.door === 'R' ? ['panel', 'door'] : ['panel', 'door', 'panel'])
      .forEach(t => { if (t === 'door' && ccL) segs.push('cc'); segs.push(t); if (t === 'door' && ccR) segs.push('cc'); });
    let x = 0;
    const S = segs.map(t => { const w = t === 'door' ? DW + 2 * DF : t === 'cc' ? CCW : PW; const s = { t, x0: x, x1: x + w }; x += w; return s; });
    const W = x;
    const cornerSide = cfg.corner ? (cfg.door === 'L' ? 'R' : 'L') : null;
    const wallL = cornerSide !== 'L', wallR = cornerSide !== 'R';
    const hingeRight = cfg.door !== 'L';
    const isB = cfg.type === 'B';

    // Wände (angedeutet)
    if (wallL) box(g, -0.12, 0, -0.5, 0, H, 0.5, M.wall);
    if (wallR) box(g, W, 0, -0.5, W + 0.12, H, 0.5, M.wall);

    // Deckenprofil (4): B durchgehend, C nur über den Seitenteilen
    if (isB) box(g, 0, H - F, -FD / 2, W, H, FD / 2, M.alu, ['p4']);

    const panels = S.filter(s => s.t === 'panel');
    panels.forEach((p, pi) => {
      const atWallL = p.x0 === 0 && wallL, atWallR = p.x1 === W && wallR;
      box(g, p.x0, 0, -FD / 2, p.x1, F, FD / 2, M.alu, ['p2floor']);
      if (!isB) box(g, p.x0, H - F, -FD / 2, p.x1, H, FD / 2, M.alu, ['p4']);
      if (atWallL) { box(g, 0, F, -FD / 2, F, H - F, FD / 2, M.alu, ['p2wall']); A.H.push([F / 2, 0.02, zf]); A.J.push([F / 2, H - 0.02, zf]); }
      if (atWallR) { box(g, W - F, F, -FD / 2, W, H - F, FD / 2, M.alu, ['p2wall']); A.H.push([W - F / 2, 0.02, zf]); A.J.push([W - F / 2, H - 0.02, zf]); }
      const gx0 = p.x0 + (p.x0 === 0 ? F * 0.5 : 0.015), gx1 = p.x1 - (p.x1 === W ? F * 0.5 : 0.015);
      // Mit Glasstoß wird das Seitenteilglas geteilt: links und rechts vom Glasstoßprofil je eine Scheibe
      if (cfg.frameT && pi === 0) {
        const mx = (p.x0 + p.x1) / 2, gap = 0.0105;
        box(g, gx0, F, -GT / 2, mx - gap, H - F, GT / 2, M.glass, ['glass']);
        box(g, mx + gap, F, -GT / 2, gx1, H - F, GT / 2, M.glass, ['glass']);
      } else {
        box(g, gx0, F, -GT / 2, gx1, H - F, GT / 2, M.glass, ['glass']);
      }
      A.glass.push([(p.x0 + p.x1) / 2, 1.35, zf]);
      [p.x0 + 0.12, p.x1 - 0.12].forEach(bx => { box(g, bx - 0.04, F - 0.006, -0.01, bx + 0.04, F - 0.001, 0.01, M.wood, ['blocks']); A.blocks.push([bx, F, zf]); });
      if (cfg.frameT && pi === 0) {
        const mx = (p.x0 + p.x1) / 2;
        box(g, mx - 0.024, F, -FD / 2, mx + 0.024, H - F, FD / 2, M.alu, ['frameT']);
        A.frameT.push([mx, 1.35, zf]);
      }
    });

    // Türsegment
    const d = S.find(s => s.t === 'door');
    const fTop = isB ? HD + DF : H;                       // Oberkante Türrahmen
    const innerTop = isB ? HD : H - DF;                   // Unterkante waagrechter Türrahmen
    box(g, d.x0, 0, -DD / 2, d.x0 + DF, fTop, DD / 2, M.alu, ['p1']);
    box(g, d.x1 - DF, 0, -DD / 2, d.x1, fTop, DD / 2, M.alu, ['p1']);
    box(g, d.x0, innerTop, -DD / 2, d.x1, fTop, DD / 2, M.alu, ['p1']);
    const di = S.indexOf(d), panelL = S[di - 1] && S[di - 1].t === 'panel', panelR = S[di + 1] && S[di + 1].t === 'panel';
    const panelSides = [];                                // Türrahmenseiten, an die ein Seitenteil grenzt
    if (panelL) panelSides.push(d.x0 + DF / 2);
    if (panelR) panelSides.push(d.x1 - DF / 2);
    const wallSideX = cfg.door === 'M' ? null : (hingeRight ? d.x1 - DF / 2 : d.x0 + DF / 2);
    panelSides.forEach(px => A.I.push([px, 0.02, zf]));

    if (isB) {
      // Oberlicht über der Tür + bei Tür an der Wand senkrechtes Fixrahmenprofil bis zur Decke
      let ox0 = d.x0, ox1 = d.x1;
      if (wallSideX !== null) {
        const wx0 = hingeRight ? d.x1 - F : d.x0, wx1 = hingeRight ? d.x1 : d.x0 + F;
        box(g, wx0, fTop, -FD / 2, wx1, H - F, FD / 2, M.alu, ['p2wall']);
        A.N.push([wallSideX, innerTop + DF / 2, zf]);
        A.J.push([(wx0 + wx1) / 2, H - 0.02, zf]);
        if (hingeRight) ox1 = d.x1 - F * 0.5; else ox0 = d.x0 + F * 0.5;
      }
      // Mit Glasstoß: Oberlichtglas endet am Glasstoßprofil zum Seitenteil
      if (cfg.frameT) { if (panelL) ox0 = d.x0 + DF / 2 + 0.0105; if (panelR) ox1 = d.x1 - DF / 2 - 0.0105; }
      box(g, ox0, fTop, -GT / 2, ox1, H - F, GT / 2, M.glass, ['over']);
      A.over.push([(d.x0 + d.x1) / 2, (fTop + H) / 2, zf]);
      // Option Glasstoß: auch dort, wo Oberlichtglas und Seitenteilglas wirklich aneinanderstoßen
      if (cfg.frameT) {
        [panelL ? d.x0 + DF / 2 : null, panelR ? d.x1 - DF / 2 : null].filter(x => x !== null).forEach(jx => {
          box(g, jx - DF / 2, fTop, -FD / 2, jx + DF / 2, H - F, FD / 2, M.alu, ['frameT']);
          A.frameT.push([jx, (fTop + H - F) / 2, zf]);
        });
      }
      panelSides.forEach(px => A.K.push([px, innerTop + DF / 2, zf]));
    } else {
      panelSides.forEach(px => A.L.push([px, H - DF / 2, zf]));
      if (wallSideX !== null) A.K.push([wallSideX, H - DF / 2, zf]);
    }

    // Top Light (nur C): Oberlichtglas im Türrahmen
    let leafTop = isB ? HD - 0.006 : H - DF - 0.006;
    if (!isB && cfg.topLight) {
      box(g, d.x0 + DF - 0.004, TL_BOTTOM + 0.012, -GT / 2, d.x1 - DF + 0.004, innerTop, GT / 2, M.glass, ['transom']);
      [d.x0 + DF, d.x1 - DF - 0.03].forEach(cx => box(g, cx, TL_BOTTOM, -0.012, cx + 0.03, TL_BOTTOM + 0.012, 0.012, M.steel, ['tl']));
      A.transom.push([(d.x0 + d.x1) / 2, (TL_BOTTOM + innerTop) / 2, zf]);
      A.tlCarrier.push([d.x0 + DF + 0.015, TL_BOTTOM + 0.006, zf], [d.x1 - DF - 0.015, TL_BOTTOM + 0.006, zf]);
      leafTop = TL_BOTTOM - 0.005;
    }

    // Zargendichtung (8) bzw. Swingdoor-Clip an der Türseite der Rahmenprofile
    const gTop = (!isB && cfg.topLight) ? TL_BOTTOM : innerTop;
    box(g, d.x0 + DF, 0, -0.012, d.x0 + DF + 0.006, gTop, 0.012, M.gasket, ['g8']);
    box(g, d.x1 - DF - 0.006, 0, -0.012, d.x1 - DF, gTop, 0.012, M.gasket, ['g8']);
    box(g, d.x0 + DF, gTop - 0.006, -0.012, d.x1 - DF, gTop, 0.012, M.gasket, ['g8']);
    const hingeFrameX = hingeRight ? d.x1 - DF / 2 : d.x0 + DF / 2;
    const lockFrameX = hingeRight ? d.x0 + DF / 2 : d.x1 - DF / 2;
    A.frameMid.push([hingeFrameX, 1.4, zf]);

    // Türblatt
    const leafW = (d.x1 - d.x0) - 2 * DF - 0.012;
    const dir = hingeRight ? -1 : 1;                     // Richtung vom Band zum Schloss
    const pivot = new THREE.Group();
    const pivotX = hingeRight ? d.x1 - DF - 0.006 : d.x0 + DF + 0.006;
    pivot.position.set(pivotX + (cfg.swing ? dir * 0.05 : 0), 0, cfg.swing ? 0 : 0.02);
    const ang = THREE.MathUtils.degToRad(cfg.swing ? 22 : 32);
    pivot.rotation.y = hingeRight ? ang : -ang;
    g.add(pivot);
    const off = cfg.swing ? -0.05 : 0;
    const lx0 = dir < 0 ? -leafW - off : off, lx1 = dir < 0 ? -off : leafW + off;
    box(pivot, Math.min(lx0, lx1), 0.012, -GT / 2, Math.max(lx0, lx1), leafTop, GT / 2, M.glass, ['door']);
    const lockLocal = cfg.swing ? dir * (leafW - 0.07) : dir * (leafW - 0.122);
    if (cfg.swing) {
      box(pivot, lockLocal - 0.008, 0.75, 0.02, lockLocal + 0.008, 1.55, 0.035, M.steel, ['handle']);
      box(pivot, lockLocal - 0.008, 0.75, -0.035, lockLocal + 0.008, 1.55, -0.02, M.steel, ['handle']);
    } else {
      // WSS Studio Alea: Schlosskasten auf beiden Glasseiten (150 × 55 mm), Drückerrosette + Schlüsselloch, L-Drücker
      const LY = 1.02, lockC = dir * (leafW - 0.075), roseX = dir * (leafW - 0.122), keyX = dir * (leafW - 0.06);
      [-1, 1].forEach(sd => {
        roundPlate(pivot, 0.15, 0.055, 0.009, 0.006, M.hw, ['handle'], [lockC, LY, sd * (GT / 2 + 0.0045)]);
        const zf0 = sd * (GT / 2 + 0.0115);   // Außenfläche des Schlosskastens
        // Schlüsselloch (Profilzylinder angedeutet)
        box(pivot, keyX - 0.007, LY - 0.011, zf0 - sd * 0.001, keyX + 0.007, LY + 0.011, zf0 + sd * 0.0012, M.hwDark, ['handle']);
        // Rosette und Drücker: Hals senkrecht zum Glas, Griff parallel zum Glas Richtung Band
        cyl(pivot, 0.012, 0.012, 'z', M.hw, ['handle'], [roseX, LY, zf0 + sd * 0.006]);
        cyl(pivot, 0.0095, 0.05, 'z', M.hw, ['handle'], [roseX, LY, zf0 + sd * 0.025]);
        cyl(pivot, 0.0095, 0.135, 'x', M.hw, ['handle'], [roseX - dir * 0.0675, LY, zf0 + sd * 0.045]);
      });
    }
    pivot.updateMatrixWorld(true);
    const wp = (lx, y) => new THREE.Vector3(lx, y, 0).applyMatrix4(pivot.matrixWorld).toArray();
    A.handle.push(wp(lockLocal, cfg.swing ? 1.05 : 1.02));
    A.door.push(wp(dir * leafW / 2, 1.2));

    if (cfg.swing) {
      // Pendeltür-Block oben im Türrahmen + Bodenlager
      const bx0 = hingeRight ? d.x1 - DF - 0.2 : d.x0 + DF, bx1 = bx0 + 0.2;
      box(g, bx0, innerTop - 0.03, -0.02, bx1, innerTop, 0.02, M.gasket, ['sd']);
      box(g, bx0, 0, -0.02, bx1, 0.03, 0.02, M.gasket, ['sd']);
      A.sd.push([(bx0 + bx1) / 2, innerTop - 0.015, zf]);
    } else {
      const n = leafTop > 2.4 ? 3 : 2;
      const ys = n === 3 ? [0.28, leafTop / 2, leafTop - 0.28] : [0.28, leafTop - 0.28];
      ys.forEach(y => {
        // Rahmenwinkel auf der Innenseite der Türzarge
        const fx = hingeRight ? d.x1 - DF : d.x0 + DF;
        box(g, hingeRight ? fx - 0.004 : fx, y - 0.045, -0.018, hingeRight ? fx : fx + 0.004, y + 0.045, 0.022, M.hw, ['hinge']);
        // Bandrolle an der Drehachse und Glasklemmplatten (60 × 90 mm) auf beiden Glasseiten
        cyl(pivot, 0.0135, 0.09, 'y', M.hw, ['hinge'], [-dir * 0.002, y, GT / 2 + 0.009]);
        [-1, 1].forEach(sd => roundPlate(pivot, 0.06, 0.09, 0.008, 0.006, M.hw, ['hinge'], [dir * 0.042, y, sd * (GT / 2 + 0.004)]));
        A.hinge.push([hingeFrameX, y, zf]);
      });
      A.notch.push([hingeFrameX, (ys[0] + ys[1]) / 2, zf]);
      const sx = hingeRight ? d.x0 + DF : d.x1 - DF - 0.008;
      box(g, sx, 1.0, -0.02, sx + 0.008, 1.1, 0.02, M.steel, ['strike']);
      A.strike.push([lockFrameX, 1.05, zf]);
    }

    // Kabelkanal: senkrecht neben der Türzarge vom Boden bis zur Decke (Unterteil + Deckel)
    S.filter(sg => sg.t === 'cc').forEach(sg => {
      const top = isB ? H - F : H;
      box(g, sg.x0, 0, -CCD / 2, sg.x1, top, CCD / 2, M.alu, ['cc']);
      box(g, sg.x0 + 0.012, 0.003, CCD / 2 - 0.002, sg.x1 - 0.012, top - 0.003, CCD / 2 + 0.0004, M.steel, ['cc']);   // Deckel bündig eingelegt
      A.cc.push([(sg.x0 + sg.x1) / 2, 1.2, zf]);
    });
    // mögliche Positionen zum Setzen/Entfernen im 3D-Modell
    if (cfg.cable) {
      const sL = S[di - 1], sR = S[di + 1];
      A.ccSlots.push({ side: 'L', on: ccL, pos: [ccL ? (sL.x0 + sL.x1) / 2 : d.x0 - 0.03, 1.55, zf + 0.03] });
      A.ccSlots.push({ side: 'R', on: ccR, pos: [ccR ? (sR.x0 + sR.x1) / 2 : d.x1 + 0.03, 1.55, zf + 0.03] });
    }

    // Ecklösung: Rückwand entlang -z am Ende ohne Tür
    if (cornerSide) {
      const xe = cornerSide === 'L' ? 0 : W;
      const s = cornerSide === 'L' ? 1 : -1;           // Innenseite der Ecke
      box(g, xe - FD / 2 + s * FD / 2, 0, -R, xe + FD / 2 + s * FD / 2, F, 0, M.alu, ['p2floor']);
      box(g, xe - FD / 2 + s * FD / 2, H - F, -R, xe + FD / 2 + s * FD / 2, H, 0, M.alu, ['p4']);
      box(g, xe - FD / 2 + s * FD / 2, F, -R, xe + FD / 2 + s * FD / 2, H - F, -R + F, M.alu, ['p2wall']);
      box(g, xe + s * FD / 2 - GT / 2, F, -R + F * 0.5, xe + s * FD / 2 + GT / 2, H - F, -0.015, M.glass, ['glass']);
      box(g, xe - 0.6, 0, -R - 0.12, xe + 0.6, H, -R, M.wall);
      A.M.push([xe, 0.02, 0], [xe, H - 0.02, 0]);
      A.H.push([xe + s * FD / 2, 0.02, -R + F / 2]);
      A.J.push([xe + s * FD / 2, H - 0.02, -R + F / 2]);
      A.glass.push([xe - s * 0.03, 1.35, -R / 2]);
      [-0.12, -R + 0.12].forEach(bz => { box(g, xe + s * FD / 2 - 0.01, F - 0.006, bz - 0.04, xe + s * FD / 2 + 0.01, F - 0.001, bz + 0.04, M.wood, ['blocks']); A.blocks.push([xe - s * 0.03, F, bz]); });
    }

    scene.add(g);
    model = g;
    // Schattenlicht über der Mitte des Modells ausrichten
    const mid = new THREE.Vector3(W / 2, 0, cornerSide ? -R / 2 : 0);
    sun.target.position.copy(mid);
    sun.position.copy(mid).add(new THREE.Vector3(0.6, 12, 1.4));
    anchors = A;

    const side = cornerSide === 'R' ? 1 : -1;
    const c = new THREE.Vector3(W / 2, 1.3, cornerSide ? -0.25 : 0);
    homeView = {
      target: c,
      dir: new THREE.Vector3(side * 0.42, 0.22, 1).normalize(),   // Blickrichtung leicht seitlich von vorne
      size: { w: W + (cornerSide ? 0.5 : 0.25), h: H },
      W, cornerSide
    };
  }

  // Startansicht: Kameraabstand so wählen, dass das Modell die Fläche gut ausfüllt
  function homePos() {
    const vf = THREE.MathUtils.degToRad(camera.fov) / 2;
    const hf = Math.atan(Math.tan(vf) * camera.aspect);
    const d = Math.max((homeView.size.h / 2) / Math.tan(vf), (homeView.size.w / 2) / Math.tan(hf)) * 1.32;
    return homeView.target.clone().add(homeView.dir.clone().multiplyScalar(d));
  }

  // ================================================================ Kamera
  let anim = null;
  function flyTo(pos, target, ms = 850) {
    anim = { p0: camera.position.clone(), t0: controls.target.clone(), p1: pos.clone(), t1: target.clone(), start: performance.now(), ms };
  }
  function flyHome(instant) {
    if (instant) { camera.position.copy(homePos()); controls.target.copy(homeView.target); controls.update(); }
    else flyTo(homePos(), homeView.target);
  }
  function spotsOf(step) {
    return (step.spots || []).flatMap(k => anchors[k] || []);
  }
  function flyToStep(step) {
    const pts = spotsOf(step);
    if (step.view === 'overview' || !pts.length) return flyHome();
    const vs = pts.map(p => new THREE.Vector3(...p));
    const t = (step.view === 'detail' ? [vs[0]] : vs).reduce((a, p) => a.add(p), new THREE.Vector3()).divideScalar(step.view === 'detail' ? 1 : vs.length);
    const spread = Math.max(0, ...vs.map(p => p.distanceTo(t)));
    const dist = Math.max(step.view === 'detail' ? 1.1 : 2.0, step.view === 'detail' ? 0 : spread * 2.4);
    let dir = new THREE.Vector3(0.45, 0.3, 1);
    if (t.x > homeView.W - 0.3) dir.x = -0.5;
    if (t.x < 0.3) dir.x = 0.5;
    if (t.z < -0.1) dir = new THREE.Vector3(homeView.cornerSide === 'R' ? 1 : -1, 0.4, 0.6);
    if (t.y > 2.3) dir.y = -0.15;
    if (t.y < 0.2) dir.y = 0.6;
    dir.normalize().multiplyScalar(dist);
    flyTo(t.clone().add(dir), t);
  }

  // ================================================================ Hotspots (Schrittnummern)
  const hsLayer = $('#hotspots');
  let hsEls = [];
  function buildHotspots() {
    hsLayer.innerHTML = '';
    hsEls = [];
    activeSteps().forEach((step, i) => {
      if (step.view === 'overview') return;
      spotsOf(step).slice(0, step.spotLimit || undefined).forEach(p => {
        const el = document.createElement('button');
        el.className = 'hs' + (step.option ? ' optional' : '');
        el.innerHTML = `<span class="lbl">${i + 1}</span>`;
        el.title = `${i + 1}. ${T(val(step.title, state.cfg))}`;
        el.setAttribute('aria-label', el.title);
        el.addEventListener('click', e => { e.stopPropagation(); setCcEdit(false); select(step.id); });
        hsLayer.appendChild(el);
        hsEls.push({ el, id: step.id, pos: new THREE.Vector3(...p) });
      });
    });
    const ccShow = state.ccEdit || !(state.cfg && state.cfg.cc.length);
    (ccShow && anchors && anchors.ccSlots || []).forEach(sl => {
      const el = document.createElement('button');
      el.className = 'cc-slot' + (sl.on ? ' on' : '');
      el.textContent = sl.on ? '−' : '＋';
      el.title = T(sl.on ? 'Kabelkanal entfernen' : 'Kabelkanal hier setzen');
      el.setAttribute('aria-label', el.title);
      el.addEventListener('click', e => {
        e.stopPropagation();
        const cc = sl.on ? state.cfg.cc.filter(p => p !== sl.side) : state.cfg.cc.concat(sl.side);
        location.hash = guideHash(Object.assign({}, state.cfg, { cc }), state.sel);
      });
      hsLayer.appendChild(el);
      hsEls.push({ el, id: 'cc-slot', pos: new THREE.Vector3(...sl.pos) });
    });
    updateHotspotClasses();
  }
  function setCcEdit(on) { if (state.ccEdit !== on) { state.ccEdit = on; buildHotspots(); } }
  function updateHotspotClasses() {
    hsEls.forEach(h => {
      if (h.id === 'cc-slot') return;
      h.el.classList.toggle('active', h.id === state.sel);
      h.el.classList.toggle('dim', !!state.sel && h.id !== state.sel);
    });
  }
  const pv = new THREE.Vector3();
  function positionHotspots() {
    const w = stage.clientWidth, h = stage.clientHeight;
    hsEls.forEach(hs => {
      pv.copy(hs.pos).project(camera);
      // Bei sehr kleiner 3D-Ansicht (Anleitung groß aufgezogen) nur die Punkte des aktuellen Schritts zeigen
      const compact = h < 300;
      const vis = pv.z < 1 && Math.abs(pv.x) < 1.2 && Math.abs(pv.y) < 1.2 && (!compact || hs.id === state.sel || hs.id === 'cc-slot');
      hs.el.style.display = vis ? '' : 'none';
      if (vis) hs.el.style.transform = `translate(${(pv.x + 1) / 2 * w}px, ${(1 - pv.y) / 2 * h}px)`;
    });
  }

  // ================================================================ Hervorheben
  function applyHighlight() {
    if (!model) return;
    const step = state.sel && STEPS.find(s => s.id === state.sel);
    const hl = step ? (step.hl || []) : [];
    model.traverse(o => {
      if (!o.isMesh || !o.userData.base) return;
      const base = o.userData.base;
      const on = hl.length && (o.userData.tags || []).some(t => hl.includes(t));
      o.material = on ? (base === M.glass ? M.hlGlass : M.hl) : base;
      const edge = o.children.find(c => c.isLineSegments);
      if (edge) edge.material = on && base !== M.glass ? M.edgeHl : edge.userData.base;
    });
    model.children.filter(c => c.userData.marker).forEach(c => model.remove(c));
    if (step && step.view === 'detail') {
      spotsOf(step).forEach(p => {
        const m = new THREE.Mesh(new THREE.SphereGeometry(0.06, 24, 16), M.marker);
        m.position.set(p[0], p[1], 0);
        m.userData.marker = true;
        model.add(m);
      });
    }
  }

  // ================================================================ Anleitung
  function activeSteps() {
    return state.cfg ? STEPS.filter(s => !s.cond || s.cond(state.cfg)) : [];
  }
  // Positionsnummer → Bauteil (für Tooltips an den Nummern in den Zeichnungen)
  const POS = {};
  Object.keys(PARTS).forEach(k => { const n = PARTS[k].pos || (/^\d+$/.test(k) ? +k : null); if (n) POS[n] = PARTS[k]; });
  const posTitle = n => String(n).split('/').map(x => POS[x] ? `${x} = ${T(POS[x].name)}` : x).join(' · ');

  // Zeichnung mit eigener Beschriftung: Positionsnummern, Führungslinien, Hinweise, Richtig/Falsch.
  // src kann mit „#flip“ enden: Zeichnung gespiegelt (passend zur Türseite der gewählten Variante).
  function figHTML(src, lightbox, maxH) {
    const flip = /#flip$/.test(src);
    const file = src.replace(/#flip$/, '');
    const id = file.split('/').pop().replace(/\.\w+$/, '');
    const F = window.FIGS && window.FIGS[id];
    if (!F) return `<img src="${file}" alt="" loading="lazy">`;
    const X = x => flip ? F.w - x : x;
    const at = p => `left:${(X(p[0]) / F.w * 100).toFixed(2)}%;top:${(p[1] / F.h * 100).toFixed(2)}%`;
    const lines = F.labels.flatMap(l => l.to.map(t => `<line x1="${X(l.at[0])}" y1="${l.at[1]}" x2="${X(t[0])}" y2="${t[1]}"/>`)).join('');
    const dots = F.labels.flatMap(l => l.to.map(t => `<i class="f-dot" style="${at(t)}"></i>`)).join('');
    const labels = F.labels.map(l => `<span class="f-lbl${/^\d/.test(l.n) ? '' : ' word'}" style="${at(l.at)}" title="${esc(posTitle(l.n))}">${esc(l.n)}</span>`).join('');
    const notes = F.notes.filter(n => !n.long).map(n => `<span class="f-note${n.head ? ' head' : ''}" style="${at(n.at)};transform:${n.head ? "translate(-50%,-50%)" : `rotate(${-(n.rot || 0)}deg) translateY(-50%)`}">${esc(T(n.t))}</span>`).join('');
    // Richtig/Falsch: Kreuz-Skizzen bekommen ✕, die übrigen Felder ✓; Teilabbildungen tragen ihre Markierung selbst
    const big = b => (b[2] - b[0]) * (b[3] - b[1]) > F.w * F.h * 0.8;
    const hit = (a, b) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];
    const mk = (kind, x, y) => `<span class="f-mark ${kind}" style="${at([x, y])}" title="${kind === 'wrong' ? T('falsch') : T('richtig')}">${kind === 'wrong' ? '✕' : '✓'}</span>`;
    const marks = F.mark ? mk(F.mark, flip ? F.w / 2 : F.w / 2, Math.max(14, F.h * 0.05))
      : F.wrong.map(b => mk('wrong', flip ? F.w - (b[0] + b[2]) / 2 : (b[0] + b[2]) / 2, b[1])).concat(
        F.wrong.length ? F.panels.filter(p => !big(p) && !F.wrong.some(w => hit(w, p))).map(p => mk('right', flip ? F.w - (p[0] + p[2]) / 2 : (p[0] + p[2]) / 2, p[1])) : []).join('');
    const H = maxH || 520;
    const size = lightbox ? `width:min(100%, calc((88vh - 60px) * ${(F.w / F.h).toFixed(4)}));`
                          : `width:min(100%, ${Math.round(H * F.w / F.h)}px);`;
    return `<div class="f-box" style="aspect-ratio:${F.w}/${F.h};${size}">
      <img src="${file}" alt="" loading="lazy"${flip ? ' style="transform:scaleX(-1)"' : ''}>
      <svg viewBox="0 0 ${F.w} ${F.h}" preserveAspectRatio="none" aria-hidden="true">${lines}</svg>
      ${dots}${labels}${notes}${marks}</div>`;
  }
  const figNotes = src => {
    const F = window.FIGS && window.FIGS[src.replace(/#flip$/, '').split('/').pop().replace(/\.\w+$/, '')];
    const long = F ? F.notes.filter(n => n.long) : [];
    return long.length ? `<ul class="f-notes">${long.map(n => `<li>${esc(T(n.t))}</li>`).join('')}</ul>` : '';
  };

  window.__figPreview = src => figHTML(src) + figNotes(src);   // für die Prüfung aller Zeichnungen (tools)

  // Eine Abbildung im Arbeitsschritt. Eintrag: Pfad (String) oder
  //   { src, size: 'sm', info: 'Hinweis im Rahmen' }  bzw.  { cols: [[oben, unten], …] }  (Spalten, je Spalte übereinander zentriert)
  function figItem(f) {
    if (typeof f === 'string') f = { src: f };
    if (f.cols) {
      return `<div class="ws-fig ws-cols" style="grid-template-columns:repeat(${f.cols.length},1fr)">${f.cols.map(c =>
        `<div class="ws-col">${c.map(s => `<button class="ws-sub" data-img="${s}" aria-label="${T('Zeichnung vergrößern')}">${figHTML(s, false, 200)}</button>`).join('')}</div>`).join('')}</div>`;
    }
    const maxH = f.size === 'sm' ? 230 : f.size === 'md' ? 330 : 520;
    return `<div><button class="ws-fig${f.size ? ' ' + f.size : ''}" data-img="${f.src}" aria-label="${T('Zeichnung vergrößern')}">${figHTML(f.src, false, maxH)}${f.info ? `<span class="ws-info">${esc(T(f.info))}</span>` : ''}</button>${figNotes(f.src)}</div>`;
  }

  // Arbeitsschritt: Text, optional mit Zeichnungen direkt darunter (row: nebeneinander)
  function workStep(item, cfg) {
    const it = typeof item === 'string' ? { t: item } : item;
    const figs = (val(it.fig, cfg) || []).map(f => val(f, cfg)).filter(Boolean);
    return `<li><div class="ws-text">${T(val(it.t, cfg))}</div>${figs.length ? `
      <div class="ws-figs${it.row ? ' row' : ''}"${it.row ? ` style="grid-template-columns:repeat(${figs.length},1fr)"` : ''}>
        ${figs.map(figItem).join('')}
      </div>${it.cap ? `<div class="ws-cap">${esc(T(val(it.cap, cfg)))}</div>` : ''}` : ''}</li>`;
  }

  // Hinweis: Text oder { t, tools: [{ img, name, nr, crl }] } – Hilfsmittel klein mit Name und Artikelnummer
  function noteHTML(n) {
    if (typeof n === 'string') return `<div class="note">${T(n)}</div>`;
    const tools = (n.tools || []).map(x => `<button class="note-tool"${x.img ? ` data-img="${x.img}"` : ''} aria-label="${T('Zeichnung vergrößern')}">
      ${x.img ? `<img src="${x.img}" alt="" loading="lazy">` : ''}<span><b>${esc(T(x.name))}</b><small>${esc(BR.nr(x))}</small></span></button>`).join('');
    return `<div class="note">${T(n.t)}${tools ? `<div class="note-tools">${tools}</div>` : ''}</div>`;
  }

  function cfgLabel(cfg) {
    const o = [cfg.corner ? T('Ecklösung') : T('gerade'), cfg.frameT && T('Glasstoß'), cfg.topLight && 'Top Light', cfg.swing && 'Swing Door', cfg.cable && T('Kabelkanal')].filter(Boolean);
    return `${cfg.code} · ${o.join(' · ')}`;
  }

  function updateGuideTexts(cfg) {
    $('#optTopLight').title = T(cfg.type !== 'C' ? 'Top Light ist nur bei C2–C4 möglich'
      : cfg.swing ? 'Nicht mit Swing Door kombinierbar' : 'Oberlicht im Türrahmen');
    $('#optSwing').title = T(cfg.topLight ? 'Nicht mit Top Light kombinierbar' : 'Pendeltür');
    try { $('#sheetLabel').textContent = T(sheetText()); } catch (e) { /* noch nicht bereit */ }
  }

  function showGuide(cfg, stepId) {
    setView('view-guide');
    if (!renderer) initScene();
    $('#crumb').textContent = BR.product + ' ' + cfg.code;
    $('#variantLink').href = '#/' + RT + (cfg.corner ? '?ecke=1' : '');
    document.querySelectorAll('[data-opt]').forEach(inp => { inp.checked = !!cfg[inp.dataset.opt]; });
    // Top Light nur bei C; Top Light und Swing Door schließen sich gegenseitig aus
    $('#optTopLight').classList.toggle('off', cfg.type !== 'C' || cfg.swing);
    updateGuideTexts(cfg);
    $('#optSwing').classList.toggle('off', cfg.topLight);
    ['#optTopLight', '#optSwing'].forEach(id => { $(id + ' input').disabled = $(id).classList.contains('off'); });

    const changed = JSON.stringify(cfg) !== JSON.stringify(state.cfg);
    state.cfg = cfg;
    if (changed) {
      buildModel(cfg);
      buildHotspots();
      resize();
      if (state.sel && !activeSteps().some(s => s.id === state.sel)) state.sel = null;
    }
    if (stepId && activeSteps().some(s => s.id === stepId)) {
      if (stepId !== state.sel || changed) select(stepId, { keepHash: true });
    } else {
      state.sel = null;
      updateHotspotClasses();
      applyHighlight();
      renderPanel();
      flyHome(changed);
    }
  }

  function select(id, opts = {}) {
    const step = activeSteps().find(s => s.id === id);
    if (!step) return;
    state.sel = id;
    updateHotspotClasses();
    applyHighlight();
    flyToStep(step);
    renderPanel();
    expandSheet();
    hideHint();
    if (!opts.keepHash) quietHash(guideHash(state.cfg, id));
  }

  function deselect() {
    state.sel = null;
    updateHotspotClasses();
    applyHighlight();
    renderPanel();
    flyHome();
    quietHash(guideHash(state.cfg));
  }

  function go(delta) {
    const list = activeSteps();
    const i = list.findIndex(s => s.id === state.sel) + delta;
    if (i >= list.length) return deselect();
    if (i >= 0) select(list[i].id);
  }

  // ---------------------------------------------------------------- Panel
  const panel = $('#panel');
  const body = $('#panelBody');

  const partsOf = (s, cfg) => (val(s.parts, cfg) || []).filter(k => PARTS[k] && (!PARTS[k].brand || PARTS[k].brand === BR.id));
  const partRow = k => {
    const p = PARTS[k];
    return `<button class="part-row"${p.img ? ` data-img="${BR.img(p.img)}" title="${T('Antippen zum Vergrößern')}"` : ''}>
      ${p.img ? `<img src="${BR.img(p.img)}" alt="" loading="lazy">` : '<span class="no-img"></span>'}
      <span class="txt">${esc(T(p.name))}${p.optional ? ` <em class="opt-tag">${T('Option')}</em>` : ''}<small>${esc(BR.nr(p))}</small></span>
      ${p.pos || /^\d+$/.test(String(k)) ? `<span class="n">${p.pos || k}</span>` : ''}
    </button>`;
  };

  function renderPanel() {
    body.scrollTop = 0;
    const cfg = state.cfg;
    const list = activeSteps();
    if (state.sel) return renderDetail(list.find(s => s.id === state.sel), list);
    const tabs = `
      <div class="tabs">
        <button data-tab="steps" class="${state.tab === 'steps' ? 'active' : ''}">${T('Montageablauf')}</button>
        <button data-tab="parts" class="${state.tab === 'parts' ? 'active' : ''}">${T('Bauteile')}</button>
        <button data-tab="info" class="${state.tab === 'info' ? 'active' : ''}">${T('Hinweise')}</button>
      </div>`;
    let content = '';
    if (state.tab === 'steps') {
      let phase = null, html = '';
      list.forEach((s, i) => {
        if (s.phase !== phase) { if (phase) html += '</ul>'; phase = s.phase; html += `<div class="phase-title">${T(PHASES[phase])}</div><ul class="step-list">`; }
        html += `<li><button class="step-item" data-sel="${s.id}"><span class="num">${i + 1}</span><span>${esc(T(val(s.title, cfg)))}</span>${s.option ? '<span class="opt">Option</span>' : ''}</button></li>`;
      });
      content = `<div class="pad">
        <p class="config-line">${esc(cfgLabel(cfg))}</p>
        ${cfg.cable && !cfg.cc.length ? `<p class="cc-hint">${T('Tippen Sie im 3D-Modell auf ＋ neben der Tür, um einen Kabelkanal zu setzen.')}</p>` : ''}
        <p class="intro">${list.length} ${T('Schritte. Klicken Sie auf einen Punkt im Modell oder einen Schritt – oder starten Sie mit <b>„Schritt für Schritt“</b>.')}</p>
        ${html}</ul></div>`;
    } else if (state.tab === 'parts') {
      const used = [];
      list.forEach(s => partsOf(s, cfg).forEach(p => { if (!used.includes(p)) used.push(p); }));
      const ord = k => PART_ORDER.indexOf(isNaN(k) ? k : +k);
      used.sort((a, b) => ord(a) - ord(b));
      content = `<div class="pad"><p class="intro">${T('Bauteile für')} ${esc(cfgLabel(cfg))}. ${T('Antippen zum Vergrößern.')}</p>
        <div class="parts">${used.map(partRow).join('')}</div></div>`;
    } else {
      content = `<div class="pad general">${BR.text(LANG !== 'de' && I18N[LANG] && I18N[LANG].general ? I18N[LANG].general : GENERAL)}</div>`;
    }
    body.innerHTML = tabs + content;
  }

  function renderDetail(step, list) {
    const cfg = state.cfg;
    const idx = list.indexOf(step);
    const text = step.text.map(t => val(t, cfg)).filter(Boolean);
    const notes = (step.notes || []).map(n => val(n, cfg)).filter(Boolean);
    body.innerHTML = `
      <div class="detail-head">
        <button class="back" data-act="back">${T('← Montageablauf')}</button>
        <div class="detail-title">
          <span class="badge lg ${step.option ? 'grey' : ''}">${idx + 1}</span>
          <div>
            <h2>${esc(T(val(step.title, cfg)))}</h2>
            <div class="meta">${T(PHASES[step.phase])}${step.option ? ' · Option' : ''}</div>
          </div>
        </div>
        <div class="progress"><div style="width:${((idx + 1) / list.length) * 100}%"></div></div>
        <div class="small" style="margin-top:6px">${T('Schritt')} ${idx + 1} ${T('von')} ${list.length}</div>
      </div>

      ${partsOf(step, cfg).length ? `<div class="section"><h3>${T('Benötigte Teile')}</h3>
        <div class="parts">${partsOf(step, cfg).map(partRow).join('')}</div></div>` : ''}

      <div class="section">
        <h3>${T('Montage')}</h3>
        <ol class="steps">${text.map(s => workStep(s, cfg)).join('')}</ol>
      </div>

      ${step.extraHtml ? `<div class="section"><h3>${esc(T(step.extraTitle || ''))}</h3>${THtml(val(step.extraHtml, cfg))}</div>` : ''}

      ${notes.length ? `<div class="section">${notes.map(noteHTML).join('')}</div>` : ''}

      <div class="guide-nav">
        <button class="btn" data-act="prev" ${idx <= 0 ? 'disabled' : ''}>${T('← Zurück')}</button>
        <button class="btn primary" data-act="next">${T(idx >= list.length - 1 ? 'Fertig ✓' : 'Weiter →')}</button>
      </div>`;
  }

  body.addEventListener('click', e => {
    const t = e.target.closest('[data-sel],[data-tab],[data-act],[data-img]');
    if (!t) return;
    setCcEdit(false);
    if (t.dataset.sel) select(t.dataset.sel);
    else if (t.dataset.tab) { state.tab = t.dataset.tab; renderPanel(); }
    else if (t.dataset.act === 'back') deselect();
    else if (t.dataset.act === 'next') go(1);
    else if (t.dataset.act === 'prev') go(-1);
    else if (t.dataset.img) openLightbox(t.dataset.img);
  });

  // ---------------------------------------------------------------- Bedienelemente
  document.querySelectorAll('[data-opt]').forEach(inp => inp.addEventListener('change', () => {
    state.ccEdit = inp.dataset.opt === 'cable' && inp.checked;
    const cfg = Object.assign({}, state.cfg, { [inp.dataset.opt]: inp.checked });
    location.hash = guideHash(cfg, state.sel);
  }));
  $('#guideBtn').addEventListener('click', () => { setCcEdit(false); select(activeSteps()[0].id); });
  $('#resetBtn').addEventListener('click', () => {
    setCcEdit(false); if (state.sel) deselect(); else flyHome(); });
  window.addEventListener('keydown', e => {
    if ($('#view-guide').hidden) return;
    if (e.key === 'Escape') { if (!lb.hidden) lb.hidden = true; else if (state.sel) deselect(); }
    if (state.sel && e.key === 'ArrowRight') go(1);
    if (state.sel && e.key === 'ArrowLeft') go(-1);
  });

  const lb = $('#lightbox');
  function openLightbox(src) {
    lb.querySelector('.lb-inner').innerHTML = figHTML(src, true) + figNotes(src);
    lb.hidden = false;
  }
  lb.addEventListener('click', () => { lb.hidden = true; });

  const mobile = () => window.matchMedia('(max-width: 860px)').matches;
// Anleitungsbereich (Handy/Tablet hochkant): drei Stufen – eingeklappt, halb, groß.
// Leiste antippen oder ziehen; Pfeile vergrößern/verkleinern direkt.
const SHEET = ['collapsed', 'half', 'expanded'];
let sheet = 'half';
const sheetText = () => sheet === 'collapsed' ? 'Anleitung öffnen' : sheet === 'half' ? 'Ziehen: Anleitung ↕ 3D-Ansicht' : '3D-Ansicht vergrößern';
function setSheet(st) {
  sheet = st;
  panel.style.height = '';
  panel.classList.toggle('collapsed', st === 'collapsed');
  panel.classList.toggle('expanded', st === 'expanded');
  const i = SHEET.indexOf(st);
  $('#sheetUp').disabled = i === 2;
  $('#sheetDown').disabled = i === 0;
  $('#sheetLabel').textContent = T(sheetText());
  setTimeout(resize, 280);
}
function expandSheet() { if (mobile() && sheet === 'collapsed') setSheet('half'); }
$('#sheetUp').addEventListener('click', e => { e.stopPropagation(); setSheet(SHEET[Math.min(2, SHEET.indexOf(sheet) + 1)]); });
$('#sheetDown').addEventListener('click', e => { e.stopPropagation(); setSheet(SHEET[Math.max(0, SHEET.indexOf(sheet) - 1)]); });
{
  const handle = $('#sheetHandle');
  let drag = null;
  handle.addEventListener('pointerdown', e => {
    if (e.target.closest('button')) return;
    drag = { y: e.clientY, h: panel.getBoundingClientRect().height, moved: false };
    handle.setPointerCapture(e.pointerId);
    panel.style.transition = 'none';
  });
  handle.addEventListener('pointermove', e => {
    if (!drag) return;
    const dy = drag.y - e.clientY;
    if (Math.abs(dy) > 4) drag.moved = true;
    const vh = window.innerHeight;
    panel.style.height = Math.max(64, Math.min(vh * 0.85, drag.h + dy)) + 'px';
    resize();
  });
  const end = () => {
    if (!drag) return;
    panel.style.transition = '';
    if (!drag.moved) {                          // Antippen: zwischen halb und groß bzw. öffnen
      setSheet(sheet === 'collapsed' ? 'half' : sheet === 'half' ? 'expanded' : 'half');
    } else {                                     // Ziehen: auf nächste Stufe einrasten
      const h = panel.getBoundingClientRect().height, vh = window.innerHeight;
      const targets = { collapsed: 64, half: vh * 0.46, expanded: vh * 0.78 };
      setSheet(SHEET.reduce((a, b) => Math.abs(targets[b] - h) < Math.abs(targets[a] - h) ? b : a));
    }
    drag = null;
  };
  handle.addEventListener('pointerup', end);
  handle.addEventListener('pointercancel', end);
}
if (mobile()) setSheet('collapsed');

  let hintHidden = false;
  function hideHint() {
    if (hintHidden) return;
    hintHidden = true;
    $('#hint').style.opacity = '0';
  }

  // ---------------------------------------------------------------- Loop
  function resize() {
    if (!renderer) return;
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w < h ? 55 : 40;
    camera.updateProjectionMatrix();
  }
  const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  function loop(now) {
    if (!$('#view-guide').hidden) {
      if (anim) {
        const k = Math.min(1, (now - anim.start) / anim.ms), e = ease(k);
        camera.position.lerpVectors(anim.p0, anim.p1, e);
        controls.target.lerpVectors(anim.t0, anim.t1, e);
        if (k >= 1) anim = null;
      }
      controls.update();
      renderer.render(scene, camera);
      positionHotspots();
    }
    requestAnimationFrame(loop);
  }

  window.addEventListener('hashchange', route);
  setLang(LANG);
  route();
})();
