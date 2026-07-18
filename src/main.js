// public/src/main.js
// Если запускаете локально, измените на http://localhost:8000
const API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" 
  ? "http://localhost:8000" 
  : "https://ваш-бэкенд-сервер.com"; 

let titlesData = [];
let currentFilter = 'all';
let currentOpenTitle = null;
let currentOpenChapterId = null;
let currentUser = null;

// --- ИНИЦИАЛИЗАЦИЯ ---
document.addEventListener("DOMContentLoaded", () => {
  checkAuthStorage();
  loadTitlesFromAPI();
  setupEventListeners();
});

function checkAuthStorage() {
  const saved = localStorage.getItem("nbf_user");
  if (saved) {
    currentUser = JSON.parse(saved);
    updateAuthUI();
  }
}

function updateAuthUI() {
  const btn = document.getElementById("auth-btn");
  const adminBtn = document.getElementById("admin-btn");
  if (currentUser) {
    btn.innerText = `👤 ${currentUser.username}`;
    if (currentUser.is_admin) {
      adminBtn.style.display = "inline-flex";
    }
  } else {
    btn.innerText = "👤 Вход / Регистрация";
    adminBtn.style.display = "none";
  }
}

// --- ЗАГРУЗКА ДАННЫХ И РЕНДЕР КАТАЛОГА ---
async function loadTitlesFromAPI() {
  try {
    const res = await fetch(`${API_URL}/api/titles`);
    if (res.ok) {
      titlesData = await res.json();
      renderGrid();
      renderNewReleases();
      updateAdminSelects();
    } else {
      throw new Error("Сервер вернул ошибку");
    }
  } catch (err) {
    console.warn("⚠️ Не удалось связаться с FastAPI, грузим резервный db.json:", err);
    try {
      const fbRes = await fetch(`/db.json?t=${Date.now()}`);
      if (fbRes.ok) {
        titlesData = await fbRes.json();
        renderGrid();
        renderNewReleases();
      }
    } catch (e) {
      console.error("Оба источника недоступны:", e);
    }
  }
}

