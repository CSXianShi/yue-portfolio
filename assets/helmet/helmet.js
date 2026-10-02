import * as THREE from '../vendor/three/three.module.js';
import { GLTFLoader } from '../vendor/three/GLTFLoader.js';
import { DRACOLoader } from '../vendor/three/DRACOLoader.js';
import { HDRLoader } from '../vendor/three/HDRLoader.js';

// Independent fan-page interaction, using the reference site's public helmet asset.
const stage = document.querySelector('[data-helmet-stage]');
if (stage) init().catch(() => {
  stage.dataset.state = 'fallback';
  stage.closest('figure').querySelector('.helmet-instruction').textContent = 'LANDO / HELMET';
  stage.closest('figure').querySelector('.helmet-toggle').hidden = true;
});

async function init() {
  const hero = stage.closest('.v2-hero');
  const canvas = stage.querySelector('canvas');
  const button = document.querySelector('.helmet-toggle');
  const instruction = document.querySelector('.helmet-instruction');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const touch = matchMedia('(pointer: coarse)');
  const url = name => new URL(name, import.meta.url).href;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(33, 1, .01, 50);
  const rig = new THREE.Group();
  scene.add(rig, new THREE.HemisphereLight(0xffffff, 0x667047, 2));
  const light = new THREE.DirectionalLight(0xfff2dd, 3);
  light.position.set(3, 4, 5);
  scene.add(light);
  const draco = new DRACOLoader().setDecoderPath(new URL('../vendor/three/draco/', import.meta.url).href);
  draco.setWorkerLimit(1);
  const loader = new GLTFLoader().setDRACOLoader(draco);
  const textures = new THREE.TextureLoader();
  const [gltf, base, normal, visor, roughness, metallic, environment] = await Promise.all([
    loader.loadAsync(url('lando-helmet.glb')),
    textures.loadAsync(url('gold-base.webp')),
    textures.loadAsync(url('normal.webp')),
    textures.loadAsync(url('visor-base.webp')),
    textures.loadAsync(url('visor-roughness.webp')),
    textures.loadAsync(url('visor-metallic.webp')),
    new HDRLoader().loadAsync(url('studio.hdr')),
  ]);
  draco.dispose();
  base.colorSpace = visor.colorSpace = THREE.SRGBColorSpace;
  for (const texture of [base, normal, visor, roughness, metallic]) texture.flipY = false;
  environment.mapping = THREE.EquirectangularReflectionMapping;
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromEquirectangular(environment).texture;
  environment.dispose();
  pmrem.dispose();
  const model = gltf.scene;
  const bounds = new THREE.Box3().setFromObject(model);
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  model.position.sub(center);
  model.scale.setScalar(2.75 / size.y);
  model.position.multiplyScalar(model.scale.x);
  rig.add(model);
  rig.rotation.set(.14, -.35, -.045);
  camera.position.set(0, .12, 6.5);
  camera.lookAt(0, 0, 0);
  const trail = Array.from({ length: 24 }, () => new THREE.Vector3(-10, -10, 0));
  const uniforms = {
    uTrail: { value: trail },
    uFull: { value: 1 },
    uResolution: { value: new THREE.Vector2(1, 1) },
  };
  function revealMaterial(material) {
    material.transparent = true;
    material.onBeforeCompile = shader => {
      Object.assign(shader.uniforms, uniforms);
      shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `
        #include <common>
        uniform vec3 uTrail[24];
        uniform float uFull;
        uniform vec2 uResolution;
      `).replace('#include <opaque_fragment>', `
        vec2 screen = gl_FragCoord.xy / uResolution;
        float reveal = uFull;
        for (int i = 0; i < 24; i++) {
          vec2 delta = screen - uTrail[i].xy;
          delta.x *= uResolution.x / uResolution.y;
          float brush = (1.0 - smoothstep(0.055, 0.26, length(delta))) * uTrail[i].z;
          reveal = max(reveal, brush);
        }
        float luminance = dot(outgoingLight, vec3(0.2126, 0.7152, 0.0722));
        outgoingLight = mix(vec3(0.40, 0.44, 0.31) * luminance, outgoingLight, reveal);
        diffuseColor.a *= mix(0.25, 1.0, reveal);
        #include <opaque_fragment>
      `);
    };
    return material;
  }
  model.traverse(mesh => {
    if (!mesh.isMesh) return;
    if (mesh.name === 'helmet') mesh.material = revealMaterial(new THREE.MeshPhysicalMaterial({
      map: base, normalMap: normal, metalness: .82, roughness: .17,
      envMapIntensity: 2.2, clearcoat: 1, clearcoatRoughness: .12,
    }));
    else if (mesh.name === 'glass') mesh.material = revealMaterial(new THREE.MeshStandardMaterial({
      map: visor, roughnessMap: roughness, metalnessMap: metallic,
      roughness: .2, metalness: .95, envMapIntensity: 1.8,
    }));
    else mesh.material = revealMaterial(new THREE.MeshStandardMaterial({ color: 0x35372a, roughness: .3, metalness: .5 }));
  });
  let frame = 0, last = 0, visible = true, paused = false, pinned = reduced.matches || touch.matches;
  let targetX = 0, targetY = 0, rotationX = 0, rotationY = 0, drag = null, slot = 0;
  const introUntil = performance.now() + 1500;
  function schedule() {
    if (!frame && visible && !document.hidden && !paused) frame = requestAnimationFrame(draw);
  }
  function resize() {
    const rect = stage.getBoundingClientRect();
    renderer.setSize(rect.width, rect.height, false);
    renderer.getDrawingBufferSize(uniforms.uResolution.value);
    camera.aspect = rect.width / rect.height;
    camera.updateProjectionMatrix();
    schedule();
  }
  function draw(now) {
    frame = 0;
    const dt = Math.min((now - (last || now)) / 1000, .05);
    last = now;
    const easing = 1 - Math.exp(-dt * 8);
    const desiredFull = pinned || reduced.matches || now < introUntil ? 1 : 0;
    uniforms.uFull.value += (desiredFull - uniforms.uFull.value) * easing;
    rotationX += (targetX - rotationX) * easing;
    rotationY += (targetY - rotationY) * easing;
    rig.rotation.y = -.35 + rotationX;
    rig.rotation.x = .14 + rotationY;
    let activeTrail = false;
    for (const point of trail) { point.z = Math.max(0, point.z - dt * .6); if (point.z > 0) activeTrail = true; }
    renderer.render(scene, camera);
    stage.dataset.state = 'ready';
    if (!reduced.matches && (activeTrail || Math.abs(targetX - rotationX) + Math.abs(targetY - rotationY) > .001 || Math.abs(desiredFull - uniforms.uFull.value) > .001 || now < introUntil)) schedule();
  }
  function brush(event) {
    if (reduced.matches) return;
    const h = hero.getBoundingClientRect();
    targetX = THREE.MathUtils.clamp((event.clientX - h.left) / h.width * 2 - 1, -1, 1) * .5;
    targetY = THREE.MathUtils.clamp((event.clientY - h.top) / h.height * 2 - 1, -1, 1) * .18;
    const r = stage.getBoundingClientRect();
    const x = (event.clientX - r.left) / r.width;
    const y = 1 - (event.clientY - r.top) / r.height;
    if (x >= 0 && x <= 1 && y >= 0 && y <= 1) { trail[slot++ % trail.length].set(x, y, 1); }
    schedule();
  }
  hero.addEventListener('pointermove', event => {
    if (event.pointerType === 'mouse') brush(event);
  }, { passive: true });
  hero.addEventListener('pointerleave', () => { targetX = targetY = 0; schedule(); });
  stage.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse' || reduced.matches) return;
    drag = { id: event.pointerId, x: event.clientX, angle: targetX };
  }, { passive: true });
  stage.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId) return;
    targetX = THREE.MathUtils.clamp(drag.angle + (event.clientX - drag.x) * .009, -1.1, 1.1);
    schedule();
  }, { passive: true });
  for (const type of ['pointerup', 'pointercancel']) window.addEventListener(type, () => { drag = null; }, { passive: true });
  function updateUI() {
    button.setAttribute('aria-pressed', String(pinned));
    button.textContent = pinned ? '返回鼠标擦亮 ↗' : '查看完整头盔 ↗';
    instruction.textContent = reduced.matches ? 'LANDO / HELMET' : touch.matches ? '左右拖动，转动头盔' : '移动鼠标，点亮头盔';
    button.hidden = reduced.matches || touch.matches;
  }
  button.addEventListener('click', () => { pinned = !pinned; updateUI(); schedule(); });
  reduced.addEventListener('change', () => {
    pinned = reduced.matches || touch.matches;
    if (reduced.matches) { targetX = targetY = rotationX = rotationY = 0; uniforms.uFull.value = 1; trail.forEach(p => p.z = 0); }
    updateUI(); schedule();
  });
  new ResizeObserver(resize).observe(stage);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (!visible) { cancelAnimationFrame(frame); frame = 0; last = 0; }
    else schedule();
  }, { threshold: 0 }).observe(hero);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; last = 0; }
    else schedule();
  });
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault(); paused = true; cancelAnimationFrame(frame); frame = 0;
    stage.dataset.state = 'fallback'; button.hidden = true;
  });
  canvas.addEventListener('webglcontextrestored', () => { paused = false; updateUI(); schedule(); });
  updateUI(); resize();
}
