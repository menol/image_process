/**
 * 图片处理模块 - 负责实际的图片处理业务逻辑
 */
export class ImageProcessor {
  constructor(fileManager, uiManager) {
    this.fileManager = fileManager;
    this.uiManager = uiManager;
    this.isProcessing = false;
    this.totalImages = 0;
    this.processedImages = 0;
    this.processingCancelled = false;
    
    // 初始化处理相关事件监听器
    this.initializeEventListeners();
  }
  
  initializeEventListeners() {
    const elements = this.uiManager.elements;
    
    // 处理按钮
    if (elements.processBtn) {
      elements.processBtn.addEventListener('click', () => this.processImage());
    }
    
    // 取消按钮
    if (elements.cancelBtn) {
      elements.cancelBtn.addEventListener('click', () => this.cancelProcessing());
    }
  }
  
  // 取消处理
  cancelProcessing() {
    this.processingCancelled = true;
    if (this.uiManager.elements.cancelBtn) {
      this.uiManager.elements.cancelBtn.disabled = true;
    }
    this.uiManager.showError('已取消处理');
  }
  
  // 处理图片
  async processImage() {
    if (this.fileManager.currentFiles.length === 0) return;
    
    this.totalImages = this.fileManager.currentFiles.length;
    this.processedImages = 0;
    this.processingCancelled = false;
    this.fileManager.processedResults = []; // 重置处理结果
    
    // 检查元素是否存在
    const elements = this.uiManager.elements;
    if (elements.loadingIndicator) {
      elements.loadingIndicator.style.display = 'block';
    }
    if (elements.processBtn) {
      elements.processBtn.disabled = true;
    }
    if (elements.cancelBtn) {
      elements.cancelBtn.disabled = false;
    }
    
    // 初始化所有图片卡片状态为等待处理
    const cards = document.querySelectorAll('.image-card');
    cards.forEach(card => {
      const statusElement = card.querySelector('.image-status');
      if (statusElement) {
        statusElement.className = 'image-status';
        statusElement.innerHTML = '<i class="fas fa-hourglass"></i>';
      }
    });
    
    this.updateProgress();
    
    try {
      // 获取处理选项
      const options = this.uiManager.getProcessingOptions();
      
      // 准备批量处理
      const base64DataList = await Promise.all(
        this.fileManager.currentFiles.map(file => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        })
      );
      
      // 调用Rust后端进行图片处理
      const result = await window.__TAURI__.core.invoke("app_process_image", {
        base64DataList: base64DataList,
        optionsJson: JSON.stringify(options)
      });
      
      // 处理结果
      if (result && result.results) {
        // 保存处理结果
        this.fileManager.processedResults = result.results;
        
        // 显示第一个结果
        if (this.fileManager.processedResults.length > 0) {
          this.uiManager.displayProcessedResult(
            this.fileManager.processedResults[0], 
            this.fileManager.currentFiles[0]
          );
        }
        
        // 更新图片卡片状态
        this.uiManager.updateImagesStatus(this.fileManager.processedResults);
        
        // 更新列表视图状态
        if (this.fileManager.updateProcessedStatus) {
          this.fileManager.updateProcessedStatus();
        }
        
        // 更新下载按钮状态
        if (elements.downloadAllBtn) {
          elements.downloadAllBtn.disabled = this.fileManager.processedResults.length === 0;
          
          if (this.fileManager.processedResults.length > 1) {
            elements.downloadAllBtn.classList.remove('hidden');
          }
        }
      }
    } catch (error) {
      this.uiManager.showError(`处理图片时出错: ${error.message || error}`);
      console.error('图片处理错误:', error);
    } finally {
      // 更新界面
      if (elements.loadingIndicator) {
        elements.loadingIndicator.style.display = 'none';
      }
      if (elements.processBtn) {
        elements.processBtn.disabled = false;
      }
      if (elements.cancelBtn) {
        elements.cancelBtn.disabled = true;
      }
      this.isProcessing = false;
    }
  }
  
  // 更新进度条
  updateProgress() {
    this.uiManager.updateProgress(this.processedImages, this.totalImages);
    
    // 更新当前处理图片的视觉指示
    const cards = document.querySelectorAll('.image-card');
    cards.forEach((card, index) => {
      const statusElement = card.querySelector('.image-status');
      if (!statusElement) return;
      
      if (index === this.processedImages && this.processedImages < this.totalImages) {
        // 当前正在处理的图片
        statusElement.className = 'image-status status-processing';
        statusElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      }
    });
  }
} 