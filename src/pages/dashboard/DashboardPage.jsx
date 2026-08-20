import { Card } from 'flowbite-react';
import { HiOutlineClipboardList, HiOutlineCurrencyDollar, HiOutlineClock } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';

const stats = [
  { label: 'Entregas hoje', value: '0', icon: HiOutlineClipboardList, color: 'bg-orange/10 text-orange-dark' },
  { label: 'Faturamento hoje', value: 'R$ 0,00', icon: HiOutlineCurrencyDollar, color: 'bg-green-bg text-green' },
  { label: 'Tempo médio de entrega', value: '—', icon: HiOutlineClock, color: 'bg-amber-bg text-amber' },
];

// TODO: os valores abaixo (entregas hoje, faturamento, tempo médio) são
// placeholders fixos. Substituir por dados reais assim que a API expuser
// um endpoint de resumo/estatísticas da loja (e GET /stores/deliveries
// para listar as entregas recentes).
export default function DashboardPage() {
  const { store } = useAuth();

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold">Olá, {store?.name?.split(' ')[0] || 'lojista'} 👋</h1>
      <p className="mb-6 text-sm text-ink-soft">Aqui está um resumo da sua loja hoje.</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="border-line">
            <div className="flex items-center gap-3">
              <span className={`flex h-10 w-10 items-center justify-center rounded-full ${color}`}>
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs text-ink-soft">{label}</p>
                <p className="font-heading text-lg font-bold text-ink">{value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-6 border-line">
        <p className="text-sm text-ink-soft">
          Nenhuma entrega recente. Assim que você criar entregas, elas aparecerão aqui em tempo real.
        </p>
      </Card>
    </div>
  );
}