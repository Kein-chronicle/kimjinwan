/* Content metadata is rendered at build time; sharing never fetches another page. */
(() => {
  const dialog = document.querySelector('.share-dialog');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const status = dialog.querySelector('.share-status');
  const input = dialog.querySelector('.share-url');
  const kakaoButton = dialog.querySelector('[data-share-action="kakao"]');
  const key = window.KJW_SHARE_CONFIG?.kakaoJavaScriptKey;
  const en = () => document.documentElement.lang === 'en';
  const say = (ko, english) => { status.textContent = en() ? english : ko; };
  let current, opener, kakaoLoading = false;
  function loadKakao() {
    if (!key || window.Kakao?.isInitialized() || kakaoLoading) return;
    kakaoLoading = true;
    kakaoButton.disabled = true;
    const script = document.createElement('script');
    script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.8.3/kakao.min.js';
    script.integrity = 'sha384-oroumrnFVE0xtgqyDZJARgERibXg2C28380uaUZz2kHDS5CR7tu20eGiOU6GkTpy';
    script.crossOrigin = 'anonymous';
    const failed = () => {
      kakaoLoading = false;
      kakaoButton.disabled = false;
      script.remove();
      if (dialog.open) say('카카오톡을 불러오지 못했어요. 다시 누르거나 링크를 복사해 주세요.', 'Could not load Kakao Talk. Retry or copy the link.');
    };
    script.onload = () => {
      try { if (!window.Kakao.isInitialized()) window.Kakao.init(key); }
      catch { failed(); return; }
      kakaoLoading = false;
      kakaoButton.disabled = false;
    };
    script.onerror = failed;
    document.head.append(script);
  }
  const nativeData = () => ({title: current.title, text: current.description, url: current.url});
  const canNative = () => typeof navigator.share === 'function' && (!navigator.canShare || navigator.canShare(nativeData()));
  async function nativeShare() {
    try { await navigator.share(nativeData()); }
    catch (error) { if (error.name !== 'AbortError') say('공유 창을 열지 못했어요. 링크 복사를 이용해 주세요.', 'Could not open sharing. Please copy the link.'); }
  }
  async function copy() {
    // Capture this URL before the asynchronous clipboard operation.
    const url = current.url;
    let done = false;
    try { await navigator.clipboard.writeText(url); done = true; } catch { /* permission / legacy browser */ }
    if (!dialog.open || current.url !== url) return;
    if (!done) {
      input.focus(); input.select(); input.setSelectionRange(0, input.value.length);
      try { done = document.execCommand('copy'); } catch { /* manual selection remains */ }
    }
    if (!dialog.open || current.url !== url) return;
    if (done) say('링크를 복사했어요.', 'Link copied.');
    else say('자동 복사가 차단됐어요. 아래 선택된 링크를 직접 복사해 주세요.', 'Copy was blocked. Copy the selected link below.');
  }
  document.querySelectorAll('[data-share-url]').forEach(button => {
    button.hidden = false;
    button.addEventListener('click', () => {
      opener = button;
      current = {url: button.dataset.shareUrl, title: button.dataset.shareTitle, description: button.dataset.shareDescription, image: button.dataset.shareImage};
      dialog.querySelector('.share-title').textContent = current.title;
      input.value = current.url;
      status.textContent = '';
      const url = encodeURIComponent(current.url), title = encodeURIComponent(current.title);
      const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      const links = {
        sms: `sms:${ios ? '&' : '?'}body=${encodeURIComponent(current.title + '\n' + current.description + '\n' + current.url)}`,
        naver: `https://share.naver.com/web/shareView?url=${encodeURIComponent(url)}&title=${title}`,
        x: `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      };
      dialog.querySelectorAll('[data-share-service]').forEach(a => { a.href = links[a.dataset.shareService]; });
      dialog.querySelector('[data-share-action="native"]').hidden = !canNative();
      dialog.querySelector('.share-kakao-note').textContent = !key ? (en() ? 'Choose in device sharing' : '기기 공유에서 선택') : '';
      dialog.showModal();
      loadKakao();
    });
  });
  dialog.querySelector('.share-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => opener?.focus());
  dialog.addEventListener('click', event => {
    if (event.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
    }
    const action = event.target.closest('[data-share-action]')?.dataset.shareAction;
    if (action === 'copy') void copy();
    if (action === 'native') void nativeShare();
    if (action === 'kakao') {
      if (!key) {
        if (canNative()) void nativeShare();
        else say('이 브라우저에서는 카카오톡 공유를 열 수 없어요. 링크를 복사해 카카오톡에 붙여 넣어 주세요.', 'Kakao Talk sharing is unavailable here. Copy the link and paste it into Kakao Talk.');
      } else if (!window.Kakao?.isInitialized()) {
        loadKakao();
        say('카카오톡을 불러오는 중이에요. 잠시 후 다시 눌러 주세요.', 'Loading Kakao Talk. Please try again shortly.');
      } else {
        try {
          window.Kakao.Share.sendDefault({objectType: 'feed', content: {
            title: current.title.slice(0, 200), description: current.description.slice(0, 200), imageUrl: current.image,
            link: {mobileWebUrl: current.url, webUrl: current.url},
          }, buttons: [{title: '콘텐츠 보기', link: {mobileWebUrl: current.url, webUrl: current.url}}]});
        } catch { say('카카오톡 공유를 열지 못했어요. 링크 복사를 이용해 주세요.', 'Could not open Kakao Talk. Please copy the link.'); }
      }
    }
  });
  input.addEventListener('click', () => input.select());
})();
