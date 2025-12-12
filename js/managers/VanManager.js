import { ModelLoader } from '../utils/ModelLoader.js';
import { CONFIG } from '../config.js';
import * as THREE from 'three';

/**
 * VanManager - Manages loading and switching between van models
 * Designed for future expansion with multiple vans
 */
export class VanManager {
    constructor(scene, onLoadProgress = null) {
        this.scene = scene;
        this.modelLoader = new ModelLoader(onLoadProgress);
        this.currentVan = null;
        this.garageModel = null;
        this.vans = new Map(); // Store loaded vans for quick switching
        this.currentVanId = null;
        this.availableVans = []; // Dynamically detected vans
        this.vansDetected = false;
        this.wheelModel = null; // Cached wheel model
        this.loadWheelModel(); // Preload wheel model
    }

    /**
     * Detect available van models in the vans folder
     * Attempts to load vans from 001 to 999 and builds a list of available ones
     */
    async detectAvailableVans() {
        if (this.vansDetected) {
            return this.availableVans;
        }

        console.log('Detecting available van models...');
        const detectedVans = [];
        
        // Check vans in parallel for better performance
        const checkCount = 100; // Check first 100 vans
        const checkPromises = [];
        
        for (let i = 1; i <= checkCount; i++) {
            const vanId = CONFIG.models.vans.getVanId(i);
            const filename = CONFIG.models.vans.getFilename(i);
            const vanPath = CONFIG.models.vans.basePath + filename;
            
            // Create promise for each check
            checkPromises.push(
                fetch(vanPath, { method: 'HEAD' })
                    .then(response => {
                        if (response.ok) {
                            return {
                                id: vanId,
                                name: `Van ${String(i).padStart(3, '0')}`,
                                filename: filename,
                                thumbnail: `thumbnails/van-${String(i).padStart(3, '0')}.jpg`,
                                number: i,
                                scale: CONFIG.models.vans.defaultScale,
                                position: CONFIG.models.vans.defaultPosition,
                                rotation: { x: 0, y: Math.PI, z: 0 }
                            };
                        }
                        return null;
                    })
                    .catch(() => null) // File doesn't exist
            );
        }
        
        // Wait for all checks to complete in parallel
        const results = await Promise.all(checkPromises);
        
        // Filter out null results and sort by number
        results.forEach(result => {
            if (result) {
                detectedVans.push(result);
                console.log(`Found: ${result.id}`);
            }
        });
        
        // Sort by van number
        detectedVans.sort((a, b) => a.number - b.number);

        this.availableVans = detectedVans;
        this.vansDetected = true;
        console.log(`Detected ${detectedVans.length} van models:`, detectedVans.map(v => v.id));
        
        return this.availableVans;
    }

    /**
     * Load wheel model for attaching to vans
     */
    async loadWheelModel() {
        try {
            const wheelPath = 'models/vans/wheel/wheel.glb';
            const wheelData = await this.modelLoader.loadModel(wheelPath, {
                scale: 1.0,
                position: { x: 0, y: 0, z: 0 },
                rotation: { x: 0, y: 0, z: 0 }
            });
            this.wheelModel = wheelData.model;
            console.log('Wheel model loaded successfully');
        } catch (error) {
            console.warn('Wheel model not found or failed to load:', error);
            this.wheelModel = null;
        }
    }

