# 技术规格书（Spec）— DuckShoot 三项修复/增强

> 版本: v1.0  
> 日期: 2026-05-22  
> 状态: 待审批 🟡

---

## 一、现状分析

### 1.1 项目结构

```
assets/
├── config/
│   └── gameConfig.ts          # 配置常量（DUCK_CONFIG/ENEMY_CONFIG/WAVE_CONFIG/BULLET_CONFIG）
├── scripts/
│   ├── gameRoot.ts            # 入口脚本，持有 Enemy/Bullet Prefab 引用
│   ├── duckController.ts      # 鸭子：鼠标/触屏跟随 + 设置自身大小
│   ├── duckAttack.ts          # 鸭子：自动瞄准最近敌人 + 发射子弹
│   ├── enemyController.ts     # 敌人：4种类型枚举 + 向鸭子移动 + 受伤/死亡
│   ├── enemySpawner.ts        # 生成器：屏幕边缘生成 + 波次系统
│   └── bulletController.ts    # 子弹：直线飞行 + 碰撞伤害
└── prefabs/
    ├── Enemy.prefab           # 敌人预制体
    └── Bullet.prefab          # 子弹预制体
```

### 1.2 场景结构（MCP 实查）

```
Scene
└── Canvas (1280×720, Widget 全屏拉伸)
    ├── Camera
    ├── Background
    ├── Duck                     ← UITransform:80×80, Sprite:sizeMode=TRIMMED(无spriteFrame)
    │   + DuckController          ← duckSize=80, moveSpeed=5
    │   + DuckAttack              ← range=500, fireRate=2, bulletSpeed=300
    └── EnemySpawner             ← baseSize=40, baseHp=1, baseSpeed=80
        + EnemySpawner            ← wave interval=30s, speedScale=1.1, hpScale=1.2
```

Canvas 额外挂载 **GameRoot**（引用 enemyPrefab + bulletPrefab）

### 1.3 关键发现

| # | 发现 | 影响 |
|---|------|------|
| 1 | `gameConfig.ts` **完全未被任何脚本 import** | 配置与实际运行脱钩，修改配置不生效 |
| 2 | Duck 的 Sprite.sizeMode=TRIMMED 且无 spriteFrame | 代码虽设 CUSTOM 模式，但视觉表现依赖程序化纹理 |
| 3 | Duck duckSize=80 / UITransform=80×80 | 在 1280×720 画布上偏小 |
| 4 | EnemyController 定义了 4 种类型但 update() 无分派 | Chaser/Shield/Regen/Swarm 均表现为相同行为 |
| 5 | BulletController 的类名/脚本可能未正确挂载到 Prefab | 启动日志报 `Can not find class` 错误 |
| 6 | EnemySpawner 波次系统已实现但数值未与 gameConfig 同步 | 难度曲线可调整但缺乏配置对接 |

---

## 二、三项问题的根因分析

### 🔴 问题1：鸭子大小设置没有生效

**根因（二重叠加）**：

1. **`gameConfig.ts` 与运行时代码完全脱钩**  
   `gameConfig.ts` 定义了 `DUCK_CONFIG.size = 64`，但没有任何脚本 `import` 它。  
   用户如果修改 `gameConfig` 会完全无效；即使修改 DuckController 场景属性 `duckSize`（当前值=80），也只是调用 `UITransform.setContentSize(80, 80)`，80px 在 1280×720 画布上视觉很小。

2. **Duck 节点 Sprite.sizeMode=TRIMMED 且 spriteFrame 为空**  
   代码在 `onLoad()` 中创建 1×1 白色纹理，然后把 sizeMode 改为 CUSTOM，再 setContentSize。  
   流程正确但数值偏小，需要调大默认尺寸。

**修复方向**：
- 让 `gameConfig` 驱动运行时默认值
- 将 `DUCK_CONFIG.size` 提高到 ≥120px
- DuckController 在 `onLoad()` 中读取 gameConfig 覆盖默认 `duckSize`

---

