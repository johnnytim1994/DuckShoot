# Project Constitution: Cocos Creator AI Game Development

## 1. 技术栈与环境 (Environment)
- Engine: Cocos Creator 3.8.8
- Language: TypeScript (Strict Mode)
- Automation Tools: cocos-mcp 

## 2. 沟通与开发规范 (SDD Workflow)
- **唯一事实来源 (Source of Truth)**: 本文件及后续生成的各模块 `Specification` (技术规格书) 是开发的唯一准则。
- **先看、再想、后动**: 
  1. 任何任务前，AI 必须先检查项目文件以审计当前状态（优先读取各个目录的 README.MD 和 文件头说明）。
  2. 在修改代码或场景前，AI 必须输出一份 Markdown 格式的 `Technical Specification` (技术规格书) 供人类审批。
  3. 人类打出 "APPROVED" 或 "批准" 后，AI 才能动用 MCP 工具实际编写代码或修改节点。
  4. 脚本文件必须要有简要明确的文件头说明，每次修改都需要更新该内容保证准确有效

## 3. 代码与命名规范 (Code Standards)
- **组件结构**: 倾向于低耦合组件化。
- **数据驱动**: 严禁将怪物血量、速度等数值硬编码在逻辑脚本中。必须统一在 JSON 中配置。

## 4. 每个目录必须有自己的 README.MD
- 保证 README.MD 永远和目录内容保持最新状态
- 每次都需要考虑是否更新 README.MD 和 CLAUDE.md 的内容
