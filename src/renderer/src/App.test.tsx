import { act, fireEvent, render, screen } from '@testing-library/react';
import { App } from './App';
import { vi } from 'vitest';

// Helper: render App, wait for async componentDidMount
async function renderApp() {
  let result: ReturnType<typeof render>;

  await act(async () => {
    result = render(<App />);
  });

  return result!;
}

// Helper: configure mocks for a given scenario before rendering
function setupMocks(options: { rootPath?: string; username?: string } = {}) {
  const { rootPath = '', username = 'testuser' } = options;

  Object.defineProperty(window.trackingTool, 'username', { value: username, writable: true });

  vi.mocked(window.trackingTool.configGet).mockResolvedValue(rootPath);
  vi.mocked(window.trackingTool.fsExists).mockResolvedValue(false);
  vi.mocked(window.trackingTool.dbSearch).mockResolvedValue([]);
  vi.mocked(window.trackingTool.dbFindAll).mockResolvedValue([]);
  vi.mocked(window.trackingTool.dbOpen).mockResolvedValue(undefined);
  vi.mocked(window.trackingTool.fsMkdir).mockResolvedValue(undefined);
  vi.mocked(window.trackingTool.fsCopyFile).mockResolvedValue(undefined);
}

beforeEach(() => {
  vi.clearAllMocks();
  window.scroll = vi.fn() as unknown as typeof window.scroll;
});

describe('App page navigation', () => {
  describe('initial page selection', () => {
    it('shows FirstTimeSetup when no root path configured', async () => {
      setupMocks({ rootPath: '' });

      const { container } = await renderApp();

      expect(container.querySelector('#first-time-setup-header')).toBeInTheDocument();
      expect(screen.getByText('First Time Setup')).toBeInTheDocument();
    });

    it('shows ChooseUser for admin users', async () => {
      setupMocks({ rootPath: '/some/path', username: 'beau' });

      const { container } = await renderApp();

      expect(container.querySelector('#choose-user-header')).toBeInTheDocument();
      expect(screen.getByText('Choose a User')).toBeInTheDocument();
    });

    it('shows encounters list for regular users', async () => {
      setupMocks({ rootPath: '/some/path', username: 'testuser' });

      const { container } = await renderApp();

      expect(container.querySelector('#encounter-table')).toBeInTheDocument();
      expect(container.querySelector('#encounter-date-input')).toBeInTheDocument();
    });
  });

  describe('encounters list content', () => {
    it('shows assessment stats', async () => {
      setupMocks({ rootPath: '/some/path', username: 'testuser' });

      await renderApp();

      expect(screen.getByText(/PHQ assessments/)).toBeInTheDocument();
      expect(screen.getByText(/GAD assessments/)).toBeInTheDocument();
      expect(screen.getByText(/MoCA assessments/)).toBeInTheDocument();
      expect(screen.getByText('Intervention Techniques')).toBeInTheDocument();
    });
  });

  describe('navigating to encounter forms', () => {
    let container: HTMLElement;

    beforeEach(async () => {
      setupMocks({ rootPath: '/some/path', username: 'testuser' });
      ({ container } = await renderApp());
    });

    function clickNavButton(label: string) {
      const navButtons = container.querySelectorAll('.navigation-button');
      const button = Array.from(navButtons).find((el) => el.textContent?.includes(label));

      if (!button) {
        throw new Error(`Navigation button "${label}" not found`);
      }

      fireEvent.click(button);
    }

    it('navigating to Patient form', () => {
      clickNavButton('Patient');
      expect(screen.getByText('New Patient Encounter')).toBeInTheDocument();
    });

    it('navigating to Community form', () => {
      clickNavButton('Community');
      expect(screen.getByText('New Community Encounter')).toBeInTheDocument();
    });

    it('navigating to Staff form', () => {
      clickNavButton('Staff');
      expect(screen.getByText('New Staff Encounter')).toBeInTheDocument();
    });

    it('navigating to Other form', () => {
      clickNavButton('Other');
      expect(screen.getByText('New Other Encounter')).toBeInTheDocument();
    });
  });

  describe('report navigation', () => {
    it('clicking Reports shows sub-navigation with Interactive Report', async () => {
      setupMocks({ rootPath: '/some/path', username: 'testuser' });

      const { container } = await renderApp();

      const navButtons = container.querySelectorAll('.navigation-button');
      const reportsButton = Array.from(navButtons).find((el) =>
        el.textContent?.includes('Reports'),
      );

      fireEvent.click(reportsButton!);

      const reportNav = container.querySelector('#report-navigation');
      expect(reportNav).toBeInTheDocument();
      expect(screen.getByText('Interactive Report')).toBeInTheDocument();
    });

    it('admin sees all report links', async () => {
      // 'johnss1' can see reporting but doesn't get ChooseUser page
      setupMocks({ rootPath: '/some/path', username: 'johnss1' });

      const { container } = await renderApp();

      const navButtons = container.querySelectorAll('.navigation-button');
      const reportsButton = Array.from(navButtons).find((el) =>
        el.textContent?.includes('Reports'),
      );

      fireEvent.click(reportsButton!);

      expect(screen.getByText('Interactive Report')).toBeInTheDocument();
      expect(screen.getByText('Intervention Report')).toBeInTheDocument();
      expect(screen.getByText('Monthly Report')).toBeInTheDocument();
    });

    it('audit-report admin sees Data Audit and Link MRN report links', async () => {
      setupMocks({ rootPath: '/some/path', username: 'lindce2' });

      const { container } = await renderApp();

      // lindce2 gets ChooseUser page
      expect(container.querySelector('#choose-user-header')).toBeInTheDocument();
    });

    it('non-admin does not see restricted reports', async () => {
      // 'testuser' is not in canSeeReporting or canSeeAuditReport
      setupMocks({ rootPath: '/some/path', username: 'testuser' });

      const { container } = await renderApp();

      const navButtons = container.querySelectorAll('.navigation-button');
      const reportsButton = Array.from(navButtons).find((el) =>
        el.textContent?.includes('Reports'),
      );

      fireEvent.click(reportsButton!);

      const reportNav = container.querySelector('#report-navigation');
      expect(reportNav).toBeInTheDocument();
      expect(screen.getByText('Interactive Report')).toBeInTheDocument();
      expect(screen.queryByText('Data Audit Report')).not.toBeInTheDocument();
      expect(screen.queryByText('Link MRN Report')).not.toBeInTheDocument();
      expect(screen.queryByText('Intervention Report')).not.toBeInTheDocument();
      expect(screen.queryByText('Monthly Report')).not.toBeInTheDocument();
    });
  });
});
