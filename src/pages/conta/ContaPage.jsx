import { Badge, Card, Label, TextInput } from 'flowbite-react';
import { useAuth } from '../../context/AuthContext';

// TODO: não existe endpoint de troca de senha para usuário já logado
// (só o fluxo de "esqueci minha senha" via código). Quando a API tiver
// algo como PATCH /stores/me/password, adicionar formulário aqui em vez
// do link para o fluxo de recuperação.
export default function ContaPage() {
  const { store, isEmailVerified } = useAuth();

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold">Configurações da conta</h1>
      <p className="mb-6 text-sm text-ink-soft">Dados de acesso do responsável pela loja.</p>

      <Card className="border-line">
        <div className="flex flex-col gap-4">
          <div>
            <Label className="mb-1 block">E-mail</Label>
            <div className="flex items-center gap-2">
              <TextInput value={store?.email || ''} disabled className="max-w-sm" />
              {isEmailVerified ? (
                <Badge color="success">Verificado</Badge>
              ) : (
                <Badge color="warning">Não verificado</Badge>
              )}
            </div>
          </div>

          <div>
            <Label className="mb-1 block">Senha</Label>
            <p className="text-sm text-ink-soft">
              Para trocar sua senha,{' '}
              <a href="/esqueci-senha" className="font-medium text-orange-dark hover:underline">
                use o fluxo de recuperação de senha
              </a>
              .
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
