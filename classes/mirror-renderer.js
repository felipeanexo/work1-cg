import * as THREE from "three";

export class MirrorRenderer {
  constructor(renderer, scene, mainCamera, mirrorMesh, planePoint, planeNormal, hiddenMeshes = []) {
    this.renderer = renderer;
    this.scene = scene;
    this.mainCamera = mainCamera;
    this.mirrorMesh = mirrorMesh;
    this.planePoint = planePoint;
    this.planeNormal = planeNormal;
    this.hiddenMeshes = hiddenMeshes;

    this.mirrorCamera = new THREE.PerspectiveCamera(
      mainCamera.fov,
      mainCamera.aspect,
      mainCamera.near,
      mainCamera.far,
    );

    this.renderTarget = new THREE.WebGLRenderTarget(1024, 1024, {
      depthBuffer: true,
      stencilBuffer: false,
    });
    this.renderTarget.texture.colorSpace = THREE.SRGBColorSpace;

    this.clippingPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(
      planeNormal,
      planePoint,
    );

    this.tmpVec = new THREE.Vector3();
  }

  updateMirrorCamera() {
    this.mirrorCamera.position.copy(this.mainCamera.position);
    this.mirrorCamera.quaternion.copy(this.mainCamera.quaternion);
    this.mirrorCamera.updateMatrixWorld(true);

    const dist = this.planeNormal.dot(
      this.tmpVec.copy(this.mirrorCamera.position).sub(this.planePoint)
    );
    
    this.mirrorCamera.position.addScaledVector(this.planeNormal, -2 * dist);

    const q = this.mirrorCamera.quaternion.clone();
    const m = new THREE.Matrix4().makeRotationFromQuaternion(q);
    const forward = new THREE.Vector3(0, 0, -1).applyMatrix4(m).normalize();
    const up = new THREE.Vector3(0, 1, 0).applyMatrix4(m).normalize();

    forward.reflect(this.planeNormal);
    up.reflect(this.planeNormal);

    const lookAt = this.tmpVec.copy(this.mirrorCamera.position).add(forward);
    this.mirrorCamera.up.copy(up);
    this.mirrorCamera.lookAt(lookAt);
    this.mirrorCamera.updateMatrixWorld(true);
  }

  renderReflection(materials) {
    this.updateMirrorCamera();

    // Three.js discards fragments on the "positive" side of the plane (normal direction).
    // So we keep the side opposite to `planeNormal` and clip away the side pointed by it.
    const clipForMirror = this.clippingPlane.clone();

    const prevTarget = this.renderer.getRenderTarget();
    const prevVis = this.hiddenMeshes.map((m) => m.visible);
    this.hiddenMeshes.forEach((m) => {
      m.visible = false;
    });

    materials.forEach((mat) => {
      mat.clippingPlanes = [clipForMirror];
    });

    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.clear();
    this.renderer.render(this.scene, this.mirrorCamera);

    materials.forEach((mat) => {
      mat.clippingPlanes = [];
    });

    this.renderer.setRenderTarget(prevTarget);
    this.hiddenMeshes.forEach((m, i) => {
      m.visible = prevVis[i];
    });

    return {
      texture: this.renderTarget.texture,
      viewProjectionMatrix: new THREE.Matrix4().multiplyMatrices(
        this.mirrorCamera.projectionMatrix,
        this.mirrorCamera.matrixWorldInverse,
      ),
    };
  }

  resize(width, height) {
    this.mirrorCamera.aspect = this.mainCamera.aspect;
    this.mirrorCamera.updateProjectionMatrix();
  }
}
