// src/app.js
import { fetchTitles } from './api.js';
import { initCatalog } from './components/catalog.js';
import { initModals } from './components/modal.js';

/**
 * Инициализация всего SPA приложения после загрузки DOM.
 */
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  initModals();
  setupEventListeners();

  const gridContainer = document.getElementById('titles-grid');
  
  // Показываем прелоадер перед загрузкой данных
  if (gridContainer) {
    gridContainer.innerHTML = `
      <div class="preloader-wrap" style="grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; color: var(--text-muted);">
        <div class="spinner" style="width: 40px; height: 40px; border: 3px solid #282828; border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 12px;"></div>
        <span style="font-size: 0.95rem;">Загрузка проектов NBF Team...</span>
      </div>
    `;
  }

  try {
    // Получаем каталог с FastAPI (или из fallback db.json)
    const titlesData = await fetchTitles();
    
    // Инициализируем отрисовку каталога
    initCatalog(titlesData);
  } catch (error) {
    console.error('Ошибка инициализации приложения:', error);
    if (gridContainer) {
      gridContainer.innerHTML = `
        <div class="error-state" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--tag-red);">
          <p style="font-size: 1.2rem; font-weight: bold; margin-bottom: 8px;">⚠️ Ошибка загрузки каталога</p>
          <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 16px;">${error.message}</p>
          <button onclick="location.reload()" class="btn-secondary" style="padding: 8px 16px;">Попробовать снова</button>
        </div>
      `;
    }
  }
});

/**
 * Управление светлой / темной темой с сохранением в localStorage.
 */
function initTheme() {
  const themeBtn = document.getElementById('theme-toggle-btn');
  const savedTheme = localStorage.getItem('nbf_theme') || 'dark';
  
  document.documentElement.setAttribute('data-theme', savedTheme);
  if (themeBtn) {
    themeBtn.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    
    themeBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('nbf_theme', newTheme);
      themeBtn.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    });
  }
}

/**
 * Глобальные слушатели интерфейса (например, кнопка админки и закладок).
 */
function setupEventListeners() {
  const adminBtn = document.getElementById('admin-btn');
  if (adminBtn) {
    adminBtn.addEventListener('click', () => {
      alert('⚙️ Для перехода в админ-панель воспользуйтесь командой /add_title в Telegram-боте или авторизуйтесь как Renayem.');
    });
  }

  const bookmarksBtn = document.getElementById('bookmarks-btn');
  if (bookmarksBtn) {
    bookmarksBtn.addEventListener('click', () => {
      showBookmarksModal();
    });
  }
}

/**
 * Отрисовывает модальное окно со списком сохраненных закладок пользователя.
 */
function showBookmarksModal() {
  const modal = document.getElementById('title-modal');
  const modalBody = document.getElementById('modal-body');
  if (!modal || !modalBody) return;

  try {
    const bookmarks = JSON.parse(localStorage.getItem('nbf_bookmarks') || '[]');
    
    if (bookmarks.length === 0) {
      modalBody.innerHTML = `
        <div style="text-align: center; padding: 40px 20px;">
          <h2 style="color: var(--accent); margin-bottom: 12px;">📑 Ваши закладки</h2>
          <p style="color: var(--text-muted);">Вы еще не добавили ни одного проекта в закладки.</p>
        </div>
      `;
    } else {
      let listHtml = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; margin-top: 16px;">';
      
      bookmarks.forEach(b => {
        listHtml += `
          <div class="card" onclick="location.reload()" style="cursor: pointer;">
            <div class="card-img-wrap" style="padding-top: 140%; position: relative; overflow: hidden; border-radius: 6px;">
              <img src="${b.cover}" alt="${b.title}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;" />
            </div>
            <div style="padding: 8px; font-weight: bold; font-size: 0.85rem; text-align: center;">${b.title}</div>
          </div>
        `;
      });
      listHtml += '</div>';

      modalBody.innerHTML = `
        <div>
          <h2 style="color: var(--accent); margin-bottom: 12px;">📑 Ваши закладки (${bookmarks.length})</h2>
          <p style="color: #aaa; font-size: 0.85rem;">Нажмите на карточку, чтобы вернуться в общий каталог и открыть проект.</p>
          ${listHtml}
        </div>
      `;
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  } catch (e) {
    console.error('Ошибка чтения закладок:', e);
  }
}
