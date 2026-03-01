import UI from './UI.js';
import StorageManager from './StorageManager.js';
import SoundManager from './SoundManager.js';
import InputManager from './InputManager.js';
import Game from './Game.js';
import AI from './AI.js';
import { CONFIG } from './Constants.js';

document.addEventListener("DOMContentLoaded", () => {
    // Initialize Managers
    const ui = new UI();
    const storage = new StorageManager();
    const sound = new SoundManager();
    const input = new InputManager();

    // Initialize Core and AI
    const game = new Game(ui, storage, sound);
    const ai = new AI(game);

    // Expose for debugging if needed
    window.game2048 = game;

    // Bind Input to Game
    input.on("move", (direction) => {
        // Stop AI if user manually moves
        if (ai.enabled) {
            ai.toggle();
            ui.updateSettingsUI(game.size, ai.enabled);
        }
        game.move(direction);
    });

    // UI Event Listeners
    document.getElementById("btn-restart").addEventListener("click", () => {
        game.startNewGame();
        ai.stop();
        ai.enabled = false;
        ui.updateSettingsUI(game.size, false);
    });

    document.getElementById("btn-undo").addEventListener("click", () => {
        game.undo();
    });

    document.getElementById("btn-try-again").addEventListener("click", () => {
        game.startNewGame();
    });

    document.getElementById("btn-keep-playing").addEventListener("click", () => {
        game.keepPlaying();
    });

    document.getElementById("btn-settings").addEventListener("click", () => {
        ui.toggleSettings();
    });

    document.getElementById("btn-close-settings").addEventListener("click", () => {
        ui.toggleSettings();
    });

    document.getElementById("btn-ai-toggle").addEventListener("click", () => {
        const isEnabled = ai.toggle();
        ui.updateSettingsUI(game.size, isEnabled);
    });

    document.querySelectorAll('.size-options .btn-toggle').forEach(btn => {
        btn.addEventListener("click", (e) => {
            const newSize = parseInt(e.target.dataset.size, 10);
            if (newSize !== game.size) {
                // Confirm before deleting state?
                if (confirm(`Change grid to ${newSize}x${newSize}? This will restart the game.`)) {
                    game.init(newSize);
                    ui.updateSettingsUI(newSize, ai.enabled);
                    ui.toggleSettings();
                }
            }
        });
    });

    // Start the game!
    game.init(CONFIG.DEFAULT_SIZE);
    ui.updateSettingsUI(game.size, ai.enabled);
});
