import * as THREE from 'three';
import { shuffledModel, updateParticles } from './particleMath.js';
import { WorldHover } from './WorldHover.js';

export class ParticleScene {
  constructor(canvas, { reducedMotion = false } = {}) {
    this.canvas = canvas; this.reducedMotion = reducedMotion; this.count = 10000;
    this.positions = new Float32Array(this.count * 3); this.colors = new Float32Array(this.count * 4);
    this.speeds = Float32Array.from({ length: this.count }, () => 20 + Math.random() * 10);
    this.targets = new Float32Array(); this.cache = new Map();
    this.pointer = { x: 0, y: 0, active: false }; this.transform = { x: 0, y: 0, scale: 1 };
    this.scene = new THREE.Scene(); this.camera = new THREE.PerspectiveCamera(45, 1, 110, 1000); this.camera.position.z = 160;
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    for (let i = 0; i < this.count; i++) {
      this.positions.set([(Math.random() - .5) * innerWidth, (Math.random() - .5) * innerHeight, (Math.random() - .5) * 500], i * 3);
      this.colors.set([.5, .5, .5, -1], i * 4);
    }
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3).setUsage(THREE.DynamicDrawUsage));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 4).setUsage(THREE.DynamicDrawUsage));
    this.texture = new THREE.TextureLoader().load('/assets/particles/particle.png', () => this.render());
    this.material = new THREE.ShaderMaterial({
      transparent: true, depthTest: false, depthWrite: false,
      uniforms: { uTexture: { value: this.texture }, size: { value: 3 * this.renderer.getPixelRatio() } },
      vertexShader: `attribute vec4 color; varying vec4 vColor; uniform float size;
        void main(){ vColor=color; gl_PointSize=size; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader: `varying vec4 vColor; uniform sampler2D uTexture;
        void main(){ gl_FragColor=vColor*texture2D(uTexture,gl_PointCoord); }`,
    });
    this.cloud = new THREE.Points(this.geometry, this.material); this.cloud.frustumCulled = false; this.scene.add(this.cloud);
    this.hover = new WorldHover(this.scene);
    this.onPointer = event => { this.pointer = { x: event.clientX - innerWidth / 2, y: innerHeight / 2 - event.clientY, active: true }; };
    this.onLeave = () => { this.pointer.active = false; };
    this.onVisibility = () => { cancelAnimationFrame(this.frame); if (!document.hidden && this.active) this.start(); };
    window.addEventListener('pointermove', this.onPointer, { passive: true });
    document.addEventListener('pointerleave', this.onLeave); document.addEventListener('visibilitychange', this.onVisibility);
    this.resizeObserver = new ResizeObserver(() => this.resize()); this.resizeObserver.observe(canvas); this.resize();
  }
  resize() {
    const { width, height } = this.canvas.getBoundingClientRect(); if (!width || !height) return;
    this.width = width; this.height = height;
    this.camera.aspect = width / height; this.camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(height / 320)); this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false); this.updateTransform();
    if (this.reducedMotion) this.snap();
  }
  updateTransform() {
    const root = parseFloat(getComputedStyle(document.documentElement).fontSize), ratio = root / 16;
    const portrait = this.height > this.width;
    this.transform = this.detail ? { x: portrait ? -5.75 * root * ratio : -.2 * this.width, y: (portrait ? .15 : .05) * this.height, scale: (portrait ? 1 : 1.2) * ratio } : { x: .15 * this.width, y: 0, scale: 1.8 * ratio };
  }
  async setModel(name, detail) {
    this.active = true; this.name = name; this.detail = detail; this.stopAt = null;
    const request = this.request = (this.request || 0) + 1;
    if (!this.cache.has(name)) this.cache.set(name, fetch(`/assets/particles/${name}.json`).then(response => { if (!response.ok) throw Error('粒子模型读取失败'); return response.json(); }));
    const model = await this.cache.get(name);
    if (this.disposed || request !== this.request || !this.active) return;
    this.model = model; this.targets = shuffledModel(model); this.updateTransform();
    if (this.reducedMotion) this.snap(); else this.start();
  }
  disappear() {
    this.active = false; this.request++; this.hover.setImage(null, this.pointer);
    if (!this.model) return;
    this.targets = shuffledModel(this.model);
    for (let i = 0; i < this.targets.length; i += 7) {
      this.targets[i] += (Math.random() - .5) * 100; this.targets[i + 1] += (Math.random() - .5) * 100;
      this.targets.set([.5, .5, .5, -.5], i + 3);
    }
    this.stopAt = performance.now() + 2000;
    if (this.reducedMotion) { this.colors.fill(0); this.geometry.attributes.color.needsUpdate = true; this.render(); } else this.start();
  }
  setHover(image) { this.hover.setImage(this.reducedMotion || !this.active ? null : image, this.pointer).catch(() => {}); }
  snap() {
    updateParticles(this.positions, this.colors, this.targets, this.speeds, this.transform, { active: false }, 10000);
    this.geometry.attributes.position.needsUpdate = true; this.geometry.attributes.color.needsUpdate = true; this.render();
  }
  start() { cancelAnimationFrame(this.frame); this.previous = performance.now(); this.frame = requestAnimationFrame(this.tick); }
  render() { if (!this.disposed) this.renderer.render(this.scene, this.camera); }
  tick = time => {
    const frames = Math.min((time - this.previous) / (1000 / 60), 3); this.previous = time;
    updateParticles(this.positions, this.colors, this.targets, this.speeds, this.transform, this.pointer, frames);
    this.geometry.attributes.position.needsUpdate = true; this.geometry.attributes.color.needsUpdate = true;
    this.hover.update(this.pointer, frames); this.render();
    if (!document.hidden && (!this.stopAt || time < this.stopAt)) this.frame = requestAnimationFrame(this.tick);
  };
  dispose() {
    this.disposed = true; this.request++; cancelAnimationFrame(this.frame); this.resizeObserver.disconnect();
    window.removeEventListener('pointermove', this.onPointer); document.removeEventListener('pointerleave', this.onLeave); document.removeEventListener('visibilitychange', this.onVisibility);
    this.hover.dispose(); this.texture.dispose(); this.geometry.dispose(); this.material.dispose(); this.renderer.dispose();
  }
}
