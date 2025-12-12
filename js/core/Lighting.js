import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class LightingManager {
    constructor(scene) {
        this.scene = scene;
        this.lights = [];
        this.setupLights();
    }

    setupLights() {
        // Add low-intensity ambient light for garage atmosphere
        const ambientLight = new THREE.AmbientLight(
            CONFIG.lighting.ambient.color,
            CONFIG.lighting.ambient.intensity
        );
        this.scene.add(ambientLight);
        this.lights.push(ambientLight);

        // Add spotlights (garage ceiling lights)
        CONFIG.lighting.spotlights.forEach((lightConfig, index) => {
            const spotlight = new THREE.SpotLight(
                lightConfig.color,
                lightConfig.intensity,
                lightConfig.distance,
                lightConfig.angle,
                lightConfig.penumbra,
                1  // decay
            );
            
            spotlight.position.set(
                lightConfig.position.x,
                lightConfig.position.y,
                lightConfig.position.z
            );

            // Set target position
            spotlight.target.position.set(
                lightConfig.target.x,
                lightConfig.target.y,
                lightConfig.target.z
            );
            this.scene.add(spotlight.target);

            if (lightConfig.castShadow) {
                spotlight.castShadow = true;
                spotlight.shadow.mapSize.width = 2048;
                spotlight.shadow.mapSize.height = 2048;
                spotlight.shadow.camera.near = 0.5;
                spotlight.shadow.camera.far = 20;
                spotlight.shadow.bias = -0.001;  // Increased to reduce shadow acne
                spotlight.shadow.normalBias = 0.05;  // Helps reduce artifacts on curved surfaces
                // Increase shadow darkness
                spotlight.shadow.darkness = 0.9;
            }

            this.scene.add(spotlight);
            this.lights.push(spotlight);

            // Add pink helper sphere to visualize light position
            const helperGeometry = new THREE.SphereGeometry(0.1, 16, 16);
            const helperMaterial = new THREE.MeshBasicMaterial({ color: 0xff00ff });
            const helperSphere = new THREE.Mesh(helperGeometry, helperMaterial);
            helperSphere.position.copy(spotlight.position);
            //this.scene.add(helperSphere);
        });
    }

    getLights() {
        return this.lights;
    }

    updateLightIntensity(index, intensity) {
        if (this.lights[index]) {
            this.lights[index].intensity = intensity;
        }
    }
}
