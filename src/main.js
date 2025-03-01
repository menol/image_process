// 引入模块
import { UIManager } from './modules/ui-manager.js';
import { FileManager } from './modules/file-manager.js';
import { ImageProcessor } from './modules/image-processor.js';
import { Utils } from './modules/utils.js';

// 初始化应用
window.addEventListener('DOMContentLoaded', () => {
  // 初始化各个模块
  const uiManager = new UIManager();
  const fileManager = new FileManager(uiManager);
  const imageProcessor = new ImageProcessor(fileManager, uiManager);
  
  // 将模块实例绑定到window以便开发调试
  if (import.meta.env?.DEV) {
    window.app = {
      ui: uiManager,
      files: fileManager,
      processor: imageProcessor,
      utils: Utils
    };
  }
  
  // 处理清空按钮事件(如果存在)
  const clearAllBtn = document.getElementById('clear-all-btn');
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', () => {
      if (confirm('确定要清空所有图片吗？')) {
        // 触发清空事件
        document.dispatchEvent(new CustomEvent('clearAllFiles'));
      }
    });
  }
});

