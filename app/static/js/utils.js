// ========================================
// УТИЛИТЫ И ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ========================================

class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    
    add(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }
    
    sub(v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }
    
    mult(scalar) {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }
    
    distance(v) {
        const dx = v.x - this.x;
        const dy = v.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    clone() {
        return new Vector2(this.x, this.y);
    }
}

// Изометрическая проекция
class IsometricUtils {
    static worldToScreen(x, y, z = 0) {
        const angle = CONFIG.ISOMETRIC_ANGLE;
        const tileSize = CONFIG.TILE_SIZE;
        
        const screenX = (x - y) * Math.cos(angle) * tileSize;
        const screenY = (x + y) * Math.sin(angle) * tileSize - z * 10;
        
        return { x: screenX, y: screenY };
    }
    
    static screenToWorld(screenX, screenY, z = 0) {
        const angle = CONFIG.ISOMETRIC_ANGLE;
        const tileSize = CONFIG.TILE_SIZE;
        
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        
        const x = (screenX / (cos * tileSize) + screenY / (sin * tileSize)) / 2;
        const y = (screenY / (sin * tileSize) - screenX / (cos * tileSize)) / 2;
        
        return { x: Math.round(x), y: Math.round(y) };
    }
}

// Object pool для оптимизации
class ObjectPool {
    constructor(createFn, resetFn, initialSize = 100) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.available = [];
        this.inUse = new Set();
        
        for (let i = 0; i < initialSize; i++) {
            this.available.push(createFn());
        }
    }
    
    get() {
        let obj;
        if (this.available.length > 0) {
            obj = this.available.pop();
        } else {
            obj = this.createFn();
        }
        this.inUse.add(obj);
        return obj;
    }
    
    release(obj) {
        this.inUse.delete(obj);
        this.resetFn(obj);
        this.available.push(obj);
    }
    
    releaseAll() {
        this.inUse.forEach(obj => {
            this.resetFn(obj);
            this.available.push(obj);
        });
        this.inUse.clear();
    }
}

// Частица
class Particle {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.life = 0;
        this.maxLife = 0;
        this.size = 0;
        this.color = '';
        this.active = false;
    }
    
    spawn(x, y, vx, vy, color, life = CONFIG.PARTICLE_LIFETIME) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.maxLife = life;
        this.life = life;
        this.size = 4 + Math.random() * 8;
        this.active = true;
    }
    
    update(dt) {
        if (!this.active) return;
        
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vy += 200 * dt;
        this.life -= dt * 1000;
        
        if (this.life <= 0) {
            this.active = false;
        }
    }
    
    draw(ctx) {
        if (!this.active) return;
        
        const alpha = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    
    reset() {
        this.active = false;
    }
}

// Audio заглушка
class AudioManager {
    constructor() {
        this.enabled = true;
    }
    
    playSound(name) {
        if (!this.enabled) return;
        // TODO: Добавить звуки
    }
}

// Форматирование
function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return Math.floor(num).toString();
}

function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Случайные функции
function random(min, max) {
    return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
    return Math.floor(random(min, max + 1));
}

function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// Интерполяция
function lerp(start, end, t) {
    return start + (end - start) * t;
}

const Easing = {
    easeInQuad: (t) => t * t,
    easeOutQuad: (t) => t * (2 - t),
    easeInOutQuad: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeOutCubic: (t) => 1 + (--t) * t * t,
};
