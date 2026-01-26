# 🔍 Debug - Preços Especiais Não Estão Salvando

## ✅ O que foi adicionado no frontend:

1. **Logs detalhados** no console do navegador
2. **Recarregamento automático** das áreas após salvar
3. **Melhor tratamento de erros** com mensagens específicas

## 🔍 Como debugar:

### 1. Abra o Console do Navegador
- Pressione `F12` ou `Ctrl+Shift+I`
- Vá na aba "Console"

### 2. Tente salvar um preço especial
- Você verá logs como:
  - `📤 Enviando preços especiais:` - Mostra o que está sendo enviado
  - `📦 Payload completo:` - Mostra o JSON completo
  - `✅ Resposta do servidor:` - Mostra a resposta do backend
  - `✅ Preços salvos confirmados:` - Confirma se os dados foram salvos

### 3. Verifique no Network (Rede)
- Na aba "Network" do DevTools
- Filtre por "areas"
- Clique na requisição `PUT /api/areas/:id`
- Veja:
  - **Request Payload**: O que está sendo enviado
  - **Response**: O que o backend retornou

## 🐛 Problemas Comuns:

### Problema 1: Backend não está recebendo `specialPrices`
**Sintoma**: No Network, o Request Payload não tem `specialPrices`

**Solução**: Verifique se o `areaService.updateArea` está enviando corretamente

### Problema 2: Backend retorna sucesso mas não salva
**Sintoma**: Response 200, mas `specialPrices` está vazio ou não atualizado

**Solução no Backend**:
```javascript
// No seu controller PUT /api/areas/:id
if (updateData.specialPrices !== undefined) {
  // IMPORTANTE: Atribuir diretamente
  area.specialPrices = updateData.specialPrices;
  // NÃO fazer: area.specialPrices.push(...) ou similar
}
await area.save();
```

### Problema 3: Validação no backend está rejeitando
**Sintoma**: Response 400 com mensagem de erro

**Solução**: Verifique os logs do backend e ajuste a validação

### Problema 4: Campo `specialPrices` não existe no modelo
**Sintoma**: Backend retorna erro ou ignora o campo

**Solução no Backend**:
```javascript
// No schema/modelo de Area
const areaSchema = new mongoose.Schema({
  // ... outros campos
  specialPrices: [{
    type: {
      type: String,
      enum: ['date_range', 'day_of_week', 'holiday']
    },
    name: String,
    price: Number,
    active: { type: Boolean, default: true },
    startDate: String,
    endDate: String,
    isPackage: { type: Boolean, default: false },
    daysOfWeek: [Number],
    holidayDate: String
  }]
});
```

## 📋 Checklist de Verificação:

### Frontend:
- [ ] Console mostra `📤 Enviando preços especiais`
- [ ] Payload contém `specialPrices` como array
- [ ] Array não está vazio
- [ ] Cada item tem `type`, `name`, `price`
- [ ] Response do servidor mostra sucesso

### Backend:
- [ ] Rota `PUT /api/areas/:id` existe
- [ ] Campo `specialPrices` está no modelo/schema
- [ ] Validação não está rejeitando os dados
- [ ] `area.specialPrices = updateData.specialPrices` está sendo executado
- [ ] `await area.save()` está sendo chamado
- [ ] Response retorna `specialPrices` atualizado

## 🔧 Teste Manual no Backend:

Teste diretamente no backend para verificar:

```bash
# Exemplo de requisição para testar
curl -X PUT http://localhost:3000/api/areas/SEU_AREA_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "specialPrices": [
      {
        "type": "day_of_week",
        "name": "Finais de Semana",
        "price": 200,
        "daysOfWeek": [0, 6],
        "active": true
      }
    ]
  }'
```

## 📝 O que verificar no código do backend:

1. **No controller de atualização de área:**
```javascript
router.put('/areas/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  
  const area = await Area.findById(id);
  
  // VERIFICAR: Está processando specialPrices?
  if (updateData.specialPrices !== undefined) {
    console.log('📥 Recebendo specialPrices:', updateData.specialPrices);
    area.specialPrices = updateData.specialPrices;
    console.log('💾 Área antes de salvar:', area.specialPrices);
  }
  
  await area.save();
  
  // VERIFICAR: Está retornando specialPrices?
  const saved = await Area.findById(id);
  console.log('✅ Área após salvar:', saved.specialPrices);
  
  res.json({
    success: true,
    data: saved
  });
});
```

2. **No modelo/schema:**
```javascript
// VERIFICAR: Campo specialPrices existe?
specialPrices: [specialPriceSchema] // ou similar
```

## 🎯 Próximos Passos:

1. Abra o console do navegador
2. Tente salvar um preço especial
3. Copie os logs que aparecem
4. Verifique o Network tab
5. Compartilhe os logs para identificar o problema específico
