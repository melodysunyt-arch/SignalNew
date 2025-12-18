// 3D First-Person Player Controller
class Player {
    constructor(camera, scene) {
        this.camera = camera;
        this.scene = scene;

        // Position (camera is at eye level)
        this.position = new THREE.Vector3(0, 1.6, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);

        // Rotation
        this.rotation = new THREE.Euler(0, 0, 0, 'YXZ');
        this.camera.rotation.order = 'YXZ';

        // Stats
        this.health = CONFIG.PLAYER.MAX_HEALTH;
        this.stamina = CONFIG.PLAYER.MAX_STAMINA;
        this.isSprinting = false;
        this.isCrouching = false;

        // Movement
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.canJump = false;

        // Mouse control
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseSensitivity = 0.002;
        this.isPointerLocked = false;

        // Collision
        this.height = 1.6;
        this.radius = 0.3;
        this.boundingBox = new THREE.Box3();

        // Input
        this.keysPressed = {};

        // Setup controls
        this.setupControls();
        this.setupPointerLock();
    }

    setupControls() {
        document.addEventListener('keydown', (e) => {
            this.keysPressed[e.key] = true;

            if (this.isKeyPressed(CONFIG.KEYS.MOVE_LEFT)) this.moveLeft = true;
            if (this.isKeyPressed(CONFIG.KEYS.MOVE_RIGHT)) this.moveRight = true;
            if (this.isKeyPressed(CONFIG.KEYS.MOVE_FORWARD)) this.moveForward = true;
            if (this.isKeyPressed(CONFIG.KEYS.MOVE_BACKWARD)) this.moveBackward = true;
            if (this.isKeyPressed(CONFIG.KEYS.SPRINT)) this.isSprinting = true;
            if (this.isKeyPressed(CONFIG.KEYS.CROUCH)) this.isCrouching = true;
            if (this.isKeyPressed(CONFIG.KEYS.JUMP) && this.canJump) {
                this.velocity.y = 5;
                this.canJump = false;
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keysPressed[e.key] = false;

            if (!this.isKeyPressed(CONFIG.KEYS.MOVE_LEFT)) this.moveLeft = false;
            if (!this.isKeyPressed(CONFIG.KEYS.MOVE_RIGHT)) this.moveRight = false;
            if (!this.isKeyPressed(CONFIG.KEYS.MOVE_FORWARD)) this.moveForward = false;
            if (!this.isKeyPressed(CONFIG.KEYS.MOVE_BACKWARD)) this.moveBackward = false;
            if (!this.isKeyPressed(CONFIG.KEYS.SPRINT)) this.isSprinting = false;
            if (!this.isKeyPressed(CONFIG.KEYS.CROUCH)) this.isCrouching = false;
        });
    }

    setupPointerLock() {
        const canvas = document.getElementById('game-canvas');

        canvas.addEventListener('click', () => {
            if (!this.isPointerLocked) {
                canvas.requestPointerLock();
            }
        });

        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement === canvas;
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.isPointerLocked) return;

            this.mouseX += e.movementX * this.mouseSensitivity;
            this.mouseY += e.movementY * this.mouseSensitivity;

            // Clamp vertical rotation
            this.mouseY = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.mouseY));
        });
    }

    update(deltaTime) {
        // Update rotation from mouse
        this.rotation.y = this.mouseX;
        this.rotation.x = this.mouseY;
        this.camera.rotation.copy(this.rotation);

        // Handle movement
        const direction = new THREE.Vector3();
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);

        // Project to horizontal plane
        forward.y = 0;
        forward.normalize();
        right.y = 0;
        right.normalize();

        if (this.moveForward) direction.add(forward);
        if (this.moveBackward) direction.sub(forward);
        if (this.moveLeft) direction.sub(right);
        if (this.moveRight) direction.add(right);

        // Normalize diagonal movement
        if (direction.length() > 0) {
            direction.normalize();
        }

        // Calculate speed
        let speed = CONFIG.PLAYER.WALK_SPEED / 60; // Convert to units per frame
        if (this.isSprinting && this.stamina > 0) {
            speed = CONFIG.PLAYER.RUN_SPEED / 60;
        }
        if (this.isCrouching) {
            speed *= 0.5;
        }

        // Apply movement
        this.velocity.x = direction.x * speed;
        this.velocity.z = direction.z * speed;

        // Apply gravity
        this.velocity.y -= 9.8 * deltaTime;

        // Update position
        const oldPosition = this.position.clone();
        this.position.add(this.velocity.clone().multiplyScalar(deltaTime * 60));

        // Check collisions
        if (this.checkCollision()) {
            this.position.copy(oldPosition);
            this.velocity.x = 0;
            this.velocity.z = 0;
        }

        // Ground check
        if (this.position.y <= 1.6) {
            this.position.y = 1.6;
            this.velocity.y = 0;
            this.canJump = true;
        }

        // Update camera position
        this.camera.position.copy(this.position);

        // Handle stamina
        if (this.isSprinting && (this.moveForward || this.moveBackward || this.moveLeft || this.moveRight)) {
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

        // Update bounding box
        this.updateBoundingBox();

        // Update HUD
        this.updateHUD();
    }

    updateBoundingBox() {
        const min = new THREE.Vector3(
            this.position.x - this.radius,
            this.position.y - this.height,
            this.position.z - this.radius
        );
        const max = new THREE.Vector3(
            this.position.x + this.radius,
            this.position.y,
            this.position.z + this.radius
        );
        this.boundingBox.set(min, max);
    }

    checkCollision() {
        // Simple collision with walls (boundaries)
        const boundary = 19.5; // Wall boundaries

        if (Math.abs(this.position.x) > boundary) return true;
        if (Math.abs(this.position.z) > boundary) return true;

        // Check collision with reception desk
        if (this.position.z < -8 && this.position.z > -12 &&
            Math.abs(this.position.x) < 3.5) {
            return true;
        }

        // Check collision with inner walls
        if (Math.abs(this.position.z - 5) < 0.5 && Math.abs(this.position.x) < 10) {
            return true;
        }

        // Check side room walls
        if (Math.abs(this.position.x - 10) < 0.5 && this.position.z > 5) {
            return true;
        }
        if (Math.abs(this.position.x + 10) < 0.5 && this.position.z > 5) {
            return true;
        }

        return false;
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health < 0) this.health = 0;
        this.updateHUD();

        // Flash red effect
        document.getElementById('game-canvas').style.filter = 'sepia(1) hue-rotate(-50deg)';
        setTimeout(() => {
            document.getElementById('game-canvas').style.filter = 'none';
        }, 200);
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

    getForwardDirection() {
        return new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    }
}
