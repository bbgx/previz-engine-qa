import { test as base } from '@playwright/test';
import { NavigationPage, StudioPage, StockFootagePage, HistoryPage } from './pages';

type Fixtures = {
  nav: NavigationPage;
  studioPage: StudioPage;
  stockFootagePage: StockFootagePage;
  historyPage: HistoryPage;
};

export const test = base.extend<Fixtures>({
  nav: async ({ page }, use) => {
    await use(new NavigationPage(page));
  },
  studioPage: async ({ page }, use) => {
    const studio = new StudioPage(page);
    await use(studio);
  },
  stockFootagePage: async ({ page }, use) => {
    const stockFootage = new StockFootagePage(page);
    await use(stockFootage);
  },
  historyPage: async ({ page }, use) => {
    const history = new HistoryPage(page);
    await use(history);
  },
});

export { expect } from '@playwright/test';
