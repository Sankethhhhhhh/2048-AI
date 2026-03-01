import { CONFIG, GAME_STATE, DIRECTION } from './Constants.js';

export default class Game {
    constructor(uiManager, storageManager, soundManager) {
        this.ui = uiManager;
        this.storage = storageManager;
        this.sound = soundManager;

        this.size = CONFIG.DEFAULT_SIZE;
        this.grid = [];
        this.score = 0;
        this.bestScore = 0;
        this.moves = 0;
        this.time = 0;
        this.timerInterval = null;
        this.state = GAME_STATE.PLAYING;
        this.history = []; // For Undo functionality
        this.won = false;  // Keep track if user won this game instance to prevent multiple "You Win" popups
        this.tileIdCounter = 0;

        window.addEventListener('resize', () => {
            if (this.grid.length > 0) {
                requestAnimationFrame(() => this.updateUI());
            }
        });
    }

    init(size = CONFIG.DEFAULT_SIZE) {
        this.size = size;
        this.bestScore = this.storage.getBestScore(this.size);
        this.ui.setupGrid(this.size);

        // First try to load from local storage
        const savedState = this.storage.getGameState(this.size);
        if (savedState && savedState.state !== GAME_STATE.GAME_OVER) {
            this.loadState(savedState);
        } else {
            this.startNewGame();
        }
    }

    startNewGame() {
        this.grid = Array.from({ length: this.size }, () => Array(this.size).fill(null));
        this.score = 0;
        this.moves = 0;
        this.time = 0;
        this.history = [];
        this.state = GAME_STATE.PLAYING;
        this.won = false;
        this.tileIdCounter = 0;
        this.ui.hideGameMessage();

        this.spawnTile();
        this.spawnTile();

        this.bestScore = this.storage.getBestScore(this.size);

        this.saveState();
        this.updateUI();
        this.startTimer();
    }

    loadState(savedState) {
        this.grid = savedState.grid;
        this.score = savedState.score;
        this.moves = savedState.moves;
        this.time = savedState.time || 0;
        this.state = savedState.state;
        this.won = savedState.won || false;
        this.tileIdCounter = savedState.tileIdCounter || Date.now(); // fallback

        this.updateUI();
        if (this.state === GAME_STATE.PLAYING) {
            this.startTimer();
        }
    }

