# 古代政权与犹太地区行政覆盖：来源、许可与编纂方法

## 来源与许可

主体轮廓取自 **Seshat Global History Databank, Cliopatria v0.2.1**：

- https://github.com/Seshat-Global-History-Databank/cliopatria/tree/v0.2.1
- https://doi.org/10.1038/s41597-025-04516-9
- 数据许可：**Creative Commons Attribution 4.0 International (CC BY 4.0)**。
- 许可全文：https://creativecommons.org/licenses/by/4.0/

原数据的许可说明：

> This data is licensed under a Creative Commons Attribution 4.0 International License, which permits use, sharing, adaptation, distribution and reproduction in any medium or format, as long as you give appropriate credit to the original author(s) and the source, provide a link to the Creative Commons license, and indicate if changes were made.

原始压缩包的 SHA-256、版本与修订索引保存在 `politics.json` 的 `metadata` 中。

## 本项目的处理与新增内容

1. 按30—62年的有效区间选择记录，裁剪至西经7度至东经48度、北纬10—54度，并简化几何。显示时以现代陆地轮廓作遮罩，以便与现有自然地理底图叠加；这不是古代海岸复原。
2. 保留源数据的 `FromYear` / `ToYear`，在界面中另列源数据时段。逐年选择只是读取适用时段，不能理解为每一年的边界都经独立史料证实。
3. 色雷斯王国在源数据中延至50年。本项目按约46年设省的研究结论，在46—50年将其几何合入罗马，撤去王国单独色块。依据：2023年发表于 Archaeological and Anthropological Sciences 的罗马色雷斯研究，https://link.springer.com/article/10.1007/s12520-023-01920-3 。
4. 源数据60年起把亚美尼亚并入罗马。本项目在60—62年从稳定罗马色块中排除此区域，沿用前期几何作争夺区参照，不宣称掌握逐年实控线；54年起已用斜线强调争夺。解释依据：塔西佗《编年史》第15卷，https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Tacitus/Annals/15A*.html 。
5. **犹太行政区、希律安提帕、腓力、亚基帕一世与二世的覆盖是本项目另行绘制的地区示意**，不是从Cliopatria抽取的精确省界，也不是已配准逐点描摹的古地图。坐标只勾勒犹太、撒马利亚、以土买、加利利、比利亚和东北主要地区之间的关系。
6. 这些地方覆盖的统治分期和地区名称依据约瑟夫斯《犹太古史》18—20卷。几何的每一个顶点不应被理解为这些文字史料给出的精确边界：
   - 第18卷，分封、腓力死后管理与亚基帕早期受封：https://penelope.uchicago.edu/josephus/ant-18.html
   - 第19卷，第5、9章，41年领地扩充与44年恢复罗马管理：https://penelope.uchicago.edu/josephus/ant-19.html
   - 第20卷，第7、8章，53年亚基帕二世受封与后来部分城市转授：https://penelope.uchicago.edu/josephus/ant-20.html
7. 44年是亚基帕一世去世的交接年，本图采用死后局面。此实现没有精确到月日的时间轴。
8. 亚基帕一世王国未细绘阿比利尼、黎巴嫩附近等边缘领地；亚基帕二世未细绘54年以后个别城市和村落的转授，也未另外复原其早期卡尔基斯领地。
9. 以帝国、地方王国、附属领地、内部行政区及争夺区分类。地方色块并不自动表示现代式独立主权；未着色也不表示无人居住或不存在政治组织。
10. 本版没有绘出所有罗马省份。一般区域地名标签与政治边界层相互独立。

每个要素保留 `source`、`sourcePeriod`（适用时）、`changes`、`precision`、`parent` 和本图显示的起讫年，可直接复核。

## 初代教会史的扩展政治层

`politics-church.json` 另选63—451年的224条Cliopatria记录，采用同一版本、许可和署名约定，按扩大范围裁剪与简化。该层主要按源记录显示，不把源数据的每个时段当作逐年独立考证，也不将其教会化。东、西罗马在来源的395年起分列，阿克苏姆、萨珊等政治范围分别显示；它们不是基督徒人口的边界。


## 世界教会史扩展（452—1648年）

`politics-world.json`提供1144条选取政权的分期记录，许可继续为CC BY 4.0。范围、汇总实体处理与限制见[世界篇章说明](WORLD-CHURCH-SOURCES.md)。不是各地信徒人口或教会辖区图，也不提供全部省界与小邦。
