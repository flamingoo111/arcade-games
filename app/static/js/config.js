// ========================================
// КОНФИГУРАЦИЯ ИГРЫ
// ========================================

const CONFIG = {
    // Время игры
    SESSION_DURATION_MS: 15 * 60 * 1000, // 15 минут
    
    // Интересы (квадратики)
    INTEREST_SPAWN_INTERVAL: 1500, // Интервал спавна (мс)
    INTEREST_SIZE: 30,
    INTEREST_SPAWN_COUNT: 1, // Количество за раз
    INTEREST_COLORS: [
        '#FFD93D', // Жёлтый - Любопытство
        '#6BCB77', // Зелёный - Забота
        '#FF6B9D', // Розовый - Творчество
        '#4D96FF', // Синий - Логика
        '#FF8C42', // Оранжевый - Руки
        '#9D84B7'  // Фиолетовый - Идеи
    ],
    INTEREST_NAMES: ['Любопытство', 'Забота', 'Творчество', 'Логика', 'Руки', 'Идеи'],
    
    // Станки
    MACHINE_1_PROCESS_TIME: 2000, // Мастерская навыков (мс)
    MACHINE_2_PROCESS_TIME: 2500, // Комбинатор направлений (мс)
    MACHINE_CAPACITY: 10, // Макс кол-во в очереди
    
    // Экономика
    BASE_COINS_REWARD: 10,
    BASE_PATH_POINTS_REWARD: 50,
    
    // Апгрейды
    UPGRADES_INITIAL_COST: 50,
    UPGRADES_COST_MULTIPLIER: 1.15,
    
    // Canvas
    QUADRATIKUS_SIZE: 60,
    PARTICLE_LIFETIME: 800,
    PARTICLE_COUNT_MAX: 30,
    
    // Прогрессия времени
    PROGRESSION_STAGES: [
        { time: 0, label: 'Начало', interestSpawnInterval: 1500, machine1Time: 2000, machine2Time: 2500 },
        { time: 120000, label: 'Ускорение', interestSpawnInterval: 1200, machine1Time: 1800, machine2Time: 2200 },
        { time: 300000, label: 'Разгон', interestSpawnInterval: 900, machine1Time: 1500, machine2Time: 2000 },
        { time: 540000, label: 'Ураган', interestSpawnInterval: 600, machine1Time: 1000, machine2Time: 1500 },
    ],
    
    // UI
    TOP_BAR_HEIGHT: 60,
    UPGRADE_PANEL_HEIGHT: 80,
};

// Типы апгрейдов
const UPGRADE_TYPES = {
    SPAWN_SPEED: 'spawn_speed',
    SPAWN_COUNT: 'spawn_count',
    MACHINE_SPEED: 'machine_speed',
    AUTO_COLLECT: 'auto_collect',
    COINS_MULTIPLIER: 'coins_multiplier',
    POINTS_MULTIPLIER: 'points_multiplier',
    NEW_COLOR: 'new_color',
    MACHINE_CAPACITY: 'machine_capacity',
    COMBO_BOOST: 'combo_boost',
};

// Система апгрейдов
const UPGRADES = [
    {
        id: 'spawn_speed_1',
        type: UPGRADE_TYPES.SPAWN_SPEED,
        name: '⚡ Быстрее собир��ть',
        description: '-20% время появления',
        cost: 50,
        effect: { multiplier: 0.8 },
        maxLevel: 5,
    },
    {
        id: 'spawn_count_1',
        type: UPGRADE_TYPES.SPAWN_COUNT,
        name: '➕ Больше интересов',
        description: '+1 интерес за раз',
        cost: 80,
        effect: { add: 1 },
        maxLevel: 4,
    },
    {
        id: 'machine_speed_1',
        type: UPGRADE_TYPES.MACHINE_SPEED,
        name: '🏭 Ускорить станки',
        description: '-15% время обработки',
        cost: 100,
        effect: { multiplier: 0.85 },
        maxLevel: 4,
    },
    {
        id: 'coins_multiplier_1',
        type: UPGRADE_TYPES.COINS_MULTIPLIER,
        name: '💰 Больше монет',
        description: '+25% вознаграждение',
        cost: 150,
        effect: { multiplier: 1.25 },
        maxLevel: 5,
    },
    {
        id: 'points_multiplier_1',
        type: UPGRADE_TYPES.POINTS_MULTIPLIER,
        name: '🎯 Больше очков',
        description: '+30% очков пути',
        cost: 150,
        effect: { multiplier: 1.3 },
        maxLevel: 5,
    },
    {
        id: 'combo_boost_1',
        type: UPGRADE_TYPES.COMBO_BOOST,
        name: '🔥 Комбо бонус',
        description: 'Быстрый клик = +100%',
        cost: 200,
        effect: { enabled: true },
        maxLevel: 1,
    },
];
