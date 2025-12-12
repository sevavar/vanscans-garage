import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class SceneManager {
    constructor() {
        this.scene = new THREE.Scene();
        this.setupScene();
    }

    setupScene() {
        // Set background color
        this.scene.background = new THREE.Color(CONFIG.scene.backgroundColor);

        // Add fog if enabled
        if (CONFIG.scene.fog.enabled) {
            this.scene.fog = new THREE.Fog(
                CONFIG.scene.fog.color,
                CONFIG.scene.fog.near,
                CONFIG.scene.fog.far
            );
        }

        // Add a ground plane for reference
        this.addGroundPlane();
    }

    addGroundPlane() {
        const geometry = new THREE.PlaneGeometry(100, 100);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            roughness: 0.8,
            metalness: 0.2
        });
        const ground = new THREE.Mesh(geometry, material);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        ground.position.y = 0;
        this.scene.add(ground);

        // Add grid helper for development
        const gridHelper = new THREE.GridHelper(100, 100, 0x444444, 0x222222);
        //this.scene.add(gridHelper);
    }

    getScene() {
        return this.scene;
    }

    addObject(object) {
        this.scene.add(object);
    }

    removeObject(object) {
        this.scene.remove(object);
    }

    clear() {
        while (this.scene.children.length > 0) {
            this.scene.remove(this.scene.children[0]);
        }
    }
}
