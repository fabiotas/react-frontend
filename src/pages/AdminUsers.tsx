import { useEffect, useState } from 'react';
import { adminService } from '../services/adminService';
import { User } from '../types';
import { useToast } from '../components/Toast';
import { Loader2, Search, Shield, CheckCircle, XCircle, Ban } from 'lucide-react';

export default function AdminUsers() {
  const { showToast, ToastContainer } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [approvalFilter, setApprovalFilter] = useState<'pending' | 'approved' | 'rejected' | 'blocked'>('pending');
  const [activeFilter, setActiveFilter] = useState<'all' | 'true' | 'false'>('all');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approvalFilter, activeFilter, page]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const active =
        activeFilter === 'all' ? undefined : activeFilter === 'true';

      const response = await adminService.getUsers({
        approvalStatus: approvalFilter,
        active,
        page,
        limit: 10,
        search: searchTerm || undefined,
      });
      setUsers(response.data);
      setPages(response.pages || 1);
    } catch {
      showToast('Erro ao carregar usuários', 'error');
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadUsers();
  };

  const handleAction = async (id: string, action: 'approve' | 'reject' | 'block') => {
    try {
      if (action === 'approve') await adminService.approveUser(id);
      if (action === 'reject') await adminService.rejectUser(id);
      if (action === 'block') await adminService.blockUser(id);
      showToast('Ação concluída', 'success');
      loadUsers();
    } catch {
      showToast('Erro ao executar ação', 'error');
    }
  };

  const approvalLabel = (status: User['approvalStatus']) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'approved':
        return 'Aprovado';
      case 'rejected':
        return 'Reprovado';
      case 'blocked':
        return 'Bloqueado';
      default:
        return status;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <ToastContainer />

      <div className="animate-slide-up">
        <h1 className="font-display text-3xl font-bold text-neutral-800 flex items-center gap-3">
          <Shield className="w-8 h-8 text-purple-600" />
          Aprovação de Usuários
        </h1>
        <p className="text-neutral-500 mt-1">Moderação de cadastros</p>
      </div>

      <form onSubmit={handleSearchSubmit} className="glass rounded-xl p-4 animate-slide-up delay-100 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome ou email..."
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-neutral-200 text-neutral-800 placeholder-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all duration-200"
            />
          </div>

          <select
            value={approvalFilter}
            onChange={(e) => {
              setApprovalFilter(e.target.value as typeof approvalFilter);
              setPage(1);
            }}
            className="w-full px-4 py-3 rounded-xl bg-white border border-neutral-200 text-neutral-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all duration-200"
          >
            <option value="pending">Pendentes</option>
            <option value="approved">Aprovados</option>
            <option value="rejected">Reprovados</option>
            <option value="blocked">Bloqueados</option>
          </select>

          <select
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value as typeof activeFilter);
              setPage(1);
            }}
            className="w-full px-4 py-3 rounded-xl bg-white border border-neutral-200 text-neutral-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all duration-200"
          >
            <option value="all">Ativo: todos</option>
            <option value="true">Ativo: sim</option>
            <option value="false">Ativo: não</option>
          </select>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors"
          >
            Aplicar busca
          </button>
        </div>
      </form>

      <div className="glass rounded-2xl overflow-hidden animate-slide-up delay-200">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-neutral-500">Nenhum usuário encontrado</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="text-left py-4 px-6 text-neutral-600 font-medium text-sm">Usuário</th>
                  <th className="text-left py-4 px-6 text-neutral-600 font-medium text-sm">Aprovação</th>
                  <th className="text-left py-4 px-6 text-neutral-600 font-medium text-sm">Ativo</th>
                  <th className="text-right py-4 px-6 text-neutral-600 font-medium text-sm">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                    <td className="py-4 px-6">
                      <div>
                        <p className="text-neutral-800 font-medium">{u.name}</p>
                        <p className="text-neutral-500 text-sm">{u.email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-700">
                        {approvalLabel(u.approvalStatus)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                          u.active ? 'bg-primary-100 text-primary-700' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {u.active ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            Sim
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            Não
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleAction(u._id, 'approve')}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary-100 text-primary-800 hover:bg-primary-200"
                        >
                          Aprovar
                        </button>
                        <button
                          onClick={() => handleAction(u._id, 'reject')}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                        >
                          Reprovar
                        </button>
                        <button
                          onClick={() => handleAction(u._id, 'block')}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-100 text-red-800 hover:bg-red-200 inline-flex items-center gap-1"
                        >
                          <Ban className="w-3 h-3" />
                          Bloquear
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

      {pages > 1 && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-4 py-2 rounded-xl border border-neutral-200 text-neutral-700 disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-sm text-neutral-600">
            Página {page} de {pages}
          </span>
          <button
            type="button"
            disabled={page >= pages}
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            className="px-4 py-2 rounded-xl border border-neutral-200 text-neutral-700 disabled:opacity-50"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}
