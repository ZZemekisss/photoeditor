let currentStream = null;

// Шаг 1: Доступ к камере
async function setupCamera() {
  try {
    // Получаем выбранные настройки
    const resolution = document.getElementById('video-resolution').value;
    const framerate = parseInt(document.getElementById('video-framerate').value);

    // Определяем constraints в зависимости от разрешения
    let videoConstraints;

    switch (resolution) {
      case 'low':
        videoConstraints = {
          width: { ideal: 320 },
          height: { ideal: 240 },
          frameRate: { ideal: framerate }
        };
        break;
      case 'medium':
        videoConstraints = {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: framerate }
        };
        break;
      case 'high':
        videoConstraints = {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: framerate }
        };
        break;
      case 'full':
        videoConstraints = {
          frameRate: { ideal: framerate }
        }; // Родное разрешение без ограничений
        break;
      default:
        videoConstraints = true; // Автовыбор
    }

    const constraints = {
      video: videoConstraints,
      audio: false // Отключаем аудио, если не нужно
    };

    currentStream = await navigator.mediaDevices.getUserMedia(constraints);
    const video = document.getElementById('video');
    video.srcObject = currentStream;

    console.log('Камера запущена с настройками:', { resolution, framerate });

  } catch (error) {
    console.error('Ошибка доступа к камере:', error);
    alert('Не удалось получить доступ к камере. Проверьте разрешения браузера и настройки качества.');
  }
}


// Шаг 2: Захват фото с камеры
function takePhoto() {
  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');
  const context = canvas.getContext('2d');

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.drawImage(video, 0, 0);

  // Останавливаем камеру
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
  }

  video.style.display = 'none';
  canvas.style.display = 'block';
}

// Шаг 3: Загрузка фото из галереи
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

// Шаг 4: Конвертация изображения
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
    const ratio = width / source.naturalWidth;
    tempCanvas.width = width;
    tempCanvas.height = source.naturalHeight * ratio;
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
// Функция для перезапуска камеры с новыми настройками
async function restartCameraWithNewSettings() {
  if (currentStream) {
    // Останавливаем все треки текущей камеры
    currentStream.getTracks().forEach(track => track.stop());
  }
  await setupCamera(); // Запускаем камеру с новыми настройками
}
function handleVideoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Проверяем, что это видео
  if (!file.type.startsWith('video/')) {
    alert('Пожалуйста, выберите видеофайл');
    return;
  }

  const videoPreview = document.getElementById('videoPreview');
  const videoElement = videoPreview.querySelector('video');
  const videoURL = URL.createObjectURL(file);

  videoElement.src = videoURL;
  videoPreview.style.display = 'block';

  console.log('Видео загружено:', file.name);
}

// Дополнительно: обработка перетаскивания
const videoDropArea = document.getElementById('videoDropArea');

videoDropArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  videoDropArea.style.background = '#f0f4ff';
  videoDropArea.style.borderColor = '#764ba1';
});

videoDropArea.addEventListener('drop', (e) => {
  e.preventDefault();
  videoDropArea.style.background = '';
  videoDropArea.style.borderColor = '#667eea';

  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('video/')) {
    document.getElementById('videoUpload').files = e.dataTransfer.files;
    handleVideoUpload({ target: { files: e.dataTransfer.files } });
  } else {
    alert('Пожалуйста, перетащите видеофайл');
  }
});

// Добавляем обработчики событий для элементов управления
document.getElementById('video-resolution').addEventListener('change', restartCameraWithNewSettings);
document.getElementById('video-framerate').addEventListener('change', restartCameraWithNewSettings);
