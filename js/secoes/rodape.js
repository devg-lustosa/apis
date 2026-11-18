/* =====================================================================
   RODAPÉ · a marca gigante sobe ao entrar e "voltar ao topo" rola suave
   ===================================================================== */
import { clamp, easeOutCubic } from '../util/math.js';

const rdTexto = document.getElementById('rd-texto'), rodapeEl = document.getElementById('rodape');

export function atualizaRodape(){
  const r = rodapeEl.getBoundingClientRect();
  if (r.top > innerHeight) return;
  const p = clamp(1 - r.top / innerHeight, 0, 1);
  rdTexto.setAttribute('transform', `translate(0 ${((1 - easeOutCubic(p)) * 120).toFixed(1)})`);
}

export function iniciarRodape(){
  document.getElementById('voltar-topo').addEventListener('click', e => { e.preventDefault(); scrollTo({ top:0, behavior:'smooth' }); });
}
