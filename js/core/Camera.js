import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CONFIG } from '../config.js';

export class CameraManager {
    constructor(renderer) {
        this.camera = null;
        this.controls = null;
        this.renderer = renderer;
        this.setupCamera();
    }

    setupCamera() {
        const aspect = window.innerWidth / window.innerHeight;
        
        // Create perspective camera
        this.camera = new THREE.PerspectiveCamera(
            CONFIG.camera.fov,
            aspect,
            CONFIG.camera.near,
            CONFIG.camera.far
        );

        // Set initial position
        this.camera.position.set(
            CONFIG.camera.initialPosition.x,
            CONFIG.camera.initialPosition.y,
            CONFIG.camera.initialPosition.z
        );
    }

    setupControls(domElement) {
        this.controls = new OrbitControls(this.camera, domElement);
        
        // Apply control settings from config
        this.controls.enableDamping = CONFIG.controls.enableDamping;
        this.controls.dampingFactor = CONFIG.controls.dampingFactor;
        this.controls.rotateSpeed = CONFIG.controls.rotateSpeed;
        this.controls.zoomSpeed = CONFIG.controls.zoomSpeed;
        this.controls.panSpeed = CONFIG.controls.panSpeed;
        this.controls.enablePan = CONFIG.controls.enablePan;  // Disable panning
        this.controls.minDistance = CONFIG.controls.minDistance;
        this.controls.maxDistance = CONFIG.controls.maxDistance;
        this.controls.minPolarAngle = CONFIG.controls.minPolarAngle;
        this.controls.maxPolarAngle = CONFIG.controls.maxPolarAngle;
        this.controls.autoRotate = CONFIG.controls.autoRotate;
        this.controls.autoRotateSpeed = CONFIG.controls.autoRotateSpeed;

        // Set initial look-at target
        this.controls.target.set(
            CONFIG.camera.lookAt.x,
            CONFIG.camera.lookAt.y,
            CONFIG.camera.lookAt.z
        );

        this.controls.update();
    }

    getCamera() {
        return this.camera;
    }

    getControls() {
        return this.controls;
    }

    update() {
        if (this.controls) {
            this.controls.update();
        }
    }

    resetCamera() {
        this.camera.position.set(
            CONFIG.camera.initialPosition.x,
            CONFIG.camera.initialPosition.y,
            CONFIG.camera.initialPosition.z
        );
        
        this.controls.target.set(
            CONFIG.camera.lookAt.x,
            CONFIG.camera.lookAt.y,
            CONFIG.camera.lookAt.z
        );
        
        this.controls.update();
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
    }
}
