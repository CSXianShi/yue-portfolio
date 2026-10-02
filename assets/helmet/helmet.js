import * as THREE from '../vendor/three/three.module.js';
import { GLTFLoader } from '../vendor/three/GLTFLoader.js';
import { DRACOLoader } from '../vendor/three/DRACOLoader.js';
import { FluidCursor } from './fluid-cursor.js';
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
  const [gltf, base, normal, visor, roughness, metallic, environment, headDiffuse] = await Promise.all([
    loader.loadAsync(url('lando-helmet.glb')),
    textures.loadAsync(url('gold-base.webp')),
    textures.loadAsync(url('normal.webp')),
    textures.loadAsync(url('visor-base.webp')),
    textures.loadAsync(url('visor-roughness.webp')),
    textures.loadAsync(url('visor-metallic.webp')),
    new HDRLoader().loadAsync(url('studio.hdr')),
    textures.loadAsync(url('yue-portrait.webp')),
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
  headDiffuse.colorSpace = THREE.SRGBColorSpace;
  const fluid = new FluidCursor(renderer);
  const headScene = new THREE.Scene();
  const head = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4 * 512 / 413), new THREE.MeshBasicMaterial({ map: headDiffuse, transparent: true }));
  head.position.y = -.45;
  headScene.add(head);
  const helmetTarget = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: true });
  const headTarget = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: false });
  const uniforms = { tHelmet: { value: helmetTarget.texture }, tHead: { value: headTarget.texture }, tCursorEffect: { value: fluid.output.texture }, uHelmetHover: { value: reduced.matches ? 1 : 0 } };
  const composition = new THREE.Scene();
  const compositionCamera = new THREE.Camera();
  composition.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    uniforms, depthTest: false, depthWrite: false,
    vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}',
    // Reference O9 composition: velocity threshold plus curved hover wipe.
    fragmentShader: `
      uniform sampler2D tHelmet;
      uniform sampler2D tHead;
      uniform sampler2D tCursorEffect;
      uniform float uHelmetHover;
      varying vec2 vUv;
      void main(){
        vec4 cursor = texture2D(tCursorEffect, vec2(.025 + vUv.x * .95, .025 + vUv.y * .95));
        float cursorEffect = step(.1, 1.0 - cursor.r);
        float hoverTransition = vUv.y + sin(vUv.x * 3.141592) * sin(uHelmetHover * 3.141592) * .2;
        cursorEffect = clamp(cursorEffect + step(1.0 - hoverTransition, uHelmetHover), 0.0, 1.0);
        vec4 portrait = texture2D(tHead, vUv);
        vec4 helmet = texture2D(tHelmet, vUv);
        vec3 paper = vec3(.904,.904,.857);
        vec3 background = mix(paper, vec3(.807,.819,.775), cursorEffect * .18);
        vec3 base = mix(background, portrait.rgb, portrait.a);
        gl_FragColor = vec4(mix(base, helmet.rgb, cursorEffect * helmet.a), 1.0);
        #include <colorspace_fragment>
      }
    `,
  })));
  function revealMaterial(material) { return material; }
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
  let frame = 0, last = 0, visible = true, paused = false, pinned = reduced.matches;
  let targetX = 0, targetY = 0, rotationX = 0, rotationY = 0, drag = null, lastMove = -10000;
  const introUntil = performance.now() + 1500;
  function schedule() {
    if (!frame && visible && !document.hidden && !paused) frame = requestAnimationFrame(draw);
  }
  function resize() {
    const rect = stage.getBoundingClientRect();
    renderer.setSize(rect.width, rect.height, false);
    const resolution = renderer.getDrawingBufferSize(new THREE.Vector2());
    helmetTarget.setSize(resolution.x, resolution.y);
    headTarget.setSize(resolution.x, resolution.y);
    fluid.resize(rect.width, rect.height);
    camera.aspect = rect.width / rect.height;
    camera.updateProjectionMatrix();
    schedule();
  }
  function draw(now) {
    frame = 0;
    const dt = Math.min((now - (last || now)) / 1000, .05);
    last = now;
    const easing = 1 - Math.exp(-dt * 8);
    const desiredFull = pinned || reduced.matches ? 1 : 0;
    uniforms.uHelmetHover.value += (desiredFull - uniforms.uHelmetHover.value) * easing;
    rotationX += (targetX - rotationX) * easing;
    rotationY += (targetY - rotationY) * easing;
    head.rotation.set(rotationY, rotationX, 0);
    rig.rotation.y = -.35 + rotationX / 1.5;
    rig.rotation.x = .14 + rotationY / 1.5;
    if (!reduced.matches) fluid.update();
    renderer.setRenderTarget(headTarget); renderer.render(headScene, camera);
    renderer.setRenderTarget(helmetTarget); renderer.render(scene, camera);
    renderer.setRenderTarget(null); renderer.render(composition, compositionCamera);
    stage.dataset.state = 'ready';
    if (!reduced.matches && (now - lastMove < 3500 || Math.abs(targetX - rotationX) + Math.abs(targetY - rotationY) > .001 || Math.abs(desiredFull - uniforms.uHelmetHover.value) > .001 || now < introUntil)) schedule();
  }
  function brush(event, start = false) {
    if (reduced.matches) return;
    const rect = stage.getBoundingClientRect();
    const x = THREE.MathUtils.clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const y = 1 - THREE.MathUtils.clamp((event.clientY - rect.top) / rect.height, 0, 1);
    fluid.move(x, y, start);
    // Original head-scene movement is subtle parallax, not a drag-to-spin control.
    targetX = (x * 2 - 1) * .075;
    targetY = (y * 2 - 1) * .075;
    lastMove = performance.now();
    schedule();
  }
  stage.addEventListener('pointerenter', event => {
    if (event.pointerType === 'mouse') { brush(event, true); }
  }, { passive: true });
  stage.addEventListener('pointermove', event => {
    if (event.pointerType === 'mouse' || drag?.id === event.pointerId) brush(event);
  }, { passive: true });
  stage.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse' || reduced.matches) return;
    drag = { id: event.pointerId };
    stage.setPointerCapture(event.pointerId);
    brush(event, true);
  }, { passive: true });
  for (const type of ['pointerup', 'pointercancel']) window.addEventListener(type, () => { drag = null; }, { passive: true });
  function updateUI() {
    button.setAttribute('aria-pressed', String(pinned));
    button.textContent = pinned ? '返回流体显现' : '查看完整头盔';
    instruction.textContent = reduced.matches ? 'LANDO / HELMET' : touch.matches ? '滑动，显现头盔' : '移动鼠标，流体显现头盔';
    button.hidden = reduced.matches || touch.matches;
  }
  button.addEventListener('click', () => { pinned = !pinned; updateUI(); schedule(); });
  reduced.addEventListener('change', () => {
    pinned = reduced.matches;
    if (reduced.matches) { targetX = targetY = rotationX = rotationY = 0; uniforms.uHelmetHover.value = 1; fluid.clear(); }
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
