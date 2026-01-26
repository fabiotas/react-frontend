# 🎯 Implementação CRUD de Preços Especiais - Backend

## 📋 O que precisa ser implementado

Implementar rotas para gerenciar preços especiais das áreas. Os preços especiais são armazenados dentro do modelo `Area` no campo `specialPrices` (array).

---

## 1️⃣ Estrutura de Dados

O campo `specialPrices` no modelo `Area` deve ser um array de objetos com a seguinte estrutura:

```javascript
{
  type: 'date_range' | 'day_of_week' | 'holiday',  // Obrigatório
  name: String,                                    // Obrigatório
  price: Number,                                   // Obrigatório, > 0
  active: Boolean,                                 // Opcional, default: true
  
  // Para type: 'date_range'
  startDate: String,      // YYYY-MM-DD (obrigatório se type = date_range)
  endDate: String,        // YYYY-MM-DD (obrigatório se type = date_range)
  isPackage: Boolean,     // Opcional, default: false (apenas para date_range)
  
  // Para type: 'day_of_week'
  daysOfWeek: [Number],  // Array de 0-6 (0=Dom, 6=Sáb) (obrigatório se type = day_of_week)
  
  // Para type: 'holiday'
  holidayDate: String     // MM-DD (obrigatório se type = holiday)
}
```

---

## 2️⃣ Função de Validação

Adicione esta função de validação no seu controller ou em um arquivo de validações:

```javascript
function validateSpecialPrice(price) {
  // Validar campos obrigatórios
  if (!price.type) {
    return 'Tipo é obrigatório';
  }

  if (!['date_range', 'day_of_week', 'holiday'].includes(price.type)) {
    return 'Tipo inválido. Deve ser: date_range, day_of_week ou holiday';
  }

  if (!price.name || price.name.trim() === '') {
    return 'Nome é obrigatório';
  }

  if (!price.price || price.price <= 0) {
    return 'Preço deve ser maior que zero';
  }

  // Validações específicas por tipo
  if (price.type === 'date_range') {
    if (!price.startDate || !price.endDate) {
      return 'Data inicial e final são obrigatórias para período especial';
    }

    const start = new Date(price.startDate);
    const end = new Date(price.endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 'Datas inválidas';
    }

    if (start >= end) {
      return 'Data final deve ser posterior à data inicial';
    }

    // Validar formato de data (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(price.startDate) || !dateRegex.test(price.endDate)) {
      return 'Formato de data inválido. Use YYYY-MM-DD';
    }

    // Verificar se não é data retroativa
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (end < today) {
      return 'Não é possível criar preços especiais para períodos que já passaram';
    }

    // isPackage é opcional, mas se existir deve ser boolean
    if (price.isPackage !== undefined && typeof price.isPackage !== 'boolean') {
      return 'isPackage deve ser um boolean';
    }
  }

  if (price.type === 'day_of_week') {
    if (!price.daysOfWeek || !Array.isArray(price.daysOfWeek) || price.daysOfWeek.length === 0) {
      return 'Dias da semana são obrigatórios';
    }

    // Validar que são números entre 0 e 6
    for (const day of price.daysOfWeek) {
      if (!Number.isInteger(day) || day < 0 || day > 6) {
        return 'Dias da semana devem ser números entre 0 (domingo) e 6 (sábado)';
      }
    }
  }

  if (price.type === 'holiday') {
    if (!price.holidayDate) {
      return 'Data do feriado é obrigatória';
    }

    // Validar formato MM-DD
    const holidayRegex = /^\d{2}-\d{2}$/;
    if (!holidayRegex.test(price.holidayDate)) {
      return 'Formato de data de feriado inválido. Use MM-DD (ex: 12-25)';
    }

    const [month, day] = price.holidayDate.split('-').map(Number);
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return 'Data de feriado inválida';
    }
  }

  // active é opcional, mas se existir deve ser boolean
  if (price.active !== undefined && typeof price.active !== 'boolean') {
    return 'active deve ser um boolean';
  }

  return null; // Sem erros
}
```

---

## 3️⃣ Rotas a Implementar

### Rota 1: GET /api/areas/:areaId/special-prices
**Obter todos os preços especiais de uma área**

```javascript
router.get('/areas/:areaId/special-prices', authenticateToken, async (req, res) => {
  try {
    const { areaId } = req.params;
    const userId = req.user.id; // Ajuste conforme seu middleware de autenticação

    // Verificar se a área existe e pertence ao usuário
    const area = await Area.findById(areaId);
    if (!area) {
      return res.status(404).json({
        success: false,
        message: 'Área não encontrada'
      });
    }

    // Verificar se o usuário é o dono da área
    if (area.owner.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Você não tem permissão para acessar esta área'
      });
    }

    const specialPrices = area.specialPrices || [];

    res.json({
      success: true,
      count: specialPrices.length,
      data: specialPrices
    });
  } catch (error) {
    console.error('Erro ao buscar preços especiais:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar preços especiais'
    });
  }
});
```

