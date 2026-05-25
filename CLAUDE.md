# Project Constitution: Cocos Creator AI Game Development

## 1. 技术栈与环境 (Environment)
- Engine: Cocos Creator 3.8.8
- Language: TypeScript (Strict Mode)
- Automation Tools: cocos-mcp 

## 2. 沟通与开发规范 (SDD Workflow)
- **唯一事实来源 (Source of Truth)**: 本文件及后续生成的各模块 `Specification` (技术规格书) 是开发的唯一准则。
- **先看、再想、后动**: 
  1. 任何任务前，AI 必须先检查项目文件以审计当前状态。
  2. 在修改代码或场景前，AI 必须输出一份 Markdown 格式的 `Technical Specification` (技术规格书) 供人类审批。
  3. 人类打出 "APPROVED" 或 "批准" 后，AI 才能动用 MCP 工具实际编写代码或修改节点。

## 3. 代码与命名规范 (Code Standards)
- **组件结构**: 倾向于低耦合组件化。
- **数据驱动**: 严禁将怪物血量、速度等数值硬编码在逻辑脚本中。必须统一在 JSON 中配置。
- **命名**: 
  - 节点：大驼峰命名（例：`PlayerNode`, `GameManager`）。
  - 脚本文件：小驼峰命名（例：`playerController.ts`, `enemyManager.ts`）。
  - 类名：大驼峰，须与文件名保持逻辑一致并继承自 `Component`。

## 4. 当前里程碑目标 (Current Milestone)
- **当前已完成**: 
  1. 背景颜色随机
  2. 小鸭子跟随鼠标移动
- **下一步目标**: 
  1. 小鸭子大小设置要大一点，似乎没有生效
  2. 怪物从四面八方向小鸭子靠近，逐渐变强
  3. 小鸭子会攻击怪物