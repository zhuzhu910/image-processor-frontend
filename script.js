class ShadowRemover {
    constructor() {
        // 🌟 Kaggle阴影去除API地址 - 替换为你的ngrok地址
        this.apiUrl = 'https://b741-35-233-182-41.ngrok-free.app';  // ⚠️ 替换为实际地址
        this.currentImageData = null;
        this.initializeElements();
        this.bindEvents();
    }

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
    }

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
                const operation = btn.dataset.operation;
                this.processImage(operation);
                
                // 添加视觉反馈
                this.operationBtns.forEach(b => b.style.opacity = '0.6');
                btn.style.opacity = '1';
                setTimeout(() => {
                    this.operationBtns.forEach(b => b.style.opacity = '1');
                }, 3000);
            });
        });
        
        // 重置按钮事件
        this.resetBtn.addEventListener('click', this.reset.bind(this));
        
        // 下载按钮事件
        this.downloadBtn.addEventListener('click', this.downloadResult.bind(this));
    }

    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.handleFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.handleFile(file);
        }
    }

    handleFile(file) {
        // 检查文件类型
        if (!file.type.startsWith('image/')) {
            this.showMessage('请选择图片文件！', 'error');
            return;
        }

        // 检查文件大小（10MB限制）
        if (file.size > 10 * 1024 * 1024) {
            this.showMessage('图片文件不能超过10MB！', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.currentImageData = e.target.result;
            this.originalImage.src = this.currentImageData;
            this.showControls();
        };
        reader.readAsDataURL(file);
    }

    showControls() {
        this.controlsSection.style.display = 'block';
        this.resultsSection.style.display = 'block';
        this.algorithmInfo.style.display = 'block';
        this.resetBtn.style.display = 'inline-block';
        
        // 滚动到控制区域
        this.controlsSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
    }

    async processImage(operation) {
        if (!this.currentImageData) {
            this.showMessage('请先选择图片！', 'error');
            return;
        }

        this.showLoading();

        try {
            console.log('🌟 发送请求到Kaggle阴影去除服务:', `${this.apiUrl}/process`);
            
            const response = await fetch(`${this.apiUrl}/process`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image: this.currentImageData,
                    operation: operation
                })
            });

            console.log('📊 响应状态:', response.status);

            if (!response.ok) {
                throw new Error(`服务器错误: ${response.status}`);
            }

            const result = await response.json();
            console.log('✅ 阴影去除结果:', result);
            
            if (result.success) {
                this.processedImage.src = result.processed_image;
                this.hideLoading();
                this.downloadBtn.style.display = 'inline-block';
                this.showMessage(`🌟 阴影去除完成！耗时: ${result.processing_time}`, 'success');
            } else {
                throw new Error(result.error || '阴影去除失败');
            }

        } catch (error) {
            console.error('❌ 错误:', error);
            this.hideLoading();
            
            if (error.message.includes('Failed to fetch')) {
                this.showMessage('🔌 无法连接到Kaggle阴影去除服务，请检查网络连接', 'error');
            } else {
                this.showMessage(`❌ 阴影去除失败: ${error.message}`, 'error');
            }
        }
    }

    showLoading() {
        this.loadingIndicator.style.display = 'flex';
        this.processedImage.style.display = 'none';
        this.downloadBtn.style.display = 'none';
    }

    hideLoading() {
        this.loadingIndicator.style.display = 'none';
        this.processedImage.style.display = 'block';
    }

    downloadResult() {
        if (!this.processedImage.src) return;
        
        const link = document.createElement('a');
        link.download = `shadow_removed_${Date.now()}.jpg`;
        link.href = this.processedImage.src;
        link.click();
    }

    showMessage(message, type = 'info') {
        // 创建消息提示
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 10px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff'};
        `;
        
        document.body.appendChild(messageDiv);
        
        // 3秒后自动移除
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }

    reset() {
        this.currentImageData = null;
        this.imageInput.value = '';
        this.controlsSection.style.display = 'none';
        this.resultsSection.style.display = 'none';
        this.algorithmInfo.style.display = 'none';
        this.resetBtn.style.display = 'none';
        this.downloadBtn.style.display = 'none';
        this.hideLoading();
        
        // 滚动回顶部
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// 添加滑入动画样式
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// 初始化阴影去除应用
document.addEventListener('DOMContentLoaded', () => {
    new ShadowRemover();
});
