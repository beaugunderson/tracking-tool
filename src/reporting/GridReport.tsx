import * as Moment from 'moment';
import React from 'react';
import { CLINICS, LOCATIONS } from '../options';
import { extendMoment } from 'moment-range';
import { INTERNS } from '../usernames';
import { maxBy, minBy } from 'lodash';
import { Table, Button } from 'semantic-ui-react';
import { transform, TransformedPatientEncounter } from './data';

const moment = extendMoment(Moment);

interface GridReportProps {
  onComplete: () => void;
}

interface GridReportState {
  encounters: TransformedPatientEncounter[] | null;
}

export class GridReport extends React.Component<GridReportProps, GridReportState> {
  state: GridReportState = {
    encounters: null
  };

  async componentDidMount() {
    this.setState({ encounters: await transform() });
  }

  rowsForPermutation(clinic: string, location: string, months: Moment.Moment[]) {
    const { encounters } = this.state;

    const interns = months.map(() => 0);
    const nonInterns = months.map(() => 0);

    for (const encounter of encounters) {
      for (let i = 0; i < months.length; i++) {
        if (
          (encounter.encounterType === 'patient' || encounter.encounterType === 'community') &&
          ((encounter.clinic === clinic && encounter.location === location) ||
            (encounter.encounterType === 'community' &&
              encounter.location === location &&
              clinic === 'Community')) &&
          encounter.encounterDate.slice(0, 7) === months[i].format('YYYY-MM')
        ) {
          if (INTERNS.includes((encounter.username || '').toLowerCase())) {
            interns[i] += encounter.parsedNumberOfTasks;
          } else {
            nonInterns[i] += encounter.parsedNumberOfTasks;
          }
        }
      }
    }

    function formatCount(count: number) {
      if (count === 0) {
        return <span style={{ color: '#ccc' }}>{count}</span>;
      }

      return count;
    }

    return (
      <React.Fragment key={`${location}-${clinic}`}>
        {(nonInterns.some(count => count > 0) && (
          <Table.Row key={`${location}-${clinic}-non-interns`}>
            <Table.Cell>{location}</Table.Cell>
            <Table.Cell>{clinic}</Table.Cell>
            <Table.Cell>Non-Interns</Table.Cell>
            {nonInterns.map((count, i) => (
              <Table.Cell key={months[i].format('YYYY-MM')} textAlign="right">
                {formatCount(count)}
              </Table.Cell>
            ))}
          </Table.Row>
        )) ||
          null}

        {(interns.some(count => count > 0) && (
          <Table.Row key={`${location}-${clinic}-interns`}>
            <Table.Cell>{location}</Table.Cell>
            <Table.Cell>{clinic}</Table.Cell>
            <Table.Cell>Interns</Table.Cell>
            {interns.map((count, i) => (
              <Table.Cell key={months[i].format('YYYY-MM')} textAlign="right">
                {formatCount(count)}
              </Table.Cell>
            ))}
          </Table.Row>
        )) ||
          null}
      </React.Fragment>
    );
  }

  render() {
    const { encounters } = this.state;

    if (!encounters) {
      return null;
    }

    function monthStart(date: string) {
      return moment(date, 'YYYY-MM-DD').startOf('month');
    }

    const min = monthStart(minBy(encounters, 'encounterDate').encounterDate);
    const max = monthStart(maxBy(encounters, 'encounterDate').encounterDate);

    const months = Array.from(moment.range(min, max).by('month'));

    const permutations = [];

    for (const location of LOCATIONS) {
      for (const clinic of CLINICS.concat(['Community'])) {
        permutations.push([clinic, location]);
      }
    }

    return (
      <React.Fragment>
        <div>
          <Button onClick={() => this.props.onComplete()}>Back</Button>
        </div>

        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Location</Table.HeaderCell>
              <Table.HeaderCell>Clinic</Table.HeaderCell>
              <Table.HeaderCell>Staff</Table.HeaderCell>
              {months.map(month => (
                <Table.HeaderCell key={`${month.format('YYYY-MM')}`} textAlign="right">
                  {month.format('YYYY-MM')}
                </Table.HeaderCell>
              ))}
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {permutations.map(([clinic, location]) =>
              this.rowsForPermutation(clinic, location, months)
            )}
          </Table.Body>
        </Table>
      </React.Fragment>
    );
  }
}
