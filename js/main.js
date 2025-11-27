class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.state = GAME_STATES.LOADING;
        this.lastTime = 0;
        
        // Game systems
        this.player = null;
        this.npcs = [];
        this.stealthSystem = new StealthSystem();
        this.evidenceSystem = new EvidenceSystem();
        
        // Initialize
        this.init();
    }
    
    async init() {
        // Set canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Setup input handlers
        this.setupInputHandlers();
        
        // Setup UI handlers
        this.setupUIHandlers();
        
        // Load assets (simulated)
        await this.loadAssets();
        
        // Show main menu
        this.showMainMenu();
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    async loadAssets() {
        // Simulate loading
        const loadingProgress = document.getElementById('loading-progress');
        const loadingText = document.getElementById('loading-text');
        
        for (let i = 0; i <= 100; i += 10) {
            loadingProgress.style.width = i + '%';
            loadingText.textContent = `Loading... ${i}%`;
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        document.getElementById('loading-screen').classList.add('hidden');
    }
    
    setupInputHandlers() {
        // Keyboard input
        window.addEventListener('keydown', (e) => {
            if (!this.player) return;
            
            this.player.keysPressed[e.key] = true;
            
            // Handle special keys
            if (this.state === GAME_STATES.PLAYING) {
                if (CONFIG.KEYS.JUMP.includes(e.key)) {
                    this.player.jump();
                }
                if (CONFIG.KEYS.SPRINT.includes(e.key)) {
                    this.player.isSprinting = true;
                }
                if (CONFIG.KEYS.CROUCH.includes(e.key)) {
                    this.player.isCrouching = true;
                }
                if (CONFIG.KEYS.PAUSE.includes(e.key)) {
                    this.togglePause();
                    e.preventDefault();
                }
                if (CONFIG.KEYS.INVENTORY.includes(e.key)) {
                    this.toggleInventory();
                    e.preventDefault();
                }
            }
        });
        
        window.addEventListener('keyup', (e) => {
            if (!this.player) return;
            
            this.player.keysPressed[e.key] = false;
            
            if (CONFIG.KEYS.SPRINT.includes(e.key)) {
                this.player.isSprinting = false;
            }
            if (CONFIG.KEYS.CROUCH.includes(e.key)) {
                this.player.isCrouching = false;
            }
        });
    }
    
    setupUIHandlers() {
        // Main menu buttons
        document.getElementById('new-game-btn').addEventListener('click', () => {
            this.startNewGame();
        });
        
        document.getElementById('settings-btn').addEventListener('click', () => {
            this.showSettings();
        });
        
        document.getElementById('credits-btn').addEventListener('click', () => {
            this.showCredits();
        });
        
        // Pause menu buttons
        document.getElementById('resume-btn').addEventListener('click', () => {
            this.togglePause();
        });
        
        document.getElementById('inventory-btn').addEventListener('click', () => {
            this.togglePause();
            this.toggleInventory();
        });
        
        document.getElementById('menu-btn').addEventListener('click', () => {
            this.returnToMenu();
        });
        
        // Inventory
        document.getElementById('close-inventory').addEventListener('click', () => {
            this.toggleInventory();
        });
        
        document.querySelectorAll('.inventory-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.inventory-tab').forEach(t => 
                    t.classList.remove('active'));
                e.target.classList.add('active');
                this.evidenceSystem.currentTab = e.target.dataset.tab;
                this.evidenceSystem.renderInventoryContent();
            });
        });
        
        // Settings
        document.getElementById('close-settings').addEventListener('click', () => {
            document.getElementById('settings-modal').classList.add('hidden');
        });
        
        document.getElementById('music-volume').addEventListener('input', (e) => {
            document.getElementById('music-value').textContent = e.target.value + '%';
        });
        
        document.getElementById('sfx-volume').addEventListener('input', (e) => {
            document.getElementById('sfx-value').textContent = e.target.value + '%';
        });
        
        // Credits
        document.getElementById('close-credits').addEventListener('click', () => {
            document.getElementById('credits-modal').classList.add('hidden');
        });
    }
    
    showMainMenu() {
        this.state = GAME_STATES.MAIN_MENU;
        document.getElementById('main-menu').classList.remove('hidden');
        document.getElementById('game-container').classList.add('hidden');
    }
    
    showSettings() {
        document.getElementById('settings-modal').classList.remove('hidden');
    }
    
    showCredits() {
        document.getElementById('credits-modal').classList.remove('hidden');
    }
    
    startNewGame() {
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('game-container').classList.remove('hidden');
        
        this.state = GAME_STATES.PLAYING;
        
        // Initialize game objects
        this.player = new Player(100, 700);
        
        // Create NPCs for Level 1
        this.npcs = [
            new NPC('security', 400, 852, [
                {x: 400, y: 852},
                {x: 800, y: 852}
            ])
        ];
        
        // Update objective
        document.getElementById('objective-text').textContent = 
            'Enter Saint Cross Hospital';
        
        // Start game loop
        this.lastTime = performance.now();
        this.gameLoop();
    }
    
    gameLoop(currentTime = 0) {
        if (this.state !== GAME_STATES.PLAYING) return;
        
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // Update
        this.update(deltaTime);
        
        // Render
        this.render();
        
        // Continue loop
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update(deltaTime) {
        // Update player
        if (this.player) {
            this.player.update(deltaTime);
        }
        
        // Update NPCs
        this.npcs.forEach(npc => {
            npc.update(deltaTime, this.player, this.stealthSystem);
        });
        
        // Update stealth system
        this.stealthSystem.update(deltaTime, this.player, this.npcs);
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw ground (temporary)
        this.ctx.fillStyle = '#34495e';
        this.ctx.fillRect(0, 900, this.canvas.width, 200);
        
        // Draw player
        if (this.player) {
            this.player.draw(this.ctx);
        }
        
        // Draw NPCs
        this.npcs.forEach(npc => {
            npc.draw(this.ctx);
        });
    }
    
    togglePause() {
        if (this.state === GAME_STATES.PLAYING) {
            this.state = GAME_STATES.PAUSED;
            document.getElementById('pause-menu').classList.remove('hidden');
        } else if (this.state === GAME_STATES.PAUSED) {
            this.state = GAME_STATES.PLAYING;
            document.getElementById('pause-menu').classList.add('hidden');
            this.lastTime = performance.now();
            this.gameLoop();
        }
    }
    
    toggleInventory() {
        const panel = document.getElementById('inventory-panel');
        if (panel.classList.contains('hidden')) {
            this.evidenceSystem.showInventory();
        } else {
            this.evidenceSystem.hideInventory();
        }
    }
    
    returnToMenu() {
        this.state = GAME_STATES.MAIN_MENU;
        document.getElementById('game-container').classList.add('hidden');
        document.getElementById('pause-menu').classList.add('hidden');
        this.showMainMenu();
    }
}

// Start game when page loads
window.addEventListener('load', () => {
    new Game();
});


