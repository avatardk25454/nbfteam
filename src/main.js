// Локальная база данных
let db = JSON.parse(localStorage.getItem('nbf_db')) || [
  {
    id: "5-brides",
    title: "Пять невест (весна, лето, осень, зима)",
    cover: "https://i.pinimg.com/736x/c5/4a/5b/c54a5b9b8b9a136e4f3a9e7011d61e3d.jpg",
    rating: "10.0",
    type: "novel",
    tag: "Любимые",
    volumes: [
      {
        name: "Том 1",
        chapters: [
          { title: "Глава 0 (начальные иллюстрации)", url: "https://t.me/NBF_TEAM/3089" },
          { title: "Глава 1", url: "https://t.me/NBF_TEAM/2979" },
          { title: "Глава 2", url: "https://t.me/NBF_TEAM/2983" }
        ]
      }
    ]
  },
  {
    id: "angel-next-door",
    title: "Ангел по соседству (WN)",
    cover: "https://i.pinimg.com/736x/8a/a6/5c/8aa65c8b9b8b9a136e4f3a9e7011d61e3d.jpg",
    rating: "9.6",
    type: "novel",
    tag: "Перевожу",
    volumes: []
  }
];

let currentFilter = 'all';
let searchQuery = '';

// --- ОТРИСОВКА КАТАЛОГА ТАЙТЛОВ ---
function renderGrid() {
  const grid = document.getElementById('titles-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const filtered = db.filter(item => {
    const matchesType = currentFilter === 'all' || item.type === currentFilter;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  filtered.forEach(item => {
    const card = document.createElement('div');
    card.className = 'card';
    card.onclick = () => openTitleModal(item);

    const typeName = item.type === 'novel' ? 'Новелла' : item.type === 'manga' ? 'Манга' : 'Аниме';

    card.innerHTML = `
      <div class="card-img-wrap">
        <span class="badge-rating">${item.rating}</span>
        ${item.tag ? `<span class="badge-tag ${item.type}">${item.tag}</span>` : ''}
        <img class="card-img" src="${item.cover}" alt="${item.title}" loading="lazy" />
      </div>
      <div class="card-info">
        <div class="card-title">${item.title}</div>
        <div class="card-meta">${typeName} • Команда NBF</div>
      </div>
    `;
    grid.appendChild(card);
  });
}

// --- МОДАЛЬНОЕ ОКНО ПРОСМОТРА ГЛАВ ---
function openTitleModal(item) {
  const modal = document.getElementById('title-modal');
  const body = document.getElementById('modal-body');

  let volumesHtml = '';
  if (item.volumes && item.volumes.length > 0) {
    item.volumes.forEach(vol => {
      let chaptersHtml = '';
      vol.chapters.forEach(ch => {
        chaptersHtml += `
          <li class="chapter-item">
            <a href="${ch.url}" target="_blank">
              <span>📖 ${ch.title}</span> 
              <span style="color:var(--accent); font-size:0.85rem;">Читать в Telegram ➔</span>
            </a>
          </li>`;
      });
      volumesHtml += `
        <div class="volume-block">
          <div class="volume-title">${vol.name}</div>
          <ul class="chapter-list">${chaptersHtml}</ul>
        </div>`;
    });
  } else {
    volumesHtml = '<p style="color:#aaa; margin-top:15px; text-align:center;">Главы для этого тайтла ещё не опубликованы.</p>';
  }

  body.innerHTML = `
    <div style="display:flex; gap:20px; align-items:flex-start; flex-wrap:wrap;">
      <img src="${item.cover}" style="width:130px; border-radius:8px; box-shadow: 0 4px 10px rgba(0,0,0,0.5);" />
      <div style="flex:1; min-width:200px;">
        <h2 style="color:var(--accent); margin-bottom:10px; line-height:1.2;">${item.title}</h2>
        <span class="badge-rating" style="position:static; display:inline-block; margin-bottom:10px;">★ Рейтинг: ${item.rating}</span>
        <p style="color:#aaa; font-size:0.9rem; margin-top:5px;">Все переходы ведут на посты с главами в официальном канале.</p>
      </div>
    </div>
    <hr style="margin: 20px 0; border-color:#333;" />
    <h3 style="margin-bottom:10px;">Доступные тома и главы:</h3>
    ${volumesHtml}
  `;
  modal.classList.add('active');
}

// --- УПРАВЛЕНИЕ ФИЛЬТРАЦИЕЙ И ПОИСКОМ ---
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    currentFilter = e.target.getAttribute('data-type');
    renderGrid();
  });
});

