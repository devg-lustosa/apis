/* =====================================================================
   GEOMETRIA · peças genéricas reutilizadas pelo modelo e pela flor
   ===================================================================== */
import * as THREE from 'three';
import { M } from './materiais.js';
import { RNG, V, UP, lerp } from '../util/math.js';

/** Esfera de raio r. */
export function ball(r, mat, p, seg = 20){
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.max(8, seg * .6 | 0)), mat);
  if (p) m.position.copy(p);
  return m;
}

/** Tubo cônico entre dois pontos (raio r0 em a, r1 em b). */
export function segment(a, b, r0, r1, mat, seg = 14){
  const d = new THREE.Vector3().subVectors(b, a); const len = d.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, len, seg, 1), mat);
  m.position.copy(a).addScaledVector(d, .5);
  m.quaternion.setFromUnitVectors(UP, d.normalize());
  return m;
}

/** Tubo curvo passando pelos pontos. */
export const tube = (pts, r, mat, segs = 20, radial = 10) =>
  new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), segs, r, radial, false), mat);

/* ---------- Pelos instanciados ---------- */
const hairGeo = new THREE.ConeGeometry(.0065, 1, 4, 1, true); hairGeo.translate(0, .5, 0);
export const GOLD1 = new THREE.Color('#ffd25e'), GOLD2 = new THREE.Color('#d08a12');
export const DARK1 = new THREE.Color('#2a1d0e'), DARK2 = new THREE.Color('#5a3d16');

function randDir(){ const u = RNG() * 2 - 1, th = RNG() * Math.PI * 2, r = Math.sqrt(1 - u * u); return V(r * Math.cos(th), u, r * Math.sin(th)); }

/** Amostrador sobre um elipsoide: devolve ponto, direção do pelo e direção original. */
export function ellSample(c, a, b, cz, filter, comb){
  return () => {
    const d = randDir(); if (!filter(d)) return null;
    const p = V(c.x + a * d.x, c.y + b * d.y, c.z + cz * d.z);
    const n = V(d.x / a, d.y / b, d.z / cz).normalize();
    const dir = n.clone().add(comb).add(V(RNG() - .5, RNG() - .5, RNG() - .5).multiplyScalar(.5)).normalize();
    if (dir.dot(n) < .25) dir.addScaledVector(n, .6).normalize(); // impede o pelo de entrar no corpo
    return { p, dir, d };
  };
}

/** Espalha `count` pelos sobre uma superfície (uma única malha instanciada). */
export function hairs(parent, count, sample, colorOf, len){
  const mesh = new THREE.InstancedMesh(hairGeo, M.hair, count);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), c = new THREE.Color();
  let n = 0, guard = 0;
  while (n < count && guard++ < count * 40){
    const s = sample(); if (!s) continue;
    const L = lerp(len[0], len[1], RNG()), w = .7 + RNG() * .6;
    q.setFromUnitVectors(UP, s.dir);
    m.compose(s.p, q, sc.set(w, L, w));
    mesh.setMatrixAt(n, m);
    colorOf(s, c); mesh.setColorAt(n, c);
    n++;
  }
  mesh.count = n;
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.frustumCulled = false;
  parent.add(mesh); return mesh;
}