    /**
     * Attach wheels to van if null objects FL, FR, RL, RR exist
     */
    attachWheelsToVan(vanModel) {
        if (!this.wheelModel) {
            console.log('No wheel model available, skipping wheel attachment');
            return;
        }

        const wheelPositions = ['FL', 'FR', 'RL', 'RR'];
        const foundNulls = [];
        
        // Search for null objects in the van model
        vanModel.traverse((child) => {
            if (wheelPositions.includes(child.name)) {
                foundNulls.push(child);
            }
        });

        if (foundNulls.length === 0) {
            console.log('No wheel null objects found in van model, displaying without wheels');
            return;
        }

        console.log(`Found ${foundNulls.length} wheel mount points:`, foundNulls.map(n => n.name));

        // Attach wheel clones to each null object position
        foundNulls.forEach((nullObject) => {
            const wheelClone = this.wheelModel.clone();
            
            // Copy position and rotation from null object
            wheelClone.position.copy(nullObject.position);
            wheelClone.rotation.copy(nullObject.rotation);
            wheelClone.scale.copy(nullObject.scale);
            
            // Add wheel to the van model
            vanModel.add(wheelClone);
            
            console.log(`Attached wheel to ${nullObject.name}`);
        });
    }

    /**
     * Get list of available vans (combines config list and detected vans)
     */
    async getAvailableVansAsync() {
        if (!this.vansDetected) {
            await this.detectAvailableVans();
        }
        
        // Merge config list with detected vans (detected takes precedence)
        const configVans = CONFIG.models.vans.list;
        const allVans = new Map();
        
        // Add config vans first
        configVans.forEach(van => allVans.set(van.id, van));
        
        // Add/override with detected vans
        this.availableVans.forEach(van => allVans.set(van.id, van));
        
        return Array.from(allVans.values());
    }

    /**
     * Load the garage model
     */
    async loadGarage() {
        try {
            const garagePath = CONFIG.models.garage.path + CONFIG.models.garage.filename;
            const garageData = await this.modelLoader.loadModel(garagePath, {
                scale: CONFIG.models.garage.scale,
                position: CONFIG.models.garage.position,
                rotation: CONFIG.models.garage.rotation
            });

            this.garageModel = garageData.model;
            this.scene.addObject(this.garageModel);

            // Log garage info
            const info = this.modelLoader.getModelInfo(this.garageModel);
            console.log('Garage loaded:', info);

            return this.garageModel;
        } catch (error) {
            console.error('Failed to load garage:', error);
            // Create a placeholder if garage model fails to load
            this.createPlaceholderGarage();
            throw error;
        }
    }

    /**
     * Load a van model by number (e.g., 1 for van-001.glb)
     * @param {number} vanNumber - Number of the van to load (1, 2, 3, etc.)
     */
    async loadVanByNumber(vanNumber) {
        const vanId = CONFIG.models.vans.getVanId(vanNumber);
        const filename = CONFIG.models.vans.getFilename(vanNumber);
        
        // Check if van is already loaded
        if (this.vans.has(vanId)) {
            return this.switchToVan(vanId);
        }

        try {
            const vanPath = CONFIG.models.vans.basePath + filename;
            const vanData = await this.modelLoader.loadModel(vanPath, {
                scale: CONFIG.models.vans.defaultScale,
                position: CONFIG.models.vans.defaultPosition,
                rotation: { x: 0, y: Math.PI, z: 0 }
            });

            // Attach wheels if null objects exist
            this.attachWheelsToVan(vanData.model);

            // Store van data
            this.vans.set(vanId, {
                model: vanData.model,
                config: {
                    id: vanId,
                    name: `Van ${String(vanNumber).padStart(3, '0')}`,
                    filename: filename,
                    thumbnail: `thumbnails/van-${String(vanNumber).padStart(3, '0')}.jpg`
                },
                animations: vanData.animations,
                info: this.modelLoader.getModelInfo(vanData.model)
            });

            // Log van info
            console.log(`Van ${vanId} loaded:`, this.vans.get(vanId).info);

            // Switch to this van
            this.switchToVan(vanId);

            return this.vans.get(vanId);
        } catch (error) {
            console.error(`Failed to load van ${vanId}:`, error);
            throw error;
        }
    }

