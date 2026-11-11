// 兼容旧组件的统计与会话读取；本地页面不提供账号、下载或联网业务。
window.HG_SDK = {
  SDK_TYPE: 'HG',
  ETL: { event() {}, instance: { setPageProperties() {} } },
  AK: {
    async insertFooter(element) {
      const response = await fetch('/footer.html');
      element.innerHTML = await response.text();
    },
  },
  User: {
    UI: {
      checkSession(_options, callback) { callback(1, null); },
    },
    logout: async () => {},
  },
};

// 完整宣传片以用户选择的本地循环片段代替，封面和目录保持原样。
const initializeVideo = (video) => {
  if (video.getAttribute('src') !== '/local-preview.mp4') return;
  video.loop = true;
  video.muted = true;
  video.dataset.localPreview = 'true';
  const wrapper = video.parentElement;
  if (wrapper && !wrapper.querySelector('.local-preview-label')) {
    const label = document.createElement('span');
    label.className = 'local-preview-label';
    label.textContent = '循环演示';
    label.style.cssText = 'position:absolute;right:12px;bottom:12px;z-index:8;padding:4px 8px;background:rgba(0,0,0,.65);color:#fff;font:12px sans-serif;pointer-events:none';
    wrapper.append(label);
  }
};
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('video').forEach(initializeVideo);
  new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === 'attributes' && record.target.tagName === 'VIDEO') initializeVideo(record.target);
      for (const node of record.addedNodes) {
        if (node.nodeType !== 1) continue;
        if (node.tagName === 'VIDEO') initializeVideo(node);
        node.querySelectorAll?.('video').forEach(initializeVideo);
      }
    }
  }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
});
