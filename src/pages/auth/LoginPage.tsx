import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Email inválido')
    .required('Email é obrigatório'),
  password: Yup.string()
    .required('Senha é obrigatória')
    .min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

const LoginPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn, session, loading } = useAuth();

  // Redirecionar se já estiver autenticado
  useEffect(() => {
    if (session) {
      navigate('/dashboard');
    }
  }, [session, navigate]);

  // Função de login com Supabase
  const handleLogin = async (values: { email: string; password: string }) => {
    try {
      setError(null);
      await signIn(values.email, values.password);
      
      // O redirecionamento acontecerá automaticamente pelo useEffect
      // quando a sessão for atualizada
    } catch (err: any) {
      console.error('Erro ao fazer login:', err);
      setError(err.message || 'Credenciais inválidas. Tente novamente.');
    }
  };
  
  // Modo de demonstração - Enquanto não temos o Supabase configurado
  const handleDemoLogin = async (values: { email: string; password: string }) => {
    try {
      setIsLoading(true);
      // Simulação de perfis diferentes baseados no email (apenas para demo)
      let role = 'vendedor';
      if (values.email.includes('master')) {
        role = 'master';
      } else if (values.email.includes('gestor')) {
        role = 'gestor';
      } else if (values.email.includes('admin')) {
        role = 'administrador';
      }

      // Dados do usuário para autenticação
      const userData = {
        id: `demo-${Date.now()}`,
        email: values.email,
        role: role,
        name: values.email.split('@')[0],
        is_active: true,
        created_at: new Date().toISOString(),
        permissions: getDefaultPermissions(role)
      };

      // Simular uma autenticação bem-sucedida
      // Primeiro, salvar no localStorage para compatibilidade
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Simular o armazenamento no AuthContext
      // Hack para injetar o usuário no contexto de autenticação
      const fakeAuthEvent = new CustomEvent('supabase-demo-auth', { 
        detail: { profile: userData } 
      });
      window.dispatchEvent(fakeAuthEvent);
      
      toast.success('Login em modo de demonstração realizado com sucesso!');
      
      // Redirecionar para o dashboard
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Erro ao fazer login demo:', err);
      setError('Erro no login de demonstração.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Função para obter permissões padrão com base no papel
  const getDefaultPermissions = (role: string) => {
    // Master e Gestor têm todas as permissões
    if (role === 'master' || role === 'gestor') {
      return {
        view_dashboard: true,
        view_loteamentos: true,
        manage_lotes: true,
        manage_users: true,
        view_reports: true,
        manage_reservations: true,
        send_notifications: true,
        use_chat: true
      };
    }
    
    // Administrador tem permissões avançadas
    if (role === 'administrador') {
      return {
        view_dashboard: true,
        view_loteamentos: true,
        manage_lotes: true,
        manage_users: false,
        view_reports: true,
        manage_reservations: true,
        send_notifications: true,
        use_chat: true
      };
    }
    
    // Vendedor tem permissões básicas
    return {
      view_dashboard: true,
      view_loteamentos: true,
      manage_lotes: false,
      manage_users: false,
      view_reports: false,
      manage_reservations: true,
      send_notifications: false,
      use_chat: true
    };
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            OK Loteamentos
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Sistema de Gestão de Loteamentos Imobiliários
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <Formik
            initialValues={{ email: '', password: '' }}
            validationSchema={LoginSchema}
            onSubmit={handleLogin}
          >
            {({ isSubmitting, values }) => (
              <Form className="space-y-6">
                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <span className="block sm:inline">{error}</span>
                  </div>
                )}
                
                <div className="mb-4">
                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mb-2"
                    disabled={isSubmitting || loading}
                  >
                    {isSubmitting || loading ? 'Entrando...' : 'Entrar com Supabase'}
                  </button>
                  
                  <button
                    type="button"
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    disabled={isSubmitting}
                    onClick={() => handleDemoLogin(values)}
                  >
                    {isSubmitting ? 'Entrando...' : 'Modo Demonstração'}
                  </button>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email
                  </label>
                  <div className="mt-1">
                    <Field
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="seu@email.com"
                    />
                    <ErrorMessage name="email" component="div" className="mt-1 text-sm text-red-600 dark:text-red-400" />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Senha
                  </label>
                  <div className="mt-1">
                    <Field
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    <ErrorMessage name="password" component="div" className="mt-1 text-sm text-red-600 dark:text-red-400" />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                      Lembrar-me
                    </label>
                  </div>

                  <div className="text-sm">
                    <a href="#esqueci-senha" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400">
                      Esqueceu a senha?
                    </a>
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Entrando...' : 'Entrar'}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
          
          {/* Ajuda para teste (apenas para ambiente de demonstração) */}
          <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              <strong>Dicas para teste:</strong><br />
              Use os emails abaixo com qualquer senha (mín. 6 caracteres):<br />
              master@oklotes.com - Acesso Master<br />
              gestor@oklotes.com - Acesso Gestor<br />
              admin@oklotes.com - Acesso Administrador<br />
              vendedor@oklotes.com - Acesso Vendedor
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
