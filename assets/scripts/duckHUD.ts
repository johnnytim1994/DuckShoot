/**
 * 鸭子 HUD：血条（跟随鸭子上方）+ 经验条（屏幕底部）
 * 程序化纹理，零资源依赖，每帧从 DuckHP / XpManager 读取数据更新
 */
import { _decorator, Component, Node, Sprite, SpriteFrame, Texture2D, UITransform, Color, Vec3, Label, CCFloat } from 'cc';
import { DuckHP } from './duckHP';
import { XpManager } from './xpManager';
import { DuckController } from './duckController';
import { HUD_CONFIG } from '../config/gameConfig';
const { ccclass, property } = _decorator;

const BORDER = 2;

@ccclass('DuckHUD')
export class DuckHUD extends Component {
    @property({ type: CCFloat, tooltip: '血条宽度比例（相对鸭子大小）' })
    hpBarWidthRatio: number = HUD_CONFIG.hpBarWidthRatio;

    @property({ type: CCFloat, tooltip: '血条高度（px）' })
    hpBarHeight: number = HUD_CONFIG.hpBarHeight;

    @property({ type: CCFloat, tooltip: '血条在鸭子上方偏移（px）' })
    hpBarOffsetY: number = HUD_CONFIG.hpBarOffsetY;

    @property({ type: CCFloat, tooltip: '经验条宽度比例（相对 Canvas 宽度）' })
    xpBarWidthRatio: number = HUD_CONFIG.xpBarWidthRatio;

    @property({ type: CCFloat, tooltip: '经验条高度（px）' })
    xpBarHeight: number = HUD_CONFIG.xpBarHeight;

    @property({ type: CCFloat, tooltip: '经验条 Y 位置（相对 Canvas 底部）' })
    xpBarY: number = HUD_CONFIG.xpBarY;

    private duckHP: DuckHP | null = null;
    private duckCtrl: DuckController | null = null;
    private xpManager: XpManager | null = null;
    private hpContainer: Node | null = null;
    private hpBG: Sprite | null = null;
    private hpFill: Node | null = null;
    private hpFillTransform: UITransform | null = null;
    private xpBarBG: Node | null = null;
    private xpFill: Node | null = null;
    private xpFillTransform: UITransform | null = null;
    private levelLabel: Label | null = null;
    private xpLabel: Label | null = null;
    private canvasTransform: UITransform | null = null;
    private canvasNode: Node | null = null;
    private hpBarWidth: number = 0;

