import * as THREE from "three";
import { createCheckerTexture } from "./utils/textures.js";
import { setupLights } from "./utils/lights.js";
import { loadShaders } from "./utils/shader-loader.js";
import { CameraController } from "./classes/camera-controller.js";
import { MirrorRenderer } from "./classes/mirror-renderer.js";
import { SceneManager } from "./classes/scene-manager.js";

const canvas = document.createElement("canvas");
document.body.appendChild(canvas);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
});
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x0b0f14, 1);
renderer.localClippingEnabled = true;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.05, 200);
camera.position.set(0.0, 1.6, 6.2);
camera.lookAt(0, 0.7, 0);

const defaultTexture = createCheckerTexture(renderer, 256, 18);
const lights = setupLights(scene);

let sceneManager;
let cameraController;
let mirrorRendererA;
let mirrorRendererB;
let mirrorMesh;
let mirrorUniforms;
let mirrorMaterial;

async function init() {
  const [phongShaders, glassShaders, floorTexture, glassTexture] = await Promise.all([
    loadShaders("./shaders/phong.vert", "./shaders/phong.frag"),
    loadShaders("./shaders/glass.vert", "./shaders/glass.frag"),
    new THREE.TextureLoader().loadAsync("./textures/floor.jpg"),
    new THREE.TextureLoader().loadAsync("./textures/glass.jpg"),
  ]);

  floorTexture.colorSpace = THREE.SRGBColorSpace;
  floorTexture.wrapS = THREE.RepeatWrapping;
  floorTexture.wrapT = THREE.RepeatWrapping;
  floorTexture.repeat.set(6, 6);
  floorTexture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

  glassTexture.colorSpace = THREE.SRGBColorSpace;
  glassTexture.wrapS = THREE.RepeatWrapping;
  glassTexture.wrapT = THREE.RepeatWrapping;
  glassTexture.repeat.set(1, 1);
  glassTexture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

  sceneManager = new SceneManager(
    scene,
    renderer,
    lights,
    defaultTexture,
    floorTexture,
    phongShaders.vertex,
    phongShaders.fragment,
  );

  const mirrorPoint = new THREE.Vector3(0.0, 0.9, 0.0);
  const mirrorNormal = new THREE.Vector3(0, 0, 1);
  const thickness = 0.08;

  const dummyTexture = new THREE.DataTexture(
    new Uint8Array([0, 0, 0, 255]),
    1,
    1,
    THREE.RGBAFormat
  );
  dummyTexture.needsUpdate = true;

  mirrorUniforms = {
    uBaseTex: { value: glassTexture },
    uReflectionTexA: { value: dummyTexture },
    uReflectionTexB: { value: dummyTexture },
    uMirrorVP: { value: new THREE.Matrix4() },
    uCameraPos: { value: new THREE.Vector3() },
    uOpacity: { value: 0.85 },
    uTint: { value: new THREE.Color(0xc9d6e3) },
    uMirrorNormal: { value: mirrorNormal.clone().normalize() },
  };

  mirrorMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: mirrorUniforms,
    vertexShader: glassShaders.vertex,
    fragmentShader: glassShaders.fragment,
    clippingPlanes: [],
  });

  mirrorMesh = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.2, thickness), mirrorMaterial);
  mirrorMesh.position.copy(mirrorPoint);
  scene.add(mirrorMesh);

  // Render two reflection textures, one for each side of the mirror plane.
  mirrorRendererA = new MirrorRenderer(
    renderer,
    scene,
    camera,
    mirrorMesh,
    mirrorPoint,
    new THREE.Vector3(0, 0, -1),
    [mirrorMesh],
  );

  mirrorRendererB = new MirrorRenderer(
    renderer,
    scene,
    camera,
    mirrorMesh,
    mirrorPoint,
    new THREE.Vector3(0, 0, 1),
    [mirrorMesh],
  );

  cameraController = new CameraController(camera, canvas);

  const startButton = document.getElementById("start");
  if (startButton) {
    startButton.addEventListener("click", () => {
      canvas.requestPointerLock?.();
    });
  }

  const opacityEl = document.getElementById("opacity");
  const opacityValueEl = document.getElementById("opacityValue");
  if (opacityEl && mirrorMaterial) {
    opacityEl.addEventListener("input", () => {
      const v = Number(opacityEl.value);
      mirrorUniforms.uOpacity.value = v;
      const opaque = v >= 0.999;
      mirrorMaterial.transparent = !opaque;
      mirrorMaterial.depthWrite = opaque;
      mirrorMaterial.needsUpdate = true;
      if (opacityValueEl) opacityValueEl.textContent = v.toFixed(2);
    });
  }

  window.addEventListener("resize", () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    mirrorRendererA.resize(w, h);
    mirrorRendererB.resize(w, h);
  });

  requestAnimationFrame(animate);
}

let lastTime = performance.now();

function animate() {
  if (!sceneManager || !cameraController || !mirrorRendererA || !mirrorRendererB || !mirrorUniforms) {
    requestAnimationFrame(animate);
    return;
  }

  const currentTime = performance.now();
  const deltaTime = Math.min(0.05, (currentTime - lastTime) / 1000);
  lastTime = currentTime;

  cameraController.update(deltaTime);
  sceneManager.updateObjects(deltaTime);
  sceneManager.updateLightUniforms(camera.position);

  const reflectionA = mirrorRendererA.renderReflection(sceneManager.materials);
  const reflectionB = mirrorRendererB.renderReflection(sceneManager.materials);

  mirrorUniforms.uReflectionTexA.value = reflectionA.texture;
  mirrorUniforms.uReflectionTexB.value = reflectionB.texture;
  mirrorUniforms.uMirrorVP.value.copy(reflectionA.viewProjectionMatrix);
  mirrorUniforms.uCameraPos.value.copy(camera.position);

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

init().catch((err) => {
  console.error("Erro ao inicializar:", err);
  document.body.innerHTML = `<div style="color: white; padding: 20px; font-family: monospace;">
    <h2>Erro ao carregar aplicação</h2>
    <p>${err.message}</p>
    <p>Verifique o console do navegador para mais detalhes.</p>
  </div>`;
});
