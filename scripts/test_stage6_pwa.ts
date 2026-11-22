/**
 * Stage 6 & System Hardening Verification Test Suite
 * Tests PWA configuration, manifest validity, icon assets, service worker caching security rules,
 * direct application download package integrity, WebSocket error mitigation, and system logo placement.
 */

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function runTests() {
  console.log('--- STARTING STAGE 6 & PWA LOGO/DOWNLOAD VERIFICATION ---');
  let failures = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`[PASS] ${msg}`);
    } else {
      console.error(`[FAIL] ${msg}`);
      failures++;
    }
  }

  // 1. Verify Manifest JSON
  const manifestPath = path.resolve(process.cwd(), 'public/manifest.json');
  assert(fs.existsSync(manifestPath), 'public/manifest.json exists');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  assert(manifest.id === '/', `manifest.id is '/' (got ${manifest.id})`);
  assert(manifest.name === 'TuStudyHub — Learn • Share • Verify', `manifest.name is valid`);
  assert(manifest.short_name === 'TuStudyHub' && manifest.short_name.length <= 12, `manifest.short_name <= 12 chars`);
  assert(manifest.start_url === '/', `manifest.start_url is '/'`);
  assert(manifest.scope === '/', `manifest.scope is '/'`);
  assert(manifest.display === 'standalone', `manifest.display is 'standalone'`);
  assert(manifest.theme_color.toLowerCase() === '#8a3e12', `manifest.theme_color is #8A3E12`);
  assert(manifest.background_color.toLowerCase() === '#f7f5f1', `manifest.background_color is #F7F5F1`);

  // Verify manifest icons
  const icon192 = manifest.icons.find((i: any) => i.sizes === '192x192' && i.type === 'image/png');
  const icon512 = manifest.icons.find((i: any) => i.sizes === '512x512' && i.type === 'image/png' && i.purpose === 'any');
  const iconMaskable = manifest.icons.find((i: any) => i.purpose === 'maskable');

  assert(!!icon192, 'Manifest contains 192x192 PNG icon');
  assert(!!icon512, 'Manifest contains 512x512 standard PNG icon');
  assert(!!iconMaskable, 'Manifest contains dedicated maskable icon');

  // 2. Verify Generated PNG Icon Files
  const pwa192Path = path.resolve(process.cwd(), 'public/pwa-192x192.png');
  const pwa512Path = path.resolve(process.cwd(), 'public/pwa-512x512.png');
  const pwaMaskablePath = path.resolve(process.cwd(), 'public/pwa-maskable-512x512.png');
  const appleTouchPath = path.resolve(process.cwd(), 'public/apple-touch-icon.png');

  assert(fs.existsSync(pwa192Path), 'public/pwa-192x192.png exists on disk');
  const meta192 = await sharp(pwa192Path).metadata();
  assert(meta192.width === 192 && meta192.height === 192, 'pwa-192x192.png has exact 192x192 dimensions');

  assert(fs.existsSync(pwa512Path), 'public/pwa-512x512.png exists on disk');
  const meta512 = await sharp(pwa512Path).metadata();
  assert(meta512.width === 512 && meta512.height === 512, 'pwa-512x512.png has exact 512x512 dimensions');

  assert(fs.existsSync(pwaMaskablePath), 'public/pwa-maskable-512x512.png exists on disk');
  const metaMaskable = await sharp(pwaMaskablePath).metadata();
  assert(metaMaskable.width === 512 && metaMaskable.height === 512, 'pwa-maskable-512x512.png has exact 512x512 dimensions');

  assert(fs.existsSync(appleTouchPath), 'public/apple-touch-icon.png exists on disk');
  const metaApple = await sharp(appleTouchPath).metadata();
  assert(metaApple.width === 180 && metaApple.height === 180, 'apple-touch-icon.png is 180x180 PNG (required for iOS Safari)');

  // 3. Verify index.html PWA tags & WebSocket rejection handling
  const indexPath = path.resolve(process.cwd(), 'index.html');
  const indexHtml = fs.readFileSync(indexPath, 'utf8');
  assert(indexHtml.includes('<link rel="manifest" href="/manifest.json'), 'index.html includes manifest link');
  assert(indexHtml.includes('<meta name="theme-color" content="#8A3E12"'), 'index.html sets theme-color to #8A3E12');
  assert(indexHtml.includes('<meta name="apple-mobile-web-app-capable" content="yes"'), 'index.html enables apple-mobile-web-app-capable');
  assert(indexHtml.includes('<link rel="apple-touch-icon" href="/apple-touch-icon.png'), 'index.html uses PNG for apple-touch-icon (not SVG)');
  assert(indexHtml.includes('WebSocket'), 'index.html includes WebSocket unhandledrejection guard');

  // 4. Verify Service Worker Security & Caching Rules
  const swPath = path.resolve(process.cwd(), 'public/sw.js');
  const swContent = fs.readFileSync(swPath, 'utf8');
  assert(swContent.includes('/download'), 'sw.js checks for /download');
  assert(swContent.includes('/view'), 'sw.js checks for /view');
  assert(swContent.includes('/auth/'), 'sw.js checks for /auth/');

  // 5. Test Live HTTP Endpoints
  const resManifest = await fetch('http://localhost:3000/manifest.json?v=1.0.1');
  assert(resManifest.status === 200, `Live /manifest.json returns HTTP 200 (got ${resManifest.status})`);

  const resSw = await fetch('http://localhost:3000/sw.js');
  assert(resSw.status === 200, `Live /sw.js returns HTTP 200 (got ${resSw.status})`);

  const resIcon192 = await fetch('http://localhost:3000/pwa-192x192.png?v=1.0.1');
  assert(resIcon192.status === 200 && Boolean(resIcon192.headers.get('content-type')?.includes('image/png')), 'Live /pwa-192x192.png returns HTTP 200 image/png');

  const resAppleIcon = await fetch('http://localhost:3000/apple-touch-icon.png?v=1.0.1');
  assert(resAppleIcon.status === 200 && Boolean(resAppleIcon.headers.get('content-type')?.includes('image/png')), 'Live /apple-touch-icon.png returns HTTP 200 image/png');

  // 6. Test Application Package Download Endpoint
  const resAppDownload = await fetch('http://localhost:3000/api/v1/download/app');
  assert(resAppDownload.status === 200, `Live /api/v1/download/app returns HTTP 200 (got ${resAppDownload.status})`);
  assert(
    resAppDownload.headers.get('content-type')?.includes('application/zip') || false,
    'Live /api/v1/download/app returns application/zip'
  );
  assert(
    resAppDownload.headers.get('content-disposition')?.includes('TuStudyHub-Academic-PWA.zip') || false,
    'Live /api/v1/download/app specifies TuStudyHub-Academic-PWA.zip filename'
  );
  const appZipBuffer = Buffer.from(await resAppDownload.arrayBuffer());
  assert(appZipBuffer.length > 50000, `Application package zip size is verified (>50KB, actual: ${appZipBuffer.length} bytes)`);

  const resAppInfo = await fetch('http://localhost:3000/api/v1/download/info');
  assert(resAppInfo.status === 200, `Live /api/v1/download/info returns HTTP 200`);
  const appInfoData = await resAppInfo.json();
  assert(appInfoData.data?.status === 'VERIFIED_ACTIVE', 'Download package info status is VERIFIED_ACTIVE');

  // 7. Verify Official System Logo Components & System-Wide Placement
  const logoFile = fs.readFileSync(path.resolve(process.cwd(), 'src/components/common/AppLogo.tsx'), 'utf8');
  assert(logoFile.includes('AppLogoIcon') && logoFile.includes('TUSTUDYHUB'), 'AppLogo.tsx contains official vector geometry and text');

  const navbarFile = fs.readFileSync(path.resolve(process.cwd(), 'src/components/layout/Navbar.tsx'), 'utf8');
  assert(navbarFile.includes('<AppLogo'), 'Navbar.tsx renders official AppLogo');

  const authViewFile = fs.readFileSync(path.resolve(process.cwd(), 'src/components/auth/AuthView.tsx'), 'utf8');
  assert(authViewFile.includes('AppLogoIcon'), 'AuthView.tsx renders official AppLogoIcon');

  const authModalFile = fs.readFileSync(path.resolve(process.cwd(), 'src/components/auth/AuthModal.tsx'), 'utf8');
  assert(authModalFile.includes('<AppLogo'), 'AuthModal.tsx renders official AppLogo');

  const verifyViewFile = fs.readFileSync(path.resolve(process.cwd(), 'src/components/verification/VerificationView.tsx'), 'utf8');
  assert(verifyViewFile.includes('AppLogoIcon'), 'VerificationView.tsx renders official AppLogoIcon');

  const pwaBannerFile = fs.readFileSync(path.resolve(process.cwd(), 'src/components/pwa/PWAInstallBanner.tsx'), 'utf8');
  assert(pwaBannerFile.includes('AppLogoIcon'), 'PWAInstallBanner.tsx renders official AppLogoIcon');
  assert(pwaBannerFile.includes('/api/v1/download/app'), 'PWAInstallBanner.tsx includes direct downloadable app link');

  const pwaModalFile = fs.readFileSync(path.resolve(process.cwd(), 'src/components/pwa/PWAInstallModal.tsx'), 'utf8');
  assert(pwaModalFile.includes('AppLogoIcon'), 'PWAInstallModal.tsx renders official AppLogoIcon');
  assert(pwaModalFile.includes('/api/v1/download/app'), 'PWAInstallModal.tsx includes direct downloadable app link');

  // 8. Verify Vite Config HMR Disabled
  const viteConfigFile = fs.readFileSync(path.resolve(process.cwd(), 'vite.config.ts'), 'utf8');
  assert(viteConfigFile.includes('hmr: false'), 'vite.config.ts sets hmr: false');

  console.log(`\n--- ALL VERIFICATIONS COMPLETE: ${failures === 0 ? 'ALL PASS (0 ERRORS)' : failures + ' FAILED'} ---`);
  if (failures > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
