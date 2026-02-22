import './choose-user-form.css';
import React from 'react';
import { Button, Container, Header, Icon } from 'semantic-ui-react';
import { ErrorMessage } from './ErrorMessage';
import { last } from 'lodash';
import { rootPath } from './store';

type ChooseUserFormProps = {
  onComplete: (path: string) => void;
};

type ChooseUserFormState = {
  error?: string;
};

export class ChooseUserForm extends React.Component<ChooseUserFormProps, ChooseUserFormState> {
  state: ChooseUserFormState = {};

  handleChooseClick = async () => {
    const dialogResult = await window.trackingTool.showOpenDialog({
      buttonLabel: 'Choose Directory',
      defaultPath: rootPath(),
      properties: ['openDirectory'],
    });

    if (dialogResult.canceled || !dialogResult.filePaths.length) {
      return;
    }

    const [selectedPath] = dialogResult.filePaths;

    if (await window.trackingTool.fsExists(selectedPath)) {
      const username: string = last(selectedPath.split(window.trackingTool.pathSep));

      this.props.onComplete(username);
    }
  };

  render() {
    if (this.state.error) {
      return <ErrorMessage error={this.state.error} />;
    }

    return (
      <Container text>
        <Header as="h1" content="Choose a User" id="choose-user-header" />

        <Header
          as="h2"
          content="Choose a user's data directory to open."
          id="choose-user-description"
        />

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