    saveState() {
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            this.storage.setBestScore(this.size, this.bestScore);
        }
        this.storage.setGameState(this.size, {
            grid: this.grid,
            score: this.score,
            moves: this.moves,
            time: this.time,
            state: this.state,
            won: this.won,
            tileIdCounter: this.tileIdCounter
        });
    }

    saveHistory() {
        // Keep last 10 moves
        if (this.history.length >= 10) {
            this.history.shift();
        }
        // Deep clone grid
        const gridClone = this.grid.map(row => row.map(tile => tile ? { ...tile } : null));
        this.history.push({
            grid: gridClone,
            score: this.score,
            moves: this.moves
        });
    }

    undo() {
        if (this.history.length === 0 || this.state === GAME_STATE.GAME_OVER) return;

        // Resume game state if won
        if (this.state === GAME_STATE.WON) {
            this.state = GAME_STATE.PLAYING;
            this.ui.hideGameMessage();
            this.startTimer();
        }

        const prevState = this.history.pop();
        this.grid = prevState.grid;
        this.score = prevState.score;
        this.moves = prevState.moves;

        this.saveState();
        this.updateUI();
    }

    spawnTile() {
        const emptyCells = [];
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (!this.grid[r][c]) {
                    emptyCells.push({ r, c });
                }
            }
        }
        if (emptyCells.length === 0) return;

        const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const value = Math.random() < 0.9 ? 2 : 4;

        this.grid[randomCell.r][randomCell.c] = {
            id: `tile_${this.tileIdCounter++}`,
            value: value,
            mergedFrom: null
        };
    }

    startTimer() {
        clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            if (this.state === GAME_STATE.PLAYING) {
                this.time++;
                this.ui.updateTime(this.time);
            }
        }, 1000);
    }

    stopTimer() {
        clearInterval(this.timerInterval);
    }

    updateUI() {
        // Clear the mergedFrom flags before next move so "pop" animation works correctly per move
        const clientGrid = this.grid.map(row => row.map(t => {
            if (!t) return null;
            return t;
        }));

        this.ui.updateScore(this.score, this.bestScore, this.moves);
        this.ui.updateTime(this.time);
        this.ui.renderBoard(clientGrid, this.size);

        // After rendering, clear merged flags invisibly
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.grid[r][c]) {
                    this.grid[r][c].mergedFrom = null;
                }
            }
        }
    }

    // Handle movement logic
    move(direction) {
        if (this.state !== GAME_STATE.PLAYING) return false;

        this.sound.init(); // Init sound on first interaction
        let moved = false;
        let anyMerge = false;

        // Save state before move
        this.saveHistory();

        // 1. Rotate grid to align direction with LEFT (0 = UP, 1 = RIGHT, 2 = DOWN, 3 = LEFT)
        // To move LEFT, we need 0 rotations. UP = 3 (counterclockwise), RIGHT = 2, DOWN = 1
        // Actually, simple mapping:
        let rotated = this.rotateGrid(this.grid, direction);

        // 2. Perform slide and merge left
        for (let r = 0; r < this.size; r++) {
            let originalRow = rotated[r];
            // Filter out empty cells
            let tiles = originalRow.filter(cell => cell !== null);

            // Merge
            for (let i = 0; i < tiles.length - 1; i++) {
                if (tiles[i].value === tiles[i + 1].value) {
                    tiles[i].value *= 2;
                    tiles[i].mergedFrom = [tiles[i], tiles[i + 1]]; // Mark for animation
                    // Give it a new ID so the transition thinks it's a new tile staying there
                    // But actually setting animation class on it is easier.

                    this.score += tiles[i].value;
                    tiles.splice(i + 1, 1);
                    anyMerge = true;

                    if (tiles[i].value === CONFIG.WIN_VALUE && !this.won) {
                        this.state = GAME_STATE.WON;
                        this.won = true;
                    }
                }
            }

            // Pad with nulls
            while (tiles.length < this.size) {
                tiles.push(null);
            }

            // Check if row changed
            for (let i = 0; i < this.size; i++) {
                if (originalRow[i]?.id !== tiles[i]?.id) {
                    moved = true;
                    break;
                }
            }

            rotated[r] = tiles;
        }

        // 3. Unrotate
        this.grid = this.unrotateGrid(rotated, direction);

        if (moved) {
            if (anyMerge) {
                this.sound.playMerge();
            } else {
                this.sound.playMove();
            }

            this.moves++;
            this.spawnTile();
            this.updateUI();

            // Check win/lose
            if (this.state === GAME_STATE.WON) {
                this.stopTimer();
                this.sound.playWin();
                this.ui.showGameMessage(true);
            } else if (!this.movesAvailable()) {
                this.state = GAME_STATE.GAME_OVER;
                this.stopTimer();
                this.sound.playGameOver();
                this.ui.showGameMessage(false);
            }

            this.saveState();
            return true;
        } else {
            // Revert history if didn't move
            this.history.pop();
            return false;
        }
    }

    // --- Grid Rotation Helpers ---
    // To simplify movement logic, we rotate the board so that movement is always to the LEFT

    rotateGrid(grid, direction) {
        const mapGrid = (g, transform) => {
            let newG = [];
            for (let r = 0; r < this.size; r++) {
                newG[r] = [];
                for (let c = 0; c < this.size; c++) {
                    const [nr, nc] = transform(r, c);
                    newG[r][c] = g[nr][nc];
                }
            }
            return newG;
        };

        switch (direction) {
            case DIRECTION.LEFT: return mapGrid(grid, (r, c) => [r, c]);
            case DIRECTION.RIGHT: return mapGrid(grid, (r, c) => [r, this.size - 1 - c]);
            case DIRECTION.UP: return mapGrid(grid, (r, c) => [c, r]);
            case DIRECTION.DOWN: return mapGrid(grid, (r, c) => [this.size - 1 - c, r]);
        }
    }

    unrotateGrid(grid, direction) {
        const mapGrid = (g, transform) => {
            let newG = [];
            for (let r = 0; r < this.size; r++) {
                newG[r] = [];
                for (let c = 0; c < this.size; c++) {
                    const [nr, nc] = transform(r, c);
                    newG[r][c] = g[nr][nc];
                }
            }
            return newG;
        };

        switch (direction) {
            case DIRECTION.LEFT: return mapGrid(grid, (r, c) => [r, c]);
            case DIRECTION.RIGHT: return mapGrid(grid, (r, c) => [r, this.size - 1 - c]);
            case DIRECTION.UP: return mapGrid(grid, (r, c) => [c, r]);
            case DIRECTION.DOWN: return mapGrid(grid, (r, c) => [c, this.size - 1 - r]);
        }
    }

    getGridValues() {
        return this.grid.map(row => row.map(tile => tile ? tile.value : 0));
    }

    movesAvailable() {
        // 1. Any empty cells?
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (!this.grid[r][c]) return true;
            }
        }
        // 2. Any possible merges?
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                const val = this.grid[r][c].value;
                if (c < this.size - 1 && this.grid[r][c + 1] && this.grid[r][c + 1].value === val) return true;
                if (r < this.size - 1 && this.grid[r + 1][c] && this.grid[r + 1][c].value === val) return true;
            }
        }
        return false;
    }

    keepPlaying() {
        this.state = GAME_STATE.PLAYING;
        this.ui.hideGameMessage();
        this.startTimer();
    }
}
