# 第三方素材、地图与资料

本说明随公开发行包提供，不替代每幅图片或每组数据的原许可。公共领域认定、照片作者与原作作者应分别理解。署名不得暗示原作者或机构为本项目背书。

## 图像

目前 35 幅图像的来源记录包括 29 幅标为公共领域、1 幅 CC0、3 幅 CC BY（2.0、2.5、3.0 各一幅）、2 幅 CC BY-SA（2.0、2.5 各一幅）。逐幅作者、作品名、来源文件页、许可链接、转换方式及文件 SHA-256 见：

- [历史图像 21 幅](dist/data/HISTORICAL-IMAGES.md)，结构化记录 `dist/data/historical-media.json`。
- [文化图像 6 幅](dist/data/CULTURE-IMAGES.md)，结构化记录 `dist/data/comparison-reader.json` 中的 `cultureImages`。
- [哲学图像 8 幅](dist/data/PHILOSOPHY-IMAGES.md)，结构化记录 `dist/data/philosophy-gallery.json`。
- [统一逐图清单](dist/data/IMAGE-RIGHTS.md)，包含下载文件路径、署名、许可和处理记录。

本地副本缩小并转换为 WebP，保持原构图；不要将古代作品的公共领域状态自动套用于现代摄影。

`dist/assets/history/08.webp` 是 NYC Wanderer (Kevin Eng) 拍摄的古登堡圣经照片，适用 [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/)，[原始文件页](https://commons.wikimedia.org/wiki/File:Gutenberg_Bible,_Lenox_Copy,_New_York_Public_Library,_2009._Pic_01.jpg)。该图的本地转换副本继续依此许可提供；其相同方式共享条件不被 MIT 覆盖，也不据此把整个软件宣称为 CC BY-SA。

`dist/assets/philosophy/portrait-socrates.webp` 由 Eric Gaba（Wikimedia Commons 用户 Sting）摄影，按 [CC BY-SA 2.5](https://creativecommons.org/licenses/by-sa/2.5/) 提供；[原始文件页](https://commons.wikimedia.org/wiki/File:Socrates_Louvre.jpg)。本地缩小与 WebP 转换副本保持此许可，不能按古代雕像的公共领域状态重新标为公共领域。

## 地图与数据库

- **Natural Earth**：`land.json`、`land-overview.json`、`rivers.json`、`lakes.json` 等自然地理轮廓；由原始地理数据裁剪、简化。Made with Natural Earth，主要作者 Tom Patterson、Nathaniel Vaughn Kelso 及贡献者。[公共领域条款](https://www.naturalearthdata.com/about/terms-of-use/)。
- **Seshat Global History Databank / Cliopatria v0.2.1**：`politics.json`、`politics-church.json`、`politics-world.json`；[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)。本项目按时段筛选、裁剪、简化，并为部分历史解释另作修订；逐项说明见 [政权来源](dist/data/POLITICS-SOURCES.md) 和 [世界篇来源](dist/data/WORLD-CHURCH-SOURCES.md)。[上游数据](https://github.com/Seshat-Global-History-Databank/cliopatria/tree/v0.2.1)。
- **Stephen Smith / OpenBible.info**：旧约地名、候选坐标与经文关联元数据；[地理资料](https://www.openbible.info/geo/)，[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)。本项目筛选、整合候选与标签，保留上游修订、候选及来源字段。见 `ot-gazetteer.json`、`ot-waterways.geojson` 的元数据。
- **© OpenStreetMap contributors**：`ot-waterways.geojson` 的派生水系几何依 [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/) 提供；[版权与贡献者](https://www.openstreetmap.org/copyright)。本项目筛选、转换与整合的该派生数据库保持开放获取，许可不改为 MIT；文件内的 OpenBible 元数据仍为 CC BY 4.0。
- **Mapzen Terrain Tiles / Terrarium**：`terrain.webp` 与旧约局部地形栅格由高程瓦片计算着色、阴影并缩放，非古代地貌复原。署名：Mapzen；欧洲高程使用欧盟资助的 Copernicus / EU-DEM 数据；SRTM、GMTED2010 数据由 USGS 提供；ETOPO1 由 NOAA 提供。[上游完整署名与条款](https://github.com/tilezen/joerd/blob/master/docs/attribution.md)。不暗示原机构背书。

## 外部项目与研究文献

中国历史对照在本地运行时可选择只读挂载独立的 [江山时序](https://github.com/DeanChensj/jiangshan-map) 项目。公开发行包不包含该项目的源代码、地图数据或文献；如使用，请另行取得该项目并遵守其许可证及数据说明。

现代哲学教材、百科和学术网站仅作为阅读与核查来源。正文为本站自行编写的入门叙述，引用与页面定位保留在逐条来源字段中。购买书籍或持有扫描件不等于取得公开复制权。本项目不分发所参考的现代文献扫描、整本译文或原始导图；研究链接不包含对目标网站内容的再许可。
