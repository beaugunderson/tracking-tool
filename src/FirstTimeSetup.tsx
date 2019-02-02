import './first-time-setup.css';
import React from 'react';
import { Button, Container, Header, Icon } from 'semantic-ui-react';
import { DEFAULT_PATHS, ensureUserDirectoryExists, setRootPath, userDirectoryPath } from './store';
import { ErrorMessage } from './ErrorMessage';
import { isEmpty } from 'lodash';

const electron = window.require('electron');
const fs = electron.remote.require('fs');
const path = electron.remote.require('path');

const ROOT_DIRECTORY_FILE = 'tracking-tool-root.txt';

function firstPathThatExists() {
  for (const defaultPath of DEFAULT_PATHS) {
    if (fs.existsSync(defaultPath)) {
      return defaultPath;
    }
  }
}

type FirstTimeSetupProps = {
  onComplete: () => void;
};

type FirstTimeSetupState = {
  error: string | undefined;
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
    setRootPath(firstPathThatExists());

    try {
      ensureUserDirectoryExists();
    } catch (error) {
      return this.setState({ error: `Unable to create directory "${userDirectoryPath()}"` });
    }

    this.props.onComplete();
  };

  render() {
    const pathExists = firstPathThatExists();

    if (this.state.error) {
      return <ErrorMessage error={this.state.error} />;
    }

    return (
      <Container text>
        <Header as="h1" content="First Time Setup" id="first-time-setup-header" />

        <Header
          as="h2"
          content="This is the first time you've run Tracking Tool on this computer. Please choose your team's data directory."
          id="first-time-setup-description"
        />

        {pathExists && (
          <Button icon onClick={this.handleDefaultClick} primary size="huge">
            Use Default Directory
          </Button>
        )}

        <Button icon onClick={this.handleChooseClick} secondary size="huge">
          Choose a Directory <Icon name="folder open" />
        </Button>
      </Container>
    );
  }
}
