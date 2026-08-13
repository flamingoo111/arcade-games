// ========================================
// ОСНОВНОЙ ИГРОВОЙ КОД - Пекарня Пути
// ========================================

// === СОСТОЯНИЕ ИГРЫ ===
class GameState {
    constructor() {
        this.money = CONFIG.STARTING_MONEY;
        this.isRunning = false;
        this.startTime = 0;
        this.elapsedTime = 0;
        
        this.currentRoom = 'farm'; // farm, bakery, shop
        this.upgradeLevel = {};
        
        UPGRADES.forEach(u => {
            this.upgradeLevel[u.id] = 0;
        });
    }
    
    reset() {
        this.money = CONFIG.STARTING_MONEY;
        this.isRunning = false;
        this.startTime = 0;
        this.elapsedTime = 0;
        this.currentRoom = 'farm';
        this.upgradeLevel = {};
        UPGRADES.forEach(u => {
            this.upgradeLevel[u.id] = 0;
        });
    }
}

// === ФЕРМА ===
class Wheat {
    constructor(gridX, gridY) {
        this.gridX = gridX;
        this.gridY = gridY;
        this.stage = 0; // 0-3
        this.growthTime = 0;
        this.ready = false;
    }
    
    update(dt, gameState) {
        if (this.ready) return;
        
        const growthSpeedLevel = gameState.upgradeLevel['growth_speed'] || 0;
        const speedMultiplier = Math.pow(0.7, growthSpeedLevel);
        
        this.growthTime += dt * 1000;
        const timePerStage = CONFIG.WHEAT_GROWTH_TIME / CONFIG.WHEAT_GROWTH_STAGES * speedMultiplier;
        this.stage = Math.min(
            CONFIG.WHEAT_GROWTH_STAGES - 1,
            Math.floor(this.growthTime / timePerStage)
        );
        
        if (this.growthTime >= CONFIG.WHEAT_GROWTH_TIME * speedMultiplier) {
            this.ready = true;
            this.stage = CONFIG.WHEAT_GROWTH_STAGES - 1;
        }
    }
    
    draw(ctx, screenX, screenY, tileSize) {
        const stages = ['🌱', '🌿', '🌾', '🌾'];
        ctx.font = 'bold 40px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(stages[this.stage], screenX, screenY);
    }
}

class Farm {
    constructor() {
        this.grid = [];
        this.workers = [];
        this.tractors = [];
        this.lastAutoHarvestTime = 0;
        
        this.initGrid();
    }
    
    initGrid() {
        this.grid = [];
        for (let y = 0; y < CONFIG.FARM_ROWS; y++) {
            for (let x = 0; x < CONFIG.FARM_COLS; x++) {
                this.grid.push(new Wheat(x, y));
            }
        }
    }
    
    expandGrid() {
        CONFIG.FARM_COLS += 2;
        this.initGrid();
    }
    
    update(dt, gameState) {
        this.grid.forEach(wheat => wheat.update(dt, gameState));
        
        // Автосбор
        if (gameState.upgradeLevel['auto_harvest'] > 0) {
            this.lastAutoHarvestTime += dt * 1000;
            if (this.lastAutoHarvestTime >= 2000) {
                this.grid.forEach(wheat => {
                    if (wheat.ready) {
                        wheat.ready = false;
                        wheat.growthTime = 0;
                        wheat.stage = 0;
                        gameState.money += CONFIG.WHEAT_HARVEST_VALUE;
                    }
                });
                this.lastAutoHarvestTime = 0;
            }
        }
    }
    
    harvest(gridX, gridY) {
        const wheat = this.grid.find(w => w.gridX === gridX && w.gridY === gridY);
        if (wheat && wheat.ready) {
            wheat.ready = false;
            wheat.growthTime = 0;
            wheat.stage = 0;
            return CONFIG.WHEAT_HARVEST_VALUE;
        }
        return 0;
    }
    
    draw(ctx, canvasWidth, canvasHeight, gameState) {
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;
        const tileSize = CONFIG.TILE_SIZE;
        
        ctx.fillStyle = '#8B7355';
        ctx.fillRect(0, 100, canvasWidth, canvasHeight - 200);
        
        this.grid.forEach(wheat => {
            const iso = IsometricUtils.worldToScreen(wheat.gridX, wheat.gridY);
            const screenX = centerX + iso.x;
            const screenY = centerY + iso.y;
            
            // Сетка
            ctx.strokeStyle = 'rgba(0,0,0,0.1)';
            ctx.lineWidth = 1;
            ctx.strokeRect(screenX - tileSize/2, screenY - tileSize/2, tileSize, tileSize);
            
            // Пшеница
            wheat.draw(ctx, screenX, screenY, tileSize);
        });
    }
}

