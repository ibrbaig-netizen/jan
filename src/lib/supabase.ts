import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Keys from environment variables or runtime configuration in local storage
const ENV_SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const ENV_SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
  source: 'env' | 'storage' | 'none';
}

/**
 * Retrieves the current Supabase configuration, prioritizing environment variables,
 * then falling back to user-configured localStorage settings.
 */
export function getSupabaseConfig(): SupabaseConfig {
  if (ENV_SUPABASE_URL && ENV_SUPABASE_ANON_KEY) {
    return {
      url: ENV_SUPABASE_URL,
      anonKey: ENV_SUPABASE_ANON_KEY,
      isConfigured: true,
      source: 'env'
    };
  }

  try {
    const storedUrl = (localStorage.getItem('jan_chemist_supabase_url') || '').trim();
    const storedKey = (localStorage.getItem('jan_chemist_supabase_anon_key') || '').trim();

    if (storedUrl && storedKey) {
      return {
        url: storedUrl,
        anonKey: storedKey,
        isConfigured: true,
        source: 'storage'
      };
    }
  } catch (err) {
    console.warn('Could not read Supabase config from localStorage:', err);
  }

  return {
    url: '',
    anonKey: '',
    isConfigured: false,
    source: 'none'
  };
}

let cachedClient: SupabaseClient | null = null;
let lastUsedConfigSignature = '';

/**
 * Returns an initialized SupabaseClient instance if configured, or a fallback client.
 */
export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config.isConfigured) {
    return null;
  }

  const signature = `${config.url}::${config.anonKey}`;
  if (cachedClient && lastUsedConfigSignature === signature) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage
      }
    });
    lastUsedConfigSignature = signature;
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

/**
 * Saves Supabase credentials to localStorage and refreshes client.
 */
export function saveSupabaseConfig(url: string, anonKey: string): boolean {
  try {
    const cleanUrl = url.trim().replace(/\/+$/, '');
    const cleanKey = anonKey.trim();

    if (!cleanUrl || !cleanKey) {
      localStorage.removeItem('jan_chemist_supabase_url');
      localStorage.removeItem('jan_chemist_supabase_anon_key');
      cachedClient = null;
      lastUsedConfigSignature = '';
      return false;
    }

    localStorage.setItem('jan_chemist_supabase_url', cleanUrl);
    localStorage.setItem('jan_chemist_supabase_anon_key', cleanKey);
    cachedClient = null;
    lastUsedConfigSignature = '';
    return true;
  } catch (err) {
    console.error('Failed to save Supabase config:', err);
    return false;
  }
}

/**
 * Clears stored Supabase credentials.
 */
export function clearSupabaseConfig(): void {
  try {
    localStorage.removeItem('jan_chemist_supabase_url');
    localStorage.removeItem('jan_chemist_supabase_anon_key');
    cachedClient = null;
    lastUsedConfigSignature = '';
  } catch {}
}

/**
 * Tests the connection to Supabase and checks if tables exist.
 */
export async function testSupabaseConnection(url?: string, anonKey?: string): Promise<{
  success: boolean;
  message: string;
  tablesFound?: string[];
  latencyMs?: number;
}> {
  const targetUrl = (url || getSupabaseConfig().url).trim();
  const targetKey = (anonKey || getSupabaseConfig().anonKey).trim();

  if (!targetUrl || !targetKey) {
    return {
      success: false,
      message: 'Supabase URL and Anon Key are missing.'
    };
  }

  const startTime = Date.now();
  try {
    const client = createClient(targetUrl, targetKey);
    
    // Test departments table
    const { data: deptData, error: deptError } = await client
      .from('departments')
      .select('count', { count: 'exact', head: true });

    const latency = Date.now() - startTime;

    if (deptError) {
      if (deptError.code === 'PGRST116' || deptError.message.includes('relation "public.departments" does not exist')) {
        return {
          success: true,
          message: 'Connected to Supabase project, but tables are not created yet. Run the schema SQL script in Supabase SQL Editor.',
          latencyMs: latency,
          tablesFound: []
        };
      }
      return {
        success: false,
        message: `Connection failed: ${deptError.message} (Code: ${deptError.code})`
      };
    }

    // Check other core tables
    const tables: string[] = ['departments'];
    try {
      const { error: prodErr } = await client.from('products').select('count', { count: 'exact', head: true });
      if (!prodErr) tables.push('products');
    } catch {}
    try {
      const { error: ordErr } = await client.from('orders').select('count', { count: 'exact', head: true });
      if (!ordErr) tables.push('orders');
    } catch {}
    try {
      const { error: cmsErr } = await client.from('cms_settings').select('count', { count: 'exact', head: true });
      if (!cmsErr) tables.push('cms_settings');
    } catch {}
    try {
      const { error: profErr } = await client.from('profiles').select('count', { count: 'exact', head: true });
      if (!profErr) tables.push('profiles');
    } catch {}

    return {
      success: true,
      message: `Successfully connected to Supabase in ${latency}ms! Found ${tables.length} tables.`,
      latencyMs: latency,
      tablesFound: tables
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Connection error: ${err.message || String(err)}`
    };
  }
}
