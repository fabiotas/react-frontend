import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { useToast } from '../components/Toast';
import {
  User,
  Mail,
  Lock,
  Save,
  Loader2,
  Shield,
  Calendar,
  Key,
} from 'lucide-react';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { showToast, ToastContainer } = useToast();

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);

    try {
      const response = await authService.updateMe({
        name: profileData.name,
        email: profileData.email,
      });
      updateUser(response.data);
      showToast('Perfil atualizado com sucesso', 'success');
    } catch {
      showToast('Erro ao atualizar perfil', 'error');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast('As senhas não coincidem', 'error');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showToast('A nova senha deve ter pelo menos 6 caracteres', 'error');
      return;
    }

    setIsUpdatingPassword(true);

    try {
      await userService.updatePassword(user!._id, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      showToast('Senha alterada com sucesso', 'success');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch {
      showToast('Erro ao alterar senha. Verifique a senha atual.', 'error');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <ToastContainer />

      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="font-display text-3xl font-bold text-neutral-800 flex items-center gap-3">
          <User className="w-8 h-8 text-primary-600" />
          Meu Perfil
        </h1>
        <p className="text-neutral-500 mt-1">Gerencie suas informações pessoais</p>
      </div>

      {/* Profile Card */}
      <div className={`glass rounded-2xl p-6 animate-slide-up delay-100 ${
        user?.role === 'admin' ? 'border-2 border-purple-200' : ''
      }`}>
        <div className="flex items-center gap-6 mb-6 pb-6 border-b border-neutral-200">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg ${
            user?.role === 'admin'
              ? 'bg-gradient-to-br from-purple-500 to-purple-700 shadow-purple-200 ring-2 ring-purple-200'
              : 'bg-gradient-to-br from-primary-500 to-primary-700 shadow-primary-200'
          }`}>
            <span className="text-white font-bold text-3xl">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-bold text-neutral-800">{user?.name}</h2>
              {user?.role === 'admin' && (
                <Shield className="w-5 h-5 text-purple-600" />
              )}
            </div>
            <p className="text-neutral-500">{user?.email}</p>
            <div className="flex items-center gap-4 mt-3">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                user?.role === 'admin'
                  ? 'bg-purple-200 text-purple-800 shadow-sm'
                  : 'bg-primary-100 text-primary-700'
              }`}>
                <Shield className={`w-3.5 h-3.5 ${user?.role === 'admin' ? 'text-purple-700' : ''}`} />
                {user?.role === 'admin' ? 'Administrador' : 'Usuário'}
              </span>
              <span className="inline-flex items-center gap-1.5 text-neutral-500 text-xs">
                <Calendar className="w-3 h-3" />
                Desde {formatDate(user?.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <h3 className="font-display text-lg font-semibold text-neutral-800 mb-4">
            Informações Pessoais
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-700">Nome</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  required
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-neutral-200 text-neutral-800 placeholder-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all duration-200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-700">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  required
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-neutral-200 text-neutral-800 placeholder-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all duration-200"
                />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold hover:from-primary-700 hover:to-primary-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-200"
            >
              {isUpdatingProfile ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Salvar Alterações
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Password Card */}
      <div className="glass rounded-2xl p-6 animate-slide-up delay-200">
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <h3 className="font-display text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
            <Key className="w-5 h-5 text-primary-600" />
            Alterar Senha
          </h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-700">Senha Atual</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  required
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-neutral-200 text-neutral-800 placeholder-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all duration-200"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">Nova Senha</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    required
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-neutral-200 text-neutral-800 placeholder-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all duration-200"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">Confirmar Nova Senha</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    required
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-neutral-200 text-neutral-800 placeholder-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all duration-200"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isUpdatingPassword}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-700 to-primary-800 text-white font-semibold hover:from-primary-800 hover:to-primary-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-200"
            >
              {isUpdatingPassword ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Alterando...
                </>
              ) : (
                <>
                  <Key className="w-5 h-5" />
                  Alterar Senha
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
