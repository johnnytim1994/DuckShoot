/**
 * 敌人生成器：波次系统，从屏幕四边随机生成敌人
 * 每波递增难度（速度/血量/大小），随机分配 4 种敌人类型
 * 同时负责鸭子-敌人碰撞检测
 */
import { _decorator, Component, Node, Vec3, instantiate, Prefab, UITransform, view, CCFloat, CCInteger } from 'cc';
import { EnemyController } from './enemyController';
import { DuckController } from './duckController';
import { DuckHP } from './duckHP';
import { ENEMY_CONFIG, EnemyType, ENEMY_TYPE_MODIFIERS, ENEMY_XP } from '../config/gameConfig';
const { ccclass, property } = _decorator;

interface EnemyConfig {
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

@ccclass('EnemySpawner')
export class EnemySpawner extends Component {
    @property({ type: CCFloat, tooltip: '基础移动速度' })
    baseSpeed: number = ENEMY_CONFIG.baseSpeed;

    @property({ type: CCFloat, tooltip: '基础血量' })
    baseHp: number = ENEMY_CONFIG.baseHp;

    @property({ type: CCFloat, tooltip: '基础大小' })
    baseSize: number = ENEMY_CONFIG.baseSize;

    @property({ type: CCFloat, tooltip: '初始生成间隔（秒）' })
    spawnInterval: number = ENEMY_CONFIG.spawnInterval;

    @property({ type: CCFloat, tooltip: '最小生成间隔（秒）' })
    minSpawnInterval: number = ENEMY_CONFIG.minSpawnInterval;

    @property({ type: CCFloat, tooltip: '每次生成的间隔缩减比例' })
    spawnAcceleration: number = ENEMY_CONFIG.spawnAcceleration;

    @property({ type: CCFloat, tooltip: '波次间隔（秒）' })
    waveInterval: number = ENEMY_CONFIG.waveInterval;

    @property({ type: CCFloat, tooltip: '每波速度倍率' })
    speedScalePerWave: number = ENEMY_CONFIG.speedScalePerWave;

    @property({ type: CCFloat, tooltip: '每波血量倍率' })
    hpScalePerWave: number = ENEMY_CONFIG.hpScalePerWave;

    @property({ type: CCFloat, tooltip: '每波大小倍率' })
    sizeScalePerWave: number = ENEMY_CONFIG.sizeScalePerWave;

    private enemyPrefab: Prefab | null = null;
    private duckNode: Node | null = null;
    private canvasNode: Node | null = null;
    private duckHP: DuckHP | null = null;
    private spawnTimer: number = 0;
    private waveTimer: number = 0;
    private currentWave: number = 0;
    private currentSpawnInterval: number = 2.0;

    onLoad() {
        this.canvasNode = this.node.parent;
    }

    setDuckHP(hp: DuckHP) {
        this.duckHP = hp;
    }

    /** 初始化：设置预制体和鸭子引用，开始生成 */
    startSpawning(enemyPrefab: Prefab, duckNode: Node) {
        this.enemyPrefab = enemyPrefab;
        this.duckNode = duckNode;
        this.currentSpawnInterval = this.spawnInterval;
        this.spawnTimer = 0; // 立即生成第一个
        this.waveTimer = 0;
        this.currentWave = 1;
    }

    /** 生成一个敌人 */
    private spawnEnemy() {
        if (!this.enemyPrefab || !this.duckNode || !this.canvasNode) return;

        const enemyNode = instantiate(this.enemyPrefab);
        const enemyCtrl = enemyNode.getComponent(EnemyController);
        if (!enemyCtrl) {
            enemyNode.destroy();
            return;
        }

        // 设置追踪目标
        enemyCtrl.setTarget(this.duckNode);

        // 计算当前波次属性
        const speedMultiplier = Math.pow(this.speedScalePerWave, this.currentWave - 1);
        const hpMultiplier = Math.pow(this.hpScalePerWave, this.currentWave - 1);
        const sizeMultiplier = Math.pow(this.sizeScalePerWave, this.currentWave - 1);

        // 随机分配敌人类型
        const typeValues = Object.values(EnemyType).filter(v => typeof v === 'number') as number[];
        const enemyType: EnemyType = typeValues[Math.floor(Math.random() * typeValues.length)] as EnemyType;
        const typeMod = ENEMY_TYPE_MODIFIERS[enemyType];

        const speed = this.baseSpeed * speedMultiplier * typeMod.speed;
        const hp = Math.ceil(this.baseHp * hpMultiplier * typeMod.hp);
        const size = this.baseSize * sizeMultiplier * typeMod.size;

        enemyCtrl.init(speed, hp, size, enemyType);

        // 随机生成位置：屏幕四边外侧
        const spawnPos = this.getRandomSpawnPosition(size);
        enemyNode.setPosition(spawnPos);

        // 添加到 Canvas
        this.canvasNode.addChild(enemyNode);

        // 监听死亡事件：获得经验
        enemyNode.on('enemy-died', (enemy: EnemyController) => {
            const xp = ENEMY_XP[enemy.getEnemyType()] || 1;
            this.canvasNode!.emit('enemy-killed', xp);
        });
    }

