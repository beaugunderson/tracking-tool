import './CrisisReport.css';
import React from 'react';
import { Button, Icon, Table } from 'semantic-ui-react';
import { sortBy } from 'lodash';
import { transform, TransformedEncounter } from './data';
import { usernameToName } from '../usernames';

const { clipboard } = window.require('electron');

interface CrisisReportProps {
  onComplete: () => void;
}

interface CrisisReportState {
  encounters: TransformedEncounter[] | null;
}

export class CrisisReport extends React.Component<CrisisReportProps, CrisisReportState> {
  state: CrisisReportState = {
    encounters: null
  };

  async componentDidMount() {
    this.setState({ encounters: await transform() });
  }

  render() {
    const { encounters } = this.state;

    if (!encounters) {
      return null;
    }

    const crisisEncounters = sortBy(
      encounters.filter(encounter => {
        if (encounter.encounterType !== 'patient') {
          return false;
        }

        return encounter.mandmMortalityAndMorbidity || encounter.suicidehomicide;
      }),
      'parsedEncounterDate'
    ).reverse();

    function crises(encounter: TransformedEncounter) {
      const crisisNames = [];

      if (encounter.mandmMortalityAndMorbidity) {
        crisisNames.push('M&M');
      }

      if (encounter.suicidehomicide) {
        crisisNames.push('Suicide/homicide');
      }

      return crisisNames.join(', ');
    }

    return (
      <React.Fragment>
        <div>
          <Button onClick={() => this.props.onComplete()}>Back</Button>
        </div>

        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Date</Table.HeaderCell>
              <Table.HeaderCell>Social Worker</Table.HeaderCell>
              <Table.HeaderCell>MRN</Table.HeaderCell>
              <Table.HeaderCell>Crises</Table.HeaderCell>
              <Table.HeaderCell>Location</Table.HeaderCell>
              <Table.HeaderCell>Clinic</Table.HeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {crisisEncounters.map(encounter => (
              <Table.Row>
                <Table.Cell>{encounter.parsedEncounterDate.format('MM/DD/YYYY')}</Table.Cell>
                <Table.Cell>{usernameToName(encounter.username)}</Table.Cell>
                <Table.Cell>
                  <a onClick={() => clipboard.writeText(encounter.mrn)}>
                    {encounter.mrn} <Icon name="copy" />
                  </a>
                </Table.Cell>
                <Table.Cell>{crises(encounter)}</Table.Cell>
                <Table.Cell>{encounter.location}</Table.Cell>
                <Table.Cell>{encounter.clinic}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </React.Fragment>
    );
  }
}
