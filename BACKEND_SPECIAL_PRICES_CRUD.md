# CRUD de Preços Especiais - Implementação Backend

Este documento contém a implementação completa do CRUD de preços especiais para o backend.

## 📋 Estrutura de Dados

### Modelo SpecialPrice

```javascript
{
  type: 'date_range' | 'day_of_week' | 'holiday',
  name: String, // Nome descritivo
  price: Number, // Preço (deve ser > 0)
  active: Boolean, // Se está ativo
  // Para tipo 'date_range'
  startDate: String, // YYYY-MM-DD (opcional)
  endDate: String, // YYYY-MM-DD (opcional)
  isPackage: Boolean, // Se é pacote completo (opcional, apenas para date_range)
  // Para tipo 'day_of_week'
  daysOfWeek: [Number], // Array de 0-6 (0=Dom, 6=Sáb) (opcional)
  // Para tipo 'holiday'
  holidayDate: String, // MM-DD (opcional)
}
```

## 🛣️ Rotas

### 1. GET /api/areas/:areaId/special-prices
**Obter todos os preços especiais de uma área**

```javascript
router.get('/areas/:areaId/special-prices', authenticateToken, async (req, res) => {
  try {
    const { areaId } = req.params;
    const userId = req.user.id;

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

### 2. POST /api/areas/:areaId/special-prices
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

    // Adicionar preço especial
    if (!area.specialPrices) {
      area.specialPrices = [];
    }

    area.specialPrices.push(specialPriceData);
    await area.save();

    res.status(201).json({
      success: true,
      message: 'Preço especial criado com sucesso',
      data: specialPriceData
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

### 3. PUT /api/areas/:areaId/special-prices/:priceId
**Atualizar um preço especial**

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

    // Validações
    const validationError = validateSpecialPrice({
      ...area.specialPrices[priceIndex].toObject(),
      ...updateData
    });
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError
      });
    }

    // Verificar se está tentando alterar data retroativa
    const existingPrice = area.specialPrices[priceIndex];
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

### 4. DELETE /api/areas/:areaId/special-prices/:priceId
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

### 5. PUT /api/areas/:areaId/special-prices (Bulk Update)
**Atualizar todos os preços especiais de uma vez**

```javascript
router.put('/areas/:areaId/special-prices', authenticateToken, async (req, res) => {
  try {
    const { areaId } = req.params;
    const userId = req.user.id;
    const { specialPrices } = req.body; // Array de preços especiais

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

    // Validar todos os preços especiais
    if (!Array.isArray(specialPrices)) {
      return res.status(400).json({
        success: false,
        message: 'specialPrices deve ser um array'
      });
    }

    for (const price of specialPrices) {
      const validationError = validateSpecialPrice(price);
      if (validationError) {
        return res.status(400).json({
          success: false,
          message: `Erro de validação: ${validationError}`
        });
      }
    }

    // Atualizar todos os preços especiais
    area.specialPrices = specialPrices;
    await area.save();

    res.json({
      success: true,
      message: 'Preços especiais atualizados com sucesso',
      data: area.specialPrices
    });
  } catch (error) {
    console.error('Erro ao atualizar preços especiais:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar preços especiais'
    });
  }
});
```

## ✅ Função de Validação

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

## 📝 Schema do Mongoose (se estiver usando)

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
  startDate: {
    type: String,
    validate: {
      validator: function(v) {
        if (this.type !== 'date_range') return true;
        return /^\d{4}-\d{2}-\d{2}$/.test(v);
      },
      message: 'Formato de data inválido. Use YYYY-MM-DD'
    }
  },
  endDate: {
    type: String,
    validate: {
      validator: function(v) {
        if (this.type !== 'date_range') return true;
        return /^\d{4}-\d{2}-\d{2}$/.test(v);
      },
      message: 'Formato de data inválido. Use YYYY-MM-DD'
    }
  },
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
  holidayDate: {
    type: String,
    validate: {
      validator: function(v) {
        if (this.type !== 'holiday') return true;
        return /^\d{2}-\d{2}$/.test(v);
      },
      message: 'Formato de data de feriado inválido. Use MM-DD'
    }
  }
}, { _id: true, timestamps: false });

// Adicionar ao schema de Area
const areaSchema = new mongoose.Schema({
  // ... outros campos
  specialPrices: [specialPriceSchema]
});
```

## 🔒 Regras de Negócio

1. **Apenas o dono da área pode gerenciar preços especiais**
2. **Não permite alterar datas retroativas** (períodos que já passaram)
3. **Validação de tipos específicos** conforme o tipo de preço especial
4. **Preço deve ser maior que zero**
5. **Para períodos especiais (date_range)**: data final deve ser posterior à inicial
6. **Para dias da semana**: deve ter pelo menos um dia selecionado
7. **Para feriados**: formato MM-DD válido

## 📌 Exemplo de Uso

### Criar preço especial (Período)
```javascript
POST /api/areas/123/special-prices
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

### Criar preço especial (Dias da Semana)
```javascript
POST /api/areas/123/special-prices
{
  "type": "day_of_week",
  "name": "Finais de Semana",
  "price": 200,
  "daysOfWeek": [0, 6], // Sábado e Domingo
  "active": true
}
```

### Atualizar todos os preços de uma vez
```javascript
PUT /api/areas/123/special-prices
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

## 🚀 Integração com Frontend

O frontend já está preparado para usar essas rotas através do `areaService.updateArea()`, mas você pode criar um serviço específico:

```typescript
// src/services/specialPriceService.ts
export const specialPriceService = {
  async getSpecialPrices(areaId: string) {
    const response = await api.get(`/areas/${areaId}/special-prices`);
    return response.data;
  },
  
  async createSpecialPrice(areaId: string, data: SpecialPrice) {
    const response = await api.post(`/areas/${areaId}/special-prices`, data);
    return response.data;
  },
  
  async updateSpecialPrice(areaId: string, priceId: string, data: Partial<SpecialPrice>) {
    const response = await api.put(`/areas/${areaId}/special-prices/${priceId}`, data);
    return response.data;
  },
  
  async deleteSpecialPrice(areaId: string, priceId: string) {
    const response = await api.delete(`/areas/${areaId}/special-prices/${priceId}`);
    return response.data;
  },
  
  async updateAllSpecialPrices(areaId: string, specialPrices: SpecialPrice[]) {
    const response = await api.put(`/areas/${areaId}/special-prices`, { specialPrices });
    return response.data;
  }
};
```
