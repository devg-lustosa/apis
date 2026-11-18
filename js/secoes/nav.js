/* =====================================================================
   NAVEGAÇÃO · marca a aba da dobra atual e troca o tema (claro/escuro)
   ===================================================================== */
import { TRECHOS } from '../config.js';
import { setPolenDourado } from '../efeitos/polen.js';

const abas = [...document.querySelectorAll('.abas a')];
let atual = '';

export function atualizaNav(prog){
  const trecho = TRECHOS.find(t => prog < t.ate) || TRECHOS[TRECHOS.length - 1];
  if (trecho.id === atual) return;
  atual = trecho.id;
  abas.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + trecho.id));
  document.body.classList.toggle('claro', !!trecho.claro);
  setPolenDourado(!!trecho.polenDourado);
}
