import { _decorator, Component, Node, Vec3, instantiate, Prefab, CCFloat, CCInteger } from 'cc';
import { EnemyController } from './enemyController';
import { BulletController } from './bulletController';
import { FreezeEffect } from './freezeEffect';
import { BULLET_CONFIG, AttackMode, getMultiShotCount, getFreezeChance } from '../config/gameConfig';
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
    private multiShotLevel: number = 0;
    private freezeLevel: number = 0;

    onLoad() {
        this.canvasNode = this.node.parent;
    }

    setMultiShotLevel(level: number) { this.multiShotLevel = level; }
    setFreezeLevel(level: number) { this.freezeLevel = level; }
    setFireRateScale(scale: number) { this.fireRate = BULLET_CONFIG.fireRate * scale; }
    setDamageBonus(bonus: number) { this.bulletDamage = BULLET_CONFIG.bulletDamage + bonus; }

    startAttack(bulletPrefab: Prefab) {
        this.bulletPrefab = bulletPrefab;
        this.fireTimer = 1.0 / this.fireRate;
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

    private tryFire() {
        const duckPos = this.node.position;
        const dir = this.calculateFireDirection(duckPos);
        if (!dir || dir.length() < 0.1) return;

        const shotCount = getMultiShotCount(this.multiShotLevel);
        const spreadAngle = 20;
        const startAngle = (shotCount - 1) * spreadAngle * -0.5;

        for (let i = 0; i < shotCount; i++) {
            const angle = startAngle + i * spreadAngle;
            const bulletDir = this.rotateDir(dir, angle);
            this.fireBullet(duckPos, bulletDir);
        }
    }

    private rotateDir(dir: Vec3, angleDeg: number): Vec3 {
        const rad = angleDeg * Math.PI / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        return new Vec3(dir.x * cos - dir.y * sin, dir.x * sin + dir.y * cos, 0);
    }

    private fireBullet(duckPos: Vec3, dir: Vec3) {
        const bulletNode = instantiate(this.bulletPrefab!);
        const bulletCtrl = bulletNode.getComponent(BulletController);
        if (!bulletCtrl) {
            bulletNode.destroy();
            return;
        }

        bulletNode.setPosition(duckPos.clone());
        this.canvasNode!.addChild(bulletNode);
        bulletCtrl.init(dir, this.bulletSpeed, this.bulletDamage, this.bulletSize, this.canvasNode!);

        if (this.freezeLevel > 0) {
            bulletCtrl.setFreezeData(this.freezeLevel, getFreezeChance(this.freezeLevel));
        }
    }

    private calculateFireDirection(duckPos: Vec3): Vec3 | null {
        const target = this.findNearestEnemy();
        if (!target) return null;
        const targetPos = target.position;
        const dir = new Vec3();
        Vec3.subtract(dir, targetPos, duckPos);
        dir.z = 0;
        return dir;
    }

    private findNearestEnemy(): Node | null {
        if (!this.canvasNode) return null;

        const duckPos = this.node.position;
        let nearest: Node | null = null;
        let nearestDist = this.attackRange;

        const children = this.canvasNode.children;
        for (const child of children) {
            const enemyCtrl = child.getComponent(EnemyController);
            if (!enemyCtrl || enemyCtrl.getIsDead()) continue;

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
