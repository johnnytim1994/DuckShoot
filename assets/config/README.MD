# Config — 游戏配置

## 文件说明

| 文件 | 类型 | 用途 |
|------|------|------|
| `gameConfig.ts` | TypeScript | 配置接口定义、枚举、默认值、JSON 加载器 |
| `resources/config/gameConfig.json` | JSON | 运行时配置（数据驱动，覆盖默认值） |

## 配置优先级

`gameConfig.json`（resources 加载）→ 深度合并 → `gameConfig.ts` 默认值

## 关键接口

- `DuckConfig` — 鸭子移动/大小/边界
- `DuckHPConfig` — 鸭子血量/无敌时间
- `AttackConfig` — 子弹/射击参数
- `EnemyConfig` — 敌人基础属性 + 波次递增系数
- `EnemyType` — Chaser / Shield / Regen / Swarm
- `ENEMY_TYPE_MODIFIERS` — 各类型属性修正系数
- `XPConfig` — 经验/升级曲线
- `ENEMY_XP` — 各敌人类型提供经验值
- `SKILL_CONFIG` — 技能最大等级/每级选项数
- `HUDConfig` / `HUD_CONFIG` — 血条/经验条尺寸位置配置
- `FREEZE_CONFIG` — 冰冻持续时间
- `getFreezeChance(level)` — 冰冻概率计算
- `getMultiShotCount(level)` — 散射弹道数计算
