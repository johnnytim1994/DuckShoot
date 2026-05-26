# Scripts — 游戏脚本

## 文件列表

| 文件 | 职责 |
|------|------|
| `gameRoot.ts` | 游戏入口，加载配置，协调子系统，子弹-敌人碰撞检测，经验/技能事件分发 |
| `duckController.ts` | 鸭子鼠标/触屏跟随移动，边界限制 |
| `duckAttack.ts` | 自动瞄准射击，支持散射多弹道 + 冰冻子弹 |
| `duckHP.ts` | 鸭子血量管理，受伤无敌闪烁，死亡事件 |
| `bulletController.ts` | 子弹直线飞行，命中/边界销毁，冰冻效果触发 |
| `freezeEffect.ts` | 冰冻状态组件，冻结敌人移动 + 蓝色视觉效果 |
| `enemyController.ts` | 4 种敌人类型（Chaser/Shield/Regen/Swarm），支持冻结状态 |
| `enemySpawner.ts` | 波次生成系统，屏幕边缘随机生成，难度递增，碰撞触发鸭子掉血 |
| `xpManager.ts` | 经验值管理，升级事件触发 |
| `skillManager.ts` | 技能池管理，升级时随机抽取技能选项，提供 SkillOption 含当前等级 |
| `skillUI.ts` | 升级选技能 UI 面板，程序化纹理，支持悬停高亮 + 点击选中 |
| `duckHUD.ts` | 血条 + 经验条（屏幕左上角固定位置）HUD 显示 |
| `backgroundManager.ts` | 背景色管理，随机/固定颜色 |

## 数据流

```
gameConfig.json → gameRoot.loadConfig() → 各组件 loadConfig()
                                          → EnemySpawner 使用配置生成敌人
                                          → DuckAttack 使用配置发射子弹

敌人触碰Duck → DuckHP.takeDamage() → HP归零 → 游戏结束
                                   → DuckHUD 更新血条
敌人死亡     → XpManager.addXp() → 经验满 → SkillManager抽取技能
                                           → SkillUI弹出选技能面板
                                           → 技能生效(DuckAttack属性改变)
              DuckHUD 更新经验条/等级（每帧从 XpManager 读取）
```
