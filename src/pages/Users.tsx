import { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import { User } from '../types';
import { useToast } from '../components/Toast';
import {
  Users as UsersIcon,
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  Loader2,
  Shield,
  Mail,
  User as UserIcon,
  Lock,
  CheckCircle,
  XCircle,
} from 'lucide-react';

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast, ToastContainer } = useToast();

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user' as 'user' | 'admin',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await userService.getAllUsers();
      setUsers(response.data);
    } catch {
      showToast('Erro ao carregar usuários', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'user',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'user',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingUser) {
        await userService.updateUser(editingUser._id, {
          name: formData.name,
          email: formData.email,
          role: formData.role,
        });
        showToast('Usuário atualizado com sucesso', 'success');
      } else {
        await userService.createUser({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        });
        showToast('Usuário criado com sucesso', 'success');
      }
      handleCloseModal();
      loadUsers();
    } catch {
      showToast(editingUser ? 'Erro ao atualizar usuário' : 'Erro ao criar usuário', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário "${user.name}"?`)) {
      return;
    }

    try {
      await userService.deleteUser(user._id);
      showToast('Usuário excluído com sucesso', 'success');
      loadUsers();
    } catch {
      showToast('Erro ao excluir usuário', 'error');
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <ToastContainer />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-slide-up">
        <div>
          <h1 className="font-display text-3xl font-bold text-neutral-800 flex items-center gap-3">
            <UsersIcon className="w-8 h-8 text-primary-600" />
            Usuários
          </h1>
          <p className="text-neutral-500 mt-1">Gerencie os usuários do sistema</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-lg shadow-primary-200"
        >
          <Plus className="w-5 h-5" />
          Novo Usuário
        </button>
      </div>

      {/* Search */}
      <div className="glass rounded-xl p-4 animate-slide-up delay-100">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome ou email..."
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-neutral-200 text-neutral-800 placeholder-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all duration-200"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="glass rounded-2xl overflow-hidden animate-slide-up delay-200">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <UsersIcon className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-500">Nenhum usuário encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="text-left py-4 px-6 text-neutral-600 font-medium text-sm">Usuário</th>
                  <th className="text-left py-4 px-6 text-neutral-600 font-medium text-sm">Função</th>
                  <th className="text-left py-4 px-6 text-neutral-600 font-medium text-sm">Status</th>
                  <th className="text-left py-4 px-6 text-neutral-600 font-medium text-sm">Criado em</th>
                  <th className="text-right py-4 px-6 text-neutral-600 font-medium text-sm">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${
                          user.role === 'admin'
                            ? 'bg-gradient-to-br from-purple-500 to-purple-700 ring-2 ring-purple-200'
                            : 'bg-gradient-to-br from-primary-500 to-primary-700'
                        }`}>
                          <span className="text-white font-bold text-sm">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-neutral-800 font-medium">{user.name}</p>
                            {user.role === 'admin' && (
                              <Shield className="w-4 h-4 text-purple-600" />
                            )}
                          </div>
                          <p className="text-neutral-500 text-sm">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                        user.role === 'admin'
                          ? 'bg-purple-200 text-purple-800 shadow-sm'
                          : 'bg-primary-100 text-primary-700'
                      }`}>
                        <Shield className={`w-3 h-3 ${user.role === 'admin' ? 'text-purple-700' : ''}`} />
                        {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                        user.active
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {user.active ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            Ativo
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            Inativo
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-neutral-600 text-sm">{formatDate(user.createdAt)}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(user)}
                          className="p-2 rounded-lg text-neutral-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className="p-2 rounded-lg text-neutral-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-sm animate-fade-in">
          <div className="glass rounded-2xl w-full max-w-md p-6 animate-slide-up shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-bold text-neutral-800">
                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 rounded-lg text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">Nome</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-neutral-200 text-neutral-800 placeholder-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all duration-200"
                    placeholder="Nome completo"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-neutral-200 text-neutral-800 placeholder-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all duration-200"
                    placeholder="email@exemplo.com"
                  />
                </div>
              </div>

              {!editingUser && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-700">Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required={!editingUser}
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-neutral-200 text-neutral-800 placeholder-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all duration-200"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">Função</label>
                <div className="relative">
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'user' | 'admin' })}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-neutral-200 text-neutral-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all duration-200 appearance-none cursor-pointer"
                  >
                    <option value="user">Usuário</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 py-3 px-4 rounded-xl border border-neutral-300 text-neutral-600 font-semibold hover:bg-neutral-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold hover:from-primary-700 hover:to-primary-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary-200"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    editingUser ? 'Salvar' : 'Criar'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
