// VegaRAG Client Embed Widget
// Automatically injects a Chat UI into any host website via standard iframe to prevent CSS bleeding.

(function() {
  const scriptTag = document.currentScript || document.getElementById('vegarag-widget-script');
  if (!scriptTag) return;
  
  const botId = scriptTag.getAttribute('data-bot-id');
  const mode = scriptTag.getAttribute('data-mode') || 'customer-service';
  
  if (!botId) {
    console.error('VegaRAG Widget Error: Missing data-bot-id attribute on the script tag.');
    return;
  }

  // Automatically infer the HOST URL based on exactly where this script was loaded from!
  // This solves localhost vs ALB production environments magically.
  const scriptUrl = new URL(scriptTag.src);
  const HOST_URL = scriptUrl.origin;

  // 1. Create Base Container
  const container = document.createElement('div');
  container.id = 'vegarag-widget-container';
  container.style.position = 'fixed';
  container.style.zIndex = '2147483647'; // Max z-index
  
  // 2. Create the Iframe Sandbox
  const iframe = document.createElement('iframe');
  // Pass the mode to the URL if the backend Next.js needs it to render differently,
  // or just use standard /widget/ path
  iframe.src = `${HOST_URL}/widget/${botId}?mode=${mode}`;
  iframe.style.border = 'none';
  iframe.style.backgroundColor = 'transparent';
  iframe.style.transition = 'all 0.3s ease';

  if (mode === 'immersive-chat') {
      // FULL SCREEN CANVAS OVERRIDE
      container.style.top = '0';
      container.style.left = '0';
      container.style.width = '100vw';
      container.style.height = '100vh';
      container.style.backgroundColor = '#f8fafc'; // solid backdrop
      
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.display = 'block';
      iframe.style.opacity = '1';
      
      container.appendChild(iframe);
      document.body.appendChild(container);
      
      // Optionally hide scrollbars on the host website if we go full immersive
      document.body.style.overflow = 'hidden';
      
  } else {
      // STANDARD CUSTOMER SERVICE BUBBLE
      container.style.bottom = '20px';
      container.style.right = '20px';
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.alignItems = 'flex-end';
      
      // Mobile responsive dimensions
      iframe.style.width = window.innerWidth < 500 ? '90vw' : '400px';
      iframe.style.height = window.innerHeight < 700 ? '80vh' : '650px';
      iframe.style.borderRadius = '20px';
      iframe.style.boxShadow = '0 20px 50px rgba(0,0,0,0.15)';
      iframe.style.marginBottom = '15px';
      iframe.style.display = 'none';
      iframe.style.opacity = '0';

      // 3. Create the Floating Toggle Button
      const button = document.createElement('button');
      button.innerHTML = `
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      `;
      button.style.width = '64px';
      button.style.height = '64px';
      button.style.borderRadius = '32px';
      button.style.backgroundColor = '#2563eb'; // Tailwind blue-600
      button.style.color = 'white';
      button.style.border = 'none';
      button.style.cursor = 'pointer';
      button.style.boxShadow = '0 10px 25px rgba(37,99,235,0.4)';
      button.style.display = 'flex';
      button.style.alignItems = 'center';
      button.style.justifyContent = 'center';
      button.style.transition = 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

      // 4. State Management & Animations
      let isOpen = false;
      button.addEventListener('click', () => {
        isOpen = !isOpen;
        if (isOpen) {
          iframe.style.display = 'block';
          setTimeout(() => iframe.style.opacity = '1', 10);
          button.innerHTML = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
        } else {
          iframe.style.opacity = '0';
          setTimeout(() => iframe.style.display = 'none', 300);
          button.innerHTML = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
        }
      });

      // Micro-interactions
      button.addEventListener('mouseenter', () => button.style.transform = 'scale(1.08)');
      button.addEventListener('mouseleave', () => button.style.transform = 'scale(1)');

      container.appendChild(iframe);
      container.appendChild(button);
      document.body.appendChild(container);
  }

})();
