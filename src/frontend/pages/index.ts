export * from './types.js';
export * from './HomePage.js';
export * from './SajuPage.js';
export * from './FortunePage.js';
export * from './CareerPage.js';
export * from './WealthPage.js';
export * from './LovePage.js';
export * from './CalendarPage.js';
export * from './StorePage.js';
export * from './StudyPage.js';
export * from './AdminPage.js';
export * from './MemberDashboardPage.js';
export * from './CartPage.js';
export * from './CheckoutPage.js';
export * from './AnalyzePage.js';
export * from './ResultPage.js';
export * from './ConsultPage.js';

import { PageModule } from './types.js';
import { HomePage } from './HomePage.js';
import { SajuPage } from './SajuPage.js';
import { FortunePage } from './FortunePage.js';
import { CareerPage } from './CareerPage.js';
import { WealthPage } from './WealthPage.js';
import { LovePage } from './LovePage.js';
import { CalendarPage } from './CalendarPage.js';
import { StorePage } from './StorePage.js';
import { StudyPage } from './StudyPage.js';
import { AdminPage } from './AdminPage.js';
import { MemberDashboardPage } from './MemberDashboardPage.js';
import { CartPage } from './CartPage.js';
import { CheckoutPage } from './CheckoutPage.js';
import { AnalyzePage } from './AnalyzePage.js';
import { ResultPage } from './ResultPage.js';
import { ConsultPage } from './ConsultPage.js';

export const PAGE_REGISTRY: Record<string, PageModule> = {
  '/': HomePage,
  '/saju': SajuPage,
  '/fortune': FortunePage,
  '/career': CareerPage,
  '/wealth': WealthPage,
  '/love': LovePage,
  '/calendar': CalendarPage,
  '/store': StorePage,
  '/study': StudyPage,
  '/admin': AdminPage,
  '/member-dashboard': MemberDashboardPage,
  '/mypage': MemberDashboardPage,
  '/cart': CartPage,
  '/checkout': CheckoutPage,
  '/analyze': AnalyzePage,
  '/result': ResultPage,
  '/report': ResultPage,
  '/consult': ConsultPage,
};

export function getPageByPathname(pathname: string): PageModule {
  const cleanPath = pathname.replace(/\/+$/, '') || '/';
  return PAGE_REGISTRY[cleanPath] || HomePage;
}
