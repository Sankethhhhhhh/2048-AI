/**
 * Game configuration and constants
 */

export const CONFIG = {
    DEFAULT_SIZE: 4,
    WIN_VALUE: 2048,
    SPAWN_COUNT: 2,
    GAP: 10,                 // gap between tiles in px
    ANIMATION_DURATION: 150, // ms, must match CSS var(--transition-speed)
};

export const GAME_STATE = {
    PLAYING: "PLAYING",
    WON: "WON",
    GAME_OVER: "GAME_OVER",
    PAUSED: "PAUSED"
};

export const DIRECTION = {
    UP: 0,
    RIGHT: 1,
    DOWN: 2,
    LEFT: 3
};

// Map Keyboard keys to Directions
export const KEY_MAP = {
    "ArrowUp": DIRECTION.UP,
    "w": DIRECTION.UP,
    "W": DIRECTION.UP,
    "ArrowRight": DIRECTION.RIGHT,
    "d": DIRECTION.RIGHT,
    "D": DIRECTION.RIGHT,
    "ArrowDown": DIRECTION.DOWN,
    "s": DIRECTION.DOWN,
    "S": DIRECTION.DOWN,
    "ArrowLeft": DIRECTION.LEFT,
    "a": DIRECTION.LEFT,
    "A": DIRECTION.LEFT
};
