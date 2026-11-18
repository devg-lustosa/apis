/* =====================================================================
   PÓLEN · partículas com tamanho, cor e transparência por grão
   Um único Points com 700 grãos reaproveitados em fila circular.
   ===================================================================== */
import * as THREE from 'three';
import { scene, renderer, camera } from '../abelha/cena.js';
import { stage, thorax, anchors, pollenMeshes } from '../abelha/modelo.js';
import { VOO } from '../config.js';

const MAXP = 700;
const P_pos = new Float32Array(MAXP * 3), P_col = new Float32Array(MAXP * 3), P_size = new Float32Array(MAXP), P_alpha = new Float32Array(MAXP);
const P_vel = new Float32Array(MAXP * 3), P_life = new Float32Array(MAXP), P_max = new Float32Array(MAXP), P_base = new Float32Array(MAXP), P_seed = new Float32Array(MAXP);

const pGeo = new THREE.BufferGeometry();
const dyn = (arr, n) => new THREE.BufferAttribute(arr, n).setUsage(THREE.DynamicDrawUsage);
pGeo.setAttribute('position', dyn(P_pos, 3));
pGeo.setAttribute('aColor', dyn(P_col, 3));
pGeo.setAttribute('aSize', dyn(P_size, 1));
pGeo.setAttribute('aAlpha', dyn(P_alpha, 1));

const pollenMat = new THREE.ShaderMaterial({
  uniforms:{ uScale:{ value:1 } },
  vertexShader:`
    attribute float aSize; attribute float aAlpha; attribute vec3 aColor;
    uniform float uScale; varying float vA; varying vec3 vC;
    void main(){
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mv;
      gl_PointSize = max(1.0, aSize * uScale / -mv.z);   // tamanho em unidades do mundo → pixels
      vA = aAlpha; vC = aColor;
    }`,
  fragmentShader:`
    varying float vA; varying vec3 vC;
    void main(){
      vec2 c = gl_PointCoord - 0.5; float d = length(c);
      if (d > 0.5) discard;
      float a = smoothstep(0.5, 0.3, d) * vA;
      vec3 col = mix(vC, vC * 0.78, smoothstep(0.0, 0.48, d)); // grão com centro claro e borda mais densa
      gl_FragColor = vec4(col, a);
      #include <colorspace_fragment>
    }`,
  transparent:true, depthWrite:false,
});
const pollen = new THREE.Points(pGeo, pollenMat);
pollen.frustumCulled = false; pollen.renderOrder = 20;
scene.add(pollen);

// sobre o fundo amarelo: grãos brancos e creme, com alguns âmbar escuros para dar profundidade
const POLLEN_CLARO = ['#ffffff', '#ffffff', '#fff6d6', '#ffe9a8', '#c27400'].map(c => new THREE.Color(c));
// sobre fundo claro (anatomia, onde voa): grãos dourados e âmbar
const POLLEN_DOURADO = ['#ffc21a', '#ffb000', '#f59e0b', '#e08a00', '#c27400'].map(c => new THREE.Color(c));
let dourado = false;
/** Escolhe a paleta conforme o fundo da seção atual. */
export function setPolenDourado(v){ dourado = v; }

let pHead = 0;
/** Solta um grão na posição p (mundo) com velocidade v. */
export function emitPollen(p, v, size){
  const i = pHead; pHead = (pHead + 1) % MAXP; const j = i * 3;
  P_pos[j] = p.x; P_pos[j + 1] = p.y; P_pos[j + 2] = p.z;
  P_vel[j] = v.x; P_vel[j + 1] = v.y; P_vel[j + 2] = v.z;
  const pal = dourado ? POLLEN_DOURADO : POLLEN_CLARO, c = pal[(Math.random() * pal.length) | 0];
  P_col[j] = c.r; P_col[j + 1] = c.g; P_col[j + 2] = c.b;
  P_base[i] = size; P_life[i] = 0; P_max[i] = 1 + Math.random() * 1.3; P_seed[i] = Math.random() * 6.283;
}

