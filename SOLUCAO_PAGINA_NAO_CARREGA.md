# Página não carrega - Guia de Diagnóstico

O Vite está rodando corretamente, mas a página não aparece no navegador. Siga estes passos:

## 1. Verificar acesso no navegador

Abra o navegador e acesse:
- **http://localhost:5173**

Se não carregar, tente também:
- **http://127.0.0.1:5173**

## 2. Verificar Console do Navegador (IMPORTANTE!)

1. Abra o **DevTools** (F12 ou Ctrl+Shift+I)
2. Vá na aba **Console**
3. Procure por **erros em vermelho**

### Erros comuns:

#### ❌ `Failed to fetch` ou `Network error`
- **Problema**: O frontend não consegue se conectar à API
- **Solução**: Verifique se a API está rodando

#### ❌ `Cannot read property 'X' of undefined`
- **Problema**: Erro no código JavaScript
- **Solução**: Compartilhe o erro completo

#### ❌ `CORS error` ou `Cross-Origin`
- **Problema**: Problema de CORS entre frontend e API
- **Solução**: Já está configurado no proxy do Vite, mas pode verificar

#### ❌ Erro de importação de módulo
- **Problema**: Dependência faltando
- **Solução**: Verifique se todas as dependências foram instaladas

## 3. Verificar se a API está respondendo

No navegador, vá para:
- **http://localhost:3000/api**

Ou teste diretamente:
```bash
curl http://localhost:3000/api
```

Se não responder, a API pode não estar rodando ou pode estar com problema.

## 4. Verificar Network Tab

1. Abra **DevTools** (F12)
2. Vá na aba **Network**
3. Recarregue a página (F5)
4. Verifique as requisições:
   - Requisições em vermelho = falharam
   - Requisições pendentes = travadas

## 5. Verificar se há loading infinito

Se a página mostra apenas um spinner, pode ser:
- O AuthContext está esperando resposta da API
- A requisição `/auth/me` está travada

**Solução rápida**: Limpe o localStorage e recarregue:
```javascript
// No console do navegador (F12):
localStorage.clear();
location.reload();
```

## 6. Verificar logs dos containers

```bash
# Frontend
docker logs react-frontend --tail=50

# API
docker logs node-user-api --tail=50
```

## 7. Teste básico - Página simples

Se nada funcionar, vamos verificar se o problema é no React ou no servidor:

1. No container, verifique se o HTML está sendo servido:
```bash
docker exec react-frontend curl http://localhost:5173
```

## Próximos passos

1. **Abra o navegador em http://localhost:5173**
2. **Abra o DevTools (F12)**
3. **Vá na aba Console**
4. **Copie TODOS os erros que aparecerem**
5. **Compartilhe os erros aqui**

Com os erros do console, consigo identificar exatamente o que está acontecendo!

