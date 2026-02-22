import React from 'react';
import { Header, Icon, List, Message, Segment } from 'semantic-ui-react';
import { isError } from 'lodash';
import { rootPath, userDirectoryPath } from './store';

type ErrorProps = {
  error: Error | string;
};

type ErrorState = {
  appVersion: string;
  appPath: string;
  osName: string;
  storePath: string;
};

export class ErrorMessage extends React.Component<ErrorProps, ErrorState> {
  state: ErrorState = {
    appVersion: '',
    appPath: '',
    osName: '',
    storePath: '',
  };

  async componentDidMount() {
    const [appVersion, appPath, osName, storePath] = await Promise.all([
      window.trackingTool.getAppVersion(),
      window.trackingTool.getAppPath(),
      window.trackingTool.getOsName(),
      window.trackingTool.getStorePath(),
    ]);

    this.setState({ appVersion, appPath, osName, storePath });
  }

  render() {
    const { error } = this.props;
    const { appVersion, appPath, osName, storePath } = this.state;
    const message: string = isError(error) ? error.message : error;
    const { username } = window.trackingTool;

    return (
      <>
        <Message icon negative size="huge">
          <Icon name="exclamation triangle" />

          <Message.Content>
            <Message.Header as="h1">Tracking Tool encountered an error</Message.Header>

            <p>{message}</p>
          </Message.Content>
        </Message>

        <Segment size="huge">
          <Header>Debugging information</Header>

          <List>
            {isError(error) && (
              <List.Item>
                <strong>Stack:</strong> <pre style={{ whiteSpace: 'pre-wrap' }}>{error.stack}</pre>
              </List.Item>
            )}

            <List.Item>
              <strong>Version:</strong> <code>{appVersion}</code>
            </List.Item>

            <List.Item>
              <strong>Application path:</strong> <code>{appPath}</code>
            </List.Item>

            <List.Item>
              <strong>Username:</strong> <code>{username}</code>
            </List.Item>

            <List.Item>
              <strong>Root path:</strong> <code>{rootPath()}</code>
            </List.Item>

            <List.Item>
              <strong>User path:</strong> <code>{userDirectoryPath(username)}</code>
            </List.Item>

            <List.Item>
              <strong>Configuration path:</strong> <code>{storePath}</code>
            </List.Item>

            <List.Item>
              <strong>OS version:</strong> <code>{osName}</code>
            </List.Item>
          </List>
        </Segment>
      </>
    );
  }
}
