/* =====================================================================
   MODELO DA ABELHA · 100% feito em código
   Hierarquia: scene → stage (posição/escala/inclinação na tela)
                       → craft (atitude de voo) → pivot (centraliza a lente no zoom)
                                                 → peças (explodem separadas)
   Peças: core (tórax), shell (escudo), battery (abdômen), arm0..3 (asas + pernas),
          gimbal (aparelho bucal), camera (cabeça com o ocelo-lente).
   +Z = frente, +Y = cima, +X = direita.
   ===================================================================== */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { scene } from './cena.js';
import { M, holeMat } from './materiais.js';
import { canvasTex, glowTex, logoTex } from './texturas.js';
import { ball, segment, tube, hairs, ellSample, GOLD1, GOLD2, DARK1, DARK2 } from './geometria.js';
import { RNG, V, UP, lerp } from '../util/math.js';

/** Largura total ponta a ponta das asas abertas (unidades da abelha). */
export const SPAN = 2.7;
/** Distância do centro do tórax até a sola dos pés. */
export const FOOT = 0.44;

export const stage = new THREE.Group(); scene.add(stage);
export const craft = new THREE.Group(); craft.rotation.order = 'YXZ'; stage.add(craft);
export const pivot = new THREE.Group(); craft.add(pivot);

export const PARTS = [];          // peças que explodem
export const anchors = {};        // Object3D vazios projetados na tela (rótulos, fios, marcadores)
export const ledMats = [];        // materiais do "LED" (pólen brilhante)

function makePart(name, dir, rot = [0, 0, 0]){
  const g = new THREE.Group(); g.name = name;
  g.userData.dir = V(...dir);       // direção da explosão
  g.userData.rot = V(...rot);       // giro ao explodir
  pivot.add(g); PARTS.push(g); return g;
}
function anchor(name, parent, x, y, z){
  const o = new THREE.Object3D(); o.position.set(x, y, z); parent.add(o); anchors[name] = o; return o;
}

/* ---------------------------------------------------------------------
   PERNAS
   pontos do lado direito: quadril, joelho, tornozelo, meio do tarso, pé (y −0.42 + raio 0.02 = −FOOT)
   --------------------------------------------------------------------- */
const LEGS = {
  front: [[.08,-.13,.15], [.27,-.05,.27], [.33,-.28,.36], [.36,-.38,.41], [.38,-.42,.45]],
  mid:   [[.12,-.15,0],   [.36,-.04,.03], [.45,-.30,0],   [.49,-.39,-.02], [.51,-.42,-.03]],
  hind:  [[.09,-.13,-.10],[.35,-.08,-.27],[.44,-.33,-.42],[.48,-.40,-.50], [.50,-.42,-.55]],
};
const LEG_R = {
  front: [[.026,.02], [.017,.02], [.013,.011], [.011,.009]],
  hind:  [[.028,.024],[.02,.042], [.014,.012], [.012,.009]],   // tíbia traseira larga = cesto de pólen
};
function buildLeg(parent, pts, side, radii){
  const P = pts.map(p => V(p[0] * side, p[1], p[2]));
  parent.add(ball(radii[0][0] * 1.25, M.body, P[0], 14));
  for (let i = 0; i < P.length - 1; i++){
    parent.add(segment(P[i], P[i + 1], radii[i][0], radii[i][1], i === 0 ? M.body : M.shell));
    if (i < P.length - 2) parent.add(ball(radii[i][1] * 1.15, M.shell, P[i + 1], 12));
  }
  const pe = P[P.length - 1];
  parent.add(ball(.02, M.rubber, pe, 14));           // arólio (pé)
  const fwd = new THREE.Vector3().subVectors(pe, P[P.length - 2]); fwd.y = 0; fwd.normalize();
  for (const k of [-1, 1]){                          // duas garras
    const dc = fwd.clone().applyAxisAngle(UP, k * .35);
    const a = pe.clone().add(V(0, -.002, 0)), b = a.clone().addScaledVector(dc, .035); b.y -= .004;
    parent.add(segment(a, b, .006, .0015, M.metal, 6));
  }
  return P;
}

/* ---------------------------------------------------------------------
   CORE · tórax peludo
   --------------------------------------------------------------------- */
