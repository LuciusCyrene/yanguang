# 言光 · Scripture Through Time

中文圣经、世界教会史与西方哲学史交互时序与地图。

- 旧约先知书按希伯来圣经目录与经文顺序阅读，独立呈现地理与经文导读。
- 新约与教会史延伸到1648年，结合事件、人物、来源与地图。
- 西方哲学独立呈现：9个时期、15个系列、43位人物，151个时间轴阅读节点；全史结构图采用大图标，可横纵滚动。
- 哲学主页提供人物导读、经典阅读入口、可核查出处的人物关系和人物／经典配图。

## 本轮阅读改进

结构图人物与主页使用同一详读窗口；作品和纪事可返回结构图原来的位置、倍率与检索状态。人物概览新增可折叠的同时期纪事入口，日期背景不自动表示人物亲历或思想影响。

## 本地启动

需要 Python 3，无需 npm 安装或打包：

```sh
python3 scripts/serve.py
```

打开 http://127.0.0.1:8001/ 。浏览器直接以 file:// 打开会受 JSON 加载限制。

中国对照可选：另行取得并检查 [江山时序](https://github.com/DeanChensj/jiangshan-map) 的许可和数据说明，使用 `python3 scripts/serve.py --china-root /path/to/jiangshan-map` 只读挂载。没有该项目时仍可阅读本项目独立地图与叙事。它的源码和数据没有随本仓库发布。

## 公开内容与许可

**原创软件代码按 MIT 开源，图片、地图数据和叙事内容分别适用各自条款。** 请先读 [许可范围](LICENSING.md)、[第三方素材说明](THIRD_PARTY_NOTICES.md) 与 [35幅图像清单](dist/data/IMAGE-RIGHTS.md)。勿把整个数据目录或叙事正文一概视为 MIT。

本版不分发本地现代书籍 PDF、Word 文献、MindMaster 文件、截图备份及5,676条权属未确认的原始导图笔记，也不包含这些文件的旧 Git 提交。原始笔记栏目显示公开范围说明；独立编写的哲学主页、时间轴、人物、经典及结构图可正常使用。来源链接供核查，不表示取得所链接作品的转载权。

历史边界、年代、后世人物图像及哲学分类均有解释限度，请结合逐条来源阅读。本项目为持续修订的阅读辅助。

## 验证与构建

需要 Node.js 运行现有验证器（无需依赖安装）：

```sh
for file in scripts/validate*.mjs; do node "$file" || exit 1; done
python3 scripts/validate_public_release.py --audit-git
```

网页已经生成在 `dist/`。可用 `python3 scripts/build_philosophy_atlas.py` 和 `python3 scripts/build_philosophy_guide.py` 重建独立哲学阅读数据；公开版不需要原始笔记文件，`build_philosophy_tree.py` 会保留已审核的公开资料，不尝试重建未分发的原文。

本项目公开版通过 `scripts/export_public.py` 从本地开发项目导出；公开 Git 历史与保留私有资料的本地开发历史分开。后续改动可继续导出、检查后同步，不能直接推送带原始资料的开发历史。
