import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

/**
 * ModelLoader - Handles loading of 3D models (GLTF/GLB format)
 * Supports Draco compression for optimized file sizes
 */
export class ModelLoader {
    constructor(onProgress = null) {
        this.gltfLoader = new GLTFLoader();
        this.dracoLoader = new DRACOLoader();
        this.onProgress = onProgress;
        
        // Setup Draco decoder for compressed models
        this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
        this.gltfLoader.setDRACOLoader(this.dracoLoader);

        this.loadingManager = new THREE.LoadingManager();
        this.setupLoadingManager();
    }

    setupLoadingManager() {
        this.loadingManager.onStart = (url, itemsLoaded, itemsTotal) => {
            console.log(`Started loading: ${url}`);
        };

        this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
            const progress = (itemsLoaded / itemsTotal) * 100;
            console.log(`Loading progress: ${progress.toFixed(2)}%`);
            
            if (this.onProgress) {
                this.onProgress(progress, url);
            }
        };

        this.loadingManager.onLoad = () => {
            console.log('All models loaded!');
        };

        this.loadingManager.onError = (url) => {
            console.error(`Error loading: ${url}`);
        };
    }

    /**
     * Load a GLTF/GLB model
     * @param {string} path - Path to the model file
     * @param {Object} options - Loading options (scale, position, rotation)
     * @returns {Promise} - Returns loaded model
     */
    async loadModel(path, options = {}) {
        let fileSize = 0;
        
        return new Promise((resolve, reject) => {
            this.gltfLoader.load(
                path,
                (gltf) => {
                    const model = gltf.scene;
                    
                    // Apply transformations
                    if (options.scale) {
                        const scale = options.scale;
                        model.scale.set(scale, scale, scale);
                    }
                    
                    if (options.position) {
                        model.position.set(
                            options.position.x || 0,
                            options.position.y || 0,
                            options.position.z || 0
                        );
                    }
                    
                    if (options.rotation) {
                        model.rotation.set(
                            options.rotation.x || 0,
                            options.rotation.y || 0,
                            options.rotation.z || 0
                        );
                    }

                    // Enable shadows for all meshes
                    model.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                            
                            // Ensure proper material rendering
                            if (child.material) {
                                child.material.needsUpdate = true;
                            }
                        }
                    });

                    resolve({
                        model: model,
                        animations: gltf.animations,
                        userData: gltf.userData,
                        fileSize: fileSize
                    });
                },
                (xhr) => {
                    // Progress callback
                    if (xhr.lengthComputable) {
                        fileSize = xhr.total; // Capture file size
                        const percentComplete = (xhr.loaded / xhr.total) * 100;
                        if (this.onProgress) {
                            this.onProgress(percentComplete, path);
                        }
                    }
                },
                (error) => {
                    console.error('Error loading model:', error);
                    reject(error);
                }
            );
        });
    }

    /**
     * Load multiple models from a directory
     * @param {Array} modelConfigs - Array of model configurations
     * @returns {Promise<Array>} - Returns array of loaded models
     */
    async loadModels(modelConfigs) {
        const promises = modelConfigs.map(config => 
            this.loadModel(config.path, config.options)
        );
        
        try {
            return await Promise.all(promises);
        } catch (error) {
            console.error('Error loading models:', error);
            throw error;
        }
    }

    /**
     * Get model metadata (polygon count, bounds, etc.)
     * @param {THREE.Object3D} model - The model to analyze
     * @returns {Object} - Model metadata
     */
    getModelInfo(model) {
        let polygonCount = 0;
        let vertexCount = 0;
        const boundingBox = new THREE.Box3();

        model.traverse((child) => {
            if (child.isMesh) {
                const geometry = child.geometry;
                if (geometry) {
                    if (geometry.index) {
                        polygonCount += geometry.index.count / 3;
                    } else {
                        polygonCount += geometry.attributes.position.count / 3;
                    }
                    vertexCount += geometry.attributes.position.count;
                }
            }
        });

        boundingBox.setFromObject(model);
        const size = boundingBox.getSize(new THREE.Vector3());

        return {
            polygonCount: Math.floor(polygonCount),
            vertexCount: vertexCount,
            boundingBox: {
                min: boundingBox.min,
                max: boundingBox.max,
                size: {
                    x: size.x.toFixed(2),
                    y: size.y.toFixed(2),
                    z: size.z.toFixed(2)
                }
            }
        };
    }

    /**
     * Dispose of resources
     */
    dispose() {
        this.dracoLoader.dispose();
    }
}
