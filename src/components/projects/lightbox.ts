/** Gallery lightbox: arrows, Escape, counter, focus trap and focus return. */
export function initLightbox(): void {
  const gallery = document.querySelector<HTMLElement>('[data-gallery]');
  const box = document.querySelector<HTMLElement>('[data-lightbox]');
  const image = box?.querySelector<HTMLImageElement>('img');
  const counter = box?.querySelector<HTMLElement>('[data-counter]');
  if (!gallery || !box || !image || !counter) return;

  const openers = [...gallery.querySelectorAll<HTMLButtonElement>('button[data-src]')];
  const sources = openers.map((opener) => opener.dataset.src ?? '');
  const controls = [...box.querySelectorAll<HTMLButtonElement>('button')];
  const stepControls = controls.filter((control) => control.dataset.step !== undefined);
  const closeButton = box.querySelector<HTMLButtonElement>('[data-close]');
  const blank = 'data:,';
  let index = 0;
  let opener: HTMLElement | null = null;

  const show = (next: number): void => {
    index = (next + sources.length) % sources.length;
    image.src = sources[index] ?? blank;
    counter.textContent = `${index + 1} / ${sources.length}`;
  };

  const open = (from: HTMLButtonElement): void => {
    opener = from;
    for (const control of stepControls) control.hidden = sources.length < 2;
    show(Number(from.dataset.index ?? 0));
    box.hidden = false;
    closeButton?.focus();
  };

  const close = (): void => {
    box.hidden = true;
    image.src = blank;
    opener?.focus();
    opener = null;
  };

  /** Keep keyboard focus inside the modal while it is open. */
  const trapFocus = (press: KeyboardEvent): void => {
    const reachable = controls.filter((control) => !control.hidden);
    const first = reachable[0];
    const last = reachable[reachable.length - 1];
    if (!first || !last) return;
    if (press.shiftKey && document.activeElement === first) {
      press.preventDefault();
      last.focus();
    } else if (!press.shiftKey && document.activeElement === last) {
      press.preventDefault();
      first.focus();
    }
  };

  for (const from of openers) from.addEventListener('click', () => open(from));

  box.addEventListener('click', (click) => {
    const target = click.target;
    if (target === box) return close();
    if (!(target instanceof Element)) return;
    const control = target.closest<HTMLButtonElement>('button');
    if (!control) return;
    if (control.dataset.step !== undefined) show(index + Number(control.dataset.step));
    else if (control.dataset.close !== undefined) close();
  });

  document.addEventListener('keydown', (press) => {
    if (box.hidden) return;
    const many = sources.length > 1;
    switch (press.key) {
      case 'Escape':
        press.preventDefault();
        return close();
      case 'ArrowRight':
        if (many) show(index + 1);
        return;
      case 'ArrowLeft':
        if (many) show(index - 1);
        return;
      case 'Tab':
        return trapFocus(press);
    }
  });
}
