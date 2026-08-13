// ========================================
// КОНФИГУРАЦИЯ ИГРЫ - Квадратикус: Пекарня Пути
// ========================================

const CONFIG = {
    // Время и сессия
    SESSION_DURATION_MS: 15 * 60 * 1000, // 15 минут
    
    // 2.5D Изометрия
    ISOMETRIC_ANGLE: Math.PI / 6, // 30 градусов
    TILE_SIZE: 40,
    
    // Квадратикус
    QUADRATIKUS_SIZE: 50,
    QUADRATIKUS_ANIMATION_SPEED: 1.5,
    
    // Ферма - параметры
    FARM_COLS: 6,
    FARM_ROWS: 4,
    WHEAT_GROWTH_STAGES: 4, // Стадии роста пшеницы
    WHEAT_GROWTH_TIME: 8000, // 8 сек до созревания
    WHEAT_HARVEST_VALUE: 5,
    TRACTOR_SPEED: 1.5,
    WORKER_SPEED: 1,
    
    // Пекарня
    BAKERY_MACHINES: 1, // Начальное кол-во печей
    MILLING_TIME: 3000, // Размол пшеницы
    DOUGH_TIME: 2500, // Замес теста
    BAKING_TIME: 4000, // Выпечка
    BREAD_VALUE: 25,
    
    // Магазин
    SHOP_CUSTOMER_INTERVAL: 2500, // Интервал появления клиентов
    CUSTOMER_BUY_TIME: 1500, // Время покупки
    BREAD_SELL_PRICE: 100,
    QUEUE_MAX: 8,
    
    // Экономика
    STARTING_MONEY: 200,
    
    // Частицы
    PARTICLE_LIFETIME: 1000,
    PARTICLE_COUNT_MAX: 80,
    
    // UI
    TOP_BAR_HEIGHT: 70,
    ROOM_TABS_HEIGHT: 80,
    
    // Цвета
    WHEAT_COLOR: '#D4AF37',
    FLOUR_COLOR: '#F5DEB3',
    DOUGH_COLOR: '#D2A679',
    BREAD_COLOR: '#8B4513',
    CUSTOMER_COLOR: '#6BCB77',
};

// Типы улучшений
const UPGRADE_TYPES = {
    // Ферма
    FARM_EXPAND: 'farm_expand',
    TRACTOR: 'tractor',
    WORKER: 'worker',
    GROWTH_SPEED: 'growth_speed',
    AUTO_HARVEST: 'auto_harvest',
    
    // Пекарня
    BAKERY_MACHINE: 'bakery_machine',
    BAKING_SPEED: 'baking_speed',
    BAKER: 'baker',
    CONVEYOR: 'conveyor',
    
    // Магазин
    SHOP_CASHIER: 'shop_cashier',
    SHOP_UPGRADE: 'shop_upgrade',
    ADVERTISING: 'advertising',
    AUTO_SELL: 'auto_sell',
};

// Список улучшений с ценами и эффектами
const UPGRADES = [
    // === Ф��РМА ===
    {
        id: 'farm_expand',
        type: UPGRADE_TYPES.FARM_EXPAND,
        name: '🌾 Расширить поле',
        description: '+2 грядки',
        cost: 150,
        room: 'farm',
        icon: '🌾',
        maxLevel: 3,
    },
    {
        id: 'tractor',
        type: UPGRADE_TYPES.TRACTOR,
        name: '🚜 Второй трактор',
        description: 'Автосбор',
        cost: 200,
        room: 'farm',
        icon: '🚜',
        maxLevel: 2,
    },
    {
        id: 'farm_worker',
        type: UPGRADE_TYPES.WORKER,
        name: '👷 Рабочий',
        description: '+1 сборщик',
        cost: 100,
        room: 'farm',
        icon: '👷',
        maxLevel: 4,
    },
    {
        id: 'growth_speed',
        type: UPGRADE_TYPES.GROWTH_SPEED,
        name: '⚡ Ускорить рост',
        description: '-30% время',
        cost: 120,
        room: 'farm',
        icon: '⚡',
        maxLevel: 5,
    },
    
    // === ПЕКАРНЯ ===
    {
        id: 'bakery_machine',
        type: UPGRADE_TYPES.BAKERY_MACHINE,
        name: '🔥 Новая печь',
        description: '+1 печь',
        cost: 250,
        room: 'bakery',
        icon: '🔥',
        maxLevel: 3,
    },
    {
        id: 'baking_speed',
        type: UPGRADE_TYPES.BAKING_SPEED,
        name: '⏱ Ускорить печь',
        description: '-25% время',
        cost: 150,
        room: 'bakery',
        icon: '⏱',
        maxLevel: 5,
    },
    {
        id: 'bakery_worker',
        type: UPGRADE_TYPES.BAKER,
        name: '👨‍🍳 Пекарь',
        description: '+1 работник',
        cost: 120,
        room: 'bakery',
        icon: '👨‍🍳',
        maxLevel: 4,
    },
    
    // === МАГАЗИН ===
    {
        id: 'shop_cashier',
        type: UPGRADE_TYPES.SHOP_CASHIER,
        name: '💳 Вторая касса',
        description: '+1 касса',
        cost: 200,
        room: 'shop',
        icon: '💳',
        maxLevel: 2,
    },
    {
        id: 'advertising',
        type: UPGRADE_TYPES.ADVERTISING,
        name: '📢 Реклама',
        description: '+50% клиентов',
        cost: 250,
        room: 'shop',
        icon: '📢',
        maxLevel: 3,
    },
    {
        id: 'shop_upgrade',
        type: UPGRADE_TYPES.SHOP_UPGRADE,
        name: '✨ Улучшить витрину',
        description: '+30% цена',
        cost: 180,
        room: 'shop',
        icon: '✨',
        maxLevel: 4,
    },
];

// Сообщения Квадратикуса
const QUADRATIKUS_MESSAGES = [
    '🎉 Какая восхитительная пекарня получилась!',
    '😋 Хлеб пахнет божественно! Я горжусь!',
    '💰 Деньги текут рекой! Отлично работали!',
    '🌟 Мы стали лучшей пекарней в городе!',
    '👏 Спасибо за помощь! Без тебя не получилось бы!',
    '🚀 Готов к новым вершинам успеха!',
    '🏆 Это был волшебный день! Спасибо!',
    '✨ Мечта сбылась! Наша пекарня - лучшая!',
];
