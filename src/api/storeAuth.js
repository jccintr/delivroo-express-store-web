import { api } from './client';

// POST /store/register — { name, email, password, phone }
export function registerStore(payload) {
  return api.post('/stores/register', payload);
}

// POST /store/login — { email, password } -> { ...store, token }
export function loginStore(payload) {
  return api.post('/stores/login', payload);
}

// GET /store/me — retorna a loja autenticada
export function fetchCurrentStore() {
  return api.get('/stores/me', { auth: true });
}

// POST /store/verify-account — { code } (autenticado)
export function verifyAccount(code) {
  return api.post('/stores/verify-account', { code }, { auth: true });
}

// POST /store/password/request — { email }
export function requestPasswordCode(email) {
  return api.post('/stores/password/request', { email });
}

// POST /store/password/verify-code — { email, code }
export function verifyPasswordCode(email, code) {
  return api.post('/stores/password/verify-code', { email, code });
}

// POST /store/password/reset — { email, code, password }
export function resetPassword(payload) {
  return api.post('/stores/password/reset', payload);
}

// PATCH /stores/me — { name?, phone?, doc?, address? }
// Requer e-mail verificado (API retorna 403 "Conta ainda não verificada." caso contrário).
// Retorna a loja atualizada (sem token).
export function updateStoreProfile(payload) {
  return api.patch('/stores/me', payload, { auth: true });
}

// PATCH /stores/me/avatar — multipart/form-data, campo "avatar"
// Aceita apenas JPEG/PNG/WebP, máximo 2 MB (validado no backend).
// Retorna { message, avatar: url }
export function uploadStoreAvatar(file) {
  const formData = new FormData();
  formData.append('avatar', file);
  return api.patchForm('/stores/me/avatar', formData, { auth: true });
}