// === ПЕКАРНЯ ===
class Oven {
    constructor(id) {
        this.id = id;
        this.queue = [];
        this.baking = null;
        this.bakingTime = 0;
    }
    
    addFlour(amount) {
        this.queue.push(amount);
    }
    
    update(dt, gameState) {
        if (this.baking !== null) {
            const bakingSpeedLevel = gameState.upgradeLevel['baking_speed'] || 0;
            const speedMultiplier = Math.pow(0.75, bakingSpeedLevel);
            this.bakingTime += dt * 1000;
            
            if (this.bakingTime >= CONFIG.BAKING_TIME * speedMultiplier) {
                this.baking = null;
                this.bakingTime = 0;
                return CONFIG.BREAD_VALUE;
            }
        } else if (this.queue.length > 0) {
            this.baking = this.queue.shift();
            this.bakingTime = 0;
        }
        return 0;
    }
    
    getProgress() {
        if (this.baking === null) return 0;
        const speedLevel = gameState?.upgradeLevel['baking_speed'] || 0;
        const speedMult = Math.pow(0.75, speedLevel);
        return Math.min(1, this.bakingTime / (CONFIG.BAKING_TIME * speedMult));
    }
}

class Bakery {
    constructor() {
        this.ovens = [new Oven(0)];
        this.flourStorage = 0;
        this.breadStorage = 0;
        this.lastMillingTime = 0;
    }
    
    addOven() {
        this.ovens.push(new Oven(this.ovens.length));
    }
    
    millWheat(amount) {
        this.flourStorage += amount;
    }
    
    update(dt, gameState) {
        let breadProduced = 0;
        
        // Мельница
        this.lastMillingTime += dt * 1000;
        if (this.lastMillingTime >= CONFIG.MILLING_TIME && this.flourStorage > 0) {
            this.flourStorage--;
            this.lastMillingTime = 0;
        }
        
        // Печи
        this.ovens.forEach(oven => {
            if (this.flourStorage > 0 && oven.baking === null && oven.queue.length === 0) {
                oven.addFlour(this.flourStorage);
                this.flourStorage--;
            }
            const bread = oven.update(dt, gameState);
            if (bread > 0) {
                this.breadStorage += bread;
                breadProduced += bread;
            }
        });
        
        return breadProduced;
    }
    
    draw(ctx, canvasWidth, canvasHeight) {
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;
        
        ctx.fillStyle = '#E8D7C3';
        ctx.fillRect(0, 100, canvasWidth, canvasHeight - 200);
        
        const ovenW = 100;
        const ovenH = 80;
        const spacing = 150;
        
        this.ovens.forEach((oven, idx) => {
            const x = centerX - (this.ovens.length - 1) * spacing / 2 + idx * spacing;
            const y = centerY;
            
            ctx.fillStyle = '#D2691E';
            ctx.fillRect(x - ovenW/2, y - ovenH/2, ovenW, ovenH);
            
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 3;
            ctx.strokeRect(x - ovenW/2, y - ovenH/2, ovenW, ovenH);
            
            // Индикатор выпечки
            if (oven.baking !== null) {
                const progress = oven.getProgress();
                ctx.fillStyle = '#FFD700';
                ctx.fillRect(
                    x - ovenW/2 + 5,
                    y + ovenH/2 - 15,
                    (ovenW - 10) * progress,
                    10
                );
            }
        });
        
        // Хранилище хлеба
        ctx.font = 'bold 14px sans-serif';
        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        ctx.fillText(`🍞 Хлеба: ${this.breadStorage}`, centerX, 150);
    }
}

// === МАГАЗИН ===
class Customer {
    constructor(x) {
        this.x = x;
        this.buyTime = CONFIG.CUSTOMER_BUY_TIME;
        this.progress = 0;
    }
    
    update(dt) {
        this.progress += dt * 1000;
        return this.progress >= this.buyTime;
    }
    
    draw(ctx, y) {
        ctx.font = '30px serif';
        ctx.textAlign = 'center';
        ctx.fillText('😊', this.x, y);
    }
}

class Shop {
    constructor() {
        this.queue = [];
        this.tills = 1;
        this.lastCustomerTime = 0;
        this.totalSells = 0;
        this.income = 0;
    }
    
    addTill() {
        this.tills++;
    }
    
