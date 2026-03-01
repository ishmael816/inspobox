#!/usr/bin/env ts-node
/**
 * InspoBox 规范验证脚本
 * 检查代码实现是否符合 SDD 规范
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse as parseYAML } from 'yaml';

interface ValidationResult {
  passed: boolean;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

class SpecValidator {
  private results: ValidationResult[] = [];
  private openapiSpec: any;

  constructor() {
    this.loadOpenAPISpec();
  }

  private loadOpenAPISpec() {
    const specPath = path.join(__dirname, 'openapi.yaml');
    const specContent = fs.readFileSync(specPath, 'utf-8');
    this.openapiSpec = parseYAML(specContent);
  }

  private addResult(passed: boolean, message: string, severity: ValidationResult['severity'] = 'error') {
    this.results.push({ passed, message, severity });
  }

  // 1. 验证数据库类型定义
  validateDatabaseTypes(): void {
    console.log('🔍 检查数据库类型定义...');
    
    const typesPath = path.join(__dirname, '../src/lib/database.types.ts');
    if (!fs.existsSync(typesPath)) {
      this.addResult(false, '缺少数据库类型定义文件: src/lib/database.types.ts');
      return;
    }

    const content = fs.readFileSync(typesPath, 'utf-8');
    
    // 检查必需的表
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
  validateBusinessTypes(): void {
    console.log('🔍 检查业务类型定义...');
    
    const typesPath = path.join(__dirname, '../src/types/index.ts');
    if (!fs.existsSync(typesPath)) {
      this.addResult(false, '缺少业务类型定义文件: src/types/index.ts');
      return;
    }

    const content = fs.readFileSync(typesPath, 'utf-8');
    
    // 检查必需的接口
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
  validateAPIRoutes(): void {
    console.log('🔍 检查 API 路由...');
    
    const apiDir = path.join(__dirname, '../src/app/api');
    
    // 检查必需的 API 路由
    const requiredRoutes = [
      { path: 'analyze/route.ts', methods: ['POST'] },
      { path: 'auth/signout/route.ts', methods: ['POST'] },
    ];

    for (const route of requiredRoutes) {
      const fullPath = path.join(apiDir, route.path);
      if (fs.existsSync(fullPath)) {
        this.addResult(true, `✅ 找到 API 路由: ${route.path}`, 'info');
        
        // 检查方法导出
        const content = fs.readFileSync(fullPath, 'utf-8');
        for (const method of route.methods) {
          if (content.includes(`export async function ${method}`) || 
              content.includes(`export const ${method}`)) {
            this.addResult(true, `  ✅ 导出 ${method} 方法`, 'info');
          }
        }
      } else {
        this.addResult(false, `❌ 缺少 API 路由: ${route.path}`);
      }
    }
  }

  // 4. 验证 Supabase 客户端配置
  validateSupabaseClients(): void {
    console.log('🔍 检查 Supabase 客户端配置...');
    
    const requiredClients = [
      'src/lib/supabase-client.ts',
      'src/lib/supabase-server.ts',
      'src/lib/supabase-middleware.ts',
      'src/lib/supabase.ts',
    ];

    for (const client of requiredClients) {
      const fullPath = path.join(__dirname, '..', client);
      if (fs.existsSync(fullPath)) {
        this.addResult(true, `✅ 找到客户端文件: ${client}`, 'info');
      } else {
        this.addResult(false, `❌ 缺少客户端文件: ${client}`);
      }
    }
  }

  // 5. 验证中间件
  validateMiddleware(): void {
    console.log('🔍 检查中间件...');
    
    const middlewarePath = path.join(__dirname, '../src/middleware.ts');
    if (!fs.existsSync(middlewarePath)) {
      this.addResult(false, '缺少中间件文件: src/middleware.ts');
      return;
    }

    const content = fs.readFileSync(middlewarePath, 'utf-8');
    
    // 检查关键逻辑
    const checks = [
      { pattern: 'protectedRoutes', desc: '受保护路由配置' },
      { pattern: 'authRoutes', desc: '认证路由配置' },
      { pattern: 'updateSession', desc: '会话更新逻辑' },
    ];

    for (const check of checks) {
      if (content.includes(check.pattern)) {
        this.addResult(true, `✅ 找到: ${check.desc}`, 'info');
      } else {
        this.addResult(false, `❌ 缺少: ${check.desc}`);
      }
    }
  }

  // 6. 验证环境变量配置
  validateEnvConfig(): void {
    console.log('🔍 检查环境变量配置...');
    
    const envPath = path.join(__dirname, '../.env.local');
    const envExamplePath = path.join(__dirname, '../.env.example');
    
    if (!fs.existsSync(envPath)) {
      this.addResult(false, '缺少环境变量文件: .env.local');
      return;
    }

    const content = fs.readFileSync(envPath, 'utf-8');
    
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
  validatePages(): void {
    console.log('🔍 检查页面组件...');
    
    const requiredPages = [
      'src/app/page.tsx',
      'src/app/layout.tsx',
      'src/app/login/page.tsx',
      'src/app/register/page.tsx',
      'src/app/studio/page.tsx',
    ];

    for (const page of requiredPages) {
      const fullPath = path.join(__dirname, '..', page);
      if (fs.existsSync(fullPath)) {
        this.addResult(true, `✅ 找到页面: ${page}`, 'info');
      } else {
        this.addResult(false, `❌ 缺少页面: ${page}`);
      }
    }
  }

  // 8. 验证 OpenAPI 规范完整性
  validateOpenAPIIntegrity(): void {
    console.log('🔍 检查 OpenAPI 规范完整性...');
    
    const spec = this.openapiSpec;
    
    // 检查基本信息
    if (spec.info?.title && spec.info?.version) {
      this.addResult(true, `✅ API 标题: ${spec.info.title} v${spec.info.version}`, 'info');
    }

    // 检查必需的路径
    const requiredPaths = ['/fragments', '/stories', '/tags', '/analyze'];
    for (const path of requiredPaths) {
      if (spec.paths?.[path]) {
        this.addResult(true, `✅ 定义路径: ${path}`, 'info');
      } else {
        this.addResult(false, `❌ 缺少路径: ${path}`);
      }
    }

    // 检查安全方案
    if (spec.components?.securitySchemes) {
      this.addResult(true, '✅ 定义安全方案', 'info');
    }
  }

  // 9. 验证数据库迁移
  validateMigrations(): void {
    console.log('🔍 检查数据库迁移文件...');
    
    const migrationsDir = path.join(__dirname, '../supabase/migrations');
    
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
  runAllValidations(): void {
    console.log('=================================');
    console.log('InspoBox 规范验证');
    console.log('=================================\n');

    this.validateOpenAPIIntegrity();
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

  printReport(): void {
    console.log('\n=================================');
    console.log('验证报告');
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
