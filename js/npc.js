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
        
        // Start patrol if points exist
        if (this.patrolPoints.length > 0) {
            this.state = NPC_STATES.PATROL;
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
            // Reached patrol point
            this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
            this.state = NPC_STATES.IDLE;
            this.idleTimer = this.idleDuration;
        } else {
            // Move toward target
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
            // Lost player
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
        
        // Calculate angle to player
        const angleToPlayer = Math.atan2(
            player.y - this.y,
            player.x - this.x
        ) * (180 / Math.PI);
        
        const facingAngle = this.facing === 'right' ? 0 : 180;
        let angleDiff = Math.abs(angleToPlayer - facingAngle);
        
        // Normalize angle difference
        if (angleDiff > 180) angleDiff = 360 - angleDiff;
        
        return angleDiff <= this.detectionAngle / 2;
    }
    
    draw(ctx) {
        // Temporary placeholder
        ctx.fillStyle = this.state === NPC_STATES.CHASE ? '#ff0000' : '#ffff00';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Draw detection cone (debug)
        if (this.state !== NPC_STATES.IDLE) {
            ctx.strokeStyle = this.canSeePlayer ? '#ff0000' : 'rgba(255, 255, 0, 0.3)';
            ctx.beginPath();
            const facingAngle = this.facing === 'right' ? 0 : 180;
            const startAngle = (facingAngle - this.detectionAngle/2) * Math.PI / 180;
            const endAngle = (facingAngle + this.detectionAngle/2) * Math.PI / 180;
            ctx.arc(this.x + this.width/2, this.y + this.height/2, 
                   this.detectionRange, startAngle, endAngle);
            ctx.lineTo(this.x + this.width/2, this.y + this.height/2);
            ctx.stroke();
        }
    }
}


