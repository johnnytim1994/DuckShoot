import { _decorator, Component, Node, Vec3, UITransform, Sprite, SpriteFrame, Texture2D, Color, CCFloat } from 'cc';
import { FreezeEffect } from './freezeEffect';
import { EnemyController } from './enemyController';
const { ccclass, property } = _decorator;

@ccclass('BulletController')
export class BulletController extends Component {
    @property({ type: CCFloat, tooltip: '子弹飞行速度' })
    bulletSpeed: number = 300;

    @property({ type: CCFloat, tooltip: '子弹伤害' })
    damage: number = 1;

    @property({ type: CCFloat, tooltip: '子弹大小' })
    bulletSize: number = 20;

    private direction: Vec3 = new Vec3(1, 0, 0);
    private canvasNode: Node | null = null;
    private canvasHalfW: number = 0;
    private canvasHalfH: number = 0;
    private isDead: boolean = false;
    private freezeLevel: number = 0;
    private freezeChance: number = 0;

    onLoad() {
        this.ensureWhiteSprite();
    }

    private ensureWhiteSprite() {
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
        sprite.color = new Color(255, 255, 200, 255);

        this.applySize(sprite, uiTransform);
    }

    private applySize(sprite: Sprite, uiTransform: UITransform | null) {
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        if (uiTransform) {
            uiTransform.setContentSize(this.bulletSize, this.bulletSize);
        }
    }

    init(direction: Vec3, speed: number, damage: number, size: number, canvasNode: Node) {
        this.direction = direction.clone();
        this.direction.z = 0;
        this.direction.normalize();
        this.bulletSpeed = speed;
        this.damage = damage;
        this.bulletSize = size;

        this.canvasNode = canvasNode;
        const canvasUITransform = canvasNode.getComponent(UITransform);
        if (canvasUITransform) {
            const canvasSize = canvasUITransform.contentSize;
            this.canvasHalfW = canvasSize.width * 0.5 + size;
            this.canvasHalfH = canvasSize.height * 0.5 + size;
        }

        const sprite = this.node.getComponent(Sprite);
        const uiTransform = this.node.getComponent(UITransform);
        if (sprite && uiTransform) {
            this.applySize(sprite, uiTransform);
        }
    }

    setFreezeData(level: number, chance: number) {
        this.freezeLevel = level;
        this.freezeChance = chance;
        if (level > 0 && this.node.getComponent(Sprite)) {
            this.node.getComponent(Sprite)!.color = new Color(150, 200, 255, 255);
        }
    }

    getDamage(): number {
        return this.damage;
    }

    getIsDead(): boolean {
        return this.isDead;
    }

    update(dt: number) {
        if (this.isDead) return;

        const newPos = new Vec3();
        Vec3.scaleAndAdd(newPos, this.node.position, this.direction, this.bulletSpeed * dt);
        this.node.setPosition(newPos);

        if (
            Math.abs(newPos.x) > this.canvasHalfW ||
            Math.abs(newPos.y) > this.canvasHalfH
        ) {
            this.destroyBullet();
        }
    }

    hitTarget(enemyNode?: Node) {
        if (this.freezeLevel > 0 && enemyNode && Math.random() < this.freezeChance) {
            const existingFreeze = enemyNode.getComponent(FreezeEffect);
            if (!existingFreeze) {
                const enemyCtrl = enemyNode.getComponent(EnemyController);
                if (enemyCtrl) {
                    const freeze = enemyNode.addComponent(FreezeEffect);
                    freeze.init(enemyCtrl.moveSpeed, enemyCtrl);
                }
            }
        }
        this.destroyBullet();
    }

    private destroyBullet() {
        this.isDead = true;
        this.node.destroy();
    }
}
