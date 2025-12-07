/**
 * UIController - Manages all UI interactions and updates
 */
export class UIController {
    constructor(vanManager, cameraManager) {
        this.vanManager = vanManager;
        this.cameraManager = cameraManager;
        
        this.elements = {
            loadingScreen: document.getElementById('loading-screen'),
            loadingText: document.getElementById('loading-text'),
            smallLoader: document.getElementById('small-loader'),
            vanList: document.getElementById('van-list'),
            modelInfo: document.getElementById('model-info'),
            vanName: document.getElementById('van-name'),
            vanDetails: document.getElementById('van-details'),
            fpsCounter: document.getElementById('fps-counter'),
            wipBanner: document.querySelector('.wip-banner')
        };

        this.lastFrameTime = performance.now();
        this.fps = 0;
        
        this.init();
    }

    init() {
        // Don't populate truck list here - it will be called after detection
        this.setupEventListeners();
    }

    /**
     * Populate the van selector with available vans
     */
    populateVanList() {
        const vans = this.vanManager.getAvailableVans();
        this.elements.vanList.innerHTML = '';

        vans.forEach(van => {
            const vanItem = document.createElement('div');
            vanItem.className = 'van-item';
            vanItem.dataset.vanId = van.id;
            
            // Simple text list with arrow indicator for active van
            vanItem.innerHTML = `
                <span class="van-arrow">&gt;</span>
                <div class="van-name">${van.name}</div>
            `;
            
            /* Thumbnail version for future use:
            vanItem.innerHTML = `
                <div class="van-thumbnail">
                    <img src="${van.thumbnail || 'assets/placeholder.jpg'}" 
                         alt="${van.name}"
                         onerror="this.src='assets/placeholder.jpg'">
                </div>
                <div class="van-name">${van.name}</div>
            `;
            */

            vanItem.addEventListener('click', () => this.onVanSelect(van.id));
            this.elements.vanList.appendChild(vanItem);
        });
    }

    /**
     * Handle van selection
     */
    async onVanSelect(vanId) {
        try {
            // Show small loader, hide current van
            this.showSmallLoader();
            
            const vanData = await this.vanManager.loadVan(vanId);
            
            // Update active state in UI
            document.querySelectorAll('.van-item').forEach(item => {
                item.classList.remove('active');
                if (item.dataset.vanId === vanId) {
                    item.classList.add('active');
                }
            });

            // Update model info
            this.updateModelInfo(vanData);
            
            this.hideSmallLoader();
        } catch (error) {
            console.error('Error loading van:', error);
            this.showError('Failed to load van');
            this.hideSmallLoader();
        }
    }

    /**
     * Update model information panel
     */
    updateModelInfo(vanData) {
        if (!vanData) {
            this.elements.vanName.textContent = 'No van loaded';
            this.elements.vanDetails.textContent = '';
            return;
        }

        this.elements.vanName.textContent = vanData.config.name;
        this.elements.vanDetails.innerHTML = `
            <strong>Polygons:</strong> ${vanData.info.polygonCount.toLocaleString()}<br>
            <strong>Vertices:</strong> ${vanData.info.vertexCount.toLocaleString()}<br>
            <strong>Size:</strong> ${vanData.info.boundingBox.size.x} × 
                                    ${vanData.info.boundingBox.size.y} × 
                                    ${vanData.info.boundingBox.size.z} m
        `;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Double-click to reset camera (commented out)
        /*
        window.addEventListener('dblclick', () => {
            this.cameraManager.resetCamera();
        });
        */

        // Arrow navigation
        const prevArrow = document.getElementById('prev-van');
        const nextArrow = document.getElementById('next-van');
        
        if (prevArrow) {
            prevArrow.addEventListener('click', () => this.switchToPreviousVan());
        }
        
        if (nextArrow) {
            nextArrow.addEventListener('click', () => this.switchToNextVan());
        }

        // Keyboard shortcuts
        window.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'r':
                case 'R':
                    this.cameraManager.resetCamera();
                    break;
                case 'ArrowLeft':
                    this.switchToPreviousVan();
                    break;
                case 'ArrowRight':
                    this.switchToNextVan();
                    break;
                case 'g':
                case 'G':
                    // Toggle grid (future feature)
                    break;
            }
        });
    }

    /**
     * Switch to previous van
     */
    switchToPreviousVan() {
        const vans = this.vanManager.getAvailableVans();
        if (vans.length === 0) return;
        
        const currentInfo = this.vanManager.getCurrentVanInfo();
        if (!currentInfo) {
            // No van loaded, load first
            this.onVanSelect(vans[0].id);
            return;
        }
        
        const currentIndex = vans.findIndex(v => v.id === currentInfo.config.id);
        const prevIndex = (currentIndex - 1 + vans.length) % vans.length;
        this.onVanSelect(vans[prevIndex].id);
    }

    /**
     * Switch to next van
     */
    switchToNextVan() {
        const vans = this.vanManager.getAvailableVans();
        if (vans.length === 0) return;
        
        const currentInfo = this.vanManager.getCurrentVanInfo();
        if (!currentInfo) {
            // No van loaded, load first
            this.onVanSelect(vans[0].id);
            return;
        }
        
        const currentIndex = vans.findIndex(v => v.id === currentInfo.config.id);
        const nextIndex = (currentIndex + 1) % vans.length;
        this.onVanSelect(vans[nextIndex].id);
    }

    /**
     * Show loading screen
     */
    showLoading(message = 'Loading garage...0%') {
        this.elements.loadingScreen.style.display = 'flex';
        this.elements.loadingText.textContent = message;
    }

    /**
     * Hide loading screen
     */
    hideLoading() {
        this.elements.loadingScreen.style.display = 'none';
    }

    /**
     * Show small loader (for van switching)
     */
    showSmallLoader() {
        this.elements.smallLoader.style.display = 'block';
        if (this.elements.wipBanner) {
            this.elements.wipBanner.style.display = 'none';
        }
    }

    /**
     * Hide small loader
     */
    hideSmallLoader() {
        this.elements.smallLoader.style.display = 'none';
        if (this.elements.wipBanner) {
            this.elements.wipBanner.style.display = 'block';
        }
    }

    /**
     * Update loading progress
     */
    updateProgress(percent) {
        // Clamp percentage to 0-100 range
        const clampedPercent = Math.min(100, Math.max(0, Math.round(percent)));
        this.elements.loadingText.textContent = `Loading garage...${clampedPercent}%`;
    }

    /**
     * Show error message
     */
    showError(message) {
        alert(message); // Simple for now, can be improved with custom modal
    }

    /**
     * Update FPS counter
     */
    updateFPS() {
        const now = performance.now();
        const delta = now - this.lastFrameTime;
        this.fps = Math.round(1000 / delta);
        this.lastFrameTime = now;
        
        if (this.elements.fpsCounter) {
            this.elements.fpsCounter.textContent = `FPS: ${this.fps}`;
        }
    }

    /**
     * Update loading progress from model loader
     */
    onLoadProgress(percent, url) {
        this.updateProgress(percent);
    }
}
