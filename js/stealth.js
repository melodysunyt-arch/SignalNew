class StealthSystem {
    constructor() {
        this.suspicionLevel = 0;
    }
    
    update(deltaTime, player, npcs) {
        // Natural suspicion decay
        if (!this.isPlayerDetected(npcs)) {
            this.decreaseSuspicion(CONFIG.STEALTH.SUSPICION_DECAY_RATE * deltaTime);
        }
        
        // Check for game over
        if (this.suspicionLevel >= CONFIG.STEALTH.DETECTION_THRESHOLD) {
            this.triggerDetection();
        }
    }
    
    increaseSuspicion(amount) {
        this.suspicionLevel = Math.min(
            this.suspicionLevel + amount, 
            CONFIG.STEALTH.MAX_SUSPICION
        );
        this.updateSuspicionUI();
    }
    
    decreaseSuspicion(amount) {
        this.suspicionLevel = Math.max(this.suspicionLevel - amount, 0);
        this.updateSuspicionUI();
    }
    
    isPlayerDetected(npcs) {
        return npcs.some(npc => npc.state === NPC_STATES.CHASE);
    }
    
    updateSuspicionUI() {
        const suspicionPercent = (this.suspicionLevel / CONFIG.STEALTH.MAX_SUSPICION) * 100;
        document.getElementById('suspicion-fill').style.width = suspicionPercent + '%';
    }
    
    triggerDetection() {
        console.log('Player detected! Game Over!');
        // Implement game over logic
    }
}
