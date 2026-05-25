/**
 * 敌人控制器：4 种敌人类型（Chaser/Shield/Regen/Swarm）
 * 追踪鸭子移动，支持类型差异化属性（速度/血量/大小/回血）
 * 数据驱动，数值由 EnemySpawner 传入
 */
import { _decorator, Component, Node, Vec3, UITransform, Sprite, SpriteFrame, Texture2D, Color, CCFloat } from 'cc';
import { EnemyType, ENEMY_TYPE_MODIFIERS } from '../config/gameConfig';
const { ccclass, property } = _decorator;

@ccclass('EnemyController')
export class EnemyController extends Component {
    @property({ type: CCFloat, tooltip: '移动速度' })
    moveSpeed: number = 80;

    @property({ type: CCFloat, tooltip: '当前血量' })
    hp: number = 1;

    @property({ type: CCFloat, tooltip: '最大血量' })
    maxHp: number = 1;

    @property({ type: CCFloat, tooltip: '怪物大小' })
    enemySize: number = 40;

    @property({ type: CCFloat, tooltip: '碰到鸭子的伤害' })
    damage: number = 1;

    private targetNode: Node | null = null;
    private isDead: boolean = false;
    private enemyType: EnemyType = EnemyType.Chaser;
    isFrozen: boolean = false;

    onLoad() {
        this.ensureRedSprite();
    }

    /** 创建程序化红色纹理 */
    private ensureRedSprite() {
        const sprite = this.node.getComponent(Sprite);
        if (!sprite) return;

        const uiTransform = this.node.getComponent(UITransform);

        if (sprite.spriteFrame && sprite.spriteFrame.texture) {
            this.applySize(sprite, uiTransform);
            return;
        }

        const tex = new Texture2D();
        tex.reset({
            width: 1,
            height: 1,
            format: Texture2D.PixelFormat.RGBA8888,
        });
        tex.uploadData(new Uint8Array([255, 255, 255, 255]));

        const sf = new SpriteFrame();
        sf.texture = tex;

        sprite.spriteFrame = sf;
        sprite.color = new Color(220, 40, 40, 255);

        this.applySize(sprite, uiTransform);
    }

    private applySize(sprite: Sprite, uiTransform: UITransform | null) {
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        if (uiTransform) {
            uiTransform.setContentSize(this.enemySize, this.enemySize);
        }
    }

    /** 设置追踪目标（鸭子） */
    setTarget(target: Node) {
        this.targetNode = target;
    }

    /** 初始化属性（由生成器调用） */
    init(speed: number, hp: number, size: number, enemyType: EnemyType = EnemyType.Chaser) {
        this.moveSpeed = speed;
        this.hp = hp;
        this.maxHp = hp;
        this.enemySize = size;
        this.enemyType = enemyType;

        const sprite = this.node.getComponent(Sprite);
        const uiTransform = this.node.getComponent(UITransform);
        if (sprite && uiTransform) {
            this.applySize(sprite, uiTransform);
        }

        // 根据敌人类型设置颜色
        if (sprite) {
            sprite.color = this.getColorForType(enemyType, hp);
        }
    }

    /** 根据敌人类型获取颜色 */
    private getColorForType(type: EnemyType, hp: number): Color {
        switch (type) {
            case EnemyType.Chaser:
                // 蓝色系：追击者
                return new Color(60, 120, 255, 255);
            case EnemyType.Shield:
                // 紫色系：肉盾，血量越高越深
                const shieldIntensity = Math.min(1, hp / 20);
                return new Color(
                    Math.floor(180 * shieldIntensity),
                    Math.floor(60 * (1 - shieldIntensity * 0.5)),
                    Math.floor(200 * shieldIntensity),
                    255
                );
            case EnemyType.Regen:
                // 青色系：回复者
                return new Color(60, 220, 200, 255);
            case EnemyType.Swarm:
                // 绿色系：群涌者
                return new Color(80, 200, 60, 255);
            default:
                // 红色系：默认
                const intensity = Math.min(1, hp / 10);
                return new Color(
                    Math.floor(220 * intensity),
                    Math.floor(40 * (1 - intensity * 0.5)),
                    Math.floor(40 * (1 - intensity * 0.5)),
                    255
                );
        }
    }

    /** 受伤 */
    takeDamage(damage: number): boolean {
        if (this.isDead) return false;

        this.hp -= damage;
        if (this.hp <= 0) {
            this.die();
            return true; // 返回 true 表示死了
        }
        return false;
    }

    /** 死亡 */
    private die() {
        this.isDead = true;
        // 通知生成器移除自己
        this.node.emit('enemy-died', this);
        this.node.destroy();
    }

    /** 是否已死亡 */
    getIsDead(): boolean {
        return this.isDead;
    }

    /** 获取敌人类型 */
    getEnemyType(): EnemyType {
        return this.enemyType;
    }

    update(dt: number) {
        if (this.isDead || !this.targetNode || !this.targetNode.isValid) return;

        if (this.isFrozen) return;

        // Regen 类型：持续回血
        if (this.enemyType === EnemyType.Regen && this.hp < this.maxHp) {
            const regenPerSec = ENEMY_TYPE_MODIFIERS[EnemyType.Regen].regenPerSec;
            if (regenPerSec) {
                this.hp = Math.min(this.maxHp, this.hp + regenPerSec * dt);
            }
        }

        const targetPos = this.targetNode.position;
        const myPos = this.node.position;

        const dir = new Vec3();
        Vec3.subtract(dir, targetPos, myPos);
        dir.z = 0;

        const len = dir.length();
        if (len < 0.1) return;

        dir.normalize();
        const moveAmount = this.moveSpeed * dt;

        const newPos = new Vec3();
        Vec3.scaleAndAdd(newPos, myPos, dir, Math.min(moveAmount, len));
        this.node.setPosition(newPos);
    }
}