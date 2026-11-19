import './GridReport.css';
import React from 'react';
import { Button, Checkbox, CheckboxProps, Table } from 'semantic-ui-react';
import { eachMonthOfInterval, format, parse, startOfMonth } from 'date-fns';
import { isIntern } from '../usernames';
import { MONTHLY_REPORT_OPTIONS, ROW_TYPE } from '../options';
import { monthlyCounts } from './monthly-counts';
import { PageLoader } from '../components/PageLoader';
import { type ReportProgress, type TransformedEncounter } from '../../../shared/transform';
import { transform } from './load-encounters';

const log = { debug: (...args: unknown[]) => window.trackingTool.logDebug(...args) };

const OVERFLOW_AUTO_STYLE: React.CSSProperties = { overflowX: 'auto' };

function formatCount(count: number) {
  if (count === 0) {
    return <span className="count">{count}</span>;
  }

  return count;
}

interface GridReportProps {}

interface GridReportState {
  encounters: TransformedEncounter[] | null;
  excludeDocumentationOnly?: boolean;
  loadError?: string | null;
  loadProgress?: ReportProgress | null;
  loadStartTime?: number;
}

export class GridReport extends React.Component<GridReportProps, GridReportState> {
  state: GridReportState = {
    encounters: null,
    excludeDocumentationOnly: false,
  };

  handlePrint = () => window.print();

  changeExcludeDocumentationOnly: (
    event: React.FormEvent<HTMLInputElement>,
    data: CheckboxProps,
  ) => void = (event, data) => {
    this.setState({
      excludeDocumentationOnly: data.checked,
    });
  };

  async componentDidMount() {
    log.debug('GridReport: loading');
    this.setState({ loadStartTime: Date.now() });
    try {
      const encounters = await transform(true, true, (loadProgress) =>
        this.setState({ loadProgress }),
      );
      log.debug(`GridReport: loaded ${encounters.length} encounters`);
      this.setState({ encounters, loadProgress: null });
    } catch (err) {
      this.setState({ loadError: err instanceof Error ? err.message : String(err) });
    }
  }

  rowsForPermutation(
    clinic: string,
    location: string,
    types: readonly ROW_TYPE[],
    months: Date[],
  ) {
    log.debug(`rowsForPemutation: ${clinic}, ${location}, [${types.join(', ')}]`);

    const { encounters, excludeDocumentationOnly } = this.state;

    const { interns, nonInterns, staff } = monthlyCounts(
      encounters,
      clinic,
      location,
      months.map((month) => format(month, 'yyyy-MM')),
      !!excludeDocumentationOnly,
      isIntern,
    );

    log.debug(`rowsForPemutation returning`);

    return (
      <React.Fragment key={`${location}-${clinic}`}>
        {types.includes(ROW_TYPE.OSW) && (
          <Table.Row key={`${location}-${clinic}-non-interns`}>
            <Table.Cell>{location}</Table.Cell>
            <Table.Cell>{clinic}</Table.Cell>
            <Table.Cell>OSW</Table.Cell>
            {nonInterns.map((count, i) => (
              <Table.Cell key={format(months[i], 'yyyy-MM')} textAlign="right">
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
              <Table.Cell key={format(months[i], 'yyyy-MM')} textAlign="right">
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
              <Table.Cell key={format(months[i], 'yyyy-MM')} textAlign="right">
                {formatCount(count)}
              </Table.Cell>
            ))}
          </Table.Row>
        )}
      </React.Fragment>
    );
  }

  render() {
    const { encounters } = this.state;

    if (!encounters) {
      return (
        <PageLoader
          error={this.state.loadError}
          progress={this.state.loadProgress}
          startTime={this.state.loadStartTime}
        />
      );
    }

    const header = (
      <div>
        <Button onClick={this.handlePrint}>Print</Button>
        &nbsp;&nbsp;&nbsp;
        <Checkbox
          label="Exclude documentation-only encounters"
          onChange={this.changeExcludeDocumentationOnly}
        />
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
      return startOfMonth(parse(date, 'yyyy-MM-dd', new Date()));
    }

    const min = monthStart('2018-12-01');
    const max = monthStart(format(new Date(), 'yyyy-MM-dd'));

    const months = eachMonthOfInterval({ start: min, end: max });

    // show newest month first
    months.reverse();

    log.debug(`GridComponent render: rendering ${months.length} months`);

    return (
      <>
        {header}

        <div style={OVERFLOW_AUTO_STYLE}>
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Location</Table.HeaderCell>
                <Table.HeaderCell>Clinic</Table.HeaderCell>
                <Table.HeaderCell>Staff</Table.HeaderCell>
                {months.map((month) => (
                  <Table.HeaderCell key={format(month, 'yyyy-MM')} textAlign="right">
                    {format(month, 'yyyy-MM')}
                  </Table.HeaderCell>
                ))}
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {MONTHLY_REPORT_OPTIONS.map(([location, clinic, types]) =>
                this.rowsForPermutation(clinic, location, types, months),
              )}
            </Table.Body>
          </Table>
        </div>
      </>
    );
  }
}
