# OpenClaw Needs Solution Designer By

[English README](README.md)

`openclaw-needs-solution-designer-by` 是一个面向非技术用户的对外 skill。

它不是一上来就写代码、写最终 prompt 或写最终 `SKILL.md`。
它的作用是把一个模糊想法、客户需求或流程痛点，整理成一份清晰、稳定、可继续交给 OpenClaw 执行的方案文档与使用指引。

## 这个 Skill 解决什么问题

适合下面这类场景：

- “我有一个想法，但现在说不清楚。”
- “我知道有问题，但不知道该做成 agent、skill，还是其实有现成方案能直接用。”
- “我怀疑 GitHub、ClawHub、SkillHub 上已经有类似 skill，想先判断要不要从零开始做。”
- “我已经有一份草稿，但现在需要先把问题、边界和下一步整理清楚。”

## 核心产品原则

- 先用大白话澄清，再给方案
- 必须经过多轮轮询确认，不能一上来直接定稿
- 优先参考成熟结构，提高落地稳定性
- 第一版范围要小，但要能稳稳落地
- 不要过早逼用户进入 agent / skill 术语
- 不让用户自己筛选现有方案
- 只有在设计足够稳定时，才进入正式写作或执行准备

## 最终应该产出什么

这个 skill 最终应该让用户拿到：

- 更清楚的问题定义
- 更清楚的目标结果
- 复用判断：
  - 直接用
  - 轻改
  - 新做
- 第一版范围
- blockers 和待确认项
- 一份 OpenClaw 可继续执行的使用指引

## 仓库结构

```text
openclaw-needs-solution-designer-by/
  README.md
  README.zh-CN.md
  .gitignore
  examples/
    customer-needs-reuse-first-example.md
    customer-needs-reuse-first-example.zh-CN.md
    client-needs-triage-v1-handoff.md
    client-needs-triage-v1-handoff.zh-CN.md
  openclaw-needs-solution-designer-by/
    SKILL.md
    agents/
      openai.yaml
    references/
      checklists.md
      samples.md
```

## 安装方式

把内层 skill 目录复制到 Codex skills 目录里：

```text
openclaw-needs-solution-designer-by/
```

Windows 常见目标路径：

```text
C:\Users\Administrator\.codex\skills\openclaw-needs-solution-designer-by\
```

## 当前状态

这是一个面向外部使用的 `v1` 草稿。

目前已经对齐的方向是：

- 面向不懂代码的用户
- 重点是需求澄清、方案生成和 OpenClaw 落地桥接
- 内置“先看是否有现成 skill 可参考/可复用”的阶段
- 强调稳定落地，而不是只追求快出答案

它还没有像内部元 skill 那样完成完整的人工测试闭环。

## 语言策略

- 面向人的仓库文档建议中英双语
- skill 本体仍然以英文为主，保证触发和执行稳定
- 对 adoption 很关键的示例建议同时保留中英文版本

## 发布准备

- 许可证：[MIT](LICENSE)
- 发布清单：[publish-checklist.md](publish-checklist.md)
- 主要公开文档：
  - [README.md](README.md)
  - [README.zh-CN.md](README.zh-CN.md)

## 建议的公开定位

`一个面向非技术用户的 OpenClaw 复用优先 skill，用来把模糊需求整理成清晰、稳定、可执行的方案文档和 OpenClaw 使用指引。`