/** Direção aleatória (vetor unitário) escrita em v. */
export const randUnit = v => { const u = Math.random() * 2 - 1, th = Math.random() * 6.283, r = Math.sqrt(1 - u * u); return v.set(r * Math.cos(th), u, r * Math.sin(th)); };

const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _e = new THREE.Vector3(), _o = new THREE.Vector3(), _vel = new THREE.Vector3();

/** Nuvem de pólen saindo do corpo (no clique / pirueta). */
export function pollenBurst(n = 120){
  const k = stage.scale.x;
  thorax.getWorldPosition(_a); anchors.abdomen.getWorldPosition(_b);
  for (let i = 0; i < n; i++){
    _e.copy(_a).lerp(_b, Math.random()).add(randUnit(_o).multiplyScalar(k * .12 * Math.random()));
    randUnit(_vel); _vel.y = Math.abs(_vel.y) * .8 + .25; _vel.normalize().multiplyScalar(k * (1.2 + Math.random() * 2.4));
    emitPollen(_e, _vel, k * (.022 + Math.random() * .035));
  }
}

/** Rastro em espiral durante a pirueta: grãos soltos pelos cestos de pólen. */
export function pollenTrail(){
  const k = stage.scale.x;
  for (const m of pollenMeshes){
    m.getWorldPosition(_a);
    for (let j = 0; j < 3; j++){
      _e.copy(_a).add(randUnit(_o).multiplyScalar(k * .04));
      randUnit(_vel).multiplyScalar(k * (.2 + Math.random() * .6));
      emitPollen(_e, _vel, k * (.018 + Math.random() * .026));
    }
  }
}

/** Garoa leve: alguns grãos caindo da abelha (sobre a flor da pré-venda). */
let garoaAcc = 0;
export function polenGaroa(dt, porSegundo = 9){
  if (dt <= 0) return;
  garoaAcc += dt * porSegundo;
  const k = stage.scale.x;
  while (garoaAcc >= 1){
    garoaAcc -= 1;
    const m = pollenMeshes[(Math.random() * pollenMeshes.length) | 0];
    (Math.random() < .5 ? m : thorax).getWorldPosition(_e);
    _e.add(randUnit(_o).multiplyScalar(k * .05));
    _vel.set((Math.random() - .5) * .3, -.25 - Math.random() * .35, (Math.random() - .5) * .3).multiplyScalar(k);
    emitPollen(_e, _vel, k * (.014 + Math.random() * .02));
  }
}

/** Física dos grãos: arrasto, gravidade, deriva e vento; some com o tempo. */
export function updatePollen(dt){
  const k = stage.scale.x, g = .6 * k, drag = Math.exp(-dt * 1.7), sopro = VOO.vento / 40 * k * 1.4;
  for (let i = 0; i < MAXP; i++){
    if (P_max[i] <= 0){ P_alpha[i] = 0; continue; }
    P_life[i] += dt;
    const u = P_life[i] / P_max[i];
    if (u >= 1){ P_max[i] = 0; P_alpha[i] = 0; continue; }
    const j = i * 3;
    P_vel[j] *= drag; P_vel[j + 1] = P_vel[j + 1] * drag - g * dt; P_vel[j + 2] *= drag;
    P_vel[j] += (Math.sin(P_life[i] * 3 + P_seed[i]) * k * .25 + sopro) * dt;
    P_pos[j] += P_vel[j] * dt; P_pos[j + 1] += P_vel[j + 1] * dt; P_pos[j + 2] += P_vel[j + 2] * dt;
    P_alpha[i] = Math.min(1, u / .08) * Math.pow(1 - u, 1.4);
    P_size[i] = P_base[i] * (1 - .35 * u);
  }
  for (const n of ['position', 'aSize', 'aAlpha', 'aColor']) pGeo.attributes[n].needsUpdate = true;
}

/** Converte o tamanho dos grãos (mundo) em pixels conforme a tela. */
export function resizePollen(){
  pollenMat.uniforms.uScale.value = innerHeight * renderer.getPixelRatio() / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
}
