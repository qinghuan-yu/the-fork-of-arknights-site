import * as THREE from 'three';
import { createParticlePhases, updateParticlePositions } from './particleMath.js';

// 粒子位置直接写入 GPU 缓冲区，避免逐帧触发 React 渲染。
export class ParticleScene {
  constructor(canvas, { reducedMotion = false } = {}) {
    this.canvas = canvas;
    this.reducedMotion = reducedMotion;
    this.count = matchMedia('(orientation: portrait)').matches ? 6000 : 10000;
    this.phases = createParticlePhases(this.count);
    this.positions = new Float32Array(this.count * 3);
    this.targets = new Float32Array(this.count * 3);
    this.opacities = new Float32Array(this.count);
    this.pointer = { x: 100000, y: 100000 };
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
    this.camera.position.z = 500;
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    this.geometry = new THREE.BufferGeometry();
    for (let i = 0; i < this.count; i++) {
      this.positions[i * 3] = (Math.random() - 0.5) * 1800;
      this.positions[i * 3 + 1] = (Math.random() - 0.5) * 1000;
    }
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3).setUsage(THREE.DynamicDrawUsage));
    this.geometry.setAttribute('alpha', new THREE.BufferAttribute(this.opacities, 1));
    this.material = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { size: { value: 2.2 * this.renderer.getPixelRatio() } },
      vertexShader: `attribute float alpha; varying float opacity; uniform float size;
        void main(){ opacity=alpha; gl_PointSize=size; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader: `varying float opacity;
        void main(){ float edge=1.-smoothstep(.2,.5,length(gl_PointCoord-vec2(.5))); gl_FragColor=vec4(.88,.95,1.,opacity*edge); }`,
    });
    this.cloud = new THREE.Points(this.geometry, this.material);
    this.cloud.frustumCulled = false;
    this.scene.add(this.cloud);
    this.onPointer = event => {
      const bounds = this.canvas.getBoundingClientRect();
      this.pointer = { x: event.clientX - bounds.left - bounds.width / 2, y: bounds.height / 2 - (event.clientY - bounds.top) };
    };
    this.onLeave = () => { this.pointer.x = 100000; };
    this.onVisibility = () => {
      cancelAnimationFrame(this.frame);
      if (!document.hidden && !this.reducedMotion) { this.previous = performance.now(); this.tick(this.previous); }
    };
    window.addEventListener('pointermove', this.onPointer, { passive: true });
    document.addEventListener('pointerleave', this.onLeave);
    document.addEventListener('visibilitychange', this.onVisibility);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();
    this.previous = performance.now();
    if (!reducedMotion) this.tick(this.previous);
  }

  resize() {
    const { width, height } = this.canvas.getBoundingClientRect();
    if (!width || !height) return;
    this.width = width; this.height = height;
    Object.assign(this.camera, { left: -width / 2, right: width / 2, top: height / 2, bottom: -height / 2 });
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    if (this.model) this.updateTargets();
  }

  async setModel(name, detail) {
    this.request?.abort();
    const request = this.request = new AbortController();
    try {
      const response = await fetch(`/assets/particles/${name}.json`, { signal: request.signal });
      if (!response.ok) throw Error('粒子模型读取失败');
      const model = await response.json();
      if (request.signal.aborted) return;
      this.model = model; this.detail = detail;
      this.updateTargets();
    } catch (error) { if (error.name !== 'AbortError') console.warn(error.message); }
  }

  updateTargets() {
    const portrait = this.height > this.width;
    const scale = portrait ? this.width * 1.2 : this.width * (this.detail ? 0.55 : 0.72);
    const offsetX = portrait ? -this.width * 0.1 : this.width * (this.detail ? -0.2 : 0.15);
    const offsetY = portrait ? this.height * 0.14 : -this.height * 0.04;
    for (let i = 0; i < this.count; i++) {
      const [x, y, alpha = 255] = this.model.points[i % this.model.points.length];
      this.targets[i * 3] = (x / this.model.size.width - 0.5) * scale + offsetX;
      this.targets[i * 3 + 1] = (0.5 - y / this.model.size.height) * scale + offsetY;
      this.opacities[i] = alpha / 255 * (i < this.model.points.length ? 0.9 : 0.15);
    }
    this.geometry.attributes.alpha.needsUpdate = true;
    if (this.reducedMotion) {
      this.positions.set(this.targets);
      this.geometry.attributes.position.needsUpdate = true;
      this.renderer.render(this.scene, this.camera);
    }
  }

  tick = time => {
    const blend = 1 - Math.exp(-Math.min((time - this.previous) / 1000, 0.05) * 5);
    this.previous = time;
    updateParticlePositions(this.positions, this.targets, this.phases, this.pointer, time, blend);
    this.geometry.attributes.position.needsUpdate = true;
    this.renderer.render(this.scene, this.camera);
    this.frame = requestAnimationFrame(this.tick);
  };

  dispose() {
    this.request?.abort();
    cancelAnimationFrame(this.frame);
    this.resizeObserver.disconnect();
    window.removeEventListener('pointermove', this.onPointer);
    document.removeEventListener('pointerleave', this.onLeave);
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.geometry.dispose(); this.material.dispose(); this.renderer.dispose();
  }
}
