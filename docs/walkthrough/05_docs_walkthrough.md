# 文档体系 Walkthrough

> 对应 TODO.md §9「文档」

## 完成项

- `docs/requirements_analysis.md` — PRD 需求分析
- `docs/project_design.md` — V1.1 总体架构设计
- `docs/backend_scaffold.md` — V1.0 后端脚手架详设
- `docs/decisions.md` — V1.0 ADR + bug 修复记录
- `README.md` — 项目简介、技术栈、快速启动、命令、文档索引

## 文档目录结构

```
TaskManager/
├── README.md                              # 项目入口文档
├── TODO.md                                # 全项目 TODO 与进度
├── CLAUDE.md                              # AI 协作规范
├── AGENTS.md                              # 编码规范指南
└── docs/
    ├── requirements_analysis.md           # PRD
    ├── project_design.md                  # 总体设计（含版本变更表）
    ├── backend_scaffold.md                # 后端详设
    ├── decisions.md                       # 决策与修复记录（ADR 风格）
    └── walkthrough/                       # 每个 TODO 步骤的实施记录
        ├── 01_scaffold_walkthrough.md
        ├── 02_backend_walkthrough.md
        ├── 03_frontend_p0_walkthrough.md
        ├── 04_shared_walkthrough.md
        └── 05_docs_walkthrough.md         # 当前文件
```

## 文档管理规则（摘自 CLAUDE.md）

触发新增/修改文档的条件：
1. 出现新的设计
2. 重构或新增模块
3. 出现 bug 并修复
4. 长对话讨论某个独立问题
5. 方案细节修改

维护规则：
- 如已有对应文档 → 修改并迭代版本号
- 长文档必须有目录和索引
- TODO.md 中每个步骤实现后在 `docs/walkthrough/` 增加对应 `_walkthrough.md`

## 版本追踪

| 文档 | 当前版本 | 最后更新 |
|---|---|---|
| `project_design.md` | V1.1 | 2026-05-25 |
| `backend_scaffold.md` | V1.0 | 2026-05-25 |
| `decisions.md` | V1.0 | 2026-05-25 |
| `TODO.md` | V1.0 | 2026-05-25 |

---

*完成日期：2026-05-25*
