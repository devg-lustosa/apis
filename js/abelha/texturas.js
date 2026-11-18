/* =====================================================================
   TEXTURAS PROCEDURAIS · desenhadas em canvas (nenhuma imagem externa)
   ===================================================================== */
import * as THREE from 'three';
import { renderer } from './cena.js';
import { RNG } from '../util/math.js';

/** Cria uma textura desenhando num canvas. */
export function canvasTex(w, h, draw, srgb = true){
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return t;
}

/** Gradiente radial genérico: stops = [[offset, 'cor css'], ...] */
export function radialTex(stops){
  return canvasTex(256, 256, g => {
    const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    stops.forEach(([o, c]) => gr.addColorStop(o, c));
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  });
}

/** Pelagem: fios curtos claros/escuros "penteados", em cinza para ser tingida pelo material. */
export const furTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#bdbdbd'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 6000; i++){
    const x = RNG() * w, y = RNG() * h, l = 3 + RNG() * 9, a = Math.PI / 2 + (RNG() - .5) * 1.2;
    g.strokeStyle = RNG() < .55 ? `rgba(255,255,255,${.15 + RNG() * .45})` : `rgba(0,0,0,${.12 + RNG() * .35})`;
    g.lineWidth = .5 + RNG() * 1.1;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
});
furTex.wrapS = furTex.wrapT = THREE.RepeatWrapping; furTex.repeat.set(4, 3);

/** Omatídeos: grade hexagonal usada como relevo dos olhos compostos (tamanho escolhido para repetir sem emenda). */
const HEX_R = 256 / 18 / Math.sqrt(3);
export const hexTex = canvasTex(256, Math.round(20 * HEX_R * 1.5), (g, w, h) => {
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#000'; g.lineWidth = 2.2;
  const dx = HEX_R * Math.sqrt(3), dy = HEX_R * 1.5;
  for (let row = -1; row * dy < h + HEX_R; row++){
    for (let col = -1; col * dx < w + dx; col++){
      const cx = col * dx + (Math.abs(row) % 2 ? dx / 2 : 0), cy = row * dy;
      g.beginPath();
      for (let k = 0; k < 6; k++){ const a = Math.PI / 6 + k * Math.PI / 3; const px = cx + HEX_R * Math.cos(a), py = cy + HEX_R * Math.sin(a); k ? g.lineTo(px, py) : g.moveTo(px, py); }
      g.closePath(); g.stroke();
    }
  }
}, false);
hexTex.wrapS = hexTex.wrapT = THREE.RepeatWrapping; hexTex.repeat.set(10, 5);

/** Logo "APIS" aplicada sobre o escudo dorsal. */
export const logoTex = canvasTex(512, 128, (g, w, h) => {
  g.clearRect(0, 0, w, h);
  g.fillStyle = 'rgba(255,255,255,.9)';
  g.font = 'bold 92px "Helvetica Neue", Arial, sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  try { g.letterSpacing = '12px'; } catch(e) {}
  g.fillText('APIS', w / 2, h / 2 + 4);
});

/** Brilho suave (sprites do pólen luminoso) e sombra de contato. */
export const glowTex = radialTex([[0, 'rgba(255,255,255,1)'], [.25, 'rgba(255,255,255,.55)'], [1, 'rgba(255,255,255,0)']]);
export const shadowTex = radialTex([[0, 'rgba(0,0,0,.55)'], [1, 'rgba(0,0,0,0)']]);