const core = makePart('core', [0, 0, 0]);
const TH = { c:V(0, 0, .02), a:.21, b:.19, z:.22 };
export const thorax = new THREE.Mesh(new THREE.SphereGeometry(.2, 64, 48), M.fur);
thorax.scale.set(1.05, .95, 1.1); thorax.position.copy(TH.c); core.add(thorax);
const colar = new THREE.Mesh(new THREE.TorusGeometry(.115, .042, 20, 56), M.fur);   // colar peludo (pronoto)
colar.position.set(0, -.005, .2); core.add(colar);
hairs(core, 1500,
  ellSample(TH.c, TH.a, TH.b, TH.z, d => d.y < .69 && d.z > -.78, V(0, .05, -.55)),
  (s, c) => s.d.y < -.3 ? c.copy(DARK1).lerp(DARK2, RNG()) : c.copy(GOLD2).lerp(GOLD1, RNG()),
  [.035, .075]);
for (const s of [1, -1]) buildLeg(core, LEGS.mid, s, LEG_R.front);    // pernas do meio

/* ---------------------------------------------------------------------
   SHELL · escudo dorsal (scutum + scutellum + logo)
   --------------------------------------------------------------------- */
const shell = makePart('shell', [0, .9, .05], [-.2, 0, 0]);
const SC = { a:TH.a * 1.035, b:TH.b * 1.035, z:TH.z * 1.035 };
const scutum = new THREE.Mesh(new THREE.SphereGeometry(.2, 64, 24, 0, Math.PI * 2, 0, .8), M.shell);
scutum.scale.set(1.05 * 1.035, .95 * 1.035, 1.1 * 1.035); scutum.position.copy(TH.c); shell.add(scutum);
const scutellum = ball(.06, M.shell, V(0, .135, -.15), 32); scutellum.scale.set(1.8, .6, 1.05); shell.add(scutellum);
// logo moldada na curvatura do escudo (cada vértice apoiado na superfície do elipsoide)
const logoGeo = new THREE.PlaneGeometry(.17, .0425, 24, 4); logoGeo.rotateX(-Math.PI / 2);
{
  const lp = logoGeo.attributes.position;
  for (let i = 0; i < lp.count; i++){
    const x = lp.getX(i), z = lp.getZ(i) - .035;
    const k = 1 - (x / SC.a) ** 2 - ((z - TH.c.z) / SC.z) ** 2;
    lp.setXYZ(i, x, TH.c.y + SC.b * Math.sqrt(Math.max(0, k)) + .003, z);
  }
  logoGeo.computeVertexNormals();
}
export const logoMat = new THREE.MeshBasicMaterial({ map:logoTex, transparent:true, depthWrite:false });
shell.add(new THREE.Mesh(logoGeo, logoMat));
anchor('escudo', shell, 0, .215, .02);

/* ---------------------------------------------------------------------
   BATTERY · abdômen listrado (vai para trás ao explodir)
   --------------------------------------------------------------------- */
