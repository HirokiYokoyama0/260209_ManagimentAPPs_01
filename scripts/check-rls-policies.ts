import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔐 RLSポリシー確認');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// ANON_KEYで接続（RLS有効）
const supabaseAnon = createClient(supabaseUrl, anonKey);

// SERVICE_ROLE_KEYで接続（RLS無視）
const supabaseService = createClient(supabaseUrl, serviceKey);

async function checkRLS() {
  console.log('📊 1. SERVICE_ROLE_KEYでの取得（RLS無視）\n');
  const { data: serviceData, error: serviceError } = await supabaseService
    .from('milestone_rewards')
    .select('*');

  const serviceCount = serviceData ? serviceData.length : 0;
  console.log(`   レコード数: ${serviceCount}件`);
  if (serviceError) console.log(`   エラー: ${serviceError.message}`);

  console.log('\n📊 2. ANON_KEYでの取得（RLS有効）\n');
  const { data: anonData, error: anonError } = await supabaseAnon
    .from('milestone_rewards')
    .select('*');

  const anonCount = anonData ? anonData.length : 0;
  console.log(`   レコード数: ${anonCount}件`);
  if (anonError) console.log(`   エラー: ${anonError.message}`);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📝 結果');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (anonData && anonData.length > 0) {
    console.log('✅ ANON_KEYでデータ取得可能');
    console.log('   ミニアプリ側でもデータが見えるはずです。\n');
  } else {
    console.log('❌ ANON_KEYでデータ取得不可');
    console.log('   **これがミニアプリで0件になる原因です！**\n');
    console.log('   対処: RLSポリシーを修正する必要があります。');
  }
}

checkRLS();
