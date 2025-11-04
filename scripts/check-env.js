#!/usr/bin/env node

/**
 * VovBlog 环境变量检查脚本
 * 检查部署前必须配置的环境变量
 */

const fs = require('fs');
const path = require('path');

// 检查的环境变量列表
const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
];

const OPTIONAL_ENV_VARS = [
  'NEXT_PUBLIC_SITE_URL'
];

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  const envExamplePath = path.join(process.cwd(), '.env.local.example');

  log('\n=== VovBlog 环境变量检查 ===\n', 'blue');

  // 检查 .env.local 是否存在
  if (!fs.existsSync(envPath)) {
    log('⚠️  .env.local 文件不存在', 'yellow');
    log('📝 请复制 .env.local.example 并填入必要信息\n', 'yellow');

    if (fs.existsSync(envExamplePath)) {
      const exampleContent = fs.readFileSync(envExamplePath, 'utf8');
      log('参考模板:', 'blue');
      console.log(exampleContent);
    }

    log('\n❌ 环境变量未配置，无法部署！', 'red');
    process.exit(1);
  }

  // 读取环境变量
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};

  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        envVars[key] = valueParts.join('=');
      }
    }
  });

  // 检查必需的环境变量
  log('检查必需环境变量:', 'blue');
  let missingRequired = false;

  REQUIRED_ENV_VARS.forEach(varName => {
    if (!envVars[varName]) {
      log(`  ❌ ${varName} - 未配置`, 'red');
      missingRequired = true;
    } else {
      const maskedValue = envVars[varName].substring(0, 8) + '***';
      log(`  ✅ ${varName} - ${maskedValue}`, 'green');
    }
  });

  // 检查可选环境变量
  log('\n检查可选环境变量:', 'blue');
  OPTIONAL_ENV_VARS.forEach(varName => {
    if (!envVars[varName]) {
      log(`  ⚠️  ${varName} - 未配置 (可选)`, 'yellow');
    } else {
      log(`  ✅ ${varName} - 已配置`, 'green');
    }
  });

  // 返回结果
  if (missingRequired) {
    log('\n❌ 检查失败！缺少必需的环境变量', 'red');
    log('请编辑 .env.local 文件并填入所有必需的环境变量\n', 'yellow');
    process.exit(1);
  } else {
    log('\n✅ 环境变量检查通过！', 'green');
    log('所有必需的环境变量已正确配置\n', 'green');
    return true;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  checkEnvFile();
}

module.exports = { checkEnvFile };
