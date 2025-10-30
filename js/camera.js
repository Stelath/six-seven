// Camera and MediaPipe Hands initialization

import { CONFIG } from './config.js';

export class CameraManager {
    constructor(onResultsCallback) {
        this.onResultsCallback = onResultsCallback;
        this.videoElement = null;
        this.canvasElement = null;
        this.canvasCtx = null;
        this.hands = null;
        this.camera = null;
    }

    /**
     * Initialize camera and MediaPipe Hands
     */
    async initialize() {
        this.videoElement = document.getElementById('camera');
        this.canvasElement = document.getElementById('output_canvas');
        this.canvasCtx = this.canvasElement.getContext('2d');

        // Initialize MediaPipe Hands
        this.hands = new Hands({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            }
        });

        this.hands.setOptions(CONFIG.MEDIAPIPE);

        this.hands.onResults((results) => {
            this.onResultsCallback(results);
        });

        // Setup camera
        this.camera = new Camera(this.videoElement, {
            onFrame: async () => {
                await this.hands.send({ image: this.videoElement });
            },
            width: CONFIG.CAMERA.width,
            height: CONFIG.CAMERA.height
        });

        // Resize canvas to match video
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Start camera
        await this.camera.start();
    }

    /**
     * Resize canvas to match window
     */
    resizeCanvas() {
        this.canvasElement.width = window.innerWidth;
        this.canvasElement.height = window.innerHeight;
    }

    /**
     * Get canvas context for drawing
     */
    getCanvasContext() {
        return this.canvasCtx;
    }
}
