import { PageModule, PageContext } from './types.js';
import { renderStudyView } from '../extensions/study-hub/index.js';

export const StudyPage: PageModule = {
  id: 'study',
  render(_ctx: PageContext): string {
    return renderStudyView();
  },
};
