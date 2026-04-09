
require('dotenv').config({ path: '.env.local' });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!url) {
  console.log('URL is undefined');
} else {
  console.log('URL:', JSON.stringify(url));
  console.log('Length:', url.length);
  console.log('Hex:', Buffer.from(url).toString('hex'));
}
