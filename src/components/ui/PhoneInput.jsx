import { forwardRef } from 'react';
import { TextInput } from 'flowbite-react';

/**
 * Formata um telefone brasileiro enquanto o usuário digita:
 * (99) 99999-9999 — ou (99) 9999-9999 para números com 8 dígitos (fixo).
 * Aceita colar o número com ou sem formatação/DDI.
 */
function formatBrazilianPhone(rawValue) {
  const digits = rawValue.replace(/\D/g, '').slice(0, 11);

  if (digits.length <= 2) return digits;

  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);

  if (rest.length <= 4) return `(${ddd}) ${rest}`;

  // 8 dígitos = telefone fixo (4+4), 9 dígitos = celular (5+4)
  const splitAt = rest.length <= 8 ? rest.length - 4 : 5;
  return `(${ddd}) ${rest.slice(0, splitAt)}-${rest.slice(splitAt)}`;
}

/**
 * Mesma API de <TextInput type="tel" />, mas formata o valor automaticamente
 * enquanto o usuário digita. onChange recebe um evento com o valor já
 * mascarado em e.target.value, então funciona como substituto direto.
 */
const PhoneInput = forwardRef(function PhoneInput({ value, onChange, ...props }, ref) {
  function handleChange(e) {
    const formatted = formatBrazilianPhone(e.target.value);
    onChange({ target: { name: e.target.name, value: formatted } });
  }

  return (
    <TextInput
      ref={ref}
      type="tel"
      inputMode="numeric"
      value={formatBrazilianPhone(value ?? '')}
      onChange={handleChange}
      {...props}
    />
  );
});

export default PhoneInput;