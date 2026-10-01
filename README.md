# 樾 / Yuè — 个人 Portfolio

原创的温暖杂志式静态网站，包含首页、摄影展区、关于我、AI 电话助手独立案例页、房间改造工作流、兰多卡牌收藏册入口与公开留言板。HTML / CSS / 原生 JavaScript，没有 npm 安装或第三方 CDN；留言功能连接独立自托管的 Artalk 后端。

## 预览

在此目录运行：

```sh
python3 -m http.server 8793 --bind 127.0.0.1
```

打开 `http://127.0.0.1:8793/`。

也可以直接打开 `index.html`（所有资源使用相对路径，不依赖 fetch）。

### 试放自己的照片

打开 `http://127.0.0.1:8793/?preview=1#photography`。

预览模式在每个摄影展位下显示照片选择按钮。照片仅以浏览器 Blob URL 临时展示，不会上传，也不会保存到 localStorage；刷新后恢复已发布的照片。支持 JPG、PNG、WebP、AVIF，单张最多 12 MB。正常浏览模式不显示编辑工具。

## 改内容

- `index.html`：首页简介、项目摘要、关于我。
- `phone-assistant.html`：电话项目的案例叙事、功能、已知限制与后续记录。
- `room-redesign.html`：房间改造完整工作流、目录与原文下载。
- `assets/documents/room-redesign-workflow.md`：用户提供的工作流原文，逐字节保留。
- `lando-collection.html`：兰多卡牌收藏册入口，收录用户提供合照中的三张卡牌，Lights Out 使用用户选用的 AI 增强预览（显式标注，可切换实拍裁切），原片仍保留。下面两张按用户提供的购入描述记录为 Base 与黑白棋盘折；卡号及限编仍待卡背核验。首页封面仍为原创主题插画。
- `collection-cards.json`：三张卡的资料与核验状态。
- `collection.js`：卡牌大图浏览与键盘关闭。
- `content.js`：显示名与摄影栏目。目前展示本人提供的《上海之行》五张照片。
- `styles.css`：视觉风格、桌面/手机布局、弹窗与减少动画偏好。
- `app.js`：摄影筛选、照片大图、交互示意、可选本地试放。
- `guestbook.js`：按需加载 Artalk 留言板，固定留言页面标识，免登录昵称留言与失败重试。
- `assets/vendor/artalk/`：官方 Artalk v2.10.0 客户端及 MIT 许可证，本地托管以避免外部 CDN。

## 留言板

首页 `#guestbook` 为全站共享留言板，服务地址 `https://comments.ultra-x.top`，采用维护中的开源 [Artalk](https://github.com/ArtalkJS/Artalk) v2.10.0。昵称留言无需注册、GitHub 登录或真实邮箱；设备生成的随机 `@guest.invalid` 标识仅用于满足 Artalk 的内部用户字段。公开留言支持回复与点赞，稳定使用 `/#guestbook` 作为页面键，不因网址查询参数或旧链接跳转分裂。

后端独立运行在本机 `yue-guestbook.service`，SQLite 持久保存，仅监听回环地址，通过现有 Cloudflare Tunnel 的独立域名提供 HTTPS；保留其他隧道路由。后端配置、数据库及管理凭据不在本仓库或 Pages 发布包中。管理员可审核、删除或置顶留言；基础图形验证码会在短时间连续操作时启用。未启用真实邮箱收集、邮件通知、上传图片、地理位置徽标或访问统计。

正式添加照片：将你愿意公开的照片放进 `assets/photos/`，在 `content.js` 对应条目填入：

```js
image: "assets/photos/your-photo.jpg",
alt: "真实照片的准确描述",
caption: "你自己确认过的标题、日期或地点"
```

网站收录本人提供的《上海之行》五张摄影作品；未收录录音、通话转写、电话号码、邮箱、联系人或配置凭据。首屏展示本人提供的《上海之行》摄影作品；房间项目配图为原创矢量概念插画，不是真实房间效果图。交互示意是编写的示例，不发起真实电话、模型请求或消息。

电话项目文案基于项目实现与已知运行情况，未引入成功率、用户量、奖项、论文等无依据指标。具体个人贡献、案例文字仍在整理。网站只展示案例，不连接实际电话服务。

## GitHub Pages

本仓库使用 GitHub Pages 免费静态托管，GitHub Actions 从 `main` 自动打包并部署。`scripts/build-pages.py` 仅收录公开静态网站文件，`.nojekyll` 保留原始静态文件。

在线：[个人页面](https://blog.ultra-x.top)。个人页已升为域名首页；旧 `/yue-portfolio/` 页面链接自动跳转到新地址并保留查询参数及章节位置，旧图片和下载地址仍可用。此前停用的博客原始内容仍保留在原仓库，未删除。

提交并推送网站文件后，GitHub Pages 会自动更新。仓库只包含网站展示文件，不包含电话服务代码、聊天记录、部署凭据或浏览器验收材料。