const battery = makePart('battery', [0, .35, -1.05], [.25, 0, 0]);
battery.position.set(0, -.04, -.2);
export const abd = new THREE.Group(); abd.rotation.x = -.2; battery.add(abd);   // leve queda da cauda
const AL = .95, AR = .27;
const rAt = t => Math.max(.045 * (1 - t), AR * Math.pow(Math.max(0, Math.sin(Math.PI * Math.pow(t, .85))), .7));
const BANDS = [0, .11, .25, .39, .53, .67, .81, 1];
for (let i = 0; i < BANDS.length - 1; i++){
  const t0 = BANDS[i], t1 = BANDS[i + 1], N = 16, pts = [];
  pts.push(new THREE.Vector2(rAt(t0) * .9, t0 * AL - .012));                 // borda escondida sob o segmento anterior
  for (let k = 0; k <= N; k++){ const u = k / N, t = lerp(t0, t1, u); pts.push(new THREE.Vector2(rAt(t) * (1 + .05 * Math.pow(u, 2.5)), t * AL)); }
  if (i < BANDS.length - 2) pts.push(new THREE.Vector2(rAt(t1) * .86, t1 * AL + .004)); // lábio do tergito
  const geo = new THREE.LatheGeometry(pts, 56); geo.rotateX(-Math.PI / 2);   // eixo +Y do torno → −Z
  const mat = (i % 2 === 0 && i < BANDS.length - 2) ? M.fur : M.shell;      // listras: pelo dourado / quitina
  abd.add(new THREE.Mesh(geo, mat));
}
abd.add(ball(.05, M.body, V(0, 0, 0), 24));                                  // pecíolo
const ferrao = new THREE.Mesh(new THREE.ConeGeometry(.017, .14, 14), M.metal);
ferrao.geometry.rotateX(-Math.PI / 2); ferrao.position.set(0, 0, -AL - .045); abd.add(ferrao);
// espiráculos nas listras de quitina
[1, 3, 5].forEach(i => { const t = (BANDS[i] + BANDS[i + 1]) / 2; for (const s of [1, -1]) abd.add(ball(.016, M.glass, V(s * rAt(t) * 1.03, 0, -t * AL), 16)); });
// pelos curtos nas faixas douradas
const FUR_BANDS = [[0, .11], [.25, .39], [.53, .67]];
hairs(abd, 750, () => {
  const b = FUR_BANDS[(RNG() * 3) | 0], t = lerp(b[0], b[1], RNG()), ph = RNG() * Math.PI * 2, r = rAt(t);
  const n = V(Math.cos(ph), Math.sin(ph), 0);
  const dir = n.clone().add(V(0, 0, -.7)).add(V(RNG() - .5, RNG() - .5, 0).multiplyScalar(.4)).normalize();
  return { p:V(r * Math.cos(ph), r * Math.sin(ph), -t * AL), dir, d:n };
}, (s, c) => c.copy(GOLD2).lerp(GOLD1, RNG()), [.025, .05]);
anchor('abdomen', abd, 0, .12, -.45);

/* ---------------------------------------------------------------------
   ASAS + PERNAS DIANTEIRAS/TRASEIRAS + PÓLEN LUMINOSO (arm0..arm3)
   --------------------------------------------------------------------- */
