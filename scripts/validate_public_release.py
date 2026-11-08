#!/usr/bin/env python3
"""Validate public package hashes, omissions, photo attribution and Git history."""
from pathlib import Path
import argparse
import hashlib
import json
import subprocess


def validate(root, audit_git=False):
    manifest = json.loads((root / 'PUBLIC_RELEASE.json').read_text())
    assert manifest['edition'] == 'public' and manifest['originalNotesIncluded'] is False
    banned = {'dist/data/philosophy-tree-original.txt', 'scripts/sources/philosophy-tree-original.txt',
              'scripts/sources/philosophy-tree-archive.json'}
    assert not any((root / p).exists() for p in banned)
    for name, sha in manifest['files'].items():
        path = Path(name)
        assert not path.is_absolute() and '..' not in path.parts
        assert hashlib.sha256((root / path).read_bytes()).hexdigest() == sha, name
    tree = json.loads((root / 'dist/data/philosophy-tree.json').read_text())
    assert tree['nodes'] == [] and tree['reviews'] == [] and tree['rootIds'] == []
    assert tree['publication']['originalNotesIncluded'] is False
    assert not tree['source'].get('textDownload')
    assert len(tree['figures']) == 31 and len(tree['relations']) == 25
    atlas = json.loads((root / 'dist/data/philosophy-atlas.json').read_text())
    assert len(atlas['nodes']) == 151 and all(not n.get('rawRef') for n in atlas['nodes'])
    gallery = json.loads((root / 'dist/data/philosophy-gallery.json').read_text())
    socrates = next(i for i in gallery if i['id'] == 'portrait-socrates')
    assert socrates['license'] == 'CC BY-SA 2.5' and 'Eric Gaba' in socrates['credit']
    assert (root / 'LICENSE').read_text().startswith('MIT License')
    assert all((root / name).is_file() for name in ['LICENSING.md', 'THIRD_PARTY_NOTICES.md',
                                                  'dist/data/RIGHTS.md', 'dist/data/IMAGE-RIGHTS.md'])
    if audit_git:
        def git(*args):
            return subprocess.check_output(['git', '-C', str(root), *args])
        paths = set(git('log', '--all', '--name-only', '--format=').decode().splitlines())
        assert not paths.intersection(banned)
        assert not any(Path(p).suffix.lower() in {'.pdf', '.doc', '.docx', '.emmx', '.pem', '.key'} for p in paths)
        for commit in git('rev-list', '--all', '--', 'dist/data/philosophy-tree.json').decode().splitlines():
            previous = json.loads(git('show', commit + ':dist/data/philosophy-tree.json'))
            assert previous.get('publication', {}).get('edition') == 'public'
            assert previous['nodes'] == [] and previous['reviews'] == []
    print(f'公开发行检查通过：{len(manifest["files"])}个文件哈希、原始资料排除、151节点、图片许可修正' + ('及全部公开Git历史。' if audit_git else '。'))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--audit-git', action='store_true')
    args = parser.parse_args()
    validate(args.root.resolve(), args.audit_git)
