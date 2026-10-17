import { PageModule, PageContext } from './types.js';
import { renderResultView } from '../components/views.js';
import { renderSolutionHub } from '../extensions/solution-hub/index.js';

export const ResultPage: PageModule = {
  id: 'result',
  render(ctx: PageContext): string {
    return renderResultView(ctx.state) + renderSolutionHub(ctx.state);
  },
};
