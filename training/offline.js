export async function prepareOffline(status) {
  const enabled = document.querySelector('meta[name="owd-offline"]')?.content === 'enabled';
  if (!enabled || !window.isSecureContext || !navigator.serviceWorker) return;
  const service = navigator.serviceWorker;
  const workerUrl = new URL('./offline-worker.js', import.meta.url);
  const controlled = () => service.controller?.scriptURL === workerUrl.href;
  status.hidden = false;

  function show(state, message) {
    status.dataset.state = state;
    status.textContent = message;
  }

  function showConnection() {
    if (!controlled()) return;
    if (navigator.onLine) show('ready', 'オフラインで使えます');
    else show('offline', 'オフラインで練習中');
  }

  window.addEventListener('online', showConnection);
  window.addEventListener('offline', showConnection);
  service.addEventListener('controllerchange', showConnection);
  if (controlled()) showConnection();
  else show('preparing', 'オフライン用に保存中…');

  try {
    const registration = await service.register(workerUrl, { scope: './', updateViaCache: 'none' });
    function watchInstallation() {
      const worker = registration.installing;
      worker?.addEventListener('statechange', () => {
        if (!controlled() && worker.state === 'redundant') show('failed', 'オフライン用に保存できませんでした');
      });
    }
    watchInstallation();
    registration.addEventListener('updatefound', watchInstallation);
    showConnection();
  } catch {
    if (!controlled()) show('failed', 'オフライン用に保存できませんでした');
  }
}
