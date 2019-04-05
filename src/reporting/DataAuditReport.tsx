import Moment from 'moment';
import React from 'react';
import { Button, Icon, Table } from 'semantic-ui-react';
import { sortBy } from 'lodash';
import { transform, TransformedEncounter } from './data';
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
      return encounter.parsedNumberOfTasks >= 5;
    }

    function abnormalTimeSpent(encounter: TransformedEncounter) {
      return encounter.timeSpentHours >= 1.25;
    }

    const abnormalEncounters = sortBy(
      encounters.filter(encounter => {
        if (encounter.encounterType !== 'patient') {
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
      <React.Fragment>
        <div>
          <Button onClick={() => this.props.onComplete()}>Back</Button>
        </div>

        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Social Worker</Table.HeaderCell>
              <Table.HeaderCell>Date</Table.HeaderCell>
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
                <Table.Cell>{usernameToName(encounter.username)}</Table.Cell>
                <Table.Cell negative={abnormalDate(encounter)}>
                  {encounter.parsedEncounterDate.format('MM/DD/YYYY')}
                </Table.Cell>
                <Table.Cell>
                  <a onClick={() => clipboard.writeText(encounter.mrn)}>
                    {encounter.mrn} <Icon name="copy" />
                  </a>
                </Table.Cell>
                <Table.Cell>{encounter.location}</Table.Cell>
                <Table.Cell>{encounter.clinic}</Table.Cell>
                <Table.Cell negative={abnormalInterventions(encounter)}>
                  {encounter.numberOfInterventions}
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
      </React.Fragment>
    );
  }
}
