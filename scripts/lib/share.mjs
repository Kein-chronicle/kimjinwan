import {esc, bi} from './render.mjs';

export function shareButton(m) {
  return `<button type="button" class="share-trigger" hidden aria-haspopup="dialog" data-share-url="${esc(m.url)}" data-share-title="${esc(m.title)}" data-share-description="${esc(m.description)}" data-share-image="${esc(m.image)}" aria-label="${esc(m.title)} 공유하기"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4"/></svg>${bi({ko:'공유하기', en:'Share'})}</button>`;
}

export const shareDialog = `<dialog class="share-dialog" aria-labelledby="share-heading">
  <div class="share-heading"><h2 id="share-heading">${bi({ko:'공유하기', en:'Share'})}</h2><button type="button" class="share-close" aria-label="공유 창 닫기">×</button></div>
  <p class="share-title"></p>
  <div class="share-options">
    <button type="button" data-share-action="copy"><b aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="8" y="8" width="12" height="13" rx="3"/><path d="M15 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg></b>${bi({ko:'링크 복사', en:'Copy link'})}</button>
    <button type="button" data-share-action="kakao"><b class="share-kakao" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C6.5 3 2 6.5 2 10.8c0 2.8 1.8 5.2 4.5 6.6L5.4 21l4.3-2.6c.7.1 1.5.2 2.3.2 5.5 0 10-3.5 10-7.8S17.5 3 12 3Z"/></svg></b>${bi({ko:'카카오톡', en:'Kakao Talk'})}<small class="share-kakao-note"></small></button>
    <a data-share-service="sms"><b aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/></svg></b>${bi({ko:'문자', en:'Message'})}</a>
    <a data-share-service="naver" target="_blank" rel="noopener noreferrer"><b class="share-naver" aria-hidden="true">N</b>${bi({ko:'네이버 블로그', en:'Naver Blog'})}</a>
    <a data-share-service="x" target="_blank" rel="noopener noreferrer"><b aria-hidden="true">𝕏</b>X</a>
    <a data-share-service="facebook" target="_blank" rel="noopener noreferrer"><b class="share-facebook" aria-hidden="true">f</b>Facebook</a>
    <button type="button" data-share-action="native" hidden><b aria-hidden="true">•••</b>${bi({ko:'더보기', en:'More'})}</button>
  </div>
  <label class="share-url-label">${bi({ko:'공유 링크', en:'Share link'})}<input class="share-url" readonly></label>
  <p class="share-status" role="status" aria-live="polite"></p>
</dialog>`;
