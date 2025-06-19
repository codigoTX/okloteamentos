import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { supabase } from '../../services/supabase';

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({ isOpen, onClose, user }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    avatar_url: user?.avatar_url || '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Nome obrigatório';
    if (formData.password && formData.password.length < 6)
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = 'As senhas não coincidem';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      // Atualiza nome e avatar
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          avatar_url: formData.avatar_url,
        })
        .eq('id', user.id);
      if (profileError) throw profileError;
      // Atualiza senha, se fornecida
      if (formData.password) {
        const { error: passError } = await supabase.auth.updateUser({ password: formData.password });
        if (passError) throw passError;
      }
      toast.success('Dados atualizados com sucesso!');
      onClose();
    } catch (err: any) {
      toast.error('Erro ao atualizar dados: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Configurações da Conta</h2>
        <form onSubmit={handleSave}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Nome</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Foto de Perfil (URL)</label>
            <input
              type="text"
              name="avatar_url"
              value={formData.avatar_url}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            {formData.avatar_url && (
              <div className="mt-2 flex items-center">
                <img src={formData.avatar_url} alt="Preview" className="h-12 w-12 rounded-full object-cover" />
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Preview</span>
              </div>
            )}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Nova Senha</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password}</p>}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Confirmar Nova Senha</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            {errors.confirmPassword && <p className="text-sm text-red-600 mt-1">{errors.confirmPassword}</p>}
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white dark:bg-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700"
              disabled={loading}
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccountSettingsModal;
