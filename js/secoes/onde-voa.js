/* =====================================================================
   4ª DOBRA · ONDE VOA · o scroll vertical move a galeria na horizontal
   ===================================================================== */
import { clamp } from '../util/math.js';

const secao = document.getElementById('onde-voa'), trilho = document.getElementById('trilho');
const fotos = [...trilho.querySelectorAll('.foto img')];
const ltProg = document.getElementById('lt-prog'), ltCont = document.getElementById('lt-cont');
const N_LOCAIS = trilho.querySelectorAll('.local').length;
let ultimo = -1;

export function atualizaOndeVoa(){
  const r = secao.getBoundingClientRect();
  if (r.bottom < 0 || r.top > innerHeight) return;             // fora da tela: nada a fazer
  const p = clamp(-r.top / Math.max(1, secao.offsetHeight - innerHeight), 0, 1);
  if (Math.abs(p - ultimo) < 1e-4) return; ultimo = p;
  const maxX = Math.max(0, trilho.scrollWidth - innerWidth);
  trilho.style.transform = `translate3d(${(-p * maxX).toFixed(1)}px, 0, 0)`;
  // paralaxe: cada foto desliza um pouco dentro da moldura
  for (const img of fotos){
    const b = img.parentElement.getBoundingClientRect();
    const off = (b.left + b.width / 2 - innerWidth / 2) / innerWidth;
    img.style.transform = `translateX(${(-off * 9).toFixed(2)}%) scale(1.14)`;
  }
  ltProg.style.transform = `scaleX(${p.toFixed(4)})`;
  const n = Math.min(N_LOCAIS, 1 + Math.floor(p * N_LOCAIS * .999));
  ltCont.textContent = `${String(n).padStart(2, '0')} / ${String(N_LOCAIS).padStart(2, '0')}`;
}
addEventListener('resize', () => { ultimo = -1; });