    /**
     * Load a truck model
     * @param {string} truckId - ID of the truck to load (e.g., 'van-001')
     */
    async loadVan(truckId) {
        // Hide current truck immediately when starting to load new one
        if (this.currentVan) {
            this.currentVan.visible = false;
        }
        
        // Check if truck is already loaded
        if (this.vans.has(truckId)) {
            return this.switchToVan(truckId);
        }

        // Find truck config (check both config list and detected vans)
        let truckConfig = CONFIG.models.vans.list.find(t => t.id === truckId);
        
        // If not in config, check detected vans
        if (!truckConfig) {
            truckConfig = this.availableVans.find(t => t.id === truckId);
        }
        
        if (!truckConfig) {
            throw new Error(`Van with ID ${truckId} not found in config or detected vans`);
        }

        try {
            const truckPath = CONFIG.models.vans.basePath + truckConfig.filename;
            const truckData = await this.modelLoader.loadModel(truckPath, {
                scale: truckConfig.scale || CONFIG.models.vans.defaultScale,
                position: truckConfig.position || CONFIG.models.vans.defaultPosition,
                rotation: truckConfig.rotation || { x: 0, y: Math.PI, z: 0 }
            });

            // Attach wheels if null objects exist
            this.attachWheelsToVan(truckData.model);

            // Store truck data
            this.vans.set(truckId, {
                model: truckData.model,
                config: truckConfig,
                animations: truckData.animations,
                info: this.modelLoader.getModelInfo(truckData.model)
            });

            // Log truck info
            console.log(`Van ${truckId} loaded:`, this.vans.get(truckId).info);

            // Switch to this truck
            this.switchToVan(truckId);

            return this.vans.get(truckId);
        } catch (error) {
            console.error(`Failed to load truck ${truckId}:`, error);
            // Re-show the current truck if loading failed
            if (this.currentVan) {
                this.currentVan.visible = true;
            }
            throw error;
        }
    }

    /**
     * Switch to a previously loaded truck
     * @param {string} truckId - ID of the truck to switch to
     */
    switchToVan(truckId) {
        if (!this.vans.has(truckId)) {
            throw new Error(`Van ${truckId} not loaded yet`);
        }

        // Hide current truck from scene (instead of removing, just make invisible)
        if (this.currentVan) {
            this.currentVan.visible = false;
        }

        // Add new truck to scene
        const truckData = this.vans.get(truckId);
        this.currentVan = truckData.model;
        this.currentVanId = truckId;
        
        // If not already in scene, add it
        if (!this.currentVan.parent) {
            this.scene.addObject(this.currentVan);
        }
        
        // Make it visible
        this.currentVan.visible = true;

        return truckData;
    }

    /**
     * Get list of available vans (synchronous - returns config list)
     * For dynamic detection, use getAvailableVansAsync()
     */
    getAvailableVans() {
        // Return detected vans if available, otherwise config list
        if (this.vansDetected && this.availableVans.length > 0) {
            return this.availableVans;
        }
        return CONFIG.models.vans.list;
    }

    /**
     * Get current truck info
     */
    getCurrentVanInfo() {
        if (!this.currentVanId) return null;
        return this.vans.get(this.currentVanId);
    }

    /**
     * Preload all vans for instant switching
     */
    async preloadAllVans() {
        const promises = CONFIG.models.vans.list.map(truck => 
            this.loadVan(truck.id).catch(err => {
                console.warn(`Failed to preload truck ${truck.id}:`, err);
                return null;
            })
        );
        
        return await Promise.allSettled(promises);
    }

    /**
     * Create a placeholder garage (simple box) if model fails
     */
    createPlaceholderGarage() {
        const geometry = new THREE.BoxGeometry(20, 8, 15);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x888888,
            roughness: 0.7,
            metalness: 0.3
        });
        const placeholder = new THREE.Mesh(geometry, material);
        placeholder.position.set(0, 4, 0);
        placeholder.castShadow = true;
        placeholder.receiveShadow = true;
        
        this.garageModel = placeholder;
        this.scene.addObject(this.garageModel);
        
        console.warn('Using placeholder garage');
    }

    /**
     * Clean up resources
     */
    dispose() {
        this.vans.clear();
        this.modelLoader.dispose();
    }
}
