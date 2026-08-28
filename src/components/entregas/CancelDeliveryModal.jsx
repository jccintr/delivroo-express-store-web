import { useState } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Label, Textarea, Alert, Spinner } from 'flowbite-react';

const MIN_MOTIVO_LENGTH = 3;

// Modal de confirmação para a loja cancelar uma entrega própria. Espelha a
// validação do backend (POST /stores/deliveries/:id/cancel exige `motivo`
// com pelo menos 3 caracteres) para dar feedback antes mesmo de chamar a API.
export default function CancelDeliveryModal({ delivery, onConfirm, onClose }) {
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleConfirm() {
    const trimmed = motivo.trim();
    if (trimmed.length < MIN_MOTIVO_LENGTH) {
      setError('Descreva o motivo com um pouco mais de detalhe.');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      await onConfirm(trimmed);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal show onClose={onClose} size="md">
      <ModalHeader>Cancelar entrega</ModalHeader>
      <ModalBody>
        <p className="mb-3 text-sm text-ink-soft">
          Você está cancelando a entrega para <strong>{delivery?.destino?.nome}</strong>.
          {delivery?.status === 1
            ? ' O entregador já tinha aceitado — ele será avisado do cancelamento.'
            : ' Ela ainda não tinha sido aceita por nenhum entregador.'}
        </p>

        {error && (
          <Alert color="failure" className="mb-3" onDismiss={() => setError('')}>
            {error}
          </Alert>
        )}

        <Label htmlFor="motivoCancelamento" className="mb-1 block">
          Motivo do cancelamento
        </Label>
        <Textarea
          id="motivoCancelamento"
          rows={3}
          placeholder="Ex.: cliente desistiu da compra, item fora de estoque..."
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          disabled={submitting}
        />
      </ModalBody>
      <ModalFooter>
        <Button color="light" onClick={onClose} disabled={submitting}>
          Voltar
        </Button>
        <Button color="red" onClick={handleConfirm} isProcessing={submitting} disabled={submitting}>
          {!submitting ? 'Confirmar cancelamento' : <Spinner size="sm" />}
        </Button>
      </ModalFooter>
    </Modal>
  );
}