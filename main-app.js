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
let mirrorRenderer;
let mirrorRendererBack;
let glassMesh;
let glassUniforms;
let cubeMaterial;

async function init() {
  const [phongShaders, glassShaders, mirrorShaders] = await Promise.all([
    loadShaders("./shaders/phong.vert", "./shaders/phong.frag"),
    loadShaders("./shaders/glass.vert", "./shaders/glass.frag"),
    loadShaders("./shaders/mirror.vert", "./shaders/mirror.frag"),
  ]);

  sceneManager = new SceneManager(
    scene,
    renderer,
    lights,
    defaultTexture,
    phongShaders.vertex,
    phongShaders.fragment,
  );
  
  cubeMaterial = sceneManager.cube.material;

  const glassPoint = new THREE.Vector3(0.0, 0.85, 1.3);
  const glassNormal = new THREE.Vector3(0, 0, -1);

  const mirrorPoint = new THREE.Vector3(2.8, 0.85, 0.0);
  const mirrorNormal = new THREE.Vector3(-1, 0, 0);

  const dummyTexture = new THREE.DataTexture(
    new Uint8Array([0, 0, 0, 255]),
    1,
    1,
    THREE.RGBAFormat
  );
  dummyTexture.needsUpdate = true;

  glassUniforms = {
    uBaseTex: { value: defaultTexture },
    uReflectionTex: { value: dummyTexture },
    uMirrorVP: { value: new THREE.Matrix4() },
    uCameraPos: { value: new THREE.Vector3() },
    uOpacity: { value: 0.45 },
    uTint: { value: new THREE.Color(0x0f1a22) },
  };

  const glassMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: glassUniforms,
    vertexShader: glassShaders.vertex,
    fragmentShader: glassShaders.fragment,
    clippingPlanes: [],
  });

  const glassPlane = new THREE.PlaneGeometry(2.2, 2.2, 1, 1);
  glassMesh = new THREE.Mesh(glassPlane, glassMaterial);
  glassMesh.position.copy(glassPoint);
  glassMesh.rotation.y = 0;
  scene.add(glassMesh);

  const mirrorUniforms = {
    uReflectionTex: { value: dummyTexture },
    uReflectionTexBack: { value: dummyTexture },
    uMirrorVP: { value: new THREE.Matrix4() },
    uMirrorVPBack: { value: new THREE.Matrix4() },
    uTint: { value: new THREE.Color(0x0b0f14) },
    uReflectStrength: { value: 1.0 },
    uSide: { value: 0.0 },
  };

  const mirrorMaterial = new THREE.ShaderMaterial({
    transparent: false,
    depthWrite: true,
    uniforms: mirrorUniforms,
    vertexShader: mirrorShaders.vertex,
    fragmentShader: mirrorShaders.fragment,
  });

  const mirrorPlane = new THREE.PlaneGeometry(2.2, 2.2, 1, 1);
  const mirrorMesh = new THREE.Mesh(mirrorPlane, mirrorMaterial);
  mirrorMesh.position.copy(mirrorPoint);
  mirrorMesh.rotation.y = Math.PI / 2;
  scene.add(mirrorMesh);

  const mirrorNormalBack = new THREE.Vector3(1, 0, 0);

  mirrorRenderer = new MirrorRenderer(
    renderer,
    scene,
    camera,
    mirrorMesh,
    mirrorPoint,
    mirrorNormal,
    [glassMesh, mirrorMesh],
  );

  mirrorRendererBack = new MirrorRenderer(
    renderer,
    scene,
    camera,
    mirrorMesh,
    mirrorPoint,
    mirrorNormalBack,
    [glassMesh, mirrorMesh],
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
  if (opacityEl) {
    opacityEl.addEventListener("input", () => {
      const v = Number(opacityEl.value);
      glassUniforms.uOpacity.value = v;
      if (opacityValueEl) opacityValueEl.textContent = v.toFixed(2);
    });
  }

  const cubeOpacityEl = document.getElementById("cubeOpacity");
  const cubeOpacityValueEl = document.getElementById("cubeOpacityValue");
  if (cubeOpacityEl && cubeMaterial) {
    cubeOpacityEl.addEventListener("input", () => {
      const v = Number(cubeOpacityEl.value);
      cubeMaterial.uniforms.uOpacity.value = v;
      cubeMaterial.transparent = v < 1.0;
      cubeMaterial.depthWrite = v >= 1.0;
      cubeMaterial.needsUpdate = true;
      if (cubeOpacityValueEl) cubeOpacityValueEl.textContent = v.toFixed(2);
    });
  }

  window.addEventListener("resize", () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    mirrorRenderer.resize(w, h);
    mirrorRendererBack.resize(w, h);
  });

  requestAnimationFrame(animate);
}

let lastTime = performance.now();

function animate() {
  if (!sceneManager || !cameraController || !mirrorRenderer || !mirrorRendererBack || !glassUniforms) {
    requestAnimationFrame(animate);
    return;
  }

  const currentTime = performance.now();
  const deltaTime = Math.min(0.05, (currentTime - lastTime) / 1000);
  lastTime = currentTime;

  cameraController.update(deltaTime);
  sceneManager.updateObjects(deltaTime);
  sceneManager.updateLightUniforms(camera.position);

  const reflectionData = mirrorRenderer.renderReflection(sceneManager.materials);
  const reflectionDataBack = mirrorRendererBack.renderReflection(sceneManager.materials);

  glassUniforms.uReflectionTex.value = reflectionData.texture;
  glassUniforms.uMirrorVP.value.copy(reflectionData.viewProjectionMatrix);
  glassUniforms.uCameraPos.value.copy(camera.position);

  const mirrorMat = mirrorRenderer.mirrorMesh?.material;
  if (mirrorMat?.uniforms) {
    mirrorMat.uniforms.uReflectionTex.value = reflectionData.texture;
    mirrorMat.uniforms.uMirrorVP.value.copy(reflectionData.viewProjectionMatrix);
    mirrorMat.uniforms.uReflectionTexBack.value = reflectionDataBack.texture;
    mirrorMat.uniforms.uMirrorVPBack.value.copy(reflectionDataBack.viewProjectionMatrix);
  }

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
