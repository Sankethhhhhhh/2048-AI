import { CONFIG } from './Constants.js';

export default class UI {
    constructor() {
        this.boardContainer = document.getElementById("board");
        this.gridBg = document.getElementById("grid-bg");
        this.tileContainer = document.getElementById("tile-container");

        this.scoreEl = document.getElementById("score");
        this.bestEl = document.getElementById("best");
        this.movesEl = document.getElementById("moves");
        this.timeEl = document.getElementById("time");

        this.gameMessage = document.getElementById("game-message");
        this.messageTitle = document.getElementById("message-title");
        this.btnKeepPlaying = document.getElementById("btn-keep-playing");

        this.settingsModal = document.getElementById("settings-modal");

        this.cellSize = 0;
        this.padding = 10;

        window.addEventListener('resize', this.onResize.bind(this));
    }

    setupGrid(size) {
        this.gridBg.innerHTML = "";
        this.tileContainer.innerHTML = "";
        this.gridBg.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
        this.gridBg.style.gap = `${CONFIG.GAP}px`;

        // Determine padding from CSS
        const computedStyle = getComputedStyle(this.boardContainer);
        this.padding = parseFloat(computedStyle.padding) || 10;

        for (let i = 0; i < size * size; i++) {
            const cell = document.createElement("div");
            cell.className = "cell";
            this.gridBg.appendChild(cell);
        }

        this.calculateDimensions(size);
    }

    calculateDimensions(size) {
        const boardRect = this.boardContainer.getBoundingClientRect();
        const innerSize = boardRect.width - (this.padding * 2);
        this.cellSize = (innerSize - (CONFIG.GAP * (size - 1))) / size;
    }

    onResize(size = CONFIG.DEFAULT_SIZE) {
        // If the board is recreated, re-calc
        // Note: resizing fully responsive needs all active tiles re-translated
        // For simplicity, we trigger a re-render from the Game class.
        // The Game class should listen to resize or we just emit an event.
        // For now, dimensions are recalculated here and we expect caller to redraw tiles.
        const currentSize = this.gridBg.style.gridTemplateColumns.split(' ').length;
        this.calculateDimensions(currentSize || size);
    }

    updateScore(score, bestScore, moves) {
        this.scoreEl.textContent = score;
        this.bestEl.textContent = bestScore;
        this.movesEl.textContent = moves;
    }

    updateTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        this.timeEl.textContent = `${m}:${s.toString().padStart(2, "0")}`;
    }

    // Draw the full board state efficiently
    renderBoard(grid, size) {
        this.calculateDimensions(size);

        // Keep track of existing tiles to update or remove
        const existingDOMTiles = Array.from(this.tileContainer.children);
        const idMap = new Map();
        existingDOMTiles.forEach(el => idMap.set(el.dataset.id, el));

        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const tile = grid[r][c];
                if (tile) {
                    let tileEl = idMap.get(tile.id);

                    if (!tileEl) {
                        // Create new
                        tileEl = document.createElement("div");
                        tileEl.className = `tile tile-new`;
                        tileEl.dataset.id = tile.id;

                        const inner = document.createElement("div");
                        inner.className = "tile-inner";
                        tileEl.appendChild(inner);

                        this.tileContainer.appendChild(tileEl);
                    } else {
                        // Already exists, just remove from map so we don't delete it
                        idMap.delete(tile.id);
                        // Remove the "new" animation class
                        tileEl.classList.remove("tile-new");
                    }

                    // Update position
                    const x = this.padding + c * (this.cellSize + CONFIG.GAP);
                    const y = this.padding + r * (this.cellSize + CONFIG.GAP);

                    tileEl.style.width = `${this.cellSize}px`;
                    tileEl.style.height = `${this.cellSize}px`;
                    tileEl.style.transform = `translate(${x}px, ${y}px)`;

                    // Update value and apply merge animation class if necessary
                    tileEl.dataset.val = tile.value;
                    const inner = tileEl.querySelector('.tile-inner');
                    inner.textContent = tile.value;
                    inner.style.fontSize = `${this.cellSize * (tile.value > 1000 ? 0.35 : 0.45)}px`;

                    if (tile.mergedFrom) {
                        tileEl.classList.add("tile-merged");
                        // Remove the merged class after animation completes
                        setTimeout(() => {
                            tileEl.classList.remove("tile-merged");
                        }, CONFIG.ANIMATION_DURATION);

                        // Note: For a truly perfect visual, the mergedFrom tiles should slide into this cell
                        // and THEN disappear, giving a smooth visual merge.
                        // But this requires a complex separate tracking system. 
                        // Our "pop" animation masks the instant swap elegantly.
                    }
                }
            }
        }

        // Remove any leftover DOM tiles that are no longer in the grid
        idMap.forEach((el) => {
            el.remove();
        });
    }

    showGameMessage(won) {
        this.gameMessage.classList.remove("hidden");
        if (won) {
            this.gameMessage.classList.add("won");
            this.messageTitle.textContent = "You Win!";
            this.btnKeepPlaying.classList.remove("hidden");
        } else {
            this.gameMessage.classList.remove("won");
            this.messageTitle.textContent = "Game Over!";
            this.btnKeepPlaying.classList.add("hidden");
        }
    }

    hideGameMessage() {
        this.gameMessage.classList.add("hidden");
        this.btnKeepPlaying.classList.add("hidden");
    }

    toggleSettings() {
        this.settingsModal.classList.toggle('hidden');
    }

    updateSettingsUI(size, aiEnabled) {
        document.querySelectorAll('.size-options .btn-toggle').forEach(btn => {
            if (parseInt(btn.dataset.size) === size) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        const aiBtn = document.getElementById('btn-ai-toggle');
        if (aiEnabled) {
            aiBtn.classList.add('active');
            aiBtn.textContent = 'On';
        } else {
            aiBtn.classList.remove('active');
            aiBtn.textContent = 'Off';
        }
    }
}
