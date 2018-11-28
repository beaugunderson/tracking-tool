// @flow

import './first-time-setup.css';
import React from 'react';
import { Button, Container, Header, Icon } from 'semantic-ui-react';
import { Error } from './Error';
import { isEmpty } from 'lodash';
import { DEFAULT_PATH, ensureUserDirectoryExists, setRootPath, userDirectoryPath } from './store';

const electron = window.require('electron');
const fs = electron.remote.require('fs');
const path = electron.remote.require('path');

const ROOT_DIRECTORY_FILE = 'tracking-tool-root.txt';

type FirstTimeSetupProps = {
  onComplete: () => void
};

type FirstTimeSetupState = {
  error: ?string
};

export class FirstTimeSetup extends React.Component<FirstTimeSetupProps, FirstTimeSetupState> {
  state = {
    error: null
  };

  handleChooseClick = () => {
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

  handleDefaultClick = () => {
    setRootPath(DEFAULT_PATH);

    try {
      ensureUserDirectoryExists();
    } catch (error) {
      return this.setState({ error: `Unable to create directory "${userDirectoryPath()}"` });
    }

    this.props.onComplete();
  };

  render() {
    const defaultExists = fs.existsSync(DEFAULT_PATH);

    if (this.state.error) {
      return <Error error={this.state.error} />;
    }

    return (
      <Container text>
        <Header as="h1" content="First Time Setup" id="first-time-setup-header" />

        <Header
          as="h2"
          content="This is the first time you've run Tracking Tool on this computer. Please choose your team's data directory."
          id="first-time-setup-description"
        />

        {defaultExists && (
          <Button icon onClick={this.handleDefaultClick} primary size="huge">
            Use Default Directory
          </Button>
        )}

        <Button icon onClick={this.handleChooseClick} secondary size="huge">
          Choose a Directory <Icon name="open folder" />
        </Button>
      </Container>
    );
  }
}
