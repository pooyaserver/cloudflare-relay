// Cloudflare Worker Relay - مخصوص Cloudflare Workers

export default {
  async fetch(request, env, ctx) {
    const TARGET_DOMAIN = env.TARGET_DOMAIN;
    
    if (!TARGET_DOMAIN) {
      return new Response('Error: TARGET_DOMAIN environment variable is not set', { 
        status: 500 
      });
    }
    
    try {
      const url = new URL(request.url);
      const targetUrl = new URL(TARGET_DOMAIN);
      targetUrl.pathname = url.pathname;
      targetUrl.search = url.search;
      
      const headers = new Headers(request.headers);
      headers.set('Host', targetUrl.hostname);
      
      const response = await fetch(targetUrl.toString(), {
        method: request.method,
        headers: headers,
        body: request.body,
        redirect: 'follow'
      });
      
      const responseHeaders = new Headers(response.headers);
      responseHeaders.set('Access-Control-Allow-Origin', '*');
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders
      });
      
    } catch (error) {
      return new Response(`Error: ${error.message}`, { status: 502 });
    }
  }
};
