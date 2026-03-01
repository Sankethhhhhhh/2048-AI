import { KEY_MAP, DIRECTION } from './Constants.js';

/**
 * Handles keyboard and touch input, emitting events to listeners
 */
export default class InputManager {
    constructor() {
        this.events = {};
        this.touchStartX = null;
        this.touchStartY = null;
        this.swiping = false;

        this.listen();
    }

    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }

    emit(event, data) {
        const callbacks = this.events[event];
        if (callbacks) {
            callbacks.forEach(callback => callback(data));
        }
    }

    listen() {
        // Keyboard events
        document.addEventListener("keydown", (event) => {
            const modifiers = event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
            const mapped = KEY_MAP[event.key];

            if (!modifiers) {
                if (mapped !== undefined) {
                    event.preventDefault();
                    this.emit("move", mapped);
                } else if (event.key === "Enter" || event.key === " ") {
                    // Prevent default space scrolling, might want to use later
                    event.preventDefault();
                }
            }
        });

        // Touch events for swiping
        const gameContainer = document.querySelector(".board-wrapper");
        if (gameContainer) {
            gameContainer.addEventListener("touchstart", this.handleTouchStart.bind(this), { passive: false });
            gameContainer.addEventListener("touchmove", this.handleTouchMove.bind(this), { passive: false });
            gameContainer.addEventListener("touchend", this.handleTouchEnd.bind(this));
        }
    }

    handleTouchStart(event) {
        if (event.touches.length > 1) return; // Ignore multi-touch
        this.touchStartX = event.touches[0].clientX;
        this.touchStartY = event.touches[0].clientY;
        this.swiping = true;
    }

    handleTouchMove(event) {
        if (!this.swiping) return;
        // Prevent default scrolling when swiping on the board
        event.preventDefault();
    }

    handleTouchEnd(event) {
        if (!this.swiping || this.touchStartX === null || this.touchStartY === null) return;

        const touchEndX = event.changedTouches[0].clientX;
        const touchEndY = event.changedTouches[0].clientY;

        const dx = touchEndX - this.touchStartX;
        const dy = touchEndY - this.touchStartY;

        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        if (Math.max(absDx, absDy) > 30) {
            // Threshold for swipe
            // (Right/Left) or (Down/Up)
            if (absDx > absDy) {
                if (dx > 0) {
                    this.emit("move", DIRECTION.RIGHT);
                } else {
                    this.emit("move", DIRECTION.LEFT);
                }
            } else {
                if (dy > 0) {
                    this.emit("move", DIRECTION.DOWN);
                } else {
                    this.emit("move", DIRECTION.UP);
                }
            }
        }

        this.swiping = false;
        this.touchStartX = null;
        this.touchStartY = null;
    }
}
