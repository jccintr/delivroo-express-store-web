import { Button, Card } from 'flowbite-react';
import { HiOutlineBookOpen, HiPlus } from 'react-icons/hi';

// TODO: a API ainda não tem model/endpoints de produto/cardápio.
// Quando existirem (ex: GET/POST/PATCH/DELETE /stores/products),
// substituir o estado vazio abaixo por listagem + formulário de produto.
// O botão "Novo produto" ainda não navega para lugar nenhum — criar
// rota /cardapio/novo quando o formulário fizer sentido implementar.
export default function CardapioPage() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-xl font-bold">Cardápio</h1>
          <p className="text-sm text-ink-soft">Gerencie os produtos e categorias da sua loja.</p>
        </div>
        <Button color="warning" className="bg-orange enabled:hover:bg-orange-dark">
          <HiPlus className="mr-2 h-4 w-4" />
          Novo produto
        </Button>
      </div>

      <Card className="border-line">
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-orange/10 text-orange-dark">
            <HiOutlineBookOpen className="h-6 w-6" />
          </span>
          <p className="font-medium text-ink">Seu cardápio está vazio</p>
          <p className="max-w-sm text-sm text-ink-soft">
            Cadastre seu primeiro produto para começar a vender no Delivroo.
          </p>
        </div>
      </Card>
    </div>
  );
}