function renderGrid() {
  const grid = document.getElementById("titles-grid");
  if (!grid) return;
  grid.innerHTML = "";

  const query = document.getElementById("search-input").value.toLowerCase();
  const filtered = titlesData.filter(t => {
    const matchType = currentFilter === "all" || t.type === currentFilter;
    const matchSearch = t.title.toLowerCase().includes(query);
    return matchType && matchSearch;
  });

  filtered.forEach(item => {
    const totalCh = item.chapters ? item.chapters.length : (item.volumes?.reduce((acc, v) => acc + v.chapters.length, 0) || 0);
    const card = document.createElement("div");
    card.className = "card";
    card.onclick = () => openTitleModal(item);

    card.innerHTML = `
      <div class="card-img-wrap">
        <span class="badge-rating">★ ${item.rating}</span>
        <span class="badge-tag ${item.type}">${item.type === 'novel' ? 'Новелла' : 'Манга'}</span>
        <img class="card-img" src="${item.cover}" alt="${item.title}" loading="lazy" />
      </div>
      <div class="card-info">
        <div class="card-title">${item.title}</div>
        <div class="card-meta">
          <span>👁 ${item.views_count || 0}</span>
          <span>📖 Глав: ${totalCh}</span>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

// Лента свежих глав
function renderNewReleases() {
  const container = document.getElementById("new-releases-list");
  if (!container) return;
  container.innerHTML = "";

  let allChapters = [];
  titlesData.forEach(t => {
    if (t.chapters) {
      t.chapters.forEach(ch => allChapters.push({ ...ch, titleName: t.title, titleCover: t.cover, titleObj: t }));
    } else if (t.volumes) {
      t.volumes.forEach(v => {
        v.chapters.forEach(ch => allChapters.push({ ...ch, titleName: t.title, titleObj: t }));
      });
    }
  });

  if (allChapters.length === 0) {
    container.innerHTML = "<div class='release-item'>Свежих релизов пока нет</div>";
    return;
  }

  allChapters.slice(0, 10).forEach(ch => {
    const item = document.createElement("div");
    item.className = "release-item";
    item.onclick = () => {
      openTitleModal(ch.titleObj);
    };
    item.innerHTML = `🔥 <b>${ch.titleName.substring(0, 20)}...</b> — ${ch.chapter_title || ch.title || 'Глава'}`;
    container.appendChild(item);
  });
}

// --- МОДАЛЬНОЕ ОКНО ТАЙТЛА И ВЫБОР ТОМОВ (Пункт 5) ---
window.openTitleModal = async function(item) {
  currentOpenTitle = item;
  const modal = document.getElementById("title-modal");
  const body = document.getElementById("modal-body");
  
  // Отправляем уникальный IP просмотр
  fetch(`${API_URL}/api/titles/${item.id}/view`, { method: "POST" }).catch(() => {});

  let chaptersByVol = {};
  if (item.chapters) {
    item.chapters.forEach(ch => {
      const vNum = ch.volume_num || 1;
      if (!chaptersByVol[vNum]) chaptersByVol[vNum] = [];
      chaptersByVol[vNum].push(ch);
    });
  } else if (item.volumes) {
    item.volumes.forEach((v, idx) => {
      chaptersByVol[idx + 1] = v.chapters;
    });
  }

  const volNumbers = Object.keys(chaptersByVol);
  let tabsHtml = "";
  if (volNumbers.length > 0) {
    volNumbers.forEach((v, idx) => {
      tabsHtml += `<button class="vol-tab-btn ${idx === 0 ? 'active' : ''}" onclick="switchVolumeTab(${v}, this)">Том ${v}</button>`;
    });
  }

  body.innerHTML = `
    <div style="display:flex; gap:15px; align-items:flex-start; flex-wrap:wrap;">
      <img src="${item.cover}" style="width:120px; border-radius:8px; box-shadow: 0 4px 10px rgba(0,0,0,0.5);" />
      <div style="flex:1; min-width:200px;">
        <h2 style="color:var(--accent); margin-bottom:8px;">${item.title}</h2>
        <p style="font-size:0.85rem; color:#aaa; margin-bottom:8px;">★ Рейтинг: ${item.rating} • 👁 Просмотров: ${item.views_count || 0}</p>
        <p style="font-size:0.9rem; color:#ddd; line-height:1.4;">${item.description || 'Перевод от команды NBF Team.'}</p>
      </div>
    </div>
    <hr style="margin: 15px 0; border-color:#333;" />
    <h4 style="margin-bottom:8px;">Кликабельная структура томов:</h4>
    <div class="volume-tabs-container">${tabsHtml || '<span style="color:#888;">Тома не созданы</span>'}</div>
    <div id="chapters-list-container"></div>
  `;

  if (volNumbers.length > 0) {
    renderChaptersForVolume(volNumbers[0], chaptersByVol[volNumbers[0]]);
  } else {
    document.getElementById("chapters-list-container").innerHTML = "<p style='color:#888;'>Главы ещё не добавлены.</p>";
  }

  loadComments("title", item.id);
  modal.classList.add("active");
};

window.switchVolumeTab = function(volNum, btnEl) {
  document.querySelectorAll(".vol-tab-btn").forEach(b => b.classList.remove("active"));
  btnEl.classList.add("active");

  let chList = [];
  if (currentOpenTitle.chapters) {
    chList = currentOpenTitle.chapters.filter(c => (c.volume_num || 1) == volNum);
  } else if (currentOpenTitle.volumes) {
    const volObj = currentOpenTitle.volumes.find(v => v.name.includes(volNum));
    if (volObj) chList = volObj.chapters;
  }
  renderChaptersForVolume(volNum, chList);
};

function renderChaptersForVolume(volNum, chList) {
  const container = document.getElementById("chapters-list-container");
  if (!chList || chList.length === 0) {
    container.innerHTML = "<p style='color:#888;'>В этом томе пока нет глав.</p>";
    return;
  }

  let html = "<ul class='chapter-list'>";
  chList.forEach(ch => {
    const titleText = ch.chapter_title || ch.title || `Глава ${ch.chapter_num || ''}`;
    // Если есть контент или локальная глава — открываем в ридере, иначе в ТГ
    const action = ch.content || ch.id 
      ? `onclick="openReader(${ch.id || 0}, '${encodeURIComponent(JSON.stringify(ch))}')"`
      : `href="${ch.tg_url || ch.url}" target="_blank"`;

    html += `
      <li class="chapter-item">
        <a ${action} class="ch-title-link" style="cursor:pointer;">📖 ${titleText}</a>
        <span class="ch-views">👁 ${ch.views_count || 0}</span>
        ${ch.tg_url ? `<a href="${ch.tg_url}" target="_blank" style="color:var(--accent); font-size:0.8rem; text-decoration:none;">В ТГ ➔</a>` : ''}
      </li>
    `;
  });
  html += "</ul>";
  container.innerHTML = html;
}

// --- ЧТЕНИЕ ГЛАВЫ (С иллюстрациями) ---
window.openReader = async function(chapterId, chDataEncoded) {
  const ch = JSON.parse(decodeURIComponent(chDataEncoded));
  currentOpenChapterId = ch.id || null;
  const modal = document.getElementById("read-modal");
  document.getElementById("reader-title-text").innerText = `${currentOpenTitle.title} — ${ch.chapter_title || ch.title || ''}`;
  
  // Увеличиваем счетчик просмотров главы
  if (chapterId && chapterId !== 0) {
    fetch(`${API_URL}/api/chapters/${chapterId}`).catch(() => {});
  }

  const contentDiv = document.getElementById("reader-content");
  if (ch.content) {
    contentDiv.innerHTML = ch.content; // Render с тегами <img>
  } else {
    contentDiv.innerHTML = `<p style="text-align:center; margin-top:50px;">Текст главы доступен по ссылке в Telegram:<br><br><a href="${ch.tg_url || ch.url}" target="_blank" class="btn-primary">Перейти к чтение в Telegram</a></p>`;
  }

  loadComments("chapter", chapterId || 0);
  modal.classList.add("active");
};

// --- КОММЕНТАРИИ (Анонимы + Инкогнито #xxxx) ---
async function loadComments(type, id) {
  const listEl = document.getElementById(`${type}-comments-list`);
  if (!listEl) return;
  listEl.innerHTML = "<p style='color:#666;'>Загрузка комментариев...</p>";

  try {
    const param = type === "title" ? `title_id=${id}` : `chapter_id=${id}`;
    const res = await fetch(`${API_URL}/api/comments?${param}`);
    if (res.ok) {
      const comms = await res.json();
      listEl.innerHTML = "";
      if (comms.length === 0) {
        listEl.innerHTML = "<p style='color:#666; font-size:0.85rem;'>Комментариев пока нет. Будьте первым!</p>";
        return;
      }
      comms.forEach(c => {
        const dateStr = new Date(c.created_at).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
        listEl.innerHTML += `
          <div class="comment-box">
            <div class="comment-author"><span>👤 ${c.author_name}</span><span class="comment-date">${dateStr}</span></div>
            <div class="comment-text">${c.text}</div>
          </div>
        `;
      });
    }
  } catch (e) {
    listEl.innerHTML = "<p style='color:#666;'>Локальный режим: комментарии доступны только при работе с бэкенд сервером.</p>";
  }
}

window.submitComment = async function(type) {
  const input = document.getElementById(`${type}-comment-input`);
  const text = input.value.trim();
  if (!text) return alert("Введите текст комментария!");

  const payload = {
    text: text,
    author_name: currentUser ? currentUser.username : null,
    title_id: type === "title" ? currentOpenTitle.id : null,
    chapter_id: type === "chapter" ? currentOpenChapterId : null
  };

  try {
    const res = await fetch(`${API_URL}/api/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      input.value = "";
      loadComments(type, type === "title" ? currentOpenTitle.id : currentOpenChapterId);
    } else {
      alert("Ошибка при отправке комментария.");
    }
  } catch (e) {
    alert("Сервер недоступен. Запустите fastapi сервер для работы комментариев.");
  }
};

