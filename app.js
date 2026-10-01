(() => {
  "use strict";
  const content = window.PORTFOLIO_CONTENT || { name: "樾", photos: [] };
  const preview = new URLSearchParams(window.location.search).get("preview") === "1";
  const gallery = document.getElementById("photo-gallery");
  const status = document.getElementById("gallery-status");
  const photoDialog = document.getElementById("photo-dialog");
  const photoImage = document.getElementById("photo-dialog-image");
  const records = new Map();
  let filter = "all";
  let lastFocus = null;

  document.querySelectorAll("[data-content]").forEach(node => {
    const value = content[node.dataset.content];
    if (typeof value === "string") node.textContent = value;
  });
  document.querySelectorAll("[data-year]").forEach(node => { node.textContent = new Date().getFullYear(); });
  const tools = document.querySelector(".preview-tools");
  if (tools) tools.hidden = !preview;

  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  function openDialog(dialog) {
    if (!dialog || dialog.open) return;
    lastFocus = document.activeElement;
    dialog.showModal();
    document.body.classList.add("modal-open");
  }
  document.querySelectorAll("dialog").forEach(dialog => {
    dialog.querySelectorAll("[data-close-dialog]").forEach(button => button.addEventListener("click", () => dialog.close()));
    dialog.addEventListener("click", event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
    dialog.addEventListener("close", () => {
      document.body.classList.remove("modal-open");
      if (dialog === photoDialog && photoImage) photoImage.removeAttribute("src");
      if (lastFocus && lastFocus.isConnected) lastFocus.focus({ preventScroll: true });
    });
  });
  document.querySelectorAll("[data-open-demo]").forEach(button => button.addEventListener("click", () => openDialog(document.getElementById("demo-dialog"))));

  function placeholder(record) {
    const art = make("div", `photo-placeholder ${record.data.shape}`);
    const label = make("div", "placeholder-label");
    label.append(make("span", "", record.data.number), make("span", "", "作品待加入 / FRAME IN PROGRESS"));
    art.append(label);
    return art;
  }
  function paint(record) {
    const src = record.localUrl || record.data.image;
    record.visual.replaceChildren();
    record.visual.disabled = !src;
    record.visual.setAttribute("aria-label", src ? `查看照片：${record.data.title}` : `${record.data.title}，摄影作品尚未加入`);
    if (src) {
      const image = make("img");
      image.alt = record.data.alt || `${record.data.title}，本地选择的预览照片`;
      image.src = src;
      image.loading = "lazy";
      image.addEventListener("error", () => {
        record.visual.replaceChildren(placeholder(record));
        record.visual.disabled = true;
        record.feedback.textContent = "照片暂时无法显示，请检查文件。";
        if (status) status.textContent = "有照片暂时无法显示";
      }, { once: true });
      record.visual.append(image);
    } else record.visual.append(placeholder(record));
    record.description.textContent = record.localUrl ? "本地预览 · 照片未上传" : record.data.subtitle;
  }
  function updateFilter() {
    let visible = 0;
    for (const record of records.values()) {
      record.card.hidden = filter !== "all" && record.data.category !== filter;
      if (!record.card.hidden) visible++;
    }
    document.querySelectorAll("[data-filter]").forEach(button => {
      const active = button.dataset.filter === filter;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    if (status) {
      const loaded = [...records.values()].filter(record => !record.card.hidden && (record.localUrl || record.data.image)).length;
      const series = new Set([...records.values()].filter(record => !record.card.hidden).map(record => record.data.series || record.data.id)).size;
      status.textContent = loaded ? `${series} 个系列 · ${loaded} 张${preview ? "照片（含本地试放）" : "作品"}` : `${series} 个系列 · 作品整理中`;
    }
  }
  function loadFile(record, file) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)) {
      record.feedback.textContent = "请选择 JPG、PNG、WebP 或 AVIF 照片。";
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      record.feedback.textContent = "照片超过 12 MB，请先缩小后再试。";
      return;
    }
    const url = URL.createObjectURL(file);
    const check = new Image();
    check.onload = () => {
      if (record.localUrl) URL.revokeObjectURL(record.localUrl);
      record.localUrl = url;
      record.feedback.textContent = "已加入本地预览，点击照片可以放大查看。";
      paint(record);
      updateFilter();
    };
    check.onerror = () => {
      URL.revokeObjectURL(url);
      record.feedback.textContent = "这个文件无法作为照片打开，请换一张。";
    };
    check.src = url;
  }
  if (gallery) {
    for (const data of content.photos) {
      const card = make("article", "photo-card");
      card.dataset.category = data.category;
      const visual = make("button", "photo-visual");
      visual.type = "button";
      if (data.aspectRatio) {
        visual.style.aspectRatio = data.aspectRatio;
        visual.classList.add("photo-original-ratio");
      }
      const metadata = make("div", "photo-meta");
      const copy = make("div");
      const description = make("p");
      copy.append(make("h3", "", data.title), description);
      metadata.append(copy, make("span", "photo-number", data.number));
      const feedback = make("p", "photo-feedback");
      feedback.setAttribute("role", "status");
      const record = { data, card, visual, description, feedback, localUrl: null, input: null };
      records.set(data.id, record);
      card.append(visual, metadata);
      visual.addEventListener("click", () => {
        const src = record.localUrl || data.image;
        if (!src || !photoDialog) return;
        document.getElementById("photo-dialog-title").textContent = data.title;
        photoImage.src = src;
        photoImage.alt = data.alt || `${data.title}，本地选择的预览照片`;
        document.getElementById("photo-dialog-caption").textContent = record.localUrl ? "本地预览 · 尚未上传。这不是已经公开的摄影作品。" : data.caption;
        openDialog(photoDialog);
      });
      if (preview) {
        const input = make("input");
        input.type = "file";
        input.accept = "image/jpeg,image/png,image/webp,image/avif";
        input.hidden = true;
        record.input = input;
        const upload = make("button", "photo-upload", "＋ 试放一张自己的照片");
        upload.type = "button";
        upload.setAttribute("aria-label", `为${data.title}试放一张照片`);
        upload.addEventListener("click", () => input.click());
        input.addEventListener("change", () => loadFile(record, input.files[0]));
        card.append(upload, input, feedback);
      } else card.append(feedback);
      paint(record);
      gallery.append(card);
    }
    updateFilter();
  }
  document.querySelectorAll("[data-filter]").forEach(button => button.addEventListener("click", () => { filter = button.dataset.filter; updateFilter(); }));
  document.querySelectorAll("[data-reset-photos]").forEach(button => button.addEventListener("click", () => {
    if (photoDialog?.open) photoDialog.close();
    for (const record of records.values()) {
      if (record.localUrl) URL.revokeObjectURL(record.localUrl);
      record.localUrl = null;
      if (record.input) record.input.value = "";
      record.feedback.textContent = "";
      paint(record);
    }
    updateFilter();
  }));
  window.addEventListener("pagehide", () => {
    for (const record of records.values()) if (record.localUrl) URL.revokeObjectURL(record.localUrl);
  });
})();
