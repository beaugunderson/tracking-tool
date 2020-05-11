import React from 'react';
import { Dimmer, Loader, Segment } from 'semantic-ui-react';

type PageLoaderProps = {
  status?: string[];
};

export class PageLoader extends React.Component<PageLoaderProps> {
  render() {
    const { status } = this.props;

    return (
      <Segment className="encounters-loader" placeholder>
        <Dimmer active inverted>
          <Loader indeterminate inverted size="large">
            Loading encounters...
            {status && status.map((line) => <div>{line}</div>)}
          </Loader>
        </Dimmer>
      </Segment>
    );
  }
}
