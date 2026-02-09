/**
 * Meta/Facebook OAuth Configuration Checker
 * Helps diagnose domain and redirect URI issues
 */

require('dotenv').config();

console.log('═══════════════════════════════════════════════════');
console.log('  META/FACEBOOK OAUTH CONFIGURATION CHECK');
console.log('═══════════════════════════════════════════════════\n');

// Check environment variables
console.log('📋 Environment Variables:\n');

const requiredVars = [
    'META_APP_ID',
    'META_APP_SECRET',
    'META_REDIRECT_URI',
    'CLIENT_URL',
    'NODE_ENV'
];

let allPresent = true;

requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
        // Mask sensitive values
        const displayValue = varName.includes('SECRET') 
            ? value.substring(0, 10) + '...' 
            : value;
        console.log(`✅ ${varName}: ${displayValue}`);
    } else {
        console.log(`❌ ${varName}: NOT SET`);
        allPresent = false;
    }
});

console.log('');

if (!allPresent) {
    console.log('⚠️  WARNING: Some required environment variables are missing!\n');
}

// Extract domain information
console.log('🌐 Domain Information:\n');

const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const redirectUri = process.env.META_REDIRECT_URI || 'http://localhost:5000/api/meta/callback';

try {
    const clientDomain = new URL(clientUrl);
    const redirectDomain = new URL(redirectUri);

    console.log(`Client Domain: ${clientDomain.hostname}`);
    console.log(`Client Protocol: ${clientDomain.protocol}`);
    console.log(`Client Port: ${clientDomain.port || 'default'}`);
    console.log('');
    console.log(`Redirect Domain: ${redirectDomain.hostname}`);
    console.log(`Redirect Protocol: ${redirectDomain.protocol}`);
    console.log(`Redirect Port: ${redirectDomain.port || 'default'}`);
    console.log('');
} catch (error) {
    console.log('❌ Error parsing URLs:', error.message);
    console.log('');
}

// Provide configuration instructions
console.log('═══════════════════════════════════════════════════');
console.log('  FACEBOOK APP CONFIGURATION REQUIRED');
console.log('═══════════════════════════════════════════════════\n');

console.log('📝 Add these to Facebook App Settings:\n');

console.log('1. App Domains (Settings → Basic):');
console.log('   ─────────────────────────────────');
try {
    const clientDomain = new URL(clientUrl);
    const redirectDomain = new URL(redirectUri);
    
    const domains = new Set();
    domains.add(clientDomain.hostname);
    domains.add(redirectDomain.hostname);
    
    domains.forEach(domain => {
        console.log(`   ${domain}`);
    });
} catch (error) {
    console.log('   localhost');
    console.log('   127.0.0.1');
}
console.log('');

console.log('2. Valid OAuth Redirect URIs (Facebook Login → Settings):');
console.log('   ──────────────────────────────────────────────────────');
console.log(`   ${redirectUri}`);
console.log(`   ${clientUrl}/auth/callback`);
console.log(`   ${clientUrl}/sso/callback`);
console.log('');

console.log('3. Site URL (Settings → Basic → Add Platform → Website):');
console.log('   ──────────────────────────────────────────────────────');
console.log(`   ${clientUrl}`);
console.log('');

// Security recommendations
console.log('═══════════════════════════════════════════════════');
console.log('  SECURITY RECOMMENDATIONS');
console.log('═══════════════════════════════════════════════════\n');

const isProduction = process.env.NODE_ENV === 'production';
const isHttps = clientUrl.startsWith('https://');

if (isProduction && !isHttps) {
    console.log('⚠️  WARNING: Production environment should use HTTPS!');
    console.log('   Current CLIENT_URL: ' + clientUrl);
    console.log('   Recommended: https://your-domain.com\n');
}

if (!isProduction && isHttps) {
    console.log('ℹ️  INFO: Using HTTPS in development');
    console.log('   Make sure you have valid SSL certificates\n');
}

console.log('✅ Security Checklist:');
console.log('   [ ] Use HTTPS in production');
console.log('   [ ] Enable "Use Strict Mode for Redirect URIs"');
console.log('   [ ] Add only necessary redirect URIs');
console.log('   [ ] Keep META_APP_SECRET secure');
console.log('   [ ] Rotate secrets regularly');
console.log('');

// Testing instructions
console.log('═══════════════════════════════════════════════════');
console.log('  TESTING INSTRUCTIONS');
console.log('═══════════════════════════════════════════════════\n');

console.log('1. Update Facebook App Settings:');
console.log('   → https://developers.facebook.com/apps/\n');

console.log('2. Wait 5-10 minutes for changes to propagate\n');

console.log('3. Test OAuth flow:');
console.log(`   → Visit: ${clientUrl}`);
console.log('   → Click "Login with Facebook"');
console.log('   → Should redirect to Facebook');
console.log('   → After login, should redirect back\n');

console.log('4. Check for errors:');
console.log('   → Open browser console (F12)');
console.log('   → Look for any error messages');
console.log('   → Check network tab for failed requests\n');

// Quick links
console.log('═══════════════════════════════════════════════════');
console.log('  USEFUL LINKS');
console.log('═══════════════════════════════════════════════════\n');

console.log('Facebook Developers Console:');
console.log('→ https://developers.facebook.com/apps/\n');

console.log('Facebook Login Documentation:');
console.log('→ https://developers.facebook.com/docs/facebook-login/\n');

console.log('OAuth Redirect URI Documentation:');
console.log('→ https://developers.facebook.com/docs/facebook-login/security/#redirect\n');

console.log('═══════════════════════════════════════════════════\n');

// Summary
if (allPresent) {
    console.log('✅ All environment variables are set!');
    console.log('📝 Next: Configure Facebook App with the domains above');
} else {
    console.log('❌ Missing environment variables!');
    console.log('📝 Next: Update your .env file with required values');
}

console.log('');
console.log('For detailed instructions, see: META_OAUTH_DOMAIN_SETUP.md');
console.log('');
