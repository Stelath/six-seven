// Configuration and constants

export const CONFIG = {
    // Window management
    MAX_WINDOWS: 50,
    SPAWN_COOLDOWN: 300, // milliseconds between spawns

    // Hand tracking
    HISTORY_LENGTH: 10, // frames to track for movement detection
    HAND_GRACE_PERIOD: 500, // milliseconds to keep tracking after hand is lost

    // Gesture detection thresholds
    MOVEMENT_THRESHOLD: 0.002, // Vertical movement variance threshold (lowered for easier detection)
    PALM_UP_THRESHOLD: 0.2, // Y-component of palm normal (lower = more upward)
    MIN_MOVEMENT_RANGE: 0.02, // Minimum Y-axis movement range (lowered)

    // MediaPipe settings
    MEDIAPIPE: {
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    },

    // Camera settings
    CAMERA: {
        width: 1280,
        height: 720
    },

    // Debug colors
    DEBUG_COLORS: {
        leftHand: '#00ff00',  // Green
        rightHand: '#ff0000'  // Red
    }
};

// MediaPipe hand landmark indices
export const LANDMARKS = {
    WRIST: 0,
    THUMB_CMC: 1,
    THUMB_MCP: 2,
    THUMB_IP: 3,
    THUMB_TIP: 4,
    INDEX_FINGER_MCP: 5,
    INDEX_FINGER_PIP: 6,
    INDEX_FINGER_DIP: 7,
    INDEX_FINGER_TIP: 8,
    MIDDLE_FINGER_MCP: 9,
    MIDDLE_FINGER_PIP: 10,
    MIDDLE_FINGER_DIP: 11,
    MIDDLE_FINGER_TIP: 12,
    RING_FINGER_MCP: 13,
    RING_FINGER_PIP: 14,
    RING_FINGER_DIP: 15,
    RING_FINGER_TIP: 16,
    PINKY_MCP: 17,
    PINKY_PIP: 18,
    PINKY_DIP: 19,
    PINKY_TIP: 20
};

// Hand skeleton connections for visualization
export const HAND_CONNECTIONS = [
    [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
    [0, 5], [5, 6], [6, 7], [7, 8], // Index
    [0, 9], [9, 10], [10, 11], [11, 12], // Middle
    [0, 13], [13, 14], [14, 15], [15, 16], // Ring
    [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
    [5, 9], [9, 13], [13, 17] // Palm
];
