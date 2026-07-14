// Vanilla DOM Toast implementation - Zero Redux or toastSlice dependency!
const toast = {
  show: (message, type = 'info') => {
    // Find or create toast container
    let container = document.getElementById('vanilla-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'vanilla-toast-container';
      container.className = 'fixed top-6 right-6 z-100 flex flex-col gap-3 max-w-sm w-full pointer-events-none select-none';
      document.body.appendChild(container);
    }

    // Create individual toast element
    const el = document.createElement('div');
    el.className = `p-4 px-5 rounded-2xl border text-xs font-black shadow-lg transition-all duration-300 transform translate-x-12 opacity-0 pointer-events-auto flex items-center justify-between gap-3 ${
      type === 'success'
        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
        : type === 'error'
        ? 'bg-rose-500/10 border-rose-500/20 text-rose-500'
        : type === 'warning'
        ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
        : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500'
    }`;
    
    // Add text container
    const textSpan = document.createElement('span');
    textSpan.textContent = message;
    el.appendChild(textSpan);

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.className = 'ml-auto text-(--text-secondary) hover:text-(--text-primary) transition cursor-pointer select-none';
    closeBtn.onclick = () => {
      el.classList.add('opacity-0', 'translate-x-12');
      setTimeout(() => el.remove(), 300);
    };
    el.appendChild(closeBtn);

    container.appendChild(el);

    // Animate in
    requestAnimationFrame(() => {
      el.classList.remove('opacity-0', 'translate-x-12');
    });

    // Auto-remove after 3.5s
    setTimeout(() => {
      if (el.parentNode) {
        el.classList.add('opacity-0', 'translate-x-12');
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
