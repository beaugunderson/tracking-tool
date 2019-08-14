import './CrisisReport.css';
import React from 'react';
import { Button, Icon, Table } from 'semantic-ui-react';
import { DATE_FORMAT_DISPLAY } from '../constants';
import { EXCLUDE_STRING_VALUE, transform, TransformedEncounter } from './data';
import { sortBy } from 'lodash';
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
      <>
        <div>
          <Button onClick={() => this.props.onComplete()}>Back</Button>
        </div>

        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Date</Table.HeaderCell>
              <Table.HeaderCell>Social Worker</Table.HeaderCell>
              <Table.HeaderCell>Providence MRN</Table.HeaderCell>
              <Table.HeaderCell>MRN</Table.HeaderCell>
              <Table.HeaderCell>Crises</Table.HeaderCell>
              <Table.HeaderCell>Location</Table.HeaderCell>
              <Table.HeaderCell>Clinic</Table.HeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {crisisEncounters.map(encounter => (
              <Table.Row>
                <Table.Cell>
                  {encounter.parsedEncounterDate.format(DATE_FORMAT_DISPLAY)}
                </Table.Cell>
                <Table.Cell>{usernameToName(encounter.username)}</Table.Cell>
                <Table.Cell>
                  <button
                    className="button-link"
                    onClick={() => clipboard.writeText(encounter.providenceMrn)}
                    type="button"
                  >
                    {encounter.providenceMrn === EXCLUDE_STRING_VALUE
                      ? ''
                      : encounter.providenceMrn}{' '}
                    <Icon name="copy" />
                  </button>
                </Table.Cell>
                <Table.Cell>
                  <button
                    className="button-link"
                    onClick={() => clipboard.writeText(encounter.mrn)}
                    type="button"
                  >
                    {encounter.mrn === EXCLUDE_STRING_VALUE ? '' : encounter.mrn}{' '}
                    <Icon name="copy" />
                  </button>
                </Table.Cell>
                <Table.Cell>{crises(encounter)}</Table.Cell>
                <Table.Cell>{encounter.location}</Table.Cell>
                <Table.Cell>{encounter.clinic}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </>
    );
  }
}
