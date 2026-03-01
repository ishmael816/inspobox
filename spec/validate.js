#!/usr/bin/env node
/**
 * InspoBox 规范验证脚本
 * 检查代码实现是否符合 SDD 规范
 */

const fs = require('fs');
const path = require('path');

class SpecValidator {
  constructor() {
    this.results = [];
    this.rootDir = path.join(__dirname, '..');
  }

  addResult(passed, message, severity = 'error') {
    this.results.push({ passed, message, severity });
  }

  fileExists(...parts) {
    return fs.existsSync(path.join(this.rootDir, ...parts));
  }

  readFile(...parts) {
    try {
      return fs.readFileSync(path.join(this.rootDir, ...parts), 'utf-8');
    } catch {
      return null;
    }
  }

  // 1. 验证数据库类型定义
  validateDatabaseTypes() {
    console.log('🔍 检查数据库类型定义...');
    
    const content = this.readFile('src', 'lib', 'database.types.ts');
    if (!content) {
      this.addResult(false, '缺少数据库类型定义文件: src/lib/database.types.ts');
      return;
    }

    const requiredTables = ['fragments', 'stories', 'tags', 'fragment_tags', 'ai_analysis_history'];
    for (const table of requiredTables) {
      if (content.includes(table)) {
        this.addResult(true, `✅ 找到表定义: ${table}`, 'info');
      } else {
        this.addResult(false, `❌ 缺少表定义: ${table}`);
      }
    }
  }

  // 2. 验证业务类型定义
  validateBusinessTypes() {
    console.log('🔍 检查业务类型定义...');
    
    const content = this.readFile('src', 'types', 'index.ts');
    if (!content) {
      this.addResult(false, '缺少业务类型定义文件: src/types/index.ts');
      return;
    }

    const requiredInterfaces = ['Fragment', 'Story', 'Tag', 'AIAnalysisResult'];
    for (const iface of requiredInterfaces) {
      if (content.includes(`interface ${iface}`) || content.includes(`type ${iface}`)) {
        this.addResult(true, `✅ 找到接口定义: ${iface}`, 'info');
      } else {
        this.addResult(false, `❌ 缺少接口定义: ${iface}`);
      }
    }
  }

  // 3. 验证 API 路由
  validateAPIRoutes() {
    console.log('🔍 检查 API 路由...');
    
    const routes = [
      { path: ['src', 'app', 'api', 'analyze', 'route.ts'], name: '/api/analyze' },
      { path: ['src', 'app', 'api', 'auth', 'signout', 'route.ts'], name: '/api/auth/signout' },
    ];

    for (const route of routes) {
      if (this.fileExists(...route.path)) {
        this.addResult(true, `✅ 找到 API 路由: ${route.name}`, 'info');
      } else {
        this.addResult(false, `❌ 缺少 API 路由: ${route.name}`);
      }
    }
  }

  // 4. 验证 Supabase 客户端配置
  validateSupabaseClients() {
    console.log('🔍 检查 Supabase 客户端配置...');
    
    const clients = [
      ['src', 'lib', 'supabase-client.ts'],
      ['src', 'lib', 'supabase-server.ts'],
      ['src', 'lib', 'supabase-middleware.ts'],
      ['src', 'lib', 'supabase.ts'],
    ];

    for (const client of clients) {
      const name = client[client.length - 1];
      if (this.fileExists(...client)) {
        this.addResult(true, `✅ 找到客户端文件: ${name}`, 'info');
      } else {
        this.addResult(false, `❌ 缺少客户端文件: ${name}`);
      }
    }
  }

  // 5. 验证中间件
  validateMiddleware() {
    console.log('🔍 检查中间件...');
    
    const content = this.readFile('src', 'middleware.ts');
    if (!content) {
      this.addResult(false, '缺少中间件文件: src/middleware.ts');
      return;
    }

    this.addResult(true, '✅ 找到中间件文件', 'info');

    const checks = [
      { pattern: 'protectedRoutes', desc: '受保护路由配置' },
      { pattern: 'authRoutes', desc: '认证路由配置' },
      { pattern: 'updateSession', desc: '会话更新逻辑' },
    ];

    for (const check of checks) {
      if (content.includes(check.pattern)) {
        this.addResult(true, `  ✅ 包含: ${check.desc}`, 'info');
      } else {
        this.addResult(false, `  ❌ 缺少: ${check.desc}`);
      }
    }
  }

