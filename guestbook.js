(() => {
  const section = document.querySelector('#guestbook');
  if (!section) return;
  const status = document.querySelector('#guestbook-status');
  const retry = document.querySelector('#guestbook-retry');
  const root = document.querySelector('#guestbook-comments');
  let board;
  let loading = false;
  let watchdog;

  function failed() {
    clearTimeout(watchdog);
    loading = false;
    status.textContent = '留言板暂时没连上，稍后再试一下。';
    status.hidden = false;
    retry.hidden = false;
  }

  function ready() {
    clearTimeout(watchdog);
    loading = false;
    status.hidden = true;
    retry.hidden = true;
  }

  function mount() {
    board = window.Artalk.init({
      el: root,
      server: 'https://comments.ultra-x.top',
      site: '樾的个人页',
      // Stable across query strings, section anchors, and the old site URL.
      pageKey: '/#guestbook',
      pageTitle: '樾的留言板',
      locale: 'zh-CN',
      darkMode: false,
      emoticons: false,
      pvAdd: false,
      versionCheck: false,
      avatarURLBuilder: () => 'assets/mark.svg',
    });
    board.on('mounted', () => {
      const user = board.ctx.inject('user');
      // Artalk requires an email-shaped internal identifier. Generate one on
      // this device so guests don't have to provide any real email address.
      if (!user.getData().email) {
        user.update({ email: `guest-${crypto.randomUUID()}@guest.invalid` });
      }
      const name = root.querySelector('input[name="name"]');
      const email = root.querySelector('input[name="email"]');
      const link = root.querySelector('input[name="link"]');
      name.setAttribute('aria-label', '你的昵称');
      name.placeholder = '你的昵称';
      name.maxLength = 40;
      name.autocomplete = 'nickname';
      email.value = user.getData().email;
      email.hidden = true;
      link.hidden = true;
      const textarea = root.querySelector('textarea');
      textarea.setAttribute('aria-label', '想留下的话');
      textarea.maxLength = 2000;
    });
    board.on('list-fetched', result => { if (!result.error) ready(); });
    board.on('list-failed', failed);
  }

  function load() {
    if (loading) return;
    loading = true;
    status.textContent = '正在翻开留言本……';
    status.hidden = false;
    retry.hidden = true;
    watchdog = setTimeout(failed, 20000);
    if (board) {
      try { board.reload(); } catch { failed(); }
      return;
    }
    if (window.Artalk) {
      try { mount(); } catch { failed(); }
      return;
    }
    const script = document.createElement('script');
    script.src = 'assets/vendor/artalk/Artalk.js?v=2.10.0';
    script.onload = () => {
      try { mount(); } catch { failed(); }
    };
    script.onerror = () => { script.remove(); failed(); };
    document.head.append(script);
  }

  retry.addEventListener('click', load);
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some(entry => entry.isIntersecting)) {
        observer.disconnect();
        load();
      }
    }, { rootMargin: '400px' });
    observer.observe(section);
  } else {
    load();
  }
})();
