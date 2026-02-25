import React from 'react';
import { DATE_FORMAT_DISPLAY } from '../constants';
import { EXCLUDE_STRING_VALUE, ReportProgress, transform, TransformedEncounter } from './data';
import { Icon, Table } from 'semantic-ui-react';
import { PageLoader } from '../components/PageLoader';
import { sortBy } from 'lodash';
import { usernameToName } from '../usernames';

interface CrisisReportProps {}

interface CrisisReportState {
  encounters: TransformedEncounter[] | null;
  loadProgress?: ReportProgress | null;
  loadStartTime?: number;
}

export class CrisisReport extends React.Component<CrisisReportProps, CrisisReportState> {
  state: CrisisReportState = {
    encounters: null,
  };

  handleCopyClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    window.trackingTool.writeClipboard(e.currentTarget.dataset.text!);
  };

  async componentDidMount() {
    this.setState({ loadStartTime: Date.now() });
    const encounters = await transform(true, true, (loadProgress) =>
      this.setState({ loadProgress }),
    );
    this.setState({ encounters, loadProgress: null });
  }

  render() {
    const { encounters } = this.state;

    if (!encounters) {
      return (
        <PageLoader progress={this.state.loadProgress} startTime={this.state.loadStartTime} />
      );
    }

    const crisisEncounters = sortBy(
      encounters.filter((encounter) => {
        if (encounter.encounterType !== 'patient') {
          return false;
        }

        return (
          encounter.mandmMortalityAndMorbidity ||
          encounter.psychotherapy ||
          encounter.sciRxAssistance ||
          encounter.suicidehomicide
        );
      }),
      'parsedEncounterDate',
    ).reverse();

    function crises(encounter: TransformedEncounter) {
      const crisisNames = [];

      if (encounter.mandmMortalityAndMorbidity) {
        crisisNames.push('M&M');
      }

      if (encounter.psychotherapy) {
        crisisNames.push('Psychotherapy');
      }

      if (encounter.sciRxAssistance) {
        crisisNames.push('SCI RX Assistance');
      }

      if (encounter.suicidehomicide) {
        crisisNames.push('Suicide/homicide');
      }

      return crisisNames.join(', ');
    }

    return (
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
          {crisisEncounters.map((encounter, i) => (
            <Table.Row key={i}>
              <Table.Cell>{encounter.parsedEncounterDate.format(DATE_FORMAT_DISPLAY)}</Table.Cell>
              <Table.Cell>{usernameToName(encounter.username)}</Table.Cell>
              <Table.Cell>
                <button
                  className="button-link"
                  data-text={encounter.providenceMrn}
                  onClick={this.handleCopyClick}
                  type="button"
                >
                  {encounter.providenceMrn === EXCLUDE_STRING_VALUE ? '' : encounter.providenceMrn}{' '}
                  <Icon name="copy" />
                </button>
              </Table.Cell>
              <Table.Cell>
                <button
                  className="button-link"
                  data-text={encounter.mrn}
                  onClick={this.handleCopyClick}
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
    );
  }
}
