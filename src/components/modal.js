// src/components/modal.js

let activeModal = null;

/**
 * Инициализирует глобальные обработчики закрытия модальных окон 
 * (по клику на оверлей, кнопку закрытия или клавишу Escape).
 */
export function initModals() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && activeModal) {
      closeModal();
    }
  });

  const modalOverlay = document.getElementById('title-modal');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      // Закрываем только при клике на темный фон, а не на контент окна
      if (e.target === modalOverlay) {
        closeModal();
      }
    });
  }

  const closeBtn = document.getElementById('close-modal');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }
}

/**
 * Открывает модальное окно тайтла, отрисовывает информацию и список глав.
 * @param {Object} item Объект тайтла
 */
export function openTitleModal(item) {
  const modal = document.getElementById('title-modal');
  const modalBody = document.getElementById('modal-body');
  if (!modal || !modalBody) return;

  activeModal = modal;

  // Проверяем, находится ли тайтл в закладках
  const bookmarks = getBookmarks();
  const isBookmarked = bookmarks.some(b => b.id === item.id);

  // Группируем главы по томам (от большего к меньшему)
  const chaptersByVolume = groupChaptersByVolume(item.chapters || []);
  const sortedVolumes = Object.keys(chaptersByVolume).sort((a, b) => Number(b) - Number(a));

  // Генерация вкладок для томов
  let volumesTabsHtml = '';
  if (sortedVolumes.length > 0) {
    sortedVolumes.forEach((volNum, index) => {
      volumesTabsHtml += `
        <button class="vol-tab-btn ${index === 0 ? 'active' : ''}" data-volume="${volNum}">
          Том ${volNum}
        </button>
      `;
    });
  }

  // Рендер контента модалки
  modalBody.innerHTML = `
    <div class="title-modal-header" style="display: flex; gap: 20px; align-items: flex-start; flex-wrap: wrap;">
      <img src="${item.cover}" alt="${item.title}" style="width: 130px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); flex-shrink: 0;" />
      <div style="flex: 1; min-width: 200px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
          <h2 style="color: var(--accent); margin-bottom: 8px; font-size: 1.4rem; line-height: 1.2;">${item.title}</h2>
          <button id="toggle-bookmark-btn" class="${isBookmarked ? 'btn-accent' : 'btn-secondary'}" style="padding: 6px 12px; font-size: 0.8rem;">
            ${isBookmarked ? '📑 В закладках' : '📑 В закладки'}
          </button>
        </div>
        
        <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px;">
          <span class="badge-rating" style="position: static;">★ ${Number(item.rating).toFixed(1)}</span>
          <span class="badge-tag ${item.type}" style="position: static;">${item.type === 'novel' ? 'Новелла' : 'Манга'}</span>
          ${item.tag ? `<span style="background: #2a2a2a; color: #ccc; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">${item.tag}</span>` : ''}
        </div>

        <p style="color: #bbb; font-size: 0.9rem; line-height: 1.5;">
          ${item.description || 'Перевод от официальной команды NBF Team. Нажмите на главу, чтобы перейти к чтению в Telegram.'}
        </p>
      </div>
    </div>

    <hr style="margin: 20px 0; border: 0; border-top: 1px solid #282828;" />

    <h3 style="font-size: 1.1rem; margin-bottom: 12px;">📖 Список томов и глав:</h3>
    
    <div class="volume-tabs-container" id="volume-tabs">
      ${volumesTabsHtml || '<span style="color: #777; font-size: 0.85rem;">Тома не найдены</span>'}
    </div>

    <div id="chapters-list-container">
      <!-- Список глав загрузится динамически -->
    </div>
  `;

  // Логика переключения томов
  setupVolumeTabs(chaptersByVolume, sortedVolumes[0]);

  // Логика добавления/удаления из закладок
  const bookmarkBtn = document.getElementById('toggle-bookmark-btn');
  if (bookmarkBtn) {
    bookmarkBtn.addEventListener('click', () => {
      toggleBookmark(item, bookmarkBtn);
    });
  }

  // Открываем модалку с CSS-анимацией
  modal.classList.add('active');
  document.body.style.overflow = 'hidden'; // Блокируем скролл фона
}

