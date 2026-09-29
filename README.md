# JI_FENG — follow.art adaptation preview

[在线预览](https://jialep38-png.github.io/my-world-blog-redesign-preview/?v=8)

这是个人博客第八版的独立预览。视觉骨架直接取自用户提供的 follow.art 本地复刻代码：橙／粉／绿／蓝色面、Hardbop 巨幅标题、Heading Now 正文、五拍开场、滚动叠层、对角漂移与卷帘式文字入场。品牌、文案、文章、项目和图片均已换为 Ji_Feng 自己的内容；正式站 [2006038.xyz](https://2006038.xyz/) 尚未替换。

## 页面

- 首页：橙色开场、粉色随笔、绿色作品、蓝色小星球、橙色收束。桌面使用叠层覆盖与对角漂移，手机改为自然滚动及章节入场；章节链接使用统一色面转场。作品页加入三条工程方法索引，收尾页加入三条可阅读的技术现场笔记；修复了桌面末尾多出的整屏空白。
- 随笔：十一条真实内容，按 Building / Notes 筛选。十篇文章可在预览内完整阅读，长篇机会日报链接原站。
- 阅读：保留原中文正文、章节目录、上／下篇和原文链接；英文标题是导航用译名，正文没有机器翻译。
- 作品与收藏：两个实际项目、三则技术相关入口、三条工程方法索引、三张收尾笔记卡，以及五件原有星球图像。项目详情和三维作品链接正式站。
- EN / 中：界面语言可切换且记住选择；中文使用自托管 Noto Sans SC 子集。减少动态模式关闭开场和位移转场，内容与导航照常可用。

## 代码与素材来源

[`follow/tokens.css`](follow/tokens.css)、[`follow/motion.css`](follow/motion.css) 从用户提供的 `follow-art/replica` 直接复制；[`follow/motion.js`](follow/motion.js) 复制后只调整入场揭示范围及对角漂移归位。个人博客的结构、响应式适配、路由和阅读交互位于 [`index.html`](index.html)、[`follow-blog.css`](follow-blog.css)、[`follow-blog.js`](follow-blog.js)。复制关系与适配边界见 [`MOTION-SOURCES.md`](MOTION-SOURCES.md)。没有发布参考站的商标、第三方人物照片、登录组件或原站镜像包。

Hardbop 和 Heading Now 的 WOFF2 来自用户提供的本地复刻目录，**按用户确认的个人网站 Web 授权接入**；若授权文件限定域名或交付方式，应以实际授权条款为准。两款字体的授权证明不在公开仓库内。中文回退 Noto Sans SC 遵循仓库内对应 OFL 文件。星球图片来自[原博客](https://github.com/jialep38-png/my-world-blog)。内容出处见 [`CONTENT-SOURCES.md`](CONTENT-SOURCES.md)。

## 本地运行与维护

在本目录运行 `python -m http.server 8847 --bind 127.0.0.1`，打开 `http://127.0.0.1:8847/`。网站无构建依赖。修改中文文案后运行 `python scripts/prepare-fonts.py` 更新子集；它需要网络，但浏览网站不请求外部字体。原文更新后运行 `python scripts/prepare-reading.py ../my-world-blog/src/content/essay`，再重新生成字体。

预览仓库由 GitHub Pages `main` 分支根目录发布，未设置自定义域名，并保留 `noindex`。正式博客的替换等待视觉验收。
