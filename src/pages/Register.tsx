import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, User, UserPlus, Leaf, Loader2, CheckCircle, MailCheck } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  // Função para validar qualidade da senha
  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 6) {
      return 'A senha deve ter pelo menos 6 caracteres';
    }

    const hasUpperCase = /[A-Z]/.test(pwd);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);

    const missingRequirements: string[] = [];
    
    if (!hasUpperCase) {
      missingRequirements.push('uma letra maiúscula');
    }
    if (!hasSpecialChar) {
      missingRequirements.push('um caractere especial');
    }
    if (!hasNumber) {
      missingRequirements.push('um número');
    }

    if (missingRequirements.length > 0) {
      return `A senha deve conter pelo menos ${missingRequirements.join(', ')}`;
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await register({ name, email, password });
      
      // Mostrar tela de sucesso com informação sobre o email
      // A mensagem do backend já informa sobre o email: "Usuario registrado com sucesso. Um email de boas-vindas foi enviado."
      setRegisteredEmail(email);
      setSuccess(true);
      
      // Redirecionar após 3 segundos para dar tempo de ver a mensagem
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (err: any) {
      // Verificar se é erro de conexão
      const isNetworkError = 
        !err.response || 
        err.code === 'ERR_NETWORK' || 
        err.code === 'ERR_EMPTY_RESPONSE' ||
        err.code === 'ECONNABORTED' ||
        err.code === 'ETIMEDOUT' ||
        err.message === 'Network Error' ||
        err.isConnectionError;
      
      if (isNetworkError) {
        setError(err.message);
      } else if (err instanceof Error) {
        // A mensagem já foi tratada no authService com mensagens específicas
        // Tratamento específico para erro de validação de email
        if (err.message.includes('Email inválido') || 
            err.message.toLowerCase().includes('email invalido')) {
          setError('Email inválido. Por favor, verifique o endereço de email.');
        } else {
          setError(err.message);
        }
      } else if (err.response?.data?.error || err.response?.data?.message) {
        // Fallback: tentar extrair mensagem do erro do axios
        const errorMessage = err.response.data.error || err.response.data.message;
        if (errorMessage === 'Email invalido' || 
            errorMessage?.toLowerCase().includes('email invalido')) {
          setError('Email inválido. Por favor, verifique o endereço de email.');
        } else {
          setError(errorMessage);
        }
      } else {
        setError('Erro ao criar conta. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Tela de sucesso após registro
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-fade-in">
          <div className="glass rounded-2xl p-8 animate-slide-up shadow-xl shadow-primary-100/50 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-green-600 mb-6 shadow-lg shadow-green-200 animate-scale-in">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            
            <h2 className="font-display text-2xl font-bold text-neutral-800 mb-3">
              Cadastro realizado com sucesso! ✅
            </h2>
            
            <div className="mb-6 p-4 rounded-xl bg-primary-50 border border-primary-200">
              <div className="flex items-start gap-3 text-left">
                <MailCheck className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-primary-800 mb-1">
                    Email de boas-vindas enviado!
                  </p>
                  <p className="text-sm text-primary-700">
                    Enviamos um email de boas-vindas para <strong>{registeredEmail}</strong>.
                  </p>
                  <p className="text-xs text-primary-600 mt-2">
                    Verifique sua caixa de entrada (e spam) para mais informações.
                  </p>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-neutral-500 mb-6">
              Redirecionando para o dashboard...
            </p>
            
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold hover:from-primary-700 hover:to-primary-800 focus:ring-2 focus:ring-primary-300 focus:ring-offset-2 transition-all duration-200 shadow-lg shadow-primary-200"
            >
              Ir para Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8 animate-slide-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 mb-4 shadow-lg shadow-primary-200">
            <Leaf className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold text-neutral-800 mb-2">Criar conta</h1>
          <p className="text-neutral-500">Preencha os dados para se cadastrar</p>
        </div>

        {/* Form Card */}
        <div className="glass rounded-2xl p-8 animate-slide-up delay-100 shadow-xl shadow-primary-100/50">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm animate-fade-in">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-neutral-700">
                Nome
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-neutral-200 text-neutral-800 placeholder-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all duration-200"
                  placeholder="Seu nome completo"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-neutral-200 text-neutral-800 placeholder-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all duration-200"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-neutral-200 text-neutral-800 placeholder-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all duration-200"
                  placeholder="••••••••"
                />
              </div>
              {password && (
                <div className="mt-2 p-3 rounded-lg bg-neutral-50 border border-neutral-200 text-xs">
                  <p className="text-neutral-600 font-medium mb-2">Requisitos da senha:</p>
                  <ul className="space-y-1 text-neutral-500">
                    <li className={`flex items-center gap-2 ${password.length >= 6 ? 'text-green-600' : ''}`}>
                      <span>{password.length >= 6 ? '✓' : '○'}</span>
                      Mínimo de 6 caracteres
                    </li>
                    <li className={`flex items-center gap-2 ${/[A-Z]/.test(password) ? 'text-green-600' : ''}`}>
                      <span>{/[A-Z]/.test(password) ? '✓' : '○'}</span>
                      Uma letra maiúscula
                    </li>
                    <li className={`flex items-center gap-2 ${/[0-9]/.test(password) ? 'text-green-600' : ''}`}>
                      <span>{/[0-9]/.test(password) ? '✓' : '○'}</span>
                      Um número
                    </li>
                    <li className={`flex items-center gap-2 ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? 'text-green-600' : ''}`}>
                      <span>{/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? '✓' : '○'}</span>
                      Um caractere especial (!@#$%^&*...)
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700">
                Confirmar Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-neutral-200 text-neutral-800 placeholder-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all duration-200"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold hover:from-primary-700 hover:to-primary-800 focus:ring-2 focus:ring-primary-300 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-200"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Criando conta...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Criar conta
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-neutral-500">
              Já tem uma conta?{' '}
              <Link
                to="/login"
                className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                Fazer login
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-neutral-400 text-sm mt-8 animate-slide-up delay-200">
          AreaHub © {new Date().getFullYear()} - Aluguel de Espaços
        </p>
      </div>
    </div>
  );
}
