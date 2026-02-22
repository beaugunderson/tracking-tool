import { Dimmer, Loader, Segment } from 'semantic-ui-react';

type PageLoaderProps = {
  status?: string[];
};

export function PageLoader({ status }: PageLoaderProps) {
  return (
    <Segment className="encounters-loader" placeholder>
      <Dimmer active inverted>
        <Loader indeterminate inverted size="large">
          Loading encounters...
          {status && status.map((line, i) => <div key={i}>{line}</div>)}
        </Loader>
      </Dimmer>
    </Segment>
  );
}
