/**
 * 鸭子 HUD：血条 + 经验条显示在屏幕左上角
 * 程序化纹理，零资源依赖，每帧从 DuckHP / XpManager 读取数据更新
 */
import { _decorator, Component, Node, Sprite, SpriteFrame, Texture2D, UITransform, Color, Vec3, Label, CCFloat } from 'cc';
import { DuckHP } from './duckHP';
import { XpManager } from './xpManager';
import { HUD_CONFIG } from '../config/gameConfig';
const { ccclass, property } = _decorator;

@ccclass('DuckHUD')
export class DuckHUD extends Component {
    @property({ type: CCFloat, tooltip: '左上角 HUD 宽度' })
    hudWidth: number = HUD_CONFIG.hudWidth;

    @property({ type: CCFloat, tooltip: '左上角 HUD 条高度' })
    hudHeight: number = HUD_CONFIG.hudHeight;

    @property({ type: CCFloat, tooltip: '左上角边距' })
    hudPadding: number = HUD_CONFIG.hudPadding;

    @property({ type: CCFloat, tooltip: 'HUD 字体大小' })
    hudFontSize: number = HUD_CONFIG.hudFontSize;

    @property({ type: CCFloat, tooltip: 'HP/XP 条间距' })
    hudGap: number = HUD_CONFIG.hudGap;

    private duckHP: DuckHP | null = null;
    private xpManager: XpManager | null = null;
    private canvasNode: Node | null = null;
    private canvasTransform: UITransform | null = null;
    private hpFill: Node | null = null;
    private hpFillTransform: UITransform | null = null;
    private hpLabel: Label | null = null;
    private xpFill: Node | null = null;
    private xpFillTransform: UITransform | null = null;
    private xpLabel: Label | null = null;

    onLoad() {
        this.duckHP = this.node.getComponent(DuckHP);
        this.canvasNode = this.node.parent;
        if (this.canvasNode) {
            this.xpManager = this.canvasNode.getComponent(XpManager);
            this.canvasTransform = this.canvasNode.getComponent(UITransform);
        }
        this.createTopLeftHUD();
    }

    private makeTex(rgba: number[]): Texture2D {
        const tex = new Texture2D();
        tex.reset({ width: 1, height: 1, format: Texture2D.PixelFormat.RGBA8888 });
        tex.uploadData(new Uint8Array(rgba));
        return tex;
    }

    private solidNode(name: string, w: number, h: number, rgba: number[]): Node {
        const n = new Node(name);
        n.addComponent(UITransform).setContentSize(w, h);
        const sp = n.addComponent(Sprite);
        const sf = new SpriteFrame();
        sf.texture = this.makeTex(rgba);
        sp.spriteFrame = sf;
        sp.sizeMode = Sprite.SizeMode.CUSTOM;
        return n;
    }

    private createTopLeftHUD() {
        if (!this.canvasNode || !this.canvasTransform) return;

        const cw = this.canvasTransform.contentSize.width;
        const ch = this.canvasTransform.contentSize.height;
        const halfW = cw * 0.5;
        const halfH = ch * 0.5;

        const root = new Node('TopLeftHUD');
        this.canvasNode.addChild(root);
        root.setPosition(new Vec3(-halfW + this.hudPadding, halfH - this.hudPadding, 0));

        this.createHPBar(root);
        this.createXPBar(root);
    }

    private createHPBar(root: Node) {
        const hpRoot = new Node('HPBar');
        hpRoot.addComponent(UITransform).setContentSize(this.hudWidth, this.hudHeight);
        root.addChild(hpRoot);
        hpRoot.setPosition(new Vec3(this.hudWidth * 0.5, -this.hudHeight * 0.5, 0));

        const hpBG = this.solidNode('HP_BG', this.hudWidth, this.hudHeight, [50, 50, 55, 200]);
        hpRoot.addChild(hpBG);

        this.hpFill = this.solidNode('HP_Fill', this.hudWidth, this.hudHeight, [80, 220, 80, 255]);
        this.hpFillTransform = this.hpFill.getComponent(UITransform)!;
        hpRoot.addChild(this.hpFill);

        const hpLabelNode = new Node('HP_Label');
        hpLabelNode.addComponent(UITransform).setContentSize(this.hudWidth - 4, this.hudHeight);
        this.hpLabel = hpLabelNode.addComponent(Label);
        this.hpLabel.string = 'HP: 10/10';
        this.hpLabel.fontSize = this.hudFontSize;
        this.hpLabel.color = new Color(255, 255, 255, 255);
        this.hpLabel.horizontalAlign = Label.HorizontalAlign.RIGHT;
        hpRoot.addChild(hpLabelNode);
        hpLabelNode.setPosition(new Vec3(-2, 0, 0));
    }