    spawnCustomer(gameState) {
        const advertisingLevel = gameState.upgradeLevel['advertising'] || 0;
        const customerMultiplier = Math.pow(1.5, advertisingLevel);
        const interval = CONFIG.SHOP_CUSTOMER_INTERVAL / customerMultiplier;
        
        this.lastCustomerTime += (Math.random() * 2000);
        if (this.lastCustomerTime >= interval && this.queue.length < CONFIG.QUEUE_MAX) {
            this.queue.push(new Customer(100 + this.queue.length * 40));
            this.lastCustomerTime = 0;
        }
    }
    
    update(dt, gameState, bakeryBreadStorage) {
        this.spawnCustomer(gameState);
        
        // Кассиры обслуживают
        let servedCount = Math.min(this.queue.length, this.tills);
        for (let i = 0; i < servedCount; i++) {
            const customer = this.queue[i];
            if (customer.update(dt)) {
                this.queue.splice(i, 1);
                
                if (bakeryBreadStorage > 0) {
                    const priceLevel = gameState.upgradeLevel['shop_upgrade'] || 0;
                    const priceMultiplier = Math.pow(1.3, priceLevel);
                    const price = CONFIG.BREAD_SELL_PRICE * priceMultiplier;
                    
                    this.income += price;
                    this.totalSells++;
                    return { sold: true, price: price };
                }
            }
        }
        return { sold: false, price: 0 };
    }
    
    draw(ctx, canvasWidth, canvasHeight, bakeryBreadStorage) {
        ctx.fillStyle = '#FFF8DC';
        ctx.fillRect(0, 100, canvasWidth, canvasHeight - 200);
        
        ctx.font = 'bold 18px sans-serif';
        ctx.fillStyle = '#000';
        ctx.textAlign = 'left';
        ctx.fillText(`🍞 На витрине: ${bakeryBreadStorage}`, 30, 150);
        ctx.fillText(`👥 В очереди: ${this.queue.length}`, 30, 180);
        
        // Рисуем кассиры
        const centerY = canvasHeight / 2;
        for (let i = 0; i < this.tills; i++) {
            const x = 100 + i * 150;
            ctx.fillStyle = '#FFB6C1';
            ctx.fillRect(x - 40, centerY - 60, 80, 120);
            ctx.strokeStyle = '#FF69B4';
            ctx.lineWidth = 2;
            ctx.strokeRect(x - 40, centerY - 60, 80, 120);
            ctx.font = '24px serif';
            ctx.textAlign = 'center';
            ctx.fillText('💳', x, centerY);
        }
        
        // Рисуем очередь
        this.queue.forEach((customer, idx) => {
            customer.draw(ctx, canvasHeight / 2 + 50);
        });
    }
}