### 🟡 问题2：怪物从四面八方向鸭子靠近、逐渐变强

**现状**：
- `enemySpawner.ts` **已实现**屏幕边缘随机位置生成 + 波次系统（waveInterval=30s，每波 speedScale=1.1, hpScale=1.2, sizeScale=1.05）
- `enemyController.ts` 中 4 种敌人类型（Chaser/Shield/Regen/Swarm）**仅定义了枚举**，实际 `update()` 里所有敌人行为完全相同（都只是向鸭子移动）

**根因**：
1. **敌人类型未差异化** — Chaser/Shield/Regen/Swarm 枚举存在但没有类型分派逻辑
2. **`gameConfig.ts` 未对接** — `enemySpawner.ts` 使用自己的 `@property` 数值（如 baseSize=40），与 `gameConfig` 中的 `ENEMY_CONFIG` / `WAVE_CONFIG` 数值不一致
3. **缺乏难度曲线反馈** — 虽然有波次递增，但没有 HUD 或日志提示玩家当前波次/难度

**修复方向**：
- 实现敌人类型差异化行为（速度/血量/特殊技能）
- 对接 gameConfig 数值
- 让 "逐渐变强" 可感知（波次提示 + 数值调整）

---

### 🟢 问题3：鸭子会攻击怪物

**现状**：
- `duckAttack.ts` **已实现**自动寻找最近敌人 + 按频率发射子弹
- `bulletController.ts` 已实现命中伤害 + 边界销毁
- 但启动日志报 `Can not find class` → Bullet.prefab 上未正确挂载 BulletController 脚本

**根因**：
1. **Bullet 预制体缺少 `BulletController` 脚本组件** — 类注册失败导致子弹无法实例化
2. **攻击无视觉反馈** — 子弹发射了但没有特效/音效（超出本次范围）
3. **只攻击最近敌人** — 目标选择策略单一

**修复方向**：
- 通过 MCP 为 Bullet.prefab 挂载 BulletController 脚本
- 对接 gameConfig 中的 BULLET_CONFIG

---

## 三、修改方案（按实施顺序）

### 阶段 1：对接 `gameConfig.ts`，让配置驱动运行时 ⭐ 基石

| 步骤 | 文件 | 操作 | 预计行数 |
|------|------|------|---------|
| 1.1 | `gameConfig.ts` | 增加 `ENEMY_TYPE_MODIFIERS`（4种类型的速度/血量/大小修正系数表）和 `ATTACK_MODE` 枚举 | +30行 |
| 1.2 | `duckController.ts` | `onLoad()` 中 `import { DUCK_CONFIG }`，用配置覆盖 `this.size`，默认值改 120 | +5行 |
| 1.3 | `enemySpawner.ts` | `onLoad()` 中读取 `ENEMY_CONFIG`/`WAVE_CONFIG` 覆盖场景默认值 | +10行 |
| 1.4 | `duckAttack.ts` | `onLoad()` 中读取 `BULLET_CONFIG` 覆盖子弹参数 | +5行 |

### 阶段 2：修复鸭子大小 & 视觉

| 步骤 | 文件/操作 | 说明 |
|------|-----------|------|
| 2.1 | `gameConfig.ts` | `DUCK_CONFIG.size` 从 64 → **120** |
| 2.2 | `duckController.ts` | `onLoad()` 确保同步 `UITransform.contentSize` 为配置值 |
| 2.3 | Scene (MCP) | Duck 节点 UITransform.contentSize 同步为 120×120 |

### 阶段 3：敌人类型差异化 + 逐渐变强

| 步骤 | 文件 | 说明 |
|------|------|------|
| 3.1 | `enemyController.ts` | 实现 `applyTypeBehavior()`：<br>- **Chaser**：速度×1.5，血量×1.0<br>- **Shield**：速度×0.7，血量×2.0<br>- **Regen**：速度×1.0，血量×1.0，每秒回 0.5 HP<br>- **Swarm**：速度×1.2，血量×0.5，大小×0.6 |
| 3.2 | `enemySpawner.ts` | 生成时随机分配类型、传入 `gameConfig` 波长/倍率 |
| 3.3 | `gameConfig.ts` | 补充 `ENEMY_TYPE_MODIFIERS` 系数表 |

