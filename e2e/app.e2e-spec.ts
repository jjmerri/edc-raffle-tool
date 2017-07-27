import { EdcRaffleToolPage } from './app.po';

describe('edc-raffle-tool App', function() {
  let page: EdcRaffleToolPage;

  beforeEach(() => {
    page = new EdcRaffleToolPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
