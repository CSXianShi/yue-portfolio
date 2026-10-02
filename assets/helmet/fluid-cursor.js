import * as THREE from '../vendor/three/three.module.js';
import { AI, qY, qO, DO, XO, tN, IO, KO } from './reference-fluid-shaders.js';

// Standalone adapter of the reference site's p9/m9 fluid pipeline.
// Original shader bodies and simulation defaults are retained; no site globals.
export class FluidCursor {
  constructor(renderer) {
    this.renderer = renderer;
    this.size = new THREE.Vector2(80, 80);
    this.px = new THREE.Vector2(1 / 110, 1 / 110);
    this.boundary = this.px.clone();
    this.pointer = new THREE.Vector2();
    this.previous = new THREE.Vector2();
    this.force = new THREE.Vector2();
    this.pending = false;
    this.fbos = {};
    for (const name of ['velocity', 'advected', 'divergence', 'pressure0', 'pressure1']) {
      this.fbos[name] = new THREE.WebGLRenderTarget(80, 80, { type: THREE.HalfFloatType, depthBuffer: false });
    }
    this.output = new THREE.WebGLRenderTarget(80, 80, { depthBuffer: false });
    const common = () => ({ boundarySpace: { value: this.boundary }, px: { value: this.px } });
    const pass = (vertexShader, fragmentShader, uniforms) => {
      const scene = new THREE.Scene();
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.RawShaderMaterial({ vertexShader, fragmentShader, uniforms, depthTest: false, depthWrite: false }));
      scene.add(mesh);
      return { scene, material: mesh.material, uniforms };
    };
    this.camera = new THREE.Camera();
    this.advection = pass(AI, qY, { ...common(), velocity: { value: this.fbos.velocity.texture }, dt: { value: .014 }, dissipation: { value: .96 }, isBFECC: { value: true }, fboSize: { value: this.size } });
    this.divergence = pass(AI, qO, { ...common(), velocity: { value: this.fbos.advected.texture }, dt: { value: .014 } });
    this.poisson = pass(AI, DO, { ...common(), pressure: { value: this.fbos.pressure0.texture }, divergence: { value: this.fbos.divergence.texture }, straightness: { value: 1 } });
    this.pressure = pass(AI, XO, { ...common(), pressure: { value: this.fbos.pressure0.texture }, velocity: { value: this.fbos.advected.texture }, dt: { value: .014 } });
    this.visual = pass(AI, tN, { ...common(), velocity: { value: this.fbos.velocity.texture } });
    this.splat = pass(IO, KO, { px: { value: this.px }, center: { value: this.pointer }, scale: { value: new THREE.Vector2(18, 18) }, force: { value: this.force } });
    this.splat.scene.children[0].geometry.dispose();
    this.splat.scene.children[0].geometry = new THREE.PlaneGeometry(1, 1);
    this.splat.material.blending = THREE.AdditiveBlending;
    this.splat.material.transparent = true;
    this.splat.material.premultipliedAlpha = false;
    this.clear();
  }
  render(pass, target, clear = true) {
    const old = this.renderer.autoClear;
    this.renderer.autoClear = clear;
    this.renderer.setRenderTarget(target);
    this.renderer.render(pass.scene, this.camera);
    this.renderer.autoClear = old;
  }
  clear() {
    const color = this.renderer.getClearColor(new THREE.Color()), alpha = this.renderer.getClearAlpha();
    this.renderer.setClearColor(0, 0);
    for (const target of Object.values(this.fbos)) { this.renderer.setRenderTarget(target); this.renderer.clear(); }
    this.renderer.setClearColor(color, alpha);
    this.render(this.visual, this.output);
    this.renderer.setRenderTarget(null);
    this.pending = false;
  }
  resize(width, height) {
    this.size.set(Math.max(32, Math.round(width * .1)), Math.max(32, Math.round(height * .1)));
    this.px.set(1 / 110, this.size.x / this.size.y / 110);
    this.boundary.copy(this.px);
    for (const target of [...Object.values(this.fbos), this.output]) target.setSize(this.size.x, this.size.y);
    this.clear();
  }
  move(x, y, start = false) {
    const next = new THREE.Vector2(x * 2 - 1, y * 2 - 1);
    if (start) this.previous.copy(next);
    this.force.add(next.clone().sub(this.previous).multiplyScalar(25));
    this.previous.copy(next);
    const marginX = 20 * this.px.x, marginY = 20 * this.px.y;
    this.pointer.set(THREE.MathUtils.clamp(next.x, -1 + marginX, 1 - marginX), THREE.MathUtils.clamp(next.y, -1 + marginY, 1 - marginY));
    this.pending = true;
  }
  update() {
    this.render(this.advection, this.fbos.advected);
    if (this.pending) this.render(this.splat, this.fbos.advected, false);
    this.render(this.divergence, this.fbos.divergence);
    let read = this.fbos.pressure0, write = this.fbos.pressure1;
    for (let i = 0; i < 4; i++) {
      this.poisson.uniforms.pressure.value = read.texture;
      this.render(this.poisson, write);
      [read, write] = [write, read];
    }
    this.pressure.uniforms.pressure.value = read.texture;
    this.render(this.pressure, this.fbos.velocity);
    this.render(this.visual, this.output);
    this.renderer.setRenderTarget(null);
    this.force.set(0, 0);
    this.pending = false;
  }
}
