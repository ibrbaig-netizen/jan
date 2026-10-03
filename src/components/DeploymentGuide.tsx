import React, { useState, useEffect } from 'react';
import {
  Check,
  CheckCircle2,
  Copy,
  Cpu,
  Download,
  ExternalLink,
  FileCode,
  Globe,
  HardDrive,
  HelpCircle,
  Laptop,
  Layers,
  Lock,
  RefreshCw,
  Server,
  ShieldCheck,
  Terminal,
  Zap,
  AlertCircle
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const DeploymentGuide: React.FC = () => {
  const { storeConfig, showToast } = useStore();
  const [userDomain, setUserDomain] = useState('janchemist.com');
  const [serverIp, setServerIp] = useState('198.51.100.42');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activePlatform, setActivePlatform] = useState<'vps' | 'cloud' | 'cpanel' | 'health'>('vps');

  // Live diagnostics from backend
  const [serverInfo, setServerInfo] = useState<any>(null);
  const [isCheckingServer, setIsCheckingServer] = useState(false);

  const cleanDomain = userDomain.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '') || 'yourdomain.com';
  const cleanIp = serverIp.trim() || 'YOUR_SERVER_IP';

  const fetchServerDiagnostics = async () => {
    setIsCheckingServer(true);
    try {
      const res = await fetch('/api/server-info');
      if (res.ok) {
        const data = await res.json();
        setServerInfo(data);
      }
    } catch (err) {
      console.error('Failed to query /api/server-info', err);
    } finally {
      setIsCheckingServer(false);
    }
  };

  useEffect(() => {
    fetchServerDiagnostics();
  }, []);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast('Copied to clipboard!', 'info');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const nginxConfig = `server {
    listen 80;
    listen [::]:80;
    server_name ${cleanDomain} www.${cleanDomain};

    # Maximum upload size for doctor prescription photos
    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}`;

  const ecosystemConfig = `module.exports = {
  apps: [
    {
      name: "janchemist",
      script: "server.ts",
      interpreter: "./node_modules/.bin/tsx",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
};`;

  const envProductionContent = `# Production Environment Variables
NODE_ENV="production"
PORT=3000
APP_URL="https://${cleanDomain}"
GEMINI_API_KEY="${process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY'}"
`;

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${filename}!`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-lg border border-slate-800">
        <div className="max-w-4xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold uppercase tracking-wider">
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            <span>Custom Domain &amp; Backend Production Guide</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            How to Deploy Your Customer Website &amp; Backend Server to Your Custom Domain
          </h2>

          <p className="text-sm text-slate-300 leading-relaxed">
            Your application consists of two seamlessly integrated parts:
            <br />
            <strong>1. Customer Frontend:</strong> React 19 SPA running at <code className="text-emerald-400">/</code> (high-speed catalog, cart, prescription uploads, WhatsApp ordering).
            <br />
            <strong>2. Admin &amp; Backend Server:</strong> Node.js Express server running at <code className="text-purple-400">server.ts</code> and secure Admin Portal at <code className="text-amber-400">/admin</code>.
          </p>
        </div>
      </div>

      {/* Domain & Server Interactive Inputs */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Interactive Deployment Configurator</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Type your registered domain name and server IP below to automatically tailor all server commands and configuration files:
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => downloadFile('nginx.conf', nginxConfig)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-slate-300/80"
              title="Download customized nginx.conf"
            >
              <Download className="w-3.5 h-3.5" />
              <span>nginx.conf</span>
            </button>
            <button
              onClick={() => downloadFile('ecosystem.config.cjs', ecosystemConfig)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-slate-300/80"
              title="Download PM2 process file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ecosystem.config.cjs</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Your Custom Domain Name:
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userDomain}
                onChange={e => setUserDomain(e.target.value)}
                placeholder="e.g. janchemist.com or shop.janchemist.pk"
                className="w-full pl-9 pr-3 py-2 text-sm font-mono bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-indigo-600 focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Your website will be live at: <strong className="text-emerald-700">https://{cleanDomain}</strong> (Admin at <strong className="text-purple-700">https://{cleanDomain}/admin</strong>)
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Your Server Public IP Address:
            </label>
            <div className="relative">
              <Server className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={serverIp}
                onChange={e => setServerIp(e.target.value)}
                placeholder="e.g. 198.51.100.42"
                className="w-full pl-9 pr-3 py-2 text-sm font-mono bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-indigo-600 focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Obtained from your hosting provider (DigitalOcean, AWS, Linode, Hetzner, Contabo).
            </p>
          </div>
        </div>
      </div>

      {/* Platform Switcher Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActivePlatform('vps')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
            activePlatform === 'vps'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Option 1: Ubuntu / Linux VPS (Recommended)</span>
        </button>

        <button
          onClick={() => setActivePlatform('cloud')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
            activePlatform === 'cloud'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Option 2: Cloud PaaS (Render / Railway)</span>
        </button>

        <button
          onClick={() => setActivePlatform('cpanel')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
            activePlatform === 'cpanel'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Laptop className="w-4 h-4" />
          <span>Option 3: cPanel Node.js Host</span>
        </button>

        <button
          onClick={() => setActivePlatform('health')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
            activePlatform === 'health'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          <span>Live Server Diagnostics</span>
        </button>
      </div>

      {/* PLATFORM 1: UBUNTU VPS (STEP-BY-STEP) */}
      {activePlatform === 'vps' && (
        <div className="space-y-6">
          {/* Step 1: DNS Setup */}
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 font-extrabold flex items-center justify-center text-sm">
                1
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-base">
                  Configure DNS Records at Your Domain Registrar
                </h4>
                <p className="text-xs text-slate-500">
                  Go to GoDaddy, Namecheap, Cloudflare, or your domain provider and add these 2 DNS records:
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2.5 px-4">Record Type</th>
                    <th className="py-2.5 px-4">Name / Host</th>
                    <th className="py-2.5 px-4">Points To / Target Value</th>
                    <th className="py-2.5 px-4">TTL</th>
                    <th className="py-2.5 px-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  <tr>
                    <td className="py-2.5 px-4 font-bold text-indigo-700">A</td>
                    <td className="py-2.5 px-4">@ (or root)</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">{cleanIp}</td>
                    <td className="py-2.5 px-4 text-slate-500">Automatic / 3600</td>
                    <td className="py-2.5 px-4">
                      <button
                        onClick={() => handleCopy(cleanIp, 'dns-a')}
                        className="inline-flex items-center gap-1 text-[11px] font-sans font-bold text-indigo-600 hover:text-indigo-800"
                      >
                        {copiedKey === 'dns-a' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Copy IP</span>
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-bold text-indigo-700">CNAME</td>
                    <td className="py-2.5 px-4">www</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">{cleanDomain}</td>
                    <td className="py-2.5 px-4 text-slate-500">Automatic / 3600</td>
                    <td className="py-2.5 px-4">
                      <button
                        onClick={() => handleCopy(cleanDomain, 'dns-cname')}
                        className="inline-flex items-center gap-1 text-[11px] font-sans font-bold text-indigo-600 hover:text-indigo-800"
                      >
                        {copiedKey === 'dns-cname' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Copy Domain</span>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Step 2: Install Node.js, Nginx & PM2 */}
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 font-extrabold flex items-center justify-center text-sm">
                  2
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">
                    SSH into Your Server &amp; Install Prerequisites
                  </h4>
                  <p className="text-xs text-slate-500">
                    Connect via terminal and install Node.js 20+, Nginx, and PM2:
                  </p>
                </div>
              </div>

              <button
                onClick={() =>
                  handleCopy(
                    `# Connect to your server\nssh root@${cleanIp}\n\n# Update package manager\nsudo apt update && sudo apt upgrade -y\n\n# Install Node.js 20 & Git\ncurl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -\nsudo apt install -y nodejs git nginx certbot python3-certbot-nginx\n\n# Install PM2 Process Manager globally\nsudo npm install -g pm2`,
                    'step2-code'
                  )
                }
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition"
              >
                {copiedKey === 'step2-code' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy Commands</span>
              </button>
            </div>

            <div className="bg-slate-950 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto space-y-2">
              <div className="text-slate-400"># 1. Connect to your server</div>
              <div className="text-emerald-400">ssh root@{cleanIp}</div>
              <div className="text-slate-400 pt-1"># 2. Update and install Node.js 20, Nginx, and Certbot</div>
              <div className="text-emerald-400">curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -</div>
              <div className="text-emerald-400">sudo apt install -y nodejs git nginx certbot python3-certbot-nginx</div>
              <div className="text-slate-400 pt-1"># 3. Install PM2 process manager</div>
              <div className="text-emerald-400">sudo npm install -g pm2</div>
            </div>
          </div>

          {/* Step 3: Clone, Build & Run */}
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 font-extrabold flex items-center justify-center text-sm">
                  3
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">
                    Deploy Project Files, Build Frontend &amp; Start Server
                  </h4>
                  <p className="text-xs text-slate-500">
                    Set up your directory, install packages, compile the Vite app, and start PM2:
                  </p>
                </div>
              </div>

              <button
                onClick={() =>
                  handleCopy(
                    `# Create web directory\nsudo mkdir -p /var/www/janchemist\ncd /var/www/janchemist\n\n# Install dependencies\nnpm install\n\n# Build high-speed customer frontend\nnpm run build\n\n# Start backend server with PM2\npm2 start "npm start" --name "janchemist"\n\n# Configure PM2 to auto-start on server reboot\npm2 startup\npm2 save`,
                    'step3-code'
                  )
                }
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition"
              >
                {copiedKey === 'step3-code' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy Commands</span>
              </button>
            </div>

            <div className="bg-slate-950 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto space-y-2">
              <div className="text-slate-400"># Navigate to project directory</div>
              <div className="text-emerald-400">cd /var/www/janchemist</div>
              <div className="text-slate-400 pt-1"># Install dependencies</div>
              <div className="text-emerald-400">npm install</div>
              <div className="text-slate-400 pt-1"># Build customer website into dist/ folder</div>
              <div className="text-emerald-400">npm run build</div>
              <div className="text-slate-400 pt-1"># Start Express backend server daemon via PM2</div>
              <div className="text-emerald-400">pm2 start "npm start" --name "janchemist"</div>
              <div className="text-slate-400 pt-1"># Save PM2 state so it restarts automatically on system reboots</div>
              <div className="text-emerald-400">pm2 startup && pm2 save</div>
            </div>
          </div>

          {/* Step 4: Nginx Reverse Proxy Configuration */}
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 font-extrabold flex items-center justify-center text-sm">
                  4
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">
                    Configure Nginx Reverse Proxy for <span className="text-indigo-600">{cleanDomain}</span>
                  </h4>
                  <p className="text-xs text-slate-500">
                    Forward incoming web traffic from port 80/443 to internal port 3000:
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleCopy(nginxConfig, 'nginx-conf')}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition"
              >
                {copiedKey === 'nginx-conf' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy Nginx Config</span>
              </button>
            </div>

            <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-xs overflow-x-auto">
              <pre>{nginxConfig}</pre>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
              <p className="font-bold text-slate-800">To apply this Nginx configuration on your server:</p>
              <div className="bg-slate-950 text-emerald-400 p-3 rounded-lg font-mono text-[11px] overflow-x-auto space-y-1">
                <div>sudo nano /etc/nginx/sites-available/{cleanDomain}</div>
                <div className="text-slate-400"># Paste the configuration above, save with Ctrl+O and exit Ctrl+X</div>
                <div>sudo ln -s /etc/nginx/sites-available/{cleanDomain} /etc/nginx/sites-enabled/</div>
                <div>sudo nginx -t && sudo systemctl reload nginx</div>
              </div>
            </div>
          </div>

          {/* Step 5: Free SSL with Certbot */}
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 font-extrabold flex items-center justify-center text-sm">
                  5
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">
                    Issue Free SSL Certificate (HTTPS 🔒) with Let&apos;s Encrypt
                  </h4>
                  <p className="text-xs text-slate-500">
                    Get free automatic HTTPS for {cleanDomain} and www.{cleanDomain}:
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleCopy(`sudo certbot --nginx -d ${cleanDomain} -d www.${cleanDomain}`, 'ssl-code')}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 transition"
              >
                {copiedKey === 'ssl-code' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy SSL Command</span>
              </button>
            </div>

            <div className="bg-slate-950 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto">
              <div className="text-emerald-400">sudo certbot --nginx -d {cleanDomain} -d www.{cleanDomain}</div>
              <div className="text-slate-400 mt-2 text-[11px]">
                Certbot will automatically verify domain ownership, generate SSL certificates, and configure Nginx for automatic HTTPS redirect!
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>That&apos;s it!</strong> Your customer website is live at <a href={`https://${cleanDomain}`} target="_blank" rel="noopener noreferrer" className="underline font-bold">https://{cleanDomain}</a> and your Admin Portal is at <a href={`https://${cleanDomain}/admin`} target="_blank" rel="noopener noreferrer" className="underline font-bold">https://{cleanDomain}/admin</a>.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* PLATFORM 2: RENDER / RAILWAY (PAAS) */}
      {activePlatform === 'cloud' && (
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 font-extrabold flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-base">
                Zero-Sysadmin Cloud Deployment (Render, Railway, Fly.io)
              </h4>
              <p className="text-xs text-slate-500">
                Deploy directly from Git without managing a Linux VPS or Nginx configs.
              </p>
            </div>
          </div>

          <div className="space-y-4 text-xs text-slate-700">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <h5 className="font-bold text-slate-900 text-sm">Step 1: Push Code to GitHub / GitLab</h5>
              <div className="bg-slate-950 text-emerald-400 p-3 rounded-lg font-mono text-[11px] overflow-x-auto space-y-1">
                <div>git init</div>
                <div>git add .</div>
                <div>git commit -m &quot;Deploy Jan Chemist Production Store&quot;</div>
                <div>git remote add origin https://github.com/yourusername/janchemist.git</div>
                <div>git push -u origin main</div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <h5 className="font-bold text-slate-900 text-sm">Step 2: Connect Repository on Render.com or Railway.app</h5>
              <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
                <li>Create a new <strong>Web Service</strong> linked to your repo.</li>
                <li><strong>Runtime:</strong> Node.js</li>
                <li><strong>Build Command:</strong> <code className="bg-white px-1.5 py-0.5 rounded border border-slate-300 font-mono font-bold text-slate-900">npm run build</code></li>
                <li><strong>Start Command:</strong> <code className="bg-white px-1.5 py-0.5 rounded border border-slate-300 font-mono font-bold text-slate-900">npm start</code></li>
              </ul>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <h5 className="font-bold text-slate-900 text-sm">Step 3: Add Custom Domain</h5>
              <p className="text-slate-600">
                In Render/Railway dashboard &rarr; Settings &rarr; Custom Domains &rarr; Enter <strong>{cleanDomain}</strong>. The platform will automatically issue free SSL and provide the CNAME record for your DNS.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* PLATFORM 3: CPANEL NODE.JS */}
      {activePlatform === 'cpanel' && (
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 font-extrabold flex items-center justify-center">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-base">
                cPanel &quot;Setup Node.js App&quot; Procedure
              </h4>
              <p className="text-xs text-slate-500">
                If your web hosting uses cPanel with CloudLinux Node.js selector:
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs text-slate-700">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-900 block">1. Open cPanel &rarr; Software &rarr; &quot;Setup Node.js App&quot;</span>
              <p className="text-slate-500 mt-1">Select Node.js Version: <strong>20.x or higher</strong>.</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-900 block">2. Application Root &amp; Startup File</span>
              <p className="text-slate-500 mt-1">
                Application root: <code className="bg-white px-1 font-mono text-slate-800">janchemist</code><br />
                Application startup file: <code className="bg-white px-1 font-mono text-slate-800">server.ts</code> (or compiled <code className="bg-white px-1 font-mono text-slate-800">server.js</code>)
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-900 block">3. Run NPM Install &amp; Build</span>
              <p className="text-slate-500 mt-1">
                Click &quot;Run NPM Install&quot; in the cPanel UI, then use the terminal to run <code className="bg-white px-1 font-mono text-slate-800">npm run build</code>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* PLATFORM 4: LIVE DIAGNOSTICS */}
      {activePlatform === 'health' && (
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 font-extrabold flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-base">
                  Live Server &amp; API Diagnostics
                </h4>
                <p className="text-xs text-slate-500">
                  Real-time status of your running Express backend and data persistence:
                </p>
              </div>
            </div>

            <button
              onClick={fetchServerDiagnostics}
              disabled={isCheckingServer}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCheckingServer ? 'animate-spin' : ''}`} />
              <span>Refresh Status</span>
            </button>
          </div>

          {serverInfo ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                <span className="text-[11px] font-bold text-emerald-800 uppercase">Backend Server</span>
                <div className="text-lg font-black text-emerald-950 mt-1 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>ONLINE</span>
                </div>
                <p className="text-xs text-emerald-700 mt-1">Uptime: {serverInfo.uptimeMinutes} mins</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-600 uppercase">Node.js Engine</span>
                <div className="text-lg font-black text-slate-900 mt-1">{serverInfo.nodeVersion}</div>
                <p className="text-xs text-slate-500 mt-1">Platform: {serverInfo.platform}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-600 uppercase">Memory Footprint</span>
                <div className="text-lg font-black text-slate-900 mt-1">{serverInfo.memoryUsageMb} MB</div>
                <p className="text-xs text-slate-500 mt-1">Lightweight &amp; Fast</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-600 uppercase">Database &amp; Storage</span>
                <div className="text-lg font-black text-slate-900 mt-1">
                  {serverInfo.ordersCount} Orders
                </div>
                <p className="text-xs text-slate-500 mt-1">{serverInfo.prescriptionsCount} Rx Prescriptions</p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs">
              Loading server diagnostics...
            </div>
          )}

          {/* Endpoints Table */}
          <div className="space-y-2">
            <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
              Active Production API Endpoints
            </h5>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="py-2 px-3">Method</th>
                    <th className="py-2 px-3">Endpoint Route</th>
                    <th className="py-2 px-3">Purpose</th>
                    <th className="py-2 px-3">Audience</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  <tr>
                    <td className="py-2 px-3 text-emerald-600 font-bold">GET / POST</td>
                    <td className="py-2 px-3 font-semibold text-slate-900">/api/prescriptions</td>
                    <td className="py-2 px-3 font-sans text-slate-600">Customer Rx photo uploads &amp; Pharmacist review</td>
                    <td className="py-2 px-3 font-sans text-emerald-700 font-semibold">Customer + Admin</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-emerald-600 font-bold">GET / POST</td>
                    <td className="py-2 px-3 font-semibold text-slate-900">/api/orders</td>
                    <td className="py-2 px-3 font-sans text-slate-600">WhatsApp checkout sync &amp; order tracking log</td>
                    <td className="py-2 px-3 font-sans text-emerald-700 font-semibold">Customer + Admin</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-indigo-600 font-bold">POST</td>
                    <td className="py-2 px-3 font-semibold text-slate-900">/api/google-product-search</td>
                    <td className="py-2 px-3 font-sans text-slate-600">Live Gemini &amp; Google Search product specs enrichment</td>
                    <td className="py-2 px-3 font-sans text-purple-700 font-semibold">Admin Inventory Only</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-blue-600 font-bold">GET</td>
                    <td className="py-2 px-3 font-semibold text-slate-900">/api/image-proxy</td>
                    <td className="py-2 px-3 font-sans text-slate-600">Safe CORS &amp; hotlink bypass proxy for product photos</td>
                    <td className="py-2 px-3 font-sans text-slate-500">Public</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-emerald-600 font-bold">GET</td>
                    <td className="py-2 px-3 font-semibold text-slate-900">/api/health</td>
                    <td className="py-2 px-3 font-sans text-slate-600">Server heartbeat and uptime monitoring</td>
                    <td className="py-2 px-3 font-sans text-slate-500">Uptime monitors</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
