/* 底部上滑面板与步骤条 */
const sheetTabs = document.querySelectorAll('.sheet-tab');
const stepBtns = document.querySelectorAll('.step');


function showSheetPage(page) {
  sheetTabs.forEach(b => b.classList.toggle('active', b.dataset.page === page));
  document.querySelectorAll('.sheet-page').forEach(el => el.classList.toggle('active', el.dataset.page === page));
  stepBtns.forEach(b => b.classList.toggle('active', b.dataset.page === page));
}

function openSheet(page) {
  sheetEl.classList.add('open');
  sheetMask.classList.add('show');
  sheetEl.setAttribute('aria-hidden', 'false');
  if (page) showSheetPage(page);
}

function closeSheet() {
  sheetEl.classList.remove('open');
  sheetMask.classList.remove('show');
  sheetEl.setAttribute('aria-hidden', 'true');
  stepBtns.forEach(b => b.classList.remove('active'));
}

sheetGrabEl.addEventListener('click', closeSheet);
sheetMask.addEventListener('click', closeSheet);
sheetTabs.forEach(b => b.addEventListener('click', () => showSheetPage(b.dataset.page)));
stepBtns.forEach(b => b.addEventListener('click', () => openSheet(b.dataset.page)));
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(); });
