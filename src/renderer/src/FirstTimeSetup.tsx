import './first-time-setup.css';
import React from 'react';
import { Button, Container, Header, Icon } from 'semantic-ui-react';
import { DEFAULT_PATHS, ensureUserDirectoryExists, setRootPath, userDirectoryPath } from './store';
import { ErrorMessage } from './ErrorMessage';

const ROOT_DIRECTORY_FILE = 'tracking-tool-root.txt';

type FirstTimeSetupProps = {
  onComplete: () => void;
};

type FirstTimeSetupState = {
  error?: string;
  defaultPathExists: boolean | null;
};

export class FirstTimeSetup extends React.Component<FirstTimeSetupProps, FirstTimeSetupState> {
  state: FirstTimeSetupState = {
    defaultPathExists: null,
  };

  async componentDidMount() {
    for (const defaultPath of DEFAULT_PATHS) {
      // eslint-disable-next-line no-await-in-loop
      if (await window.trackingTool.fsExists(defaultPath)) {
        this.setState({ defaultPathExists: true });
        return;
      }
    }
    this.setState({ defaultPathExists: false });
  }

  firstPathThatExists = async (): Promise<string | null> => {
    for (const defaultPath of DEFAULT_PATHS) {
      // eslint-disable-next-line no-await-in-loop
      if (await window.trackingTool.fsExists(defaultPath)) {
        return defaultPath;
      }
    }
    return null;
  };

  handleChooseClick = async () => {
    const dialogResult = await window.trackingTool.showOpenDialog({
      buttonLabel: 'Choose Directory',
      properties: ['openDirectory'],
    });

    if (dialogResult.canceled || !dialogResult.filePaths.length) {
      return;
    }

    const [selectedPath] = dialogResult.filePaths;
    const rootFilePath = selectedPath + window.trackingTool.pathSep + ROOT_DIRECTORY_FILE;

    if (await window.trackingTool.fsExists(rootFilePath)) {
      await setRootPath(selectedPath);
      this.props.onComplete();
    }
  };

  handleDefaultClick = async () => {
    const defaultPath = await this.firstPathThatExists();
    await setRootPath(defaultPath);

    try {
      await ensureUserDirectoryExists(window.trackingTool.username);
    } catch {
      return this.setState({
        error: `Unable to create directory "${userDirectoryPath(window.trackingTool.username)}"`,
      });
    }

    this.props.onComplete();
  };

  render() {
    const { defaultPathExists } = this.state;

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

        {defaultPathExists && (
          <Button
            className="icon-margin"
            icon
            onClick={this.handleDefaultClick}
            primary
            size="huge"
          >
            Use Default Directory
          </Button>
        )}

        <Button
          className="icon-margin"
          icon
          onClick={this.handleChooseClick}
          secondary
          size="huge"
        >
          Choose a Directory <Icon name="folder open" />
        </Button>
      </Container>
    );
  }
}
