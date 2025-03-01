/**
 * UI管理模块 - 负责所有界面元素的操作和事件处理
 */
import { Utils } from './utils.js';

export class UIManager {
  constructor() {
    // 存储UI元素引用
    this.elements = {
      // 基本元素
      dropArea: null,
      fileInput: null,
      uploadBtn: null,
      processBtn: null,
      cancelBtn: null,
      errorMessage: null,
      
      // 预览元素
      originalPreview: null,
      originalSize: null,
      originalFileSize: null,
      originalFormat: null,
      processedPreview: null,
      processedSize: null,
      processedFileSize: null,
      processedFormat: null,
      compressionRatio: null,
      
      // 选项元素
      formatSelect: null,
      qualityRange: null,
      qualityValue: null,
      maxWidthInput: null,
      maxHeightInput: null,
      
      // 进度元素
      progressBar: null,
      progressText: null,
      loadingIndicator: null,
      
      // 其他控制元素
      downloadBtn: null,
      downloadAllBtn: null,
      themeToggle: null
    };
    
    // 初始化UI元素
    this.initializeElements();
    
    // 初始化事件监听器
    this.initializeEventListeners();
    
    // 初始化主题
    this.initializeTheme();
    
    // 初始化视图切换
    this.initializeViewSwitching();
  }
  
  // 初始化所有UI元素引用
  initializeElements() {
    // 获取基本元素
    this.elements.dropArea = document.getElementById('drop-area');
    this.elements.fileInput = document.getElementById('file-input');
    this.elements.uploadBtn = document.getElementById('upload-btn');
    this.elements.processBtn = document.getElementById('process-btn');
    this.elements.cancelBtn = document.getElementById('cancel-btn');
    this.elements.errorMessage = document.getElementById('error-message');
    
    // 预览元素
    this.elements.originalPreview = document.getElementById('original-preview');
    this.elements.originalSize = document.getElementById('original-size');
    this.elements.originalFileSize = document.getElementById('original-file-size');
    this.elements.originalFormat = document.getElementById('original-format');
    this.elements.processedPreview = document.getElementById('processed-preview');
    this.elements.processedSize = document.getElementById('processed-size');
    this.elements.processedFileSize = document.getElementById('processed-file-size');
    this.elements.processedFormat = document.getElementById('processed-format');
    this.elements.compressionRatio = document.getElementById('comparison-ratio') || document.getElementById('compression-ratio');
    
    // 选项元素
    this.elements.formatSelect = document.getElementById('format-select');
    this.elements.qualityRange = document.getElementById('quality-range');
    this.elements.qualityValue = document.getElementById('quality-value');
    this.elements.maxWidthInput = document.getElementById('max-width-input');
    this.elements.maxHeightInput = document.getElementById('max-height-input');
    
    // 进度元素
    this.elements.progressBar = document.getElementById('progress-bar');
    this.elements.progressText = document.getElementById('progress-text');
    this.elements.loadingIndicator = document.getElementById('loading-indicator');
    
    // 下载按钮
    this.elements.downloadBtn = document.getElementById('download-btn');
    this.elements.downloadAllBtn = document.getElementById('download-all-btn');
    
    // 主题切换
    this.elements.themeToggle = document.getElementById('theme-toggle');
    
    // 如果没有下载全部按钮，则创建一个
    this.createDownloadAllButton();
  }
  
  // 创建下载全部按钮
  createDownloadAllButton() {
    if (document.getElementById('download-all-btn')) return;
    
    const downloadContainer = this.elements.downloadBtn?.parentElement;
    if (!downloadContainer) return;
    
    const downloadAllBtn = document.createElement('button');
    downloadAllBtn.id = 'download-all-btn';
    downloadAllBtn.className = 'btn success-btn';
    downloadAllBtn.innerHTML = '<i class="fas fa-download"></i> 下载全部';
    downloadAllBtn.classList.add('hidden');
    
    downloadContainer.appendChild(downloadAllBtn);
    this.elements.downloadAllBtn = downloadAllBtn;
  }
  
  // 初始化事件监听器
  initializeEventListeners() {
    // 这些事件将在FileManager和ImageProcessor中被设置
    // 这里只设置UI相关的事件
    
    // 主题切换
    if (this.elements.themeToggle) {
      this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());
    }
    
    // 画质滑块
    if (this.elements.qualityRange && this.elements.qualityValue) {
      this.elements.qualityRange.addEventListener('input', () => {
        this.elements.qualityValue.textContent = this.elements.qualityRange.value;
      });
    }
    