document.getElementById('search-input')?.addEventListener('input', (e) => {
  searchQuery = e.target.value;
  renderGrid();
});

// Закрытие окон
document.getElementById('close-modal').onclick = () => document.getElementById('title-modal').classList.remove('active');
document.getElementById('close-admin').onclick = () => document.getElementById('admin-modal').classList.remove('active');

// --- АДМИН-ПАНЕЛЬ И АВТОРИЗАЦИЯ ---
document.getElementById('admin-btn').onclick = () => {
  document.getElementById('admin-modal').classList.add('active');
  updateSelectTitles();
};

document.getElementById('login-btn').onclick = () => {
  const pass = document.getElementById('admin-pass').value;
  if (pass === 'nbf123') {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('admin-workspace').style.display = 'block';
  } else {
    alert('Неверный пароль доступа!');
  }
};

window.showAdminTab = (tabName) => {
  document.querySelectorAll('.admin-tab').forEach(t => t.style.display = 'none');
  document.getElementById(`tab-${tabName}`).style.display = 'block';
};

function updateSelectTitles() {
  const select = document.getElementById('select-title-for-chapters');
  if (!select) return;
  select.innerHTML = '';
  db.forEach(item => {
    const opt = document.createElement('option');
    opt.value = item.id;
    opt.innerText = item.title;
    select.appendChild(opt);
  });
}

// 1. Ручное добавление тайтла
document.getElementById('save-title-btn').onclick = () => {
  const titleName = document.getElementById('new-title').value.trim();
  if (!titleName) return alert('Укажите название тайтла!');

  const newTitle = {
    id: 'id-' + Date.now(),
    title: titleName,
    cover: document.getElementById('new-cover').value.trim() || 'https://via.placeholder.com/150',
    rating: document.getElementById('new-rating').value || "10.0",
    type: document.getElementById('new-type').value,
    tag: document.getElementById('new-tag').value.trim(),
    volumes: []
  };
  
  db.push(newTitle);
  saveDB();
  alert('Тайтл успешно внесен в локальную базу данных!');
  renderGrid();
  updateSelectTitles();
};