    /** 在屏幕外侧随机位置生成 */
    private getRandomSpawnPosition(size: number): Vec3 {
        if (!this.canvasNode) return new Vec3();

        const canvasUITransform = this.canvasNode.getComponent(UITransform);
        if (!canvasUITransform) return new Vec3();

        const canvasSize = canvasUITransform.contentSize;
        const padding = size; // 留出敌人自身大小的边距
        const halfW = canvasSize.width * 0.5 + padding;
        const halfH = canvasSize.height * 0.5 + padding;

        // 随机选择从哪一侧生成：0=上, 1=下, 2=左, 3=右
        const side = Math.floor(Math.random() * 4);
        let x: number, y: number;

        switch (side) {
            case 0: // 上方
                x = (Math.random() - 0.5) * canvasSize.width;
                y = halfH;
                break;
            case 1: // 下方
                x = (Math.random() - 0.5) * canvasSize.width;
                y = -halfH;
                break;
            case 2: // 左侧
                x = -halfW;
                y = (Math.random() - 0.5) * canvasSize.height;
                break;
            case 3: // 右侧
            default:
                x = halfW;
                y = (Math.random() - 0.5) * canvasSize.height;
                break;
        }

        return new Vec3(x, y, 0);
    }

    update(dt: number) {
        if (!this.duckNode || !this.enemyPrefab) return;

        // 生成计时
        this.spawnTimer += dt;
        if (this.spawnTimer >= this.currentSpawnInterval) {
            this.spawnTimer = 0;
            this.spawnEnemy();
            // 加速生成
            this.currentSpawnInterval = Math.max(
                this.minSpawnInterval,
                this.currentSpawnInterval * this.spawnAcceleration
            );
        }

        // 波次计时
        this.waveTimer += dt;
        if (this.waveTimer >= this.waveInterval) {
            this.waveTimer = 0;
            this.currentWave++;
            console.log(`[EnemySpawner] 进入第 ${this.currentWave} 波!`);
        }

        // 碰撞检测：敌人碰到鸭子
        this.checkCollisions();
    }

    /** 简单圆形碰撞检测 — 鸭子掉血，敌人不消失 */
    private checkCollisions() {
        if (!this.duckNode || !this.duckNode.isValid || !this.canvasNode || !this.duckHP) return;

        const duckCtrl = this.duckNode.getComponent(DuckController);
        if (!duckCtrl) return;
        const duckPos = this.duckNode.position;
        const duckSize = duckCtrl.duckSize;

        const children = this.canvasNode.children;
        for (const child of children) {
            const enemyCtrl = child.getComponent(EnemyController);
            if (!enemyCtrl || enemyCtrl.getIsDead()) continue;

            const enemyPos = child.position;
            const dx = enemyPos.x - duckPos.x;
            const dy = enemyPos.y - duckPos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            const collisionRadius = (duckSize + enemyCtrl.enemySize) * 0.5;

            if (dist < collisionRadius) {
                console.log('[EnemySpawner] 敌人碰到鸭子!');
                this.duckHP.takeDamage(enemyCtrl.damage);
            }
        }
    }

    loadConfig(config: EnemyConfig) {
        if (config.baseSpeed !== undefined) this.baseSpeed = config.baseSpeed;
        if (config.baseHp !== undefined) this.baseHp = config.baseHp;
        if (config.baseSize !== undefined) this.baseSize = config.baseSize;
        if (config.spawnInterval !== undefined) this.spawnInterval = config.spawnInterval;
        if (config.minSpawnInterval !== undefined) this.minSpawnInterval = config.minSpawnInterval;
        if (config.spawnAcceleration !== undefined) this.spawnAcceleration = config.spawnAcceleration;
        if (config.waveInterval !== undefined) this.waveInterval = config.waveInterval;
        if (config.speedScalePerWave !== undefined) this.speedScalePerWave = config.speedScalePerWave;
        if (config.hpScalePerWave !== undefined) this.hpScalePerWave = config.hpScalePerWave;
        if (config.sizeScalePerWave !== undefined) this.sizeScalePerWave = config.sizeScalePerWave;
    }
}