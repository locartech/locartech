export function readImageAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function validateProfileImage(file) {
  if (!file) return 'Selecione uma imagem.';
  if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
    return 'Use uma imagem PNG, JPG ou JPEG.';
  }
  if (file.size > 1024 * 1024) {
    return 'Use uma imagem de até 1MB para este protótipo.';
  }
  return '';
}