  // 6. 验证环境变量配置
  validateEnvConfig() {
    console.log('🔍 检查环境变量配置...');
    
    const content = this.readFile('.env.local');
    if (!content) {
      this.addResult(false, '缺少环境变量文件: .env.local', 'warning');
      return;
    }

    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'DASHSCOPE_API_KEY',
    ];

    for (const envVar of requiredVars) {
      if (content.includes(envVar)) {
        this.addResult(true, `✅ 找到环境变量: ${envVar}`, 'info');
      } else {
        this.addResult(false, `❌ 缺少环境变量: ${envVar}`);
      }
    }
  }

  // 7. 验证页面组件
  validatePages() {
    console.log('🔍 检查页面组件...');
    
    const pages = [
      ['src', 'app', 'page.tsx'],
      ['src', 'app', 'layout.tsx'],
      ['src', 'app', 'login', 'page.tsx'],
      ['src', 'app', 'register', 'page.tsx'],
      ['src', 'app', 'studio', 'page.tsx'],
    ];

    for (const page of pages) {
      const name = page.join('/');
      if (this.fileExists(...page)) {
        this.addResult(true, `✅ 找到页面: ${name}`, 'info');
      } else {
        this.addResult(false, `❌ 缺少页面: ${name}`);
      }
    }
  }

  // 8. 验证规范文件
  validateSpecFiles() {
    console.log('🔍 检查规范文件...');
    
    const specs = [
      'openapi.yaml',
      'database.schema.sql',
      'architecture.md',
      'testing.md',
      'SDD_WORKFLOW.md',
    ];

    for (const spec of specs) {
      if (this.fileExists('spec', spec)) {
        this.addResult(true, `✅ 找到规范文件: ${spec}`, 'info');
      } else {
        this.addResult(false, `❌ 缺少规范文件: ${spec}`);
      }
    }
  }

  // 9. 验证数据库迁移
  validateMigrations() {
    console.log('🔍 检查数据库迁移文件...');
    
    const migrationsDir = path.join(this.rootDir, 'supabase', 'migrations');
    
    if (!fs.existsSync(migrationsDir)) {
      this.addResult(false, '缺少迁移目录: supabase/migrations', 'warning');
      return;
    }

    const files = fs.readdirSync(migrationsDir);
    const sqlFiles = files.filter(f => f.endsWith('.sql'));
    
    if (sqlFiles.length > 0) {
      this.addResult(true, `✅ 找到 ${sqlFiles.length} 个迁移文件`, 'info');
    } else {
      this.addResult(false, '⚠️ 没有找到 SQL 迁移文件', 'warning');
    }
  }

  // 运行所有验证
  runAllValidations() {
    console.log('=================================');
    console.log('  InspoBox 规范验证 (SDD)');
    console.log('=================================\n');

    this.validateSpecFiles();
    this.validateDatabaseTypes();
    this.validateBusinessTypes();
    this.validateAPIRoutes();
    this.validateSupabaseClients();
    this.validateMiddleware();
    this.validateEnvConfig();
    this.validatePages();
    this.validateMigrations();

    this.printReport();
  }

  printReport() {
    console.log('\n=================================');
    console.log('           验证报告');
    console.log('=================================');

    const errors = this.results.filter(r => r.severity === 'error' && !r.passed);
    const warnings = this.results.filter(r => r.severity === 'warning' && !r.passed);
    const infos = this.results.filter(r => r.passed);

    console.log(`\n✅ 通过: ${infos.length}`);
    console.log(`⚠️ 警告: ${warnings.length}`);
    console.log(`❌ 错误: ${errors.length}`);

    if (errors.length > 0) {
      console.log('\n--- 错误详情 ---');
      errors.forEach(e => console.log(`❌ ${e.message}`));
    }

    if (warnings.length > 0) {
      console.log('\n--- 警告详情 ---');
      warnings.forEach(w => console.log(`⚠️ ${w.message}`));
    }

    console.log('\n=================================');
    
    if (errors.length === 0) {
      console.log('✨ 所有检查通过！项目符合 SDD 规范。');
      process.exit(0);
    } else {
      console.log('❌ 存在规范不符合项，请修复后重试。');
      process.exit(1);
    }
  }
}

// 运行验证
const validator = new SpecValidator();
validator.runAllValidations();
