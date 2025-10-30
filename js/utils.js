// Utility functions

/**
 * Calculate variance of an array
 */
export function calculateVariance(arr) {
    if (arr.length === 0) return 0;
    const mean = arr.reduce((a, b) => a + b) / arr.length;
    const variance = arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
    return variance;
}

/**
 * Calculate the range (max - min) of an array
 */
export function calculateRange(arr) {
    if (arr.length === 0) return 0;
    return Math.max(...arr) - Math.min(...arr);
}

/**
 * Create a 3D vector from two points
 */
export function createVector(from, to) {
    return {
        x: to.x - from.x,
        y: to.y - from.y,
        z: to.z - from.z
    };
}

/**
 * Calculate dot product of two 3D vectors
 */
export function dotProduct(v1, v2) {
    return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
}

/**
 * Calculate cross product of two 3D vectors
 */
export function crossProduct(v1, v2) {
    return {
        x: v1.y * v2.z - v1.z * v2.y,
        y: v1.z * v2.x - v1.x * v2.z,
        z: v1.x * v2.y - v1.y * v2.x
    };
}

/**
 * Calculate magnitude (length) of a 3D vector
 */
export function magnitude(v) {
    return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

/**
 * Normalize a 3D vector to unit length
 */
export function normalize(v) {
    const mag = magnitude(v);
    if (mag === 0) return { x: 0, y: 0, z: 0 };
    return {
        x: v.x / mag,
        y: v.y / mag,
        z: v.z / mag
    };
}

/**
 * Calculate angle in degrees between two 3D vectors
 */
export function angleBetweenVectors(v1, v2) {
    const dot = dotProduct(normalize(v1), normalize(v2));
    // Clamp to avoid floating point errors
    const clampedDot = Math.max(-1, Math.min(1, dot));
    return Math.acos(clampedDot) * (180 / Math.PI);
}

/**
 * Load text file and return array of lines
 */
export async function loadTextFile(path, defaultLines = []) {
    try {
        const response = await fetch(path);
        const text = await response.text();
        const lines = text.split('\n').filter(line => line.trim());
        return lines.length > 0 ? lines : defaultLines;
    } catch (error) {
        console.warn(`Could not load ${path}, using defaults`);
        return defaultLines;
    }
}

/**
 * Load JSON file
 */
export async function loadJSON(path, defaultValue = null) {
    try {
        const response = await fetch(path);
        return await response.json();
    } catch (error) {
        console.warn(`Could not load ${path}, using default`);
        return defaultValue;
    }
}

/**
 * Get random element from array
 */
export function randomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
