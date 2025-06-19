import React, { useState, useEffect, useRef } from 'react';
import { XIcon } from '@heroicons/react/outline';
import { UserProfile, userService } from '../../services/supabase';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: any) => void;
  user: UserProfile | null;
  currentUserRole: string;
}

const UserFormModal: React.FC<UserFormModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  user, 
  currentUserRole
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  // Fecha o modal ao clicar fora dele no mobile
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);
  const [coordenadores, setCoordenadores] = useState<UserProfile[]>([]);
  const [coordenadorId, setCoordenadorId] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    
    role: 'corretor',
    avatar_url: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'corretor',
        avatar_url: user.avatar_url || '',
      });
      setCoordenadorId(user.coordenador_id || '');
    } else {
      setFormData({
        name: '',
        email: '',
        role: 'corretor',
        avatar_url: '',
      });
      setCoordenadorId('');
    }
    setErrors({});
    // Buscar coordenadores se for admin e modal aberto
    if (currentUserRole === 'administrador' && isOpen) {
      userService.getUsersByRole
        ? userService.getUsersByRole('coordenador').then(setCoordenadores)
        : userService.getUsers().then(users => setCoordenadores(users.filter(u => u.role === 'coordenador')));
    }
  }, [user, isOpen, currentUserRole]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'coordenador_id') {
      setCoordenadorId(value);
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    
    
    if (!formData.role) {
      newErrors.role = 'Perfil é obrigatório';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    // Preparar dados para salvar
    let userData: any = {
      name: formData.name,
      email: formData.email,
      role: formData.role,
      avatar_url: formData.avatar_url || null,
    };
    
    // Se for novo usuário
    if (!user) {
      if (currentUserRole === 'coordenador') {
        userData.coordenador_id = null; // Será definido no UserManagementPage
      } else if (currentUserRole === 'administrador') {
        userData.coordenador_id = coordenadorId || null;
      }
    }
    onSave(userData);
  };

  if (!isOpen) return null;

  // Determinar quais papéis o usuário atual pode gerenciar
  const allowedRoles = () => {
    switch (currentUserRole) {
      case 'administrador':
        return ['administrador', 'coordenador', 'assistente', 'corretor'];
      case 'coordenador':
        return ['corretor', 'assistente'];
      default:
        return ['corretor'];
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black bg-opacity-40 transition-all duration-300">
      <div className="flex w-full min-h-screen items-center justify-center px-2 sm:px-4 py-8">
        <div
          ref={modalRef}
          className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-auto animate-fadeInUp flex flex-col"
          style={{ maxHeight: '90vh' }}
        >
          <button
            type="button"
            className="absolute top-2 right-2 z-10 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none transition"
            onClick={onClose}
            aria-label="Fechar modal"
          >
            <XIcon className="h-6 w-6 text-gray-500 dark:text-gray-300" />
          </button>
          <div className="flex flex-col gap-2 px-6 pt-6 pb-2 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              {user ? 'Editar Usuário' : 'Novo Usuário'}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Preencha os dados abaixo para {user ? 'editar' : 'criar'} o usuário.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-4 px-6 py-4 overflow-y-auto custom-scrollbar">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">
                Nome
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-4 py-3 border-2 rounded-lg shadow-sm text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white transition ${errors.name ? 'border-red-500 dark:border-red-500' : 'border-gray-200 dark:border-gray-700'}`}
                autoFocus
                autoComplete="off"
                placeholder="Nome completo"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 border-2 rounded-lg shadow-sm text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white transition ${errors.email ? 'border-red-500 dark:border-red-500' : 'border-gray-200 dark:border-gray-700'}`}
                disabled={!!user}
                autoComplete="off"
                placeholder="email@exemplo.com"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>}
            </div>

            {user && (
  <div className="mb-4">
    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      Nova Senha (deixe em branco para manter a atual)
    </label>
    <input
      type="password"
      id="password"
      name="password"
      value={''}
      onChange={handleChange}
      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
        errors.password ? 'border-red-500 dark:border-red-500' : ''
      }`}
    />
    {errors.password && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>}
  </div>
)}

            {user && (
  <div className="mb-4">
    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      Confirmar Senha
    </label>
    <input
      type="password"
      id="confirmPassword"
      name="confirmPassword"
      value={''}
      onChange={handleChange}
      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
        errors.confirmPassword ? 'border-red-500 dark:border-red-500' : ''
      }`}
    />
    {errors.confirmPassword && (
      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword}</p>
    )}
  </div>
)}

            <div className="mb-4">
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Perfil
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                disabled={!!user && (user.role === 'administrador' || (user.role === 'coordenador' && currentUserRole !== 'administrador'))}
              >
                {['administrador', 'coordenador', 'assistente', 'corretor'].map((role) => (
  <option key={role} value={role}>
    {role === 'administrador' && 'Administrador'}
    {role === 'coordenador' && 'Coordenador'}
    {role === 'corretor' && 'Corretor'}
    {role === 'assistente' && 'Assistente'}
  </option>
))}
              </select>
              {errors.role && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.role}</p>}
            </div>

            {/* Campo de seleção de coordenador só para administradores criando novo usuário */}
            {currentUserRole === 'administrador' && !user && (
              <div className="mb-4">
                <label htmlFor="coordenador_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Coordenador Responsável
                </label>
                <select
                  id="coordenador_id"
                  name="coordenador_id"
                  value={coordenadorId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                >
                  <option value="">Selecione um coordenador</option>
                  {coordenadores.map(g => (
                    <option key={g.id} value={g.id}>{g.name} ({g.email})</option>
                  ))}
                </select>
              </div>
            )}

            <div className="mb-4">
              <label htmlFor="avatar_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                URL da Foto de Perfil (opcional)
              </label>
              <input
                type="text"
                id="avatar_url"
                name="avatar_url"
                value={formData.avatar_url}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="https://exemplo.com/imagem.jpg"
              />
              {formData.avatar_url && (
                <div className="mt-2 flex items-center">
                  <img 
                    src={formData.avatar_url} 
                    alt="Preview" 
                    className="h-10 w-10 rounded-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://via.placeholder.com/150?text=Erro';
                    }}
                  />
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Preview</span>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 bg-white dark:bg-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={onClose}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserFormModal;
