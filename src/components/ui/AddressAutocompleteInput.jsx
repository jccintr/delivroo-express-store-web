import { useEffect, useRef, useState } from 'react';
import { TextInput } from 'flowbite-react';
import { loadGoogleMaps } from '../../utils/loadGoogleMaps';

/**
 * Campo de texto com sugestão de endereços via Google Places Autocomplete.
 * Ao selecionar uma sugestão, retorna endereço formatado + latitude/longitude
 * através de `onSelect`. Se o usuário digitar manualmente sem selecionar uma
 * sugestão, `onSelect(null)` é chamado para deixar claro que não há mais
 * coordenada válida associada ao texto atual.
 */
export default function AddressAutocompleteInput({
  id,
  name,
  value,
  onTextChange,
  onSelect,
  placeholder,
  required,
  disabled,
}) {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'

  useEffect(() => {
    let listener;

    loadGoogleMaps()
      .then((google) => {
        if (!inputRef.current) return;

        autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: 'br' },
          fields: ['formatted_address', 'geometry'],
        });

        listener = autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current.getPlace();
          const location = place?.geometry?.location;

          if (!location) {
            // Usuário deu Enter/saiu do campo sem escolher uma sugestão real.
            onSelect(null);
            return;
          }

          const address = place.formatted_address || inputRef.current.value;
          onTextChange(address);
          onSelect({
            address,
            latitude: location.lat(),
            longitude: location.lng(),
          });
        });

        setStatus('ready');
      })
      .catch((error) => {
        console.error('Erro ao carregar Google Maps:', error);
        setStatus('error');
      });

    return () => {
      listener?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleChange(e) {
    onTextChange(e.target.value);
    // Qualquer edição manual invalida a coordenada capturada anteriormente —
    // só voltamos a ter lat/lng ao escolher uma sugestão de novo.
    onSelect(null);
  }

  return (
    <div>
      <TextInput
        id={id}
        name={name}
        ref={inputRef}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoComplete="off"
      />
      {status === 'error' && (
        <p className="mt-1 text-xs text-red-600">
          Não foi possível carregar a busca de endereços. Verifique sua conexão e tente novamente.
        </p>
      )}
    </div>
  );
}