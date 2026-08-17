import { useRef, useState } from 'react';
import { Avatar, Button, Label, TextInput, Card, Alert } from 'flowbite-react';
import { HiOutlineCamera } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { updateStoreProfile, uploadStoreAvatar } from '../../api/storeAuth';
import AvatarCropperModal from '../../components/perfil/AvatarCropperModal';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB — mesmo limite validado no backend

export default function PerfilLojaPage() {
 
  const { store, updateStore } = useAuth();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="mb-1 text-xl font-bold">Perfil da loja</h1>
        <p className="text-sm text-ink-soft">
          Avatar e dados cadastrais exibidos para os entregadores.
        </p>
      </div>

      <AvatarCard store={store} onUpdated={updateStore} />
      <ProfileForm store={store} onUpdated={updateStore} />
    </div>
  );
}

/**
 * Operação 1: trocar o avatar da loja.
 * Independente do formulário de dados — chama PATCH /stores/me/avatar (multipart).
 */
function AvatarCard({ store, onUpdated }) {
   const showToast = useToast();
  const inputRef = useRef(null);
  const [rawImageSrc, setRawImageSrc] = useState(null); // dataURL da imagem original, aberta no cropper
  const [rawMimeType, setRawMimeType] = useState('image/jpeg');
  const [croppedBlob, setCroppedBlob] = useState(null); // blob quadrado já recortado, pronto pra enviar
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState('');
  //const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentAvatar = previewUrl || store?.avatar || null;
  const initial = store?.name?.charAt(0)?.toUpperCase() || '?';

  function handleFileChange(e) {
    const selected = e.target.files?.[0];
    setError('');
   // setSuccess(false);

    if (!selected) return;

    if (!ALLOWED_TYPES.includes(selected.type)) {
      setError('Formato inválido. Envie uma imagem JPEG, PNG ou WebP.');
      e.target.value = '';
      return;
    }

    // Limite generoso aqui — o arquivo final enviado é o recorte (bem menor),
    // este teto é só pra evitar carregar uma imagem absurdamente grande no cropper.
    if (selected.size > 15 * 1024 * 1024) {
      setError('Imagem muito grande para editar. Escolha um arquivo de até 15 MB.');
      e.target.value = '';
      return;
    }

    setRawMimeType(selected.type);
    const reader = new FileReader();
    reader.onload = () => setRawImageSrc(reader.result);
    reader.readAsDataURL(selected);
    e.target.value = ''; // permite selecionar o mesmo arquivo de novo depois de cancelar
  }

  function handleCropCancel() {
    setRawImageSrc(null);
  }

  function handleCropConfirm(blob) {
    setRawImageSrc(null);

    if (blob.size > MAX_SIZE_BYTES) {
      setError('Não foi possível gerar uma imagem dentro do limite de 2 MB. Tente outra foto.');
      return;
    }
    
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setCroppedBlob(blob);
    setPreviewUrl(URL.createObjectURL(blob));
  }

  function handleCancelPreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setCroppedBlob(null);
    setPreviewUrl(null);
    setError('');
  }

  async function handleUpload() {
    if (!croppedBlob) return;
    setError('');
    setLoading(true);
    try {
      const file = new File([croppedBlob], 'avatar.jpg', { type: croppedBlob.type });
      const data = await uploadStoreAvatar(file);
      onUpdated({ avatar: data.avatar });
     // setSuccess(true);
     showToast('Avatar atualizado com sucesso!');
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setCroppedBlob(null);
      setPreviewUrl(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-line">
      <p className="mb-3 text-sm font-medium text-ink">Logotipo da Loja</p>

     
      {error && (
        <Alert color="failure" className="mb-4" onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}

      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <div className="relative">
          {currentAvatar ? (
            <img
              src={currentAvatar}
              alt={store?.name || 'Avatar da loja'}
              className="h-20 w-20 rounded-md object-cover ring-1 ring-line"
            />
          ) : (
            <Avatar rounded placeholderInitials={initial} size="lg" />
          )}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-orange text-white shadow-sm hover:bg-orange-dark"
            aria-label="Escolher nova imagem"
          >
            <HiOutlineCamera className="h-4 w-4" />
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        <div className="flex-1 text-center sm:text-left">
          <p className="text-sm text-ink-soft">
            JPEG, PNG ou WebP · máximo 2 MB. Você poderá ajustar o recorte antes de salvar.
          </p>

          {croppedBlob && (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <Button
                size="sm"
                color="warning"
                className="bg-orange text-white enabled:hover:bg-orange-dark"
                onClick={handleUpload}
                isProcessing={loading}
              >
                Salvar avatar
              </Button>
              <Button size="sm" color="light" onClick={handleCancelPreview} disabled={loading}>
                Cancelar
              </Button>
            </div>
          )}
        </div>
      </div>

      {rawImageSrc && (
        <AvatarCropperModal
          imageSrc={rawImageSrc}
          mimeType={rawMimeType}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}
    </Card>
  );
}

/**
 * Operação 2: dados cadastrais da loja (nome, telefone, documento, endereço).
 * Independente do avatar — chama PATCH /stores/me (JSON).
 * A API exige e-mail verificado para aceitar esta atualização.
 */
function ProfileForm({ store, onUpdated }) {
  const showToast = useToast();
  const [form, setForm] = useState({
    name: store?.name || '',
    phone: store?.phone || '',
    doc: store?.doc || '',
    street: store?.address?.street || '',
    number: store?.address?.number || '',
    complement: store?.address?.complement || '',
    district: store?.address?.district || '',
    city: store?.address?.city || '',
    state: store?.address?.state || '',
    zipCode: store?.address?.zipCode || '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    //setSuccess(false);
    setLoading(true);

    try {
      const payload = {
        name: form.name,
        phone: form.phone,
        doc: form.doc || null,
        address: {
          street: form.street,
          number: form.number,
          complement: form.complement,
          district: form.district,
          city: form.city,
          state: form.state,
          zipCode: form.zipCode,
        },
      };
      const updatedStore = await updateStoreProfile(payload);
      onUpdated(updatedStore);
      //setSuccess(true);
      showToast('Dados da loja salvos com sucesso!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-line">
      
      {error && (
        <Alert color="failure" className="mb-4" onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="name" className="mb-1 block">
              Nome da loja
            </Label>
            <TextInput id="name" name="name" value={form.name} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor="phone" className="mb-1 block">
              Telefone
            </Label>
            <TextInput id="phone" name="phone" value={form.phone} onChange={handleChange} />
          </div>
        </div>

        <div className="max-w-xs">
          <Label htmlFor="doc" className="mb-1 block">
            CNPJ / Documento
          </Label>
          <TextInput id="doc" name="doc" value={form.doc} onChange={handleChange} />
        </div>

        <hr className="border-line" />
        <p className="text-sm font-medium text-ink">Endereço</p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Label htmlFor="street" className="mb-1 block">
              Rua
            </Label>
            <TextInput id="street" name="street" value={form.street} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor="number" className="mb-1 block">
              Número
            </Label>
            <TextInput id="number" name="number" value={form.number} onChange={handleChange} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="complement" className="mb-1 block">
              Complemento
            </Label>
            <TextInput
              id="complement"
              name="complement"
              value={form.complement}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor="district" className="mb-1 block">
              Bairro
            </Label>
            <TextInput id="district" name="district" value={form.district} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor="city" className="mb-1 block">
              Cidade
            </Label>
            <TextInput id="city" name="city" value={form.city} onChange={handleChange} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:w-1/2">
          <div>
            <Label htmlFor="state" className="mb-1 block">
              Estado
            </Label>
            <TextInput
              id="state"
              name="state"
              value={form.state}
              onChange={handleChange}
              maxLength={2}
              className="uppercase"
            />
          </div>
          <div>
            <Label htmlFor="zipCode" className="mb-1 block">
              CEP
            </Label>
            <TextInput id="zipCode" name="zipCode" value={form.zipCode} onChange={handleChange} />
          </div>
        </div>

        <div>
          <Button
            type="submit"
            color="warning"
            className="bg-orange text-white enabled:hover:bg-orange-dark"
            isProcessing={loading}
          >
            Salvar alterações
          </Button>
        </div>
      </form>
    </Card>
  );
}
