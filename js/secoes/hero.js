/* =====================================================================
   1ª DOBRA · HERO · dica "clique na abelha" e altitude no texto vertical
   ===================================================================== */
import { state, tempo } from '../abelha/animacao.js';
import { contagem } from '../voo/interacao.js';
import { VOO } from '../config.js';
import { fmt } from '../util/math.js';

const dicaEl = document.getElementById('dica');
const vertAlt = document.getElementById('vert-alt');
let dicaPronta = false, dicaVis = -1, altTxt = '';

export function atualizaHero(prog){
  // a dica aparece depois que a abelha chega e some na primeira pirueta ou ao rolar
  if (!dicaPronta && tempo.t > 2.4 && contagem.piruetas === 0) dicaPronta = true;
  const dv = dicaPronta && contagem.piruetas === 0 && prog < .25 ? 1 : 0;
  if (dv !== dicaVis){ dicaVis = dv; dicaEl.style.opacity = dv; }
  if (dv){
    const cx = innerWidth / 2 + state.x, cy = innerHeight / 2 + state.y;
    dicaEl.style.transform = `translate(calc(${cx}px - 50%), ${cy - state.s * .3 - 30}px)`;
  }
  const t = fmt(VOO.alt);
  if (t !== altTxt){ altTxt = t; vertAlt.textContent = t; }
}
