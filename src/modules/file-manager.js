import { Utils } from './utils.js';

/**
 * 文件管理模块 - 负责文件上传、预览和管理
 */
export class FileManager {
  constructor(uiManager) {
    this.uiManager = uiManager;
    this.currentFiles = [];
    this.currentFileIndex = 0;
    this.processedResults = [];
    
    // 初始化文件相关事件监听器
    this.initializeEventListeners();
  }
  
  initializeEventListeners() {
    const elements = this.uiManager.elements;
    
    // 文件选择器
    if (elements.fileInput) {
      elements.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
    }
    
    // 上传按钮
    if (elements.uploadBtn) {
      elements.uploadBtn.addEventListener('click', () => {
        elements.fileInput.click();
      });
    }
    
    // 拖放区域
    if (elements.dropArea) {
      elements.dropArea.addEventListener('dragover', (e) => this.handleDragOver(e));
      elements.dropArea.addEventListener('dragleave', () => this.handleDragLeave());
      elements.dropArea.addEventListener('drop', (e) => this.handleDrop(e));
    }
    
    // 下载按钮
    if (elements.downloadBtn) {
      elements.downloadBtn.addEventListener('click', () => this.downloadProcessedImage());
    }
    
    // 下载全部按钮
    if (elements.downloadAllBtn) {
      elements.downloadAllBtn.addEventListener('click', () => this.downloadAllProcessedImages());
    }
    
    // 清空所有文件的自定义事件
    document.addEventListener('clearAllFiles', () => this.clearAllFiles());
  }
  
  // 处理文件选择
  handleFileSelect(e) {
    if (e.target.files.length) {
      this.handleFiles(Array.from(e.target.files));
    }
  }
  
  // 处理多个文件
  handleFiles(files) {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      this.uiManager.showError('请选择有效的图片文件');
      return;
    }

    this.currentFiles = imageFiles;
    this.currentFileIndex = 0;
    this.uiManager.elements.processBtn.disabled = false;
    this.uiManager.elements.errorMessage.style.display = 'none';
    
    // 更新文件计数器和显示
    this.updateFilesCounter();
    this.updateFilesDisplay();

