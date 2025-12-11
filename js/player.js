class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 48;
        this.velocityX = 0;
        this.velocityY = 0;
        this.onGround = false;
        this.state = PLAYER_STATES.IDLE;
        this.facing = 'right';
        
        // Stats
        this.health = CONFIG.PLAYER.MAX_HEALTH;
        this.stamina = CONFIG.PLAYER.MAX_STAMINA;
        this.isSprinting = false;
        this.isCrouching = false;
        
        // Animation
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.animationSpeed = 0.15;
        
        // Input
        this.keysPressed = {};
    }
    
    update(deltaTime) {
        // Handle horizontal movement
        this.velocityX = 0;
        
        if (this.isKeyPressed(CONFIG.KEYS.MOVE_LEFT) && !this.isCrouching) {
            const speed = this.isSprinting && this.stamina > 0 
                ? -CONFIG.PLAYER.RUN_SPEED 
                : -CONFIG.PLAYER.WALK_SPEED;
            this.velocityX = speed;
            this.state = this.isSprinting ? PLAYER_STATES.RUNNING : PLAYER_STATES.WALKING;
            this.facing = 'left';
        } else if (this.isKeyPressed(CONFIG.KEYS.MOVE_RIGHT) && !this.isCrouching) {
            const speed = this.isSprinting && this.stamina > 0 
                ? CONFIG.PLAYER.RUN_SPEED 
                : CONFIG.PLAYER.WALK_SPEED;
            this.velocityX = speed;
            this.state = this.isSprinting ? PLAYER_STATES.RUNNING : PLAYER_STATES.WALKING;
            this.facing = 'right';
        } else if (this.onGround && !this.isCrouching) {
            this.state = PLAYER_STATES.IDLE;
        }
        
        // Handle stamina
        if (this.isSprinting && this.velocityX !== 0) {
            this.stamina -= CONFIG.PLAYER.STAMINA_DRAIN_RATE * deltaTime;
            if (this.stamina <= 0) {
                this.stamina = 0;
                this.isSprinting = false;
            }
        } else {
            this.stamina += CONFIG.PLAYER.STAMINA_REGEN_RATE * deltaTime;
            if (this.stamina > CONFIG.PLAYER.MAX_STAMINA) {
                this.stamina = CONFIG.PLAYER.MAX_STAMINA;
            }
        }
        
        // Apply gravity
        if (!this.onGround) {
            this.velocityY += CONFIG.PLAYER.GRAVITY * deltaTime;
            this.state = PLAYER_STATES.JUMPING;
        }
        
        // Update position
        this.x += this.velocityX * deltaTime;
        this.y += this.velocityY * deltaTime;
        
        // Ground collision
        const groundY = 900;
        if (this.y + this.height >= groundY) {
            this.y = groundY - this.height;
            this.velocityY = 0;
            this.onGround = true;
        } else {
            this.onGround = false;
        }
        
        // Update animation
        if (this.velocityX !== 0) {
            this.animationTimer += deltaTime;
            if (this.animationTimer >= this.animationSpeed) {
                this.animationFrame = (this.animationFrame + 1) % 4;
                this.animationTimer = 0;
            }
        } else {
            this.animationFrame = 0;
        }
        
        // Update HUD
        this.updateHUD();
    }
    
    jump() {
        if (this.onGround) {
            this.velocityY = CONFIG.PLAYER.JUMP_FORCE;
            this.onGround = false;
        }
    }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health < 0) this.health = 0;
        this.updateHUD();
    }
    
    heal(amount) {
        this.health += amount;
        if (this.health > CONFIG.PLAYER.MAX_HEALTH) {
            this.health = CONFIG.PLAYER.MAX_HEALTH;
        }
        this.updateHUD();
    }
    
    isKeyPressed(keys) {
        return keys.some(key => this.keysPressed[key]);
    }
    
    updateHUD() {
        const healthPercent = (this.health / CONFIG.PLAYER.MAX_HEALTH) * 100;
        document.getElementById('health-fill').style.width = healthPercent + '%';
        
        const staminaPercent = (this.stamina / CONFIG.PLAYER.MAX_STAMINA) * 100;
        document.getElementById('stamina-fill').style.width = staminaPercent + '%';
    }
    
    draw(renderer) {
        // Use pixel art renderer
        renderer.drawCharacter(
            this.x, 
            this.y, 
            this.width, 
            this.height, 
            renderer.colors.player,
            this.facing
        );
        
        // Draw walk animation (simple bob effect)
        if (this.state === PLAYER_STATES.WALKING || this.state === PLAYER_STATES.RUNNING) {
            const bob = Math.sin(this.animationFrame * Math.PI / 2) * 2;
            renderer.ctx.save();
            renderer.ctx.translate(0, bob);
            renderer.ctx.restore();
        }
    }
}
