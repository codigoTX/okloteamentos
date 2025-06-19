// Este arquivo agora faz uma chamada para a API backend responsável por enviar o e-mail de boas-vindas.

export async function sendWelcomeEmail({ to, password }: { to: string; password: string }) {
  await fetch('/api/send-welcome-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, password }),
  });
}
