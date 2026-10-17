import { PageModule, PageContext } from './types.js';
import { renderConsultationView } from '../components/views.js';

export const ConsultPage: PageModule = {
  id: 'consult',
  render(ctx: PageContext): string {
    return renderConsultationView(ctx.state);
  },
  onMount(container: HTMLElement) {
    const scrollEl = container.querySelector('#chat-messages-box');
    if (scrollEl) {
      scrollEl.scrollTop = scrollEl.scrollHeight;
    }
  },
};
