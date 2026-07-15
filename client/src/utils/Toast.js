// Vanilla DOM Toast implementation - Zero Redux or toastSlice dependency!
const toast = {
  show: (message, type = 'info') => {
    // Find or create toast container
    let container = document.getElementById('vanilla-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'vanilla-toast-container';
      container.className = 'fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none select-none';
      document.body.appendChild(container);
    }

    // Create individual toast element
    const el = document.createElement('div');
    el.className = `p-4 px-5 rounded-2xl border text-xs font-black shadow-2xl transition-all duration-300 transform translate-y-6 opacity-0 pointer-events-auto flex items-center gap-3 backdrop-blur-md ${
      type === 'success'
        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
        : type === 'error'
        ? 'bg-rose-500/10 border-rose-500/20 text-rose-500'
        : type === 'warning'
        ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
        : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500'
    }`;
    
    // Add matching icon
    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'flex items-center justify-center shrink-0';
    if (type === 'success') {
      iconWrapper.innerHTML = `
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      `;
    } else if (type === 'error') {
      iconWrapper.innerHTML = `
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      `;
    } else if (type === 'warning') {
      iconWrapper.innerHTML = `
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      `;
    } else {
      iconWrapper.innerHTML = `
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
      `;
    }
    el.appendChild(iconWrapper);

    // Add text container
    const textSpan = document.createElement('span');
    textSpan.className = 'flex-1 pr-2 leading-tight';
    textSpan.textContent = message;
    el.appendChild(textSpan);

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.className = 'ml-auto text-xs text-(--text-secondary) hover:text-(--text-primary) opacity-65 hover:opacity-100 transition duration-150 cursor-pointer select-none font-bold p-1 rounded-md';
    closeBtn.onclick = () => {
      el.classList.add('opacity-0', 'translate-y-6', 'scale-95');
      setTimeout(() => el.remove(), 300);
    };
    el.appendChild(closeBtn);

    container.appendChild(el);

    // Animate in from bottom
    requestAnimationFrame(() => {
      el.classList.remove('opacity-0', 'translate-y-6');
    });

    // Auto-remove after 3.5s
    setTimeout(() => {
      if (el.parentNode) {
        el.classList.add('opacity-0', 'translate-y-6', 'scale-95');
        setTimeout(() => el.remove(), 300);
      }
    }, 3500);
  },
  success: (msg) => toast.show(msg, 'success'),
  error: (msg) => toast.show(msg, 'error'),
  warning: (msg) => toast.show(msg, 'warning'),
  info: (msg) => toast.show(msg, 'info')
};

export default toast;
