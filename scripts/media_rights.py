"""Manually reviewed photo rights; artwork API metadata can omit photo rights."""


def apply_photo_rights(item):
    if item['id'] == 'portrait-socrates':
        item.update(
            credit='摄影：Eric Gaba（Wikimedia Commons 用户 Sting）；古代雕像：Lysippos 原型的罗马摹本（归属存疑）',
            license='CC BY-SA 2.5',
            licenseUrl='https://creativecommons.org/licenses/by-sa/2.5/',
            rightsNote='古代雕像的公共领域状态不覆盖现代摄影；本地转换照片继续按 CC BY-SA 2.5 提供。',
        )
    elif item['id'] == 'portrait-aristotle':
        item['credit'] = '摄影：Jastrow（2006，摄影者释入公共领域）；雕像：依 Lysippos 原型的罗马摹本'
    return item
