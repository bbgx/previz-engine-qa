import { type Page, type Locator } from '@playwright/test';

export class NavigationPage {
  readonly logoLink: Locator;
  readonly studioLink: Locator;
  readonly stockFootageLink: Locator;
  readonly historyLink: Locator;
  readonly navLinks: Locator[];
  readonly studioHeading: Locator;
  readonly stockFootageHeading: Locator;
  readonly historyHeading: Locator;
  readonly notFoundHeading: Locator;
  readonly notFoundMessage: Locator;

  constructor(private page: Page) {
    this.logoLink = page.getByRole('link', { name: /Pre-Viz Engine/ });
    this.studioLink = page.getByRole('link', { name: 'Studio' });
    this.stockFootageLink = page.getByRole('link', { name: 'Stock Footage' });
    this.historyLink = page.getByRole('link', { name: 'History' });
    this.navLinks = [this.studioLink, this.stockFootageLink, this.historyLink];
    this.studioHeading = page.getByRole('heading', { name: 'Create Your Scene', level: 2 });
    this.stockFootageHeading = page.getByRole('heading', { name: 'Stock Footage Generator', level: 2 });
    this.historyHeading = page.getByRole('heading', { name: 'Video History', level: 2 });
    this.notFoundHeading = page.getByRole('heading', { name: '404' });
    this.notFoundMessage = page.getByRole('heading', { name: 'This page could not be found.' });
  }

  async goToStudio() {
    await this.studioLink.click();
  }

  async goToStockFootage() {
    await this.stockFootageLink.click();
  }

  async goToHistory() {
    await this.historyLink.click();
  }

  async goHome() {
    await this.logoLink.click();
  }
}
