import { forwardRef, useImperativeHandle, useRef } from 'react';

const CodeInput = forwardRef(function CodeInput(
  { length = 4, value, onChange, disabled = false, autoFocus = false },
  ref,
) {
  const inputsRef = useRef([]);

  useImperativeHandle(ref, () => ({
    focusFirst: () => inputsRef.current[0]?.focus(),
  }));
  const digits = Array.from({ length }, (_, i) => value[i] ?? '');

  function setDigits(next) {
    onChange(next.join(''));
  }

  function handleChangeDigit(raw, index) {
    const digit = raw.replace(/[^0-9]/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit && index < length - 1) inputsRef.current[index + 1]?.focus();
  }

  function handleKeyDown(e, index) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  function handlePaste(e) {
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, length);
    if (!pasted) return;
    e.preventDefault();
    const next = Array(length).fill('');
    for (let i = 0; i < pasted.length; i += 1) next[i] = pasted[i];
    setDigits(next);
    inputsRef.current[Math.min(pasted.length, length - 1)]?.focus();
  }

  return (
    <div className="flex justify-center gap-2" onPaste={handlePaste}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputsRef.current[index] = el)}
          value={digit}
          onChange={(e) => handleChangeDigit(e.target.value, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          inputMode="numeric"
          maxLength={1}
          disabled={disabled}
          autoFocus={autoFocus && index === 0}
          className="h-14 w-12 rounded-md border border-line text-center font-mono text-xl text-ink focus:border-orange focus:ring-orange disabled:opacity-50"
        />
      ))}
    </div>
  );
});

export default CodeInput;