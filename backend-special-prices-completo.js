/**
 * ROTAS COMPLETAS PARA CRUD DE PREÇOS ESPECIAIS
 * 
 * Copie e cole este código no seu arquivo de rotas do backend
 * Ajuste conforme sua estrutura (Express, Fastify, etc.)
 */

const express = require('express');
const router = express.Router();
// Ajuste conforme seu modelo
// const Area = require('../models/Area');
// const authenticateToken = require('../middleware/auth');

// ============================================
// FUNÇÃO DE VALIDAÇÃO
// ============================================
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

// ============================================
// ROTA 1: GET - Obter todos os preços especiais
// ============================================
router.get('/areas/:areaId/special-prices', authenticateToken, async (req, res) => {
  try {
    const { areaId } = req.params;
    const userId = req.user.id; // Ajuste conforme seu middleware

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

// ============================================
// ROTA 2: POST - Criar novo preço especial
// ============================================
router.post('/areas/:areaId/special-prices', authenticateToken, async (req, res) => {
  try {
    const { areaId } = req.params;
    const userId = req.user.id;
    const specialPriceData = req.body;

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

// ============================================
// ROTA 3: PUT - Atualizar preço especial
// ============================================
router.put('/areas/:areaId/special-prices/:priceId', authenticateToken, async (req, res) => {
  try {
    const { areaId, priceId } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

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

// ============================================
// ROTA 4: DELETE - Excluir preço especial
// ============================================
router.delete('/areas/:areaId/special-prices/:priceId', authenticateToken, async (req, res) => {
  try {
    const { areaId, priceId } = req.params;
    const userId = req.user.id;

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

module.exports = router;

// ============================================
// IMPORTANTE: Atualizar rota PUT /api/areas/:areaId
// ============================================
// No seu controller de atualização de área, adicione esta validação:

/*
router.put('/areas/:areaId', authenticateToken, async (req, res) => {
  try {
    const { areaId } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    const area = await Area.findById(areaId);
    // ... validações de permissão ...

    // ADICIONAR ESTA VALIDAÇÃO:
    if (updateData.specialPrices !== undefined) {
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

      area.specialPrices = updateData.specialPrices;
    }

    // ... resto do código de atualização ...
  } catch (error) {
    // ... tratamento de erro ...
  }
});
*/
