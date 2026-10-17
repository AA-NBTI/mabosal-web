import { PageModule, PageContext } from './types.js';
import { renderCalendarCategoryPage } from '../views/pages/CalendarCategoryPage.js';

export const CalendarPage: PageModule = {
  id: 'calendar',
  render(ctx: PageContext): string {
    return renderCalendarCategoryPage(ctx.state);
  },
};
