import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { DocumentTextIcon, UserIcon, CalendarIcon } from '@heroicons/react/outline';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import LoteamentoMap, { Lote, LoteStatus } from '../../components/maps/LoteamentoMap';

// Mockup de imagem de mapa para demonstração
const MAPA_PLACEHOLDER = 'https://via.placeholder.com/1200x800?text=Mapa+do+Loteamento';

import { loteamentoService, loteService, Loteamento } from '../../services/supabase';

const DetalhesLoteamentoPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [userRole, setUserRole] = useState<'administrador' | 'coordenador' | 'assistente' | 'corretor'>('corretor');
  const [userName, setUserName] = useState('');
  const [loteamento, setLoteamento] = useState<Loteamento | null>(null);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loadingLoteamento, setLoadingLoteamento] = useState(true);
  const [loadingLotes, setLoadingLotes] = useState(true);
  const [selectedLote, setSelectedLote] = useState<Lote | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reservaLoading, setReservaLoading] = useState(false);
  
  // Carregar dados do usuário do localStorage
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      setUserName(userData.name);
      setUserRole(userData.role as any);
    }
    if (id) {
      setLoadingLoteamento(true);
      loteamentoService.getLoteamento(id)
        .then((data) => {
          setLoteamento(data);
        })
        .finally(() => setLoadingLoteamento(false));
      setLoadingLotes(true);
      loteService.getLotes(id)
        .then((data) => {
          setLotes(data || []);
        })
        .finally(() => setLoadingLotes(false));
    }
  }, [id]);
  
  const handleLoteClick = (lote: Lote) => {
    setSelectedLote(lote);
    setIsModalOpen(true);
  };
  
  const handleReservarLote = () => {
    if (!selectedLote) return;
    
    setReservaLoading(true);
    
    // Simulação de tempo de processamento
    setTimeout(() => {
      setLotes(prevLotes => 
        prevLotes.map(lote => 
          lote.id === selectedLote.id
            ? { 
                ...lote, 
                status: 'reservado', 
                responsavel: userName,
                dataReserva: new Date().toISOString().split('T')[0]
              }
            : lote
        )
      );
      
      setReservaLoading(false);
      setIsModalOpen(false);
      
      // Atualizar o lote selecionado
      setSelectedLote(prev => 
        prev ? { 
          ...prev, 
          status: 'reservado', 
          responsavel: userName,
          dataReserva: new Date().toISOString().split('T')[0]
        } : null
      );
    }, 1000);
  };
  
  const handleEntrarFila = () => {
    // Implementação futura
    alert('Funcionalidade de entrar na fila será implementada em breve!');
    setIsModalOpen(false);
  };
  
  // Formatação de valores monetários em reais
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };
  
  // Função para formatar a área
  const formatarArea = (area: number) => {
    return `${area.toLocaleString('pt-BR')} m²`;
  };
  
  return (
    <MainLayout userRole={userRole} userName={userName} notificationCount={3}>
      {/* Cabeçalho do loteamento */}
      <div className="relative">
        <div className="h-64 w-full overflow-hidden">
          <img
            src={loteamento.imagem}
            alt={loteamento.nome}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-60"></div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold text-white">{loteamento.nome}</h1>
              <p className="text-xl text-gray-200">
                {loteamento.cidade}, {loteamento.estado}
              </p>
            </div>
            <div className="flex space-x-2">
              <Badge variant="success" className="text-sm py-1 px-3">
                {loteamento.disponiveis} Disponíveis
              </Badge>
              <Badge variant="warning" className="text-sm py-1 px-3">
                {loteamento.reservados} Reservados
              </Badge>
              <Badge variant="danger" className="text-sm py-1 px-3">
                {loteamento.vendidos} Vendidos
              </Badge>
            </div>
          </div>
        </div>
      </div>
      
      {/* Informações do loteamento */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Detalhes" className="col-span-1">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Endereço</h4>
              <p className="mt-1 text-gray-900 dark:text-white">{loteamento.endereco}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Descrição</h4>
              <p className="mt-1 text-gray-900 dark:text-white">{loteamento.descricao}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Infraestrutura</h4>
              <ul className="mt-1 space-y-1">
                {loteamento.infraestrutura.map((item, index) => (
                  <li key={index} className="text-gray-900 dark:text-white flex items-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary-600 mr-2"></span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
        
        {/* Mapa do loteamento */}
        <Card title="Mapa de Lotes" className="col-span-1 md:col-span-2">
          <LoteamentoMap
            lotes={lotes}
            imagemMapa={MAPA_PLACEHOLDER}
            onLoteClick={handleLoteClick}
          />
        </Card>
      </div>
      
      {/* Modal de detalhes do lote */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedLote ? `Lote ${selectedLote.quadra}-${selectedLote.numero}` : 'Detalhes do Lote'}
        size="md"
        footer={
          selectedLote && (
            <div className="flex space-x-3">
              {selectedLote.status === 'disponivel' && (
                <Button
                  variant="primary"
                  onClick={handleReservarLote}
                  disabled={reservaLoading}
                >
                  {reservaLoading ? 'Reservando...' : 'Reservar Lote'}
                </Button>
              )}
              {selectedLote.status === 'reservado' && selectedLote.responsavel !== userName && (
                <Button
                  variant="secondary"
                  onClick={handleEntrarFila}
                >
                  Entrar na Fila
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Fechar
              </Button>
            </div>
          )
        }
      >
        {selectedLote && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Área</h4>
                <p className="mt-1 text-lg font-medium text-gray-900 dark:text-white">{formatarArea(selectedLote.area)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Valor</h4>
                <p className="mt-1 text-lg font-medium text-gray-900 dark:text-white">{formatCurrency(selectedLote.valor)}</p>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Status</h4>
              <div className="mt-1">
                <Badge
                  variant={
                    selectedLote.status === 'disponivel'
                      ? 'success'
                      : selectedLote.status === 'reservado'
                      ? 'warning'
                      : 'danger'
                  }
                >
                  {selectedLote.status === 'disponivel'
                    ? 'Disponível'
                    : selectedLote.status === 'reservado'
                    ? 'Reservado'
                    : 'Vendido'}
                </Badge>
              </div>
            </div>
            
            {selectedLote.responsavel && (
              <div className="flex items-center">
                <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Responsável</h4>
                  <p className="text-gray-900 dark:text-white">{selectedLote.responsavel}</p>
                </div>
              </div>
            )}
            
            {selectedLote.dataReserva && (
              <div className="flex items-center">
                <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Data de Reserva</h4>
                  <p className="text-gray-900 dark:text-white">{selectedLote.dataReserva}</p>
                </div>
              </div>
            )}
            
            {selectedLote.dataVenda && (
              <div className="flex items-center">
                <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Data de Venda</h4>
                  <p className="text-gray-900 dark:text-white">{selectedLote.dataVenda}</p>
                </div>
              </div>
            )}
            
            {(userRole === 'administrador' || userRole === 'coordenador') && selectedLote.status === 'reservado' && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Ações administrativas</h4>
                <div className="flex space-x-3">
                  <Button variant="success" size="sm">Aprovar Venda</Button>
                  <Button variant="danger" size="sm">Cancelar Reserva</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </MainLayout>
  );
};

export default DetalhesLoteamentoPage;
