// Marken-Konfiguration: dieselbe App für Längle OFFICE und CRL FALLBROOK.
// Welche Marke gilt, legt die jeweilige Seite fest (window.BRAND_ID vor diesem Skript), Standard: Längle.
(function () {
  'use strict';

  // ---------------------------------------------------------------- Zoll-Umrechnung (FALLBROOK)
  // Übliche Maße in den Werten, wie CRL sie angibt; alles andere wird auf 1/16" gerundet.
  const INCH = {
    1.5: '1/16"', 2: '1/16"', 3: '1/8"', 5: '3/16"',
    // Vorgabe CRL/Längle (Lena, 15.10.2026)
    8: '5/16"', 10: '3/8"', 12: '1/2"', 14: '9/16"', 16: '5/8"', 20: '3/4"', 22: '7/8"', 24: '15/16"', 26: '1"', 28: '1 1/8"',
    9: '3/8"', 17: '11/16"', 21: '13/16"', 80: '3 1/8"', 100: '4"', 300: '12"', 600: '24"',
    1000: '39 3/8"', 2400: '94 1/2"', 2800: '110"', 3000: '118"', 3400: '133 7/8"', 6000: '236"'
  };
  function gcd(a, b) { return b ? gcd(b, a % b) : a; }
  function inch(mm) {
    if (INCH[mm]) return INCH[mm];
    const sixteenths = Math.round(mm / 25.4 * 16);
    const whole = Math.floor(sixteenths / 16), rest = sixteenths % 16;
    if (!rest) return whole + '"';
    const g = gcd(rest, 16), frac = (rest / g) + '/' + (16 / g);
    return (whole ? whole + ' ' : '') + frac + '"';
  }
  const num = s => parseFloat(String(s).replace(/(\d)[.,](\d{3})\b/g, '$1$2').replace(',', '.'));
  const toMm = (v, u) => u === 'cm' ? v * 10 : u === 'm' ? v * 1000 : v;
  const N = '(\\d{1,3}(?:[.,]\\d{3})+|\\d+(?:[.,]\\d+)?)';

  function toInches(s) {
    return s
      // Bereiche: 30–60 cm, 1,5–5 mm, 8–10 mm
      .replace(new RegExp(N + '\\s?[–-]\\s?' + N + '\\s?(mm|cm|m)\\b', 'g'), (m, a, b, u) => `${inch(toMm(num(a), u))}–${inch(toMm(num(b), u))}`)
      // Maße: 60 × 30 × 3 mm
      .replace(new RegExp(N + '\\s?×\\s?' + N + '\\s?×\\s?' + N + '\\s?(mm|cm|m)\\b', 'g'), (m, a, b, c, u) => `${inch(toMm(num(a), u))} × ${inch(toMm(num(b), u))} × ${inch(toMm(num(c), u))}`)
      // Maße: 80 × 20 mm
      .replace(new RegExp(N + '\\s?×\\s?' + N + '\\s?(mm|cm|m)\\b', 'g'), (m, a, b, u) => `${inch(toMm(num(a), u))} × ${inch(toMm(num(b), u))}`)
      // Glasdicken: 8/10/12 mm
      .replace(/(\d+(?:\/\d+)+)\s?mm\b/g, (m, list) => list.split('/').map(v => inch(+v)).join(', '))
      // Einzelwerte
      .replace(new RegExp(N + '\\s?(mm|cm|m)\\b', 'g'), (m, a, u) => inch(toMm(num(a), u)))
      // Gewichte (auch Bereiche wie 57,5 – 78,5 kg)
      .replace(new RegExp(N + '\\s*[–-]\\s*' + N + '\\s?kg\\b', 'g'), (m, a, b) => `${Math.round(num(a) * 2.20462)}–${Math.round(num(b) * 2.20462)} lb`)
      .replace(new RegExp(N + '\\s?kg\\b', 'g'), (m, a) => Math.round(num(a) * 2.20462) + ' lb')
      // Anzugsmoment
      .replace(/(\d+)\s?Nm\b/g, (m, a) => `${a} Nm (${Math.round(+a * 8.85)} in-lb)`);
  }

  const P = window.OFFICE && window.OFFICE.PARTS;
  // Längle-Artikelnummern im Fließtext → CRL-Nummern
  const NR_MAP = P ? Object.keys(P).map(k => P[k]).filter(p => p.crl && /^[\w-]+$/.test(p.nr)).map(p => [p.nr, p.crl])
                         .sort((a, b) => b[0].length - a[0].length) : [];

  // Amerikanisches Englisch und US-Glasbezeichnungen (FALLBROOK)
  const US_EN = [
    [/toughened safety glass \(ESG\) or laminated safety glass made of ESG \(VSG\)/g, 'tempered glass or laminated tempered glass'],
    [/aluminium/g, 'aluminum'], [/stabilis/g, 'stabiliz'], [/([Cc])entre/g, '$1enter'], [/([Mm])itred/g, '$1itered'], [/([Mm])itre/g, '$1iter']
  ];

  const BRANDS = {
    laengle: {
      id: 'laengle', product: 'OFFICE', company: 'Längle',
      logo: 'img/brand/laengle-logo-schwarz.webp', title: 'OFFICE Montage',
      langs: ['de', 'en'], storageKey: 'office-lang',
      nr: p => p.nr,
      img: src => src,
      text: s => s
    },
    crl: {
      id: 'crl', product: 'FALLBROOK', company: 'CRL',
      logo: 'img/brand-crl/crl-logo.png', title: 'FALLBROOK Assembly',
      hl3d: { mesh: 0x00b1eb, edge: 0x007fab },   // Hervorhebung im 3D-Modell in CRL-Blau
      langs: ['en', 'es'], storageKey: 'fallbrook-lang',
      nr: p => p.crl || p.nr,
      img: src => src.replace('img/profiles/', 'img/profiles-in/'),   // Profilzeichnungen mit Zoll-Maßen (aus der CRL-Anleitung)
      text: s => {
        if (typeof s !== 'string' || !s) return s;
        let o = s;
        NR_MAP.forEach(([a, b]) => { o = o.split(a).join(b); });
        o = o.replace(/(^|[^\w-])OFFICE(?![\w-])/g, '$1FALLBROOK').replace(/Längle/g, 'CRL');
        US_EN.forEach(([a, b]) => { o = o.replace(a, b); });
        return toInches(o);
      }
    }
  };
  window.BR = BRANDS[window.BRAND_ID] || BRANDS.laengle;
})();
