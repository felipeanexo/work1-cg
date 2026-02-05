import * as THREE from "three";

export class SceneManager {
  constructor(scene, renderer, lights, defaultTexture, floorTexture, phongVertexShader, phongFragmentShader) {
    this.scene = scene;
    this.scene.fog = new THREE.Fog(0x0b0f14, 6, 36);
    this.renderer = renderer;
    this.lights = lights;
    this.defaultTexture = defaultTexture;
    this.floorTexture = floorTexture ?? defaultTexture;
    this.materials = [];
    this.objects = [];
    this.phongVertexShader = phongVertexShader;
    this.phongFragmentShader = phongFragmentShader;

    this.setupScene();
  }

  setupScene() {
    const grid = new THREE.GridHelper(40, 40, 0x213244, 0x182433);
    grid.position.y = 0.001;
    this.scene.add(grid);

    this.createFloor();
    this.createObjects();
  }

  createFloor() {
    const material = this.createPhongMaterial(0xffffff, 0.95, 0.0, 32.0, 0.3, 1.0, this.floorTexture);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), material);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    this.scene.add(floor);
    this.materials.push(material);
  }

  createPhongMaterial(color, roughness, metalness, shininess, specularStrength, opacity = 1.0, texture = null) {
    const uniforms = {
      uTexture: { value: texture ?? this.defaultTexture },
      uMaterialColor: { value: new THREE.Color(color) },
      uShininess: { value: shininess },
      uSpecularStrength: { value: specularStrength },
      uOpacity: { value: opacity },
      // Clipping plane (world-space): dot(vec4(worldPos,1), uClipPlane) > 0 gets discarded.
      uClipPlane: { value: new THREE.Vector4(0, 0, 0, -1e9) },
      uClipActive: { value: 0.0 },
      ...this.getLightUniforms(),
    };

    return new THREE.ShaderMaterial({
      uniforms,
      vertexShader: this.phongVertexShader,
      fragmentShader: this.phongFragmentShader,
      transparent: opacity < 1.0,
      depthWrite: opacity >= 1.0,
      clippingPlanes: [],
    });
  }

  getLightUniforms() {
    const { ambient, directional } = this.lights;
    const cameraPos = new THREE.Vector3(0, 1.6, 6.2);
    const lightDir = new THREE.Vector3().subVectors(new THREE.Vector3(0, 0, 0), directional.position).normalize();
    return {
      uAmbientColor: { value: new THREE.Color(ambient.color).multiplyScalar(ambient.intensity) },
      uLightColor: { value: new THREE.Color(directional.color).multiplyScalar(directional.intensity) },
      uLightDirection: { value: lightDir },
      uCameraPosition: { value: cameraPos },
    };
  }

  updateLightUniforms(cameraPosition) {
    this.materials.forEach((mat) => {
      if (mat.uniforms && mat.uniforms.uCameraPosition) {
        mat.uniforms.uCameraPosition.value.copy(cameraPosition);
      }
    });
  }

  createObjects() {
    const cubeA = this.createBox(0.0, 2.6, 0xffd2a8, 0.55, 0.05, 64.0, 0.8, 1.0);
    this.scene.add(cubeA);
    this.objects.push({ mesh: cubeA, rotationSpeed: 0.6 });
    this.cubeOrange = cubeA;

    const cubeB = this.createBox(0.0, -2.6, 0x8fd3ff, 0.55, 0.05, 64.0, 0.8, 1.0);
    this.scene.add(cubeB);
    this.cubeBlue = cubeB;
  }

  createBox(x, z, color, roughness, metalness, shininess, specularStrength, opacity = 1.0) {
    const material = this.createPhongMaterial(color, roughness, metalness, shininess, specularStrength, opacity);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 1.4), material);
    mesh.position.set(x, 0.7, z);
    this.materials.push(material);
    return mesh;
  }

  updateObjects(deltaTime) {
    this.objects.forEach((obj) => {
      obj.mesh.rotation.y += deltaTime * obj.rotationSpeed;
    });
  }

}
