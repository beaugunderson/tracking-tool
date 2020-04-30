import './GridReport.css';
import moment from 'moment';
import React from 'react';
import {
  arraySimilarity,
  metaphones,
  obfuscateDate,
  obfuscateNumber,
  obfuscateString,
} from '../utilities';
import { Button, Checkbox, Input, Radio, Table } from 'semantic-ui-react';
import { copyFixFile, EXCLUDE_STRING_VALUE, transform, TransformedEncounter } from './data';
import { DATE_FORMAT_DISPLAY } from '../constants';
import { each, sortBy } from 'lodash';
import { ensureFixesDirectoryExists } from '../store';
import { ErrorMessage } from '../ErrorMessage';
import { Fix, getFixes, openFixes } from '../data';
import { PageLoader } from '../components/PageLoader';
import { usernameToName } from '../usernames';

function needsMatching(encounters: TransformedEncounter[]) {
  if (encounters.length < 2) {
    return false;
  }

  const providenceMrns = new Set();
  const swedishMrns = new Set();

  const matches = [];

  for (const encounter of encounters) {
    if (encounter.mrn) {
      swedishMrns.add(encounter.mrn);
    }

    if (encounter.providenceMrn) {
      providenceMrns.add(encounter.providenceMrn);
    }

    if (encounter.mrn && encounter.providenceMrn) {
      matches.push([encounter.mrn, encounter.providenceMrn]);
    }
  }

  if (providenceMrns.size > 1) {
    return true;
  }

  if (swedishMrns.size > 1) {
    return true;
  }

  if (providenceMrns.size === 1 && swedishMrns.size === 1 && !matches.length) {
    return true;
  }

  return false;
}

enum MODE {
  MAKE_FIXES = 'MAKE_FIXES',
  SHOW_FIXES = 'SHOW_FIXES',
}

interface LinkMrnReportProps {}

interface LinkMrnReportState {
  changedRows: {};
  encounters: TransformedEncounter[];
  error?: Error;
  fixes: Fix[];
  mode: MODE;
  mrnInferenceEnabled: boolean;
  obfuscated: boolean;
}

export class LinkMrnReport extends React.Component<LinkMrnReportProps, LinkMrnReportState> {
  fixes: Nedb;

  state: LinkMrnReportState = {
    changedRows: {},
    encounters: [],
    error: null,
    fixes: [],
    mode: MODE.MAKE_FIXES,
    mrnInferenceEnabled: true,
    obfuscated: false,
  };

  async loadEncounters(mapMrns: boolean) {
    this.setState({ encounters: null, fixes: null }, async () => {
      const allEncounters = await transform(mapMrns);
      const encounters = allEncounters.filter(
        (encounter) => encounter.encounterType === 'patient'
      );

      const fixFile = await copyFixFile();
      const fixes = await getFixes(fixFile.file);

      this.setState({ encounters, fixes });
    });
  }

  async componentDidMount() {
    ensureFixesDirectoryExists();

    this.fixes = openFixes();

    await this.loadEncounters(this.state.mrnInferenceEnabled);
  }

  render() {
    const { encounters, error, mode, mrnInferenceEnabled, obfuscated } = this.state;

    if (error) {
      return <ErrorMessage error={error} />;
    }

    if (!encounters) {
      return <PageLoader />;
    }

    const header = (
      <div>
        <Checkbox
          checked={obfuscated}
          label="Obfuscate results"
          onChange={(e, data) => this.setState({ obfuscated: data.checked })}
        />
        &nbsp;&nbsp;&nbsp;
        <Checkbox
          checked={mrnInferenceEnabled}
          label="Enable MRN inference"
          onClick={() => {
            this.setState(
              (state) => ({
                mrnInferenceEnabled: !state.mrnInferenceEnabled,
              }),
              async () => {
                await this.loadEncounters(this.state.mrnInferenceEnabled);
              }
            );
          }}
        />
        &nbsp;&nbsp;&nbsp;
        <Radio
          label="Make Fixes"
          name="mode"
          value={MODE.MAKE_FIXES}
          checked={this.state.mode === MODE.MAKE_FIXES}
          onChange={(e, { value }: any) => this.setState({ mode: value })}
        />
        &nbsp;&nbsp;&nbsp;
        <Radio
          label="Show Fixes"
          name="mode"
          value={MODE.SHOW_FIXES}
          checked={this.state.mode === MODE.SHOW_FIXES}
          onChange={(e, { value }: any) => this.setState({ mode: value })}
        />
      </div>
    );

    if (mode === MODE.MAKE_FIXES) {
      return this.renderMakeFixes(header);
    }

    return this.renderShowFixes(header);
  }

