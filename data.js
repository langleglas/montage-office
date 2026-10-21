// Inhalte der interaktiven Montageanleitung OFFICE
// Quellen: Montageanleitung OFFICE (Längle, Nov. 2024), FALLBROOK Assembly Instructions B2/B4, B3, C2/C4, C3 (CRL, Juni 2025),
// Artikelzuordnung Längle ↔ CRL (OFFICE_Artikelzuordnung_Laengle_CRL.xlsx, korrigierte Fassung vom 20.10.2026).
// Ablauf nach FALLBROOK, Bezeichnungen und Artikelnummern nach Längle.
(function () {
  'use strict';

  // ---------------------------------------------------------------- Bauteile
  // key = Positionsnummer in den Zeichnungen (1–16) bzw. Kurzname für Zusatzteile; crl = Artikelnummer CRL (für FALLBROOK/CRL-Varianten)
  // Artikelnummern und Bezeichnungen nach „OFFICE_Artikelzuordnung_Laengle_CRL.xlsx“ (Lena, 20.10.2026):
  // nr = Längle (Reiter „Artikelzuordnung Längle“), crl = CRL (Reiter „Artikelzuordnung CRL USA“)
  const PARTS = {
    1:  { name: 'Türzargenprofil',                 nr: '41AL-BASIS-D',              crl: 'FBD6MBL / FBD6SA' },
    2:  { name: 'Basisrahmenprofil',               nr: '41AL-FRAME-D',              crl: 'FRMD6MBL / FRMD6SA' },
    3:  { name: 'Clipprofil',                      nr: '41AL-CLIP-D',               crl: 'FCLPD6MBL / FCLPD6SA' },
    4:  { name: 'Deckenbasisrahmenprofil',         nr: '41AL-TOP-D',                crl: 'FTPD6MBL / FTPD6SA' },
    5:  { name: 'Glasstoßprofil',                  nr: '41AL-FRAME T-D',            crl: '41AL-FRAME T-D' },
    6:  { name: 'Fixierdichtung',                  nr: '41AL-EPDM F',               crl: 'FRGBL / FRGBL25 / FRGGR / FRGGR25' },
    7:  { name: 'Anschlagdichtung 16 mm',          nr: '41AL-EPDM 16',              crl: 'FFP16BL / FFP16GR', optional: true },
    8:  { name: 'Zargendichtung',                  nr: '41AL-EPDM B',               crl: 'FDJBL / FDJBL25 / FDJGR / FDJGR25' },
    9:  { name: 'Anschlagdichtung 8/10/12 mm',     nr: '41AL-EPDM 8/10/12', crl: 'FFPBL / FFPBL25 / FFGR / FFGR25' },
    10: { name: 'T-Verbinder (Basis und Top Frame oder Frame Verbinder)', nr: '41AL-OFFICE-CT',            crl: 'FTC' },
    11: { name: 'CL-Verbinder (L-Verbinder, Top Frame und Frame Verbinder)', nr: '41AL-OFFICE-CL',            crl: 'FFCCL' },
    12: { name: '90°-Eckverbinder (horizontal, für Boden- und Deckenprofil)', nr: '41AL-OFFICE-CH', crl: 'FXCH' },
    13: { name: 'C-Verbinder (Boden- und Eckverbinder, vertikal)', nr: '41AL-OFFICE-C', crl: 'FFCC' },
    14: { name: 'Hammerkopfmutter für 8–10 mm Glas', nr: '41AL-OFFICE-H',           crl: 'FHHN' },
    15: { name: 'Hammerkopfmutter für 12 mm Glas', nr: '41AL-OFFICE-H-L-12',        crl: 'FHHN12' },
    16: { name: 'Schließblech für 8–12 mm Glas',   nr: '41AL-OFFICE-CP',            crl: 'FSP' },
    // Schließblech für hohe Schlösser – nur Längle, in Amerika nicht verwendet (CRL-Nr. laut Liste: FDSP)
    CP:     { pos: 18, name: 'Schließblech Dorma/WSS für 8–12 mm Glas', nr: '41AL-OFFICE-CP DORMA', crl: 'FDSP', img: 'CP', optional: true, brand: 'laengle' },
    // Kabelkanal CC 80 (Option) – bei CRL keine eigene Nummer
    CCB:    { pos: 24, name: 'Kabelkanal Basisprofil (80 × 48 mm)', nr: '41AL-CABLE CHANNEL BASE', crl: '41AL-CABLE CHANNEL BASE', img: 'CCB' },
    CCC:    { pos: 25, name: 'Abdeckprofil für Kabelkanal 80 mm', nr: '41AL-CABLE CHANNEL COVER', crl: '41AL-CABLE CHANNEL COVER', img: 'CCC' },
    // Anschlagdichtung für 14 mm Glas (Option, Alternative zu 9); Zeichnung aus Montage_complete_OFFICE S. 7
    // Namen nur mit den OFFICE-Glasdicken (XL: 20/22/24, 26, 28 mm – kommt mit OFFICE XL)
    EP14:   { pos: 17, name: 'Anschlagdichtung 14 mm', nr: '41AL-EPDM 14', crl: 'FFP14BL / FFP14GR', img: 'EP14', optional: true },
    CS:     { name: '180°-Verbinder',              nr: '41AL-OFFICE-CS',            crl: 'FCS', img: 'CS', optional: true },
    // Glas-Auflage-Winkel: bei Längle links und rechts getrennt, bei CRL als Set (brand = nur für diese Marke)
    TL3L:   { pos: 19, name: 'Glas-Auflage-Winkel links, Oberlicht', nr: '41AL-OFFICE-H-TL-L', crl: 'FTHHN1 / FTHHN1MBL', img: 'TL3L', brand: 'laengle' },
    TL3R:   { pos: 19, name: 'Glas-Auflage-Winkel rechts, Oberlicht', nr: '41AL-OFFICE-H-TL-R', crl: 'FTHHN1 / FTHHN1MBL', img: 'TL3R', brand: 'laengle' },
    TL3:    { pos: 19, name: 'Glas-Auflage-Winkel links & rechts, Oberlicht', nr: '41AL-OFFICE-H-TL-L+R', crl: 'FTHHN1 / FTHHN1MBL', img: 'TL3', brand: 'crl' },
    TL4:    { pos: 20, name: 'Clipprofil Oberlicht für 10 mm Glas', nr: '41AL-CLIP-TL-10',  crl: 'FCLPT3SA / FCLPT3MBL', img: 'TL4' },
    TL5:    { pos: 21, name: 'Clipprofil Oberlicht für 8 mm Glas',  nr: '41AL-CLIP-TL-8',   crl: 'FCLPT3SA / FCLPT3MBL', img: 'TL5' },
    SDBL:   { pos: 22, name: 'Block für Pendeltüre',        nr: '41AL-OFFICE-SD-BL',         crl: 'FCPDB1SA / FCPDB1MBL', img: 'SDBL' },
    CLIPSD: { pos: 23, name: 'Clipprofil Pendeltür',        nr: '41AL-CLIP-SD',              crl: 'FCLPCP6SA / FCLPCP6MBL', img: 'CLIPSD' }
  };
  Object.keys(PARTS).forEach(k => { if (PARTS[k].img !== false) PARTS[k].img = 'img/profiles/' + (PARTS[k].img || 'p' + k) + '.jpg'; });
  // Reihenfolge in der Teileliste: aufsteigend nach Positionsnummer (180°-Verbinder ohne Nummer bei den Verbindern)
  const PART_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 'CS', 14, 15, 16, 'EP14', 'CP', 'TL3L', 'TL3R', 'TL3', 'TL4', 'TL5', 'SDBL', 'CLIPSD', 'CCB', 'CCC'];

  // ---------------------------------------------------------------- Varianten
  // B = Tür mit Oberlicht (Festteil über der Tür), C = Tür bis zur Decke
  // 2 = Tür links, 3 = Tür mittig, 4 = Tür rechts. Bänder immer an der Wandseite.
  const VARIANTS = {
    B2: { type: 'B', door: 'L', label: 'Tür links mit Oberlicht' },
    B3: { type: 'B', door: 'M', label: 'Tür mittig mit Oberlicht' },
    B4: { type: 'B', door: 'R', label: 'Tür rechts mit Oberlicht' },
    C2: { type: 'C', door: 'L', label: 'Tür links bis zur Decke' },
    C3: { type: 'C', door: 'M', label: 'Tür mittig bis zur Decke' },
    C4: { type: 'C', door: 'R', label: 'Tür rechts bis zur Decke' }
  };

  const PHASES = {
    prep:  'Vorbereitung',
    frame: 'Rahmen liegend vormontieren',
    set:   'Rahmen aufstellen und befestigen',
    glass: 'Verglasen',
    door:  'Tür montieren',
    end:   'Abschluss'
  };

// Einbauposition Hammerkopfmutter je Glasdicke: [DIN links, DIN rechts]
  const HKM_POS = { s: { 8: ['A12', 'B12'], 10: ['B12', 'A12'], 12: ['D13', 'C13'] }, b: { 8: ['B12', 'A12'], 10: ['A12', 'B12'], 12: ['C13', 'D13'] } };
  const glassList = c => c.topLight ? [8, 10] : [8, 10, 12];
  const TABLE_HKM = c => {
    const g = glassList(c);
    const row = (lbl, i) => `<tr><th>${lbl}</th>${['s', 'b'].map(k => g.map(x => `<td>${HKM_POS[k][x][i]}</td>`).join('')).join('')}</tr>`;
    return `
<table class="tbl">
  <thead>
    <tr><th rowspan="2">Glasdicke</th><th colspan="${g.length}">Schließblech</th><th colspan="${g.length}">Türband</th></tr>
    <tr>${[0, 1].map(() => g.map(x => `<th>${x} mm</th>`).join('')).join('')}</tr>
  </thead>
  <tbody>${row('DIN links', 0)}${row('DIN rechts', 1)}</tbody>
</table>`;
  };

  const TABLE_BAENDER = `
<table class="tbl">
  <thead><tr><th>Gewicht Türblatt</th><th>Anzahl Türbänder</th></tr></thead>
  <tbody>
    <tr><td>&lt; 57,5 kg</td><td>2</td></tr>
    <tr><td>57,5 – 78,5 kg</td><td>3</td></tr>
    <tr><td>&gt; 78,5 kg</td><td>4</td></tr>
  </tbody>
</table>
<p class="small">Richtwerte nach Höhe: über 2.400 mm = 3 Bänder, über 2.800 mm = 4 Bänder.</p>`;

  const LIPPEN = { 8: 'komplett', 10: '1 Lippe abziehen', 12: 'beide Lippen abziehen' };
  const TABLE_LIPPEN = c => {
    const g = [8, 10, 12];
    return `
<table class="tbl">
  <thead><tr><th>Glasdicke</th>${g.map(x => `<th>${x} mm</th>`).join('')}</tr></thead>
  <tbody><tr><th>Anschlagdichtung (9)</th>${g.map(x => `<td>${LIPPEN[x]}</td>`).join('')}</tr></tbody>
</table>`;
  };

  const B = c => c.type === 'B', C = c => c.type === 'C';
  const f = n => 'img/fig/' + n + '.jpg';
  // Verbindungszeichnungen sind für Tür rechts/mittig gezeichnet – bei Tür links gespiegelt anzeigen (passend zum 3D-Modell)
  const fx = n => c => f(n) + (c.door === 'L' ? '#flip' : '');
  // Gehrungsecke der Türzarge: bei B liegt sie zum Seitenteil hin, bei C an der Wandseite – Spiegelung entsprechend
  const fxK = n => c => f(n) + ((c.type === 'B' ? c.door === 'L' : c.door === 'R') ? '#flip' : '');
  // Hammerkopfmuttern: mit Top Light ist das Türglas immer 8 oder 10 mm → nur 8–10 mm (14)
  const hkm = c => c.topLight ? [14] : [14, 15];
  // CRL-Verbindungsstreifen (auch bei OFFICE mit CRL-Nummer – noch keine eigene Längle-Nummer)
  const STRIP = {
    c180: { img: 'img/tools/ezcc.jpg', name: 'CRL-Verbindungsstreifen 180°', nr: 'EZCC', crl: 'EZCC' },
    c90: { img: 'img/tools/ezcl.jpg', name: 'CRL-Verbindungsstreifen 90° Ecke', nr: 'EZCL', crl: 'EZCL' }
  };
  // Kabelkanal-Schnitte: FALLBROOK mit Zoll-Maßen
  const ccFig = n => () => f(n + (window.BR && window.BR.id === 'crl' ? '_in' : ''));
  const CC_TEXT = { L: 'Kabelkanal <b>(24)</b> links neben dem Türzargenprofil <b>(1)</b> einsetzen – vom Boden bis zur Decke.', R: 'Kabelkanal <b>(24)</b> rechts neben dem Türzargenprofil <b>(1)</b> einsetzen – vom Boden bis zur Decke.', LR: 'Kabelkanäle <b>(24)</b> links und rechts neben dem Türzargenprofil <b>(1)</b> einsetzen – jeweils vom Boden bis zur Decke.' };
  // Zuschnitt (aus den FALLBROOK-Anleitungen): Ecken je Variante, die einem Verbindungsschritt zugeordnet sind; Ecklösung = eigenes Bild
  const pdfKey = c => c.type.toLowerCase() + (c.door === 'M' ? '3' : '24');

  // ---------------------------------------------------------------- Montageschritte
  // text: Liste von Arbeitsschritten – Text oder { t, fig: [Bild …], check: [richtig, falsch] }; Funktionen erhalten die Konfiguration
  // spots: Anker im 3D-Modell, hl: hervorgehobene Bauteilgruppen, view: Kameraabstand
  const STEPS = [
    {
      id: 'vorbereiten', phase: 'prep', view: 'overview',
      title: 'Profile vorbereiten und Bohrungen setzen',
      parts: [1, 2, 4, 'CS'],
      text: [
        'Profile auf einer weichen Unterlage am Boden auslegen, damit nichts verkratzt. Der Rahmen wird <b>liegend vormontiert</b>.',
        { t: 'In Basisrahmenprofil <b>(2)</b> und Deckenprofil <b>(4)</b> Befestigungslöcher bohren: an beiden Profilenden und entlang des Profils alle <b>30–60 cm</b>.', fig: [f('A_drill'), f('B_drill')] },
        { t: 'Ebenso im Türzargenprofil <b>(1)</b> an der Wandseite.', fig: [f('E_drill')] },
        'Lochgröße und Abstand richten sich nach Untergrund und Schrauben.'
      ],
      notes: ['Die Profile werden in der Regel fertig zugeschnitten geliefert. Bei eigenem Zuschnitt: siehe Reiter <a href="#" data-act="cut-tab">Zuschnitt</a>.', 'Profile (2) oder (4) länger als 6 m werden mit dem 180°-Verbinder 41AL-OFFICE-CS verbunden.'],
      hl: ['p1', 'p2floor', 'p2wall', 'p4']
    },
    {
      id: 'zarge-raus', phase: 'prep', view: 'area',
      title: 'Zargendichtung aus dem Türrahmen entfernen',
      parts: [1, 8],
      text: [
        { t: 'Zargendichtung <b>(8)</b> links und rechts aus den senkrechten Türzargenprofilen <b>(1)</b> herausziehen.', fig: [f('SD_D')] },
        'Dichtung aufbewahren – sie wird am Ende ausgeklinkt und wieder eingedrückt.'
      ],
      spots: ['frameMid'], hl: ['g8']
    },
    {
      id: 'k', phase: 'frame', view: 'detail', cond: c => B(c) || c.door !== 'M',
      title: 'Türrahmen-Ecken auf Gehrung verbinden',
      parts: [1, 13],
      text: [
        { t: 'Waagrechtes und senkrechtes Türzargenprofil <b>(1)</b> auf Gehrung (45°) zusammenstecken. Je Ecke <b>zwei</b> C-Verbinder <b>(13)</b> in beide Profile einschieben – einer davon wird <b>ohne Madenschrauben</b> eingesetzt und dient zur Stabilisierung der Ecke.', fig: [fxK('K'), f('K_ok')] },
        'Gehrung dicht zusammenschieben und die Madenschrauben festziehen – kein Versatz.'
      ],
      spots: ['K'], hl: ['p1']
    },
    {
      id: 'n', phase: 'frame', view: 'detail', cond: c => B(c) && c.door !== 'M',
      title: 'Türrahmen-Ecke mit Wandprofil darüber verbinden',
      parts: [1, 2, 10, 13],
      text: [
        { t: 'An der wandseitigen Türrahmen-Ecke einen C-Verbinder <b>(13)</b> und einen T-Verbinder <b>(10)</b> in die Gehrung der Türzargenprofile <b>(1)</b> einschieben.', fig: [fx('N')] },
        'Senkrechtes Basisrahmenprofil <b>(2)</b> von oben auf den T-Verbinder schieben – dieser läuft dann an der Wand bis zur Decke.',
        'Alles ausrichten und die Madenschrauben festziehen.'
      ],
      spots: ['N'], hl: ['p1', 'p2wall']
    },
    {
      id: 'l', phase: 'frame', view: 'detail', cond: C,
      title: 'Türrahmen mit Deckenprofil verbinden',
      parts: [1, 4, 10, 13],
      text: [
        { t: 'An der Türrahmen-Ecke zum Seitenteil je <b>einen</b> C-Verbinder <b>(13)</b> und T-Verbinder <b>(10)</b> in die Gehrung der Türzargenprofile <b>(1)</b> einschieben.', fig: [fx('L')] },
        'Deckenprofil <b>(4)</b> des Seitenteils seitlich auf den T-Verbinder schieben.',
        'Alles bündig ausrichten und die Madenschrauben festziehen.'
      ],
      spots: ['L'], hl: ['p1', 'p4']
    },
    {
      id: 'j', phase: 'frame', view: 'detail',
      title: 'Deckenprofil mit Wandprofil verbinden',
      parts: [4, 2, 11],
      text: [
        { t: 'CL-Verbinder <b>(11)</b> mit dem kurzen Schenkel in das Deckenprofil <b>(4)</b> schieben, das senkrechte Basisrahmenprofil <b>(2)</b> von unten aufschieben.', fig: [fx('J')] },
        'Profile <b>stumpf</b> stoßen (nicht auf Gehrung), ausrichten und die Madenschrauben festziehen.'
      ],
      spots: ['J'], hl: ['p4', 'p2wall']
    },
    {
      id: 'i', phase: 'frame', view: 'detail',
      title: 'Basisrahmenprofil mit Türrahmen verbinden',
      parts: [2, 1, 13],
      text: [
        { t: 'C-Verbinder <b>(13)</b> in das Ende des Basisrahmenprofils <b>(2)</b> schieben und das Türzargenprofil <b>(1)</b> von oben aufstecken.', fig: [fx('I')] },
        'Basisrahmenprofil stumpf an den Türrahmen schieben, ausrichten und die Madenschrauben festziehen.'
      ],
      spots: ['I'], hl: ['p2floor', 'p1']
    },
    {
      id: 'h', phase: 'frame', view: 'detail',
      title: 'Basisrahmenprofil mit Wandprofil verbinden',
      parts: [2, 13],
      text: [
        { t: 'C-Verbinder <b>(13)</b> in das waagrechte Basisrahmenprofil <b>(2)</b> schieben und das senkrechte Basisrahmenprofil <b>(2)</b> von oben aufstecken – Ecke auf <b>Gehrung</b>.', fig: [fx('H')] },
        'Ecke schließen und die Madenschrauben festziehen.'
      ],
      spots: ['H'], hl: ['p2floor', 'p2wall']
    },
    {
      // Option Kabelkanal (Lena, 21.10.2026): wird beim Zusammenbau des Rahmens vor Ort mit eingebaut,
      // Befestigung mit bauseits beigestellten selbstbohrenden Schrauben (Zeichnung 007JH026.015B)
      id: 'kabelkanal', phase: 'frame', view: 'area', option: true,
      cond: c => c.cable && c.cc.length > 0,
      title: 'Kabelkanal einbauen (Option)',
      parts: ['CCB', 'CCC'],
      text: [
        c => ({ t: CC_TEXT[c.cc.length > 1 ? 'LR' : c.cc[0]], fig: [ccFig('cc80_schnitt')] }),
        'Der Kabelkanal wird beim Zusammenbau des Rahmens gleich mit eingebaut: Er sitzt zwischen Türzargenprofil <b>(1)</b> und Basisrahmenprofil <b>(2)</b>.',
        { t: 'Kabelkanal-Basisprofil <b>(24)</b> seitlich mit dem Türzargenprofil <b>(1)</b> und dem Basisrahmenprofil <b>(2)</b> verschrauben – mit selbstbohrenden Schrauben, verteilt über die ganze Höhe.', fig: [ccFig('cc80_schrauben')] },
        'Nach der Elektroinstallation das Abdeckprofil <b>(25)</b> an die Gegebenheiten vor Ort anpassen (z. B. Aussparungen für Schalter und Steckdosen), auf Länge zuschneiden und einsetzen.'
      ],
      notes: ['Selbstbohrende Schrauben (Profilverbindung inkl. Befestigungsmittel) werden bauseits beigestellt.'],
      spots: ['cc'], hl: ['cc']
    },
    {
      id: 'aufstellen', phase: 'set', view: 'overview',
      title: 'Rahmen aufstellen',
      parts: [],
      text: [
        'Den vormontierten Rahmen zu zweit (bei Bedarf mit mehreren Personen) gleichmäßig vom Boden aufheben.',
        'An der vorgesehenen Position aufstellen.'
      ],
      hl: ['p1', 'p2floor', 'p2wall', 'p4']
    },
    {
      id: 'm', phase: 'set', view: 'detail', cond: c => c.corner,
      title: 'Ecke 90° verbinden (Ecklösung)',
      parts: [4, 2, 12],
      text: [
        'Rahmen der Rückwand an den Hauptrahmen stellen.',
        { t: 'Oben die Deckenprofile <b>(4)</b> und unten die Basisrahmenprofile <b>(2)</b> jeweils mit einem 90°-Eckverbinder <b>(12)</b> auf Gehrung verbinden.', fig: [f('M_top'), f('M')] },
        'Je Verbinder die vier Madenschrauben festziehen.'
      ],
      spots: ['M'], hl: ['p4', 'p2floor']
    },
    {
      id: 'ausrichten', phase: 'set', view: 'overview',
      title: 'Rahmen ausrichten',
      parts: [],
      text: [
        { t: 'Rahmen mit Wasserwaage oder Linienlaser ausrichten: Er muss <b>lotrecht, waagrecht und rechtwinklig</b> stehen und darf nicht verdreht sein. Sind Boden, Wände oder Decke schief oder uneben, den Rahmen an den Befestigungspunkten entsprechend unterlegen bzw. hinterlegen – nicht dem Bauwerk folgen.', fig: c => [f('align_' + pdfKey(c))] },
        '<b>Ausnahme:</b> Manche Anlagen sind bewusst so geplant, dass sie dem Wand- bzw. Deckenverlauf folgen. In diesen Fällen den Rahmen <b>nicht</b> automatisch lotrecht, waagrecht und rechtwinklig ausrichten. Die Ausrichtung ist je nach Anlage immer mit den Planvorgaben abzugleichen.'
      ],
      hl: ['p1', 'p2floor', 'p2wall', 'p4']
    },
    {
      id: 'befestigen', phase: 'set', view: 'overview',
      title: 'Rahmen befestigen',
      parts: [1, 2, 4],
      text: [
        { t: 'Deckenprofil <b>(4)</b> an der Decke verschrauben.', fig: [f('fasten_ceiling')] },
        { t: 'Basisrahmenprofile <b>(2)</b> an Wand und Boden verschrauben.', fig: [f('fasten2')] },
        { t: 'Türzargenprofil <b>(1)</b> an der Wand verschrauben – die Zargendichtung deckt die Schrauben später ab.', fig: [f('fasten_frame'), { src: f('E_section'), size: 'sm', info: 'Nur zur Info: Die Zargendichtung (8) wird erst später ausgeklinkt und danach wieder eingedrückt.' }] },
        'Befestigungspunkte alle <b>30–60 cm</b>; Schrauben und Dübel passend zum Untergrund wählen.'
      ],
      notes: ['Schraubenköpfe müssen bündig sitzen. Spalt zwischen Profil und Mauerwerk gegebenenfalls hinterfüllen. Im Bereich der Befestigungspunkte unterlegen.'],
      hl: ['p1', 'p2floor', 'p2wall', 'p4']
    },
    {
      id: 'anschlag', phase: 'glass', view: 'overview',
      title: 'Anschlagdichtung einsetzen',
      parts: [9, 'EP14', 7],
      notes: ['<b>Option dickeres Glas:</b> Bei <b>14 mm</b> Glas die Anschlagdichtung 14 mm <b>(17)</b>, bei <b>16 mm</b> Glas die Anschlagdichtung 16 mm <b>(7)</b> anstelle der Anschlagdichtung <b>(9)</b> verwenden.'],
      text: [
        { t: 'Lippen der Anschlagdichtung <b>(9)</b> je nach Glasdicke der Fixverglasung entfernen: <b>8 mm</b> komplett verwenden · <b>10 mm</b> eine Lippe abziehen · <b>12 mm</b> beide Lippen abziehen.', fig: [f('gp_a'), f('gp_b')], row: true },
        { t: 'Anschlagdichtung in Deckenprofil <b>(4)</b> und Basisrahmenprofile <b>(2)</b> einziehen. Beim Türzargenprofil <b>(1)</b> die Anschlagdichtung in das Clipprofil <b>(3)</b> einziehen.', fig: c => [{ src: f('g9_4'), size: 'md' }, { src: f('g9_2'), size: 'md' }, { src: f('g9_1'), size: 'md' }] }
      ],
      extraTitle: 'Anschlagdichtung nach Glasdicke', extraHtml: TABLE_LIPPEN,
      hl: ['p1', 'p2floor', 'p2wall', 'p4']
    },
    {
      id: 'kloetze', phase: 'glass', view: 'area',
      title: 'Verglasungsblöcke setzen',
      parts: [],
      text: [
        { t: 'Verglasungsblöcke ca. <b>10 cm</b> von der linken und rechten Glaskante entfernt in das Basisrahmenprofil <b>(2)</b> legen.', fig: [f('blocks_2')] },
        c => B(c) ? { t: 'Für das Oberlicht ebenso Blöcke auf das waagrechte Türzargenprofil <b>(1)</b> legen.', fig: [f('blocks_1')] } : null
      ],
      notes: ['Standardkonfiguration: Verglasungsblöcke <b>5 mm</b>. Ist es erforderlich, die Gläser ins Lot zu bringen, kann bzw. muss die Klotzung entsprechend angepasst werden.'],
      spots: ['blocks'], spotLimit: 1, hl: ['blocks']
    },
    {
      id: 'glas-seite', phase: 'glass', view: 'area',
      title: c => c.door === 'M' ? 'Seitenteile verglasen' : 'Seitenteil verglasen',
      parts: [],
      text: [
        { t: 'Glas zuerst <b>oben</b> in das Deckenprofil <b>(4)</b> einführen und bis an die Anschlagdichtung schieben.', fig: [f('glass_up')] },
        { t: 'Dann <b>unten</b> in das Basisrahmenprofil <b>(2)</b> einschwenken und auf die Verglasungsblöcke absetzen.', fig: [f('glass_down'), f('A_glass')] },
        { t: 'Glas gerade einsetzen – nicht verkanten.', fig: [{ src: f('glass_bad'), size: 'sm' }, { src: f('glass_good'), size: 'sm' }], row: true },
        c => c.corner ? 'Ecklösung: Glasfuge an der 90°-Ecke mit Silikon oder dem CRL-Verbindungsstreifen <b>EZCL</b> (90° Ecke) schließen.' : null
      ],
      notes: ['Nur ESG oder VSG aus ESG verwenden.', c => c.corner ? { t: 'Glasfuge an der Ecke: Silikonfuge oder CRL-Verbindungsstreifen (90° Ecke).', tools: [STRIP.c90] } : null],
      spots: ['glass'], hl: ['glass']
    },
    {
      id: 'glas-ober', phase: 'glass', view: 'area', cond: B,
      title: 'Oberlicht verglasen',
      parts: [],
      text: [
        { t: 'Oberlichtglas oben in das Deckenprofil <b>(4)</b> einführen.', fig: [f('over_up')] },
        { t: 'Unten in das waagrechte Türzargenprofil <b>(1)</b> einschwenken und auf die Verglasungsblöcke absetzen.', fig: [f('over_down')] },
        c => c.frameT
          ? { t: 'Glasstoß zum Seitenteil: Abstand der Glaskanten <b>21 mm</b> für das Glasstoßprofil <b>(5)</b> – Einbau im nächsten Schritt. Glas lotrecht ausrichten.', fig: [f('over_ok')] }
          : { t: 'Glasstoß zum Seitenteil: <b>3 mm</b> Fuge – mit Silikon oder dem CRL-Verbindungsstreifen <b>EZCC</b> (180°) schließen. Glas lotrecht ausrichten.', fig: [f('over_ok')] }
      ],
      notes: [c => c.frameT ? null : { t: 'Glasfuge 3 mm: Silikonfuge oder CRL-Verbindungsstreifen (180°).', tools: [STRIP.c180] }],
      spots: ['over'], hl: ['over']
    },
    {
      id: 'glasstoss', phase: 'glass', view: 'area', cond: c => c.frameT, option: true,
      title: 'Glasstoßprofil einsetzen (Option)',
      parts: [5, 9, 'EP14', 7, 3, 6],
      notes: ['<b>Option dickeres Glas:</b> Bei <b>14 mm</b> Glas die Anschlagdichtung 14 mm <b>(17)</b>, bei <b>16 mm</b> Glas die Anschlagdichtung 16 mm <b>(7)</b> anstelle der Anschlagdichtung <b>(9)</b> verwenden.'],
      text: [
        c => c.type === 'B'
          ? `Glasstoßprofile <b>(5)</b> an allen Glasstößen setzen: im Seitenteil sowie zwischen Oberlicht und Seitenteil${c.door === 'M' ? ' (links und rechts der Tür)' : ''}.`
          : null,
        { t: 'Anschlagdichtungen <b>(9)</b> beidseitig in das Glasstoßprofil <b>(5)</b> einziehen.', fig: [f('C_a')] },
        { t: 'Glasstoßprofil zwischen die beiden Glasscheiben setzen (Abstand der Glaskanten <b>21 mm</b>), Clipprofile <b>(3)</b> von der Gegenseite einclipsen und Fixierdichtungen <b>(6)</b> eindrücken.', fig: [f('C_b')] },
        { t: 'Fertig montierter Glasstoß. An den Enden des Glasstoßprofils (markiert) ist kein Verbinder notwendig.', fig: [f('C_c'), f('C_d')], row: true }
      ],
      spots: ['frameT'], hl: ['frameT']
    },
    {
      id: 'fixierung', phase: 'glass', view: 'overview',
      title: 'Fixierdichtung und Clipprofil einsetzen',
      parts: [6, 3],
      text: [
        { t: '<b>Deckenprofil (4):</b> Fixierdichtung <b>(6)</b> von unten zwischen Glas und Profil eindrücken.', fig: [f('B_fix'), f('B_section')] },
        { t: '<b>Basisrahmenprofil (2):</b> zuerst Clipprofil <b>(3)</b> einclipsen, dann Fixierdichtung <b>(6)</b> zwischen Glas und Clipprofil eindrücken.', fig: [f('A_clip'), f('A_section')] },
        { t: '<b>Türzargenprofil (1):</b> ebenso Clipprofil <b>(3)</b> und Fixierdichtung <b>(6)</b>.', fig: [f('D_2'), f('D_3')] }
      ],
      notes: [{ t: 'Tipp: Glasreiniger und Vinylroller erleichtern das Einsetzen der Dichtung.', tools: [
        { img: 'img/tools/glasreiniger.jpg', name: 'Glasreiniger', nr: 'EB1701', crl: 'EB1701' },
        { img: 'img/tools/vinylroller.jpg', name: 'Vinylroller', nr: 'AL-VINYLROLLER', crl: 'VR10' }
      ] }],
      hl: ['p1', 'p2floor', 'p2wall', 'p4']
    },
    // ---- Option Top Light (nur C)
    {
      id: 'tl-traeger', phase: 'glass', view: 'detail', cond: c => C(c) && c.topLight, option: true,
      title: 'Top Light: Glas-Auflage-Winkel einsetzen und positionieren',
      parts: [1, 'TL3L', 'TL3R', 'TL3', 'TL4', 'TL5'],
      text: [
        { t: 'Glas-Auflage-Winkel links und rechts in die Nut der senkrechten Türzargenprofile <b>(1)</b> einsetzen, eindrehen und mit der Madenschraube (im Lieferumfang) fixieren.', fig: [f('TL_A')] },
        { t: '<b>Option 1:</b> Glas-Auflage-Winkel nach Maß laut Planung positionieren.', fig: [f('TL_B1')] },
        { t: '<b>Option 2:</b> Glas-Auflage-Winkel mit Hilfe der Oberlicht-Clipprofile positionieren. Die Clipprofile vor dem nächsten Schritt wieder entfernen.', fig: [f('TL_B2')] }
      ],
      spots: ['tlCarrier'], hl: ['tl']
    },
    {
      id: 'tl-dichtung', phase: 'glass', view: 'area', cond: c => C(c) && c.topLight, option: true,
      title: 'Top Light: Dichtung im Oberlicht einsetzen',
      parts: ['TL4', 'TL5'],
      text: [
        { t: 'Dichtung vorbereiten.', fig: [{ src: f('TL_C2'), size: 'md', info: 'Beide Dichtungslippen abreißen – unabhängig von der Glasdicke.' }] },
        { t: 'Dichtung im Bereich des Oberlichts oben und seitlich in den Türrahmen einsetzen.', fig: [f('TL_C1')] }
      ],
      spots: ['transom'], hl: ['transom']
    },
    {
      id: 'tl-glas', phase: 'glass', view: 'area', cond: c => C(c) && c.topLight, option: true,
      title: 'Top Light: Oberlicht verglasen',
      parts: ['TL4', 'TL5', 6],
      text: [
        { t: 'Glas einsetzen und auf die Glas-Auflage-Winkel setzen. Clipprofil passend zur Glasdicke wählen – das Oberlicht hat immer dieselbe Glasstärke wie die Tür: <b>8 mm → 41AL-CLIP-TL-8</b>, <b>10 mm → 41AL-CLIP-TL-10</b>.', fig: [{ src: f('TL_D1b'), info: 'Einsteckdichtung je nach Oberlicht-Glasdicke wählen.' }, { src: f('TL_D1a'), info: 'Das Glas wird auf die Flügel der Glas-Auflage-Winkel gesetzt.' }] },
        { t: 'Clipprofil in der gezeigten Reihenfolge (oben, dann seitlich) einsetzen und das Glas mit passender Fixierdichtung sichern – vor Ort zuschneiden.', fig: [f('TL_D2')] }
      ],
      notes: ['Schraubenköpfe der Türrahmenbefestigung dürfen nicht überstehen – sonst das Clipprofil im Bereich der Befestigungspunkte einkerben.'],
      spots: ['transom'], hl: ['transom']
    },
    // ---- Tür: Drehtür
    {
      id: 'baender', phase: 'door', view: 'area', cond: c => !c.swing,
      title: 'Türbänder montieren',
      parts: c => [1, ...hkm(c)],
      text: [
        { t: 'Die Türbänder werden mit Hammerkopfmuttern am Türzargenprofil <b>(1)</b> befestigt: Pro Band zwei Hammerkopfmuttern an der Bandseite in die Nut einsetzen und eindrehen. Einbauposition laut Tabelle (ganz unten).', fig: [{ cols: [1, 2, 3, 4].map(i => [f('Fn_v' + i), f('Fn_d' + i)]) }], cap: c => c.topLight ? 'Mit Top Light ist das Türglas 8 mm oder 10 mm: Hammerkopfmutter 8–10 mm (14), Position A12/B12' : 'Türglas 8 mm oder 10 mm: Hammerkopfmutter 8–10 mm (14), Position A12/B12 · Türglas 12 mm: Hammerkopfmutter 12 mm (15), Position C13/D13' },
        { t: 'Türband mit zwei Senkkopfschrauben befestigen – <b>max. 6 Nm</b>.', fig: [f('G_draw')] }
      ],
      extraTitle: 'Einbauposition Hammerkopfmutter', extraHtml: c => TABLE_HKM(c) + '<h4>Anzahl Türbänder</h4>' + TABLE_BAENDER,
      spots: ['hinge'], hl: ['hinge']
    },
    {
      id: 'schliessblech', phase: 'door', view: 'detail', cond: c => !c.swing,
      title: 'Schließblech montieren',
      parts: c => [1, ...hkm(c), 16, 'CP'],
      text: [
        { t: 'Das Schließblech <b>(16)</b> wird ebenfalls mit Hammerkopfmuttern am Türzargenprofil <b>(1)</b> befestigt: Zwei Hammerkopfmuttern an der Schlossseite in die Nut einsetzen und eindrehen – Einbauposition laut Tabelle (ganz unten). Schließblech mit zwei Senkkopfschrauben befestigen – <b>max. 6 Nm</b>.', fig: [f('F_draw')], cap: c => c.topLight ? 'Mit Top Light ist das Türglas 8 mm oder 10 mm: Hammerkopfmutter 8–10 mm (14), Position A12/B12' : 'Türglas 8 mm oder 10 mm: Hammerkopfmutter 8–10 mm (14), Position A12/B12 · Türglas 12 mm: Hammerkopfmutter 12 mm (15), Position C13/D13' },
        // nur OFFICE: in Amerika werden keine hohen Schlösser verwendet
        () => window.BR && window.BR.id === 'crl' ? null : '<b>Option:</b> Bei hohen Schlössern wird das Schließblech CP DORMA <b>(18)</b> verwendet – Befestigung ebenfalls mit zwei Hammerkopfmuttern und Senkkopfschrauben.'
      ],
      extraTitle: 'Einbauposition Hammerkopfmutter', extraHtml: TABLE_HKM,
      spots: ['strike'], hl: ['strike']
    },
    // ---- Tür: Swing Door
    {
      id: 'sd-block', phase: 'door', view: 'detail', cond: c => c.swing, option: true,
      title: 'Swing Door: Block für Pendeltür befestigen',
      parts: [1, 'SDBL'],
      text: [
        { t: 'Block für Pendeltür im oberen Türzargenprofil <b>(1)</b> links- oder rechtsbündig mit Hammerkopfmuttern befestigen.', fig: [f('SD_A1'), { src: f('SD_A2'), info: 'Der Steg der Hammerkopfmuttern zeigt beim Einsetzen immer nach rechts.' }] }
      ],
      spots: ['sd'], hl: ['sd']
    },
    {
      id: 'sd-zapfen', phase: 'door', view: 'detail', cond: c => c.swing, option: true,
      title: 'Swing Door: oberen Drehzapfen montieren',
      parts: ['SDBL'],
      text: [
        { t: 'Oberen, mittig gehängten, frei schwingenden Drehzapfen am Block befestigen.', fig: [f('SD_B')] },
        'Systemkompatible Beschläge: 1NT401, PH21, CRL380 – Montageanleitung des Beschlagherstellers beachten.'
      ],
      spots: ['sd'], hl: ['sd']
    },
    {
      id: 'sd-clip', phase: 'door', view: 'area', cond: c => c.swing, option: true,
      title: 'Swing Door: Clipprofil einsetzen',
      parts: ['CLIPSD'],
      text: [
        { t: 'Clipprofil Pendeltür bauseits auf Maß zuschneiden und seitlich und oben in die Türzargenprofile <b>(1)</b> einclipsen – es ersetzt bei der Pendeltür die Zargendichtung.', fig: [f('SD_C1'), f('SD_C2')] }
      ],
      notes: ['Bei Nachrüstung einer bestehenden OFFICE-Tür: vorher die Zargendichtung entfernen.'],
      spots: ['frameMid'], hl: ['g8']
    },
    // ---- Tür einsetzen
    {
      id: 'tuer', phase: 'door', view: 'area',
      title: 'Türblatt einsetzen',
      parts: [],
      text: [
        c => c.swing ? 'Türblatt mit den vormontierten Beschlägen (laut Herstellerangabe) in den Rahmen einsetzen und gegebenenfalls ausrichten – dazu die Einstellmöglichkeiten des Hydraulikbandes nutzen (laut Herstellerangabe bzw. Montageanleitung des Hydraulikbandes).' : 'Montierte Bänder öffnen.',
        c => c.swing ? null : { t: 'Türglas in die vorgesehene Position stellen. Abstand Boden–Glas laut Plan mit passenden Verglasungsklötzen unterlegen.', fig: [f('door_floor')] },
        c => c.swing ? null : { t: 'Spalt zwischen Glas und Profil laut Plan mit Verglasungsklötzen vorübergehend fixieren.', fig: [{ src: f('door_bad'), size: 'sm' }, { src: f('door_good'), size: 'sm' }], row: true },
        c => c.topLight ? { t: 'Mit Top Light: Abstand Türblatt–Oberlichtglas <b>5 mm</b>; Zargendichtung einlegen.', fig: [f('TL_E')] } : null
      ],
      spots: ['door'], hl: ['door']
    },
    {
      id: 'schloss', phase: 'door', view: 'area',
      title: c => c.swing ? 'Türgriff montieren' : 'Bänder schließen und Schloss montieren',
      parts: [],
      text: [
        c => c.swing ? null : { t: 'Bänder auf das Türglas schließen; Gegenplatten auf der Gegenseite nach Herstellerangabe montieren.', fig: [f('close')] },
        c => c.swing ? null : 'Die zur Positionierung verwendeten Verglasungsklötze entfernen, sobald die Bänder am Türglas montiert sind.',
        c => c.swing ? 'Türgriff nach Herstellerangabe montieren.' : 'Schloss nach Herstellerangabe montieren.',
        'Tür auf leichten Lauf und gleichmäßige Fugen prüfen.'
      ],
      spots: ['handle'], hl: ['handle', 'hinge']
    },
    {
      id: 'zarge-rein', phase: 'door', view: 'area', cond: c => !c.swing,
      title: 'Zargendichtung ausklinken und eindrücken',
      parts: [8],
      text: [
        'Zargendichtung provisorisch in das Türzargenprofil <b>(1)</b> einsetzen und die Position der Bänder und des Schließblechs auf der Dichtung markieren. Dichtung danach wieder herausnehmen.',
        { t: 'Dichtung an jedem Band und am Schließblech bis zur gedachten Linie (strichliert) einschneiden – <b>2 Schnitte</b> je Band bzw. Schließblech.', fig: [f('DI1')] },
        { t: 'Dichtung umdrehen und den eingeschnittenen Teil entlang der Linie wegschneiden.', fig: [f('DI2')] },
        { t: 'Hohlkammer aufklappen, den inneren Lappen an den Enden einschneiden und wegschneiden.', fig: [f('DI3')] },
        { t: 'Zargendichtung wieder in das Türzargenprofil <b>(1)</b> eindrücken.', fig: [f('E_section')] }
      ],
      spots: ['notch'], hl: ['g8']
    },
    {
      id: 'reinigen', phase: 'end', view: 'overview',
      title: 'Anlage reinigen',
      parts: [],
      text: [
        'Gesamte Anlage und Glas reinigen.',
        'Zement, Gips oder Mörtelreste auf dem Aluminium sofort mit Wasser und milder Seife entfernen – keine scharfen oder alkalischen Reiniger.'
      ],
      hl: []
    }
  ];

  const GENERAL = `
<h4>Allgemeine Montagehinweise</h4>
<ul>
  <li>Nur mit von Längle für die Einbausituation geplanten und freigegebenen Komponenten montieren. Freigegebene Planung bzw. Systemzeichnung hat Vorrang.</li>
  <li>Montage ausschließlich durch Fachpersonal, nur unbeschädigte Produkte verwenden.</li>
  <li>Bauteile lotrecht, waagrecht und rechtwinklig montieren; nur die vorgesehenen Befestigungsmittel verwenden.</li>
  <li>Nur ESG oder VSG aus ESG verwenden.</li>
  <li>Nur für den Innenbereich – nicht für Dusche, Sauna, Schwimm-/Solebad oder Räume mit Chemikalien (z. B. Chlor).</li>
  <li>Dichtstoffe müssen mit allen angrenzenden Materialien verträglich sein.</li>
</ul>
<h4>Aluminium richtig behandeln</h4>
<ul>
  <li>Profile geschützt und trocken lagern, von Wasser, Schlamm und Spritzwasser fernhalten.</li>
  <li>Ware sofort nach Übergabe auf Vollständigkeit prüfen, Mängel innerhalb von 8 Werktagen melden.</li>
  <li>Nach der Montage schützen: Zement, Gips oder Reinigungsmittel sofort mit Wasser und milder Seife entfernen.</li>
</ul>
<h4>Maximale Abmessungen (Richtwerte)</h4>
<ul>
  <li>Türen: Breite 1.000 mm, Höhe 3.000 mm</li>
  <li>Festteile: Breite ohne Limit, Höhe 3.400 mm</li>
</ul>
<h4>Anzahl Türbänder</h4>
${TABLE_BAENDER}
<h4>Aufmaß</h4>
<ol>
  <li>Selbstnivellierenden Linienlaser aufstellen.</li>
  <li>Höhen links, Mitte und rechts aufnehmen – maßgeblich sind kleinste lichte Höhe und Breite.</li>
  <li>System montieren und Zwischenraum zum Mauerwerk gegebenenfalls hinterfüllen.</li>
</ol>
<p class="small">Garantie: 5 Jahre ab Übergabe.</p>
`;

  window.OFFICE = { PARTS, PART_ORDER, VARIANTS, PHASES, STEPS, GENERAL };
})();
