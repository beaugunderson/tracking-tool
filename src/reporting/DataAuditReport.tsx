import Moment from 'moment';
import React from 'react';
import { Button, Icon, Table } from 'semantic-ui-react';
import { ENCOUNTER_TYPE_NAMES } from '../options';
import { EXCLUDE_STRING_VALUE, transform, TransformedEncounter } from './data';
import { sortBy } from 'lodash';
import { usernameToName } from '../usernames';

const { clipboard } = window.require('electron');

interface DataAuditReportProps {
  onComplete: () => void;
}

interface DataAuditReportState {
  encounters: TransformedEncounter[] | null;
}

export class DataAuditReport extends React.Component<DataAuditReportProps, DataAuditReportState> {
  state: DataAuditReportState = {
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

    const start = Moment('2018-11-01');
    const now = Moment();

    function abnormalDate(encounter: TransformedEncounter) {
      return (
        encounter.parsedEncounterDate.isAfter(now) || encounter.parsedEncounterDate.isBefore(start)
      );
    }

    function abnormalInterventions(encounter: TransformedEncounter) {
      return encounter.numberOfInterventions === 0;
    }

    function abnormalNumberOfTasks(encounter: TransformedEncounter) {
      return encounter.parsedNumberOfTasks >= 10;
    }

    function abnormalTimeSpent(encounter: TransformedEncounter) {
      return encounter.timeSpentHours > 200 / 60;
    }

    const abnormalEncounters = sortBy(
      encounters.filter(encounter => {
        if (encounter.encounterType !== 'patient' && encounter.encounterType !== 'other') {
          return false;
        }

        return (
          abnormalDate(encounter) ||
          abnormalInterventions(encounter) ||
          abnormalNumberOfTasks(encounter) ||
          abnormalTimeSpent(encounter)
        );
      }),
      'parsedEncounterDate'
    ).reverse();

    return (
      <>
        <div>
          <Button onClick={() => this.props.onComplete()}>Back</Button>
        </div>

        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Type</Table.HeaderCell>
              <Table.HeaderCell>Social Worker</Table.HeaderCell>
              <Table.HeaderCell>Date</Table.HeaderCell>
              <Table.HeaderCell>Providence MRN</Table.HeaderCell>
              <Table.HeaderCell>MRN</Table.HeaderCell>
              <Table.HeaderCell>Location</Table.HeaderCell>
              <Table.HeaderCell>Clinic</Table.HeaderCell>
              <Table.HeaderCell>Interventions</Table.HeaderCell>
              <Table.HeaderCell>Tasks</Table.HeaderCell>
              <Table.HeaderCell>Time Spent</Table.HeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {abnormalEncounters.map(encounter => (
              <Table.Row>
                <Table.Cell>{ENCOUNTER_TYPE_NAMES[encounter.encounterType]}</Table.Cell>
                <Table.Cell>{usernameToName(encounter.username)}</Table.Cell>
                <Table.Cell negative={abnormalDate(encounter)}>
                  {encounter.parsedEncounterDate.format('MM/DD/YYYY')}
                </Table.Cell>
                <Table.Cell>
                  {encounter.encounterType === 'patient' && (
                    <a onClick={() => clipboard.writeText(encounter.providenceMrn)}>
                      {encounter.providenceMrn === EXCLUDE_STRING_VALUE
                        ? ''
                        : encounter.providenceMrn}{' '}
                      <Icon name="copy" />
                    </a>
                  )}
                </Table.Cell>
                <Table.Cell>
                  {encounter.encounterType === 'patient' && (
                    <a onClick={() => clipboard.writeText(encounter.mrn)}>
                      {encounter.mrn === EXCLUDE_STRING_VALUE ? '' : encounter.mrn}{' '}
                      <Icon name="copy" />
                    </a>
                  )}
                </Table.Cell>
                <Table.Cell>{encounter.location}</Table.Cell>
                <Table.Cell>{encounter.clinic}</Table.Cell>
                <Table.Cell negative={abnormalInterventions(encounter)}>
                  {encounter.encounterType === 'patient' && encounter.numberOfInterventions}
                </Table.Cell>
                <Table.Cell negative={abnormalNumberOfTasks(encounter)}>
                  {encounter.numberOfTasks}
                </Table.Cell>
                <Table.Cell negative={abnormalTimeSpent(encounter)}>
                  {encounter.timeSpent}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </>
    );
  }
}
