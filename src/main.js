/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   // @TODO: Расчет выручки от операции
      // purchase — это одна из записей в поле items из чека в data.purchase_records
   // _product — это продукт из коллекции data.products
   const { discount, sale_price, quantity } = purchase;
   const effectiveDiscount = discount / 100;
   const revenue = sale_price * quantity;
   const totalRevenue = revenue * (1 - effectiveDiscount);
   return totalRevenue;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчет бонуса от позиции в рейтинге
    const { profit } = seller;

     if (index === 0) {
        return profit * 0.15; // 15%
    } else if (index === 1 || index === 2) {
        return profit * 0.10; // 10%
    } else if (index < total - 1) {
        return profit * 0.05; // 5%
    } else {
        return 0;
    }
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    // @TODO: Проверка входных данных
        if (!data
            || !Array.isArray(data.sellers)
            || !Array.isArray(data.products)
            || !Array.isArray(data.purchase_records)
            || data.sellers.length === 0
            || data.products.length === 0
            || data.purchase_records.length === 0
        ) {
            throw new Error('Некорректные входные данные');
        }
    // @TODO: Проверка наличия опций
    if (typeof options !== 'object' || options === null) {
    throw new Error('Что-то не так с опциями');

    }
    const { calculateRevenue, calculateBonus } = options; 

    if (!calculateRevenue || !calculateBonus) {
        throw new Error('Отсутствуют функции для расчета выручки или бонусов');

    }

    if (typeof calculateRevenue !== 'function' || typeof calculateBonus !== 'function') {
        throw new Error('calculateRevenue и calculateBonus должны быть функциями');

    }
    // @TODO: Подготовка промежуточных данных для сбора статистики

    // Делаю удобный объект товаров по sku,
// чтобы не искать их каждый раз через find
const productIndex = data.products.reduce((index, product) => {
  index[product.sku] = product;
  return index;
}, {});


// Прохожусь по каждому продавцу и собираю по нему статистику
const sellerStats = data.sellers.map(seller => {

  // Беру только те чеки, которые относятся к этому продавцу
  const sellerReceipts = data.purchase_records.filter(
    record => record.seller_id === seller.id
  );

  // Здесь буду накапливать выручку и прибыль
  let totalRevenue = 0;
  let totalProfit = 0;

  // В этом объекте буду считать,
  // сколько какого товара продал продавец
  const productQuantityMap = {};

  // Прохожусь по каждому чеку продавца
  sellerReceipts.forEach(receipt => {

    // Считаю выручку по чеку (с учётом скидки)
    const receiptRevenue = receipt.items.reduce((sum, item) => {
      const discountAmount =
        (item.discount / 100) * item.sale_price * item.quantity;

      return sum + (item.sale_price * item.quantity - discountAmount);
    }, 0);

    totalRevenue += receiptRevenue;

    // Теперь считаю прибыль по каждому товару в чеке
    receipt.items.forEach(item => {
      const product = productIndex[item.sku];

      if (product) {
        const discountAmount =
          (item.discount / 100) * item.sale_price * item.quantity;

        const itemProfit =
          (item.sale_price - product.purchase_price) *
          item.quantity -
          discountAmount;

        totalProfit += itemProfit;

        // Считаю, сколько единиц этого товара продано
        if (!productQuantityMap[item.sku]) {
          productQuantityMap[item.sku] = 0;
        }

        productQuantityMap[item.sku] += item.quantity;
      }
    });
  });

  // Формирую список самых продаваемых товаров (до 10 штук)
  const topProducts = Object.entries(productQuantityMap)
    .map(([sku, quantity]) => ({ sku, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  // Возвращаю готовую статистику по продавцу
  return {
  seller_id: seller.id,
  name: `${seller.first_name} ${seller.last_name}`,
  revenue: totalRevenue,
  profit: totalProfit,
  sales_count: sellerReceipts.length,
  top_products: topProducts,
  products_sold: {},   
  bonus: 0
};
});


// Делаю индекс продавцов по id 
const sellerIndex = sellerStats.reduce((index, seller) => {
  index[seller.seller_id] = seller;
  return index;
}, {});


// Сортирую продавцов по прибыли (от большего к меньшему)
const sortedSellerStats = [...sellerStats]
  .sort((a, b) => b.profit - a.profit);


// Добавляю каждому продавцу его место в рейтинге
const rankedSellerStats = sortedSellerStats.map((seller, index) => ({
  ...seller,
  index // 0 — самый прибыльный
}));


// Считаю бонус в зависимости от позиции в рейтинге
const finalStats = rankedSellerStats.map(seller => ({
  ...seller,
  bonus: calculateBonusByProfit(
    seller.index,
    rankedSellerStats.length,
    seller
  )
}));

    // @TODO: Расчет выручки и прибыли для каждого продавца

   

 /**
 * Функция для расчёта выручки с учётом скидки
 * @param purchase запись о покупке (элемент из record.items)
 * @param _product карточка товара из productIndex
 * @returns {number} выручка от продажи товара с учётом скидки
 */
function calculateSimpleRevenue(purchase, _product) {
  // Записываем в константу discount коэффициент для расчёта суммы без скидки в десятичном формате
  const discountCoefficient = 1 - (purchase.discount / 100);

  // Выручка рассчитывается по формуле:
  // sale_price × количество проданных товаров × коэффициент скидки
  const revenue = purchase.sale_price * purchase.quantity * discountCoefficient;

  return revenue; // Возвращаем итоговую выручку от операции
}

    // @TODO: Сортировка продавцов по прибыли

    sellerStats.sort((a, b) => b.profit - a.profit);

    // @TODO: Назначение премий на основе ранжирования

    sellerStats.forEach((seller, index) => {
    const totalSellers = sellerStats.length;
    seller.bonus = calculateBonus(index, totalSellers, seller);
    seller.top_products = Object.entries(seller.products_sold)
        .map(([sku, quantity]) => ({ sku, quantity })) // преобразуем в массив объектов {sku, quantity}
        .sort((a, b) => b.quantity - a.quantity) // сортируем по убыванию количества проданных единиц
        .slice(0, 10); // оставляем только первые 10 элементов — топ‑10
});

    // @TODO: Подготовка итоговой коллекции с нужными полями
    
return sellerStats.map(seller => ({
    seller_id: seller.seller_id,
    name: seller.name,
    revenue: +seller.revenue.toFixed(2), // Число с двумя знаками после точки, выручка продавца
    profit: +seller.profit.toFixed(2), // Число с двумя знаками после точки, прибыль продавца
    sales_count: seller.sales_count, // Целое число, количество продаж продавца
    top_products: seller.top_products, // Массив объектов вида { "sku": "SKU_008", "quantity": 10 }, топ‑10 товаров продавца
    bonus: +(seller.bonus * 100).toFixed(2) // Число с двумя знаками после точки, бонус продавца в процентах
}));
}
