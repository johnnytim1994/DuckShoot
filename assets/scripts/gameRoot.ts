/**
 * 游戏入口：加载配置，协调子系统，子弹-敌人碰撞检测，经验/技能事件分发
 */
import { _decorator, Component, Node, Prefab, instantiate, UITransform, Vec3, director } from 'cc';
import { DuckController } from './duckController';
import { DuckHP } from './duckHP';
import { EnemyController } from './enemyController';
import { EnemySpawner } from './enemySpawner';
import { BulletController } from './bulletController';
import { DuckAttack } from './duckAttack';
import { DuckHUD } from './duckHUD';
import { XpManager } from './xpManager';
import { SkillManager } from './skillManager';
import { SkillUI } from './skillUI';
import { GameConfig, loadGameConfig, ENEMY_XP, SKILL_CONFIG } from '../config/gameConfig';
const { ccclass, property } = _decorator;

@ccclass('GameRoot')
export class GameRoot extends Component {
    @property({ type: Prefab, tooltip: '敌人预制体' })
    enemyPrefab: Prefab | null = null;

    @property({ type: Prefab, tooltip: '子弹预制体' })
    bulletPrefab: Prefab | null = null;

    private duckCtrl: DuckController | null = null;
    private duckHP: DuckHP | null = null;
    private duckAttack: DuckAttack | null = null;
    private spawner: EnemySpawner | null = null;
    private xpManager: XpManager | null = null;
    private skillManager: SkillManager | null = null;
    private skillUI: SkillUI | null = null;
    private duckNode: Node | null = null;
    private duckHUD: DuckHUD | null = null;
    private _gamePaused: boolean = false;

    async onLoad() {
        const config = await loadGameConfig();

        this.duckNode = this.node.getChildByName('Duck');
        if (this.duckNode) {
            this.duckCtrl = this.duckNode.getComponent(DuckController);
            this.duckHP = this.duckNode.getComponent(DuckHP);
            this.duckAttack = this.duckNode.getComponent(DuckAttack);
        }

        if (this.duckCtrl && config.duck) {
            this.duckCtrl.loadConfig(config.duck);
        }

        if (this.duckAttack && config.attack) {
            this.duckAttack.loadConfig(config.attack);
        }

        if (this.duckNode && config.hud) {
            this.duckHUD = this.duckNode.addComponent(DuckHUD);
            this.duckHUD.loadConfig(config.hud);
        }

        this.skillManager = this.node.getComponent(SkillManager);
        this.xpManager = this.node.getComponent(XpManager);
        this.skillUI = this.node.getComponent(SkillUI);
        if (this.skillUI) {
            this.skillUI.enabled = false;
        }

        if (config.enemy) {
            const spawnerNode = this.node.getChildByName('EnemySpawner');
            if (spawnerNode) {
                this.spawner = spawnerNode.getComponent(EnemySpawner);
                if (this.spawner && this.duckHP) {
                    this.spawner.setDuckHP(this.duckHP);
                    this.spawner.loadConfig(config.enemy);
                }
            }
        }

        this.setupListeners();

        this.scheduleOnce(() => {
            this.startGame();
        }, 0.1);
    }

    private setupListeners() {
        if (this.duckNode) {
            this.duckNode.on('duck-died', this.onDuckDied, this);
        }

        this.node.on('enemy-killed', this.onEnemyKilled, this);
        this.node.on('level-up', this.onLevelUp, this);
        this.node.on('skill-applied', this.onSkillApplied, this);
    }

    private startGame() {
        if (this.spawner && this.enemyPrefab && this.duckNode) {
            this.spawner.startSpawning(this.enemyPrefab, this.duckNode);
        }

        if (this.duckAttack && this.bulletPrefab) {
            this.duckAttack.startAttack(this.bulletPrefab);
        }
    }

    private onEnemyKilled(xp: number) {
        if (this.xpManager) {
            this.xpManager.addXp(xp);
        }
    }

    private onLevelUp(level: number) {
        if (!this.skillManager || !this.skillUI) return;

        const options = this.skillManager.getUpgradeOptions(SKILL_CONFIG.skillOptionsPerLevel);
        if (options.length === 0) return;

        this.pauseGame();
        this.skillUI.enabled = true;
        this.skillUI.show(options, (skillId: string) => {
            this.skillManager!.applySkill(skillId);
            this.skillUI.hide();
            this.skillUI.enabled = false;
            this.resumeGame();
        });
    }

    private pauseGame() {
        this._gamePaused = true;
        if (this.spawner) this.spawner.enabled = false;
        if (this.duckAttack) this.duckAttack.enabled = false;
        if (this.duckCtrl) this.duckCtrl.enabled = false;
    }

    private resumeGame() {
        this._gamePaused = false;
        if (this.spawner) this.spawner.enabled = true;
        if (this.duckAttack) this.duckAttack.enabled = true;
        if (this.duckCtrl) this.duckCtrl.enabled = true;
    }

    private onSkillApplied(skillId: string, level: number) {
        switch (skillId) {
            case 'damage_up':
                if (this.duckAttack) this.duckAttack.setDamageBonus(level);
                break;
            case 'multi_shot':
                if (this.duckAttack) this.duckAttack.setMultiShotLevel(level);
                break;
            case 'freeze':
                if (this.duckAttack) this.duckAttack.setFreezeLevel(level);
                break;
            case 'fire_rate':
                if (this.duckAttack) this.duckAttack.setFireRateScale(1 + level * 0.25);
                break;
            case 'speed_boost':
                if (this.duckCtrl) {
                    this.duckCtrl.moveSpeed = 6.0 * (1 + level * 0.15);
                }
                break;
            case 'hp_boost':
                if (this.duckHP) this.duckHP.increaseMaxHp(3);
                break;
        }
    }

    private onDuckDied() {
        console.log('[GameRoot] 鸭子死亡! 游戏结束');
        director.pause();
    }

    update(dt: number) {
        if (this._gamePaused) return;
        this.checkBulletEnemyCollisions();
    }

    private checkBulletEnemyCollisions() {
        if (!this.duckNode) return;

        const canvas = this.duckNode.parent;
        if (!canvas) return;

        const children = canvas.children;
        const bullets: { node: Node; ctrl: BulletController }[] = [];
        const enemies: { node: Node; ctrl: EnemyController }[] = [];

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

                const collisionRadius = (bulletSize + enemy.ctrl.enemySize) * 0.5;

                if (dist < collisionRadius) {
                    const killed = enemy.ctrl.takeDamage(bullet.ctrl.getDamage());
                    bullet.ctrl.hitTarget(enemy.node);
                    if (killed) {
                        console.log('[GameRoot] 击杀了敌人!');
                    }
                    break;
                }
            }
        }
    }
}
