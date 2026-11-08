#!/usr/bin/env python3
"""Export a reviewed, history-free public edition without changing local data."""
from pathlib import Path
import argparse
import ast
import hashlib
import json
import re
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]
NOTICE = '公开版保留独立编写的哲学导读、时间轴与全史结构图；权属未确认的原始导图笔记暂不分发。'
EXCLUDED = {
    'dist/data/philosophy-tree-original.txt',
    'scripts/sources/philosophy-tree-original.txt',
    'scripts/sources/philosophy-tree-archive.json',
}


def dump(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '\n')


def public_readme():
    return '''# 言光 · Scripture Through Time

中文圣经、世界教会史与西方哲学史交互时序与地图。

- 旧约先知书按希伯来圣经目录与经文顺序阅读，独立呈现地理与经文导读。
- 新约与教会史延伸到1648年，结合事件、人物、来源与地图。
- 西方哲学独立呈现：9个时期、15个系列、43位人物，151个时间轴阅读节点；全史结构图采用大图标，可横纵滚动。
- 哲学主页提供人物导读、经典阅读入口、可核查出处的人物关系和人物／经典配图。

## 本轮阅读改进

结构图人物与主页使用同一详读窗口；作品和纪事可返回结构图原来的位置、倍率与检索状态。人物概览新增可折叠的同时期纪事入口，日期背景不自动表示人物亲历或思想影响。


## 在 GitHub 找到项目

GitHub 的搜索结果请选择 **Repositories（仓库）**。最准确的检索：

- `yanguang user:LuciusCyrene`
- `言光 user:LuciusCyrene`
- `topic:church-history user:LuciusCyrene`

也可以按主题尝试“圣经时序”“西方哲学史”“教会史”。宽泛关键词可能返回很多项目，匹配不保证排名。项目地址：[LuciusCyrene/yanguang](https://github.com/LuciusCyrene/yanguang)。

Yanguang (言光, Scripture Through Time) is a Chinese interactive Bible atlas, church history timeline and western philosophy reader. Explore biblical places, historical events, philosophers and source-linked reading through draggable timelines, interactive maps and a scrollable overview.

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
'''


def export(destination):
    destination = destination.resolve()
    if destination.exists():
        raise SystemExit('目标目录已存在；请指定新的空路径，避免覆盖备份或公开仓库。')
    if not destination.is_relative_to(ROOT / 'output'):
        raise SystemExit('导出目录必须位于本项目 output 内，避免误写其他工程。')
    repository = Path(subprocess.check_output(['git', 'rev-parse', '--show-toplevel'], cwd=ROOT).decode().strip()).resolve()
    if repository != ROOT:
        raise SystemExit('发行导出必须在项目自身的Git仓库中运行，不能读取父仓库文件列表。')
    paths = subprocess.check_output(['git', 'ls-files', '-z'], cwd=ROOT).decode().split('\0')
    destination.mkdir(parents=True)
    for name in filter(None, paths):
        path = Path(name)
        if name in EXCLUDED or path.parts[0] == 'docs' or name == 'README.md':
            continue
        source = ROOT / path
        if source.is_symlink() or not source.is_file():
            raise SystemExit('不支持的发行文件：' + name)
        target = destination / path
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)

    # Preserve independently authored biographies and typed relations only.
    path = destination / 'dist/data/philosophy-tree.json'
    tree = json.loads(path.read_text())
    tree.update(title='西方哲学史 · 公开阅读资料', nodes=[], rootIds=[], reviews=[],
                source={'topicCount': 0}, editorial=NOTICE,
                publication={'edition': 'public', 'notice': NOTICE, 'originalNotesIncluded': False})
    for figure in tree['figures']:
        figure.update(nodeIds=[], primaryNodeId=None)
        figure['summary'] = figure['summary'].replace('本树的休谟分支连接', '休谟的哲学讨论涉及')
    dump(path, tree)
    path = destination / 'dist/data/philosophy-atlas.json'
    atlas = json.loads(path.read_text())
    for node in atlas['nodes']:
        node.pop('rawRef', None)
    dump(path, atlas)

    # Do not distribute even short local review examples tied to the imported text.
    path = destination / 'scripts/philosophy_tree_notes.py'
    text = path.read_text()
    lines = text.splitlines(keepends=True)
    for node in ast.parse(text).body:
        if isinstance(node, ast.Assign) and any(isinstance(t, ast.Name) and t.id == 'REVIEWS' for t in node.targets):
            lines[node.lineno - 1:node.end_lineno] = ['REVIEWS = []  # 原始笔记的审阅材料未随公开版发布。\n']
            break
    path.write_text(''.join(lines))
    (destination / 'README.md').write_text(public_readme())

    # Refuse common credential formats, personal absolute paths or accidental archives.
    patterns = [rb'gh[pousr]_[A-Za-z0-9]{30,}', rb'github_pat_[A-Za-z0-9_]{30,}',
                rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----', rb'/' + rb'Users/[^/\s]+/']
    bad = []
    for file in destination.rglob('*'):
        if not file.is_file():
            continue
        if file.suffix.lower() in {'.pdf', '.doc', '.docx', '.emmx', '.pem', '.key'}:
            bad.append(str(file.relative_to(destination)))
        if file.suffix.lower() not in {'.webp', '.png', '.jpg', '.jpeg'}:
            content = file.read_bytes()
            if any(re.search(pattern, content) for pattern in patterns):
                bad.append(str(file.relative_to(destination)))
    if bad:
        raise SystemExit('导出检查未通过，仅报告路径：' + ', '.join(sorted(set(bad))))
    manifest = {
        'edition': 'public', 'originalNotesIncluded': False, 'originalTopicCountExcluded': 5676,
        'excludedMaterials': ['local documents', 'native mind map', 'screenshots', 'raw outline', 'development Git history'],
        'files': {str(p.relative_to(destination)): hashlib.sha256(p.read_bytes()).hexdigest()
                  for p in sorted(destination.rglob('*')) if p.is_file()},
    }
    dump(destination / 'PUBLIC_RELEASE.json', manifest)
    print(f'公开版已导出：{destination.name}；{len(manifest["files"])} 个文件，原始笔记0条；未复制Git历史。')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('destination', type=Path, help='项目 output 内尚不存在的目录')
    export(parser.parse_args().destination)
