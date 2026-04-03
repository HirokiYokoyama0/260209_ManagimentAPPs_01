/**
 * 026マイグレーションの影響範囲を調査
 * ServerClient使用箇所を全て洗い出す
 */

import * as fs from 'fs';
import * as path from 'path';

// 026で変更されたテーブル
const AFFECTED_TABLES = [
  'profiles',
  'stamp_history',
  'reward_exchanges',
  'families',
  'patient_dental_records',
  'milestone_history',
  'event_logs',
  'families_parent_permissions',
];

// ServerClientを使用しているファイルを検索
function findServerClientUsage(dir: string): string[] {
  const results: string[] = [];

  function walk(currentDir: string) {
    const files = fs.readdirSync(currentDir);

    for (const file of files) {
      const fullPath = path.join(currentDir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        walk(fullPath);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        if (content.includes('createSupabaseServerClient')) {
          results.push(fullPath);
        }
      }
    }
  }

  walk(dir);
  return results;
}

// ファイル内でどのテーブルにアクセスしているか分析
function analyzeFile(filePath: string): {
  file: string;
  usesServerClient: boolean;
  affectedTables: string[];
  operations: string[];
} {
  const content = fs.readFileSync(filePath, 'utf-8');
  const affectedTables: string[] = [];
  const operations: string[] = [];

  // テーブルアクセスを検出
  for (const table of AFFECTED_TABLES) {
    if (content.includes(`from("${table}")`)) {
      affectedTables.push(table);

      // 操作タイプを検出
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes(`from("${table}")`)) {
          // 次の数行を確認
          const contextLines = lines.slice(i, i + 10).join('\n');
          if (contextLines.includes('.select(')) operations.push('SELECT');
          if (contextLines.includes('.insert(')) operations.push('INSERT');
          if (contextLines.includes('.update(')) operations.push('UPDATE');
          if (contextLines.includes('.delete(')) operations.push('DELETE');
        }
      }
    }
  }

  return {
    file: filePath.replace(process.cwd() + '\\', ''),
    usesServerClient: content.includes('createSupabaseServerClient'),
    affectedTables: [...new Set(affectedTables)],
    operations: [...new Set(operations)],
  };
}

// メイン処理
const apiDir = path.join(process.cwd(), 'app', 'api');
const files = findServerClientUsage(apiDir);

console.log('# 026マイグレーション影響範囲調査\n');
console.log(`## ServerClient使用ファイル数: ${files.length}\n`);

const criticalFiles: any[] = [];

for (const file of files) {
  const analysis = analyzeFile(file);

  if (analysis.affectedTables.length > 0) {
    criticalFiles.push(analysis);
    console.log(`### ⚠️ ${analysis.file}`);
    console.log(`- テーブル: ${analysis.affectedTables.join(', ')}`);
    console.log(`- 操作: ${analysis.operations.join(', ')}`);
    console.log('');
  }
}

console.log('\n## 修正が必要なファイル\n');
console.log(`合計: ${criticalFiles.length}ファイル\n`);

// テーブル別の影響
console.log('## テーブル別影響\n');
const tableImpact = new Map<string, number>();
for (const file of criticalFiles) {
  for (const table of file.affectedTables) {
    tableImpact.set(table, (tableImpact.get(table) || 0) + 1);
  }
}

for (const [table, count] of Array.from(tableImpact.entries()).sort((a, b) => b[1] - a[1])) {
  console.log(`- **${table}**: ${count}ファイル`);
}
