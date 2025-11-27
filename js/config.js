// Game Configuration
const CONFIG = {
    // Canvas settings
    CANVAS_WIDTH: 1920,
    CANVAS_HEIGHT: 1080,
    
    // Player settings
    PLAYER: {
        WALK_SPEED: 120,
        RUN_SPEED: 240,
        JUMP_FORCE: -400,
        GRAVITY: 1200,
        MAX_STAMINA: 100,
        STAMINA_DRAIN_RATE: 15,
        STAMINA_REGEN_RATE: 10,
        MAX_HEALTH: 100
    },
    
    // Stealth settings
    STEALTH: {
        MAX_SUSPICION: 100,
        SUSPICION_DECAY_RATE: 5,
        DETECTION_THRESHOLD: 75,
        SUSPICION_INCREASE_BASE: 10
    },
    
    // NPC settings
    NPC: {
        DETECTION_RANGE: 200,
        DETECTION_ANGLE: 90,
        PATROL_SPEED: 80,
        CHASE_SPEED: 150,
        ALERT_THRESHOLD: 30
    },
    
    // Game settings
    GAME: {
        MAX_DAYS: 30,
        CURRENT_DAY: 1,
        CURRENT_LEVEL: 1
    },
    
    // Controls
    KEYS: {
        MOVE_LEFT: ['ArrowLeft', 'a', 'A'],
        MOVE_RIGHT: ['ArrowRight', 'd', 'D'],
        JUMP: [' ', 'w', 'W', 'ArrowUp'],
        CROUCH: ['Control', 's', 'S', 'ArrowDown'],
        SPRINT: ['Shift'],
        INTERACT: ['e', 'E', 'Enter'],
        INVENTORY: ['Tab', 'i', 'I'],
        PAUSE: ['Escape', 'p', 'P']
    }
};

// Game States
const GAME_STATES = {
    LOADING: 'loading',
    MAIN_MENU: 'main_menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    DIALOGUE: 'dialogue',
    INVENTORY: 'inventory',
    GAME_OVER: 'game_over',
    LEVEL_COMPLETE: 'level_complete'
};

// Player States
const PLAYER_STATES = {
    IDLE: 'idle',
    WALKING: 'walking',
    RUNNING: 'running',
    JUMPING: 'jumping',
    CROUCHING: 'crouching',
    INTERACTING: 'interacting'
};

// NPC States
const NPC_STATES = {
    IDLE: 'idle',
    PATROL: 'patrol',
    SUSPICIOUS: 'suspicious',
    ALERT: 'alert',
    CHASE: 'chase'
};


