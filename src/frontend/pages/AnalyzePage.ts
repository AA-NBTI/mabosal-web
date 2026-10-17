import { PageModule, PageContext } from './types.js';
import { renderBirthInputView } from '../components/views.js';

export const AnalyzePage: PageModule = {
  id: 'analyze',
  render(ctx: PageContext): string {
    return renderBirthInputView(ctx.state);
  },
};
