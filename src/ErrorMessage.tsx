import React from 'react';
import { Header, Icon, List, Message, Segment } from 'semantic-ui-react';
import { rootPath, store, userDirectoryPath } from './store';
import { isError } from 'lodash';

declare global {
  interface Window {
    require: any;
  }
}

const electron = window.require('electron');
const osName = window.require('os-name');
const username = window.require('username');

const { app } = electron.remote;

type ErrorProps = {
  error: Error | string;
};

export class ErrorMessage extends React.Component<ErrorProps> {
  render() {
    const { error } = this.props;
    const message: string = isError(error) ? error.message : error;

    return (
      <React.Fragment>
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
            <List.Item>
              <strong>Version:</strong> <code>{app.getVersion()}</code>
            </List.Item>

            <List.Item>
              <strong>Application path:</strong> <code>{app.getAppPath()}</code>
            </List.Item>

            <List.Item>
              <strong>Username:</strong> <code>{username.sync()}</code>
            </List.Item>

            <List.Item>
              <strong>Root path:</strong> <code>{rootPath()}</code>
            </List.Item>

            <List.Item>
              <strong>User path:</strong> <code>{userDirectoryPath()}</code>
            </List.Item>

            <List.Item>
              <strong>Configuration path:</strong> <code>{store.path}</code>
            </List.Item>

            <List.Item>
              <strong>OS version:</strong> <code>{osName()}</code>
            </List.Item>
          </List>
        </Segment>
      </React.Fragment>
    );
  }
}
