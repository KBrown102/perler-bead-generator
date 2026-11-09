/* 启动装配：按顺序初始化各模块并载入示例图 */
updateZoomLabel();
updateGridUndoUI();
updateChartZoomLabel();
setGridTool('brush');
makeSample();

/* PWA：注册 Service Worker */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
