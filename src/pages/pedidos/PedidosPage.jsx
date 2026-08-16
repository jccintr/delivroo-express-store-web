import { Card } from 'flowbite-react';
import { HiOutlineClipboardList } from 'react-icons/hi';

// TODO: quando a API tiver endpoints de pedidos (GET /stores/deliveries,
// PATCH /stores/deliveries/:id/status), buscar a lista aqui e substituir
// o estado vazio abaixo por uma tabela/lista de pedidos com status,
// idealmente com atualização em tempo real via WebSocket.
export default function PedidosPage() {
  return (
    <div>
      <h1 className="mb-1 text-xl font-bold">Pedidos</h1>
      <p className="mb-6 text-sm text-ink-soft">Acompanhe e gerencie os pedidos da sua loja.</p>

      <Card className="border-line">
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-orange/10 text-orange-dark">
            <HiOutlineClipboardList className="h-6 w-6" />
          </span>
          <p className="font-medium text-ink">Nenhum pedido por aqui ainda</p>
          <p className="max-w-sm text-sm text-ink-soft">
            Quando um cliente fizer um pedido na sua loja, ele vai aparecer nesta lista automaticamente.
          </p>
        </div>
      </Card>
    </div>
  );
}