/**
 * Закрывает активное модальное окно и возвращает скролл странице.
 */
export function closeModal() {
  if (!activeModal) return;
  activeModal.classList.remove('active');
  activeModal = null;
  document.body.style.overflow = '';
}

/**
 * Группирует массив глав по номеру тома (`volume_num`).
 */
function groupChaptersByVolume(chapters) {
  return chapters.reduce((acc, ch) => {
    const vol = ch.volume_num || 1;
    if (!acc[vol]) acc[vol] = [];
    acc[vol].push(ch);
    return acc;
  }, {});
}

/**
 * Настраивает переключение вкладок томов внутри модального окна.
 */
function setupVolumeTabs(chaptersByVolume, initialVolume) {
  const tabsContainer = document.getElementById('volume-tabs');
  if (!tabsContainer) return;

  const buttons = tabsContainer.querySelectorAll('.vol-tab-btn');
  
  // Отрисовка начального тома
  if (initialVolume) {
    renderChaptersList(chaptersByVolume[initialVolume]);
  } else {
    document.getElementById('chapters-list-container').innerHTML = '<p style="color: #777;">Главы для этого проекта еще не опубликованы.</p>';
  }

  buttons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      buttons.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      
      const volNum = e.target.getAttribute('data-volume');
      renderChaptersList(chaptersByVolume[volNum]);
    });
  });
}

/**
 * Отрисовывает список глав для выбранного тома.
 */
function renderChaptersList(chapters = []) {
  const container = document.getElementById('chapters-list-container');
  if (!container) return;

  if (chapters.length === 0) {
    container.innerHTML = '<p style="color: #777; font-size: 0.9rem;">В этом томе пока нет доступных глав.</p>';
    return;
  }

  let html = '<ul class="chapter-list" style="list-style: none; display: flex; flex-direction: column; gap: 8px; margin-top: 12px;">';
  
  chapters.forEach(ch => {
    html += `
      <li class="chapter-item">
        <a href="${ch.tg_url}" target="_blank" rel="noopener noreferrer" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: var(--bg-card); border-radius: 6px; text-decoration: none; color: #fff; transition: background 0.2s, transform 0.2s;">
          <span style="font-weight: 500; font-size: 0.95rem;">📖 ${ch.chapter_title}</span>
          <span style="color: var(--accent); font-size: 0.8rem; font-weight: 600;">Читать в TG ➔</span>
        </a>
      </li>
    `;
  });

  html += '</ul>';
  container.innerHTML = html;
}

// --- СИСТЕМА ЗАКЛАДОК (LOCALSTORAGE) ---

function getBookmarks() {
  try {
    return JSON.parse(localStorage.getItem('nbf_bookmarks') || '[]');
  } catch {
    return [];
  }
}

function toggleBookmark(item, btnElement) {
  let bookmarks = getBookmarks();
  const index = bookmarks.findIndex(b => b.id === item.id);

  if (index === -1) {
    // Добавляем в закладки (сохраняем минимум данных для экономии места)
    bookmarks.push({ id: item.id, title: item.title, cover: item.cover, type: item.type });
    btnElement.className = 'btn-accent';
    btnElement.innerHTML = '📑 В закладках';
  } else {
    // Удаляем из закладок
    bookmarks.splice(index, 1);
    btnElement.className = 'btn-secondary';
    btnElement.innerHTML = '📑 В закладки';
  }

  localStorage.setItem('nbf_bookmarks', JSON.stringify(bookmarks));
  
  // Создаем кастомное событие, чтобы обновить счетчик закладок в шапке, если нужно
  window.dispatchEvent(new CustomEvent('bookmarksUpdated'));
}