---

### Rota 2: POST /api/areas/:areaId/special-prices
**Criar um novo preço especial**

```javascript
router.post('/areas/:areaId/special-prices', authenticateToken, async (req, res) => {
  try {
    const { areaId } = req.params;
    const userId = req.user.id;
    const specialPriceData = req.body;

    // Verificar se a área existe e pertence ao usuário
    const area = await Area.findById(areaId);
    if (!area) {
      return res.status(404).json({
        success: false,
        message: 'Área não encontrada'
      });
    }

    if (area.owner.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Você não tem permissão para modificar esta área'
      });
    }

    // Validações
    const validationError = validateSpecialPrice(specialPriceData);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError
      });
    }

    // Inicializar array se não existir
    if (!area.specialPrices) {
      area.specialPrices = [];
    }

    // Adicionar preço especial
    area.specialPrices.push(specialPriceData);
    await area.save();

    // Retornar o último preço adicionado (com _id gerado)
    const newPrice = area.specialPrices[area.specialPrices.length - 1];

    res.status(201).json({
      success: true,
      message: 'Preço especial criado com sucesso',
      data: newPrice
    });
  } catch (error) {
    console.error('Erro ao criar preço especial:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar preço especial'
    });
  }
});
```

---

### Rota 3: PUT /api/areas/:areaId/special-prices/:priceId
**Atualizar um preço especial específico**

```javascript
router.put('/areas/:areaId/special-prices/:priceId', authenticateToken, async (req, res) => {
  try {
    const { areaId, priceId } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    // Verificar se a área existe e pertence ao usuário
    const area = await Area.findById(areaId);
    if (!area) {
      return res.status(404).json({
        success: false,
        message: 'Área não encontrada'
      });
    }

    if (area.owner.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Você não tem permissão para modificar esta área'
      });
    }

    // Encontrar o preço especial
    const priceIndex = area.specialPrices.findIndex(
      sp => sp._id.toString() === priceId
    );

    if (priceIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Preço especial não encontrado'
      });
    }

    const existingPrice = area.specialPrices[priceIndex].toObject();

    // Verificar se está tentando alterar data retroativa
    if (existingPrice.type === 'date_range' && existingPrice.endDate) {
      const endDate = new Date(existingPrice.endDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (endDate < today) {
        // Se o período já passou, não permite alterar datas
        if (updateData.startDate || updateData.endDate) {
          return res.status(400).json({
            success: false,
            message: 'Não é possível alterar datas de períodos que já passaram'
          });
        }
      }
    }

    // Mesclar dados atualizados
    const updatedPrice = {
      ...existingPrice,
      ...updateData
    };

    // Validações
    const validationError = validateSpecialPrice(updatedPrice);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError
      });
    }

    // Atualizar preço especial
    Object.assign(area.specialPrices[priceIndex], updateData);
    await area.save();

    res.json({
      success: true,
      message: 'Preço especial atualizado com sucesso',
      data: area.specialPrices[priceIndex]
    });
  } catch (error) {
    console.error('Erro ao atualizar preço especial:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar preço especial'
    });
  }
});
```

---

### Rota 4: DELETE /api/areas/:areaId/special-prices/:priceId
**Excluir um preço especial**

```javascript
router.delete('/areas/:areaId/special-prices/:priceId', authenticateToken, async (req, res) => {
  try {
    const { areaId, priceId } = req.params;
    const userId = req.user.id;

    // Verificar se a área existe e pertence ao usuário
    const area = await Area.findById(areaId);
    if (!area) {
      return res.status(404).json({
        success: false,
        message: 'Área não encontrada'
      });
    }

    if (area.owner.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Você não tem permissão para modificar esta área'
      });
    }

    // Encontrar e remover o preço especial
    const priceIndex = area.specialPrices.findIndex(
      sp => sp._id.toString() === priceId
    );

    if (priceIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Preço especial não encontrado'
      });
    }

    area.specialPrices.splice(priceIndex, 1);
    await area.save();

    res.json({
      success: true,
      message: 'Preço especial excluído com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir preço especial:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao excluir preço especial'
    });
  }
});
```

---

### Rota 5: PUT /api/areas/:areaId/special-prices (Bulk Update)
**Atualizar todos os preços especiais de uma vez**
*Esta é a rota que o frontend já está usando através do updateArea*

```javascript
// Esta rota já deve existir como PUT /api/areas/:areaId
// Mas você precisa garantir que valide os specialPrices quando vierem no body

// No seu controller de atualização de área, adicione:
if (updateData.specialPrices !== undefined) {
  // Validar todos os preços especiais
  if (!Array.isArray(updateData.specialPrices)) {
    return res.status(400).json({
      success: false,
      message: 'specialPrices deve ser um array'
    });
  }

  for (const price of updateData.specialPrices) {
    const validationError = validateSpecialPrice(price);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: `Erro de validação no preço especial: ${validationError}`
      });
    }
  }

  // Atualizar todos os preços especiais
  area.specialPrices = updateData.specialPrices;
}
```

