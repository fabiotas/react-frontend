import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { authService } from './authService';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Verificar se as variáveis estão configuradas
const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn('⚠️ Variáveis de ambiente do Supabase não configuradas. Verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY');
  console.warn('⚠️ Funcionalidades de upload de imagens estarão desabilitadas até que as variáveis sejam configuradas.');
}

// Cliente base do Supabase - inicialização condicional
let supabaseInstance: SupabaseClient | null = null;

const initializeSupabase = (): SupabaseClient | null => {
  if (!isSupabaseConfigured) {
    return null;
  }
  
  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    } catch (error) {
      console.error('Erro ao inicializar cliente Supabase:', error);
      return null;
    }
  }
  return supabaseInstance;
};

// Exportar cliente com proxy para evitar erro quando não configurado
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = initializeSupabase();
    if (!client) {
      // Retornar funções vazias ou valores padrão se não estiver configurado
      if (prop === 'storage') {
        return {
          from: () => ({
            upload: () => Promise.resolve({ data: null, error: { message: 'Supabase não configurado' } }),
            getPublicUrl: () => ({ data: { publicUrl: '' } }),
            remove: () => Promise.resolve({ data: null, error: null }),
          }),
        };
      }
      return () => {};
    }
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

// Cache do token do Supabase para evitar múltiplas chamadas
let cachedSupabaseToken: string | null = null;
let tokenExpiry: number | null = null;

// Função para obter token do Supabase do backend
const getSupabaseToken = async (): Promise<string | null> => {
  try {
    // Verificar se o token está em cache e ainda é válido (válido por 50 minutos)
    if (cachedSupabaseToken && tokenExpiry && Date.now() < tokenExpiry) {
      return cachedSupabaseToken;
    }

    // Buscar novo token do backend
    const token = await authService.getSupabaseToken();
    
    // Cachear o token por 50 minutos (tokens JWT geralmente expiram em 1 hora)
    cachedSupabaseToken = token;
    tokenExpiry = Date.now() + 50 * 60 * 1000; // 50 minutos
    
    return token;
  } catch (error) {
    console.error('Erro ao obter token do Supabase:', error);
    // Limpar cache em caso de erro
    cachedSupabaseToken = null;
    tokenExpiry = null;
    return null;
  }
};

// Função para limpar o cache do token (útil quando o usuário faz logout)
export const clearSupabaseTokenCache = () => {
  cachedSupabaseToken = null;
  tokenExpiry = null;
};

