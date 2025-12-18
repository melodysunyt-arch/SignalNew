// 3D Investigation Horror Game - Main
class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.state = GAME_STATES.LOADING;
        this.lastTime = 0;

        // Initialize 3D renderer
        this.renderer3D = new Renderer3D(this.canvas);

        // Game systems
        this.player = null;
        this.npcs = [];
        this.npcMeshes = [];
        this.stealthSystem = new StealthSystem();
        this.evidenceSystem = new EvidenceSystem();

        // Initialize
        this.init();
    }

    async init() {
        try {
            // Simulate loading
            await this.simulateLoading();

            // Load level data
            await this.loadLevel('assets/data/level1.json');

            // Initialize player
            this.player = new Player(this.renderer3D.getCamera(), this.renderer3D.getScene());

            // Hide loading screen, show main menu
            document.getElementById('loading-screen').classList.add('hidden');
            document.getElementById('main-menu').classList.remove('hidden');

            // Setup menu buttons
            this.setupMenu();

            // Setup game controls
            this.setupGameControls();

        } catch (error) {
            console.error('Initialization error:', error);
        }
    }

    async simulateLoading() {
        const loadingProgress = document.getElementById('loading-progress');
        const loadingText = document.getElementById('loading-text');

        const steps = [
            'Loading Three.js...',
            'Creating 3D environment...',
            'Initializing systems...',
            'Loading level data...',
            'Ready!'
        ];

        for (let i = 0; i < steps.length; i++) {
            loadingText.textContent = steps[i];
            loadingProgress.style.width = ((i + 1) / steps.length * 100) + '%';
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    async loadLevel(levelPath) {
        try {
            const response = await fetch(levelPath);
            const levelData = await response.json();

            // Spawn NPCs
            levelData.npcs.forEach(npcData => {
                const npc = new NPC(
                    npcData.position.x / 100, // Scale to 3D space
                    1, // Y position (on ground + height)
                    npcData.position.y / 100,
                    npcData.type,
                    npcData.name
                );

                // Set patrol points
                npc.patrolPoints = npcData.patrolPoints.map(p => ({
                    x: p.x / 100,
                    y: 1,
                    z: p.y / 100
                }));

                // Start patrolling if there are patrol points
                if (npc.patrolPoints.length > 0) {
                    npc.state = NPC_STATES.PATROL;
                } else {
                    npc.state = NPC_STATES.IDLE;
                    npc.idleTimer = npc.idleDuration;
                }

                this.npcs.push(npc);

                // Create 3D mesh for NPC
                const npcMesh = this.renderer3D.createNPC(
                    npcData.position.x / 100,
                    1,
                    npcData.position.y / 100,
                    npcData.name,
                    npcData.type
                );
                this.npcMeshes.push(npcMesh);
            });

            // Set objective
            if (levelData.objectives && levelData.objectives.length > 0) {
                document.getElementById('objective-text').textContent = levelData.objectives[0].description;
            }

        } catch (error) {
            console.error('Error loading level:', error);
        }
    }

    setupMenu() {
        document.getElementById('new-game-btn').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('settings-btn').addEventListener('click', () => {
            document.getElementById('settings-modal').classList.remove('hidden');
        });

        document.getElementById('credits-btn').addEventListener('click', () => {
            document.getElementById('credits-modal').classList.remove('hidden');
        });

        // Close modals
        document.getElementById('close-settings').addEventListener('click', () => {
            document.getElementById('settings-modal').classList.add('hidden');
        });

        document.getElementById('close-credits').addEventListener('click', () => {
            document.getElementById('credits-modal').classList.add('hidden');
        });

        // Settings controls
        const musicVolume = document.getElementById('music-volume');
        const musicValue = document.getElementById('music-value');
        musicVolume.addEventListener('input', (e) => {
            musicValue.textContent = e.target.value + '%';
        });

        const sfxVolume = document.getElementById('sfx-volume');
        const sfxValue = document.getElementById('sfx-value');
        sfxVolume.addEventListener('input', (e) => {
            sfxValue.textContent = e.target.value + '%';
        });

        document.getElementById('fullscreen-toggle').addEventListener('click', (e) => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
                e.target.textContent = 'On';
            } else {
                document.exitFullscreen();
                e.target.textContent = 'Off';
            }
        });
    }

    setupGameControls() {
        // Pause menu
        document.addEventListener('keydown', (e) => {
            if (this.state === GAME_STATES.PLAYING &&
                CONFIG.KEYS.PAUSE.includes(e.key)) {
                this.pauseGame();
            } else if (this.state === GAME_STATES.PAUSED &&
                CONFIG.KEYS.PAUSE.includes(e.key)) {
                this.resumeGame();
            }

            // Interaction
            if (this.state === GAME_STATES.PLAYING &&
                CONFIG.KEYS.INTERACT.includes(e.key)) {
                this.handleInteraction();
            }

            // Inventory
            if (CONFIG.KEYS.INVENTORY.includes(e.key)) {
                e.preventDefault();
                if (this.state === GAME_STATES.PLAYING) {
                    this.openInventory();
                } else if (this.state === GAME_STATES.INVENTORY) {
                    this.closeInventory();
                }
            }
        });

        // Pause menu buttons
        document.getElementById('resume-btn').addEventListener('click', () => {
            this.resumeGame();
        });

        document.getElementById('inventory-btn').addEventListener('click', () => {
            this.pauseGame();
            this.openInventory();
        });

        document.getElementById('menu-btn').addEventListener('click', () => {
            this.returnToMenu();
        });

        // Inventory close
        document.getElementById('close-inventory').addEventListener('click', () => {
            this.closeInventory();
        });
    }

    startGame() {
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('game-container').classList.remove('hidden');
        this.state = GAME_STATES.PLAYING;

        // Start game loop
        requestAnimationFrame((time) => this.gameLoop(time));

        // Show pointer lock instruction
        setTimeout(() => {
            if (!this.player.isPointerLocked) {
                alert('Click on the game to lock mouse cursor and start playing!\n\nControls:\nWASD - Move\nMouse - Look around\nShift - Sprint\nE - Interact\nESC - Pause');
            }
        }, 500);
    }

    pauseGame() {
        if (this.state === GAME_STATES.PLAYING) {
            this.state = GAME_STATES.PAUSED;
            document.getElementById('pause-menu').classList.remove('hidden');
            document.exitPointerLock();
        }
    }

    resumeGame() {
        if (this.state === GAME_STATES.PAUSED) {
            this.state = GAME_STATES.PLAYING;
            document.getElementById('pause-menu').classList.add('hidden');
            // Reset lastTime to prevent huge deltaTime spike after pause
            this.lastTime = 0;
        }
    }

    returnToMenu() {
        this.state = GAME_STATES.MAIN_MENU;
        document.getElementById('game-container').classList.add('hidden');
        document.getElementById('pause-menu').classList.add('hidden');
        document.getElementById('main-menu').classList.remove('hidden');
        document.exitPointerLock();
    }

    openInventory() {
        this.state = GAME_STATES.INVENTORY;
        document.getElementById('inventory-panel').classList.remove('hidden');
        this.updateInventoryDisplay();
        document.exitPointerLock();
    }

    closeInventory() {
        if (this.state === GAME_STATES.INVENTORY) {
            this.state = GAME_STATES.PLAYING;
            document.getElementById('inventory-panel').classList.add('hidden');
            // Reset lastTime to prevent huge deltaTime spike
            this.lastTime = 0;
        }
    }

    updateInventoryDisplay() {
        const content = document.getElementById('inventory-content');
        const evidence = this.evidenceSystem.getEvidence();

        if (evidence.length === 0) {
            content.innerHTML = '<p style="color: #7d8491; text-align: center; margin-top: 2rem;">No evidence collected yet.</p>';
        } else {
            content.innerHTML = evidence.map(e => `
                <div class="inventory-item">
                    <div class="item-name">${e.name}</div>
                    <div class="item-description">${e.description}</div>
                </div>
            `).join('');
        }
    }

    handleInteraction() {
        const interactable = this.renderer3D.checkInteraction();

        if (interactable) {
            if (interactable.type === 'evidence') {
                // Collect evidence
                const evidenceData = {
                    id: interactable.id,
                    name: 'Hospital Map',
                    description: 'A detailed layout of Saint Cross Hospital showing all floors and departments.',
                    collectedAt: Date.now()
                };
                this.evidenceSystem.collectEvidence(evidenceData);

                // Show notification
                this.showNotification('Evidence Collected: ' + evidenceData.name);

                // Remove from scene
                const objects = this.renderer3D.interactableObjects;
                const index = objects.findIndex(obj => obj.userData.id === interactable.id);
                if (index > -1) {
                    this.renderer3D.getScene().remove(objects[index]);
                    objects.splice(index, 1);
                }

                // Update objective
                document.getElementById('objective-text').textContent = 'Explore the hospital';
            } else if (interactable.type === 'npc') {
                this.startDialogue(interactable.name);
            }
        }
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(187, 154, 247, 0.9);
            color: #1a1d29;
            padding: 1rem 2rem;
            border-radius: 8px;
            font-weight: bold;
            z-index: 1000;
            animation: slideDown 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    startDialogue(npcName) {
        this.state = GAME_STATES.DIALOGUE;
        document.getElementById('dialogue-box').classList.remove('hidden');
        document.getElementById('dialogue-speaker').textContent = npcName;
        document.getElementById('dialogue-text').textContent = 'Hello, welcome to Saint Cross Hospital. How can I help you?';
        document.exitPointerLock();

        // Simple close on any key
        const closeDialogue = (e) => {
            if (e.key === 'e' || e.key === 'E' || e.key === 'Enter' || e.key === 'Escape') {
                document.getElementById('dialogue-box').classList.add('hidden');
                this.state = GAME_STATES.PLAYING;
                document.removeEventListener('keydown', closeDialogue);
                // Reset lastTime to prevent huge deltaTime spike
                this.lastTime = 0;
            }
        };
        document.addEventListener('keydown', closeDialogue);
    }

    gameLoop(currentTime) {
        // Continue loop
        requestAnimationFrame((time) => this.gameLoop(time));

        if (this.state !== GAME_STATES.PLAYING) {
            return;
        }

        // Initialize lastTime on first frame
        if (this.lastTime === 0) {
            this.lastTime = currentTime;
            return;
        }

        // Calculate delta time
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        // Update game systems
        this.update(deltaTime);

        // Render
        this.render();
    }

    update(deltaTime) {
        // Clamp delta time to prevent large jumps
        deltaTime = Math.min(deltaTime, 0.1);

        // Update player
        if (this.player) {
            this.player.update(deltaTime);
        }

        // Update NPCs
        this.npcs.forEach((npc, index) => {
            npc.update(deltaTime, this.player);

            // Update 3D mesh position
            if (this.npcMeshes[index]) {
                this.renderer3D.updateNPCPosition(
                    this.npcMeshes[index],
                    npc.x,
                    npc.y,
                    npc.z,
                    npc.rotation
                );
            }

            // Check if player is detected
            if (npc.state === NPC_STATES.CHASE) {
                this.stealthSystem.increaseSuspicion(
                    CONFIG.STEALTH.SUSPICION_INCREASE_BASE * deltaTime
                );
            }
        });

        // Update stealth system
        this.stealthSystem.update(deltaTime, this.npcs);

        // Check if player is detected
        if (this.stealthSystem.suspicion >= CONFIG.STEALTH.DETECTION_THRESHOLD) {
            // Game over logic
            if (this.stealthSystem.suspicion >= CONFIG.STEALTH.MAX_SUSPICION) {
                this.gameOver();
            }
        }

        // Check for nearby interactables
        const interactable = this.renderer3D.checkInteraction();
        if (interactable) {
            document.getElementById('interaction-prompt').classList.remove('hidden');
        } else {
            document.getElementById('interaction-prompt').classList.add('hidden');
        }
    }

    render() {
        this.renderer3D.render();
    }

    gameOver() {
        this.state = GAME_STATES.GAME_OVER;
        alert('GAME OVER - You were detected!');
        this.returnToMenu();
    }
}

// Start the game when page loads
window.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
});
