import { _decorator, Component, CCInteger, CCFloat } from 'cc';
import { XP_CONFIG } from '../config/gameConfig';
const { ccclass, property } = _decorator;

@ccclass('XpManager')
export class XpManager extends Component {
    @property({ type: CCInteger, tooltip: '升到下一级所需经验（基础）' })
    baseXpToLevel: number = XP_CONFIG.baseXpToLevel;

    @property({ type: CCFloat, tooltip: '每级所需经验倍率' })
    xpScalePerLevel: number = XP_CONFIG.xpScalePerLevel;

    level: number = 1;
    currentXp: number = 0;
    private _xpToNextLevel: number = XP_CONFIG.baseXpToLevel;

    getXpToNextLevel(): number {
        return this._xpToNextLevel;
    }

    addXp(amount: number) {
        this.currentXp += amount;
        console.log(`[XpManager] 获得 ${amount} 经验，当前 ${this.currentXp}/${this._xpToNextLevel}`);

        while (this.currentXp >= this._xpToNextLevel) {
            this.currentXp -= this._xpToNextLevel;
            this.level++;
            this._xpToNextLevel = Math.floor(this.baseXpToLevel * Math.pow(this.xpScalePerLevel, this.level - 1));
            console.log(`[XpManager] 升级! 等级 ${this.level}`);
            this.node.emit('level-up', this.level);
        }
    }
}
