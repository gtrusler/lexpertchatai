// Simple script to check if environment variables are being loaded
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Checking environment variables...');

// Check .env file in root directory
const rootEnvPath = path.join(__dirname, '.env');
if (fs.existsSync(rootEnvPath)) {
  console.log('Root .env file exists');
  const envContent = fs.readFileSync(rootEnvPath, 'utf8');
  const envLines = envContent.split('\n').filter(line => line.trim() !== '');
  console.log(`Root .env file has ${envLines.length} lines`);
  
  // Check for Supabase variables
  const hasSupabaseUrl = envContent.includes('VITE_SUPABASE_URL');
  const hasSupabaseKey = envContent.includes('VITE_SUPABASE_KEY');
  
  console.log('VITE_SUPABASE_URL exists:', hasSupabaseUrl);
  console.log('VITE_SUPABASE_KEY exists:', hasSupabaseKey);
} else {
  console.log('Root .env file does not exist');
}

// Check .env file in frontend directory
const frontendEnvPath = path.join(__dirname, 'src', 'frontend', '.env');
if (fs.existsSync(frontendEnvPath)) {
  console.log('Frontend .env file exists');
  const envContent = fs.readFileSync(frontendEnvPath, 'utf8');
  const envLines = envContent.split('\n').filter(line => line.trim() !== '');
  console.log(`Frontend .env file has ${envLines.length} lines`);
  
  // Check for Supabase variables
  const hasSupabaseUrl = envContent.includes('VITE_SUPABASE_URL');
  const hasSupabaseKey = envContent.includes('VITE_SUPABASE_KEY');
  
  console.log('VITE_SUPABASE_URL exists:', hasSupabaseUrl);
  console.log('VITE_SUPABASE_KEY exists:', hasSupabaseKey);
} else {
  console.log('Frontend .env file does not exist');
}

// Check if there's a .env.local file
const localEnvPath = path.join(__dirname, '.env.local');
if (fs.existsSync(localEnvPath)) {
  console.log('Local .env file exists');
} else {
  console.log('Local .env file does not exist');
}

console.log('Environment check complete'); 