// Função para obter cliente Supabase autenticado
const getAuthenticatedSupabaseClient = async () => {
  if (!isSupabaseConfigured) {
    return null;
  }

  const backendToken = localStorage.getItem('token');
  
  if (!backendToken) {
    return null;
  }

  // Obter token do Supabase do backend
  const supabaseToken = await getSupabaseToken();
  
  if (!supabaseToken) {
    return null;
  }

  // Criar cliente do Supabase com o token no header
  // Não usamos setSession porque o token pode não ter um UUID válido no campo 'sub'
  // Em vez disso, passamos o token diretamente no header para operações de storage
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${supabaseToken}`,
      },
    },
  });

  return client;
};

export const uploadImage = async (file: File, areaId: string): Promise<string> => {
  if (!isSupabaseConfigured) {
    throw new Error('Configuração do Supabase não encontrada. Verifique as variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY');
  }

  // Verificar se o usuário está autenticado
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Você precisa estar autenticado para fazer upload de imagens. Por favor, faça login.');
  }

  // Obter cliente autenticado (agora é async)
  const authenticatedClient = await getAuthenticatedSupabaseClient();
  if (!authenticatedClient) {
    throw new Error('Erro ao obter token de autenticação do Supabase. Por favor, faça login novamente.');
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;
  // O caminho será: areaId/timestamp.ext dentro do bucket area-images
  const filePath = `${areaId}/${fileName}`;

  // Usar cliente autenticado para fazer upload
  const { data: uploadData, error } = await authenticatedClient.storage
    .from('area-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Erro detalhado do upload:', {
      message: error.message,
      statusCode: error.statusCode,
      error: error,
    });
    
    // Mensagens de erro mais específicas
    if (error.statusCode === '400' || error.message?.includes('row-level security')) {
      throw new Error(
        `Erro de política RLS: O Supabase Storage está bloqueando o upload devido às políticas de segurança. ` +
        `Verifique se as políticas RLS do bucket 'area-images' estão configuradas corretamente. ` +
        `A política de INSERT deve permitir usuários autenticados. ` +
        `Mensagem: ${error.message}`
      );
    } else if (error.statusCode === '401' || error.statusCode === '403') {
      throw new Error(
        `Erro de permissão: Você não tem permissão para fazer upload. ` +
        `Verifique se o token do Supabase está sendo gerado corretamente pelo backend. ` +
        `Mensagem: ${error.message}`
      );
    } else {
      throw new Error(`Erro ao fazer upload: ${error.message} (Status: ${error.statusCode || 'desconhecido'})`);
    }
  }

  // Gerar URL pública correta
  // Para buckets públicos, a URL deve ser: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
  // Usar cliente base para gerar URL pública (não precisa de autenticação)
  const { data } = supabase.storage
    .from('area-images')
    .getPublicUrl(filePath);

  let publicUrl = data.publicUrl;
  
  // Corrigir URL se estiver faltando /public/ no caminho
  // O método getPublicUrl às vezes retorna sem /public/ mesmo para buckets públicos
  if (publicUrl) {
    // Verificar se a URL está no formato incorreto (sem /public/)
    // Formato incorreto: .../storage/v1/object/area-images/...
    // Formato correto: .../storage/v1/object/public/area-images/...
    if (publicUrl.includes('/storage/v1/object/') && !publicUrl.includes('/storage/v1/object/public/')) {
      // Substituir /object/ por /object/public/ apenas uma vez
      publicUrl = publicUrl.replace('/storage/v1/object/', '/storage/v1/object/public/');
    }
  }

  return publicUrl;
};

export const deleteImage = async (imageUrl: string): Promise<void> => {
  try {
    // Verificar se o usuário está autenticado
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('Usuário não autenticado. Não é possível deletar imagem do Supabase.');
      return;
    }

    // Obter cliente autenticado (agora é async)
    const authenticatedClient = await getAuthenticatedSupabaseClient();
    if (!authenticatedClient) {
      console.warn('Erro ao obter token de autenticação do Supabase. Não é possível deletar imagem.');
      return;
    }

    // Extrair o caminho da URL do Supabase
    // Formato esperado: https://[project].supabase.co/storage/v1/object/public/area-images/...
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split('/');
    const bucketIndex = pathParts.indexOf('area-images');
    
    if (bucketIndex === -1) {
      // Tentar método alternativo se o formato for diferente
      const urlParts = imageUrl.split('/');
      const bucketIndexAlt = urlParts.indexOf('area-images');
      if (bucketIndexAlt === -1) {
        throw new Error('URL não é do Supabase Storage');
      }
      const filePath = urlParts.slice(bucketIndexAlt + 1).join('/');
      const { error } = await authenticatedClient.storage
        .from('area-images')
        .remove([filePath]);
      
      if (error) {
        throw new Error(`Erro ao deletar imagem: ${error.message}`);
      }
      return;
    }
    
    // Pegar tudo após 'area-images'
    const filePath = pathParts.slice(bucketIndex + 1).join('/');
    
    // Usar cliente autenticado para deletar
    const { error } = await authenticatedClient.storage
      .from('area-images')
      .remove([filePath]);

    if (error) {
      throw new Error(`Erro ao deletar imagem: ${error.message}`);
    }
  } catch (error) {
    // Se não conseguir deletar, apenas logar o erro mas não bloquear
    console.error('Erro ao deletar imagem do Supabase:', error);
    // Não fazer throw para não bloquear a remoção da lista
  }
};
