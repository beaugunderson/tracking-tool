import { Dimmer, Loader, Message, Progress, Segment } from 'semantic-ui-react';
import type { ReportProgress } from '../reporting/data';

type PageLoaderProps = {
  error?: string | null;
  progress?: ReportProgress | null;
  startTime?: number;
  status?: string[];
};

function formatEta(seconds: number): string {
  if (seconds < 60) return `~${Math.ceil(seconds)}s remaining`;
  const minutes = Math.floor(seconds / 60);
  const secs = Math.ceil(seconds % 60);
  return `~${minutes}m ${secs}s remaining`;
}

export function PageLoader({ error, progress, startTime, status }: PageLoaderProps) {
  if (error) {
    return (
      <Segment placeholder>
        <Message negative>
          <Message.Header>Error loading report</Message.Header>
          <p>{error}</p>
        </Message>
      </Segment>
    );
  }

  let eta: string | undefined;
  if (progress && startTime && progress.total > 0 && progress.current > 0) {
    const elapsed = (Date.now() - startTime) / 1000;
    const perItem = elapsed / progress.current;
    const remaining = perItem * (progress.total - progress.current);
    if (remaining > 0) {
      eta = formatEta(remaining);
    }
  }

  const percent =
    progress && progress.total > 0
      ? Math.round((progress.current / progress.total) * 100)
      : undefined;

  return (
    <Segment className="encounters-loader" placeholder>
      <Dimmer active inverted>
        <Loader indeterminate={!progress} inverted size="large">
          Loading encounters...
          {status && status.map((line, i) => <div key={i}>{line}</div>)}
          {progress && (
            <div style={{ marginTop: 12, minWidth: 300 }}>
              <div>{progress.phase}</div>
              {percent !== undefined && (
                <Progress
                  percent={percent}
                  size="small"
                  indicating
                  style={{ marginTop: 8, marginBottom: 4 }}
                />
              )}
              {progress.total > 0 && (
                <div style={{ fontSize: '0.85em', opacity: 0.8 }}>
                  {progress.current} / {progress.total}
                  {eta && <span> &mdash; {eta}</span>}
                </div>
              )}
            </div>
          )}
        </Loader>
      </Dimmer>
    </Segment>
  );
}
