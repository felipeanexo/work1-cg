import * as THREE from "three";

export class CameraController {
  constructor(camera, canvas) {
    this.camera = camera;
    this.canvas = canvas;
    this.keys = new Set();
    this.pointerLocked = false;
    this.euler = new THREE.Euler(0, 0, 0, "YXZ");
    this.velocity = new THREE.Vector3();
    this.speed = 3.4;
    this.fastSpeed = 6.5;

    this.setupEventListeners();
  }

  setupEventListeners() {
    window.addEventListener("keydown", (e) => this.onKey(e, true));
    window.addEventListener("keyup", (e) => this.onKey(e, false));

    this.canvas.addEventListener("click", () => {
      if (!this.pointerLocked) {
        this.canvas.requestPointerLock?.();
      }
    });

    document.addEventListener("pointerlockchange", () => {
      this.pointerLocked = document.pointerLockElement === this.canvas;
    });

    document.addEventListener("mousemove", (e) => {
      if (!this.pointerLocked) return;
      const mx = e.movementX || 0;
      const my = e.movementY || 0;
      this.euler.setFromQuaternion(this.camera.quaternion);
      this.euler.y -= mx * 0.0022;
      this.euler.x -= my * 0.0022;
      this.euler.x = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.euler.x));
      this.camera.quaternion.setFromEuler(this.euler);
    });
  }

  onKey(e, down) {
    const k = e.code;
    if (
      k === "KeyW" ||
      k === "KeyA" ||
      k === "KeyS" ||
      k === "KeyD" ||
      k === "Space" ||
      k === "ShiftLeft" ||
      k === "ShiftRight"
    ) {
      if (down) this.keys.add(k);
      else this.keys.delete(k);
    }
  }

  update(deltaTime) {
    const speed = this.keys.has("ShiftLeft") || this.keys.has("ShiftRight") ? this.fastSpeed : this.speed;
    this.velocity.set(0, 0, 0);

    if (this.keys.has("KeyW")) this.velocity.z -= 1;
    if (this.keys.has("KeyS")) this.velocity.z += 1;
    if (this.keys.has("KeyA")) this.velocity.x -= 1;
    if (this.keys.has("KeyD")) this.velocity.x += 1;
    if (this.keys.has("Space")) this.velocity.y += 1;
    if (this.keys.has("ShiftLeft") || this.keys.has("ShiftRight")) this.velocity.y -= 0.6;

    if (this.velocity.lengthSq() > 0) {
      this.velocity.normalize().multiplyScalar(speed * deltaTime);
    }

    this.velocity.applyQuaternion(this.camera.quaternion);
    this.camera.position.add(this.velocity);
  }
}
