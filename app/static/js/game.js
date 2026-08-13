// ========================================
// ОСНОВНОЙ ИГРОВОЙ КОД
// ========================================

class GameState {
    constructor() {
        this.isRunning = false;
        this.isPaused = false;
        this.startTime = 0;
        this.elapsedTime = 0;
        
        this.pathPoints = 0;
        this.coins = 0;
        this.interests = 0;
        this.directions = 0;
        
        this.upgradeLevel = {};
        UPGRADES.forEach(u => {
            this.upgradeLevel[u.id] = 0;
        });
    }
    
    reset() {
        this.isRunning = false;
        this.isPaused = false;
        this.startTime = 0;
        this.elapsedTime = 0;
        this.pathPoints = 0;
        this.coins = 0;
        this.interests = 0;
        this.directions = 0;
        this.upgradeLevel = {};
        UPGRADES.forEach(u => {
            this.upgradeLevel[u.id] = 0;
        });
    }
}

class Interest {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.colorIndex = 0;
        this.size = CONFIG.INTEREST_SIZE;
        this.active = false;
        this.inMachine = false;
        this.targetX = 0;
        this.targetY = 0;
        this.progress = 0;
    }
    
    spawn(x, y, colorIndex) {
        this.x = x;
        this.y = y;
        this.colorIndex = colorIndex;
        this.active = true;
        this.inMachine = false;
        this.progress = 0;
    }
    
    reset() {
        this.active = false;
        this.inMachine = false;
        this.progress = 0;
    }
}

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
        this.size = 4 + Math.random() * 6;
        this.active = true;
    }
    
    update(dt) {
        if (!this.active) return;
        
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vy += 150 * dt; // гравитация
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
        ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
        ctx.restore();
    }
    
    reset() {
        this.active = false;
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.state = new GameState();
        this.audio = new AudioManager();
        
        // Пулы объектов
        this.interestPool = new ObjectPool(
            () => new Interest(),
            (i) => i.reset(),
            100
        );
        
        this.particlePool = new ObjectPool(
            () => new Particle(),
            (p) => p.reset(),
            100
        );
        
        this.interests = [];
        this.particles = [];
        
        // Очереди станков
        this.machine1Queue = [];
        this.machine2Queue = [];
        
        // Таймеры
        this.lastSpawnTime = 0;
        this.lastMachine1Process = 0;
        this.lastMachine2Process = 0;
        this.lastClickTime = 0;
        
        // UI элементы
        this.splashScreen = document.getElementById('splashScreen');
        this.gameScreen = document.getElementById('gameScreen');
        this.resultScreen = document.getElementById('resultScreen');
        this.startButton = document.getElementById('startButton');
        this.restartButton = document.getElementById('restartButton');
        this.upgradePanel = document.getElementById('upgradePanel');
        
        this.setupEventListeners();
        this.resizeCanvas();
    }
    
    setupEventListeners() {
        this.startButton.addEventListener('click', () => this.startGame());
        this.restartButton.addEventListener('click', () => this.restartGame());
        
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    startGame() {
        this.state.reset();
        this.interestPool.releaseAll();
        this.particlePool.releaseAll();
        this.interests = [];
        this.particles = [];
        this.machine1Queue = [];
        this.machine2Queue = [];
        
        this.state.isRunning = true;
        this.state.startTime = performance.now();
        this.lastSpawnTime = 0;
        this.lastMachine1Process = 0;
        this.lastMachine2Process = 0;
        
        this.splashScreen.classList.remove('screen-active');
        this.gameScreen.classList.add('screen-active');
        this.resultScreen.classList.remove('screen-active');
        
        this.buildUpgradePanel();
        this.gameLoop();
    }
    
    restartGame() {
        this.startGame();
    }
    
    handleCanvasClick(e) {
        if (!this.state.isRunning) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
        
        this.collectInterests(x, y);
    }
    
    handleTouchStart(e) {
        if (!this.state.isRunning) return;
        
        const rect = this.canvas.getBoundingClientRect();
        for (let touch of e.touches) {
            const x = (touch.clientX - rect.left) * (this.canvas.width / rect.width);
            const y = (touch.clientY - rect.top) * (this.canvas.height / rect.height);
            
            this.collectInterests(x, y);
        }
    }
    
    collectInterests(x, y) {
        const now = performance.now();
        const lastClickDelta = now - this.lastClickTime;
        this.lastClickTime = now;
        
        let collected = false;
        for (let interest of this.interests) {
            if (!interest.active || interest.inMachine) continue;
            
            const dx = interest.x - x;
            const dy = interest.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < interest.size + 20) {
                this.moveToMachine1(interest);
                collected = true;
                this.state.interests++;
                
                // Комбо бонус
                if (lastClickDelta < 300 && this.state.upgradeLevel['combo_boost_1'] > 0) {
                    this.createParticles(interest.x, interest.y, CONFIG.INTEREST_COLORS[interest.colorIndex], 8);
                }
            }
        }
        
        if (collected) {
            this.audio.playSound('click');
        }
    }
    
    moveToMachine1(interest) {
        if (this.machine1Queue.length < CONFIG.MACHINE_CAPACITY) {
            interest.inMachine = true;
            this.machine1Queue.push(interest);
        }
    }
    
    buildUpgradePanel() {
        this.upgradePanel.innerHTML = '';
        
        UPGRADES.forEach(upgrade => {
            const btn = document.createElement('button');
            btn.className = 'btn-upgrade';
            btn.textContent = `${upgrade.name}\n${this.getUpgradeCost(upgrade.id)}`;
            btn.addEventListener('click', () => this.buyUpgrade(upgrade.id));
            
            const level = this.state.upgradeLevel[upgrade.id];
            if (level >= upgrade.maxLevel) {
                btn.classList.add('disabled');
                btn.textContent = `${upgrade.name}\nМАКС`;
            }
            
            this.upgradePanel.appendChild(btn);
        });
    }
    
    getUpgradeCost(upgradeId) {
        const upgrade = UPGRADES.find(u => u.id === upgradeId);
        const level = this.state.upgradeLevel[upgradeId];
        const cost = Math.floor(upgrade.cost * Math.pow(CONFIG.UPGRADES_COST_MULTIPLIER, level));
        return formatNumber(cost);
    }
    
    buyUpgrade(upgradeId) {
        const upgrade = UPGRADES.find(u => u.id === upgradeId);
        const level = this.state.upgradeLevel[upgradeId];
        
        if (level >= upgrade.maxLevel) return;
        
        const cost = Math.floor(upgrade.cost * Math.pow(CONFIG.UPGRADES_COST_MULTIPLIER, level));
        
        if (this.state.coins >= cost) {
            this.state.coins -= cost;
            this.state.upgradeLevel[upgradeId]++;
            this.applyUpgrade(upgrade);
            this.audio.playSound('upgrade');
            this.buildUpgradePanel();
            this.updateUI();
        }
    }
    
    applyUpgrade(upgrade) {
        // Применение эффектов апгрейда
        // Будет использовано при спавне и обработке
    }
    
    getEffectiveSpawnInterval() {
        let interval = CONFIG.INTEREST_SPAWN_INTERVAL;
        const level = this.state.upgradeLevel['spawn_speed_1'] || 0;
        interval *= Math.pow(0.8, level);
        return interval;
    }
    
    getEffectiveSpawnCount() {
        let count = CONFIG.INTEREST_SPAWN_COUNT;
        count += this.state.upgradeLevel['spawn_count_1'] || 0;
        return count;
    }
    
    getEffectiveMachine1Time() {
        let time = CONFIG.MACHINE_1_PROCESS_TIME;
        const level = this.state.upgradeLevel['machine_speed_1'] || 0;
        time *= Math.pow(0.85, level);
        return time;
    }
    
    getEffectiveMachine2Time() {
        let time = CONFIG.MACHINE_2_PROCESS_TIME;
        const level = this.state.upgradeLevel['machine_speed_1'] || 0;
        time *= Math.pow(0.85, level);
        return time;
    }
    
    update(deltaTime) {
        if (!this.state.isRunning) return;
        
        const now = performance.now();
        this.state.elapsedTime = now - this.state.startTime;
        
        // Проверка конца сессии
        if (this.state.elapsedTime >= CONFIG.SESSION_DURATION_MS) {
            this.endGame();
            return;
        }
        
        // Спавн интересов
        if (this.lastSpawnTime - this.state.elapsedTime <= -this.getEffectiveSpawnInterval()) {
            this.spawnInterests();
            this.lastSpawnTime = this.state.elapsedTime;
        }
        
        // Обработка машины 1
        if (this.machine1Queue.length > 0) {
            if (this.lastMachine1Process - this.state.elapsedTime <= -this.getEffectiveMachine1Time()) {
                const interest = this.machine1Queue.shift();
                this.machine2Queue.push(interest);
                this.audio.playSound('machine');
                this.createParticles(this.canvas.width * 0.5, this.canvas.height * 0.35, CONFIG.INTEREST_COLORS[interest.colorIndex], 5);
                this.lastMachine1Process = this.state.elapsedTime;
            }
        }
        
        // Обработка машины 2
        if (this.machine2Queue.length > 0) {
            if (this.lastMachine2Process - this.state.elapsedTime <= -this.getEffectiveMachine2Time()) {
                const interest = this.machine2Queue.shift();
                this.completeDirection(interest);
                this.lastMachine2Process = this.state.elapsedTime;
            }
        }
        
        // Обновление частиц
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update(deltaTime);
            if (!this.particles[i].active) {
                this.particlePool.release(this.particles[i]);
                this.particles.splice(i, 1);
            }
        }
        
        this.updateUI();
    }
    
    spawnInterests() {
        const count = this.getEffectiveSpawnCount();
        for (let i = 0; i < count; i++) {
            const interest = this.interestPool.get();
            const colorIndex = randomInt(0, CONFIG.INTEREST_COLORS.length - 1);
            const x = random(40, this.canvas.width - 40);
            const y = CONFIG.TOP_BAR_HEIGHT + random(20, 150);
            interest.spawn(x, y, colorIndex);
            this.interests.push(interest);
        }
        
        this.audio.playSound('spawn');
    }
    
    completeDirection(interest) {
        this.interestPool.release(interest);
        this.interests = this.interests.filter(i => i !== interest);
        
        let coinsReward = CONFIG.BASE_COINS_REWARD;
        let pointsReward = CONFIG.BASE_PATH_POINTS_REWARD;
        
        const coinsLevel = this.state.upgradeLevel['coins_multiplier_1'] || 0;
        coinsReward *= Math.pow(1.25, coinsLevel);
        
        const pointsLevel = this.state.upgradeLevel['points_multiplier_1'] || 0;
        pointsReward *= Math.pow(1.3, pointsLevel);
        
        this.state.coins += Math.floor(coinsReward);
        this.state.pathPoints += Math.floor(pointsReward);
        this.state.directions++;
        
        this.createParticles(this.canvas.width * 0.5, this.canvas.height * 0.6, '#FFD700', 10);
        this.audio.playSound('complete');
    }
    
    createParticles(x, y, color, count) {
        if (this.particles.length >= CONFIG.PARTICLE_COUNT_MAX) return;
        
        for (let i = 0; i < count; i++) {
            const particle = this.particlePool.get();
            const angle = (Math.PI * 2 * i) / count;
            const speed = 150 + Math.random() * 200;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed - 100;
            particle.spawn(x, y, vx, vy, color);
            this.particles.push(particle);
        }
    }
    
    updateUI() {
        document.getElementById('pathPoints').textContent = formatNumber(this.state.pathPoints);
        document.getElementById('coins').textContent = formatNumber(this.state.coins);
        document.getElementById('timer').textContent = formatTime(CONFIG.SESSION_DURATION_MS - this.state.elapsedTime);
    }
    
    draw() {
        // Очистка канваса
        this.ctx.fillStyle = '#E8F4F8';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Линия между регионами
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, CONFIG.TOP_BAR_HEIGHT + 150);
        this.ctx.lineTo(this.canvas.width, CONFIG.TOP_BAR_HEIGHT + 150);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.canvas.height - CONFIG.UPGRADE_PANEL_HEIGHT);
        this.ctx.lineTo(this.canvas.width, this.canvas.height - CONFIG.UPGRADE_PANEL_HEIGHT);
        this.ctx.stroke();
        
        // Рисование станков
        this.drawMachines();
        
        // Рисование интересов
        for (let interest of this.interests) {
            if (interest.active) {
                this.ctx.fillStyle = CONFIG.INTEREST_COLORS[interest.colorIndex];
                this.ctx.fillRect(
                    interest.x - interest.size / 2,
                    interest.y - interest.size / 2,
                    interest.size,
                    interest.size
                );
                
                // Обводка
                this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(
                    interest.x - interest.size / 2,
                    interest.y - interest.size / 2,
                    interest.size,
                    interest.size
                );
            }
        }
        
        // Рисование Квадратикуса
        this.drawQuadratikus();
        
        // Рисование частиц
        for (let particle of this.particles) {
            particle.draw(this.ctx);
        }
    }
    
    drawMachines() {
        const machine1X = this.canvas.width * 0.25 - 75;
        const machine1Y = this.canvas.height * 0.4 - 40;
        const machineW = 150;
        const machineH = 80;
        
        // Машина 1 - Мастерская навыков
        this.ctx.fillStyle = '#FFE66D';
        this.ctx.fillRect(machine1X, machine1Y, machineW, machineH);
        this.ctx.strokeStyle = '#FFC300';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(machine1X, machine1Y, machineW, machineH);
        
        this.ctx.fillStyle = '#333';
        this.ctx.font = 'bold 12px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Мастерская', machine1X + machineW / 2, machine1Y + 20);
        this.ctx.fillText(`Очередь: ${this.machine1Queue.length}`, machine1X + machineW / 2, machine1Y + 50);
        
        // Машина 2 - Комбинатор направлений
        const machine2X = this.canvas.width * 0.75 - 75;
        const machine2Y = this.canvas.height * 0.4 - 40;
        
        this.ctx.fillStyle = '#FF6B9D';
        this.ctx.fillRect(machine2X, machine2Y, machineW, machineH);
        this.ctx.strokeStyle = '#FF4477';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(machine2X, machine2Y, machineW, machineH);
        
        this.ctx.fillStyle = '#333';
        this.ctx.fillText('Комбинатор', machine2X + machineW / 2, machine2Y + 20);
        this.ctx.fillText(`Очередь: ${this.machine2Queue.length}`, machine2X + machineW / 2, machine2Y + 50);
    }
    
    drawQuadratikus() {
        const x = this.canvas.width / 2;
        const y = this.canvas.height * 0.65;
        const size = CONFIG.QUADRATIKUS_SIZE;
        
        // Тело
        this.ctx.fillStyle = '#667eea';
        this.ctx.fillRect(x - size / 2, y - size / 2, size, size);
        
        // Обводка
        this.ctx.strokeStyle = '#4c51bf';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x - size / 2, y - size / 2, size, size);
        
        // Глаза
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(x - 12, y - 8, 8, 8);
        this.ctx.fillRect(x + 4, y - 8, 8, 8);
        
        // Зрачки
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(x - 10, y - 6, 4, 4);
        this.ctx.fillRect(x + 6, y - 6, 4, 4);
        
        // Улыбка
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(x, y + 5, 8, 0, Math.PI);
        this.ctx.stroke();
    }
    
    endGame() {
        this.state.isRunning = false;
        this.gameScreen.classList.remove('screen-active');
        this.resultScreen.classList.add('screen-active');
        
        document.getElementById('finalPathPoints').textContent = formatNumber(this.state.pathPoints);
        document.getElementById('finalInterests').textContent = formatNumber(this.state.interests);
        document.getElementById('finalCoins').textContent = formatNumber(this.state.coins);
        document.getElementById('quadratikusMessage').textContent = randomChoice(QUADRATIKUS_MESSAGES);
    }
    
    gameLoop = () => {
        const now = performance.now();
        const deltaTime = (now - (this.lastFrameTime || now)) / 1000;
        this.lastFrameTime = now;
        
        this.update(deltaTime);
        this.draw();
        
        if (this.state.isRunning) {
            requestAnimationFrame(this.gameLoop);
        }
    }
}

// Инициализация игры при загрузке страницы
window.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
});
