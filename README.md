# OK Loteamentos - Sistema de Gestão de Loteamentos Imobiliários

## 📋 Sobre o Projeto

OK Loteamentos é um sistema de gestão completo para loteamentos imobiliários, desenvolvido para facilitar o controle, venda e acompanhamento de lotes em empreendimentos imobiliários. O sistema permite visualizar loteamentos em tempo real, gerenciar reservas e vendas, e manter comunicação entre todos os envolvidos no processo.

## 🧩 Estrutura do Sistema

### Perfis de Usuários

1. **Administrador**
   - Acesso total ao sistema
   - Cadastro e edição de loteamentos
   - Criação de qualquer perfil de usuário
   - Acesso a todos os relatórios e logs

2. **Gestor**
   - Gestão de um ou mais loteamentos
   - Cadastro de vendedores e assistentes
   - Aprovação ou cancelamento de vendas e reservas

3. **Assistente**
   - Auxiliar do Gestor com permissões atribuídas via checkbox
   - Pode cancelar reservas (se autorizado)

4. **Vendedor**
   - Visualiza apenas os loteamentos atribuídos
   - Pode reservar até 3 lotes simultaneamente
   - Pode estar na fila de até 5 lotes

## 🚀 Funcionalidades Principais

- **Visualização Interativa**: Mapa visual dos lotes com status por cores
- **Sistema de Reservas**: Gerenciamento de reservas com prazo de validade
- **Fila de Espera**: Sistema automático para gerenciar interessados em lotes já reservados
- **Dashboard**: Relatórios e gráficos com métricas importantes
- **Chat Interno**: Comunicação entre os usuários do sistema
- **Notificações**: Avisos por email, WhatsApp e no próprio sistema

## 💻 Tecnologias Utilizadas

- **Frontend**: React com TypeScript e Tailwind CSS
- **UI Components**: Headless UI e Hero Icons
- **Gráficos**: Chart.js
- **Formulários**: Formik e Yup
- **Notificações**: react-hot-toast

## 🛠️ Instruções para Executar

### Pré-requisitos
- Node.js (versão 14 ou superior)
- npm ou yarn

### Instalação e Execução

1. Clone o repositório:
   ```
   git clone [URL_DO_REPOSITÓRIO]
   cd ok_lotes
   ```

2. Instale as dependências:
   ```
   npm install
   ```
   ou
   ```
   yarn install
   ```

3. Inicie o servidor de desenvolvimento:
   ```
   npm start
   ```
   ou
   ```
   yarn start
   ```

4. Acesse o sistema no navegador:
   [http://localhost:3000](http://localhost:3000)

## 📱 Acessos para Teste

Utilize os seguintes emails com qualquer senha (mínimo 6 caracteres):

- **admin@oklotes.com** - Acesso Administrador (administrador do sistema)
- **gestor@oklotes.com** - Acesso Gestor (cliente que contratou o sistema)
- **assistente@oklotes.com** - Acesso Assistente (auxiliar do gestor)
- **vendedor@oklotes.com** - Acesso Vendedor (corretor imobiliário)

## 📝 Licença

Desenvolvido como sistema experimental para fins de demonstração.
