import { _decorator, Component, CCInteger, CCFloat, Sprite, Color } from 'cc';
import { DUCK_HP_CONFIG } from '../config/gameConfig';
const { ccclass, property } = _decorator;

@ccclass('DuckHP')
export class DuckHP extends Component {
    @property({ type: CCInteger, tooltip: '最大血量' })
    maxHp: number = DUCK_HP_CONFIG.maxHp;

    @property({ type: CCFloat, tooltip: '受伤后无敌时间（秒）' })
    invincibleTime: number = DUCK_HP_CONFIG.invincibleTime;

    currentHp: number = DUCK_HP_CONFIG.maxHp;
    private isInvincible: boolean = false;
    private flashTimer: number = 0;
    private sprite: Sprite | null = null;
    private originalColor: Color = new Color(255, 255, 255, 255);

    onLoad() {
        this.currentHp = this.maxHp;
        this.sprite = this.node.getComponent(Sprite);
        if (this.sprite) {
            this.originalColor = this.sprite.color.clone();
        }
    }

    takeDamage(amount: number): boolean {
        if (this.isInvincible || this.currentHp <= 0) return false;

        this.currentHp -= amount;
        console.log(`[DuckHP] 受到 ${amount} 点伤害，剩余 HP: ${this.currentHp}`);

        if (this.currentHp <= 0) {
            this.currentHp = 0;
            this.node.emit('duck-died');
            return true;
        }

        this.isInvincible = true;
        this.flashTimer = this.invincibleTime;
        return false;
    }

    heal(amount: number) {
        this.currentHp = Math.min(this.maxHp, this.currentHp + amount);
    }

    increaseMaxHp(amount: number) {
        this.maxHp += amount;
        this.currentHp += amount;
    }

    update(dt: number) {
        if (!this.isInvincible) return;

        this.flashTimer -= dt;
        if (this.sprite) {
            const visible = Math.floor(this.flashTimer / 0.1) % 2 === 0;
            this.sprite.color = visible ? this.originalColor : new Color(255, 100, 100, 255);
        }

        if (this.flashTimer <= 0) {
            this.isInvincible = false;
            if (this.sprite) {
                this.sprite.color = this.originalColor;
            }
        }
    }
}