    private createXPBar(root: Node) {
        const xpRoot = new Node('XPBar');
        xpRoot.addComponent(UITransform).setContentSize(this.hudWidth, this.hudHeight);
        root.addChild(xpRoot);
        xpRoot.setPosition(new Vec3(this.hudWidth * 0.5, -this.hudHeight - this.hudGap - this.hudHeight * 0.5, 0));

        const xpBG = this.solidNode('XP_BG', this.hudWidth, this.hudHeight, [45, 45, 55, 200]);
        xpRoot.addChild(xpBG);

        this.xpFill = this.solidNode('XP_Fill', 0, this.hudHeight, [100, 180, 255, 255]);
        this.xpFillTransform = this.xpFill.getComponent(UITransform)!;
        xpRoot.addChild(this.xpFill);

        const xpLabelNode = new Node('XP_Label');
        xpLabelNode.addComponent(UITransform).setContentSize(this.hudWidth - 4, this.hudHeight);
        this.xpLabel = xpLabelNode.addComponent(Label);
        this.xpLabel.string = 'Lv.1 0/10';
        this.xpLabel.fontSize = this.hudFontSize;
        this.xpLabel.color = new Color(200, 220, 240, 255);
        this.xpLabel.horizontalAlign = Label.HorizontalAlign.RIGHT;
        xpRoot.addChild(xpLabelNode);
        xpLabelNode.setPosition(new Vec3(-2, 0, 0));
    }

    private updateHPBar() {
        if (!this.hpFillTransform || !this.duckHP || !this.hpFill || !this.hpLabel) return;

        const ratio = this.duckHP.maxHp > 0 ? Math.max(0, this.duckHP.currentHp / this.duckHP.maxHp) : 0;
        const fillWidth = Math.max(0, this.hudWidth * ratio);
        this.hpFillTransform.setContentSize(fillWidth, this.hudHeight);

        let r: number, g: number, b: number;
        if (ratio > 0.5) {
            const t = (ratio - 0.5) * 2;
            r = Math.floor(80 + (200 - 80) * t);
            g = Math.floor(220 + (200 - 220) * t);
            b = 60;
        } else {
            const t = ratio * 2;
            r = Math.floor(200 + 20 * t);
            g = Math.floor(200 + (60 - 200) * t);
            b = Math.floor(60 + (40 - 60) * t);
        }
        const sprite = this.hpFill.getComponent(Sprite);
        if (sprite) sprite.color = new Color(r, g, b, 255);

        this.hpLabel.string = `HP: ${this.duckHP.currentHp}/${this.duckHP.maxHp}`;
    }

    private updateXPBar() {
        if (!this.xpManager || !this.xpFillTransform || !this.xpFill || !this.xpLabel) return;

        const currentXp = this.xpManager.currentXp;
        const xpToNext = this.xpManager.getXpToNextLevel();
        const ratio = xpToNext > 0 ? Math.min(1, currentXp / xpToNext) : 0;

        this.xpFillTransform.setContentSize(this.hudWidth * ratio, this.hudHeight);

        const sprite = this.xpFill.getComponent(Sprite);
        if (sprite) {
            const v = Math.floor(180 + 75 * ratio);
            sprite.color = new Color(100, v, 255, 255);
        }

        this.xpLabel.string = `Lv.${this.xpManager.level} ${currentXp}/${xpToNext}`;
    }

    loadConfig(config: {
        hudWidth?: number; hudHeight?: number; hudPadding?: number;
        hudFontSize?: number; hudGap?: number;
    }) {
        if (config.hudWidth !== undefined) this.hudWidth = config.hudWidth;
        if (config.hudHeight !== undefined) this.hudHeight = config.hudHeight;
        if (config.hudPadding !== undefined) this.hudPadding = config.hudPadding;
        if (config.hudFontSize !== undefined) this.hudFontSize = config.hudFontSize;
        if (config.hudGap !== undefined) this.hudGap = config.hudGap;
    }

    update(dt: number) {
        this.updateHPBar();
        this.updateXPBar();
    }
}
