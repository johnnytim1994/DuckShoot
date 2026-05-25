# Prefabs — 预制体

## 文件列表

| 预制体 | 组件 | 用途 |
|--------|------|------|
| `Duck.prefab` | — | 鸭子预制体（未在场景中使用，场景内为直接节点） |
| `Bullet.prefab` | UITransform + Sprite + BulletController | 子弹实例，由 DuckAttack 生成 |
| `Enemy.prefab` | UITransform + Sprite + EnemyController | 敌人实例，由 EnemySpawner 生成 |

## 场景节点

| 节点 | 附加组件 | 说明 |
|------|---------|------|
| Canvas | GameRoot + XpManager + SkillManager + SkillUI | 游戏入口，经验/技能管理 |
| Duck | DuckController + DuckAttack + DuckHP + DuckHUD | 玩家控制，攻击，血量，血条/经验条 |
| EnemySpawner | EnemySpawner | 波次生成 + 碰撞检测 |

## 说明

- Bullet.prefab 和 Enemy.prefab 通过 GameRoot 组件的属性引用
- 各预制体均使用程序化生成的 1×1 纹理，无需导入图片资源
- 技能面板 SkillUI 升级时动态创建，零资源依赖
