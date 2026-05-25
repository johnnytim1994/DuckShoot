import { _decorator, Component, CCFloat, Sprite, Color } from 'cc';
import { FREEZE_CONFIG } from '../config/gameConfig';
const { ccclass, property } = _decorator;

@ccclass('FreezeEffect')
export class FreezeEffect extends Component {
    @property({ type: CCFloat, tooltip: '冰冻持续时间（秒）' })
    duration: number = FREEZE_CONFIG.duration;

    private timer: number = 0;
    private originalSpeed: number = 0;
    private enemyCtrl: any = null;
    private sprite: Sprite | null = null;
    private originalColor: Color = new Color(255, 255, 255, 255);

    onLoad() {
        this.timer = this.duration;
        this.sprite = this.node.getComponent(Sprite);
        if (this.sprite) {
            this.originalColor = this.sprite.color.clone();
            this.sprite.color = new Color(100, 180, 255, 255);
        }
    }

    init(originalSpeed: number, enemyCtrl: any) {
        this.originalSpeed = originalSpeed;
        this.enemyCtrl = enemyCtrl;
        if (this.enemyCtrl) {
            this.enemyCtrl.moveSpeed = 0;
            this.enemyCtrl.isFrozen = true;
        }
    }

    update(dt: number) {
        this.timer -= dt;
        if (this.timer <= 0) {
            this.removeFreeze();
        }
    }

    private removeFreeze() {
        if (this.enemyCtrl) {
            this.enemyCtrl.moveSpeed = this.originalSpeed;
            this.enemyCtrl.isFrozen = false;
        }
        if (this.sprite) {
            this.sprite.color = this.originalColor;
        }
        this.node.removeComponent(FreezeEffect);
    }
}
