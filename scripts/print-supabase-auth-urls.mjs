#!/usr/bin/env node
/**
 * Prints Supabase Auth URL values to paste for local / ngrok / production.
 * Usage:
 *   node scripts/print-supabase-auth-urls.mjs
 *   node scripts/print-supabase-auth-urls.mjs https://abcd.ngrok-free.app
 */

const production = 'https://cadetmate.co.uk';
const local = process.env.PORT
  ? `http://localhost:${process.env.PORT}`
  : 'http://localhost:3000';
const ngrok = (process.argv[2] || process.env.NEXT_PUBLIC_URL || '').replace(/\/$/, '');

const origins = [...new Set([local, production, ngrok].filter(Boolean))];

console.log('\nSupabase → Authentication → URL Configuration\n');
console.log('Site URL (pick the one you are testing now):');
console.log(`  ${ngrok || local}`);
console.log('\nRedirect URLs (add all of these):');
for (const origin of origins) {
  console.log(`  ${origin}/**`);
  console.log(`  ${origin}/auth`);
  console.log(`  ${origin}/auth/**`);
  console.log(`  ${origin}/reset-password`);
}
console.log(`\nThen in .env.local set:\n  NEXT_PUBLIC_URL=${ngrok || local}`);
console.log('Restart next dev after changing NEXT_PUBLIC_URL.\n');
console.log('Supabase API URL / anon key do NOT change for ngrok.');
console.log('They stay as NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.\n');
