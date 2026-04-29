// ============================================
// Cloudflare XHTTP Relay
// دقیقاً مشابه Netlify Relay برای Cloudflare Workers
// پشتیبانی کامل از XHTTP و VLESS
// ============================================

export default {
  async fetch(request, env, ctx) {
    // دریافت آدرس هدف از متغیر محیطی
    const TARGET_DOMAIN = env.TARGET_DOMAIN;
    
    // بررسی وجود متغیر محیطی
    if (!TARGET_DOMAIN) {
      return new Response(JSON.stringify({
        error: 'TARGET_DOMAIN environment variable is not set',
        message: 'لطفا متغیر محیطی TARGET_DOMAIN را تنظیم کنید',
        example: 'https://your-domain.com:443'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    try {
      // گرفتن مسیر درخواست
      const url = new URL(request.url);
      const targetUrl = new URL(TARGET_DOMAIN);
      
      // حفظ مسیر و کوئری استرینگ (مثل Netlify)
      targetUrl.pathname = url.pathname;
      targetUrl.search = url.search;
      
      // کپی کردن هدرها
      const headers = new Headers(request.headers);
      headers.set('Host', targetUrl.hostname);
      
      // حذف هدرهای مشکل‌دار
      headers.delete('cf-connecting-ip');
      headers.delete('cf-ray');
      headers.delete('cf-worker');
      
      // تنظیمات درخواست
      const fetchOptions = {
        method: request.method,
        headers: headers,
        redirect: 'follow'
      };
      
      // اضافه کردن body برای درخواست‌های غیر GET
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        fetchOptions.body = request.body;
      }
      
      // ارسال درخواست به سرور هدف
      const response = await fetch(targetUrl.toString(), fetchOptions);
      
      // کپی کردن هدرهای پاسخ
      const responseHeaders = new Headers(response.headers);
      
      // اضافه کردن هدرهای CORS برای پشتیبانی از XHTTP
      responseHeaders.set('Access-Control-Allow-Origin', '*');
      responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      responseHeaders.set('Access-Control-Max-Age', '86400');
      
      // پشتیبانی از WebSocket و XHTTP
      if (request.headers.get('upgrade') === 'websocket') {
        // برای WebSocket نیازی به تغییر نیست
        return response;
      }
      
      // برگرداندن پاسخ
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders
      });
      
    } catch (error) {
      // خطاهای مشابه Netlify
      return new Response(JSON.stringify({
        error: 'Relay Error',
        message: error.message,
        target: TARGET_DOMAIN,
        timestamp: new Date().toISOString()
      }), {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
};