// === ГЛАВНАЯ ИГРА ===
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.state = new GameState();
        this.audio = new AudioManager();
        
        this.farm = new Farm();
        this.bakery = new Bakery();
        this.shop = new Shop();
        
        this.particles = [];
        this.particlePool = new ObjectPool(
            () => new Particle(),
            (p) => p.reset(),
            100
        );
        
        this.setupUI();
        this.setupEventListeners();
        this.resizeCanvas();
    }
    
    setupUI() {
        this.startBtn = document.getElementById('startButton');
        this.restartBtn = document.getElementById('restartButton');
        this.gameScreen = document.getElementById('gameScreen');
        this.resultScreen = document.getElementById('resultScreen');
        this.splashScreen = document.getElementById('splashScreen');
        this.moneyDisplay = document.getElementById('money-value');
        this.timerDisplay = document.getElementById('timer-value');
        this.roomTabs = document.querySelectorAll('.room-tab');
    }
    
    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.startGame());
        this.restartBtn.addEventListener('click', () => this.startGame());
        
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        
        this.roomTabs.forEach((tab, idx) => {
            tab.addEventListener('click', () => this.switchRoom(['farm', 'bakery', 'shop'][idx]));
        });
        
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight - CONFIG.TOP_BAR_HEIGHT - CONFIG.ROOM_TABS_HEIGHT;
    }
    
    startGame() {
        this.state.reset();
        this.farm = new Farm();
        this.bakery = new Bakery();
        this.shop = new Shop();
        this.particles = [];
        this.particlePool.releaseAll();
        
        this.state.isRunning = true;
        this.state.startTime = performance.now();
        
        this.splashScreen.classList.remove('screen-active');
        this.gameScreen.classList.add('screen-active');
        this.resultScreen.classList.remove('screen-active');
        
        this.gameLoop();
    }
    
    switchRoom(room) {
        this.state.currentRoom = room;
        this.roomTabs.forEach(tab => tab.classList.remove('active'));
        const roomOrder = ['farm', 'bakery', 'shop'];
        this.roomTabs[roomOrder.indexOf(room)].classList.add('active');
    }
    
    handleCanvasClick(e) {
        if (!this.state.isRunning) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
        
        if (this.state.currentRoom === 'farm') {
            this.handleFarmClick(x, y);
        }
    }
    
    handleTouchStart(e) {
        if (!this.state.isRunning) return;
        const rect = this.canvas.getBoundingClientRect();
        for (let touch of e.touches) {
            const x = (touch.clientX - rect.left) * (this.canvas.width / rect.width);
            const y = (touch.clientY - rect.top) * (this.canvas.height / rect.height);
            if (this.state.currentRoom === 'farm') {
                this.handleFarmClick(x, y);
            }
        }
    }
    
    handleFarmClick(x, y) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const tileSize = CONFIG.TILE_SIZE;
        
        this.farm.grid.forEach(wheat => {
            const iso = IsometricUtils.worldToScreen(wheat.gridX, wheat.gridY);
            const screenX = centerX + iso.x;
            const screenY = centerY + iso.y;
            
            if (Math.abs(x - screenX) < tileSize && Math.abs(y - screenY) < tileSize && wheat.ready) {
                const harvest = this.farm.harvest(wheat.gridX, wheat.gridY);
                if (harvest > 0) {
                    this.bakery.millWheat(harvest);
                    this.createParticles(screenX, screenY, CONFIG.WHEAT_COLOR, 5);
                    this.audio.playSound('harvest');
                }
            }
        });
    }
    
    update(deltaTime) {
        if (!this.state.isRunning) return;
        
        const now = performance.now();
        this.state.elapsedTime = now - this.state.startTime;
        
        if (this.state.elapsedTime >= CONFIG.SESSION_DURATION_MS) {
            this.endGame();
            return;
        }
        
        // Обновления комнат
        this.farm.update(deltaTime, this.state);
        const breadProduced = this.bakery.update(deltaTime, this.state);
        const sellResult = this.shop.update(deltaTime, this.state, this.bakery.breadStorage);
        
        if (sellResult.sold) {
            this.state.money += sellResult.price;
            this.bakery.breadStorage--;
            this.createParticles(this.canvas.width - 100, 200, '#FFD700', 8);
        }
        
        // Частицы
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update(deltaTime);
            if (!this.particles[i].active) {
                this.particlePool.release(this.particles[i]);
                this.particles.splice(i, 1);
            }
        }
        
        this.updateUI();
    }
    
    createParticles(x, y, color, count) {
        if (this.particles.length >= CONFIG.PARTICLE_COUNT_MAX) return;
        
        for (let i = 0; i < count; i++) {
            const particle = this.particlePool.get();
            const angle = (Math.PI * 2 * i) / count;
            const speed = 100 + Math.random() * 200;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed - 100;
            particle.spawn(x, y, vx, vy, color);
            this.particles.push(particle);
        }
    }
    
    updateUI() {
        this.moneyDisplay.textContent = formatNumber(this.state.money);
        const remaining = CONFIG.SESSION_DURATION_MS - this.state.elapsedTime;
        this.timerDisplay.textContent = formatTime(remaining);
    }
    
    draw() {
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        // Фон
        this.ctx.fillStyle = '#F5F5F5';
        this.ctx.fillRect(0, 0, w, h);
        
        // Рисуем комнату
        switch (this.state.currentRoom) {
            case 'farm':
                this.farm.draw(this.ctx, w, h, this.state);
                break;
            case 'bakery':
                this.bakery.draw(this.ctx, w, h);
                break;
            case 'shop':
                this.shop.draw(this.ctx, w, h, this.bakery.breadStorage);
                break;
        }
        
        // Рисуем Квадратикуса
        this.drawQuadratikus();
        
        // Частицы
        this.particles.forEach(p => p.draw(this.ctx));
    }
    
    drawQuadratikus() {
        const x = this.canvas.width / 2;
        const y = this.canvas.height - 100;
        const size = CONFIG.QUADRATIKUS_SIZE;
        
        this.ctx.fillStyle = '#667eea';
        this.ctx.fillRect(x - size/2, y - size/2, size, size);
        
        this.ctx.strokeStyle = '#4c51bf';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x - size/2, y - size/2, size, size);
        
        // Глаза
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(x - 12, y - 8, 8, 8);
        this.ctx.fillRect(x + 4, y - 8, 8, 8);
        
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
        
        document.getElementById('finalMoney').textContent = formatNumber(this.state.money);
        document.getElementById('finalBread').textContent = formatNumber(this.bakery.breadStorage + this.shop.income / CONFIG.BREAD_SELL_PRICE);
        document.getElementById('finalSells').textContent = formatNumber(this.shop.totalSells);
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

// Инициализация
window.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
});
