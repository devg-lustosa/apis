/* =====================================================================
   CENA 3D · renderer, câmera, luzes, ambiente e conversões tela ↔ mundo
   O canvas é transparente e fica fixo por cima da página (z-index 40).
   ===================================================================== */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { BREAKPOINT } from '../config.js';

export const renderer = new THREE.WebGLRenderer({ alpha:true, antialias:true });
renderer.setClearColor(0, 0);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.localClippingEnabled = true;                 // usado no corte do caule da flor
/** Teto de resolução do 3D: 1,5x no desktop, 2x no celular. */
export const PR_MAX = Math.min(window.devicePixelRatio, innerWidth >= BREAKPOINT ? 1.5 : 2);
renderer.setPixelRatio(PR_MAX);
renderer.domElement.id = 'abelha';
document.body.appendChild(renderer.domElement);

export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(28, innerWidth / innerHeight, 0.01, 200);
camera.position.set(0, 0, 14);
camera.lookAt(0, 0, 0);

// iluminação de estúdio (reflexos) + luz principal, luz de contorno quente e luz ambiente
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
const keyLight = new THREE.DirectionalLight(0xffffff, 2.2); keyLight.position.set(-4, 6, 5); scene.add(keyLight);
const rimLight = new THREE.DirectionalLight(0xff7a45, 3.0); rimLight.position.set(5, 2, -6); scene.add(rimLight);
scene.add(new THREE.HemisphereLight(0xffffff, 0x222222, 0.6));

/** wpp = unidades do mundo por pixel no plano z = 0 (atualizado em resize). */
export const view = { wpp:1 };

export function resize(){
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix();
  view.wpp = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 14 / h;
}

const _v = new THREE.Vector3();
/** Ponto do mundo → pixel da tela. */
export function projectVec(v){
  _v.copy(v).project(camera);
  return { x:(_v.x * .5 + .5) * innerWidth, y:(-_v.y * .5 + .5) * innerHeight };
}
/** Posição de um objeto 3D → pixel da tela. */
export function project(obj){ obj.getWorldPosition(_v); return projectVec(_v); }
