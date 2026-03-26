// VegaRAG Client Embed Widget
// Automatically injects a floating Chat UI into any host website via standard iframe to prevent CSS bleeding.

(function() {
  const scriptTag = document.currentScript;
  const botId = scriptTag.getAttribute('data-bot-id');
  if (!botId) {
    console.error('VegaRAG Widget Error: Missing data-bot-id attribute on the script tag.');
    return;
  }

  // Next.js URL (Hardcoded to localhost for dev, can be automated via process.env for prod)
  const HOST_URL = 'http://vegarag-alb-1907307840.us-east-1.elb.amazonaws.com';

  // 1. Create Floating Container
  const container = document.createElement('div');
  container.id = 'vegarag-widget-container';
  container.style.position = 'fixed';
  container.style.bottom = '20px';
  container.style.right = '20px';
  container.style.zIndex = '2147483647'; // Max z-index
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.alignItems = 'flex-end';
  
  // 2. Create the Iframe Sandbox
  const iframe = document.createElement('iframe');
  iframe.src = `${HOST_URL}/widget/${botId}`;
  // Mobile responsive dimensions
  iframe.style.width = window.innerWidth < 500 ? '90vw' : '400px';
  iframe.style.height = window.innerHeight < 700 ? '80vh' : '650px';
  iframe.style.border = 'none';
  iframe.style.borderRadius = '20px';
  iframe.style.boxShadow = '0 20px 50px rgba(0,0,0,0.15)';
  iframe.style.marginBottom = '15px';
  iframe.style.display = 'none';
  iframe.style.opacity = '0';
  iframe.style.transition = 'all 0.3s ease';
  iframe.style.backgroundColor = 'transparent';

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
})();