    onLoad() {
        this.duckHP = this.node.getComponent(DuckHP);
        this.duckCtrl = this.node.getComponent(DuckController);
        this.canvasNode = this.node.parent;
        if (this.canvasNode) {
            this.xpManager = this.canvasNode.getComponent(XpManager);
            this.canvasTransform = this.canvasNode.getComponent(UITransform);
        }
        this.createHPBar();
        this.createXPBar();
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

    private createHPBar() {
        const duckSize = this.duckCtrl ? this.duckCtrl.duckSize : 80;
        this.hpBarWidth = duckSize * this.hpBarWidthRatio;
        const cw = this.hpBarWidth + BORDER * 2;
        const ch = this.hpBarHeight + BORDER * 2;

        this.hpContainer = new Node('HPBar');
        this.hpContainer.addComponent(UITransform).setContentSize(cw, ch);

        this.hpContainer.addChild(this.solidNode('HP_BG', cw, ch, [50, 50, 55, 200]));
        this.hpBG = this.hpContainer.children[0]?.getComponent(Sprite) ?? null;

        this.hpFill = this.solidNode('HP_Fill', this.hpBarWidth, this.hpBarHeight, [80, 220, 80, 255]);
        this.hpFillTransform = this.hpFill.getComponent(UITransform)!;
        this.hpContainer.addChild(this.hpFill);

        const barY = duckSize * 0.5 + this.hpBarOffsetY;
        this.hpContainer.setPosition(new Vec3(0, barY, 0));
        this.node.addChild(this.hpContainer);
    }

    private createXPBar() {
        if (!this.canvasNode || !this.canvasTransform) return;

        const barWidth = this.canvasTransform.contentSize.width * this.xpBarWidthRatio;
        const cw = barWidth + BORDER * 2;
        const ch = this.xpBarHeight + BORDER * 2;

        const root = new Node('XPBar');
        this.xpContainer = root;
        this.canvasNode.addChild(root);
        root.setPosition(new Vec3(0, this.xpBarY, 0));

        this.xpBarBG = this.solidNode('XP_BG', cw, ch, [45, 45, 55, 200]);
        root.addChild(this.xpBarBG);

        this.xpFill = this.solidNode('XP_Fill', 0, this.xpBarHeight, [100, 180, 255, 255]);
        this.xpFillTransform = this.xpFill.getComponent(UITransform)!;
        root.addChild(this.xpFill);

        const ln = new Node('LevelLabel');
        ln.addComponent(UITransform).setContentSize(60, this.xpBarHeight);
        this.levelLabel = ln.addComponent(Label);
        this.levelLabel.string = 'Lv.1';
        this.levelLabel.fontSize = 16;
        this.levelLabel.color = new Color(255, 215, 0, 255);
        ln.setPosition(new Vec3(-cw * 0.5 - 30, 0, 0));
        root.addChild(ln);

        const xn = new Node('XP_Label');
        xn.addComponent(UITransform).setContentSize(160, this.xpBarHeight);
        this.xpLabel = xn.addComponent(Label);
        this.xpLabel.string = '0 / 10';
        this.xpLabel.fontSize = 13;
        this.xpLabel.color = new Color(170, 200, 230, 255);
        xn.setPosition(new Vec3(cw * 0.5 + 10, 0, 0));
        root.addChild(xn);
    }

    private updateHPBar() {
        if (!this.hpFillTransform || !this.duckHP || !this.hpFill || !this.duckCtrl) return;

        const duckSize = this.duckCtrl.duckSize;
        this.hpBarWidth = duckSize * this.hpBarWidthRatio;
        const cw = this.hpBarWidth + BORDER * 2;
        const ch = this.hpBarHeight + BORDER * 2;

        const ratio = this.duckHP.maxHp > 0 ? Math.max(0, this.duckHP.currentHp / this.duckHP.maxHp) : 0;
        const fillWidth = Math.max(0, this.hpBarWidth * ratio);

        this.hpFillTransform.setContentSize(fillWidth, this.hpBarHeight);
        this.hpFill.setPosition(new Vec3((fillWidth - this.hpBarWidth) * 0.5, 0, 0));

        let r: number, g: number, b: number;
        if (ratio > 0.5) {
            const t = (ratio - 0.5) * 2;
            r = Math.floor(80 + (200 - 80) * t);
            g = Math.floor(220 + (200 - 220) * t);
            b = 60;
        } else {
            const t = ratio * 2;
            r = Math.floor(200 + (220 - 200) * t);
            g = Math.floor(200 + (60 - 200) * t);
            b = Math.floor(60 + (40 - 60) * t);
        }
        const sprite = this.hpFill.getComponent(Sprite);
        if (sprite) sprite.color = new Color(r, g, b, 255);

        if (this.hpContainer) {
            this.hpContainer.getComponent(UITransform)?.setContentSize(cw, ch);
            const bgNode = this.hpContainer.children[0];
            if (bgNode) bgNode.getComponent(UITransform)?.setContentSize(cw, ch);
            this.hpContainer.setPosition(new Vec3(0, duckSize * 0.5 + this.hpBarOffsetY, 0));
        }
    }

    private updateXPBar() {
        if (!this.xpManager || !this.xpFillTransform || !this.xpFill || !this.canvasTransform) return;

        const barWidth = this.canvasTransform.contentSize.width * this.xpBarWidthRatio;
        const cw = barWidth + BORDER * 2;
        const currentXp = this.xpManager.currentXp;
        const xpToNext = this.xpManager.getXpToNextLevel();
        const ratio = xpToNext > 0 ? Math.min(1, currentXp / xpToNext) : 0;

        this.xpFillTransform.setContentSize(barWidth * ratio, this.xpBarHeight);
        this.xpFill.setPosition(new Vec3((barWidth * ratio - barWidth) * 0.5, 0, 0));

        const sprite = this.xpFill.getComponent(Sprite);
        if (sprite) {
            const v = Math.floor(180 + 75 * ratio);
            sprite.color = new Color(100, v, 255, 255);
        }

        if (this.levelLabel) this.levelLabel.string = `Lv.${this.xpManager.level}`;
        if (this.xpLabel) this.xpLabel.string = `${currentXp} / ${xpToNext}`;

        if (this.xpBarBG) {
            this.xpBarBG.getComponent(UITransform)?.setContentSize(cw, this.xpBarHeight + BORDER * 2);
        }
    }

    update(dt: number) {
        this.updateHPBar();
        this.updateXPBar();
    }

    loadConfig(config: {
        hpBarWidthRatio?: number; hpBarHeight?: number; hpBarOffsetY?: number;
        xpBarWidthRatio?: number; xpBarHeight?: number; xpBarY?: number;
    }) {
        if (config.hpBarWidthRatio !== undefined) this.hpBarWidthRatio = config.hpBarWidthRatio;
        if (config.hpBarHeight !== undefined) this.hpBarHeight = config.hpBarHeight;
        if (config.hpBarOffsetY !== undefined) this.hpBarOffsetY = config.hpBarOffsetY;
        if (config.xpBarWidthRatio !== undefined) this.xpBarWidthRatio = config.xpBarWidthRatio;
        if (config.xpBarHeight !== undefined) this.xpBarHeight = config.xpBarHeight;
        if (config.xpBarY !== undefined) this.xpBarY = config.xpBarY;
    }
}
