import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vnzhcsncojzocfbuatfs.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuemhjc25jb2p6b2NmYnVhdGZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNTU1MTMsImV4cCI6MjA5MTgzMTUxM30.3jDmBj3zgqdu7WaRIXgItXO9cnmTUHwClVPM4ZA1EFI'
);

async function test() {
  const { data, error } = await supabase.from('presupuestos').select('id, version, numero_acuerdo').limit(1);
  if (error) {
    console.error('Error in DB:', error);
  } else {
    console.log('DB OK:', data);
  }
}

test();
