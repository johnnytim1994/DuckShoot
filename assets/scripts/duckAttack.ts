import { _decorator, Component, Node, Vec3, instantiate, Prefab, CCFloat } from 'cc';
import { EnemyController } from './enemyController';
import { BulletController } from './bulletController';
import { BULLET_CONFIG, AttackMode } from '../config/gameConfig';
const { ccclass, property } = _decorator;

interface AttackConfig {
    fireRate: number;
    bulletSpeed: number;
    bulletSize: number;
    bulletDamage: number;
    attackRange: number;
}

@ccclass('DuckAttack')
export class DuckAttack extends Component {
    @property({ type: CCFloat, tooltip: '射击频率（发/秒）' })
    fireRate: number = BULLET_CONFIG.fireRate;

    @property({ type: CCFloat, tooltip: '子弹飞行速度' })
    bulletSpeed: number = BULLET_CONFIG.bulletSpeed;

    @property({ type: CCFloat, tooltip: '子弹大小' })
    bulletSize: number = BULLET_CONFIG.bulletSize;

    @property({ type: CCFloat, tooltip: '子弹伤害' })
    bulletDamage: number = BULLET_CONFIG.bulletDamage;

    @property({ type: CCFloat, tooltip: '攻击范围' })
    attackRange: number = BULLET_CONFIG.attackRange;

    private bulletPrefab: Prefab | null = null;
    private canvasNode: Node | null = null;
    private fireTimer: number = 0;

    onLoad() {
        this.canvasNode = this.node.parent;
    }

    /** 初始化：设置子弹预制体 */
    startAttack(bulletPrefab: Prefab) {
        this.bulletPrefab = bulletPrefab;
        this.fireTimer = 1.0 / this.fireRate; // 立即开始射击
    }

    update(dt: number) {
        if (!this.bulletPrefab || !this.canvasNode) return;

        this.fireTimer += dt;
        const fireInterval = 1.0 / this.fireRate;

        while (this.fireTimer >= fireInterval) {
            this.fireTimer -= fireInterval;
            this.tryFire();
        }
    }

    /** 尝试向最近的敌人射击 */
    private tryFire() {
        const bulletNode = instantiate(this.bulletPrefab!);
        const bulletCtrl = bulletNode.getComponent(BulletController);
        if (!bulletCtrl) {
            bulletNode.destroy();
            return;
        }

        const duckPos = this.node.position;

        // 根据攻击模式计算方向
        const dir = this.calculateFireDirection(duckPos);
        if (!dir || dir.length() < 0.1) return;

        // 设置子弹位置在鸭子位置
        bulletNode.setPosition(duckPos.clone());

        // 添加到 Canvas
        this.canvasNode!.addChild(bulletNode);

        // 初始化子弹
        bulletCtrl.init(dir, this.bulletSpeed, this.bulletDamage, this.bulletSize, this.canvasNode!);
    }

    /** 根据攻击模式计算发射方向 */
    private calculateFireDirection(duckPos: Vec3): Vec3 | null {
        if (BULLET_CONFIG.attackMode === AttackMode.NEAREST_ENEMY) {
            const target = this.findNearestEnemy();
            if (!target) return null;
            const targetPos = target.position;
            const dir = new Vec3();
            Vec3.subtract(dir, targetPos, duckPos);
            dir.z = 0;
            return dir;
        }

        // MOUSE_DIRECTION：向鼠标方向射击（取鼠标方向最近敌人，无敌人则用纯方向）
        const target = this.findNearestEnemy();
        if (!target) return null;
        const targetPos = target.position.clone();
        const dir = new Vec3();
        Vec3.subtract(dir, targetPos, duckPos);
        dir.z = 0;
        return dir;
    }

    /** 查找攻击范围内的最近敌人 */
    private findNearestEnemy(): Node | null {
        if (!this.canvasNode) return null;

        const duckPos = this.node.position;
        let nearest: Node | null = null;
        let nearestDist = this.attackRange;

        const children = this.canvasNode.children;
        for (const child of children) {
            const enemyCtrl = child.getComponent(EnemyController);
            if (!enemyCtrl || enemyCtrl.getIsDead()) continue;

            // 跳过鸭子自身和子弹
            if (child === this.node) continue;
            if (child.getComponent(BulletController)) continue;

            const dx = child.position.x - duckPos.x;
            const dy = child.position.y - duckPos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = child;
            }
        }

        return nearest;
    }

    loadConfig(config: AttackConfig) {
        if (config.fireRate !== undefined) this.fireRate = config.fireRate;
        if (config.bulletSpeed !== undefined) this.bulletSpeed = config.bulletSpeed;
        if (config.bulletSize !== undefined) this.bulletSize = config.bulletSize;
        if (config.bulletDamage !== undefined) this.bulletDamage = config.bulletDamage;
        if (config.attackRange !== undefined) this.attackRange = config.attackRange;
    }
}