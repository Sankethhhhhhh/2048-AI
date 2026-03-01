import { DIRECTION } from './Constants.js';

export default class AI {
    constructor(gameInstance) {
        this.game = gameInstance;
        this.enabled = false;
        this.intervalId = null;
        this.playSpeed = 150; // ms per move
    }

    toggle() {
        this.enabled = !this.enabled;
        if (this.enabled) {
            this.start();
        } else {
            this.stop();
        }
        return this.enabled;
    }

    start() {
        if (this.intervalId) clearInterval(this.intervalId);
        this.intervalId = setInterval(() => this.makeMove(), this.playSpeed);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    makeMove() {
        if (!this.enabled || this.game.state !== "PLAYING") {
            this.stop();
            return;
        }

        // Heuristic: Prefer Down, then Right, then Left, then Up (Corner strategy)
        // We will do a simple greedy search: Test all 4 directions, pick the one that yields the highest score.
        // If scores are equal, use corner bias.

        const bestMove = this.getBestMove();
        if (bestMove !== null) {
            this.game.move(bestMove);
        } else {
            this.stop();
            this.enabled = false;
            this.game.ui.updateSettingsUI(this.game.size, false);
        }
    }

    getBestMove() {
        let maxScore = -1;
        let bestDir = null;
        let validMoves = 0;

        // Ordered by preference: Down, Right, Left, Up
        const directions = [DIRECTION.DOWN, DIRECTION.RIGHT, DIRECTION.LEFT, DIRECTION.UP];
        const gridValues = this.game.getGridValues();

        for (const dir of directions) {
            // Simulate move
            const sim = this.simulateMove(gridValues, dir);
            if (sim.moved) {
                validMoves++;
                // Calculate a heuristic score for the resulting board
                const hScore = sim.score + this.evaluateBoard(sim.grid);
                if (hScore > maxScore) {
                    maxScore = hScore;
                    bestDir = dir;
                }
            }
        }

        if (validMoves === 0) return null;
        return bestDir;
    }

    evaluateBoard(grid) {
        // Keep highest tiles in the bottom right corner
        let score = 0;
        const size = this.game.size;

        // Weight matrix favoring the bottom-right
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (grid[r][c] > 0) {
                    // Weight increases towards bottom right
                    const weight = Math.pow(2, r + c);
                    score += grid[r][c] * weight;
                }
            }
        }

        // Bonus for empty cells
        let emptyC = 0;
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (grid[r][c] === 0) emptyC++;
            }
        }
        score += emptyC * 10000;

        return score;
    }

    // Pure function to simulate a move without mutating the actual game state
    simulateMove(grid, direction) {
        const size = grid.length;
        let newGrid = grid.map(row => [...row]);
        let score = 0;
        let moved = false;

        // Rotate
        let rotated = this.rotate(newGrid, direction, size);

        // Slide & Merge
        for (let r = 0; r < size; r++) {
            let row = rotated[r];
            let tiles = row.filter(val => val > 0);

            for (let i = 0; i < tiles.length - 1; i++) {
                if (tiles[i] === tiles[i + 1]) {
                    tiles[i] *= 2;
                    score += tiles[i];
                    tiles.splice(i + 1, 1);
                }
            }

            while (tiles.length < size) tiles.push(0);

            for (let i = 0; i < size; i++) {
                if (row[i] !== tiles[i]) {
                    moved = true;
                }
            }
            rotated[r] = tiles;
        }

        newGrid = this.unrotate(rotated, direction, size);
        return { grid: newGrid, score, moved };
    }

    rotate(grid, dir, size) {
        const mapGrid = (transform) => {
            let res = [];
            for (let r = 0; r < size; r++) {
                res[r] = [];
                for (let c = 0; c < size; c++) {
                    const [nr, nc] = transform(r, c);
                    res[r][c] = grid[nr][nc];
                }
            }
            return res;
        };
        switch (dir) {
            case DIRECTION.LEFT: return mapGrid((r, c) => [r, c]);
            case DIRECTION.RIGHT: return mapGrid((r, c) => [r, size - 1 - c]);
            case DIRECTION.UP: return mapGrid((r, c) => [c, r]);
            case DIRECTION.DOWN: return mapGrid((r, c) => [size - 1 - c, r]);
        }
    }

    unrotate(grid, dir, size) {
        const mapGrid = (transform) => {
            let res = [];
            for (let r = 0; r < size; r++) {
                res[r] = [];
                for (let c = 0; c < size; c++) {
                    const [nr, nc] = transform(r, c);
                    res[r][c] = grid[nr][nc];
                }
            }
            return res;
        };
        switch (dir) {
            case DIRECTION.LEFT: return mapGrid((r, c) => [r, c]);
            case DIRECTION.RIGHT: return mapGrid((r, c) => [r, size - 1 - c]);
            case DIRECTION.UP: return mapGrid((r, c) => [c, r]);
            case DIRECTION.DOWN: return mapGrid((r, c) => [c, size - 1 - r]);
        }
    }
}
