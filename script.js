// 图片压缩工具 JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const imageProcessing = document.getElementById('imageProcessing');
    const originalImage = document.getElementById('originalImage');
    const compressedImage = document.getElementById('compressedImage');
    const originalSize = document.getElementById('originalSize');
    const compressedSize = document.getElementById('compressedSize');
    const originalDimensions = document.getElementById('originalDimensions');
    const compressedDimensions = document.getElementById('compressedDimensions');
    const compressionRatio = document.getElementById('compressionRatio');
    const singleQualitySlider = document.getElementById('singleQualitySlider');
    const singleQualityValue = document.getElementById('singleQualityValue');
    const compressBtn = document.getElementById('compressBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const resetBtn = document.getElementById('resetBtn');
    
    // 存储图片数据
    let currentFile = null;
    let compressedBlob = null;
    
    // 添加加载指示器
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.innerHTML = '<div class="spinner"></div><p>处理中，请稍候...</p>';
    loadingIndicator.style.display = 'none';
    document.body.appendChild(loadingIndicator);

    // 添加错误提示框
    const errorBox = document.createElement('div');
    errorBox.className = 'error-message';
    errorBox.style.display = 'none';
    errorBox.style.position = 'fixed';
    errorBox.style.top = '20px';
    errorBox.style.left = '50%';
    errorBox.style.transform = 'translateX(-50%)';
    errorBox.style.zIndex = '1001';
    errorBox.style.padding = '15px 20px';
    document.body.appendChild(errorBox);

    // 添加调试信息面板（仅在开发环境使用）
    const debugPanel = document.createElement('div');
    debugPanel.className = 'debug-panel';
    debugPanel.style.display = 'none'; // 默认隐藏
    debugPanel.style.position = 'fixed';
    debugPanel.style.bottom = '10px';
    debugPanel.style.right = '10px';
    debugPanel.style.width = '300px';
    debugPanel.style.maxHeight = '200px';
    debugPanel.style.overflowY = 'auto';
    debugPanel.style.backgroundColor = 'rgba(0,0,0,0.7)';
    debugPanel.style.color = 'white';
    debugPanel.style.padding = '10px';
    debugPanel.style.borderRadius = '5px';
    debugPanel.style.fontSize = '12px';
    debugPanel.style.zIndex = '1000';
    document.body.appendChild(debugPanel);

    // 在DOM元素获取部分添加新的控制元素
    const keepOriginalSize = document.createElement('div');
    keepOriginalSize.className = 'quality-control';
    keepOriginalSize.innerHTML = `
        <label>
            <input type="checkbox" id="keepSizeCheckbox" checked>
            保持原始尺寸
        </label>
        <p class="quality-hint">选中此项将保持图片原始尺寸，可能会影响压缩效率</p>
    `;

    // 将这个元素插入到质量控制之前
    const qualityControl = document.querySelector('.quality-control');
    if (qualityControl && qualityControl.parentNode) {
        qualityControl.parentNode.insertBefore(keepOriginalSize, qualityControl);
    }

    // 获取复选框元素
    const keepSizeCheckbox = document.getElementById('keepSizeCheckbox');

    /**
     * 添加调试信息
     * @param {string} message - 调试信息
     */
    function debug(message) {
        console.log(message);
        const logEntry = document.createElement('div');
        logEntry.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
        debugPanel.appendChild(logEntry);
        debugPanel.scrollTop = debugPanel.scrollHeight;
    }

    // 按 D 键切换调试面板
    document.addEventListener('keydown', function(e) {
        if (e.key === 'd' && e.ctrlKey) {
            debugPanel.style.display = debugPanel.style.display === 'none' ? 'block' : 'none';
        }
    });

    /**
     * 显示错误消息
     * @param {string} message - 错误消息内容
     */
    function showError(message) {
        debug(`错误: ${message}`);
        errorBox.textContent = message;
        errorBox.style.display = 'block';
        
        // 5秒后自动隐藏
        setTimeout(() => {
            errorBox.style.display = 'none';
        }, 5000);
    }

    // 上传区域点击事件
    uploadArea.addEventListener('click', function() {
        fileInput.click();
    });

    // 文件选择事件
    fileInput.addEventListener('change', function(e) {
        if (e.target.files.length) {
            handleFile(e.target.files[0]);
        }
    });

    // 拖放功能
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', function() {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        if (e.dataTransfer.files.length) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    // 质量滑块事件
    singleQualitySlider.addEventListener('input', function() {
        singleQualityValue.textContent = `${singleQualitySlider.value}%`;
    });

    // 压缩按钮事件
    compressBtn.addEventListener('click', function() {
        if (currentFile) {
            compressImage();
        }
    });

    // 下载按钮事件
    downloadBtn.addEventListener('click', function() {
        if (compressedBlob) {
            const fileName = `${currentFile.name.split('.')[0]}_compressed.jpg`;
            downloadImage(compressedBlob, fileName);
        }
    });

    // 重置按钮事件
    resetBtn.addEventListener('click', resetApp);
    
    /**
     * 检测浏览器功能支持
     */
    function checkBrowserSupport() {
        debug("检查浏览器功能支持");
        
        // 检查 FileReader
        if (!window.FileReader) {
            showError("您的浏览器不支持 FileReader API，请更新浏览器。");
            return false;
        }
        
        // 检查 Canvas
        const canvas = document.createElement('canvas');
        if (!canvas.getContext) {
            showError("您的浏览器不支持 Canvas，请更新浏览器。");
            return false;
        }
        
        // 检查 Blob
        if (!window.Blob) {
            showError("您的浏览器不支持 Blob，请更新浏览器。");
            return false;
        }
        
        debug("浏览器功能检查通过");
        return true;
    }
    
    /**
     * 处理单个文件
     * @param {File} file - 用户上传的文件
     */
    function handleFile(file) {
        debug(`处理文件: ${file.name}, 类型: ${file.type}, 大小: ${formatFileSize(file.size)}`);
        
        // 检查是否为图片
        if (!file.type.match('image.*')) {
            showError('请上传图片文件！');
            return;
        }
        
        // 检查文件大小
        if (file.size > 15 * 1024 * 1024) { // 15MB
            showError('文件过大，请上传小于15MB的图片');
            return;
        }

        // 检查图片格式
        const supportedFormats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
        if (!supportedFormats.includes(file.type)) {
            showError(`不支持的图片格式: ${file.type}。请使用 JPG, PNG, GIF, WebP 或 BMP 格式`);
            return;
        }

        // 重置应用状态
        resetApp();
        
        // 存储文件
        currentFile = file;
        
        // 显示原始图片
        displayOriginalImage();
    }
    
    /**
     * 显示原始图片
     */
    function displayOriginalImage() {
        // 显示加载指示器
        loadingIndicator.style.display = 'flex';
        debug("开始加载原始图片");
        
        try {
            // 创建文件读取器
            const reader = new FileReader();
            
            reader.onload = function(e) {
                // 直接使用 FileReader 的结果
                const dataUrl = e.target.result;
                debug(`文件读取成功，数据URL长度: ${dataUrl.length}`);
                
                // 显示原始图片信息
                originalSize.textContent = formatFileSize(currentFile.size);
                
                // 创建新的图片元素（避免可能的缓存问题）
                const tempImg = new Image();
                
                tempImg.onload = function() {
                    debug(`原始图片加载完成: ${tempImg.naturalWidth} x ${tempImg.naturalHeight}`);
                    
                    // 检查图片是否有效
                    if (tempImg.naturalWidth === 0 || tempImg.naturalHeight === 0) {
                        debug("图片尺寸为0，可能是无效图片");
                        showError('无效的图片文件，请尝试其他图片。');
                        loadingIndicator.style.display = 'none';
                        resetApp();
                        return;
                    }
                    
                    // 更新原始图片
                    originalImage.src = tempImg.src;
                    originalDimensions.textContent = `${tempImg.naturalWidth} x ${tempImg.naturalHeight}`;
                    
                    // 隐藏加载指示器
                    loadingIndicator.style.display = 'none';
                    
                    // 显示图片处理界面
                    uploadArea.style.display = 'none';
                    imageProcessing.style.display = 'block';
                    
                    debug("原始图片显示成功");
                };
                
                tempImg.onerror = function(e) {
                    debug(`原始图片加载失败: ${e.type}`);
                    showError('无法加载图片，请尝试其他图片。');
                    loadingIndicator.style.display = 'none';
                    resetApp();
                };
                
                // 设置图片源
                tempImg.src = dataUrl;
                
                // 设置跨域属性（可能有助于解决某些跨域问题）
                tempImg.crossOrigin = "Anonymous";
            };
            
            reader.onerror = function(e) {
                debug(`文件读取失败: ${e.target.error}`);
                showError('文件读取失败，请尝试其他图片。');
                loadingIndicator.style.display = 'none';
                resetApp();
            };
            
            // 读取文件为数据URL
            reader.readAsDataURL(currentFile);
        } catch (error) {
            debug(`显示原始图片时出错: ${error.message}`);
            showError('处理图片时出错: ' + error.message);
            loadingIndicator.style.display = 'none';
            resetApp();
        }
        
        // 清空压缩后的图片
        compressedImage.src = '';
        compressedSize.textContent = '0 KB';
        compressedDimensions.textContent = '0 x 0';
        compressionRatio.textContent = '0%';
        
        // 禁用下载按钮
        downloadBtn.disabled = true;
    }
    
    /**
     * 压缩图片
     */
    function compressImage() {
        if (!currentFile) {
            debug("没有文件可压缩");
            return;
        }
        
        const quality = parseInt(singleQualitySlider.value) / 100;
        debug(`开始压缩图片 ${currentFile.name}, 质量: ${quality}`);
        
        // 显示加载指示器
        loadingIndicator.style.display = 'flex';
        
        // 使用简化的压缩方法
        compressImageSimple(currentFile, quality, function(result) {
            if (result.success) {
                debug("压缩成功");
                processCompressedImage(result.blob, result.width, result.height);
            } else {
                debug(`压缩失败: ${result.error}`);
                showError('压缩图片失败: ' + result.error);
                loadingIndicator.style.display = 'none';
            }
        });
    }
    
    /**
     * 简化的图片压缩方法
     * @param {File} file - 要压缩的图片文件
     * @param {number} quality - 压缩质量 (0-1)
     * @param {Function} callback - 回调函数
     */
    function compressImageSimple(file, quality, callback) {
        debug("使用简化压缩方法");
        
        // 创建文件读取器
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const img = new Image();
            
            img.onload = function() {
                try {
                    debug(`图片加载成功: ${img.width} x ${img.height}`);
                    
                    // 计算新尺寸
                    let width = img.width;
                    let height = img.height;
                    
                    // 只有在不保持原始尺寸的情况下才进行缩放
                    if (!keepSizeCheckbox.checked) {
                        // 如果图片太大，进行缩小
                        const maxDimension = 1200;
                        if (width > maxDimension || height > maxDimension) {
                            if (width > height) {
                                height = Math.round(height * (maxDimension / width));
                                width = maxDimension;
                            } else {
                                width = Math.round(width * (maxDimension / height));
                                height = maxDimension;
                            }
                            debug(`调整尺寸为 ${width} x ${height}`);
                        }
                    } else {
                        debug("保持原始尺寸");
                    }
                    
                    // 创建Canvas
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    
                    // 获取绘图上下文
                    const ctx = canvas.getContext('2d');
                    
                    // 填充白色背景（解决透明图片问题）
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, width, height);
                    
                    // 绘制图像
                    ctx.drawImage(img, 0, 0, width, height);
                    debug("图像已绘制到Canvas");
                    
                    // 尝试直接使用 toDataURL
                    try {
                        debug("尝试使用 toDataURL 方法");
                        const dataURL = canvas.toDataURL('image/jpeg', quality);
                        
                        // 将 dataURL 转换为 Blob
                        const byteString = atob(dataURL.split(',')[1]);
                        const ab = new ArrayBuffer(byteString.length);
                        const ia = new Uint8Array(ab);
                        
                        for (let i = 0; i < byteString.length; i++) {
                            ia[i] = byteString.charCodeAt(i);
                        }
                        
                        const blob = new Blob([ab], {type: 'image/jpeg'});
                        debug(`通过 dataURL 创建 Blob 成功，大小: ${formatFileSize(blob.size)}`);
                        
                        callback({
                            success: true,
                            blob: blob,
                            width: width,
                            height: height
                        });
                    } catch (error) {
                        debug(`toDataURL 方法失败: ${error.message}`);
                        callback({
                            success: false,
                            error: error.message
                        });
                    }
                } catch (error) {
                    debug(`Canvas 处理失败: ${error.message}`);
                    callback({
                        success: false,
                        error: error.message
                    });
                }
            };
            
            img.onerror = function() {
                debug("图片加载失败");
                callback({
                    success: false,
                    error: "图片加载失败"
                });
            };
            
            // 设置图片源
            img.src = e.target.result;
            
            // 设置跨域属性
            img.crossOrigin = "Anonymous";
        };
        
        reader.onerror = function() {
            debug("文件读取失败");
            callback({
                success: false,
                error: "文件读取失败"
            });
        };
        
        // 读取文件为数据URL
        reader.readAsDataURL(file);
    }
    
    /**
     * 处理压缩后的图片
     * @param {Blob} blob - 压缩后的图片Blob
     * @param {number} width - 图片宽度
     * @param {number} height - 图片高度
     */
    function processCompressedImage(blob, width, height) {
        debug("处理压缩后的图片");
        
        // 更新压缩后的图片信息
        compressedBlob = blob;
        
        // 创建安全的URL
        const blobUrl = URL.createObjectURL(blob);
        debug(`创建Blob URL: ${blobUrl}`);
        
        // 创建新的图片元素（避免可能的缓存问题）
        const tempImg = new Image();
        
        tempImg.onload = function() {
            debug("压缩图片加载完成");
            
            // 更新压缩后的图片
            compressedImage.src = tempImg.src;
            compressedSize.textContent = formatFileSize(blob.size);
            compressedDimensions.textContent = `${width} x ${height}`;
            
            // 计算压缩率
            const ratio = ((currentFile.size - blob.size) / currentFile.size) * 100;
            compressionRatio.textContent = `${ratio.toFixed(1)}%`;
            
            // 启用下载按钮
            downloadBtn.disabled = false;
            
            // 隐藏加载指示器
            loadingIndicator.style.display = 'none';
            
            debug(`压缩完成，压缩率: ${ratio.toFixed(1)}%`);
        };
        
        tempImg.onerror = function(e) {
            debug(`压缩图片加载失败: ${e.type}`);
            
            // 尝试直接使用 FileReader 显示
            const reader = new FileReader();
            reader.onload = function(e) {
                compressedImage.src = e.target.result;
                compressedSize.textContent = formatFileSize(blob.size);
                compressedDimensions.textContent = `${width} x ${height}`;
                
                // 计算压缩率
                const ratio = ((currentFile.size - blob.size) / currentFile.size) * 100;
                compressionRatio.textContent = `${ratio.toFixed(1)}%`;
                
                // 启用下载按钮
                downloadBtn.disabled = false;
                
                // 隐藏加载指示器
                loadingIndicator.style.display = 'none';
                
                debug("使用 FileReader 显示压缩图片成功");
            };
            
            reader.onerror = function() {
                debug("FileReader 也无法显示压缩图片");
                showError('压缩后的图片无法显示，但您仍可以下载。');
                
                compressedSize.textContent = formatFileSize(blob.size);
                compressedDimensions.textContent = `${width} x ${height}`;
                
                // 计算压缩率
                const ratio = ((currentFile.size - blob.size) / currentFile.size) * 100;
                compressionRatio.textContent = `${ratio.toFixed(1)}%`;
                
                // 启用下载按钮
                downloadBtn.disabled = false;
                
                // 隐藏加载指示器
                loadingIndicator.style.display = 'none';
            };
            
            reader.readAsDataURL(blob);
        };
        
        // 设置图片源
        tempImg.src = blobUrl;
        
        // 设置跨域属性
        tempImg.crossOrigin = "Anonymous";
    }
    
    /**
     * 下载单个图片
     * @param {Blob} blob - 要下载的图片Blob
     * @param {string} fileName - 下载的文件名
     */
    function downloadImage(blob, fileName) {
        debug(`准备下载图片: ${fileName}`);
        
        try {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            debug(`下载完成: ${fileName}`);
        } catch (error) {
            debug(`下载图片时出错: ${error.message}`);
            showError('下载图片时出错: ' + error.message);
            
            // 尝试备用下载方法
            try {
                debug("尝试备用下载方法");
                const reader = new FileReader();
                reader.onload = function(e) {
                    const a = document.createElement('a');
                    a.href = e.target.result;
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    debug("备用下载方法成功");
                };
                reader.onerror = function() {
                    debug("备用下载方法失败");
                    showError('无法下载图片，请尝试保存压缩后的图片。');
                };
                reader.readAsDataURL(blob);
            } catch (backupError) {
                debug(`备用下载方法也失败: ${backupError.message}`);
                showError('无法下载图片，请尝试其他浏览器。');
            }
        }
    }
    
    /**
     * 格式化文件大小
     * @param {number} bytes - 文件大小（字节）
     * @returns {string} 格式化后的文件大小
     */
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    /**
     * 重置应用
     */
    function resetApp() {
        debug("重置应用");
        
        // 清空图片数据
        currentFile = null;
        compressedBlob = null;
        
        // 重置UI
        uploadArea.style.display = 'flex';
        imageProcessing.style.display = 'none';
        
        // 清空图片预览
        originalImage.src = '';
        compressedImage.src = '';
        
        // 重置信息显示
        originalSize.textContent = '0 KB';
        compressedSize.textContent = '0 KB';
        originalDimensions.textContent = '0 x 0';
        compressedDimensions.textContent = '0 x 0';
        compressionRatio.textContent = '0%';
        
        // 禁用下载按钮
        downloadBtn.disabled = true;
    }
    
    // 初始化应用
    function initApp() {
        debug("初始化应用");
        
        // 检查浏览器支持
        if (!checkBrowserSupport()) {
            return;
        }
        
        // 创建标题UI
        createHeaderUI();
        
        // 初始化质量滑块
        singleQualityValue.textContent = `${singleQualitySlider.value}%`;
        
        debug("应用初始化完成");
    }

    /**
     * 创建标题UI
     */
    function createHeaderUI() {
        // 获取header元素
        const header = document.querySelector('header');
        if (!header) return;
        
        // 清空现有内容
        header.innerHTML = '';
        
        // 创建标题容器
        const titleContainer = document.createElement('div');
        titleContainer.className = 'title-container';
        
        // 创建图标
        const icon = document.createElement('div');
        icon.className = 'app-icon';
        icon.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48">
                <path fill="#0071e3" d="M19.89 10.105a8.696 8.696 0 0 0-.789-1.456l-1.658 1.119a6.606 6.606 0 0 1 .6 1.107l1.847-.77zm-7.65-4.908A8.66 8.66 0 0 0 9.536 5l.309 2.095A6.556 6.556 0 0 1 12 6.922l.24-1.725zm4.89 2.624a8.706 8.706 0 0 0-1.268-1.115l-1.025 1.724a6.65 6.65 0 0 1 .962.846l1.33-1.455zm-10.16-1.655a8.687 8.687 0 0 0-1.587 1.427l1.514 1.25a6.62 6.62 0 0 1 1.207-1.086l-1.134-1.59zm-2.973 5.243a8.697 8.697 0 0 0-.069 1.991l2.091-.24a6.619 6.619 0 0 1 .053-1.515l-2.075-.236zM4.222 15.9a8.696 8.696 0 0 0 .924 1.775l1.55-1.306a6.606 6.606 0 0 1-.702-1.35l-1.772.88zm3.887 3.482a8.68 8.68 0 0 0 1.773.926l.608-1.948a6.61 6.61 0 0 1-1.35-.704l-1.031 1.726zm5.348 1.362a8.662 8.662 0 0 0 1.988-.071l-.241-2.059a6.578 6.578 0 0 1-1.514.054l-.233 2.076zm5.246-2.974a8.7 8.7 0 0 0 1.424-1.591l-1.591-1.132a6.596 6.596 0 0 1-1.084 1.21l1.251 1.513zM21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9zm-9 7c3.86 0 7-3.14 7-7s-3.14-7-7-7-7 3.14-7 7 3.14 7 7 7z"/>
            </svg>
        `;
        
        // 创建标题文本区域
        const titleText = document.createElement('div');
        titleText.className = 'title-text';
        
        // 创建主标题
        const mainTitle = document.createElement('h1');
        mainTitle.textContent = '图片压缩工具';
        mainTitle.className = 'main-title';
        
        // 创建副标题
        const subTitle = document.createElement('p');
        subTitle.textContent = '轻松压缩图片，节省存储空间';
        subTitle.className = 'sub-title';
        
        // 组装标题UI
        titleText.appendChild(mainTitle);
        titleText.appendChild(subTitle);
        
        titleContainer.appendChild(icon);
        titleContainer.appendChild(titleText);
        
        header.appendChild(titleContainer);
    }
    
    // 启动应用
    initApp();
}); 