    // 视图切换按钮
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.switchView(e));
    });
    
    // 清空按钮
    const clearAllBtn = document.getElementById('clear-all-btn');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => {
        // 这将触发一个自定义事件，由FileManager处理
        if (confirm('确定要清空所有图片吗？')) {
          const event = new CustomEvent('clearAllFiles');
          document.dispatchEvent(event);
        }
      });
    }
  }
  
  // 初始化主题
  initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-theme');
      if (this.elements.themeToggle) {
        this.elements.themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
      }
    }
  }
  
  // 切换明暗主题
  toggleTheme() {
    const isDark = document.body.classList.toggle('dark-theme');
    if (this.elements.themeToggle) {
      this.elements.themeToggle.innerHTML = isDark ? 
        '<i class="fas fa-sun"></i>' : 
        '<i class="fas fa-moon"></i>';
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }
  
  // 切换视图模式
  switchView(e) {
    const targetView = e.currentTarget.getAttribute('data-view');
    
    // 更新按钮状态
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    e.currentTarget.classList.add('active');
    
    // 更新视图显示
    document.querySelectorAll('.view-panel').forEach(panel => {
      if (panel.id === `${targetView}-view`) {
        panel.classList.add('active');
      } else {
        panel.classList.remove('active');
      }
    });
  }
  
  // 初始化视图切换
  initializeViewSwitching() {
    const viewButtons = document.querySelectorAll('.view-btn');
    const viewPanels = document.querySelectorAll('.view-panel');
    
    if (!viewButtons.length || !viewPanels.length) return;
    
    viewButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const viewType = btn.getAttribute('data-view');
        console.log('切换视图到:', viewType);
        
        // 更新按钮状态
        viewButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // 更新面板显示
        viewPanels.forEach(panel => {
          if (panel.id === `${viewType}-view`) {
            panel.classList.add('active');
          } else {
            panel.classList.remove('active');
          }
        });
      });
    });
  }
  
  // 显示错误消息
  showError(message, duration = 3000) {
    if (!this.elements.errorMessage) return;
    
    this.elements.errorMessage.textContent = message;
    this.elements.errorMessage.style.display = 'block';
    
    if (duration > 0) {
      setTimeout(() => {
        this.elements.errorMessage.style.display = 'none';
      }, duration);
    }
  }
  
  // 更新进度条
  updateProgress(processedCount, totalCount) {
    const progress = Math.round((processedCount / totalCount) * 100);
    
    if (this.elements.progressBar) {
      this.elements.progressBar.style.width = `${progress}%`;
    }
    
    if (this.elements.progressText) {
      this.elements.progressText.textContent = `${processedCount}/${totalCount} (${progress}%)`;
    }
  }
  
  // 显示原始图片预览
  displayOriginalImage(file) {
    if (!this.elements.originalPreview) return;
    
    this.elements.originalPreview.innerHTML = '';
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    
    img.onload = () => {
      if (this.elements.originalSize) {
        this.elements.originalSize.textContent = `${img.naturalWidth} × ${img.naturalHeight}`;
      }
      URL.revokeObjectURL(img.src);
    };
    
    this.elements.originalPreview.appendChild(img);
    
    if (this.elements.originalFileSize) {
      this.elements.originalFileSize.textContent = Utils.formatFileSize(file.size);
    }
    
    if (this.elements.originalFormat) {
      this.elements.originalFormat.textContent = file.name.split('.').pop().toUpperCase();
    }
  }
  
  // 显示处理结果
  displayProcessedResult(result, originalFile) {
    if (!result) return;
    
    // 显示处理后的图片
    if (this.elements.processedPreview) {
      this.elements.processedPreview.innerHTML = '';
      const img = document.createElement('img');
      
      // 确保data包含完整的data URL
      if (result.data && !result.data.startsWith('data:')) {
        img.src = `data:image/${result.format};base64,${result.data}`;
      } else {
        img.src = result.data;
      }
      
      this.elements.processedPreview.appendChild(img);
    }
    
    // 显示处理后信息
    if (this.elements.processedSize) {
      this.elements.processedSize.textContent = `${result.width} × ${result.height}`;
    }
    
    if (this.elements.processedFileSize) {
      this.elements.processedFileSize.textContent = Utils.formatFileSize(result.size);
    }
    
    if (this.elements.processedFormat) {
      this.elements.processedFormat.textContent = result.format.toUpperCase();
    }
    
    // 显示压缩率
    if (this.elements.compressionRatio && originalFile) {
      const originalSize = originalFile.size;
      const newSize = result.size;
      const savingsPercent = ((originalSize - newSize) / originalSize * 100).toFixed(1);
      
      if (savingsPercent > 0) {
        this.elements.compressionRatio.innerHTML = `
          <span>${savingsPercent}%</span>
          <small>节省</small>
        `;
        this.elements.compressionRatio.style.backgroundColor = 'var(--success-color)';
      } else {
        this.elements.compressionRatio.innerHTML = `
          <span>${Math.abs(savingsPercent)}%</span>
          <small>增加</small>
        `;
        this.elements.compressionRatio.style.backgroundColor = 'var(--warning-color)';
      }
    }
    
    // 显示下载按钮
    if (this.elements.downloadBtn) {
      this.elements.downloadBtn.classList.remove('hidden');
    }
  }
  
  // 更新文件卡片状态
  updateImagesStatus(results) {
    const cards = document.querySelectorAll('.image-card');
    
    cards.forEach((card, index) => {
      const statusElement = card.querySelector('.image-status');
      if (!statusElement) return;
      
      if (index < results.length) {
        // 处理成功
        statusElement.className = 'image-status status-success';
        statusElement.innerHTML = '<i class="fas fa-check"></i>';
        
        // 可以在这里添加显示压缩率的代码
      } else {
        // 处理失败
        statusElement.className = 'image-status status-error';
        statusElement.innerHTML = '<i class="fas fa-times"></i>';
      }
    });
  }
  
  // 获取处理选项
  getProcessingOptions() {
    return {
      quality: parseInt(this.elements.qualityRange?.value || "85"),
      format: this.elements.formatSelect?.value || "jpeg",
      max_width: this.elements.maxWidthInput?.value ? parseInt(this.elements.maxWidthInput.value) : null,
      max_height: this.elements.maxHeightInput?.value ? parseInt(this.elements.maxHeightInput.value) : null,
      optimize: document.getElementById('optimize')?.checked || false,
      strip_metadata: document.getElementById('strip-metadata')?.checked || false,
      progressive: false
    };
  }
} 