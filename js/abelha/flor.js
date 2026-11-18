/* =====================================================================
   SOMBRA DE CONTATO E FLOR 3D (onde a abelha paira na pré-venda)
   A flor fica num grupo próprio (pad), posicionado pela seção de pré-venda.
   ===================================================================== */
import * as THREE from 'three';
import { scene } from './cena.js';
import { stage, FOOT } from './modelo.js';
import { shadowTex } from './texturas.js';
import { ball, segment } from './geometria.js';
import { RNG, V } from '../util/math.js';

/* ---------- Sombra de contato no "chão" do palco ---------- */
export const shadowMat = new THREE.MeshBasicMaterial({ map:shadowTex, transparent:true, depthWrite:false, opacity:0 });
export const shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4), shadowMat);
shadow.rotation.x = -Math.PI / 2; shadow.position.y = -FOOT + .003; shadow.renderOrder = 5;
stage.add(shadow);

/* ---------- Flor: caule com folhas, sépalas, pétalas em taça, miolo e estames ---------- */
export const pad = new THREE.Group(); scene.add(pad);
export const flor = new THREE.Group(); pad.add(flor);
export const caule = new THREE.Group(); flor.add(caule);
/** Plano de corte: o caule só aparece dentro da área amarela da seção (atualizado a cada quadro). */
export const cortePlano = new THREE.Plane(new THREE.Vector3(0, 1, 0), 1e6);
/** Grupos das pétalas (girados para abrir a flor). userData.base = abertura em repouso. */
export const petalas = [];

