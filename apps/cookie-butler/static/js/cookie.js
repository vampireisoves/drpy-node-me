const qrcode_handler = new QRCodeHandler();

// 显示提示框
function showToast(message, type = 'success') {
    const toastEle = document.getElementById('toast');
    const toastContentEle = document.getElementById('toast-content');

    if (toastEle && toastContentEle) {
        toastContentEle.textContent = message;
        toast.className = `alert alert-${type}`;
        toast.style = 'display: block;'

        setTimeout(() => {
            toast.style = 'display: none;';
            toastContentEle.textContent = '';
        }, 3000);
    }
}

// 初始化页面
async function initializePage() {
    // 加载cookie
    const platforms = ['ali', 'quark', 'quark_token', 'uc', 'uc_token', 'bili', 'yun', 'baidu', 'pikpak'];

    // 绑定按钮事件
    platforms.forEach(platform => {
        // 扫码按钮
        const scanBtn = document.querySelector(`.btn-scan[data-platform="${platform}"]`);
        if (scanBtn) {
            scanBtn.addEventListener('click', () => {
                // 清除已有内容
                const inputEle = document.getElementById('cookie-res');
                inputEle.value = '';
                // 清除所有元素的active状态
                document.querySelectorAll('.btn-scan').forEach(el => el.classList.remove('active'));
                // 为当前点击的元素设置active状态
                scanBtn.classList.add('active');
                // 执行扫码操作
                scanCode(platform);
            });
        }
    });

    const qrcodeEle = document.getElementById('qrcode');
    qrcodeEle.addEventListener('click', () => {
        const inputEle = document.getElementById('cookie-res');
        inputEle.value = '';
        const activeElement = document.querySelector('.btn-scan.active');
        if (activeElement) {
            scanCode(activeElement.dataset.platform);
        }
    });
}

// 扫码
let pollInterval;
let timeoutTimer;

async function scanCode(platform) {
    if (pollInterval) clearInterval(pollInterval);
    if (timeoutTimer) clearTimeout(timeoutTimer);

    const qrcode_expired = './static/img/qrcode_expired.jpg';
    const img = document.getElementById('qrcode');

    try {
        // 获取二维码
        const qrData = await qrcode_handler.startScan(platform);

        // 显示二维码
        img.src = qrData.qrcode;

        // 开始轮询扫码结果
        pollInterval = setInterval(async () => {
            try {
                const statusData = await qrcode_handler.checkStatus(platform);
                switch (statusData.status) {
                    case 'CONFIRMED':
                        clearInterval(pollInterval);
                        clearTimeout(timeoutTimer);
                        img.src = qrcode_expired;
                        const input = document.getElementById('cookie-res');
                        input.value = statusData.token || statusData.cookie;
                        showToast('扫码成功！');
                        break;

                    case 'CANCELED':
                        clearInterval(pollInterval);
                        clearTimeout(timeoutTimer);
                        img.src = qrcode_expired;
                        showToast('已取消登录', 'error');
                        break;

                    case 'EXPIRED':
                        clearInterval(pollInterval);
                        clearTimeout(timeoutTimer);
                        img.src = qrcode_expired;
                        showToast('二维码已过期，请重试', 'error');
                        break;

                    case 'SCANED':
                        showToast('已扫码，请在手机上确认');
                        break;
                }
            } catch (error) {
                console.error('Check status error:', error);
                img.src = qrcode_expired;
                showToast('检查状态失败', 'error');
            }
        }, 4000);

        // 30秒后超时
        timeoutTimer = setTimeout(() => {
            clearInterval(pollInterval);
            img.src = qrcode_expired;
            showToast('二维码已过期', 'error');
        }, 30000);

    } catch (error) {
        console.log(error)
        if (pollInterval) clearInterval(pollInterval);
        if (timeoutTimer) clearTimeout(timeoutTimer);
        img.src = qrcode_expired;
        showToast(`获取二维码失败：${error.message}`, 'error');
    }
}
