// src/utils/format.js

/**
 * 格式化日期时间字符串
 * @param {string | Date} dateTimeStr 日期时间字符串或 Date 对象
 * @param {string} format 输出格式 (可选)
 * @returns {string} 格式化后的字符串，如果输入无效则返回 '-'
 */
export function formatDateTime(dateTimeStr, format = 'YYYY-MM-DD HH:mm:ss') {
    if (!dateTimeStr) return '-';
    try {
      const date = new Date(dateTimeStr);
      // 简单的年月日时分秒格式化
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
  
      // 可以根据 format 参数扩展更复杂的格式化库，例如 dayjs
      if (format === 'YYYY-MM-DD HH:mm:ss') {
          return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      }
      // 默认返回
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  
    } catch (e) {
      console.warn(`无法格式化日期时间: ${dateTimeStr}`, e);
      // 对于无法解析的字符串，尝试直接返回
      return typeof dateTimeStr === 'string' ? dateTimeStr : '-';
    }
  }
  
  /**
   * 格式化价格，保留两位小数
   * @param {number | string} price 价格
   * @returns {string} 格式化后的价格字符串
   */
  export function formatPrice(price) {
    const num = parseFloat(price);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  }
 