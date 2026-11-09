/* 色彩科学：Oklab 感知色差、最近色匹配、熨烫后色值换算 */
function rebuildIronHexes() {
  ironHexes = ironOn ? stateWorking.map(c => ironHexOf(c.rgb, ironStrength / 100)) : null;
}


/* --- 色差：RGB 欧氏 / Oklab 感知色差 --- */
function srgbToOklab(rgb) {
  const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const r = f(rgb[0]), g = f(rgb[1]), b = f(rgb[2]);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s
  ];
}

const labCache = new WeakMap();
function paletteOklab(colors) {
  let arr = labCache.get(colors);
  if (!arr) { arr = colors.map(c => srgbToOklab(c.rgb)); labCache.set(colors, arr); }
  return arr;
}


function nearestColor(rgb, colors) {
  if (matchMetric === 'oklab') {
    const labs = paletteOklab(colors);
    const p = srgbToOklab(rgb);
    const L = p[0], A = p[1], B = p[2];
    let bi = 0, bd = Infinity;
    for (let i = 0; i < labs.length; i++) {
      const c = labs[i];
      const dl = L - c[0], da = A - c[1], db = B - c[2];
      const d = dl * dl + da * da + db * db;
      if (d < bd) { bd = d; bi = i; }
    }
    return bi;
  }
  let bi = 0, bd = Infinity;
  for (let i = 0; i < colors.length; i++) {
    const c = colors[i].rgb;
    const dr = rgb[0] - c[0], dg = rgb[1] - c[1], db = rgb[2] - c[2];
    const d = dr * dr + dg * dg + db * db;
    if (d < bd) { bd = d; bi = i; }
  }
  return bi;
}
