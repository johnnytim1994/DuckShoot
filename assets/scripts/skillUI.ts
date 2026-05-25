import { _decorator, Component, Node, Label, Color, Sprite, SpriteFrame, Texture2D, UITransform, Vec3 } from 'cc';
import { SkillDef } from './skillManager';
const { ccclass } = _decorator;

interface SkillCard {
    bg: Node;
    nameLabel: Label;
    descLabel: Label;
    skillId: string;
}

@ccclass('SkillUI')
export class SkillUI extends Component {
    private panel: Node | null = null;
    private titleLabel: Label | null = null;
    private cards: SkillCard[] = [];
    private onSkillSelected: ((skillId: string) => void) | null = null;

    show(options: SkillDef[], callback: (skillId: string) => void) {
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

    private createPanel(options: SkillDef[]) {
        this.panel = new Node('SkillPanel');
        const panelTransform = this.panel.addComponent(UITransform);
        panelTransform.setContentSize(400, 350);

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
        titleLabel.string = '选择升级技能';
        titleLabel.fontSize = 28;
        titleLabel.color = new Color(255, 255, 200, 255);
        this.panel.addChild(titleNode);
        titleNode.setPosition(new Vec3(0, 130, 0));
        this.titleLabel = titleLabel;

        const cardWidth = 340;
        const cardHeight = 70;
        const startY = 60;
        const gap = 10;

        this.cards = [];
        for (let i = 0; i < options.length; i++) {
            const opt = options[i];
            const card = this.createCard(opt, cardWidth, cardHeight, new Vec3(0, startY - i * (cardHeight + gap), 0));
            this.cards.push(card);
        }
    }

    private createCard(skill: SkillDef, w: number, h: number, pos: Vec3): SkillCard {
        const card = new Node('SkillCard_' + skill.id);
        const cardTransform = card.addComponent(UITransform);
        cardTransform.setContentSize(w, h);

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
        const nameTransform = nameNode.addComponent(UITransform);
        nameTransform.setContentSize(300, 28);
        const nameLabel = nameNode.addComponent(Label);
        nameLabel.string = `${skill.name} [Lv.${skill.maxLevel}max]`;
        nameLabel.fontSize = 20;
        nameLabel.color = new Color(255, 220, 100, 255);
        card.addChild(nameNode);
        nameNode.setPosition(new Vec3(0, 15, 0));

        const descNode = new Node('Desc');
        const descTransform = descNode.addComponent(UITransform);
        descTransform.setContentSize(300, 24);
        const descLabel = descNode.addComponent(Label);
        descLabel.string = skill.desc;
        descLabel.fontSize = 16;
        descLabel.color = new Color(200, 200, 200, 255);
        card.addChild(descNode);
        descNode.setPosition(new Vec3(0, -10, 0));

        card.on(Node.EventType.TOUCH_END, () => {
            if (this.onSkillSelected) {
                this.onSkillSelected(skill.id);
            }
        });

        return { bg: card, nameLabel, descLabel, skillId: skill.id };
    }
}
