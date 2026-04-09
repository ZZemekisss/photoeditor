 let currentStream = null;


// Шаг 1: Доступ к камере (только по кнопке)
async function setupCamera() {
  try {
    // Если камера уже включена — не запрашиваем снова
    if (currentStream && currentStream.active) {
      return;
    }
    
    currentStream = await navigator.mediaDevices.getUserMedia({ video: true });
    const video = document.getElementById('video');
    video.srcObject = currentStream;
    video.style.display = 'block';
    
    // Скрываем canvas и загруженное фото, показываем видео
    document.getElementById('canvas').style.display = 'none';
    document.getElementById('uploaded-image').style.display = 'none';
    
  } catch (error) {
    console.error('Ошибка доступа к камере:', error);
    alert('Не удалось получить доступ к камере. Проверьте разрешения браузера.');
  }
}

// Шаг 2: Захват фото с камеры (только по кнопке)
function takePhoto() {
  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');
  const context = canvas.getContext('2d');
  
  if (!video.srcObject || !currentStream || !currentStream.active) {
    alert('Сначала включите камеру кнопкой «Включить камеру»');
    return;
  }

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.drawImage(video, 0, 0);

  // Не останавливаем камеру — пусть пользователь сам решит
  video.style.display = 'none';
  canvas.style.display = 'block';
}

// Шаг 3: Загрузка фото из галереи
function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Проверка, что это изображение
  if (!file.type.startsWith('image/')) {
    alert('Пожалуйста, выберите файл изображения');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const img = document.getElementById('uploaded-image');
    img.src = e.target.result;
    
    // Скрываем видео и canvas, показываем загруженное фото
    document.getElementById('video').style.display = 'none';
    document.getElementById('canvas').style.display = 'none';
    img.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

// Шаг 4: Конвертация и скачивание изображения
function convertImage() {
  const format = document.getElementById('format').value;
  const quality = parseFloat(document.getElementById('quality').value);
  const widthInput = document.getElementById('width').value;
  const width = widthInput ? parseInt(widthInput) : null;

  // Определяем источник изображения (canvas с фото или загруженное)
  const canvas = document.getElementById('canvas');
  const uploadedImg = document.getElementById('uploaded-image');
  const video = document.getElementById('video');
  
  let source = null;
  let sourceWidth = 0;
  let sourceHeight = 0;
  
  // Приоритет: если есть фото на canvas — берём его
  if (canvas.style.display !== 'none' && canvas.width > 0) {
    source = canvas;
    sourceWidth = canvas.width;
    sourceHeight = canvas.height;
  }
  // Иначе если есть загруженное фото
  else if (uploadedImg.style.display !== 'none' && uploadedImg.src && uploadedImg.naturalWidth > 0) {
    source = uploadedImg;
    sourceWidth = uploadedImg.naturalWidth;
    sourceHeight = uploadedImg.naturalHeight;
  }
  // Иначе если камера включена — делаем подсказку
  else if (video.style.display !== 'none' && video.srcObject) {
    alert('Сначала сделайте фото кнопкой «Сделать фото» или загрузите изображение из галереи');
    return;
  }
  else {
    alert('Нет изображения для конвертации. Сделайте фото или загрузите файл.');
    return;
  }

  // Создаём временный canvas для конвертации
  const tempCanvas = document.createElement('canvas');
  const ctx = tempCanvas.getContext('2d');

  // Изменяем размер, если указан
  if (width && width > 0) {
    const ratio = width / sourceWidth;
    tempCanvas.width = width;
    tempCanvas.height = sourceHeight * ratio;
  } else {
    tempCanvas.width = sourceWidth;
    tempCanvas.height = sourceHeight;
  }

  ctx.drawImage(source, 0, 0, tempCanvas.width, tempCanvas.height);

  // Конвертируем и скачиваем
  const mimeType = `image/${format}`;
  tempCanvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted_${Date.now()}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    
    // Небольшое уведомление об успехе
    console.log('Изображение сконвертировано и скачано');
  }, mimeType, quality);
}

// Дополнительно: кнопка для остановки камеры (хороший тон)
function stopCamera() {
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
    currentStream = null;
    const video = document.getElementById('video');
    video.srcObject = null;
    video.style.display = 'none';
    console.log('Камера отключена');
  }
}

// Обработчик закрытия страницы — вежливо отключаем камеру
window.addEventListener('beforeunload', () => {
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
  }
});
