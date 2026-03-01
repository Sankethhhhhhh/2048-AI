/**
 * Manages saving and loading state from localStorage
 */

export default class StorageManager {
    constructor() {
        this.bestScoreKey = "bestScore_";
        this.gameStateKey = "gameState_";
        this.supported = this.localStorageSupported();
    }

    localStorageSupported() {
        try {
            const testKey = "test";
            window.localStorage.setItem(testKey, "1");
            window.localStorage.removeItem(testKey);
            return true;
        } catch (error) {
            return false;
        }
    }

    getBestScore(size) {
        if (!this.supported) return 0;
        return parseInt(window.localStorage.getItem(this.bestScoreKey + size) || "0", 10);
    }

    setBestScore(size, score) {
        if (!this.supported) return;
        window.localStorage.setItem(this.bestScoreKey + size, score);
    }

    getGameState(size) {
        if (!this.supported) return null;
        const stateJSON = window.localStorage.getItem(this.gameStateKey + size);
        return stateJSON ? JSON.parse(stateJSON) : null;
    }

    setGameState(size, state) {
        if (!this.supported) return;
        window.localStorage.setItem(this.gameStateKey + size, JSON.stringify(state));
    }

    clearGameState(size) {
        if (!this.supported) return;
        window.localStorage.removeItem(this.gameStateKey + size);
    }
}
