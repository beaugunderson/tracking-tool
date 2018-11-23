import React from 'react';

import { Button, Header } from 'semantic-ui-react';

const electron = window.require('electron');
// const fs = electron.remote.require('fs');

function selectDirectory() {
  electron.remote.dialog.showOpenDialog({
    buttonLabel: 'Choose Directory',
    properties: ['openDirectory']
  });
}

// fs.readdir('.', (err, files) => {
//   console.log({ err, files });
// });

export class FirstTimeSetup extends React.Component<*> {
  render() {
    return (
      <React.Fragment>
        <Header as="h1" content="First Time Setup" />

        <p>
          This is the first time you&#39;ve run Tracking Tool on this computer. Please choose your
          team&#39;s data directory:
        </p>

        <Button content="Choose data directory" onClick={selectDirectory} size="big" />
      </React.Fragment>
    );
  }
}
