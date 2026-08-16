/**
 * Gera um Blob de imagem quadrada a partir de uma área de recorte (em pixels
 * da imagem original), usando canvas. Necessário porque a API força
 * `crop: 'fill', gravity: 'face'` no Cloudinary (400x400) — se enviarmos uma
 * imagem não-quadrada, o Cloudinary corta automaticamente e pode cortar
 * partes importantes do avatar. Ao já enviar um recorte quadrado escolhido
 * pelo lojista, o "fill" do Cloudinary só redimensiona, sem cortar nada.
 */

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

const OUTPUT_SIZE = 512; // maior que os 400x400 finais, evita perda de nitidez

export async function getCroppedImageBlob(imageSrc, croppedAreaPixels, mimeType = 'image/jpeg') {
  const image = await loadImage(imageSrc);

  const canvas = document.createElement('canvas');
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;

  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(
    image,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Não foi possível processar a imagem.'));
      },
      mimeType,
      0.92
    );
  });
}
