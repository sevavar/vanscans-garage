import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class RendererManager {
    constructor(container) {
        this.container = container;
        this.renderer = null;
        this.setupRenderer();
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: CONFIG.renderer.antialias,
            alpha: false
        });

        // Set renderer properties
        this.renderer.setPixelRatio(CONFIG.renderer.pixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        // Enable shadows
        if (CONFIG.renderer.shadowsEnabled) {
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }

        // Set tone mapping
        this.renderer.toneMapping = CONFIG.renderer.toneMapping;
        this.renderer.toneMappingExposure = CONFIG.renderer.toneMappingExposure;

        // Set output encoding for better colors
        this.renderer.outputEncoding = THREE.sRGBEncoding;

        // Append to container
        this.container.appendChild(this.renderer.domElement);
    }

    getRenderer() {
        return this.renderer;
    }

    getDomElement() {
        return this.renderer.domElement;
    }

    render(scene, camera) {
        this.renderer.render(scene, camera);
    }

    onWindowResize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    dispose() {
        this.renderer.dispose();
    }
}
