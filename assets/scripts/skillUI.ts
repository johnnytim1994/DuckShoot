/**
 * 升级选技能 UI 面板：程序化纹理，动态创建技能卡片，
 * 卡片支持悬停高亮 + 点击选中，显示当前等级/最大等级
 */
import { _decorator, Component, Node, Label, Color, Sprite, SpriteFrame, Texture2D, UITransform, Vec3 } from 'cc';
import { SkillOption } from './skillManager';
const { ccclass } = _decorator;

interface SkillCard {
    bg: Node;
    bgSprite: Sprite | null;
    nameLabel: Label;
    descLabel: Label;
    skillId: string;
    defaultColor: Color;
    hoverColor: Color;
}

const CARD_DEFAULT = new Color(60, 60, 80, 255);
const CARD_HOVER = new Color(90, 90, 120, 255);
const CARD_PRESSED = new Color(50, 50, 65, 255);

@ccclass('SkillUI')
export class SkillUI extends Component {
    private panel: Node | null = null;
    private cards: SkillCard[] = [];
    private onSkillSelected: ((skillId: string) => void) | null = null;

    show(options: SkillOption[], callback: (skillId: string) => void) {
        this.onSkillSelected = callback;
        this.createPanel(options);
    }

    hide() {
        if (this.panel) {
            this.panel.destroy();
            this.panel = null;
        }
        this.cards = [];
    }

    private createPanel(options: SkillOption[]) {
        this.panel = new Node('SkillPanel');
        const panelTransform = this.panel.addComponent(UITransform);
        panelTransform.setContentSize(420, 380);

        const sprite = this.panel.addComponent(Sprite);
        const tex = new Texture2D();
        tex.reset({ width: 1, height: 1, format: Texture2D.PixelFormat.RGBA8888 });
        tex.uploadData(new Uint8Array([0, 0, 0, 200]));
        const sf = new SpriteFrame();
        sf.texture = tex;
        sprite.spriteFrame = sf;
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;

        this.node.addChild(this.panel);
        this.panel.setPosition(new Vec3(0, 50, 0));

        const titleNode = new Node('Title');
        const titleTransform = titleNode.addComponent(UITransform);
        titleTransform.setContentSize(300, 40);
        const titleLabel = titleNode.addComponent(Label);
        titleLabel.string = '升级 - 选择一项技能';
        titleLabel.fontSize = 24;
        titleLabel.color = new Color(255, 255, 200, 255);
        this.panel.addChild(titleNode);
        titleNode.setPosition(new Vec3(0, 150, 0));

        const hintNode = new Node('Hint');
        hintNode.addComponent(UITransform).setContentSize(300, 24);
        const hintLabel = hintNode.addComponent(Label);
        hintLabel.string = '点击选择升级';
        hintLabel.fontSize = 14;
        hintLabel.color = new Color(180, 180, 200, 255);
        this.panel.addChild(hintNode);
        hintNode.setPosition(new Vec3(0, 125, 0));

        const cardWidth = 360;
        const cardHeight = 76;
        const startY = 75;
        const gap = 12;

        this.cards = [];
        for (let i = 0; i < options.length; i++) {
            const opt = options[i];
            const card = this.createCard(opt, cardWidth, cardHeight, new Vec3(0, startY - i * (cardHeight + gap), 0));
            this.cards.push(card);
        }
    }

    private createCard(skill: SkillOption, w: number, h: number, pos: Vec3): SkillCard {
        const card = new Node('SkillCard_' + skill.id);
        card.addComponent(UITransform).setContentSize(w, h);

        const bgSprite = card.addComponent(Sprite);
        const tex = new Texture2D();
        tex.reset({ width: 1, height: 1, format: Texture2D.PixelFormat.RGBA8888 });
        tex.uploadData(new Uint8Array([60, 60, 80, 255]));
        const sf = new SpriteFrame();
        sf.texture = tex;
        bgSprite.spriteFrame = sf;
        bgSprite.sizeMode = Sprite.SizeMode.CUSTOM;

        this.panel!.addChild(card);
        card.setPosition(pos);

        const nameNode = new Node('Name');
        nameNode.addComponent(UITransform).setContentSize(320, 28);
        const nameLabel = nameNode.addComponent(Label);
        const isMaxed = skill.currentLevel >= skill.maxLevel;
        nameLabel.string = `${skill.name}  Lv.${skill.currentLevel}/${skill.maxLevel}`;
        nameLabel.fontSize = 20;
        nameLabel.color = isMaxed ? new Color(150, 150, 150, 255) : new Color(255, 220, 100, 255);
        card.addChild(nameNode);
        nameNode.setPosition(new Vec3(0, 18, 0));

        const descNode = new Node('Desc');
        descNode.addComponent(UITransform).setContentSize(320, 24);
        const descLabel = descNode.addComponent(Label);
        descLabel.string = skill.desc;
        descLabel.fontSize = 15;
        descLabel.color = new Color(200, 200, 200, 255);
        card.addChild(descNode);
        descNode.setPosition(new Vec3(0, -12, 0));

        card.on(Node.EventType.MOUSE_ENTER, () => {
            if (bgSprite) bgSprite.color = CARD_HOVER;
        });
        card.on(Node.EventType.MOUSE_LEAVE, () => {
            if (bgSprite) bgSprite.color = CARD_DEFAULT;
        });
        card.on(Node.EventType.TOUCH_START, () => {
            if (bgSprite) bgSprite.color = CARD_PRESSED;
            if (this.onSkillSelected) {
                this.onSkillSelected(skill.id);
            }
        });
        card.on(Node.EventType.TOUCH_END, () => {
            if (bgSprite) bgSprite.color = CARD_DEFAULT;
        });
        card.on(Node.EventType.TOUCH_CANCEL, () => {
            if (bgSprite) bgSprite.color = CARD_DEFAULT;
        });

        return { bg: card, bgSprite, nameLabel, descLabel, skillId: skill.id, defaultColor: CARD_DEFAULT, hoverColor: CARD_HOVER };
    }
}
