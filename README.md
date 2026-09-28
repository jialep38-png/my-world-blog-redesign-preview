# Ji_Feng — A small world

[在线预览](https://jialep38-png.github.io/my-world-blog-redesign-preview/?v=3)

个人博客的第三版独立设计预览。以暖灰、墨黑和灰绿为主，橙色仅用于小面积交互提示。原站 [2006038.xyz](https://2006038.xyz/) 与原仓库部署保持不变。

## 内容组织

首页按简介、近期文章、精选项目、收藏、关于展开。英文短标题用于导航和视觉层级，中文保留在真实文章标题与阅读正文中。撤下花田横幅和大字中文口号。

- **Journal**：四篇真实文章的条目，支持 Notes / Building 筛选，一篇带阅读页预览。
- **Work**：arXiv Reader 与 Webcoding 的概念封面和项目入口；封面是排版图形，不是产品界面截图。
- **Collection**：五件已有星球作品，可切换查看；三维入口连接原站。
- **About**：简短介绍与公开链接。

## 视觉与交互

- 短开场、折带雕塑、低幅度指针响应。折带由原生 WebGL 参数曲面生成，无外部模型依赖；WebGL 不可用时显示 SVG 回退。
- 两幕横向项目展示、细线进度与微小橙色索引。手机及减少动态效果模式直接纵排。
- 收束线连接深色收藏区，折带变为粒子，随滚动扩散与聚合。
- 单一纸面换页动作，栏目采用相近色系；页尾留白区有少量图片轨迹，文字与操作区不触发。
- 减少动态效果模式不播放开场、鼠标轨迹或自动转动物件。

英文字体使用 Manrope 与 Instrument Serif；中文使用 Noto Sans SC，阅读页使用 Noto Serif SC。字体按当前字符生成子集并自托管，版权与 OFL 许可证在 [fonts](fonts/) 目录中。

## 本地运行

```sh
python -m http.server 8847 --bind 127.0.0.1
```

在本目录启动后打开 `http://127.0.0.1:8847/`。没有前端构建依赖。修改文案后运行 `python scripts/prepare-fonts.py` 更新字体子集；此维护步骤需要网络，网站运行不请求外部字体服务。

## 参考与范围

构图与动效研究来自 Good Fella、AVA SRG、Nfinite、Bürocratik 18，以及此前指定的色面转场参考。内容组织另参考 [Paco](https://paco.me/)、[Brian Lovin](https://brianlovin.com/)、[Rauno](https://rauno.me/) 与 [Lee Robinson](https://leerob.com/)。不包含参考站的商业字体、品牌图像或模型。

星球图像来自 [原博客仓库](https://github.com/jialep38-png/my-world-blog)，保留原有权利。英文文章标题为导航用简译，文章内容与日期取自原站。

预览尚未迁移全部文章、搜索、主题切换或原站三维查看器。部分详情连接正式博客。当前仓库不配置自定义域名，页面设置 `noindex`；GitHub Pages 从 `main` 分支根目录发布。第二版保存在提交 `c457bf0`，正式站替换须待视觉验收。