// contorno da asa no plano (u = envergadura, v = corda; v > 0 = bordo de ataque, para a frente)
function wingOutline(p, L, C){
  const X = u => u * L, Y = v => v * L * C;
  p.moveTo(X(0), Y(.03));
  p.bezierCurveTo(X(.25), Y(.075), X(.6), Y(.12), X(.86), Y(.1));
  p.bezierCurveTo(X(1.0), Y(.088), X(1.03), Y(-.02), X(.96), Y(-.065));
  p.bezierCurveTo(X(.8), Y(-.17), X(.45), Y(-.21), X(.2), Y(-.15));
  p.quadraticCurveTo(X(.05), Y(-.1), X(0), Y(-.03));
  p.closePath();
}
// nervuras (coordenadas normalizadas como no contorno)
const VEINS = [
  [[0,.02],[.3,.072],[.62,.1]],
  [[0,0],[.3,.03],[.55,.045],[.63,.1]],
  [[.55,.045],[.76,.072],[.88,.095]],
  [[0,-.02],[.26,-.03],[.5,-.05],[.68,-.04],[.77,.07]],
  [[.02,-.05],[.26,-.08],[.46,-.11],[.63,-.1],[.72,-.05]],
  [[.26,-.03],[.26,-.08]], [[.5,-.05],[.55,.045]], [[.46,-.11],[.5,-.05]], [[.63,-.1],[.68,-.04]],
  [[.04,-.07],[.2,-.13]],
];
function buildWing(L, C){
  const sh = new THREE.Shape(); wingOutline(sh, L, C);
  const geo = new THREE.ShapeGeometry(sh, 28);
  geo.computeBoundingBox();
  const bb = geo.boundingBox, bw = bb.max.x - bb.min.x, bh = bb.max.y - bb.min.y;
  // UV normalizada pela caixa da asa (a textura desenha o mesmo contorno)
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) - bb.min.x) / bw, (pos.getY(i) - bb.min.y) / bh);
  // textura da membrana com nervuras
  const W = 1024, H = Math.max(128, Math.round(W * bh / bw));
  const tex = canvasTex(W, H, g => {
    const tx = x => (x - bb.min.x) / bw * W, ty = y => (1 - (y - bb.min.y) / bh) * H;
    const P = {
      moveTo:(x, y) => g.moveTo(tx(x), ty(y)),
      bezierCurveTo:(a, b, c, d, e, f) => g.bezierCurveTo(tx(a), ty(b), tx(c), ty(d), tx(e), ty(f)),
      quadraticCurveTo:(a, b, c, d) => g.quadraticCurveTo(tx(a), ty(b), tx(c), ty(d)),
      closePath:() => g.closePath(),
    };
    g.beginPath(); wingOutline(P, L, C);
    const gr = g.createLinearGradient(0, 0, W, 0);
    gr.addColorStop(0, 'rgba(90,70,40,.55)'); gr.addColorStop(.25, 'rgba(255,255,255,.24)'); gr.addColorStop(1, 'rgba(255,255,255,.12)');
    g.fillStyle = gr; g.fill();
    g.save(); g.clip();
    g.strokeStyle = 'rgba(28,22,14,.88)'; g.lineWidth = 3.2; g.lineJoin = 'round'; g.lineCap = 'round';
    for (const vein of VEINS){
      g.beginPath();
      vein.forEach(([u, v], k) => { const x = tx(u * L), y = ty(v * L * C); k ? g.lineTo(x, y) : g.moveTo(x, y); });
      g.stroke();
    }
    g.restore();
    g.beginPath(); wingOutline(P, L, C); g.strokeStyle = 'rgba(30,24,16,.9)'; g.lineWidth = 5; g.stroke();
  });
  return {
    base:geo,
    mats:{
      // membrana transparente e iridescente, como asa de inseto real
      blade: new THREE.MeshPhysicalMaterial({ color:'#ffffff', map:tex, roughness:.12, metalness:.05, transparent:true, side:THREE.DoubleSide, depthWrite:false, iridescence:1, iridescenceIOR:1.3, iridescenceThicknessRange:[260, 820], clearcoat:.6 }),
      // cópias de desfoque de movimento
      ghost: new THREE.MeshBasicMaterial({ color:'#f2f8ff', map:tex, transparent:true, opacity:0, side:THREE.DoubleSide, depthWrite:false }),
    },
  };
}
/** Asas anterior (f) e posterior (h). */
export const WING = { f:buildWing(1.2, 1), h:buildWing(.8, .85) };
function wingGeoFor(tipo, side){
  const g = WING[tipo].base.clone();
  g.rotateX(Math.PI / 2);          // plano da forma → plano XZ (v → +Z)
  if (side < 0) g.scale(-1, 1, 1); // espelha para o lado esquerdo
  return g;
}
/** Cópias de desfoque por asa, mais densas nos extremos da batida. */
const GH = 7;
export const GHOST = [...Array(GH)].map((_, i) => Math.sin(-Math.PI / 2 + Math.PI * i / (GH - 1)));