// 2. АВТО-ПАРСЕР ПО API (MangaLib / RanobeLib / HexNovels)
document.getElementById('fetch-lib-btn').onclick = async () => {
  const urlInput = document.getElementById('lib-url-input').value.trim();
  const platform = document.querySelector('input[name="parser-platform"]:checked')?.value || 'lib';

  if (!urlInput) return alert('Вставьте ссылку на страницу тайтла!');

  const btn = document.getElementById('fetch-lib-btn');
  const originalText = btn.innerText;
  btn.innerText = '⌛ Загрузка данных...';
  btn.disabled = true;

  try {
    const urlObj = new URL(urlInput);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    const slug = pathParts[pathParts.length - 1]; 

    if (!slug) throw new Error('Не удалось вырезать слаг тайтла из адреса');

    let apiUrl = '';
    if (platform === 'lib') {
      apiUrl = `https://api.cdnlibs.org/api/manga/${slug}`;
    } else if (platform === 'hex') {
      apiUrl = `https://api.hexnovels.me/v2/novels/${slug}`;
    }

    const proxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(apiUrl)}`;
    const response = await fetch(proxyUrl);
    
    if (!response.ok) throw new Error('Сайт-источник заблокировал запрос или тайтл скрыт');
    
    const json = await response.json();
    const data = json.data || json;

    if (!data || (!data.name && !data.title && !data.rus_name && !data.titleRu)) {
      throw new Error('Ответ от сервера пустой или не содержит нужных полей');
    }

    const titleText = data.rus_name || data.titleRu || data.name || data.title || '';
    document.getElementById('new-title').value = titleText.trim();
    
    let coverUrl = '';
    if (typeof data.cover === 'string') coverUrl = data.cover;
    else if (data.cover?.default) coverUrl = data.cover.default;
    else if (data.coverUrl) coverUrl = data.coverUrl;
    document.getElementById('new-cover').value = coverUrl;

    let ratingVal = '10.0';
    if (data.rating?.average) ratingVal = parseFloat(data.rating.average).toFixed(1);
    else if (data.rating) ratingVal = parseFloat(data.rating).toFixed(1);
    document.getElementById('new-rating').value = ratingVal;

    const typeSelect = document.getElementById('new-type');
    if (platform === 'hex' || urlInput.includes('ranobe') || data.type?.id === 3) {
      typeSelect.value = 'novel';
    } else {
      typeSelect.value = 'manga';
    }

    window.showAdminTab('add');
    alert(`🎉 Данные с ${platform.toUpperCase()} успешно подтянуты: "${titleText}"!`);
  } catch (error) {
    console.error(error);
    alert('Ошибка авто-парсинга по API: ' + error.message + '\n\nИспользуй ручной режим или вкладку Парсер HTML.');
  } finally {
    btn.innerText = originalText;
    btn.disabled = false;
  }
};

// 3. ПАРСЕР ТЕКСТА ИЗ TELEGRAM
document.getElementById('parse-chapters-btn').onclick = () => {
  const rawText = document.getElementById('tg-raw-text').value;
  const targetId = document.getElementById('select-title-for-chapters').value;
  const targetTitle = db.find(t => t.id === targetId);

  if (!targetTitle) return alert('Сначала выберите тайтл для привязки!');
  if (!rawText.trim()) return alert('Текстовое поле пустое!');

  const lines = rawText.split('\n');
  let currentVolume = { name: "Том 1", chapters: [] };
  const volumes = [];

  lines.forEach(line => {
    const cleanLine = line.trim();
    if (cleanLine.startsWith('• Том') || cleanLine.startsWith('Том')) {
      if (currentVolume.chapters.length > 0) volumes.push(currentVolume);
      currentVolume = { name: cleanLine.replace('•', '').trim(), chapters: [] };
    } 
    else if (cleanLine.includes('http')) {
      const matchUrl = cleanLine.match(/(https?:\/\/[^\s)]+)/);
      if (matchUrl) {
        const url = matchUrl[0];
        const title = cleanLine.replace(url, '').replace(/[–—\-()]/g, '').trim();
        currentVolume.chapters.push({ title: title || "Глава", url: url });
      }
    }
  });
  
  if (currentVolume.chapters.length > 0) volumes.push(currentVolume);

  targetTitle.volumes = volumes;
  saveDB();
  alert(`📑 Спарсено томов: ${volumes.length} для "${targetTitle.title}". Сохранено!`);
};

// 4. НАТИВНЫЙ HTML-ПАРСЕР СТРАНИЦЫ
document.getElementById('parse-html-btn').onclick = () => {
  const rawHtml = document.getElementById('html-raw-text').value;
  if (!rawHtml.trim()) return alert('Вставьте HTML код страницы!');
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, 'text/html');

  const title = doc.querySelector('.media-name, .title, h1, h2')?.innerText || '';
  const img = doc.querySelector('img')?.src || doc.querySelector('img')?.getAttribute('data-src') || '';
  const rating = doc.querySelector('.rating, .score')?.innerText || '10.0';

  if (title) document.getElementById('new-title').value = title.trim();
  if (img) document.getElementById('new-cover').value = img.trim();
  if (rating) document.getElementById('new-rating').value = rating.trim();

  window.showAdminTab('add');
  alert('HTML-код успешно разобран. Данные перенесены в форму добавления!');
};

// Служебные функции
function saveDB() {
  localStorage.setItem('nbf_db', JSON.stringify(db));
}

document.getElementById('export-db-btn').onclick = () => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", "db.json");
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};

// Первичный запуск
renderGrid();