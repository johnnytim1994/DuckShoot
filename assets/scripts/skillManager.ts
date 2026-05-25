import { _decorator, Component } from 'cc';
import { SKILL_CONFIG } from '../config/gameConfig';
const { ccclass } = _decorator;

export interface SkillDef {
    id: string;
    name: string;
    desc: string;
    maxLevel: number;
}

const SKILL_POOL: SkillDef[] = [
    { id: 'damage_up',   name: '子弹强化',   desc: '子弹伤害 +1/级',         maxLevel: SKILL_CONFIG.maxLevels.damage_up },
    { id: 'multi_shot',  name: '散射',        desc: '弹道数 +2/级',           maxLevel: SKILL_CONFIG.maxLevels.multi_shot },
    { id: 'freeze',      name: '冰冻',        desc: '15%冰冻概率/级 持续2秒', maxLevel: SKILL_CONFIG.maxLevels.freeze },
    { id: 'fire_rate',   name: '速射',        desc: '射速 +25%/级',           maxLevel: SKILL_CONFIG.maxLevels.fire_rate },
    { id: 'speed_boost', name: '加速',        desc: '移动速度 +15%/级',       maxLevel: SKILL_CONFIG.maxLevels.speed_boost },
    { id: 'hp_boost',    name: '生命强化',    desc: '最大HP +3/级',           maxLevel: SKILL_CONFIG.maxLevels.hp_boost },
];

@ccclass('SkillManager')
export class SkillManager extends Component {
    private skillLevels: Record<string, number> = {};

    onLoad() {
        for (const skill of SKILL_POOL) {
            this.skillLevels[skill.id] = 0;
        }
    }

    getSkillLevel(id: string): number {
        return this.skillLevels[id] || 0;
    }

    getSkillDef(id: string): SkillDef | undefined {
        return SKILL_POOL.find(s => s.id === id);
    }

    getAllSkills(): SkillDef[] {
        return [...SKILL_POOL];
    }

    getUpgradeOptions(count: number = SKILL_CONFIG.skillOptionsPerLevel): SkillDef[] {
        const available = SKILL_POOL.filter(s => (this.skillLevels[s.id] || 0) < s.maxLevel);
        const shuffled = [...available].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    }

    applySkill(id: string): number {
        const current = this.skillLevels[id] || 0;
        const def = SKILL_POOL.find(s => s.id === id);
        if (!def || current >= def.maxLevel) return current;

        const newLevel = current + 1;
        this.skillLevels[id] = newLevel;
        console.log(`[SkillManager] 学习技能: ${def.name} Lv.${newLevel}`);
        this.node.emit('skill-applied', id, newLevel);
        return newLevel;
    }
}
