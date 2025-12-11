class NPC {
    constructor(type, x, y, patrolPoints = []) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 48;
        this.state = NPC_STATES.IDLE;
        this.patrolPoints = patrolPoints;
        this.currentPatrolIndex = 0;
        this.detectionRange = CONFIG.NPC.DETECTION_RANGE;
        this.detectionAngle = CONFIG.NPC.DETECTION_ANGLE;
        this.alertLevel = 0;
        this.facing = 'right';
        this.idleTimer = 0;
        this.idleDuration = 3;
        
        // Animation
        this.animationFrame = 0;
        this.animationTimer = 0;
        
        // Determine color based on type
        this.color = this.getColorForType(type);
        
        // Start patrol if points exist
        if (this.patrolPoints.length > 0) {
            this.state = NPC_STATES.PATROL;
        }
    }
    
    getColorForType(type) {
        switch(type) {
            case 'security':
            case 'doctor':
                return '#f7768e'; // Hostile
            case 'receptionist':
                return '#e0af68'; // Neutral
            case 'ally':
                return '#9ece6a'; // Friendly
            default:
                return '#e0af68';
        }
    }
    
    update(deltaTime, player, stealthSystem) {
        switch(this.state) {
            case NPC_STATES.IDLE:
                this.idleBehavior(deltaTime);
                break;
            case NPC_STATES.PATROL:
                this.patrolBehavior(deltaTime);
                break;
            case NPC_STATES.CHASE:
                this.chaseBehavior(deltaTime, player);
                break;
        }
        
        // Check for player detection
        if (this.canSeePlayer(player)) {
            this.alertLevel += CONFIG.STEALTH.SUSPICION_INCREASE_BASE * deltaTime;
            stealthSystem.increaseSuspicion(CONFIG.STEALTH.SUSPICION_INCREASE_BASE * deltaTime);
            
            if (this.alertLevel >= CONFIG.NPC.ALERT_THRESHOLD) {
                this.state = NPC_STATES.CHASE;
            }
        } else {
            this.alertLevel = Math.max(0, this.alertLevel - 5 * deltaTime);
        }
        
        // Update animation
        if (this.state === NPC_STATES.PATROL || this.state === NPC_STATES.CHASE) {
            this.animationTimer += deltaTime;
            if (this.animationTimer >= 0.2) {
                this.animationFrame = (this.animationFrame + 1) % 4;
                this.animationTimer = 0;
            }
        }
    }
    
    idleBehavior(deltaTime) {
        this.idleTimer -= deltaTime;
        
        if (this.idleTimer <= 0) {
            if (this.patrolPoints.length > 0) {
                this.state = NPC_STATES.PATROL;
            }
        }
    }
    
    patrolBehavior(deltaTime) {
        const target = this.patrolPoints[this.currentPatrolIndex];
        const distance = Math.hypot(target.x - this.x, target.y - this.y);
        
        if (distance < 10) {
            this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
            this.state = NPC_STATES.IDLE;
            this.idleTimer = this.idleDuration;
        } else {
            const direction = {
                x: (target.x - this.x) / distance,
                y: (target.y - this.y) / distance
            };
            this.x += direction.x * CONFIG.NPC.PATROL_SPEED * deltaTime;
            this.y += direction.y * CONFIG.NPC.PATROL_SPEED * deltaTime;
            this.facing = direction.x > 0 ? 'right' : 'left';
        }
    }
    
    chaseBehavior(deltaTime, player) {
        const distance = Math.hypot(player.x - this.x, player.y - this.y);
        
        if (distance > 300) {
            this.state = NPC_STATES.PATROL;
            this.alertLevel = 0;
        } else {
            const direction = {
                x: (player.x - this.x) / distance,
                y: (player.y - this.y) / distance
            };
            this.x += direction.x * CONFIG.NPC.CHASE_SPEED * deltaTime;
            this.y += direction.y * CONFIG.NPC.CHASE_SPEED * deltaTime;
            this.facing = direction.x > 0 ? 'right' : 'left';
        }
    }
    
    canSeePlayer(player) {
        const distance = Math.hypot(player.x - this.x, player.y - this.y);
        
        if (distance > this.detectionRange) return false;
        
        const angleToPlayer = Math.atan2(
            player.y - this.y,
            player.x - this.x
        ) * (180 / Math.PI);
        
        const facingAngle = this.facing === 'right' ? 0 : 180;
        let angleDiff = Math.abs(angleToPlayer - facingAngle);
        
        if (angleDiff > 180) angleDiff = 360 - angleDiff;
        
        return angleDiff <= this.detectionAngle / 2;
    }
    
    draw(renderer) {
        const detected = this.state === NPC_STATES.CHASE;
        
        // Draw detection cone
        if (this.state !== NPC_STATES.IDLE) {
            renderer.drawDetectionCone(
                this.x + this.width/2,
                this.y + this.height/2,
                this.detectionRange,
                this.detectionAngle,
                this.facing,
                detected
            );
        }
        
        // Draw character
        renderer.drawCharacter(
            this.x,
            this.y,
            this.width,
            this.height,
            this.color,
            this.facing
        );
    }
}
