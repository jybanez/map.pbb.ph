import { mountApp } from './app.js?v=20261013-select1';
const status = document.getElementById('boot-status');
mountApp().then(() => { status.hidden = true; }).catch(error => {
  console.error('PBB Map startup:', error);
  status.textContent = 'PBB Map could not load its local application assets. Reload this page, or ask the node operator to verify the installation.';
});