### 阶段 4：鸭子攻击完善

| 步骤 | 文件/操作 | 说明 |
|------|-----------|------|
| 4.1 | `duckAttack.ts` | 增加攻击方向策略（`NEAREST_ENEMY` / `MOUSE_DIRECTION`），从 gameConfig 读取 |
| 4.2 | Bullet.prefab (MCP) | 挂载 `BulletController` 脚本组件（解决类找不到的错误） |
| 4.3 | Enemy.prefab (MCP) | 确认 EnemyController 已正确挂载 |

### 阶段 5：验证 & 收尾

| 步骤 | 操作 |
|------|------|
| 5.1 | 保存场景 |
| 5.2 | 刷新 Asset Database |
| 5.3 | 运行项目，验证三项功能 |

---

## 四、需修改的文件清单

```
✏️ TypeScript 代码修改（6个文件）:
  assets/config/gameConfig.ts       ← 补充枚举映射、调大默认值 [+30行]
  assets/scripts/duckController.ts   ← 对接 gameConfig、调大默认尺寸 [+5行]
  assets/scripts/enemyController.ts  ← 实现敌人类型差异化 [+30行]
  assets/scripts/enemySpawner.ts     ← 对接 gameConfig、随机类型分配 [+15行]
  assets/scripts/duckAttack.ts       ← 对接 gameConfig、攻击策略 [+10行]
  assets/scripts/gameRoot.ts         ← 初始化时同步配置 [+5行]

🖱️ MCP 场景操作（3项）:
  Bullet.prefab  — 添加 BulletController 脚本组件
  Duck 节点      — 同步 UITransform.contentSize 为 120×120
  Enemy.prefab   — 确认 EnemyController 已挂载
```

---

## 五、`gameConfig.ts` 预期改动

```typescript
// 新增部分：

// 敌人类型修正系数
export const ENEMY_TYPE_MODIFIERS: Record<EnemyType, { speed: number; hp: number; size: number }> = {
    [EnemyType.Chaser]: { speed: 1.5, hp: 1.0, size: 1.0 },   // 快但脆
    [EnemyType.Shield]: { speed: 0.7, hp: 2.0, size: 1.2 },   // 慢但肉
    [EnemyType.Regen]:  { speed: 1.0, hp: 1.0, size: 1.0 },   // 会回血
    [EnemyType.Swarm]:  { speed: 1.2, hp: 0.5, size: 0.6 },   // 小而多
};

// 攻击模式
export enum AttackMode {
    NEAREST_ENEMY = 0,   // 自动瞄准最近敌人
    MOUSE_DIRECTION = 1, // 向鼠标方向射击
}

// DUCK_CONFIG 调整
export const DUCK_CONFIG = {
    size: 120,  // 从 64 → 120
    // ...
};

// 新增子弹配置（前置声明已有 BULLET_CONFIG 的合理默认值）
export const BULLET_CONFIG = {
    speed: 300,
    size: 20,
    damage: 1,
    attackRange: 500,
    fireRate: 2,
    attackMode: AttackMode.NEAREST_ENEMY,
};
```

---

## 六、风险与注意事项

| 风险 | 级别 | 应对 |
|------|------|------|
| Bullet.prefab 节点结构未知，挂载脚本前需先查 | 中 | MCP 查 prefab 根节点后确认 |
| Enemy.prefab 同样需确认脚本挂载状态 | 低 | 启动日志显示 EnemyController 类型错误即需修复 |
| gameConfig 与场景 property 默认值冲突 | 低 | 以 gameConfig 为准，`onLoad()` 中明确覆盖 |
| 敌人类型差异化后游戏平衡 | 低 | 保留场景 @property 微调入口 |

---

> ✅ **以上为完整技术规格书。请审阅后回复「批准」开始实施，或提出调整意见。**