# 樾 / Yuè — 个人 Portfolio

原创的温暖杂志式静态网站，包含首页、摄影展区、关于我、AI 电话助手独立案例页、房间改造工作流。HTML / CSS / 原生 JavaScript，没有 npm 安装、构建步骤、第三方 CDN、追踪脚本或后端。

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
- `content.js`：显示名与摄影栏目。目前展示本人提供的《上海之行》五张照片。
- `styles.css`：视觉风格、桌面/手机布局、弹窗与减少动画偏好。
- `app.js`：摄影筛选、照片大图、交互示意、可选本地试放。

正式添加照片：将你愿意公开的照片放进 `assets/photos/`，在 `content.js` 对应条目填入：

```js
image: "assets/photos/your-photo.jpg",
alt: "真实照片的准确描述",
caption: "你自己确认过的标题、日期或地点"
```

网站收录本人提供的《上海之行》五张摄影作品；未收录录音、通话转写、电话号码、邮箱、联系人或配置凭据。首屏素材是本项目创建的矢量/代码图形，不是摄影作品。交互示意是编写的示例，不发起真实电话、模型请求或消息。

电话项目文案基于项目实现与已知运行情况，未引入成功率、用户量、奖项、论文等无依据指标。具体个人贡献、案例文字仍在整理。网站只展示案例，不连接实际电话服务。

## GitHub Pages

本仓库使用 GitHub Pages 免费静态托管。部署源为 `main` 分支根目录，`.nojekyll` 保留原始静态文件。

在线：[个人页面](https://blog.ultra-x.top/yue-portfolio/)。本项目沿用账号既有的 GitHub Pages 域名，仅部署在独立的 `/yue-portfolio/` 路径，不覆盖原博客。

提交并推送网站文件后，GitHub Pages 会自动更新。仓库只包含网站展示文件，不包含电话服务代码、聊天记录、部署凭据或浏览器验收材料。
