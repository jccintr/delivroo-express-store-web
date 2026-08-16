import { useCallback, useState } from 'react';
import Cropper from 'react-easy-crop';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Spinner } from 'flowbite-react';
import { getCroppedImageBlob } from '../../utils/imageCrop';

export default function AvatarCropperModal({ imageSrc, mimeType, onConfirm, onCancel }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleCropComplete = useCallback((_, areaPixels) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  async function handleConfirm() {
    if (!croppedAreaPixels) return;
    setProcessing(true);
    try {
      const blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels, mimeType);
      onConfirm(blob);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <Modal show onClose={onCancel} size="md">
      <ModalHeader>Ajustar avatar</ModalHeader>
      <ModalBody>
        <p className="mb-3 text-sm text-ink-soft">
          Arraste e use o zoom para escolher a parte da imagem que ficará visível. O
          avatar é sempre quadrado.
        </p>

        <div className="relative h-72 w-full overflow-hidden rounded-lg bg-ink">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
          />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <span className="text-xs text-ink-soft">Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-orange"
          />
        </div>
      </ModalBody>
      <ModalFooter>
        <Button color="light" onClick={onCancel} disabled={processing}>
          Cancelar
        </Button>
        <Button
          color="warning"
          className="bg-orange text-white enabled:hover:bg-orange-dark"
          onClick={handleConfirm}
          disabled={processing}
        >
          {processing ? <Spinner size="sm" light /> : 'Usar este recorte'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
