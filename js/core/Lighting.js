import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class LightingManager {
    constructor(scene) {
        this.scene = scene;
        this.lights = [];
        this.setupLights();
    }

    setupLights() {
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(
            CONFIG.lighting.ambient.color,
            CONFIG.lighting.ambient.intensity
        );
        this.scene.add(ambientLight);
        this.lights.push(ambientLight);

        // Add hemisphere light
        const hemiLight = new THREE.HemisphereLight(
            CONFIG.lighting.hemisphere.skyColor,
            CONFIG.lighting.hemisphere.groundColor,
            CONFIG.lighting.hemisphere.intensity
        );
        this.scene.add(hemiLight);
        this.lights.push(hemiLight);

        // Add directional lights
        CONFIG.lighting.directional.forEach((lightConfig, index) => {
            const dirLight = new THREE.DirectionalLight(
                lightConfig.color,
                lightConfig.intensity
            );
            
            dirLight.position.set(
                lightConfig.position.x,
                lightConfig.position.y,
                lightConfig.position.z
            );

            if (lightConfig.castShadow) {
                dirLight.castShadow = true;
                dirLight.shadow.mapSize.width = 2048;
                dirLight.shadow.mapSize.height = 2048;
                dirLight.shadow.camera.near = 0.5;
                dirLight.shadow.camera.far = 50;
                dirLight.shadow.camera.left = -20;
                dirLight.shadow.camera.right = 20;
                dirLight.shadow.camera.top = 20;
                dirLight.shadow.camera.bottom = -20;
            }

            this.scene.add(dirLight);
            this.lights.push(dirLight);
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
