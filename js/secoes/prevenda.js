/* =====================================================================
   5ª DOBRA · PRÉ-VENDA
   - kits, parcela, Pix e contador (valores em config.PREVENDA)
   - flor 3D presa à div #pad, caule cortado na borda da área amarela
   - pólen caindo enquanto a abelha paira sobre a flor
   ===================================================================== */
import * as THREE from 'three';
import { PREVENDA, LIFT_FLOR } from '../config.js';
import { camera, view } from '../abelha/cena.js';
import { SPAN } from '../abelha/modelo.js';
import { pad, cortePlano } from '../abelha/flor.js';
import { state } from '../abelha/animacao.js';
import { resolvePose, POSE_FLOR } from '../voo/poses.js';
import { polenGaroa } from '../efeitos/polen.js';
import { clamp } from '../util/math.js';

/* ---------- Kits e preço ---------- */
const brl = (v, cents = true) => v.toLocaleString('pt-BR', { style:'currency', currency:'BRL', minimumFractionDigits:cents ? 2 : 0, maximumFractionDigits:cents ? 2 : 0 });
const kitBtns = [...document.querySelectorAll('.kit')];
const prParcela = document.getElementById('pr-parcela'), prPix = document.getElementById('pr-pix'), prSub = document.getElementById('pr-sub');

function escolherKit(id){
  const k = PREVENDA.kits[id];
  kitBtns.forEach(b => { const on = b.dataset.kit === id; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
  prParcela.textContent = brl(k.preco / PREVENDA.parcelas);
  prPix.textContent = brl(k.preco * (1 - PREVENDA.descontoPix));
  prSub.textContent = `${k.nome} · Pré-venda`;
}

/* ---------- Contador até o fim da pré-venda ---------- */
const rl = ['d', 'h', 'm', 's'].map(k => document.getElementById(`rl-${k}`));
function tickRelogio(){
  const r = Math.max(0, Math.floor((Date.parse(PREVENDA.fim) - Date.now()) / 1000));
  const v = [Math.floor(r / 86400), Math.floor(r % 86400 / 3600), Math.floor(r % 3600 / 60), r % 60];
  v.forEach((n, i) => { rl[i].textContent = String(n).padStart(2, '0'); });
}

/** Preenche preços, lote e contador (uma vez, ao carregar). */
export function iniciarPrevenda(){
  document.getElementById('pr-vezes').textContent = `${PREVENDA.parcelas}x sem juros`;
  document.getElementById('pr-desc').textContent = `-${Math.round(PREVENDA.descontoPix * 100)}%`;
  kitBtns.forEach(b => {
    b.querySelector('[data-preco]').textContent = brl(PREVENDA.kits[b.dataset.kit].preco, false);
    b.addEventListener('click', () => escolherKit(b.dataset.kit));
  });
  escolherKit('essencial');
  document.getElementById('est-barra').style.width = `${PREVENDA.reservado}%`;
  document.getElementById('est-txt').innerHTML = `<b>${PREVENDA.reservado}% reservado</b> · restam ${PREVENDA.restam} unidades`;
  tickRelogio(); setInterval(tickRelogio, 1000);
}

/* ---------- Flor presa à div #pad (rola junto com a seção; a abelha é que vai até ela) ---------- */
const padEl = document.getElementById('pad'), _eFlor = new THREE.Euler();
export function posicionaFlor(){
  if (!pad.visible || !padEl || !POSE_FLOR) return;
  const r = padEl.getBoundingClientRect(), P = resolvePose(POSE_FLOR);
  pad.position.set((r.left + r.width / 2 - innerWidth / 2) * view.wpp, -(r.top + r.height / 2 - innerHeight / 2) * view.wpp, 0);
  pad.quaternion.setFromEuler(_eFlor.set(P.tilt, 0, 0));
  pad.scale.setScalar(P.s * view.wpp / SPAN);
}

/* ---------- Caule cortado na borda de baixo da área amarela (não invade o painel branco) ---------- */
const prEsq = document.querySelector('.pr-esq');
const _c1 = new THREE.Vector3(), _c2 = new THREE.Vector3(), _c3 = new THREE.Vector3();
function atualizaCorte(){
  const yb = clamp(prEsq.getBoundingClientRect().bottom, -innerHeight, innerHeight * 2);
  const ny = -(yb / innerHeight) * 2 + 1;
  _c1.set(-1, ny, .5).unproject(camera); _c2.set(1, ny, .5).unproject(camera);
  cortePlano.setFromCoplanarPoints(camera.position, _c1, _c2);
  _c3.set(0, ny + .2, .5).unproject(camera);                       // o lado de cima da linha é o que fica visível
  if (cortePlano.distanceToPoint(_c3) < 0) cortePlano.negate();
}

/* ---------- Pólen enquanto paira sobre a flor ---------- */
let polinizando = false;
export function atualizaPrevenda(){
  polinizando = state.pad > .9 && Math.abs(state.lift - LIFT_FLOR) < .12 && state.lens < .01;
  atualizaCorte();
}
export function pararPolinizacao(){ polinizando = false; }
export function garoaPolen(dt){ if (polinizando) polenGaroa(dt); }
