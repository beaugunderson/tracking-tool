import './GridReport.css';
import * as Moment from 'moment';
import React from 'react';
import { Button, Checkbox, CheckboxProps, Table } from 'semantic-ui-react';
import { extendMoment } from 'moment-range';
import { INTERNS } from '../usernames';
// import { maxBy, minBy } from 'lodash';
import { MONTHLY_REPORT_OPTIONS, ROW_TYPE } from '../options';
import { transform, TransformedEncounter } from './data';

const log = window.require('electron-log');

const moment = extendMoment(Moment);

function formatCount(count: number) {
  if (count === 0) {
    return <span className="count">{count}</span>;
  }

  return count;
}

interface GridReportProps {
  onComplete: (err?: Error) => void;
}

interface GridReportState {
  encounters: TransformedEncounter[] | null;
  loading: boolean;
  filterDocumentationTasks?: boolean;
}

export class GridReport extends React.Component<GridReportProps, GridReportState> {
  state: GridReportState = {
    encounters: null,
    loading: true,
    filterDocumentationTasks: false
  };

  changeIncludeDocumentation: (
    event: React.FormEvent<HTMLInputElement>,
    data: CheckboxProps
  ) => void = (event, data) => {
    this.setState({
      filterDocumentationTasks: data.checked
    });
  };

  async componentDidMount() {
    log.debug('GridReport componentDidMount');

    try {
      const encounters = await transform();

      log.debug(`GridReport componentDidMount: loaded ${encounters.length} encounters`);
      this.setState({ encounters, loading: false });
    } catch (e) {
      log.debug(`GridReport componentDidMount: error "${e}"`);
      this.props.onComplete(e);
    }
  }

  rowsForPermutation(
    clinic: string,
    location: string,
    types: ROW_TYPE[],
    months: Moment.Moment[]
  ) {
    log.debug(`rowsForPemutation: ${clinic}, ${location}, [${types.join(', ')}]`);

    const { encounters } = this.state;

    const interns = months.map(() => 0);
    const nonInterns = months.map(() => 0);
    const staff = months.map(() => 0);

    const field = this.state.filterDocumentationTasks
      ? 'parsedNumberOfTasksMinusDocumentation'
      : 'parsedNumberOfTasks';

    for (const encounter of encounters) {
      for (let i = 0; i < months.length; i++) {
        if (
          (encounter.encounterType === 'community' ||
            encounter.encounterType === 'patient' ||
            encounter.encounterType === 'staff') &&
          ((encounter.clinic === clinic && encounter.location === location) ||
            (encounter.encounterType === 'community' &&
              encounter.location === location &&
              clinic === 'Community')) &&
          encounter.encounterDate.slice(0, 7) === months[i].format('YYYY-MM')
        ) {
          if (encounter.encounterType === 'staff') {
            staff[i] += encounter[field];
          } else if (INTERNS.includes((encounter.username || '').toLowerCase())) {
            interns[i] += encounter[field];
          } else {
            nonInterns[i] += encounter[field];
          }
        }
      }
    }

    log.debug(`rowsForPemutation returning`);

    return (
      <React.Fragment key={`${location}-${clinic}`}>
        {types.includes(ROW_TYPE.OSW) && (
          <Table.Row key={`${location}-${clinic}-non-interns`}>
            <Table.Cell>{location}</Table.Cell>
            <Table.Cell>{clinic}</Table.Cell>
            <Table.Cell>OSW</Table.Cell>
            {nonInterns.map((count, i) => (
              <Table.Cell key={months[i].format('YYYY-MM')} textAlign="right">
                {formatCount(count)}
              </Table.Cell>
            ))}
          </Table.Row>
        )}

        {types.includes(ROW_TYPE.INTERNS) && (
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
        )}

        {types.includes(ROW_TYPE.STAFF_SUPPORT) && (
          <Table.Row key={`${location}-${clinic}-staff`}>
            <Table.Cell>{location}</Table.Cell>
            <Table.Cell>{clinic}</Table.Cell>
            <Table.Cell>Staff Support</Table.Cell>
            {staff.map((count, i) => (
              <Table.Cell key={months[i].format('YYYY-MM')} textAlign="right">
                {formatCount(count)}
              </Table.Cell>
            ))}
          </Table.Row>
        )}
      </React.Fragment>
    );
  }

  render() {
    const { encounters, loading } = this.state;

    if (loading) {
      return <h1>Loading encounters...</h1>;
    }

    const header = (
      <div>
        <Button onClick={() => this.props.onComplete()}>Back</Button>
        <Button onClick={() => window.print()}>Print</Button>
        &nbsp;&nbsp;&nbsp;
        <Checkbox label="Remove documentation tasks" onChange={this.changeIncludeDocumentation} />
      </div>
    );

    if (!encounters || encounters.length === 0) {
      return (
        <>
          {header}

          <h1>There are no encounters to display.</h1>
        </>
      );
    }

    log.debug(`GridComponent render: rendering ${encounters.length} encounters`);

    function monthStart(date: string) {
      return moment(date, 'YYYY-MM-DD').startOf('month');
    }

    // has issues with automatic calculation when people enter the wrong encounter date
    // const min = monthStart(minBy(encounters, 'encounterDate').encounterDate);
    // const max = monthStart(maxBy(encounters, 'encounterDate').encounterDate);

    const min = monthStart('2018-12-01');
    const max = monthStart(moment().format('YYYY-MM-DD'));

    const months = Array.from(moment.range(min, max).by('month'));

    log.debug(`GridComponent render: rendering ${months.length} months`);

    return (
      <>
        {header}

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
            {MONTHLY_REPORT_OPTIONS.map(([location, clinic, type]) =>
              this.rowsForPermutation(clinic, location, type, months)
            )}
          </Table.Body>
        </Table>
      </>
    );
  }
}
