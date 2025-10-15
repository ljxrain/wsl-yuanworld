# SSH密钥免密登录配置（已验证有效）

## ✅ 腾讯云服务器信息（2025年8月更新）
- **公网IP**: 49.232.220.223
- **内网IP**: 10.2.20.6  
- **用户名**: ubuntu
- **密码**: Ljxrain123

## 步骤1: 生成SSH密钥对

在PowerShell中执行：

```powershell
# 生成ed25519密钥（推荐，更安全）
ssh-keygen -t ed25519 -C "ubuntu@49.232.220.223" -f $env:USERPROFILE\.ssh\id_ed25519

# 提示输入密码时直接按回车（无密码）
```

## 步骤2: 复制公钥到服务器

```powershell
# 获取公钥内容
Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub

# 复制输出的整行，然后通过腾讯云VNC控制台粘贴到服务器
```

**在服务器上执行（通过VNC控制台）：**
```bash
mkdir -p ~/.ssh && chmod 700 ~/.ssh
echo "这里粘贴你的公钥整行" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chown -R ubuntu:ubuntu ~/.ssh

# 确保SSH配置正确
sudo sed -i 's/^#\?PubkeyAuthentication.*/PubkeyAuthentication yes/' /etc/ssh/sshd_config
sudo systemctl restart ssh
```

## 步骤3: 测试免密登录

```powershell
# 免密登录测试
ssh -i $env:USERPROFILE\.ssh\id_ed25519 -o StrictHostKeyChecking=no ubuntu@49.232.220.223

# 成功后可以简化为
ssh ubuntu@49.232.220.223
```

## 快速连接命令

```powershell
# 免密登录（推荐）
ssh -i $env:USERPROFILE\.ssh\id_ed25519 ubuntu@49.232.220.223

# 密码登录（备用）
ssh ubuntu@49.232.220.223
# 密码: Ljxrain123
```

## 注意事项

1. **首次配置**: 第一次设置SSH密钥时仍需要输入密码
2. **安全性**: SSH密钥比密码更安全，建议长期使用
3. **备份**: 请备份生成的私钥文件（id_rsa）
4. **权限**: 确保服务器上的~/.ssh目录权限为700，authorized_keys文件权限为600

## 故障排除

如果SSH密钥登录失败：

```bash
# 检查服务器SSH配置
ssh root@49.232.220.223 "cat /etc/ssh/sshd_config | grep -E 'PubkeyAuthentication|AuthorizedKeysFile'"

# 检查authorized_keys文件权限
ssh root@49.232.220.223 "ls -la ~/.ssh/"

# 重启SSH服务
ssh root@49.232.220.223 "systemctl restart sshd"
``` 