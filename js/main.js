class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.state = GAME_STATES.LOADING;
        this.lastTime = 0;
        
        // Initialize pixel renderer
        this.renderer = new PixelRenderer(this.ctx);
        
        // Game systems
        this.player = null;
        this.npcs = [];
        this.stealthSystem = new StealthSystem();
        this.evidenceSystem = new EvidenceSystem();
        
        // Camera offset for scrolling
        this.cameraX = 0;
        
        // Initialize
        this.init();
    }
    
    // ... rest of the code remains the same until render() method
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background with parallax
        this.renderer.drawBackground(this.cameraX);
        
        // Draw hospital floor
        this.renderer.drawHospitalFloor(0, 900, this.canvas.width, 200);
        
        // Draw walls/environment (example)
        this.renderer.drawWall(50, 700, 100, 200);
        this.renderer.drawWall(this.canvas.width - 150, 700, 100, 200);
        
        // Draw evidence items (example)
        this.renderer.drawEvidence(300, 870, false);
        this.renderer.drawEvidence(600, 870, false);
        
        // Save context for camera transform
        this.ctx.save();
        this.ctx.translate(-this.cameraX, 0);
        
        // Draw NPCs
        this.npcs.forEach(npc => {
            npc.draw(this.renderer);
        });
        
        // Draw player
        if (this.player) {
            this.player.draw(this.renderer);
        }
        
        // Restore context
        this.ctx.restore();
        
        // Update camera to follow player
        if (this.player) {
            const targetCameraX = this.player.x - this.canvas.width / 2;
            this.cameraX += (targetCameraX - this.cameraX) * 0.1; // Smooth camera
            this.cameraX = Math.max(0, this.cameraX); // Don't go past left edge
        }
    }
}


