class StealthSystem {
    constructor() {
        this.suspicion = 0; // Changed from suspicionLevel to match main.js
    }

    update(deltaTime, npcs = []) {
        // Natural suspicion decay
        if (!this.isPlayerDetected(npcs)) {
            this.decreaseSuspicion(CONFIG.STEALTH.SUSPICION_DECAY_RATE * deltaTime);
        }

        // Check for game over
        if (this.suspicion >= CONFIG.STEALTH.DETECTION_THRESHOLD) {
            this.triggerDetection();
        }
    }
    
    increaseSuspicion(amount) {
        this.suspicion = Math.min(
            this.suspicion + amount,
            CONFIG.STEALTH.MAX_SUSPICION
        );
        this.updateSuspicionUI();
    }

    decreaseSuspicion(amount) {
        this.suspicion = Math.max(this.suspicion - amount, 0);
        this.updateSuspicionUI();
    }
    
    isPlayerDetected(npcs) {
        return npcs.some(npc => npc.state === NPC_STATES.CHASE);
    }
    
    updateSuspicionUI() {
        const suspicionPercent = (this.suspicion / CONFIG.STEALTH.MAX_SUSPICION) * 100;
        const fill = document.getElementById('suspicion-fill');
        if (fill) {
            fill.style.width = suspicionPercent + '%';
        }
    }
    
    triggerDetection() {
        console.log('Player detected! Game Over!');
        // Implement game over logic
    }
}


