import { Spinner } from 'flowbite-react';

export default function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream">
      <Spinner color="warning" size="xl" aria-label="Carregando" />
    </div>
  );
}
