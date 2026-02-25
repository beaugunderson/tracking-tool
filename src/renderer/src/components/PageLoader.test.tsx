import { PageLoader } from './PageLoader';
import { render, screen } from '@testing-library/react';
import type { ReportProgress } from '../reporting/data';

describe('PageLoader', () => {
  it('renders loading text with no progress', () => {
    render(<PageLoader />);
    expect(screen.getByText('Loading encounters...')).toBeInTheDocument();
  });

  it('renders status lines when provided', () => {
    render(<PageLoader status={['Opening database', 'Running migrations']} />);
    expect(screen.getByText('Opening database')).toBeInTheDocument();
    expect(screen.getByText('Running migrations')).toBeInTheDocument();
  });

  it('renders indeterminate loader when no progress', () => {
    const { container } = render(<PageLoader />);
    const loader = container.querySelector('.ui.loader');
    expect(loader).toHaveClass('indeterminate');
  });

  it('renders determinate loader when progress is provided', () => {
    const progress: ReportProgress = { phase: 'Copying data', current: 3, total: 10 };
    const { container } = render(<PageLoader progress={progress} />);
    const loader = container.querySelector('.ui.loader');
    expect(loader).not.toHaveClass('indeterminate');
  });

  it('displays the current phase', () => {
    const progress: ReportProgress = { phase: 'Copying data for beau', current: 1, total: 5 };
    render(<PageLoader progress={progress} />);
    expect(screen.getByText('Copying data for beau')).toBeInTheDocument();
  });

  it('displays current / total count', () => {
    const progress: ReportProgress = { phase: 'Loading encounters', current: 3, total: 10 };
    render(<PageLoader progress={progress} />);
    expect(screen.getByText(/3 \/ 10/)).toBeInTheDocument();
  });

  it('renders a progress bar with correct percentage', () => {
    const progress: ReportProgress = { phase: 'Loading', current: 1, total: 4 };
    const { container } = render(<PageLoader progress={progress} />);
    const bar = container.querySelector('.ui.progress');
    expect(bar).toBeInTheDocument();
    expect(bar).toHaveAttribute('data-percent', '25');
  });

  it('does not render progress bar when total is 0', () => {
    const progress: ReportProgress = { phase: 'Loading fixes', current: 0, total: 0 };
    const { container } = render(<PageLoader progress={progress} />);
    const bar = container.querySelector('.ui.progress');
    expect(bar).not.toBeInTheDocument();
  });

  it('does not render count when total is 0', () => {
    const progress: ReportProgress = { phase: 'Processing encounters', current: 0, total: 0 };
    render(<PageLoader progress={progress} />);
    expect(screen.queryByText(/\//)).not.toBeInTheDocument();
  });

  it('displays ETA when startTime and progress are provided', () => {
    const progress: ReportProgress = { phase: 'Copying', current: 5, total: 10 };
    // startTime 10 seconds ago → 10s elapsed for 5 items → 2s/item → 10s remaining
    const startTime = Date.now() - 10_000;
    render(<PageLoader progress={progress} startTime={startTime} />);
    expect(screen.getByText(/remaining/)).toBeInTheDocument();
  });

  it('does not display ETA when progress is complete', () => {
    const progress: ReportProgress = { phase: 'Done', current: 10, total: 10 };
    const startTime = Date.now() - 20_000;
    render(<PageLoader progress={progress} startTime={startTime} />);
    expect(screen.queryByText(/remaining/)).not.toBeInTheDocument();
  });

  it('does not display ETA without startTime', () => {
    const progress: ReportProgress = { phase: 'Copying', current: 3, total: 10 };
    render(<PageLoader progress={progress} />);
    expect(screen.queryByText(/remaining/)).not.toBeInTheDocument();
  });

  it('formats ETA in minutes when over 60 seconds', () => {
    const progress: ReportProgress = { phase: 'Copying', current: 1, total: 10 };
    // 20s elapsed for 1 item → 20s/item → 180s remaining → should show minutes
    const startTime = Date.now() - 20_000;
    render(<PageLoader progress={progress} startTime={startTime} />);
    expect(screen.getByText(/\d+m \d+s remaining/)).toBeInTheDocument();
  });

  it('formats ETA in seconds when under 60 seconds', () => {
    const progress: ReportProgress = { phase: 'Copying', current: 5, total: 10 };
    // 5s elapsed for 5 items → 1s/item → 5s remaining
    const startTime = Date.now() - 5_000;
    render(<PageLoader progress={progress} startTime={startTime} />);
    expect(screen.getByText(/~\d+s remaining/)).toBeInTheDocument();
  });

  it('does not crash with null progress', () => {
    render(<PageLoader progress={null} />);
    expect(screen.getByText('Loading encounters...')).toBeInTheDocument();
  });
});
