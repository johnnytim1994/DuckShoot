import { _decorator, Component, Node, Prefab, instantiate, UITransform, Vec3 } from 'cc';
import { DuckController } from './duckController';
import { EnemyController } from './enemyController';
import { EnemySpawner } from './enemySpawner';
import { BulletController } from './bulletController';
import { DuckAttack } from './duckAttack';
import { GameConfig, loadGameConfig } from '../config/gameConfig';
const { ccclass, property } = _decorator;

@ccclass('GameRoot')
export class GameRoot extends Component {
    @property({ type: Prefab, tooltip: '敌人预制体' })
    enemyPrefab: Prefab | null = null;

    @property({ type: Prefab, tooltip: '子弹预制体' })
    bulletPrefab: Prefab | null = null;

    private duckCtrl: DuckController | null = null;
    private duckAttack: DuckAttack | null = null;
    private spawner: EnemySpawner | null = null;
    private duckNode: Node | null = null;

    async onLoad() {
        // 加载配置
        const config = await loadGameConfig();

        // 查找鸭子节点（Duck 节点挂载 DuckController）
        this.duckNode = this.node.getChildByName('Duck');
        if (this.duckNode) {
            this.duckCtrl = this.duckNode.getComponent(DuckController);
            this.duckAttack = this.duckNode.getComponent(DuckAttack);
        }

        // 应用配置到鸭子
        if (this.duckCtrl && config.duck) {
            this.duckCtrl.loadConfig(config.duck);
        }

        // 应用配置到攻击组件
        if (this.duckAttack && config.attack) {
            this.duckAttack.loadConfig(config.attack);
        }

        // 初始化敌人生成器
        if (config.enemy) {
            const spawnerNode = this.node.getChildByName('EnemySpawner');
            if (spawnerNode) {
                this.spawner = spawnerNode.getComponent(EnemySpawner);
                if (this.spawner) {
                    this.spawner.loadConfig(config.enemy);
                }
            }
        }

        // 延迟一帧启动，等待所有组件就绪
        this.scheduleOnce(() => {
            this.startGame();
        }, 0.1);
    }

    private startGame() {
        if (this.spawner && this.enemyPrefab && this.duckNode) {
            this.spawner.startSpawning(this.enemyPrefab, this.duckNode);
        }

        if (this.duckAttack && this.bulletPrefab) {
            this.duckAttack.startAttack(this.bulletPrefab);
        }
    }

    update(dt: number) {
        // 子弹 vs 敌人碰撞检测
        this.checkBulletEnemyCollisions();
    }

    /** 检测子弹与敌人的碰撞 */
    private checkBulletEnemyCollisions() {
        if (!this.duckNode) return;

        const canvas = this.duckNode.parent;
        if (!canvas) return;

        const children = canvas.children;
        const bullets: { node: Node; ctrl: BulletController }[] = [];
        const enemies: { node: Node; ctrl: EnemyController }[] = [];

        // 分类收集
        for (const child of children) {
            if (!child.isValid) continue;

            const bulletCtrl = child.getComponent(BulletController);
            if (bulletCtrl && !bulletCtrl.getIsDead()) {
                bullets.push({ node: child, ctrl: bulletCtrl });
                continue;
            }

            const enemyCtrl = child.getComponent(EnemyController);
            if (enemyCtrl && !enemyCtrl.getIsDead()) {
                enemies.push({ node: child, ctrl: enemyCtrl });
            }
        }

        // 检测碰撞
        for (const bullet of bullets) {
            if (bullet.ctrl.getIsDead()) continue;

            const bulletPos = bullet.node.position;
            const bulletSize = bullet.ctrl.bulletSize;

            for (const enemy of enemies) {
                if (enemy.ctrl.getIsDead()) continue;

                const enemyPos = enemy.node.position;
                const dx = bulletPos.x - enemyPos.x;
                const dy = bulletPos.y - enemyPos.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                const collisionRadius = (bulletSize + enemy.ctrl.enemySize) * 0.4;

                if (dist < collisionRadius) {
                    const killed = enemy.ctrl.takeDamage(bullet.ctrl.getDamage());
                    bullet.ctrl.hitTarget();
                    if (killed) {
                        console.log('[GameRoot] 击杀了敌人!');
                    }
                    break; // 一颗子弹只命中一个敌人
                }
            }
        }
    }
}