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

// Объект пула для переиспользования объектов
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

// Легкая система звука (заглушка для начала)
class AudioManager {
    constructor() {
        this.enabled = true;
    }
    
    playSound(name) {
        if (!this.enabled) return;
        // TODO: Добавить звуки позже
        console.log(`Sound: ${name}`);
    }
}

// Формат времени
function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Форматирование чисел
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return Math.floor(num).toString();
}

// Линейная интерполяция
function lerp(start, end, t) {
    return start + (end - start) * t;
}

// Easing функции
const Easing = {
    easeInQuad: (t) => t * t,
    easeOutQuad: (t) => t * (2 - t),
    easeInOutQuad: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeOutCubic: (t) => 1 + (--t) * t * t,
};

// Случайное число в диапазоне
function random(min, max) {
    return Math.random() * (max - min) + min;
}

// Случайное целое число
function randomInt(min, max) {
    return Math.floor(random(min, max + 1));
}

// Случайный элемент из массива
function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// Проверка коллизии между двумя квадратами
function isPointInRect(px, py, rx, ry, rw, rh) {
    return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
}

function isCircleInRect(cx, cy, cr, rx, ry, rw, rh) {
    const closestX = Math.max(rx, Math.min(cx, rx + rw));
    const closestY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - closestX;
    const dy = cy - closestY;
    return (dx * dx + dy * dy) < (cr * cr);
}

// Сообщения Квадратикуса в конце игры
const QUADRATIKUS_MESSAGES = [
    '✨ Вы нашли свой путь! Спасибо, что играли со мной!',
    '🌟 Отлично! Вы показали отличные способности!',
    '🎯 Поздравляю! Вы прошли путь очень быстро!',
    '💡 Интересно! Вы выбрали разные направления развития.',
    '🚀 Вперёд! Я верю в вас!',
    '👏 Спасибо за игру! Удачи в выборе профессии!',
];
