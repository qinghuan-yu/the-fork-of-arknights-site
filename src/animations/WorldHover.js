import * as THREE from 'three';

// 以光标追随速度同时驱动网格形变和 RGB 采样偏移。
export class WorldHover {
  constructor(scene) {
    this.scene = scene; this.textures = new Map(); this.loader = new THREE.TextureLoader();
    this.material = new THREE.ShaderMaterial({
      transparent: true, depthTest: false,
      uniforms: { uTexture: { value: null }, speed: { value: new THREE.Vector2() } },
      vertexShader: `varying vec2 vUv; uniform vec2 speed;
        void main() {
          vUv = uv;
          vec3 bent = position + vec3(cos((uv.y-.5)*1.5707963268)*speed.x*300., cos((uv.x-.5)*1.5707963268)*speed.y*300., 0.);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(bent,1.);
        }`,
      fragmentShader: `varying vec2 vUv; uniform sampler2D uTexture; uniform vec2 speed;
        void main() {
          vec2 offset = vec2(cos((vUv.y-.5)*1.5707963268)*speed.x, cos((vUv.x-.5)*1.5707963268)*speed.y)*1.5;
          vec4 r=texture2D(uTexture,vUv+offset*.01), g=texture2D(uTexture,vUv+offset*.02), b=texture2D(uTexture,vUv+offset*.03);
          gl_FragColor=vec4(r.r*r.a,g.g*g.a,b.b*b.a,r.a+g.a+b.a);
        }`,
    });
    this.geometry = new THREE.PlaneGeometry(1000, 1000, 100, 100);
    this.mesh = new THREE.Mesh(this.geometry, this.material); this.mesh.visible = false;
    scene.add(this.mesh);
  }
  async setImage(url, pointer) {
    const wasVisible = this.mesh.visible;
    this.url = url;
    if (!url) { this.mesh.visible = false; return; }
    if (!this.textures.has(url)) this.textures.set(url, this.loader.loadAsync(url));
    const texture = await this.textures.get(url);
    if (this.disposed || this.url !== url) return;
    this.material.uniforms.uTexture.value = texture;
    if (!wasVisible) this.mesh.position.set(pointer.x, pointer.y, 0);
    this.mesh.visible = true;
  }
  update(pointer, frames) {
    if (!this.mesh.visible) return;
    const dx = pointer.x - this.mesh.position.x, dy = pointer.y - this.mesh.position.y;
    const distance = Math.hypot(dx, dy), speed = Math.max(.03, Math.min(distance / 24, 100));
    const factor = distance > .72 ? speed / distance : 0;
    const x = Math.abs(dx) < .72 ? 0 : dx * factor, y = Math.abs(dy) < .72 ? 0 : dy * factor;
    this.mesh.position.x = Math.abs(dx) < .72 ? pointer.x : this.mesh.position.x + x * frames;
    this.mesh.position.y = Math.abs(dy) < .72 ? pointer.y : this.mesh.position.y + y * frames;
    this.material.uniforms.speed.value.set(x / 24, y / 24);
  }
  dispose() {
    this.disposed = true; this.scene.remove(this.mesh); this.geometry.dispose(); this.material.dispose();
    for (const texture of this.textures.values()) texture.then(item => item.dispose());
  }
}
