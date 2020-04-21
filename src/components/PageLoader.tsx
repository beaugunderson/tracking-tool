import React from 'react';
import { Dimmer, Loader, Segment } from 'semantic-ui-react';

export class PageLoader extends React.Component {
  render() {
    return (
      <Segment className="encounters-loader" placeholder>
        <Dimmer active inverted>
          <Loader indeterminate inverted size="large">
            Loading encounters...
          </Loader>
        </Dimmer>
      </Segment>
    );
  }
}