/** Montagens: lado, tipo (f anterior / h posterior), articulação, comprimento, varredura em voo/repouso, atraso de fase. */
export const MOUNTS = [
  { side: 1, tipo:'f', hinge:[ .15, .13,  .10], L:1.2, voo:.12, repouso:1.45, fase:0   },
  { side:-1, tipo:'f', hinge:[-.15, .13,  .10], L:1.2, voo:.12, repouso:1.45, fase:0   },
  { side: 1, tipo:'h', hinge:[ .14, .10, -.05], L:.8,  voo:.42, repouso:1.52, fase:.55 },
  { side:-1, tipo:'h', hinge:[-.14, .10, -.05], L:.8,  voo:.42, repouso:1.52, fase:.55 },
];
export const LED0 = '#ffc933';
export const arms = [];
MOUNTS.forEach((mt, i) => {
  const s = mt.side;
  const d = V(s, 0, mt.tipo === 'f' ? .45 : -.6).normalize().multiplyScalar(.75); d.y = .15;
  const g = makePart('arm' + i, [d.x, d.y, d.z], [0, 0, s * .18]);
  const H = V(...mt.hinge);
  g.add(ball(.026, M.metal, H, 16));                                         // articulação da asa
  if (mt.tipo === 'f'){ const teg = ball(.034, M.accent, H.clone().add(V(0, .012, .012)), 20); teg.scale.set(1, .55, 1.35); g.add(teg); } // tégula
  const root = new THREE.Group(); root.position.copy(H); g.add(root);
  const geo = wingGeoFor(mt.tipo, s);
  const flap = new THREE.Group(); flap.rotation.order = 'ZYX'; root.add(flap);   // torção primeiro, batida depois
  const blade = new THREE.Mesh(geo, WING[mt.tipo].mats.blade); blade.renderOrder = 7; flap.add(blade);
  const ghosts = [];
  for (let k = 0; k < GH; k++){ const gm = new THREE.Mesh(geo, WING[mt.tipo].mats.ghost); gm.renderOrder = 6; root.add(gm); ghosts.push(gm); }
  if (i === 0) anchor('asa', flap, s * mt.L * .92, 0, 0);
  if (i === 1) anchor('asaEsq', flap, -mt.L * .72, 0, -.06);              // card "Asas" da anatomia
  // perna dianteira (asa anterior) ou traseira (asa posterior)
  const P = buildLeg(g, mt.tipo === 'f' ? LEGS.front : LEGS.hind, s, mt.tipo === 'f' ? LEG_R.front : LEG_R.hind);
  if (i === 0) anchor('perna', g, P[1].x, P[1].y, P[1].z);
  // "LED": bolota de pólen luminosa no cesto da tíbia traseira
  if (mt.tipo === 'h'){
    const pc = P[1].clone().lerp(P[2], .55).add(V(s * .038, .01, 0));
    const glow = new THREE.Mesh(new THREE.SphereGeometry(.048, 24, 16), new THREE.MeshBasicMaterial({ color:LED0, toneMapped:false }));
    glow.position.copy(pc); g.add(glow);
    const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map:glowTex, color:LED0, blending:THREE.AdditiveBlending, depthWrite:false, transparent:true }));
    spr.position.copy(pc); spr.scale.setScalar(.28); g.add(spr);
    ledMats.push(glow.material, spr.material);
    if (i === 2) anchor('polen', g, pc.x, pc.y, pc.z);                     // card "Coleta" da anatomia
  }
  arms.push({ g, root, flap, ghosts, mt, hingeY:H.y });
});

/** Malhas dos cestos de pólen (de onde sai o pólen das animações). */
export const pollenMeshes = [];
pivot.traverse(o => { if (o.isMesh && ledMats.includes(o.material)) pollenMeshes.push(o); });

/* ---------------------------------------------------------------------
   GIMBAL · aparelho bucal: mento, mandíbulas, palpos e língua (desce ao explodir)
   --------------------------------------------------------------------- */
const gimbal = makePart('gimbal', [0, -.55, .45]);
const mento = new THREE.Mesh(new RoundedBoxGeometry(.08, .04, .06, 3, .015), M.body); mento.position.set(0, -.13, .47); gimbal.add(mento);
for (const s of [1, -1]){
  gimbal.add(tube([V(s * .055, -.1, .5), V(s * .06, -.16, .53), V(s * .025, -.2, .545)], .013, M.metal, 12, 8));  // mandíbula
  gimbal.add(ball(.009, M.metal, V(s * .025, -.2, .545), 10));
  gimbal.add(tube([V(s * .02, -.14, .48), V(s * .03, -.22, .5), V(s * .024, -.29, .485)], .0055, M.body, 12, 6)); // palpo
}
gimbal.add(tube([V(0, -.13, .49), V(0, -.2, .515), V(0, -.27, .505), V(0, -.33, .47)], .009, M.body, 24, 10));   // glossa
gimbal.add(ball(.016, M.fur, V(0, -.335, .465), 14));
anchor('boca', gimbal, 0, -.24, .5);

/* ---------------------------------------------------------------------
   CAMERA · cabeça com olhos compostos, antenas e o ocelo-lente (vai para a frente ao explodir)
   --------------------------------------------------------------------- */
