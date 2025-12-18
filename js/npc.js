// 3D NPC System
class NPC {
    constructor(x, y, z, type, name) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.type = type;
        this.name = name;
        this.state = NPC_STATES.IDLE;
        this.patrolPoints = [];
        this.currentPatrolIndex = 0;
        this.detectionRange = CONFIG.NPC.DETECTION_RANGE / 10; // Scale for 3D
        this.detectionAngle = CONFIG.NPC.DETECTION_ANGLE * (Math.PI / 180); // Convert to radians
        this.alertLevel = 0;
        this.rotation = 0; // Y rotation in radians
        this.idleTimer = this.idleDuration = 3;

        // Animation
        this.animationFrame = 0;
        this.animationTimer = 0;
    }

    update(deltaTime, player) {
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
        if (player && this.canSeePlayer(player)) {
            this.alertLevel += CONFIG.STEALTH.SUSPICION_INCREASE_BASE * deltaTime;

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
        if (this.patrolPoints.length === 0) {
            this.state = NPC_STATES.IDLE;
            this.idleTimer = this.idleDuration;
            return;
        }

        const target = this.patrolPoints[this.currentPatrolIndex];
        const dx = target.x - this.x;
        const dz = target.z - this.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        if (distance < 0.5) {
            this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
            this.state = NPC_STATES.IDLE;
            this.idleTimer = this.idleDuration;
        } else {
            const directionX = dx / distance;
            const directionZ = dz / distance;

            this.x += directionX * (CONFIG.NPC.PATROL_SPEED / 60) * deltaTime * 60;
            this.z += directionZ * (CONFIG.NPC.PATROL_SPEED / 60) * deltaTime * 60;

            // Update rotation to face movement direction
            this.rotation = Math.atan2(directionX, -directionZ);
        }
    }

    chaseBehavior(deltaTime, player) {
        if (!player) return;

        const dx = player.position.x - this.x;
        const dz = player.position.z - this.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        if (distance > 30) {
            this.state = NPC_STATES.PATROL;
            this.alertLevel = 0;
        } else {
            const directionX = dx / distance;
            const directionZ = dz / distance;

            this.x += directionX * (CONFIG.NPC.CHASE_SPEED / 60) * deltaTime * 60;
            this.z += directionZ * (CONFIG.NPC.CHASE_SPEED / 60) * deltaTime * 60;

            // Update rotation to face player
            this.rotation = Math.atan2(directionX, -directionZ);
        }
    }

    canSeePlayer(player) {
        if (!player) return false;

        // Calculate distance to player
        const dx = player.position.x - this.x;
        const dz = player.position.z - this.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        if (distance > this.detectionRange) return false;

        // Calculate angle to player
        const angleToPlayer = Math.atan2(dx, -dz);

        // Calculate angle difference
        let angleDiff = angleToPlayer - this.rotation;

        // Normalize angle to [-PI, PI]
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

        // Check if player is within detection cone
        return Math.abs(angleDiff) <= this.detectionAngle / 2;
    }
}