  renderMakeFixes(header) {
    const { changedRows, encounters, obfuscated } = this.state;

    if (!encounters || encounters.length === 0) {
      return (
        <>
          {header}

          <h1>There are no encounters to display.</h1>
        </>
      );
    }

    const byDOB: { [dob: string]: TransformedEncounter[] } = {};

    for (const encounter of encounters) {
      if (!byDOB[encounter.formattedDateOfBirth]) {
        byDOB[encounter.formattedDateOfBirth] = [];
      }

      byDOB[encounter.formattedDateOfBirth].push(encounter);
    }

    const pendingMatches: TransformedEncounter[][] = [];

    each(byDOB, (dobEncounters) => {
      const sets = [];
      const encountersCopy = dobEncounters.slice();

      while (encountersCopy.length) {
        const currentSet = [encountersCopy.shift()];

        for (let i = 0; i < encountersCopy.length; i++) {
          if (!encountersCopy[i]) {
            continue;
          }

          const similarity = arraySimilarity(
            metaphones(currentSet[0].patientName),
            metaphones(encountersCopy[i].patientName)
          );

          if (similarity >= 0.6) {
            currentSet.push(encountersCopy[i]);
            encountersCopy[i] = null;
          }
        }

        for (let i = encountersCopy.length - 1; i >= 0; i--) {
          if (!encountersCopy[i]) {
            encountersCopy.splice(i, 1);
          }
        }

        sets.push(currentSet);
      }

      sets.forEach((set) => {
        if (needsMatching(set)) {
          pendingMatches.push(set);
        }
      });
    });

    return (
      <>
        {header}

        <h2>{pendingMatches.length} groups to match</h2>

        {pendingMatches.map((matches, i) => {
          return (
            <Table key={i}>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell width={2}>Social Worker</Table.HeaderCell>
                  <Table.HeaderCell width={3}>Name</Table.HeaderCell>
                  <Table.HeaderCell width={2}>Encounter Date</Table.HeaderCell>
                  <Table.HeaderCell width={2}>Date of Birth</Table.HeaderCell>
                  <Table.HeaderCell width={2}>Providence MRN</Table.HeaderCell>
                  <Table.HeaderCell width={2}>Swedish MRN</Table.HeaderCell>
                  <Table.HeaderCell width={1} />
                </Table.Row>
              </Table.Header>

              <Table.Body>
                {sortBy(matches, 'encounterDate').map((match, j) => {
                  const providenceMrn =
                    match.providenceMrn === EXCLUDE_STRING_VALUE ? '' : match.providenceMrn;
                  const mrn = match.mrn === EXCLUDE_STRING_VALUE ? '' : match.mrn;

                  return (
                    <Table.Row key={j}>
                      <Table.Cell>{usernameToName(match.username)}</Table.Cell>
                      <Table.Cell>
                        {obfuscated ? obfuscateString(match.patientName) : match.patientName}
                      </Table.Cell>
                      <Table.Cell>
                        {match.parsedEncounterDate.format(DATE_FORMAT_DISPLAY)}
                      </Table.Cell>
                      <Table.Cell>
                        {obfuscated
                          ? obfuscateDate(match.formattedDateOfBirth)
                          : match.formattedDateOfBirth}
                      </Table.Cell>
                      <Table.Cell>
                        {obfuscated ? (
                          obfuscateNumber(providenceMrn)
                        ) : (
                          <Input
                            defaultValue={providenceMrn}
                            onChange={(e, data) =>
                              this.setState({
                                changedRows: {
                                  ...changedRows,
                                  [match.uniqueId]: {
                                    ...changedRows[match.uniqueId],
                                    providenceMrn: data.value,
                                  },
                                },
                              })
                            }
                          />
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        {obfuscated ? (
                          obfuscateNumber(mrn)
                        ) : (
                          <Input
                            defaultValue={mrn}
                            onChange={(e, data) =>
                              this.setState({
                                changedRows: {
                                  ...changedRows,
                                  [match.uniqueId]: {
                                    ...changedRows[match.uniqueId],
                                    mrn: data.value,
                                  },
                                },
                              })
                            }
                          />
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        {!obfuscated && (
                          <Button
                            disabled={
                              !(match.uniqueId in changedRows) ||
                              ((!('mrn' in changedRows[match.uniqueId]) ||
                                changedRows[match.uniqueId].mrn === match.mrn) &&
                                (!('providenceMrn' in changedRows[match.uniqueId]) ||
                                  changedRows[match.uniqueId].providenceMrn ===
                                    match.providenceMrn))
                            }
                            onClick={() => {
                              if (!changedRows[match.uniqueId]) {
                                return;
                              }

                              const record: Fix = { uniqueId: match.uniqueId };

                              if (changedRows[match.uniqueId].mrn) {
                                record.mrn = changedRows[match.uniqueId].mrn;
                              }

                              if (changedRows[match.uniqueId].providenceMrn) {
                                record.providenceMrn = changedRows[match.uniqueId].providenceMrn;
                              }

                              this.fixes.insert(record, (err) => this.setState({ error: err }));
                            }}
                            primary
                          >
                            Save
                          </Button>
                        )}
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table>
          );
        })}
      </>
    );
  }

  renderShowFixes(header) {
    const { fixes } = this.state;

    if (!fixes || fixes.length === 0) {
      return (
        <>
          {header}

          <h1>There are no fixes to display.</h1>
        </>
      );
    }

    return (
      <>
        {header}

        <h2>{fixes.length} fixes recorded</h2>

        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Created At</Table.HeaderCell>
              <Table.HeaderCell>Unique ID</Table.HeaderCell>
              <Table.HeaderCell>Swedish MRN</Table.HeaderCell>
              <Table.HeaderCell>Providence MRN</Table.HeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {sortBy(fixes, 'createdAt').map((fix, i) => {
              return (
                <Table.Row key={i}>
                  <Table.Cell>{moment(fix.createdAt).format(DATE_FORMAT_DISPLAY)}</Table.Cell>
                  <Table.Cell>{fix.uniqueId}</Table.Cell>
                  <Table.Cell>{fix.mrn}</Table.Cell>
                  <Table.Cell>{fix.providenceMrn}</Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table>
      </>
    );
  }
}
