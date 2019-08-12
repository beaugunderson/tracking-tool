import './GridReport.css';
import React from 'react';
import {
  arraySimilarity,
  metaphones,
  obfuscateDate,
  obfuscateNumber,
  obfuscateString
} from '../utilities';
import { Button, Checkbox, Input, Table } from 'semantic-ui-react';
import { DATE_FORMAT_DISPLAY } from '../constants';
import { each, sortBy } from 'lodash';
import { EXCLUDE_STRING_VALUE, transform, TransformedEncounter } from './data';
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

interface LinkMrnReportProps {
  onComplete: (err?: Error) => void;
}

interface LinkMrnReportState {
  changedRows: {};
  encounters: TransformedEncounter[] | null;
  mrnInferenceEnabled: boolean;
  loading: boolean;
  obfuscated: boolean;
}

export class LinkMrnReport extends React.Component<LinkMrnReportProps, LinkMrnReportState> {
  state: LinkMrnReportState = {
    changedRows: {},
    encounters: null,
    mrnInferenceEnabled: true,
    loading: true,
    obfuscated: false
  };

  async loadEncounters(mapMrns: boolean) {
    const allEncounters = await transform(mapMrns);
    const encounters = allEncounters.filter(encounter => encounter.encounterType === 'patient');

    try {
      this.setState({ encounters, loading: false });
    } catch (e) {
      this.props.onComplete(e);
    }
  }

  async componentDidMount() {
    await this.loadEncounters(this.state.mrnInferenceEnabled);
  }

  render() {
    const { changedRows, encounters, loading, mrnInferenceEnabled, obfuscated } = this.state;

    if (loading) {
      return <h1>Loading encounters...</h1>;
    }

    const header = (
      <div>
        <Button onClick={() => this.props.onComplete()}>Back</Button>
        &nbsp;&nbsp;&nbsp;
        <Checkbox
          checked={obfuscated}
          label="Obfuscate results"
          onChange={(e, data) => this.setState({ obfuscated: data.checked })}
        />
        &nbsp;&nbsp;&nbsp;
        <Checkbox
          checked={mrnInferenceEnabled}
          label="Enable MRN inference"
          onClick={(e, data) => {
            this.setState(
              state => ({
                mrnInferenceEnabled: !state.mrnInferenceEnabled,
                loading: true
              }),
              async () => {
                await this.loadEncounters(data.checked);
              }
            );
          }}
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

    const byDOB: { [dob: string]: TransformedEncounter[] } = {};

    for (const encounter of encounters) {
      if (!byDOB[encounter.formattedDateOfBirth]) {
        byDOB[encounter.formattedDateOfBirth] = [];
      }

      byDOB[encounter.formattedDateOfBirth].push(encounter);
    }

    const pendingMatches: TransformedEncounter[][] = [];

    each(byDOB, dobEncounters => {
      const sets = [];

      let remaining = dobEncounters.length;

      while (remaining) {
        const currentSet = [dobEncounters.shift()];

        for (let i = 0; i < dobEncounters.length; i++) {
          if (!dobEncounters[i]) {
            continue;
          }

          const similarity = arraySimilarity(
            metaphones(currentSet[0].patientName),
            metaphones(dobEncounters[i].patientName)
          );

          if (similarity >= 0.6) {
            currentSet.push(dobEncounters[i]);
            // eslint-disable-next-line no-param-reassign
            dobEncounters[i] = null;
          }
        }

        remaining = dobEncounters.filter(e => e).length;

        sets.push(currentSet);
      }

      sets.forEach(set => {
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
                  <Table.HeaderCell width={1}></Table.HeaderCell>
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
                                    providenceMrn: data.value
                                  }
                                }
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
                                    mrn: data.value
                                  }
                                }
                              })
                            }
                          />
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        {!obfuscated && (
                          <Button
                            disabled={
                              mrnInferenceEnabled ||
                              !(match.uniqueId in changedRows) ||
                              ((!('mrn' in changedRows[match.uniqueId]) ||
                                changedRows[match.uniqueId].mrn === match.mrn) &&
                                (!('providenceMrn' in changedRows[match.uniqueId]) ||
                                  changedRows[match.uniqueId].providenceMrn ===
                                    match.providenceMrn))
                            }
                            onClick={() =>
                              console.log({
                                uniqueId: match.uniqueId,
                                value: changedRows[match.uniqueId]
                              })
                            }
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
}