{
  // --- pétala: forma plana curvada como uma taça, côncava na largura, com a ponta virando para fora
  const PET_L = 1.05;
  const petShape = new THREE.Shape();
  petShape.moveTo(0, 0);
  petShape.bezierCurveTo(.2, .16, .3, .55, .17, .9);
  petShape.quadraticCurveTo(.06, 1.04, 0, .99);                     // ponta levemente recortada
  petShape.quadraticCurveTo(-.06, 1.04, -.17, .9);
  petShape.bezierCurveTo(-.3, .55, -.2, .16, 0, 0);
  const geo = new THREE.ShapeGeometry(petShape, 32);
  const pos = geo.attributes.position, cores = [], c = new THREE.Color();
  const cBase = new THREE.Color('#fff0b3'), cMeio = new THREE.Color('#ffffff'), cPonta = new THREE.Color('#ffc2d6');
  for (let i = 0; i < pos.count; i++){
    const x = pos.getX(i), y = pos.getY(i);                         // y = ao longo da pétala, x = largura
    const alt = y * .42 + 1.5 * x * x - .2 * Math.max(0, y - .62) ** 2;
    pos.setXYZ(i, x * PET_L, alt * PET_L, -y * PET_L);              // deitada, apontando para −Z
    if (y < .28) c.copy(cBase).lerp(cMeio, y / .28); else c.copy(cMeio).lerp(cPonta, Math.max(0, (y - .5) / .5) ** 1.4);
    cores.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cores, 3));
  geo.computeVertexNormals();
  const petMat = new THREE.MeshPhysicalMaterial({ vertexColors:true, roughness:.5, metalness:0, sheen:1, sheenColor:'#ffd9e6', sheenRoughness:.45, side:THREE.DoubleSide });
  // duas voltas de pétalas: a de fora mais aberta, a de dentro menor
  [[9, 0, 1, 0, .05], [9, Math.PI / 9, .82, .03, .06]].forEach(([n, rot, esc, dy, fecha]) => {
    for (let k = 0; k < n; k++){
      const giro = new THREE.Group(); giro.rotation.y = rot + k / n * Math.PI * 2 + (RNG() - .5) * .12; giro.position.y = dy; flor.add(giro);
      const abre = new THREE.Group(); abre.userData.base = fecha; giro.add(abre);
      const m = new THREE.Mesh(geo, petMat); m.scale.setScalar(esc * (.94 + RNG() * .1)); abre.add(m);
      petalas.push(abre);
    }
  });

  // --- sépalas verdes por baixo
  const verde = new THREE.MeshPhysicalMaterial({ color:'#5d8f36', roughness:.6, sheen:.6, sheenColor:'#a8d47a', side:THREE.DoubleSide, clippingPlanes:[cortePlano] });
  for (let k = 0; k < 5; k++){
    const g = new THREE.Group(); g.rotation.y = k / 5 * Math.PI * 2 + .3; flor.add(g);
    const sep = new THREE.Mesh(new THREE.ConeGeometry(.09, .42, 6, 1, true), verde);
    sep.geometry.translate(0, .21, 0); sep.rotation.x = -1.9; sep.position.y = -.04; sep.scale.set(1, 1, .35); g.add(sep);
  }

  // --- miolo, pistilo e estames com anteras de pólen
  const miolo = new THREE.Mesh(new THREE.SphereGeometry(.16, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshPhysicalMaterial({ color:'#c6cf46', roughness:.7, sheen:1, sheenColor:'#f3ff9a' }));
  miolo.scale.set(1, .5, 1); miolo.position.y = .03; flor.add(miolo);
  const pistilo = new THREE.Mesh(new THREE.CylinderGeometry(.018, .028, .22, 10), new THREE.MeshPhysicalMaterial({ color:'#d7e07a', roughness:.6 }));
  pistilo.position.y = .16; flor.add(pistilo);
  flor.add(ball(.034, new THREE.MeshPhysicalMaterial({ color:'#e9ef9c', roughness:.5 }), V(0, .28, 0), 14));
  const filMat = new THREE.MeshPhysicalMaterial({ color:'#f6e7a8', roughness:.6 });
  const antMat = new THREE.MeshStandardMaterial({ color:'#f7b500', roughness:.55, emissive:'#ff9d00', emissiveIntensity:.12 });
  for (let k = 0; k < 30; k++){
    const a = k * 2.39996, r0 = .1 + (k % 3) * .02, r1 = .22 + RNG() * .1, h = .2 + RNG() * .1;
    const A = V(Math.cos(a) * r0, .05, Math.sin(a) * r0), B = V(Math.cos(a) * r1, h, Math.sin(a) * r1);
    flor.add(segment(A, B, .007, .005, filMat, 5));
    const an = ball(.026, antMat, B, 8); an.scale.set(1, .7, 1.3); an.lookAt(B.clone().multiplyScalar(2)); flor.add(an);
  }

  // --- caule curvo descendo para fora da cena, com duas folhas
  const cauleCurva = new THREE.CatmullRomCurve3([V(0, 0, 0), V(.05, -.9, .1), V(.25, -2.1, .3), V(.2, -3.6, .2)]);
  caule.add(new THREE.Mesh(new THREE.TubeGeometry(cauleCurva, 40, .07, 12), verde));
  const folhaShape = new THREE.Shape();
  folhaShape.moveTo(0, 0); folhaShape.bezierCurveTo(.26, .18, .3, .65, 0, 1.05); folhaShape.bezierCurveTo(-.3, .65, -.26, .18, 0, 0);
  const folhaGeo = new THREE.ShapeGeometry(folhaShape, 24);
  {
    const fp = folhaGeo.attributes.position;
    for (let i = 0; i < fp.count; i++){ const x = fp.getX(i), y = fp.getY(i); fp.setXYZ(i, x * .95, y * .95, (1.1 * x * x - .25 * y * y) * .95); }
    folhaGeo.computeVertexNormals();
  }
  const folhaMat = new THREE.MeshPhysicalMaterial({ color:'#6aa142', roughness:.5, sheen:.8, sheenColor:'#c4ec8f', side:THREE.DoubleSide, clippingPlanes:[cortePlano] });
  [[.42, 1, -.4], [.66, -1, .5]].forEach(([t, lado, giro]) => {
    const pt = cauleCurva.getPoint(t);
    const f = new THREE.Mesh(folhaGeo, folhaMat);
    f.position.copy(pt); f.rotation.set(-.4, giro, lado * -1.05); caule.add(f);
  });
}