    // 显示第一个文件的预览
    this.previewFile(this.currentFiles[0]);
  }
  
  // 预览单个文件
  previewFile(file) {
    this.uiManager.displayOriginalImage(file);
    
    // 清空处理结果
    if (this.uiManager.elements.processedPreview) {
      this.uiManager.elements.processedPreview.innerHTML = '<p>等待处理</p>';
    }
    if (this.uiManager.elements.processedSize) {
      this.uiManager.elements.processedSize.textContent = '-';
    }
    if (this.uiManager.elements.processedFileSize) {
      this.uiManager.elements.processedFileSize.textContent = '-';
    }
    if (this.uiManager.elements.processedFormat) {
      this.uiManager.elements.processedFormat.textContent = '-';
    }
    if (this.uiManager.elements.compressionRatio) {
      this.uiManager.elements.compressionRatio.innerHTML = '<span>-</span><small>节省</small>';
    }
    if (this.uiManager.elements.downloadBtn) {
      this.uiManager.elements.downloadBtn.classList.add('hidden');
    }
  }
  
  // 更新文件计数器
  updateFilesCounter() {
    const filesCount = document.getElementById('files-count');
    if (filesCount) {
      const countSpan = filesCount.querySelector('span');
      if (countSpan) {
        countSpan.textContent = this.currentFiles.length;
      } else {
        filesCount.textContent = `已选择 ${this.currentFiles.length} 个文件`;
      }
    }
  }
  
  // 更新文件显示
  updateFilesDisplay() {
    console.log("更新文件显示", this.currentFiles.length);
    
    // 获取容器元素
    const imagesGrid = document.getElementById('images-grid');
    const thumbnailsContainer = document.getElementById('thumbnails-container');
    const imagesList = document.getElementById('images-list');
    
    // 清空旧内容
    if (imagesGrid) imagesGrid.innerHTML = '';
    if (thumbnailsContainer) thumbnailsContainer.innerHTML = '';
    if (imagesList) imagesList.innerHTML = '';
    
    // 如果没有文件要显示
    if (this.currentFiles.length === 0) {
      // 网格视图空状态
      if (imagesGrid) {
        imagesGrid.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-images"></i>
            <p>上传图片后将在此显示</p>
          </div>
        `;
      }
      
      // 列表视图空状态
      if (imagesList) {
        const listViewEmptyState = document.querySelector('#list-view .empty-state');
        if (listViewEmptyState) {
          listViewEmptyState.style.display = 'flex';
        }
      }
      
      // 如果有下载全部按钮，隐藏它
      if (this.uiManager.elements.downloadAllBtn) {
        this.uiManager.elements.downloadAllBtn.classList.add('hidden');
      }
      
      // 禁用清空按钮
      const clearAllBtn = document.getElementById('clear-all-btn');
      if (clearAllBtn) {
        clearAllBtn.disabled = true;
      }
      
      return;
    }
    
    // 启用清空按钮
    const clearAllBtn = document.getElementById('clear-all-btn');
    if (clearAllBtn) {
      clearAllBtn.disabled = false;
    }
    
    // 隐藏列表视图空状态
    const listViewEmptyState = document.querySelector('#list-view .empty-state');
    if (listViewEmptyState) {
      listViewEmptyState.style.display = 'none';
    }
    
    // 遍历文件创建UI元素
    this.currentFiles.forEach((file, index) => {
      // 创建网格视图卡片
      if (imagesGrid) {
        this.createGridCard(file, index, imagesGrid);
      }
      
      // 创建列表视图行
      if (imagesList) {
        this.createListRow(file, index, imagesList);
      }
      
      // 创建缩略图(如果需要)
      if (thumbnailsContainer) {
        this.createThumbnail(file, index, thumbnailsContainer);
      }
    });
    
    // 默认选中第一张图片
    const firstCard = document.querySelector('.image-card');
    if (firstCard) {
      firstCard.classList.add('selected');
      this.previewFile(this.currentFiles[0]);
    }
    
    // 如果有多张图片并已处理，显示下载全部按钮
    if (this.uiManager.elements.downloadAllBtn && 
        this.processedResults && 
        this.processedResults.length > 0) {
      this.uiManager.elements.downloadAllBtn.classList.remove('hidden');
      this.uiManager.elements.downloadAllBtn.disabled = false;
    }
    
    // 添加对处理结果的更新逻辑
    if (this.processedResults && this.processedResults.length > 0) {
      this.updateProcessedStatus();
    }
  }
  
  // 创建列表视图行
  createListRow(file, index, container) {
    const row = document.createElement('tr');
    row.className = 'image-row';
    row.dataset.index = index;
    
    // 缩略图单元格
    const thumbnailCell = document.createElement('td');
    thumbnailCell.className = 'image-thumbnail-cell';
    
    const thumbnail = document.createElement('div');
    thumbnail.className = 'image-thumbnail-small';
    
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.onload = () => URL.revokeObjectURL(img.src);
    thumbnail.appendChild(img);
    thumbnailCell.appendChild(thumbnail);
    
    // 文件名单元格
    const nameCell = document.createElement('td');
    nameCell.className = 'image-name-cell';
    nameCell.title = file.name;
    nameCell.textContent = file.name;
    
    // 原始大小单元格
    const sizeCell = document.createElement('td');
    sizeCell.textContent = Utils.formatFileSize(file.size);
    
    // 处理后大小单元格
    const processedSizeCell = document.createElement('td');
    processedSizeCell.className = 'processed-size-cell';
    processedSizeCell.textContent = '-';
    
    // 压缩率单元格
    const compressionCell = document.createElement('td');
    compressionCell.className = 'compression-cell';
    compressionCell.textContent = '-';
    
    // 状态单元格
    const statusCell = document.createElement('td');
    statusCell.className = 'status-cell';
    statusCell.innerHTML = '<span class="status-pending"><i class="fas fa-clock"></i> 等待处理</span>';
    
    // 操作单元格
    const actionCell = document.createElement('td');
    actionCell.className = 'action-cell';
    
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'btn success-btn download-btn list-btn hidden';
    downloadBtn.innerHTML = '<i class="fas fa-download"></i>';
    downloadBtn.title = '下载处理后的图片';
    downloadBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // 防止触发行选择
      if (this.processedResults && this.processedResults[index]) {
        this.downloadSingleProcessedImage(this.processedResults[index], file);
      }
    });
    
    actionCell.appendChild(downloadBtn);
    
    // 组装行
    row.appendChild(thumbnailCell);
    row.appendChild(nameCell);
    row.appendChild(sizeCell);
    row.appendChild(processedSizeCell);
    row.appendChild(compressionCell);
    row.appendChild(statusCell);
    row.appendChild(actionCell);
    
    // 行点击事件处理
    row.addEventListener('click', () => {
      // 移除其他行的选中状态
      document.querySelectorAll('.image-row').forEach(r => r.classList.remove('selected'));
      document.querySelectorAll('.image-card').forEach(c => c.classList.remove('selected'));
      
      // 设置当前行为选中状态
      row.classList.add('selected');
      this.currentFileIndex = index;
      
      // 预览图片
      this.previewFile(file);
      
      // 如果该图片已处理，显示处理结果
      if (this.processedResults && this.processedResults[index]) {
        this.uiManager.displayProcessedResult(this.processedResults[index], file);
      }
    });
    
    container.appendChild(row);
  }
  
  // 更新图片处理状态方法
  updateImagesStatus() {
    // 更新网格视图状态
    const cards = document.querySelectorAll('.image-card');
    cards.forEach((card, index) => {
      const statusElement = card.querySelector('.image-status');
      if (!statusElement) return;
      
      if (this.processedResults && index < this.processedResults.length && this.processedResults[index]) {
        // 处理成功
        statusElement.className = 'image-status status-success';
        statusElement.innerHTML = '<i class="fas fa-check"></i>';
      } else {
        // 处理失败或未处理
        statusElement.className = 'image-status status-error';
        statusElement.innerHTML = '<i class="fas fa-times"></i>';
      }
    });
    
    // 更新列表视图状态
    const rows = document.querySelectorAll('.image-row');
    rows.forEach((row, index) => {
      const statusCell = row.querySelector('.status-cell');
      const downloadBtn = row.querySelector('.download-btn');
      const processedSizeCell = row.querySelector('.processed-size-cell');
      const compressionCell = row.querySelector('.compression-cell');
      
      if (!statusCell) return;
      
      if (this.processedResults && index < this.processedResults.length && this.processedResults[index]) {
        // 处理成功
        const result = this.processedResults[index];
        
        statusCell.innerHTML = '<span class="status-success"><i class="fas fa-check"></i> 已完成</span>';
        
        if (downloadBtn) {
          downloadBtn.classList.remove('hidden');
        }
        
        // 更新处理后大小
        if (processedSizeCell && result.size) {
          processedSizeCell.textContent = Utils.formatFileSize(result.size);
        }
        
        // 更新压缩率
        if (compressionCell && result.size) {
          const originalSize = this.currentFiles[index].size;
          const newSize = result.size;
          const savingsPercent = ((originalSize - newSize) / originalSize * 100).toFixed(1);
          
          if (savingsPercent > 0) {
            compressionCell.innerHTML = `<span class="compression-positive">${savingsPercent}%</span>`;
          } else {
            compressionCell.innerHTML = `<span class="compression-negative">${Math.abs(savingsPercent)}%</span>`;
          }
        }
      } else {
        // 处理失败或未处理
        statusCell.innerHTML = '<span class="status-error"><i class="fas fa-times"></i> 失败</span>';
        
        if (downloadBtn) {
          downloadBtn.classList.add('hidden');
        }
      }
    });
  }
  
  // 下载处理后的图片
  downloadProcessedImage() {
    if (!this.processedResults || !this.processedResults[this.currentFileIndex]) {
      this.uiManager.showError('没有可下载的图片');
      return;
    }
    
    const result = this.processedResults[this.currentFileIndex];
    const originalFile = this.currentFiles[this.currentFileIndex];
    
    // 准备下载链接
    let dataUrl = result.data;
    if (!dataUrl.startsWith('data:')) {
      dataUrl = `data:image/${result.format};base64,${dataUrl}`;
    }
    
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = this.getProcessedFileName(originalFile.name, result.format);
    link.click();
  }
  
  // 下载全部处理后的图片
  downloadAllProcessedImages() {
    if (!this.processedResults || this.processedResults.length === 0) {
      this.uiManager.showError('没有可下载的图片');
      return;
    }
    
    // 创建一个ZIP文件下载
    if (typeof JSZip !== 'undefined') {
      const zip = new JSZip();
      
      // 添加所有处理后的图片到ZIP
      this.processedResults.forEach((result, index) => {
        if (result && result.data) {
          // 获取原始文件名并添加处理标记
          const originalName = this.currentFiles[index]?.name || `image_${index}`;
          const fileName = this.getProcessedFileName(originalName, result.format);
          
          // 检查数据是否是data URL格式
          let base64Data = result.data;
          if (typeof base64Data === 'string' && base64Data.startsWith('data:')) {
            // 提取base64部分
            base64Data = base64Data.split(',')[1];
          }
          
          // 将Base64数据添加到ZIP
          zip.file(fileName, base64Data, {base64: true});
        }
      });
      
      // 生成并下载ZIP文件
      zip.generateAsync({type: 'blob'}).then(content => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `processed_images_${new Date().getTime()}.zip`;
        link.click();
        // 释放URL对象
        setTimeout(() => URL.revokeObjectURL(link.href), 100);
      }).catch(err => {
        this.uiManager.showError('创建ZIP文件失败: ' + err.message);
        console.error('ZIP创建错误:', err);
      });
    } else {
      // 如果没有JSZip库，则单独下载每张图片
      this.processedResults.forEach((result, index) => {
        if (result && result.data) {
          const originalName = this.currentFiles[index]?.name || `image_${index}`;
          const fileName = this.getProcessedFileName(originalName, result.format);
          
          // 确保我们有完整的data URL
          let dataUrl = result.data;
          if (!dataUrl.startsWith('data:')) {
            dataUrl = `data:image/${result.format};base64,${dataUrl}`;
          }
          
          const link = document.createElement('a');
          link.href = dataUrl;
          link.download = fileName;
          link.click();
          
          // 延迟下载以避免浏览器阻止多个下载
          setTimeout(() => {}, 300);
        }
      });
    }
  }
  
  // 获取处理后的文件名
  getProcessedFileName(originalName, format) {
    // 移除原始扩展名并添加新的扩展名
    const baseName = originalName.includes('.') 
      ? originalName.substring(0, originalName.lastIndexOf('.')) 
      : originalName;
    
    return `${baseName}_processed.${format}`;
  }
  
  // 拖拽处理函数
  handleDragOver(e) {
    e.preventDefault();
    this.uiManager.elements.dropArea.classList.add('dragover');
  }
  
  handleDragLeave() {
    this.uiManager.elements.dropArea.classList.remove('dragover');
  }
  
  handleDrop(e) {
    e.preventDefault();
    this.uiManager.elements.dropArea.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
      this.handleFiles(Array.from(e.dataTransfer.files));
    }
  }
  
  // 清空所有文件
  clearAllFiles() {
    this.currentFiles = [];
    this.processedResults = [];
    this.currentFileIndex = 0;
    this.updateFilesCounter();
    this.updateFilesDisplay();
    this.uiManager.elements.processBtn.disabled = true;
    
    // 清空预览
    if (this.uiManager.elements.originalPreview) {
      this.uiManager.elements.originalPreview.innerHTML = '<p>未选择图片</p>';
    }
    if (this.uiManager.elements.processedPreview) {
      this.uiManager.elements.processedPreview.innerHTML = '<p>等待处理</p>';
    }
  }

  // 添加缺失的createGridCard方法
  createGridCard(file, index, container) {
    const card = document.createElement('div');
    card.className = 'image-card';
    card.dataset.index = index;
    
    // 缩略图
    const thumbnail = document.createElement('div');
    thumbnail.className = 'image-thumbnail';
    
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.onload = () => URL.revokeObjectURL(img.src);
    thumbnail.appendChild(img);
    
    // 信息区
    const info = document.createElement('div');
    info.className = 'image-info';
    
    // 显示文件名和大小
    const fileName = file.name.length > 20 ? file.name.substring(0, 18) + '...' : file.name;
    const fileSize = Utils.formatFileSize(file.size);
    
    info.innerHTML = `
      <div class="image-name" title="${file.name}">${fileName}</div>
      <div class="image-stats">${fileSize}</div>
    `;
    
    // 状态指示
    const status = document.createElement('div');
    status.className = 'image-status';
    status.innerHTML = '<i class="fas fa-clock"></i>';
    
    // 组装卡片
    card.appendChild(thumbnail);
    card.appendChild(info);
    card.appendChild(status);
    
    // 点击事件
    card.addEventListener('click', () => {
      // 移除其他卡片的选择状态
      document.querySelectorAll('.image-card').forEach(c => c.classList.remove('selected'));
      document.querySelectorAll('.image-row').forEach(r => r.classList.remove('selected'));
      
      // 选择当前卡片
      card.classList.add('selected');
      this.currentFileIndex = index;
      
      // 预览图片
      this.previewFile(file);
      
      // 如果已处理，显示结果
      if (this.processedResults && this.processedResults[index]) {
        this.uiManager.displayProcessedResult(this.processedResults[index], file);
      }
    });
    
    // 添加到网格
    container.appendChild(card);
  }

  // 添加缺失的createThumbnail方法
  createThumbnail(file, index, container) {
    const thumb = document.createElement('div');
    thumb.className = 'thumbnail-item';
    thumb.dataset.index = index;
    
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.onload = () => URL.revokeObjectURL(img.src);
    
    thumb.appendChild(img);
    
    // 点击事件
    thumb.addEventListener('click', () => {
      document.querySelectorAll('.thumbnail-item').forEach(t => t.classList.remove('selected'));
      thumb.classList.add('selected');
      this.currentFileIndex = index;
      this.previewFile(file);
      
      if (this.processedResults && this.processedResults[index]) {
        this.uiManager.displayProcessedResult(this.processedResults[index], file);
      }
    });
    
    container.appendChild(thumb);
  }

  // 添加一个单独的方法来更新处理状态
  updateProcessedStatus() {
    const rows = document.querySelectorAll('.image-row');
    
    rows.forEach((row, index) => {
      if (index >= this.processedResults.length || !this.processedResults[index]) return;
      
      const result = this.processedResults[index];
      const statusCell = row.querySelector('.status-cell');
      const processedSizeCell = row.querySelector('.processed-size-cell');
      const compressionCell = row.querySelector('.compression-cell');
      const downloadBtn = row.querySelector('.download-btn');
      
      if (!statusCell || !processedSizeCell || !compressionCell || !downloadBtn) return;
      
      // 更新处理后大小
      processedSizeCell.textContent = Utils.formatFileSize(result.size);
      
      // 计算并更新压缩率
      const originalSize = this.currentFiles[index].size;
      const newSize = result.size;
      const savingsPercent = ((originalSize - newSize) / originalSize * 100).toFixed(1);
      
      if (savingsPercent > 0) {
        compressionCell.innerHTML = `<span class="compression-positive">${savingsPercent}%</span>`;
      } else {
        compressionCell.innerHTML = `<span class="compression-negative">${Math.abs(savingsPercent)}%</span>`;
      }
      
      // 更新状态
      statusCell.innerHTML = '<span class="status-success"><i class="fas fa-check"></i> 已完成</span>';
      
      // 显示下载按钮
      downloadBtn.classList.remove('hidden');
    });
  }
} 