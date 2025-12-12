// Configuration file for the 3D Garage application
export const CONFIG = {
    // Scene settings
    scene: {
        backgroundColor: 0x000000,
        fog: {
            enabled: true,
            color: 0x000000,
            near: 10,
            far: 100
        }
    },

    // Camera settings
    camera: {
        fov: 70,
        near: 0.1,
        far: 1000,
        initialPosition: { x: 0, y: 3, z: -8 },
        lookAt: { x: 0, y: 1.1, z: 0 }
    },

    // Lighting settings
    lighting: {
        ambient: {
            color: 0xffffff,
            intensity: 1
        },
        directional: [
            { 
                color: 0xffffff, 
                intensity: 0.8, 
                position: { x: 10, y: 15, z: 10 },
                castShadow: true
            },
            { 
                color: 0xffffff, 
                intensity: 0.3, 
                position: { x: -10, y: 10, z: -10 },
                castShadow: true
            }
        ],
        hemisphere: {
            skyColor: 0xffffff,
            groundColor: 0x444444,
            intensity: 0.3
        }
    },

    // Renderer settings
    renderer: {
        antialias: true,
        shadowsEnabled: true,
        shadowType: 2, // PCFSoftShadowMap
        toneMapping: 0, // NoToneMapping (can use ACESFilmicToneMapping = 4)
        toneMappingExposure: 1.0,
        pixelRatio: Math.min(window.devicePixelRatio, 2)
    },

    // Model settings
    models: {
        // Garage model
        garage: {
            path: 'models/garage/',
            filename: 'garage.glb', // or 'garage.gltf'
            scale: 1.0,
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 }
        },
        
        // Vans configuration
        vans: {
            basePath: 'models/vans/',
            defaultScale: 1.0,
            defaultPosition: { x: 0, y: 0.42, z: 0 },
            
            // Van naming pattern: van-001.glb, van-002.glb, etc.
            filenamePattern: 'van-',
            fileExtension: '.glb',
            
            // List of available vans (will be dynamically loaded in future versions)
            list: [
                {
                    id: 'van-001',
                    name: 'Van 001',
                    filename: 'van-001.glb',
                    thumbnail: 'thumbnails/van-001.jpg',
                    scale: 1.0,
                    position: { x: 0, y: 0.42, z: 0 },
                    rotation: { x: 0, y: Math.PI, z: 0 }
                }
                // More vans will be added here or loaded dynamically
            ],
            
            // Helper function to generate van filename from number
            getFilename: (vanNumber) => {
                const paddedNumber = String(vanNumber).padStart(3, '0');
                return `van-${paddedNumber}.glb`;
            },
            
            // Helper function to get van ID from number
            getVanId: (vanNumber) => {
                const paddedNumber = String(vanNumber).padStart(3, '0');
                return `van-${paddedNumber}`;
            }
        },

        // File format recommendations (see RECOMMENDATIONS.md)
        recommended: {
            format: 'GLB', // Binary GLTF
            maxPolygons: {
                garage: 500000,  // 500K polygons max
                van: 200000    // 200K polygons max
            },
            maxFileSize: {
                garage: 50,  // MB
                van: 20    // MB
            },
            textureSize: {
                max: 2048,  // 2K textures
                recommended: 1024
            }
        }
    },

    // Controls settings
    controls: {
        enableDamping: true,
        dampingFactor: 0.05,
        rotateSpeed: 0.5,
        zoomSpeed: 1.0,
        panSpeed: 0.5,
        enablePan: false,  // Disable panning
        minDistance: 3,
        maxDistance: 5,
        minPolarAngle: Math.PI / 2,  // Lock to horizontal (90 degrees)
        maxPolarAngle: Math.PI / 2,  // Lock to horizontal (90 degrees)
        autoRotate: true,  // Enable auto-rotation
        autoRotateSpeed: -0.5  // Negative for counter-clockwise rotation
    },

    // Performance settings
    performance: {
        showFPS: true,
        targetFPS: 60,
        enableStats: true
    },

    // UI settings
    ui: {
        showLoadingScreen: true,
        showControls: true,
        showModelInfo: true
    }
};