export const head = makePart('camera', [0, -.45, 1.05]);
head.position.set(0, 0, .42);
const HE = { a:.17 * 1.12, b:.17 * 1.02, z:.17 * .72 };
const skull = new THREE.Mesh(new THREE.SphereGeometry(.17, 64, 48), M.shell); skull.scale.set(1.12, 1.02, .72); head.add(skull);
const pescoco = new THREE.Mesh(new THREE.CylinderGeometry(.065, .075, .11, 24), M.body);
pescoco.geometry.rotateX(Math.PI / 2); pescoco.position.set(0, -.01, -.14); head.add(pescoco);
for (const s of [1, -1]){                                                    // olhos compostos
  const e = new THREE.Mesh(new THREE.SphereGeometry(.1, 48, 32), M.eye);
  e.scale.set(.55, 1.25, .9); e.position.set(s * .142, .02, 0); e.rotation.set(0, s * .3, -s * .12);
  head.add(e);
}
const clipeo = ball(.065, M.accent, V(0, -.075, .105), 32); clipeo.scale.set(1, .75, .45); head.add(clipeo);
for (const s of [1, -1]) head.add(ball(.016, M.glass, V(s * .045, .15, .06), 14));    // ocelos laterais
// antenas cotoveladas (escapo + flagelo), com pivôs para tremular
export const antennas = [];
for (const s of [1, -1]){
  const ant = new THREE.Group(); ant.position.set(s * .042, .088, .1); head.add(ant);
  ant.add(ball(.02, M.body, V(0, 0, 0), 14));
  const E = V(s * .03, .13, .11);
  ant.add(tube([V(0, 0, 0), V(s * .012, .07, .05), E], .011, M.shell, 16, 10));
  ant.add(ball(.016, M.shell, E, 14));
  const fl = new THREE.Group(); fl.position.copy(E); ant.add(fl);
  fl.add(tube([V(0, 0, 0), V(s * .05, .05, .07), V(s * .1, .04, .17), V(s * .13, -.01, .24)], .009, M.shell, 28, 10));
  fl.add(ball(.012, M.shell, V(s * .13, -.01, .24), 12));
  if (s === 1) anchor('antena', fl, .13, -.01, .24);                       // card "Antenas" da anatomia
  antennas.push({ ant, fl, s });
}
hairs(head, 380,
  ellSample(V(0, 0, 0), HE.a, HE.b, HE.z, d => Math.abs(d.x) < .6 && ((d.y > .3 && d.z < .5) || (d.z > .5 && d.y < -.45)), V(0, .1, -.3)),
  (s, c) => s.d.y > 0 ? c.copy(DARK1).lerp(GOLD2, RNG() * .6) : c.copy(GOLD2).lerp(GOLD1, RNG()),
  [.02, .045]);
// ocelo mediano = "lente" (tubo, anel, calota iridescente e furo que revela o vídeo)
export const lensG = new THREE.Group(); lensG.position.set(0, .05, .118); lensG.scale.setScalar(.7); head.add(lensG);
const tubo = new THREE.Mesh(new THREE.CylinderGeometry(.078, .082, .035, 48, 1, true), M.metal);
tubo.geometry.rotateX(Math.PI / 2); tubo.position.z = -.012; lensG.add(tubo);
const anel = new THREE.Mesh(new THREE.TorusGeometry(.078, .007, 12, 72), M.accent); anel.position.z = .003; lensG.add(anel);
const capGeo = new THREE.SphereGeometry(.2, 64, 12, 0, Math.PI * 2, 0, .38);
capGeo.rotateX(Math.PI / 2); capGeo.translate(0, 0, -.2 * Math.cos(.38));     // calota virada para +Z, base em z = 0
lensG.add(new THREE.Mesh(capGeo, M.lens));
export const furo = new THREE.Mesh(new THREE.CircleGeometry(.074, 64), holeMat);
furo.position.z = .0155; furo.renderOrder = 999; furo.scale.setScalar(.001); lensG.add(furo);
anchor('lente', lensG, 0, 0, .0155);
anchor('lensEdge', lensG, .074, 0, .0155);
anchor('cabeca', head, 0, .12, .04);
anchor('olho', head, -.2, .02, .02);                                        // card "Visão de flor" da anatomia

/** Raio do furo da lente, em unidades da abelha. */
export const HOLE_R = .074 * lensG.scale.x;

/* ---------------------------------------------------------------------
   Posições originais das peças e posição local da lente
   --------------------------------------------------------------------- */
PARTS.forEach(p => { p.userData.home = p.position.clone(); });
scene.updateMatrixWorld(true);                                     // stage/craft/pivot ainda na identidade
export const lensLocal = anchors.lente.getWorldPosition(new THREE.Vector3());