---

## 4️⃣ Atualizar Modelo/Schema

### Se estiver usando Mongoose:

```javascript
const specialPriceSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['date_range', 'day_of_week', 'holiday'],
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0.01
  },
  active: {
    type: Boolean,
    default: true
  },
  // Para date_range
  startDate: String,
  endDate: String,
  isPackage: {
    type: Boolean,
    default: false
  },
  // Para day_of_week
  daysOfWeek: [{
    type: Number,
    min: 0,
    max: 6
  }],
  // Para holiday
  holidayDate: String
}, { _id: true, timestamps: false });

// No schema de Area, adicione:
const areaSchema = new mongoose.Schema({
  // ... seus outros campos
  specialPrices: [specialPriceSchema]
});
```

---

## 5️⃣ Exemplos de Requisições

### Criar Preço Especial - Período Especial
```bash
POST /api/areas/123/special-prices
Content-Type: application/json
Authorization: Bearer <token>

{
  "type": "date_range",
  "name": "Alta Temporada",
  "price": 500,
  "startDate": "2026-12-15",
  "endDate": "2027-02-28",
  "isPackage": false,
  "active": true
}
```

### Criar Preço Especial - Pacote
```bash
POST /api/areas/123/special-prices
Content-Type: application/json
Authorization: Bearer <token>

{
  "type": "date_range",
  "name": "Pacote Natal",
  "price": 2000,
  "startDate": "2026-12-24",
  "endDate": "2026-12-27",
  "isPackage": true,
  "active": true
}
```

### Criar Preço Especial - Dias da Semana
```bash
POST /api/areas/123/special-prices
Content-Type: application/json
Authorization: Bearer <token>

{
  "type": "day_of_week",
  "name": "Finais de Semana",
  "price": 200,
  "daysOfWeek": [0, 6],
  "active": true
}
```

### Atualizar Preço Especial
```bash
PUT /api/areas/123/special-prices/456
Content-Type: application/json
Authorization: Bearer <token>

{
  "price": 250,
  "active": false
}
```

### Excluir Preço Especial
```bash
DELETE /api/areas/123/special-prices/456
Authorization: Bearer <token>
```

### Atualizar Todos (Bulk) - Usado pelo Frontend
```bash
PUT /api/areas/123
Content-Type: application/json
Authorization: Bearer <token>

{
  "specialPrices": [
    {
      "type": "day_of_week",
      "name": "Finais de Semana",
      "price": 200,
      "daysOfWeek": [0, 6],
      "active": true
    },
    {
      "type": "date_range",
      "name": "Natal",
      "price": 600,
      "startDate": "2026-12-24",
      "endDate": "2026-12-27",
      "isPackage": true,
      "active": true
    }
  ]
}
```

---

## 6️⃣ Regras de Negócio Importantes

1. ✅ **Apenas o dono da área pode gerenciar preços especiais**
2. ✅ **Não permite alterar datas retroativas** (períodos que já passaram)
3. ✅ **Não permite criar preços especiais para períodos que já passaram**
4. ✅ **Validação de tipos específicos** conforme o tipo de preço especial
5. ✅ **Preço deve ser maior que zero**
6. ✅ **Para períodos especiais**: data final deve ser posterior à inicial
7. ✅ **Para dias da semana**: deve ter pelo menos um dia selecionado
8. ✅ **Para feriados**: formato MM-DD válido

---

## 7️⃣ Checklist de Implementação

- [ ] Adicionar campo `specialPrices` no modelo/schema de Area
- [ ] Criar função `validateSpecialPrice()`
- [ ] Implementar GET `/api/areas/:areaId/special-prices`
- [ ] Implementar POST `/api/areas/:areaId/special-prices`
- [ ] Implementar PUT `/api/areas/:areaId/special-prices/:priceId`
- [ ] Implementar DELETE `/api/areas/:areaId/special-prices/:priceId`
- [ ] Atualizar PUT `/api/areas/:areaId` para validar `specialPrices` quando vier no body
- [ ] Testar todas as rotas
- [ ] Validar permissões (apenas dono da área)
- [ ] Validar datas retroativas

---

## 8️⃣ Notas Importantes

- O frontend já está usando a rota `PUT /api/areas/:areaId` com `specialPrices` no body
- As rotas individuais (GET, POST, PUT, DELETE) são opcionais, mas úteis para operações específicas
- Certifique-se de que o middleware `authenticateToken` está funcionando corretamente
- Ajuste `req.user.id` conforme sua implementação de autenticação
- Use `area.owner.toString() === userId` ou a comparação que seu modelo usa

---

## ✅ Pronto para Implementar!

Copie e cole essas rotas no seu arquivo de rotas do backend, ajuste conforme necessário e teste!