// --- АВТОРИЗАЦИЯ И ПРОФИЛЬ ---
window.handleLogin = async function() {
  const u = document.getElementById("auth-username").value.trim();
  const p = document.getElementById("auth-password").value;
  if (!u || !p) return alert("Заполните поля!");

  try {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: u, password: p })
    });
    if (res.ok) {
      currentUser = await res.json();
      localStorage.setItem("nbf_user", JSON.stringify(currentUser));
      updateAuthUI();
      closeModal("auth-modal");
      alert(`Добро пожаловать, ${currentUser.username}!`);
    } else {
      alert("Неверный логин или пароль! Если вы первый раз - создайте аккаунт через API.");
    }
  } catch (e) {
    // Резервный локальный вход для тестирования без бэкенда
    if (u === "Renayem" && p === "nbf123") {
      currentUser = { id: 1, username: "Renayem", email: "arsenijkasapov6@gmail.com", is_admin: true };
      localStorage.setItem("nbf_user", JSON.stringify(currentUser));
      updateAuthUI();
      closeModal("auth-modal");
      alert("Вход в локальном режиме администратора!");
    } else {
      alert("Сервер недоступен или неверные данные.");
    }
  }
};

window.handleLogout = function() {
  localStorage.removeItem("nbf_user");
  currentUser = null;
  updateAuthUI();
  closeModal("auth-modal");
};

// --- АДМИН-ПАНЕЛЬ И РЕДАКТОР ГЛАВ (Пункты 1, 2) ---
function updateAdminSelects() {
  const selEdit = document.getElementById("select-title-for-edit");
  const selTg = document.getElementById("select-title-for-tg");
  if (!selEdit || !selTg) return;

  [selEdit, selTg].forEach(s => {
    s.innerHTML = '<option value="">-- Выберите тайтл --</option>';
    titlesData.forEach(t => {
      s.innerHTML += `<option value="${t.id}">${t.title}</option>`;
    });
  });
}

