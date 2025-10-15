// API测试工具的JavaScript代码

async function testHealth() {
    const resultDiv = document.getElementById('health-result');
    resultDiv.textContent = '正在测试...';
    resultDiv.className = 'result';
    
    try {
        const response = await fetch('/api/health');
        const data = await response.json();
        
        if (response.ok) {
            resultDiv.className = 'result success';
            resultDiv.textContent = '✅ 成功！\n\n' + JSON.stringify(data, null, 2);
        } else {
            resultDiv.className = 'result error';
            resultDiv.textContent = '❌ 失败！\n\n' + JSON.stringify(data, null, 2);
        }
    } catch (error) {
        resultDiv.className = 'result error';
        resultDiv.textContent = '❌ 网络错误：\n\n' + error.message;
    }
}

async function testLogin() {
    const resultDiv = document.getElementById('login-result');
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    resultDiv.textContent = '正在测试登录...';
    resultDiv.className = 'result';
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            resultDiv.className = 'result success';
            resultDiv.textContent = '✅ 登录成功！\n\n' + JSON.stringify(data, null, 2);
            localStorage.setItem('token', data.token);
        } else {
            resultDiv.className = 'result error';
            resultDiv.textContent = '❌ 登录失败（' + response.status + '）：\n\n' + JSON.stringify(data, null, 2);
        }
    } catch (error) {
        resultDiv.className = 'result error';
        resultDiv.textContent = '❌ 网络错误：\n\n' + error.message;
    }
}

async function testRegister() {
    const resultDiv = document.getElementById('register-result');
    const username = document.getElementById('reg-username').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    
    resultDiv.textContent = '正在测试注册...';
    resultDiv.className = 'result';
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            resultDiv.className = 'result success';
            resultDiv.textContent = '✅ 注册成功！\n\n' + JSON.stringify(data, null, 2);
        } else {
            resultDiv.className = 'result error';
            resultDiv.textContent = '❌ 注册失败（' + response.status + '）：\n\n' + JSON.stringify(data, null, 2);
        }
    } catch (error) {
        resultDiv.className = 'result error';
        resultDiv.textContent = '❌ 网络错误：\n\n' + error.message;
    }
}

async function testStaticFiles() {
    const resultDiv = document.getElementById('static-result');
    resultDiv.textContent = '正在测试...';
    resultDiv.className = 'result';
    
    const files = [
        '/index.html',
        '/create.html',
        '/gallery.html'
    ];
    
    let results = '';
    for (const file of files) {
        try {
            const response = await fetch(file);
            if (response.ok) {
                results += `✅ ${file} - OK (${response.status})\n`;
            } else {
                results += `❌ ${file} - 失败 (${response.status})\n`;
            }
        } catch (error) {
            results += `❌ ${file} - 错误: ${error.message}\n`;
        }
    }
    
    resultDiv.textContent = results;
    resultDiv.className = 'result success';
}

function testClick() {
    alert('✅ 按钮可以点击！JavaScript正常工作！');
}

// 页面加载时自动测试健康检查
window.addEventListener('DOMContentLoaded', () => {
    testHealth();
});
