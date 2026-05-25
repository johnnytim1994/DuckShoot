import {
    _decorator, Component, Node, input, Input, EventTouch, EventMouse,
    Vec3, UITransform, view, CCFloat, CCBoolean,
    Sprite, SpriteFrame, Texture2D, Color, Size
} from 'cc';
import { DUCK_CONFIG } from '../config/gameConfig';
const { ccclass, property } = _decorator;

@ccclass('DuckController')
export class DuckController extends Component {
    @property({ type: CCFloat, tooltip: '插值速度，越大越快贴紧鼠标/触屏' })
    moveSpeed: number = DUCK_CONFIG.moveSpeed;

    @property({ type: CCFloat, tooltip: '边界留白距离（px）' })
    boundaryOffset: number = DUCK_CONFIG.boundaryOffset;

    @property({ type: CCBoolean, tooltip: '是否启用跟随' })
    enableFollow: boolean = DUCK_CONFIG.enableFollow;

    @property({ type: CCFloat, tooltip: '小鸭子大小（像素）' })
    duckSize: number = DUCK_CONFIG.size;

    private targetPos: Vec3 = new Vec3();
    private canvasNode: Node | null = null;
    private canvasUITransform: UITransform | null = null;

    onEnable() {
        input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.on(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
    }

    onDisable() {
        input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.off(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
    }

    onLoad() {
        this.ensureYellowSprite();

        this.canvasNode = this.node.parent;
        if (this.canvasNode) {
            this.canvasUITransform = this.canvasNode.getComponent(UITransform);
        }

        const startPos = this.node.position.clone();
        this.targetPos.set(startPos);
    }

    /** 创建程序化黄色纹理并设置 Srite 为 CUSTOM 模式以正确显示尺寸 */
    private ensureYellowSprite() {
        const sprite = this.node.getComponent(Sprite);
        if (!sprite) return;

        const uiTransform = this.node.getComponent(UITransform);

        // 如果已有有效纹理则跳过
        if (sprite.spriteFrame && sprite.spriteFrame.texture) {
            // 确保 sizeMode 为 CUSTOM，使用 UITransform 的 contentSize
            this.applySizeMode(sprite, uiTransform);
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

        // 鸭子黄色 (255, 220, 60)
        sprite.color = new Color(255, 220, 60, 255);

        this.applySizeMode(sprite, uiTransform);
    }

    /** 设置 Sprite 为 CUSTOM 模式以使用 UITransform contentSize */
    private applySizeMode(sprite: Sprite, uiTransform: UITransform | null) {
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        if (uiTransform) {
            uiTransform.setContentSize(this.duckSize, this.duckSize);
        }
    }

    /** 动态更新小鸭子尺寸 */
    updateDuckSize(newSize: number) {
        this.duckSize = newSize;
        const uiTransform = this.node.getComponent(UITransform);
        if (uiTransform) {
            uiTransform.setContentSize(this.duckSize, this.duckSize);
        }
    }

    private onTouchMove(event: EventTouch) {
        if (!this.enableFollow) return;
        const loc = event.getUILocation();
        this.updateTarget(loc.x, loc.y);
    }

    private onMouseMove(event: EventMouse) {
        if (!this.enableFollow) return;
        const loc = event.getUILocation();
        this.updateTarget(loc.x, loc.y);
    }

    private updateTarget(screenX: number, screenY: number) {
        if (!this.canvasNode || !this.canvasUITransform) return;

        const canvasSize = this.canvasUITransform.contentSize;
        const visibleSize = view.getVisibleSize();

        const localX = screenX - visibleSize.width * 0.5;
        const localY = screenY - visibleSize.height * 0.5;

        const halfW = canvasSize.width * 0.5 - this.boundaryOffset;
        const halfH = canvasSize.height * 0.5 - this.boundaryOffset;

        this.targetPos.set(
            Math.max(-halfW, Math.min(halfW, localX)),
            Math.max(-halfH, Math.min(halfH, localY)),
            0
        );
    }

    update(dt: number) {
        const newPos = new Vec3();
        Vec3.lerp(newPos, this.node.position, this.targetPos, Math.min(this.moveSpeed * dt, 1));
        this.node.setPosition(newPos);
    }

    /** 获取鸭子当前位置 */
    getPosition(): Vec3 {
        return this.node.position.clone();
    }

    loadConfig(config: { moveSpeed?: number; boundaryOffset?: number; enableFollow?: boolean; size?: number }) {
        if (config.moveSpeed !== undefined) this.moveSpeed = config.moveSpeed;
        if (config.boundaryOffset !== undefined) this.boundaryOffset = config.boundaryOffset;
        if (config.enableFollow !== undefined) this.enableFollow = config.enableFollow;
        if (config.size !== undefined) {
            this.updateDuckSize(config.size);
        }
    }
}