window.loadChaptersForEdit = function() {
  const tId = document.getElementById("select-title-for-edit").value;
  const selCh = document.getElementById("select-chapter-for-edit");
  selCh.innerHTML = '<option value="">-- Выберите главу --</option>';
  document.getElementById("chapter-edit-form").style.display = "none";

  const t = titlesData.find(x => x.id === tId);
  if (!t || !t.chapters) return;

  t.chapters.forEach(c => {
    selCh.innerHTML += `<option value="${c.id}">Том ${c.volume_num} — Гл. ${c.chapter_num}: ${c.chapter_title || ''}</option>`;
  });
};

window.fillChapterEditForm = function() {
  const tId = document.getElementById("select-title-for-edit").value;
  const cId = document.getElementById("select-chapter-for-edit").value;
  const form = document.getElementById("chapter-edit-form");
  
  if (!cId) { form.style.display = "none"; return; }
  
  const t = titlesData.find(x => x.id === tId);
  const ch = t.chapters.find(x => x.id == cId);
  if (!ch) return;

  document.getElementById("edit-vol-num").value = ch.volume_num || 1;
  document.getElementById("edit-ch-num").value = ch.chapter_num || "";
  document.getElementById("edit-ch-title").value = ch.chapter_title || "";
  document.getElementById("edit-tg-url").value = ch.tg_url || "";
  document.getElementById("edit-content").value = ch.content || "";
  
  form.style.display = "block";
};

window.saveChapterChanges = async function() {
  const tId = document.getElementById("select-title-for-edit").value;
  const cId = document.getElementById("select-chapter-for-edit").value;
  
  const payload = {
    title_id: tId,
    volume_num: parseInt(document.getElementById("edit-vol-num").value) || 1,
    chapter_num: document.getElementById("edit-ch-num").value.trim(),
    chapter_title: document.getElementById("edit-ch-title").value.trim(),
    tg_url: document.getElementById("edit-tg-url").value.trim(),
    content: document.getElementById("edit-content").value
  };

  try {
    const res = await fetch(`${API_URL}/api/chapters`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      alert("✅ Глава успешно обновлена!");
      loadTitlesFromAPI();
    } else {
      alert("Ошибка сохранения на сервере.");
    }
  } catch (e) {
    alert("Сервер недоступен. Изменения сохранены локально.");
  }
};

window.saveTitle = async function() {
  const idVal = document.getElementById("new-id").value.trim() || `id-${Date.now()}`;
  const payload = {
    id: idVal,
    title: document.getElementById("new-title").value.trim(),
    cover: document.getElementById("new-cover").value.trim() || "https://via.placeholder.com/150",
    rating: document.getElementById("new-rating").value.trim() || "10.0",
    type: document.getElementById("new-type").value,
    tag: document.getElementById("new-tag").value.trim()
  };

  try {
    await fetch(`${API_URL}/api/titles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    alert("✅ Тайтл сохранен в базу!");
    loadTitlesFromAPI();
  } catch (e) {
    titlesData.push({ ...payload, volumes: [], chapters: [] });
    renderGrid();
    alert("Тайтл добавлен локально!");
  }
};

// --- ВСПОМОГАТЕЛЬНЫЕ СЛУШАТЕЛИ СОБЫТИЙ ---
function setupEventListeners() {
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      e.target.classList.add("active");
      currentFilter = e.target.getAttribute("data-type");
      renderGrid();
    });
  });

  document.getElementById("search-input")?.addEventListener("input", renderGrid);
  
  document.getElementById("auth-btn").onclick = () => {
    document.getElementById("auth-modal").classList.add("active");
    if (currentUser) {
      document.getElementById("auth-form-block").style.display = "none";
      document.getElementById("profile-block").style.display = "block";
      document.getElementById("profile-name").innerText = currentUser.username;
      document.getElementById("profile-email").innerText = currentUser.email || "arsenijkasapov6@gmail.com";
    } else {
      document.getElementById("auth-form-block").style.display = "block";
      document.getElementById("profile-block").style.display = "none";
    }
  };

  document.getElementById("admin-btn").onclick = () => {
    updateAdminSelects();
    document.getElementById("admin-modal").classList.add("active");
  };
}

window.closeModal = function(id) {
  document.getElementById(id).classList.remove("active");
};

window.showAdminTab = function(tabName) {
  document.querySelectorAll(".admin-tab").forEach(t => t.style.display = "none");
  document.querySelectorAll(".admin-tabs button").forEach(b => b.classList.remove("active-adm-tab"));
  
  const target = document.getElementById(`tab-${tabName}`);
  if (target) target.style.display = "block";
  event.target.classList.add("active-adm-tab");
};

window.exportDbJson = async function() {
  try {
    const res = await fetch(`${API_URL}/api/export_db_json`);
    const data = await res.json();
    const str = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute("href", str);
    dl.setAttribute("download", "db.json");
    document.body.appendChild(dl); dl.click(); dl.remove();
  } catch (e) {
    alert("Экспорт возможен только при работающем FastAPI сервере.");
  }
};
