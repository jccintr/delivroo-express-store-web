import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-cream px-4 text-center">
      <p className="font-mono text-sm text-orange-dark">Erro 404</p>
      <h1 className="font-heading text-2xl font-bold text-ink">Página não encontrada</h1>
      <p className="max-w-sm text-sm text-ink-soft">
        O endereço acessado não existe ou foi movido.
      </p>
      <Link
        to="/"
        className="mt-2 rounded-lg bg-orange px-4 py-2 text-sm font-medium text-white hover:bg-orange-dark"
      >
        Voltar ao início
      </Link>
    </div>
  );
}
