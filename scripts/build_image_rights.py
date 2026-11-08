#!/usr/bin/env python3
"""Generate the complete local image attribution list without fetching images."""
from pathlib import Path
import hashlib
import json
from collections import Counter

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'dist/data'


def main():
    images = json.loads((DATA / 'historical-media.json').read_text())['cards']
    images += json.loads((DATA / 'comparison-reader.json').read_text())['cultureImages']
    images += json.loads((DATA / 'philosophy-gallery.json').read_text())
    unique = {item['image']: item for item in images}
    assert len(unique) == 35
    lines = ['# 图像逐项署名与许可', '',
             '本清单保留原作／摄影署名、图源、许可及本地处理方式；这些素材不改用 MIT。2026年11月8日逐一检查了35幅图像的来源文件页，修正苏格拉底照片的 CC BY-SA 2.5 许可与摄影者署名。公共领域状态仍须结合使用地判断，不构成全球无版权限制的保证。', '',
             '古代作品与现代摄影分别判断；后世肖像不是同时代相貌的直接证据。', '']
    for item in unique.values():
        assert hashlib.sha256((ROOT / 'dist' / item['image']).read_bytes()).hexdigest() == item['sha256']
        lines += ['## ' + item['title'], '', '- 本地文件：`' + item['image'] + '`',
                  '- 作者／摄影／原作署名：' + item['credit'],
                  '- 许可：[' + item['license'] + '](' + item['licenseUrl'] + ')',
                  '- [原始文件与权利记录](' + item['imageSource'] + ')',
                  '- 处理：' + item.get('transform', '保持完整构图，缩小并转换为 WebP。'),
                  '- 校验：`' + item['sha256'] + '`']
        if item.get('rightsNote'):
            lines.append('- 权利区分：' + item['rightsNote'])
        lines.append('')
    (DATA / 'IMAGE-RIGHTS.md').write_text('\n'.join(lines) + '\n')
    print('35 幅唯一图像：' + str(dict(Counter(i['license'] for i in unique.values()))))


if __name__ == '__main__':
    main()
