import { SceneManager } from './core/Scene.js';
import { CameraManager } from './core/Camera.js';
import { RendererManager } from './core/Renderer.js';
import { LightingManager } from './core/Lighting.js';
import { VanManager } from './managers/VanManager.js';
import { UIController } from './ui/UIController.js';
import { CONFIG } from './config.js';

/**
 * Main Application Class
 */
class GarageApp {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.isRunning = false;
        this.animationId = null;
        
        this.init();
    }

    async init() {
        try {
            // Initialize core components
            this.rendererManager = new RendererManager(this.container);
            this.sceneManager = new SceneManager();
            this.cameraManager = new CameraManager(this.rendererManager.getRenderer());
            this.lightingManager = new LightingManager(this.sceneManager.getScene());
            
            // Setup camera controls
            this.cameraManager.setupControls(this.rendererManager.getDomElement());
            
            // Initialize managers
            this.vanManager = new VanManager(
                this.sceneManager,
                (progress, url) => this.onLoadProgress(progress, url)
            );
            
            // Initialize UI
            this.uiController = new UIController(this.vanManager, this.cameraManager);
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Load initial content
            await this.loadInitialContent();
            
            // Start render loop
            this.start();
            
            console.log('Garage application initialized successfully');
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.uiController.showError('Failed to initialize 3D garage');
        }
    }

    async loadInitialContent() {
        this.uiController.showLoading('Loading garage...');
        
        try {
            // Load garage model
            await this.vanManager.loadGarage();
            
            // Detect available vans
            this.uiController.showLoading('Detecting available vans...');
            await this.vanManager.detectAvailableVans();
            
            // Update UI with detected vans
            this.uiController.populateVanList();
            
            // Load first van if available
            const vans = this.vanManager.getAvailableVans();
            if (vans.length > 0) {
                this.uiController.showLoading(`Loading ${vans[0].name}...`);
                await this.vanManager.loadVan(vans[0].id);
                this.uiController.updateModelInfo(this.vanManager.getCurrentVanInfo());
                
                // Mark first van as active in UI
                const firstVanItem = document.querySelector(`[data-van-id="${vans[0].id}"]`);
                if (firstVanItem) {
                    firstVanItem.classList.add('active');
                }
            }
            
            this.uiController.hideLoading();
        } catch (error) {
            console.error('Error loading initial content:', error);
            this.uiController.hideLoading();
            // Continue anyway with placeholder
        }
    }

    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', () => this.onWindowResize(), false);
        
        // Visibility change (pause when hidden)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
            } else {
                this.start();
            }
        });
    }

    onWindowResize() {
        this.cameraManager.onWindowResize();
        this.rendererManager.onWindowResize();
    }

    onLoadProgress(percent, url) {
        this.uiController.onLoadProgress(percent, url);
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.animate();
        }
    }

    pause() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    animate() {
        if (!this.isRunning) return;
        
        this.animationId = requestAnimationFrame(() => this.animate());
        
        // Update controls
        this.cameraManager.update();
        
        // Update FPS counter
        if (CONFIG.performance.showFPS) {
            this.uiController.updateFPS();
        }
        
        // Render scene
        this.rendererManager.render(
            this.sceneManager.getScene(),
            this.cameraManager.getCamera()
        );
    }

    dispose() {
        this.pause();
        this.rendererManager.dispose();
        this.vanManager.dispose();
    }
}

// Initialize application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.garageApp = new GarageApp();
    });
} else {
    window.garageApp = new GarageApp();
}

export default GarageApp;
