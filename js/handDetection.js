// Hand detection and gesture recognition

import { CONFIG, LANDMARKS } from './config.js';
import {
    calculateVariance,
    calculateRange,
    createVector,
    crossProduct,
    normalize,
    angleBetweenVectors
} from './utils.js';

export class HandDetector {
    constructor() {
        this.leftHandHistory = [];
        this.rightHandHistory = [];

        // Grace period tracking
        this.lastLeftHandTime = 0;
        this.lastRightHandTime = 0;
        this.lastLeftHand = null;
        this.lastRightHand = null;

        this.debugData = {
            leftHand: null,
            rightHand: null,
            leftVariance: 0,
            rightVariance: 0,
            leftPalmUp: false,
            rightPalmUp: false,
            pumping: false,
            leftHandLost: false,
            rightHandLost: false
        };
    }

    /**
     * Process hand tracking results and detect pumping gesture
     */
    processHands(leftHand, rightHand) {
        const now = Date.now();

        // Apply grace period for lost hands
        const effectiveLeftHand = this.applyGracePeriod(
            leftHand,
            this.lastLeftHand,
            this.lastLeftHandTime,
            now
        );
        const effectiveRightHand = this.applyGracePeriod(
            rightHand,
            this.lastRightHand,
            this.lastRightHandTime,
            now
        );

        // Update last seen times and hands
        if (leftHand) {
            this.lastLeftHandTime = now;
            this.lastLeftHand = leftHand;
        }
        if (rightHand) {
            this.lastRightHandTime = now;
            this.lastRightHand = rightHand;
        }

        // Store for debug
        this.debugData.leftHand = effectiveLeftHand;
        this.debugData.rightHand = effectiveRightHand;
        this.debugData.leftHandLost = !leftHand && effectiveLeftHand !== null;
        this.debugData.rightHandLost = !rightHand && effectiveRightHand !== null;

        // Reset detection flags
        this.debugData.leftPalmUp = false;
        this.debugData.rightPalmUp = false;
        this.debugData.pumping = false;

        // Need both hands (actual or grace period)
        if (!effectiveLeftHand || !effectiveRightHand) {
            return false;
        }

        // Check palm orientations (both must be facing up)
        this.debugData.leftPalmUp = this.isPalmFacingUp(effectiveLeftHand, 'left');
        this.debugData.rightPalmUp = this.isPalmFacingUp(effectiveRightHand, 'right');

        if (!this.debugData.leftPalmUp || !this.debugData.rightPalmUp) {
            return false;
        }

        // Check for pumping motion (both hands moving up and down)
        return this.detectPumpingMotion(effectiveLeftHand, effectiveRightHand);
    }

    /**
     * Apply grace period to maintain hand tracking through brief losses
     */
    applyGracePeriod(currentHand, lastHand, lastSeenTime, currentTime) {
        if (currentHand) {
            return currentHand;
        }

        // Check if we're within grace period
        if (lastHand && (currentTime - lastSeenTime) < CONFIG.HAND_GRACE_PERIOD) {
            return lastHand;
        }

        return null;
    }

    /**
     * Check if palm is facing upward
     * Calculates palm normal vector using wrist, index base, and pinky base
     * Need to handle left vs right hand differently due to coordinate system
     */
    isPalmFacingUp(hand, handedness) {
        const wrist = hand[LANDMARKS.WRIST];
        const indexBase = hand[LANDMARKS.INDEX_FINGER_MCP];
        const pinkyBase = hand[LANDMARKS.PINKY_MCP];

        // Create two vectors on the palm surface
        const v1 = createVector(wrist, indexBase);
        const v2 = createVector(wrist, pinkyBase);

        // Palm normal is the cross product
        // For left hand, reverse the cross product order to get correct normal
        let palmNormal;
        if (handedness === 'left') {
            palmNormal = normalize(crossProduct(v2, v1)); // Reversed for left hand
        } else {
            palmNormal = normalize(crossProduct(v1, v2)); // Normal for right hand
        }

        // In MediaPipe coordinates, Y increases downward
        // So palm facing up means normal Y is positive
        // Check if Y component is positive and significant
        return palmNormal.y > CONFIG.PALM_UP_THRESHOLD;
    }

    /**
     * Detect pumping motion (both hands moving up and down)
     */
    detectPumpingMotion(leftHand, rightHand) {
        // Track wrist Y position
        const leftWristY = leftHand[LANDMARKS.WRIST].y;
        const rightWristY = rightHand[LANDMARKS.WRIST].y;

        // Add to history
        this.leftHandHistory.push(leftWristY);
        this.rightHandHistory.push(rightWristY);

        // Keep only recent history
        if (this.leftHandHistory.length > CONFIG.HISTORY_LENGTH) {
            this.leftHandHistory.shift();
        }
        if (this.rightHandHistory.length > CONFIG.HISTORY_LENGTH) {
            this.rightHandHistory.shift();
        }

        // Need enough history to detect motion
        if (this.leftHandHistory.length < CONFIG.HISTORY_LENGTH) {
            return false;
        }

        // Calculate vertical movement variance for both hands
        const leftVariance = calculateVariance(this.leftHandHistory);
        const rightVariance = calculateVariance(this.rightHandHistory);
        const leftRange = calculateRange(this.leftHandHistory);
        const rightRange = calculateRange(this.rightHandHistory);

        // Store for debug
        this.debugData.leftVariance = leftVariance;
        this.debugData.rightVariance = rightVariance;

        // Check if both hands are moving vertically with sufficient range
        const leftMoving = leftVariance > CONFIG.MOVEMENT_THRESHOLD &&
                          leftRange > CONFIG.MIN_MOVEMENT_RANGE;
        const rightMoving = rightVariance > CONFIG.MOVEMENT_THRESHOLD &&
                           rightRange > CONFIG.MIN_MOVEMENT_RANGE;

        const bothHandsMoving = leftMoving && rightMoving;

        // Store for debug
        this.debugData.pumping = bothHandsMoving;

        // Return true if both hands are moving (no sync required)
        return bothHandsMoving;
    }

    /**
     * Get debug data for visualization
     */
    getDebugData() {
        return this.debugData;
    }

    /**
     * Reset hand history (useful when hands are lost)
     */
    reset() {
        this.leftHandHistory = [];
        this.rightHandHistory = [];
    }
}
