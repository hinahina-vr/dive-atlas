export async function prepareOffline(status, installButton, installHelp) {
  const enabled = document.querySelector('meta[name="owd-offline"]')?.content === 'enabled';
  if (!enabled || !window.isSecureContext || !navigator.serviceWorker) return;
  const service = navigator.serviceWorker;
  const workerUrl = new URL('./offline-worker.js', import.meta.url);
  const controlled = () => service.controller?.scriptURL === workerUrl.href;
  status.hidden = false;
  const standalone = matchMedia('(display-mode: standalone)');
  let installPrompt;
  let installed = false;

  function showInstallHelp(open) {
    installHelp.hidden = !open;
    installButton.setAttribute('aria-expanded', String(open));
  }

  function updateInstall() {
    const ready = status.dataset.state === 'ready';
    installButton.hidden = !ready || standalone.matches || navigator.standalone === true || installed;
    if (installButton.hidden) showInstallHelp(false);
  }

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installPrompt = event;
  });
  window.addEventListener('appinstalled', () => {
    installed = true;
    installPrompt = null;
    updateInstall();
  });
  standalone.addEventListener('change', updateInstall);
  installButton.addEventListener('click', async () => {
    if (!installPrompt) {
      showInstallHelp(installHelp.hidden);
      return;
    }
    const prompt = installPrompt;
    installPrompt = null;
    showInstallHelp(false);
    try {
      await prompt.prompt();
      if ((await prompt.userChoice).outcome === 'accepted') {
        installed = true;
        updateInstall();
      }
    } catch {
      showInstallHelp(!installButton.hidden);
    }
  });

  for (const link of document.querySelectorAll('.masthead a')) {
    link.addEventListener('click', event => {
      if (status.dataset.state !== 'offline') return;
      event.preventDefault();
      status.textContent = 'オフラインで練習中。地図は通信が戻ると開けます。';
    });
  }

  function show(state, message) {
    status.dataset.state = state;
    status.textContent = message;
    updateInstall();
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
