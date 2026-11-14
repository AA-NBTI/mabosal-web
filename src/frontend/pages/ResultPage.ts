import { PageModule, PageContext } from './types.js';
import { renderResultView } from '../components/views.js';

export const ResultPage: PageModule = {
  id: 'result',
  render(ctx: PageContext): string {
    return renderResultView(ctx.state);
  },
};
