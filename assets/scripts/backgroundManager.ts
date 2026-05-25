/**
 * 背景管理器：随机/固定颜色背景，自动拉伸填满 Canvas
 */
import {
    _decorator, Component, Sprite, Color, CCFloat, CCBoolean,
    SpriteFrame, Texture2D, UITransform
} from 'cc';
const { ccclass, property } = _decorator;

@ccclass('BackgroundManager')
export class BackgroundManager extends Component {
    @property({ type: CCBoolean, tooltip: '是否使用随机颜色填充' })
    useRandomColor: boolean = true;

    @property({ type: CCFloat, tooltip: '随机颜色范围最小值（0-1）' })
    colorMin: number = 0.2;

    @property({ type: CCFloat, tooltip: '随机颜色范围最大值（0-1）' })
    colorMax: number = 0.9;

    onLoad() {
        this.ensureWhiteSpriteFrame();

        if (this.useRandomColor) {
            this.applyRandomColor();
        }

        // 拉伸填满父节点
        this.stretchToParent();
    }

    /** 创建 1×1 白色纹理 SpriteFrame，确保 Sprite 有东西可渲染 */
    private ensureWhiteSpriteFrame() {
        const sprite = this.node.getComponent(Sprite);
        if (!sprite) return;
        // spriteFrame 可能是 {uuid:""} 空对象，需要检查 texture 是否有效
        if (sprite.spriteFrame && sprite.spriteFrame.texture) return;

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
    }

    /** 拉伸节点填满 Canvas */
    private stretchToParent() {
        const parent = this.node.parent;
        if (!parent) return;

        const parentUITransform = parent.getComponent(UITransform);
        if (!parentUITransform) return;

        const ui = this.node.getComponent(UITransform);
        if (!ui) return;

        ui.setContentSize(parentUITransform.contentSize);
        this.node.setPosition(0, 0, 0);
    }

    private applyRandomColor() {
        const sprite = this.node.getComponent(Sprite);
        if (!sprite) return;

        const r = this.randomRange(this.colorMin, this.colorMax);
        const g = this.randomRange(this.colorMin, this.colorMax);
        const b = this.randomRange(this.colorMin, this.colorMax);

        sprite.color = new Color(
            Math.floor(r * 255),
            Math.floor(g * 255),
            Math.floor(b * 255),
            255
        );
    }

    private randomRange(min: number, max: number): number {
        return min + Math.random() * (max - min);
    }

    loadConfig(config: { useRandomColor?: boolean; colorMin?: number; colorMax?: number }) {
        if (config.useRandomColor !== undefined) this.useRandomColor = config.useRandomColor;
        if (config.colorMin !== undefined) this.colorMin = config.colorMin;
        if (config.colorMax !== undefined) this.colorMax = config.colorMax;

        if (this.useRandomColor) {
            this.applyRandomColor();
        }
    }
}