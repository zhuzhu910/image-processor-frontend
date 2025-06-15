// 🌊 海下声纳图像阴影去除系统 - JavaScript逻辑

class SonarShadowRemover {
    constructor() {
        // ⚠️ 重要：这里需要替换为Kaggle返回的实际URL
        this.apiUrl = 'https://c0c5-35-224-205-219.ngrok-free.app';  // 从Kaggle输出中复制
        this.currentImageData = null;
        this.isProcessing = false;
        this.retryCount = 0;
        this.maxRetries = 3;
        
        this.initializeElements();
        this.bindEvents();
        this.testConnection();
    }

    /**
     * 🎯 初始化DOM元素
     */
    initializeElements() {
        this.uploadArea = document.getElementById('uploadArea');
        this.imageInput = document.getElementById('imageInput');
        this.controlsSection = document.getElementById('controlsSection');
        this.resultsSection = document.getElementById('resultsSection');
        this.algorithmInfo = document.getElementById('algorithmInfo');
        this.originalImage = document.getElementById('originalImage');
        this.processedImage = document.getElementById('processedImage');
        this.loadingIndicator = document.getElementById('loadingIndicator');
        this.resetBtn = document.getElementById('resetBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.operationBtns = document.querySelectorAll('.operation-btn');
        this.statusDiv = document.getElementById('connectionStatus') || this.createStatusDiv();
    }

    /**
     * 🔗 创建连接状态指示器
     */
    createStatusDiv() {
        const statusDiv = document.createElement('div');
        statusDiv.id = 'connectionStatus';
        statusDiv.textContent = '🔄 检查连接...';
        document.body.appendChild(statusDiv);
        return statusDiv;
    }

    /**
     * 🧪 测试与Kaggle API的连接
     */
    async testConnection() {
        this.updateStatus('🔄 正在测试Kaggle连接...', '#007bff');
        
        try {
            const response = await fetch(`${this.apiUrl}/health`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 10000
            });

            if (response.ok) {
                const data = await response.json();
                this.updateStatus('✅ Kaggle连接成功', '#28a745');
                console.log('🎉 Kaggle API连接成功:', data);
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.error('❌ Kaggle连接失败:', error);
            this.updateStatus('❌ Kaggle连接失败', '#dc3545');
            this.showConnectionHelp();
        }
    }

    /**
     * 🔄 更新连接状态显示
     */
    updateStatus(message, color = '#6c757d') {
        if (this.statusDiv) {
            this.statusDiv.textContent = message;
            this.statusDiv.style.backgroundColor = color;
        }
    }

    /**
     * 💡 显示连接帮助信息
     */
    showConnectionHelp() {
        const helpMessage = `
🔧 连接问题解决方案：

1. 检查Kaggle是否正在运行：
   - 确保Kaggle notebook正在运行
   - 查看ngrok输出的公网地址

2. 更新API地址：
   - 将Kaggle输出的ngrok地址复制到代码中
   - 格式：https://xxxxx.ngrok-free.app

3. 网络问题：
   - 检查网络连接
   - 尝试刷新页面

当前尝试连接: ${this.apiUrl}
        `;
        
        console.log(helpMessage);
        this.showMessage('连接失败，请检查控制台获取帮助信息', 'error');
    }

    /**
     * 🎮 绑定事件监听器
     */
    bindEvents() {
        // 上传区域事件
        this.uploadArea.addEventListener('click', () => this.imageInput.click());
        this.uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        this.uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        
        // 文件输入事件
        this.imageInput.addEventListener('change', this.handleFileSelect.bind(this));
        
        // 操作按钮事件
        this.operationBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.isProcessing) {
                    this.showMessage('请等待当前处理完成', 'warning');
                    return;
                }
                
                const operation = btn.dataset.operation;
                this.processImage(operation);
                
                // 视觉反馈
                this.operationBtns.forEach(b => b.style.opacity = '0.6');
                btn.style.opacity = '1';
                setTimeout(() => {
                    this.operationBtns.forEach(b => b.style.opacity = '1');
                }, 3000);
            });
        });
        
        // 重置按钮事件
        this.resetBtn?.addEventListener('click', this.reset.bind(this));
        
        // 下载按钮事件
        this.downloadBtn?.addEventListener('click', this.downloadResult.bind(this));
    }

    /**
     * 🔄 处理拖拽悬停
     */
    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.classList.add('dragover');
    }

    /**
     * 🔄 处理拖拽离开
     */
    handleDragLeave(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
    }

    /**
     * 📂 处理文件拖拽放置
     */
    handleDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.handleFile(files[0]);
        }
    }

    /**
     * 📂 处理文件选择
     */
    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.handleFile(file);
        }
    }

    /**
     * 📷 处理上传的文件
     */
    handleFile(file) {
        // 检查文件类型
        if (!file.type.startsWith('image/')) {
            this.showMessage('请选择图片文件！', 'error');
            return;
        }

        // 检查文件大小（5MB限制，避免超时）
        if (file.size > 5 * 1024 * 1024) {
            this.showMessage('图片文件不能超过5MB！', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.currentImageData = e.target.result;
            this.originalImage.src = this.currentImageData;
            this.originalImage.style.display = 'block';
            this.showControls();
        };
        reader.readAsDataURL(file);
    }

    /**
     * 🎛️ 显示控制面板
     */
    showControls() {
        if (this.controlsSection) {
            this.controlsSection.style.display = 'block';
            this.controlsSection.classList.add('fade-in');
        }
        if (this.resultsSection) {
            this.resultsSection.style.display = 'block';
            this.resultsSection.classList.add('fade-in');
        }
        if (this.algorithmInfo) {
            this.algorithmInfo.style.display = 'block';
            this.algorithmInfo.classList.add('fade-in');
        }
        if (this.resetBtn) this.resetBtn.style.display = 'inline-block';
        
        // 滚动到控制区域
        this.controlsSection?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
    }

    /**
     * 🌊 处理声纳图像
     */
    async processImage(operation) {
        if (!this.currentImageData) {
            this.showMessage('请先选择图片！', 'error');
            return;
        }

        if (this.isProcessing) {
            this.showMessage('正在处理中，请稍等...', 'warning');
            return;
        }

        this.isProcessing = true;
        this.retryCount = 0;
        await this.processWithRetry(operation);
    }

    /**
     * 🔄 带重试机制的处理函数
     */
    async processWithRetry(operation) {
        this.showLoading();
        this.updateStatus('🌊 正在处理声纳图像...', '#007bff');

        try {
            console.log(`🌟 开始处理，操作: ${operation}, 尝试次数: ${this.retryCount + 1}`);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时

            const response = await fetch(`${this.apiUrl}/process`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image: this.currentImageData,
                    operation: operation
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            console.log('📊 响应状态:', response.status);

            if (!response.ok) {
                throw new Error(`服务器错误: ${response.status}`);
            }

            const result = await response.json();
            console.log('✅ 处理结果:', result);
            
            if (result.success) {
                this.processedImage.src = result.processed_image;
                this.processedImage.style.display = 'block';
                this.hideLoading();
                if (this.downloadBtn) this.downloadBtn.style.display = 'inline-block';
                this.updateStatus('✅ 处理完成', '#28a745');
                this.showMessage(`🌟 声纳图像处理完成！耗时: ${result.processing_time}`, 'success');
            } else {
                throw new Error(result.error || '处理失败');
            }

        } catch (error) {
            console.error('❌ 处理错误:', error);
            
            // 重试逻辑
            if (this.retryCount < this.maxRetries && !error.name === 'AbortError') {
                this.retryCount++;
                this.updateStatus(`🔄 重试中 (${this.retryCount}/${this.maxRetries})...`, '#ffc107');
                console.log(`🔄 第 ${this.retryCount} 次重试...`);
                
                setTimeout(() => {
                    this.processWithRetry(operation);
                }, 2000 * this.retryCount); // 递增延迟
                return;
            }
            
            this.hideLoading();
            this.updateStatus('❌ 处理失败', '#dc3545');
            
            let errorMessage = '❌ 处理失败: ';
            if (error.name === 'AbortError') {
                errorMessage += '请求超时，请重试';
            } else if (error.message.includes('Failed to fetch')) {
                errorMessage += 'Kaggle连接中断，请检查服务状态';
            } else {
                errorMessage += error.message;
            }
            
            this.showMessage(errorMessage, 'error');
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * 🔄 显示加载状态
     */
    showLoading() {
        if (this.loadingIndicator) this.loadingIndicator.style.display = 'flex';
        if (this.processedImage) this.processedImage.style.display = 'none';
        if (this.downloadBtn) this.downloadBtn.style.display = 'none';
    }

    /**
     * ✅ 隐藏加载状态
     */
    hideLoading() {
        if (this.loadingIndicator) this.loadingIndicator.style.display = 'none';
    }

    /**
     * 💾 下载处理结果
     */
    downloadResult() {
        if (!this.processedImage?.src) return;
        
        const link = document.createElement('a');
        link.download = `sonar_shadow_removed_${Date.now()}.jpg`;
        link.href = this.processedImage.src;
        link.click();
    }

    /**
     * 📨 显示消息提示
     */
    showMessage(message, type = 'info') {
        // 移除现有消息
        const existingMessages = document.querySelectorAll('.temp-message');
        existingMessages.forEach(msg => msg.remove());
        
        // 创建新消息
        const messageDiv = document.createElement('div');
        messageDiv.className = `temp-message message ${type}`;
        messageDiv.textContent = message;
        
        document.body.appendChild(messageDiv);
        
        // 5秒后自动移除
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }

    /**
     * 🔄 重置应用状态
     */
    reset() {
        this.currentImageData = null;
        this.isProcessing = false;
        this.retryCount = 0;
        
        if (this.imageInput) this.imageInput.value = '';
        if (this.controlsSection) this.controlsSection.style.display = 'none';
        if (this.resultsSection) this.resultsSection.style.display = 'none';
        if (this.algorithmInfo) this.algorithmInfo.style.display = 'none';
        if (this.resetBtn) this.resetBtn.style.display = 'none';
        if (this.downloadBtn) this.downloadBtn.style.display = 'none';
        if (this.originalImage) this.originalImage.style.display = 'none';
        if (this.processedImage) this.processedImage.style.display = 'none';
        
        this.hideLoading();
        this.updateStatus('🔄 已重置', '#6c757d');
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * 🔧 手动设置API地址
     */
    setApiUrl(newUrl) {
        this.apiUrl = newUrl;
        console.log(`🔧 API地址已更新为: ${newUrl}`);
        this.testConnection();
    }

    /**
     * 📊 获取当前状态信息
     */
    getStatus() {
        return {
            apiUrl: this.apiUrl,
            isProcessing: this.isProcessing,
            hasImage: !!this.currentImageData,
            retryCount: this.retryCount,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * 🧪 API连接测试
     */
    async pingApi() {
        try {
            const start = Date.now();
            const response = await fetch(`${this.apiUrl}/health`);
            const end = Date.now();
            
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ API响应正常，延迟: ${end - start}ms`, data);
                return { success: true, latency: end - start, data };
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.error('❌ API连接失败:', error);
            return { success: false, error: error.message };
        }
    }
}

// 🚀 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    // 创建全局实例
    window.sonarRemover = new SonarShadowRemover();
    
    // 在控制台提供帮助信息
    console.log(`
🌊 声纳图像阴影去除系统已加载

🔧 如果连接失败，请在控制台运行：
sonarRemover.setApiUrl('你的Kaggle_ngrok地址')

📋 例如：
sonarRemover.setApiUrl('https://abcd-1234.ngrok-free.app')

🛠️ 实用命令：
- sonarRemover.getStatus()     // 查看当前状态
- sonarRemover.pingApi()       // 测试API连接
- sonarRemover.reset()         // 重置应用

🌐 获取地址：
1. 在Kaggle中运行: url = start_service()
2. 复制输出的ngrok地址
3. 在浏览器控制台设置新地址
    `);
});

// 📦 导出类供外部使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SonarShadowRemover;
}
