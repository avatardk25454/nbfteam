// src/api.js

/**
 * Базовый URL для запросов. 
 * В dev-режиме запросы идут через Vite Proxy (или напрямую к локальному FastAPI).
 * В продакшене автоматически подставится домен, на котором запущен фронтенд.
 */
const API_BASE_URL = import.meta.env.DEV ? 'http://localhost:8000' : '';

/**
 * Получает полный каталог тайтлов вместе с привязанными главами от FastAPI.
 * Если API недоступен, пытается загрузить статический /db.json как Fallback.
 * @returns {Promise<Array>} Массив объектов тайтлов
 */
export async function fetchTitles() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/titles`, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.warn('⚠️ Ошибка соединения с FastAPI. Попытка загрузки резервного файла /db.json...', error);
    
    try {
      // Fallback для статического хостинга (Netlify/GitHub Pages)
      const fallbackResponse = await fetch(`/db.json?t=${Date.now()}`);
      if (!fallbackResponse.ok) {
        throw new Error('Резервный файл /db.json не найден');
      }
      return await fallbackResponse.json();
    } catch (fallbackError) {
      console.error('❌ Критическая ошибка: Не удалось загрузить данные ни с сервера, ни из резервного файла.', fallbackError);
      throw new Error('Не удалось загрузить каталог проектов. Пожалуйста, попробуйте позже.');
    }
  }
}
