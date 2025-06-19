// Função backend Express para envio de e-mail de boas-vindas
const express = require('express');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
app.use(express.json());

app.post('/api/send-welcome-email', async (req, res) => {
  const { to, password } = req.body;
  if (!to || !password) {
    return res.status(400).json({ error: 'Parâmetros obrigatórios ausentes.' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: 'OK Lotes <no-reply@oklotes.com>',
      to,
      subject: 'Bem-vindo ao OK Lotes',
      html: `
        <h2>Bem-vindo ao OK Lotes!</h2>
        <p>Seu acesso foi criado. Use as credenciais abaixo para acessar o sistema:</p>
        <ul>
          <li><b>E-mail:</b> ${to}</li>
          <li><b>Senha:</b> ${password}</li>
        </ul>
        <p>Recomendamos alterar sua senha após o primeiro login.</p>
        <a href="https://oklotes.com/login">Acessar o sistema</a>
      `,
    });
    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
    res.status(500).json({ error: 'Erro ao enviar e-mail.' });
  }
});

// Iniciar servidor apenas se chamado diretamente
if (require.main === module) {
  const PORT = process.env.PORT || 3333;
  app.listen(PORT, () => {
    console.log(`Servidor de e-mail rodando na porta ${PORT}`);
  });
}

module.exports = app;
