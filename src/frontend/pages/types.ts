/**
 * Page Component Interface & Definition
 */

import { AppStateData } from '../state/app-state.js';

export interface PageContext {
  state: AppStateData;
  params: Record<string, string>;
  pathname: string;
}

export interface PageModule {
  id: string;
  render(ctx: PageContext): string;
  onMount?(container: HTMLElement, ctx: PageContext): void;
  onDestroy?(): void;
}
