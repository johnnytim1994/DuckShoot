import { resources } from 'cc';

// ─── 枚举 ────────────────────────────────────────────

/** 敌人类型 */
export enum EnemyType {
    Chaser = 0,   // 追击者：速度快
    Shield = 1,   // 肉盾：血量高
    Regen  = 2,   // 回复者：持续回血
    Swarm  = 3,   // 群涌者：体积小数量多
}

/** 攻击模式 */
export enum AttackMode {
    NEAREST_ENEMY   = 0,   // 自动瞄准最近敌人
    MOUSE_DIRECTION = 1,   // 向鼠标方向射击（>1 个敌人时选择鼠标方向最近的目标）
}

// ─── 类型修正系数 ────────────────────────────────────

/** 敌人类型修正系数（倍数，基于基础值） */
export const ENEMY_TYPE_MODIFIERS: Record<EnemyType, { speed: number; hp: number; size: number; regenPerSec?: number }> = {
    [EnemyType.Chaser]: { speed: 1.5, hp: 1.0, size: 1.0 },
    [EnemyType.Shield]: { speed: 0.7, hp: 2.0, size: 1.2 },
    [EnemyType.Regen]:  { speed: 1.0, hp: 1.0, size: 1.0, regenPerSec: 0.5 },
    [EnemyType.Swarm]:  { speed: 1.2, hp: 0.5, size: 0.6 },
};

// ─── 配置接口 ────────────────────────────────────────

/** 鸭子配置 */
export interface DuckConfig {
    moveSpeed: number;
    boundaryOffset: number;
    enableFollow: boolean;
    size: number;
}

/** 敌人配置 */
export interface EnemyConfig {
    baseSpeed: number;
    baseHp: number;
    baseSize: number;
    spawnInterval: number;
    minSpawnInterval: number;
    spawnAcceleration: number;
    waveInterval: number;
    speedScalePerWave: number;
    hpScalePerWave: number;
    sizeScalePerWave: number;
}

/** 攻击配置 */
export interface AttackConfig {
    fireRate: number;
    bulletSpeed: number;
    bulletSize: number;
    bulletDamage: number;
    attackRange: number;
    attackMode: AttackMode;
}

/** 游戏总配置 */
export interface GameConfig {
    duck: DuckConfig;
    enemy: EnemyConfig;
    attack: AttackConfig;
}

/** 默认游戏配置 */
const DEFAULT_CONFIG: GameConfig = {
    duck: {
        moveSpeed: 6.0,
        boundaryOffset: 50,
        enableFollow: true,
        size: 120,          // ← 从 80 调大到 120，视觉更可见
    },
    enemy: {
        baseSpeed: 80,
        baseHp: 1,
        baseSize: 40,
        spawnInterval: 2.0,
        minSpawnInterval: 0.5,
        spawnAcceleration: 0.95,
        waveInterval: 30,
        speedScalePerWave: 1.1,
        hpScalePerWave: 1.2,
        sizeScalePerWave: 1.05,
    },
    attack: {
        fireRate: 2.0,
        bulletSpeed: 300,
        bulletSize: 20,
        bulletDamage: 1,
        attackRange: 500,
        attackMode: AttackMode.NEAREST_ENEMY,
    },
};

// ─── 便捷常量导出（脚本可直接 import，无需 await） ────

export const DUCK_CONFIG = DEFAULT_CONFIG.duck;
export const ENEMY_CONFIG = DEFAULT_CONFIG.enemy;
export const BULLET_CONFIG = DEFAULT_CONFIG.attack;

/**
 * 加载游戏配置
 * 优先从 resources 目录加载 gameConfig.json，失败则使用默认配置
 */
export async function loadGameConfig(): Promise<GameConfig> {
    return new Promise((resolve) => {
        resources.load('config/gameConfig', (err: Error | null, jsonAsset: any) => {
            if (!err && jsonAsset && jsonAsset.json) {
                const merged = deepMerge(DEFAULT_CONFIG, jsonAsset.json);
                resolve(merged);
            } else {
                resolve(DEFAULT_CONFIG);
            }
        });
    });
}

/** 深度合并配置（用户配置覆盖默认配置） */
function deepMerge<T extends Record<string, any>>(defaultObj: T, override: Partial<T>): T {
    const result = { ...defaultObj } as any;
    for (const key in override) {
        if (override[key] !== undefined) {
            if (typeof override[key] === 'object' && !Array.isArray(override[key])) {
                result[key] = deepMerge(result[key] || {}, override[key] as any);
            } else {
                result[key] = override[key];
            }
        }
    }
    return result;
}