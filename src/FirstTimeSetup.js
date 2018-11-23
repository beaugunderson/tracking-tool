// @flow

import './first-time-setup.css';
import React from 'react';
import { Button, Container, Header, Icon } from 'semantic-ui-react';
import { isEmpty } from 'lodash';
import { setRootPath } from './store';

const electron = window.require('electron');
const fs = electron.remote.require('fs');
const path = electron.remote.require('path');

const ROOT_DIRECTORY_FILE = 'tracking-tool-root.txt';

type FirstTimeSetupProps = {
  onComplete: () => void
};

export class FirstTimeSetup extends React.Component<FirstTimeSetupProps> {
  handleOnClick = () => {
    const selectedPaths = electron.remote.dialog.showOpenDialog({
      buttonLabel: 'Choose Directory',
      properties: ['openDirectory']
    });

    if (isEmpty(selectedPaths)) {
      return;
    }

    const [selectedPath] = selectedPaths;

    const rootFilePath = path.join(selectedPath, ROOT_DIRECTORY_FILE);

    if (fs.existsSync(rootFilePath)) {
      setRootPath(selectedPath);

      this.props.onComplete();
    }
  };

  render() {
    return (
      <Container text>
        <Header as="h1" content="First Time Setup" id="first-time-setup-header" />

        <Header
          as="h2"
          content="This is the first time you've run Tracking Tool on this computer. Please choose your team's data directory."
          id="first-time-setup-description"
        />

        <Button icon onClick={this.handleOnClick} primary size="huge">
          Choose Team Directory <Icon name="open folder" />
        </Button>
      </Container>
    );
  }
}
