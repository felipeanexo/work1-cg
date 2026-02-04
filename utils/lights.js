import * as THREE from "three";

export function setupLights(scene) {
  const ambient = new THREE.AmbientLight(0xffffff, 0.9);
  scene.add(ambient);

  const directional = new THREE.DirectionalLight(0xffffff, 1.8);
  directional.position.set(5, 8, 4);
  scene.add(directional);

  return { ambient, directional };
}

export function getLightUniforms(ambient, directional, camera) {
  return {
    uAmbientColor: { value: new THREE.Color(ambient.color).multiplyScalar(ambient.intensity) },
    uLightColor: { value: new THREE.Color(directional.color).multiplyScalar(directional.intensity) },
    uLightDirection: { value: new THREE.Vector3().subVectors(directional.position, new THREE.Vector3(0, 0, 0)).normalize() },
    uCameraPosition: { value: camera.position },
  };
}
