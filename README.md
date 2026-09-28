# Ji_Feng — A small world

[在线预览](https://jialep38-png.github.io/my-world-blog-redesign-preview/?v=6)

个人博客的第六版独立设计预览。保留纸色、深绿与橙色交互，以错位大字与折带重排首屏，串起精选随笔、技术笔记与完整阅读页。原站 [2006038.xyz](https://2006038.xyz/) 与原仓库部署保持不变。

## 内容组织

首页按简介、近期文章、精选项目、收藏、关于展开。右上角 EN / 中切换界面并保存选择；中文模式使用独立字号与宋体标题，原中文文章正文保留原文。

- **Journal**：七篇真实文章的条目，支持 Notes / Building 筛选。首页精选恢复写作、证据检索、入口可靠性三篇；桌面悬停或键盘聚焦时，纸张预览同步更换。
- **Reading**：六篇完整短文，正文保留原中文，界面可中英切换。支持直接文章链接、目录、预计阅读时间、前后篇与原文入口；长篇机会日报继续链接原站归档。正文由原始 Markdown 生成，未重写。
- **Work**：arXiv Reader 与 Webcoding 的概念封面和项目入口；封面是排版图形，不是产品界面截图。
- **Collection**：五件已有星球作品，可切换查看；三维入口连接原站。
- **About**：简短介绍与公开链接。
- **Working notes**：论文雷达、本机工具、证据检索三则笔记；每则有三步流程、可点击的技术细节、关键取舍及原文入口。内容出处见 [CONTENT-SOURCES.md](CONTENT-SOURCES.md)。

## 视觉与交互

- AVA 式数字进度与竖线开场，向上揭幕后，铜色折带从像素状态变清晰。参数曲面随指针与滚动改变姿态；无外部模型依赖，WebGL 不可用时显示 SVG 回退。
- 两幕横向项目展示、内部视差、连续细线、橙色索引，以及从 GoodFella 数字堆栈结构改写的滚动序号。手机及减少动态模式直接纵排。
- 收束线连接深色收藏区；移植 Nfinite 的噪声延迟与插值逻辑，用 GPU 将折带扩散成全屏点云，再聚成起伏纸面。
- 三层色纸错位翻页、逐字标题入场、菜单揭幕、收藏图片翻转；页尾空白区有图片轨迹，文字与操作区隔离。
- 首屏固定后由随笔纸页覆盖；文章行、作品、收藏和阅读段落在进入视野时错层展开。首页底部可前后翻章，CTA 与回到顶部也采用纸页过渡。
- 技术笔记在宽且高的视口内随滚动翻页；手机、低高度窗口与减少动态模式通过按钮切换。流程节点可点开查看输入、处理与输出。
- 减少动态模式关闭开场、翻页、逐字入场、鼠标轨迹和自动旋转，保留全部内容与导航。
- 首屏标题与折带叠合；减少装饰性小字，扩大手机点击区域。开场与翻页缩短等待；项目、连接段和点云减少滚动里程。阅读页目录跟随实际章节，离开文章时恢复原列表的位置。

英文字体使用 Manrope 与 Instrument Serif；中文正文与导航使用 Noto Sans SC，标题与阅读页使用 Noto Serif SC。字体按当前字符生成子集并自托管，版权与 OFL 许可证在 [fonts](fonts/) 目录中。具体移植文件、原创部分和适配说明见 [MOTION-SOURCES.md](MOTION-SOURCES.md)。

## 本地运行

```sh
python -m http.server 8847 --bind 127.0.0.1
```

在本目录启动后打开 `http://127.0.0.1:8847/`。没有前端构建依赖。修改文案后运行 `python scripts/prepare-fonts.py` 更新字体子集；中文按字符范围拆分并按需加载。此维护步骤需要网络，网站运行不请求外部字体服务。

原文更新后运行 `python scripts/prepare-reading.py ../my-world-blog/src/content/essay`，再更新字体。文章维护脚本使用 Python-Markdown；生成后的站点没有此运行依赖。`reading-data.js` 记录六个原始文件的 SHA-256。

## 参考与范围

构图与动效研究来自 Good Fella、AVA SRG、Nfinite、Bürocratik 18，以及此前指定的色面转场参考。内容组织另参考 [Paco](https://paco.me/)、[Brian Lovin](https://brianlovin.com/)、[Rauno](https://rauno.me/) 与 [Lee Robinson](https://leerob.com/)。不包含参考站的商业字体、品牌图像或模型。

星球图像来自 [原博客仓库](https://github.com/jialep38-png/my-world-blog)，保留原有权利。英文文章标题为导航用简译，文章内容与日期取自原站。

设计以 Awwwards、FWA、CSS Design Awards 每日获奖作品的完成度为目标，未参赛、未获评，不展示奖项徽章或虚构评分。具体评审依据见 [Awwwards](https://www.awwwards.com/about-evaluation/) 与 [CSSDA](https://www.cssdesignawards.com/about)。

预览尚未迁移全部文章、搜索、主题切换或原站三维查看器。项目详情与三维查看连接正式博客。当前仓库不配置自定义域名，页面设置 `noindex`；GitHub Pages 从 `main` 分支根目录发布。第五版保存在提交 `51bd11f`，正式站替换须待视觉验收。
