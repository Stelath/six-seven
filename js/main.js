// Main application entry point

import { CONFIG } from './config.js';
import { CameraManager } from './camera.js';
import { HandDetector } from './handDetection.js';
import { WindowManager } from './windowManager.js';
import { DebugManager } from './debugManager.js';

class SixSevenApp {
    constructor() {
        this.cameraManager = null;
        this.handDetector = null;
        this.windowManager = null;
        this.debugManager = null;
    }

    /**
     * Initialize the application
     */
    async initialize() {
        // Create managers
        this.handDetector = new HandDetector();
        this.windowManager = new WindowManager();
        this.debugManager = new DebugManager();

        // Initialize window manager first (loads resources)
        await this.windowManager.initialize();

        // Initialize camera with callback
        this.cameraManager = new CameraManager((results) => {
            this.onHandTrackingResults(results);
        });
        await this.cameraManager.initialize();

        // Initialize debug manager
        this.debugManager.initialize(this.cameraManager.getCanvasContext());

        console.log('Six-Seven app initialized!');
    }

    /**
     * Handle hand tracking results from MediaPipe
     */
    onHandTrackingResults(results) {
        // Update FPS
        this.debugManager.updateFPS();

        // Clear canvas
        const ctx = this.cameraManager.getCanvasContext();
        if (ctx) {
            ctx.save();
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        }

        // Extract left and right hands
        let leftHand = null;
        let rightHand = null;

        if (results.multiHandedness && results.multiHandedness.length > 0) {
            for (let i = 0; i < results.multiHandedness.length; i++) {
                const label = results.multiHandedness[i].label;
                if (label === 'Left') {
                    leftHand = results.multiHandLandmarks[i];
                } else if (label === 'Right') {
                    rightHand = results.multiHandLandmarks[i];
                }
            }
        }

        // Draw hand landmarks if debug mode is on
        if (this.debugManager.isEnabled()) {
            if (leftHand) {
                this.debugManager.drawHandLandmarks(leftHand, CONFIG.DEBUG_COLORS.leftHand);
            }
            if (rightHand) {
                this.debugManager.drawHandLandmarks(rightHand, CONFIG.DEBUG_COLORS.rightHand);
            }
        }

        // Process hands and detect pumping gesture
        const isPumping = this.handDetector.processHands(leftHand, rightHand);

        // Spawn window if pumping detected
        if (isPumping) {
            this.windowManager.trySpawnWindow();
        }

        // Update debug panel
        if (this.debugManager.isEnabled()) {
            const debugData = this.handDetector.getDebugData();
            this.debugManager.updatePanel(debugData, this.windowManager);
        }

        if (ctx) {
            ctx.restore();
        }
    }
}

// Initialize app when DOM is loaded
window.addEventListener('DOMContentLoaded', async () => {
    const app = new SixSevenApp();
    await app.initialize();
});
