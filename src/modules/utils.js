/**
 * 工具函数模块 - 提供各种辅助函数
 */
export class Utils {
  // 格式化文件大小
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  // 安全获取元素值的辅助函数
  static safeGetElementValue(element, defaultValue) {
    if (element && element.value) {
      return element.value;
    }
    return defaultValue;
  }
  
  // 防抖函数
  static debounce(fn, delay) {
    let timer = null;
    return function(...args) {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        fn.apply(this, args);
      }, delay);
    };
  }
  
  // 节流函数
  static throttle(fn, delay) {
    let lastCall = 0;
    return function(...args) {
      const now = new Date().getTime();
      if (now - lastCall < delay) return;
      lastCall = now;
      return fn.apply(this, args);
    };
  }
} 