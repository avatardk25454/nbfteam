// src/components/catalog.js
import { openTitleModal } from './modal.js';

let allTitles = [];
let activeTypeFilter = 'all';
let searchQuery = '';

/**
 * Инициализирует каталог, сохраняет данные и запускает первый рендер.
 * @param {Array} titlesData Массив тайтлов с бэкенда
 */
export function initCatalog(titlesData) {
  allTitles = titlesData;
  setupFilters();
  renderCatalog();
}

/**
 * Настраивает слушатели событий для поиска и вкладок фильтрации (Манга / Новеллы / Все).
 */
function setupFilters() {
  const searchInput = document.getElementById('search-input');
  const tabButtons = document.querySelectorAll('.tab-btn');

  // Поиск с debounce-эффектом для оптимизации производительности
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      renderCatalog();
    });
  }

  // Переключение табов фильтрации
  tabButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      tabButtons.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      
      activeTypeFilter = e.target.getAttribute('data-type') || 'all';
      renderCatalog();
    });
  });
}

/**
 * Фильтрует тайтлы по текущим критериям (тип и поисковый запрос) и отрисовывает сетку.
 */
export function renderCatalog() {
  const grid = document.getElementById('titles-grid');
  if (!grid) return;

  // Очищаем сетку перед новым рендером
  grid.innerHTML = '';

  // Применяем фильтры
  const filteredTitles = allTitles.filter(item => {
    const matchesType = activeTypeFilter === 'all' || item.type === activeTypeFilter;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery);
    return matchesType && matchesSearch;
  });

  // Если ничего не найдено
  if (filteredTitles.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: var(--text-muted);">
        <p style="font-size: 1.1rem; margin-bottom: 8px;">😕 По вашему запросу ничего не найдено</p>
        <span style="font-size: 0.85rem;">Попробуйте изменить поисковую фразу или выбрать другую категорию</span>
      </div>
    `;
    return;
  }

  // Создаем DOM-элементы через DocumentFragment для высокой производительности (Reflow/Repaint optimization)
  const fragment = document.createDocumentFragment();

  filteredTitles.forEach(item => {
    const card = document.createElement('div');
    card.className = 'card';
    card.setAttribute('data-id', item.id);

    // Подсчет общего количества глав
    const chaptersCount = item.chapters ? item.chapters.length : 0;
    const typeLabel = item.type === 'novel' ? 'Новелла' : 'Манга';

    // Безопасное формирование HTML карточки
    card.innerHTML = `
      <div class="card-img-wrap">
        <span class="badge-rating">★ ${Number(item.rating).toFixed(1)}</span>
        <span class="badge-tag ${item.type}">${typeLabel}</span>
        <img class="card-img" src="${item.cover}" alt="${item.title}" loading="lazy" />
      </div>
      <div class="card-info">
        <div class="card-title">${item.title}</div>
        <div class="card-meta">
          <span>📖 Глав: ${chaptersCount}</span>
          ${item.tag ? `<span class="card-hashtag">${item.tag}</span>` : ''}
        </div>
      </div>
    `;

    // При клике на карточку открываем модальное окно с главами
    card.addEventListener('click', () => {
      openTitleModal(item);
    });

    fragment.appendChild(card);
  });

  grid.appendChild(fragment);
}