// Window management for spawning and controlling meme windows

import { CONFIG } from './config.js';
import { randomElement, loadTextFile, loadJSON } from './utils.js';

export class WindowManager {
    constructor() {
        this.windowTitles = [];
        this.gifFiles = [];
        this.activeWindows = 0;
        this.lastSpawnTime = 0;
        this.container = null;
    }

    /**
     * Initialize window manager
     */
    async initialize() {
        this.container = document.getElementById('windows-container');
        await this.loadResources();
    }

    /**
     * Load window titles and GIF files
     */
    async loadResources() {
        // Load window titles
        this.windowTitles = await loadTextFile('window-titles.txt', [
            'six-seven.exe',
            'untitled.txt',
            'warning.exe'
        ]);

        // Load GIF manifest
        const manifest = await loadJSON('gifs/manifest.json');
        if (manifest && manifest.files) {
            this.gifFiles = manifest.files;
        } else {
            // Fallback: try numbered files
            for (let i = 1; i <= 20; i++) {
                this.gifFiles.push(`gifs/${i}.gif`);
            }
        }

        if (this.gifFiles.length === 0) {
            this.gifFiles = ['gifs/1.gif'];
        }
    }

    /**
     * Attempt to spawn a window (respects cooldown and max limit)
     */
    trySpawnWindow() {
        const now = Date.now();

        // Check cooldown
        if (now - this.lastSpawnTime < CONFIG.SPAWN_COOLDOWN) {
            return false;
        }

        // Check window limit
        if (this.activeWindows >= CONFIG.MAX_WINDOWS) {
            return false;
        }

        this.spawnWindow();
        this.lastSpawnTime = now;
        return true;
    }

    /**
     * Spawn a new window
     */
    spawnWindow() {
        const windowElement = document.createElement('div');
        windowElement.className = 'win98-window';

        // Random position (avoid edges)
        const maxX = window.innerWidth - 320;
        const maxY = window.innerHeight - 300;
        const x = Math.max(0, Math.random() * maxX);
        const y = Math.max(0, Math.random() * maxY);
        windowElement.style.left = `${x}px`;
        windowElement.style.top = `${y}px`;

        // Random title and GIF
        const title = randomElement(this.windowTitles);
        const gifPath = randomElement(this.gifFiles);

        // Create window content
        windowElement.innerHTML = `
            <div class="win98-title-bar">
                <div class="win98-title">${title}</div>
                <div class="win98-close-btn">×</div>
            </div>
            <div class="win98-content">
                <img src="${gifPath}" alt="meme" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22150%22><text x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22>GIF Not Found</text></svg>'">
            </div>
        `;

        // Set z-index
        windowElement.style.zIndex = 100 + this.activeWindows;

        // Add to container
        this.container.appendChild(windowElement);
        this.activeWindows++;

        // Setup close button
        const closeBtn = windowElement.querySelector('.win98-close-btn');
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeWindow(windowElement);
        });

        // Setup dragging
        this.makeDraggable(windowElement);

        // Click to bring to front
        windowElement.addEventListener('mousedown', () => {
            this.bringToFront(windowElement);
        });
    }

    /**
     * Close a window
     */
    closeWindow(windowElement) {
        windowElement.remove();
        this.activeWindows--;
    }

    /**
     * Make window draggable
     */
    makeDraggable(element) {
        const titleBar = element.querySelector('.win98-title-bar');
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        const dragStart = (e) => {
            if (e.target.classList.contains('win98-close-btn')) {
                return;
            }

            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;

            if (e.target === titleBar || titleBar.contains(e.target)) {
                isDragging = true;
            }
        };

        const drag = (e) => {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;

                xOffset = currentX;
                yOffset = currentY;

                setTranslate(currentX, currentY, element);
            }
        };

        const dragEnd = (e) => {
            initialX = currentX;
            initialY = currentY;
            isDragging = false;
        };

        const setTranslate = (xPos, yPos, el) => {
            const currentLeft = parseFloat(el.style.left) || 0;
            const currentTop = parseFloat(el.style.top) || 0;
            el.style.left = `${currentLeft + xPos - (parseFloat(el.dataset.lastX) || 0)}px`;
            el.style.top = `${currentTop + yPos - (parseFloat(el.dataset.lastY) || 0)}px`;
            el.dataset.lastX = xPos;
            el.dataset.lastY = yPos;
        };

        titleBar.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);
    }

    /**
     * Bring window to front
     */
    bringToFront(element) {
        const allWindows = document.querySelectorAll('.win98-window');
        let maxZ = 100;
        allWindows.forEach(win => {
            const z = parseInt(win.style.zIndex) || 100;
            if (z > maxZ) maxZ = z;
        });
        element.style.zIndex = maxZ + 1;
    }

    /**
     * Get current window count
     */
    getWindowCount() {
        return this.activeWindows;
    }

    /**
     * Get last spawn time
     */
    getLastSpawnTime() {
        return this.lastSpawnTime;
    }
}
