let currentStream = null;

// Шаг 1: Доступ к камере
async function setupCamera() {
  try {
    currentStream = await navigator.mediaDevices.getUserMedia({ video: true });
    const video = document.getElementById('video');
    video.srcObject = currentStream;
  } catch (error) {
    console.error('Ошибка доступа к камере:', error);
    alert('Не удалось получить доступ к камере. Проверьте разрешения браузера.');
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
