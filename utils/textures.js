import * as THREE from "three";

export function createCheckerTexture(renderer, size = 256, cells = 16) {
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const cx = Math.floor((x / size) * cells);
      const cy = Math.floor((y / size) * cells);
      const on = (cx + cy) % 2 === 0;
      const i = (y * size + x) * 4;
      const v = on ? 215 : 45;
      data[i + 0] = v;
      data[i + 1] = v;
      data[i + 2] = v;
      data[i + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.needsUpdate = true;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
