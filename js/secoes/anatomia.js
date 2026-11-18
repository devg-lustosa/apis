/* =====================================================================
   3ª DOBRA · ANATOMIA
   - desktop: seis cards com fios até as peças da vista explodida
   - celular: uma peça destacada por vez (marcador + card), na ordem 01 → 06
   ===================================================================== */
import { ANA_MOB } from '../config.js';
import { state } from '../abelha/animacao.js';
import { PARTS, anchors, thorax } from '../abelha/modelo.js';
import { project } from '../abelha/cena.js';
import { clamp, lerp, progresso, ehCelular } from '../util/math.js';

const anchorScreen = nome => project(anchors[nome]);

/* ---------- Desktop: cards, fios e barra "Vista explodida" ---------- */
const specs = [...document.querySelectorAll('.spec')], fios = document.getElementById('fios');
const expBarra = document.getElementById('exp-barra'), expPct = document.getElementById('exp-pct');
const orbita = document.querySelector('.orbita');
fios.innerHTML = specs.map((_, i) =>
  `<path id="fio-${i}" fill="none" stroke="rgba(23,20,15,.28)" stroke-width="1"/>` +
  `<circle id="pfio-${i}" r="4" fill="#f59e0b"/>` +
  `<circle id="afio-${i}" r="9" fill="none" stroke="rgba(245,158,11,.45)" stroke-width="1"/>` +
  `<circle id="sfio-${i}" r="2.5" fill="rgba(23,20,15,.5)"/>`).join('');
const fioEls = specs.map((el, i) => ({
  el, ancora:el.dataset.ancora, esq:!!el.closest('.col.esq'),
  path:document.getElementById(`fio-${i}`), p:document.getElementById(`pfio-${i}`),
  a:document.getElementById(`afio-${i}`), s:document.getElementById(`sfio-${i}`),
}));

export function atualizaAnatomia(){
  const e = state.explode, mobile = ehCelular();
  // o círculo do fundo fica sempre centralizado no tórax da abelha
  const T = project(thorax), pin = orbita.parentElement.getBoundingClientRect();
  orbita.style.transform = `translate(${(T.x - pin.left).toFixed(1)}px, ${(T.y - pin.top).toFixed(1)}px) translate(-50%, -50%)`;
  expBarra.style.transform = `scaleX(${e.toFixed(3)})`;
  expPct.textContent = `${Math.round(e * 100)}%`;
  const vis = clamp((e - .25) / .25, 0, 1);
  fios.style.opacity = vis;
  fioEls.forEach((f, i) => {
    f.el.classList.toggle('on', e > .12 + i * .1);                  // cards aparecem um a um
    if (vis <= 0 || mobile) return;
    const r = f.el.getBoundingClientRect(), y = r.top + 30;
    const x0 = f.esq ? r.right + 14 : r.left - 14, x1 = f.esq ? x0 + 46 : x0 - 46;
    const P = anchorScreen(f.ancora);
    f.path.setAttribute('d', `M${x0.toFixed(1)} ${y.toFixed(1)}H${x1.toFixed(1)}L${P.x.toFixed(1)} ${P.y.toFixed(1)}`);
    f.p.setAttribute('cx', P.x.toFixed(1)); f.p.setAttribute('cy', P.y.toFixed(1));
    f.a.setAttribute('cx', P.x.toFixed(1)); f.a.setAttribute('cy', P.y.toFixed(1));
    f.s.setAttribute('cx', x0.toFixed(1)); f.s.setAttribute('cy', y.toFixed(1));
  });
}

/* ---------- Celular: uma peça por vez ---------- */
// qual peça 3D se mexe para cada card
const PARTE_DE = { lente:'camera', olho:'camera', antena:'camera', asaEsq:'arm1', abdomen:'battery', polen:'arm2' };
const destaque = Object.fromEntries(PARTS.map(p => [p.name, 0]));
const amEl = document.getElementById('ana-mob'), amCont = document.getElementById('am-conteudo');
const amN = document.getElementById('am-n'), amH = document.getElementById('am-h'), amP = document.getElementById('am-p'), amDots = document.getElementById('am-dots');
const alvoEl = document.getElementById('alvo'), fioMob = document.getElementById('fio-mob-p');
amDots.innerHTML = ANA_MOB.ordem.map(() => '<i></i>').join('');
let passoMob = -1, alvoMob = null, amLigado = false;

/** Roda logo depois de update(): empurra a peça destacada um pouco mais para fora e a aumenta. */
export function aplicaDestaque(dt){
  const prog = progresso(), ordem = ANA_MOB.ordem;
  alvoMob = null;
  if (ehCelular() && state.explode > .5 && prog > ANA_MOB.inicio - .05 && prog < ANA_MOB.fim){
    const passo = Math.min(ordem.length - 1, Math.floor(clamp((prog - ANA_MOB.inicio) / (ANA_MOB.fim - ANA_MOB.inicio), 0, .9999) * ordem.length));
    alvoMob = ordem[passo];
    if (passo !== passoMob){
      passoMob = passo;
      const sp = document.querySelector(`.spec[data-ancora="${alvoMob}"]`);       // reaproveita o texto dos cards do desktop
      amN.textContent = sp.querySelector('.n').textContent;
      amH.textContent = sp.querySelector('h3').textContent;
      amP.textContent = sp.querySelector('p').textContent;
      amCont.classList.remove('troca'); void amCont.offsetWidth; amCont.classList.add('troca');
      [...amDots.children].forEach((d, i) => d.classList.toggle('on', i <= passo));
    }
  } else passoMob = -1;
  const k = 1 - Math.exp(-dt * 6);
  for (const p of PARTS){
    destaque[p.name] = lerp(destaque[p.name], alvoMob && PARTE_DE[alvoMob] === p.name ? 1 : 0, k);
    const h = destaque[p.name];
    if (h > .001) p.position.addScaledVector(p.userData.dir, .32 * h);
    p.scale.setScalar(1 + .14 * h);
  }
}

/** Roda depois das matrizes atualizadas: marcador sobre a peça + linha até o card. */
export function atualizaAnatomiaMobile(){
  if (!alvoMob){
    if (amLigado){ amLigado = false; amEl.classList.remove('on'); alvoEl.style.opacity = 0; fioMob.setAttribute('d', ''); }
    return;
  }
  if (!amLigado){ amLigado = true; amEl.classList.add('on'); }
  const P = anchorScreen(alvoMob), c = amEl.getBoundingClientRect();
  alvoEl.style.opacity = 1; alvoEl.style.transform = `translate(${P.x.toFixed(1)}px, ${P.y.toFixed(1)}px)`;
  const x0 = clamp(P.x, c.left + 24, c.right - 24);
  fioMob.setAttribute('d', `M${x0.toFixed(1)} ${c.top.toFixed(1)}L${P.x.toFixed(1)} ${(P.y + 24).toFixed(1)}`);
}
