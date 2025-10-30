// Debug mode visualization and info panel

import { CONFIG, HAND_CONNECTIONS } from './config.js';

export class DebugManager {
    constructor() {
        this.enabled = false;
        this.canvasCtx = null;
        this.frameCount = 0;
        this.lastFpsUpdate = Date.now();
        this.currentFps = 0;
        this.palmUpSectionCreated = false;
    }

    /**
     * Initialize debug manager
     */
    initialize(canvasCtx) {
        this.canvasCtx = canvasCtx;

        const debugToggle = document.getElementById('debug-toggle');

        // Load saved preference
        const savedDebugMode = localStorage.getItem('debugMode') === 'true';
        if (savedDebugMode) {
            this.toggle();
        }

        // Toggle button click
        debugToggle.addEventListener('click', () => {
            this.toggle();
        });

        // Keyboard shortcut (D key)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'd' || e.key === 'D') {
                if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                    this.toggle();
                }
            }
        });
    }

    /**
     * Toggle debug mode on/off
     */
    toggle() {
        this.enabled = !this.enabled;
        const debugToggle = document.getElementById('debug-toggle');
        const debugPanel = document.getElementById('debug-panel');

        if (this.enabled) {
            debugToggle.classList.add('active');
            debugPanel.style.display = 'block';
            localStorage.setItem('debugMode', 'true');
        } else {
            debugToggle.classList.remove('active');
            debugPanel.style.display = 'none';
            localStorage.setItem('debugMode', 'false');
            if (this.canvasCtx) {
                this.clearCanvas();
            }
        }
    }

    /**
     * Update FPS counter
     */
    updateFPS() {
        this.frameCount++;
        const now = Date.now();
        const elapsed = now - this.lastFpsUpdate;

        if (elapsed >= 1000) {
            this.currentFps = Math.round((this.frameCount * 1000) / elapsed);
            this.frameCount = 0;
            this.lastFpsUpdate = now;
        }
    }

    /**
     * Clear canvas
     */
    clearCanvas() {
        if (this.canvasCtx) {
            this.canvasCtx.clearRect(0, 0, this.canvasCtx.canvas.width, this.canvasCtx.canvas.height);
        }
    }

    /**
     * Draw hand landmarks on canvas
     */
    drawHandLandmarks(landmarks, color) {
        if (!this.enabled || !this.canvasCtx) return;

        const width = this.canvasCtx.canvas.width;
        const height = this.canvasCtx.canvas.height;

        // Draw connections (hand skeleton)
        this.canvasCtx.strokeStyle = color;
        this.canvasCtx.lineWidth = 2;
        this.canvasCtx.beginPath();

        for (const [start, end] of HAND_CONNECTIONS) {
            const startLandmark = landmarks[start];
            const endLandmark = landmarks[end];

            this.canvasCtx.moveTo(startLandmark.x * width, startLandmark.y * height);
            this.canvasCtx.lineTo(endLandmark.x * width, endLandmark.y * height);
        }

        this.canvasCtx.stroke();

        // Draw landmark points
        this.canvasCtx.fillStyle = color;
        for (const landmark of landmarks) {
            this.canvasCtx.beginPath();
            this.canvasCtx.arc(
                landmark.x * width,
                landmark.y * height,
                5,
                0,
                2 * Math.PI
            );
            this.canvasCtx.fill();
        }
    }

    /**
     * Update debug panel with current data
     */
    updatePanel(debugData, windowManager) {
        if (!this.enabled) return;

        const {
            leftHand,
            rightHand,
            leftVariance,
            rightVariance,
            leftPalmUp,
            rightPalmUp,
            pumping,
            leftHandLost,
            rightHandLost
        } = debugData;

        // Hands detected (show grace period indicator)
        const handsEl = document.getElementById('debug-hands');
        if (handsEl) {
            const leftIndicator = leftHand ? (leftHandLost ? '⏱' : '✓') : '✗';
            const rightIndicator = rightHand ? (rightHandLost ? '⏱' : '✓') : '✗';
            handsEl.textContent = `Left: ${leftIndicator} | Right: ${rightIndicator}`;
            this.setActive(handsEl, leftHand && rightHand);
        }

        // Hand positions
        const positionsEl = document.getElementById('debug-positions');
        if (positionsEl) {
            const leftY = leftHand ? leftHand[0].y.toFixed(3) : '--';
            const rightY = rightHand ? rightHand[0].y.toFixed(3) : '--';
            positionsEl.textContent = `Left: ${leftY} | Right: ${rightY}`;
        }

        // Variance
        const varianceEl = document.getElementById('debug-variance');
        if (varianceEl) {
            const leftVar = leftVariance.toFixed(4);
            const rightVar = rightVariance.toFixed(4);
            varianceEl.textContent = `Left: ${leftVar} | Right: ${rightVar}`;
            this.setActive(
                varianceEl,
                leftVariance > CONFIG.MOVEMENT_THRESHOLD && rightVariance > CONFIG.MOVEMENT_THRESHOLD
            );
        }

        // Palm Up orientation (create section if needed, only once)
        this.ensurePalmUpSection();

        // Update palm up status
        const palmUpEl = document.getElementById('debug-palmup');
        if (palmUpEl) {
            palmUpEl.textContent = `Palm Up: ${leftPalmUp ? '✓' : '✗'} | ${rightPalmUp ? '✓' : '✗'}`;
            this.setActive(palmUpEl, leftPalmUp && rightPalmUp);
        }

        // Pumping status
        const pumpingEl = document.getElementById('debug-pumping');
        if (pumpingEl) {
            pumpingEl.textContent = `Pumping: ${pumping ? '✓' : '✗'}`;
            this.setActive(pumpingEl, pumping);
        }

        // Remove synced status (not used anymore)
        const syncedEl = document.getElementById('debug-synced');
        if (syncedEl && syncedEl.parentElement && syncedEl.parentElement.parentElement) {
            syncedEl.remove();
        }

        // Windows count
        const windowsEl = document.getElementById('debug-windows');
        if (windowsEl) {
            const windowCount = windowManager.getWindowCount();
            windowsEl.textContent = `${windowCount} / ${CONFIG.MAX_WINDOWS}`;
            this.setActive(windowsEl, windowCount >= CONFIG.MAX_WINDOWS);
        }

        // FPS
        const fpsEl = document.getElementById('debug-fps');
        if (fpsEl) {
            fpsEl.textContent = `${this.currentFps} FPS`;
        }

        // Last spawn time
        const spawnEl = document.getElementById('debug-spawn');
        if (spawnEl) {
            const lastSpawnTime = windowManager.getLastSpawnTime();
            if (lastSpawnTime > 0) {
                const timeSince = Math.floor((Date.now() - lastSpawnTime) / 1000);
                spawnEl.textContent = `${timeSince}s ago`;
            } else {
                spawnEl.textContent = 'Never';
            }
        }
    }

    /**
     * Ensure palm up section exists (create only once)
     */
    ensurePalmUpSection() {
        if (this.palmUpSectionCreated || document.getElementById('debug-palmup')) {
            return; // Already exists
        }

        const debugPanel = document.getElementById('debug-panel');
        const varianceSection = debugPanel.querySelector('.debug-section:nth-child(4)');

        if (varianceSection) {
            const section = document.createElement('div');
            section.className = 'debug-section';
            section.innerHTML = `
                <strong>Orientation:</strong>
                <div id="debug-palmup">Palm Up: -- | --</div>
            `;
            varianceSection.after(section);
            this.palmUpSectionCreated = true;
        }
    }

    /**
     * Helper to add/remove active class
     */
    setActive(element, isActive) {
        if (!element) return;
        if (isActive) {
            element.classList.add('debug-active');
        } else {
            element.classList.remove('debug-active');
        }
    }

    /**
     * Check if debug mode is enabled
     */
    isEnabled() {
        return this.enabled;
    }
}
