(() => {
  "use strict";
  const wall = document.querySelector('#vinyl-grid');
  if (!wall) return;
  const records = (window.VINYL_CONTENT?.records || []).filter(record =>
    record && typeof record.title === 'string' && record.title.trim() &&
    typeof record.cover === 'string' && record.cover.startsWith('assets/')
  );
  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const slots = Math.ceil(Math.max(records.length, 6) / 3) * 3;
  for (let index = 0; index < slots; index++) {
    const record = records[index];
    const slot = make('article', 'vinyl-slot');
    const number = String(index + 1).padStart(2, '0');
    const display = make(record ? 'button' : 'div', 'record-display');
    const disc = make('span', 'vinyl-disc');
    disc.setAttribute('aria-hidden', 'true');
    const sleeve = make('span', 'vinyl-sleeve');
    if (record) {
      slot.classList.add('has-record');
      display.type = 'button';
      display.dataset.cardOpen = '';
      display.dataset.cardSrc = record.cover;
      display.dataset.cardTitle = record.title;
      display.dataset.cardSummary = [record.artist, record.note].filter(Boolean).join(' · ');
      display.dataset.cardImageKind = '唱片封面';
      display.setAttribute('aria-label', `放大查看唱片：${record.title}`);
      const image = make('img');
      image.src = record.cover;
      image.alt = `${record.title}${record.artist ? ' · ' + record.artist : ''}，唱片封面`;
      image.width = 600;
      image.height = 600;
      image.loading = 'lazy';
      image.addEventListener('error', () => {
        sleeve.replaceChildren(make('span', 'sleeve-caption', '封面暂时无法显示'));
        display.disabled = true;
        display.setAttribute('aria-label', `${record.title}，封面暂时无法显示`);
      }, { once: true });
      sleeve.append(image);
      const copy = make('div', 'record-copy');
      copy.append(make('span', 'record-number', number), make('h3', '', record.title));
      if (record.artist) copy.append(make('p', '', record.artist));
      if (record.note) copy.append(make('p', 'record-listening-note', record.note));
      slot.append(copy);
    } else {
      slot.classList.add('is-empty');
      display.setAttribute('aria-label', `待收录位置 ${number}`);
      sleeve.append(make('span', 'sleeve-orbit'), make('span', 'sleeve-caption', '下一张\n喜欢。'), make('span', 'sleeve-label', 'COVER / TO BE ADDED'));
      const copy = make('div', 'record-copy');
      copy.append(make('span', 'record-number', number), make('h3', '', '唱片待收录'));
      slot.append(copy);
    }
    display.append(disc, sleeve);
    slot.prepend(display);
    wall.append(slot);
  }
  document.querySelector('#vinyl-count').textContent = `已展示 ${records.length} 张 · ${records.length ? '慢慢收集' : '整理中'}`;
  document.querySelector('#vinyl-empty').hidden = records.length > 0;
  if (records.length) document.querySelector('#vinyl-wall-note').textContent = '点击封面，翻看完整画面。空白位置留给下一张喜欢的唱片。';
  document.querySelector('#vinyl-year').textContent = new Date().getFullYear();
})();
