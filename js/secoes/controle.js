/* =====================================================================
   2ª DOBRA · CONTROLE TOTAL
   - textos dos dois lados da abelha (entram, abrem caminho para o zoom e voltam)
   - visão da câmera: o vídeo aparece dentro do furo da lente e avança com o scroll
   ===================================================================== */
import { DOBRA2, VIDEO } from '../config.js';
import { state } from '../abelha/animacao.js';
import { anchors, antennas } from '../abelha/modelo.js';
import { project } from '../abelha/cena.js';
import { clamp, lerp, easeInOutCubic, easeOutCubic, ehCelular } from '../util/math.js';

/* ---------- Textos laterais ---------- */
const ladoE = document.getElementById('lado-esq'), ladoD = document.getElementById('lado-dir');
export function atualizaLados(prog){
  const [zi0, zi1] = DOBRA2.zoomIn, [zo0, zo1] = DOBRA2.zoomOut;
  const entra = easeOutCubic(clamp((prog - .45) / .55, 0, 1));                          // chegam junto com a abelha
  const sai = easeInOutCubic(clamp((prog - zi0) / ((zi1 - zi0) * .55), 0, 1));         // abrem caminho para o zoom
  const volta = easeOutCubic(clamp((prog - zo0 - (zo1 - zo0) * .35) / ((zo1 - zo0) * .65), 0, 1));
  const v = entra * (prog < zo0 ? 1 - sai : volta);
  const dx = (1 - v) * innerWidth * .14;
  ladoE.style.setProperty('--dx', `${-dx}px`); ladoE.style.opacity = v;
  ladoD.style.setProperty('--dx', `${dx}px`); ladoD.style.opacity = v;
}

/* ---------- Visão da câmera ---------- */
const visaoEl = document.getElementById('visao'), video = document.getElementById('video'), hud = document.getElementById('hud');
const leg1 = document.getElementById('leg1'), leg2 = document.getElementById('leg2');
const hudBarra = document.getElementById('hud-barra'), hudFlor = document.getElementById('hud-flor'), hudTempo = document.getElementById('hud-tempo');

/** coberto = o vídeo ocupa a tela inteira (aí a abelha e o fundo não precisam ser redesenhados). */
export const visao = { coberto:false, visivel:false };

let vidDur = 6.97, vidPronto = false, vidT = 0;
video.addEventListener('loadedmetadata', () => { vidDur = video.duration || vidDur; vidPronto = true; });
const VIDEO_SRC = ehCelular() ? VIDEO.celular : VIDEO.desktop;
// baixa o vídeo inteiro para a memória: o scroll nunca espera a rede para avançar
fetch(VIDEO_SRC).then(r => { if (!r.ok) throw 0; return r.blob(); })
  .then(b => { video.src = URL.createObjectURL(b); })
  .catch(() => { video.src = VIDEO_SRC; });   // abrindo o HTML direto do disco, usa o caminho normal
// iOS só deixa avançar o vídeo depois de um toque: dá play e pausa no primeiro toque
addEventListener('touchstart', () => { video.play().then(() => video.pause()).catch(() => {}); }, { once:true, passive:true });

/** Raio e centro (px) do furo da lente na tela. */
function lensScreen(){
  const c = project(anchors.lente), e = project(anchors.lensEdge);
  return { x:c.x, y:c.y, r:Math.hypot(e.x - c.x, e.y - c.y) };
}
const faixa = (v, a, b, f = .07) => clamp(Math.min((v - a) / f, (b - v) / f), 0, 1);

export function atualizaVisao(prog, dt){
  const z = state.lens, abre = clamp((z - .6) / .25, 0, 1);
  visao.coberto = false;
  if (abre <= 0){
    if (visao.visivel){ visao.visivel = false; visaoEl.style.visibility = 'hidden'; }
  } else {
    const L = lensScreen(), r = L.r * abre;
    if (!visao.visivel){ visao.visivel = true; visaoEl.style.visibility = 'visible'; }
    // quando o furo já cobre a tela inteira, tira o recorte (economiza pintura a cada quadro)
    visao.coberto = abre >= 1 && r > Math.hypot(Math.max(L.x, innerWidth - L.x), Math.max(L.y, innerHeight - L.y)) * 1.02;
    const clip = visao.coberto ? 'none' : `circle(${r.toFixed(1)}px at ${L.x.toFixed(1)}px ${L.y.toFixed(1)}px)`;
    if (visaoEl.style.clipPath !== clip) visaoEl.style.clipPath = clip;
  }
  // o tempo do vídeo desliza até a posição do scroll (sem saltos a cada giro da roda)
  const vp = clamp((prog - DOBRA2.video[0]) / (DOBRA2.video[1] - DOBRA2.video[0]), 0, 1);
  const alvo = vp * Math.max(0, vidDur - .03);
  vidT = Math.abs(alvo - vidT) < .002 ? alvo : lerp(vidT, alvo, 1 - Math.exp(-dt * 10));
  if (vidPronto && abre > 0 && !video.seeking && Math.abs(video.currentTime - vidT) > .5 / 60) video.currentTime = vidT;
  // interface de câmera por cima do vídeo
  hud.style.opacity = clamp((z - .9) / .08, 0, 1);
  hudBarra.style.transform = `scaleX(${vp.toFixed(4)})`;
  hudFlor.textContent = 147 + Math.floor(vp * 6);
  hudTempo.textContent = `00:${String(Math.floor(vidT)).padStart(2, '0')}:${String(Math.floor((vidT % 1) * 60)).padStart(2, '0')}`;
  leg1.style.opacity = faixa(vp, .06, .46); leg1.style.transform = `translate(-50%, ${(1 - faixa(vp, .06, .46)) * 14}px)`;
  leg2.style.opacity = faixa(vp, .54, .94); leg2.style.transform = `translate(-50%, ${(1 - faixa(vp, .54, .94)) * 14}px)`;
  // as antenas ficam na frente da lente: escondidas durante o mergulho
  const antOk = z < .4; for (const a of antennas) a.ant.visible = antOk;
}
