import './GridReport.css';
import * as doubleMetaphone from 'double-metaphone';
import React from 'react';
import { Button, Input, Table } from 'semantic-ui-react';
import { DATE_FORMAT_DISPLAY } from '../constants';
import { each } from 'lodash';
import { EXCLUDE_STRING_VALUE, transform, TransformedEncounter } from './data';
import { usernameToName } from '../usernames';

/*

  - find all duplicate dates of birth, then filter based on levenshtein distance on name
  - find all duplicate names, then filter based on difference in birth date

  for names: compareStrings() >= 0.6
*/

function metaphones(name: string): string[] {
  return name
    .replace(/,/g, '')
    .split(' ')
    .map(part => doubleMetaphone(part)[0]);
}

function arraySimilarity(a: string[], b: string[]): number {
  let matches = 0;

  for (const item of a) {
    if (b.includes(item)) {
      matches++;
    }
  }

  return matches / Math.max(a.length, b.length);
}

interface LinkMrnReportProps {
  onComplete: (err?: Error) => void;
}

interface LinkMrnReportState {
  changedRows: {};
  encounters: TransformedEncounter[] | null;
  loading: boolean;
}

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

export class LinkMrnReport extends React.Component<LinkMrnReportProps, LinkMrnReportState> {
  state: LinkMrnReportState = {
    changedRows: {},
    encounters: null,
    loading: true
  };

  async componentDidMount() {
    const encounters = await transform();

    const patientEncounters = encounters.filter(
      encounter => encounter.encounterType === 'patient'
    );

    try {
      this.setState({ encounters: patientEncounters, loading: false });
    } catch (e) {
      this.props.onComplete(e);
    }
  }

  render() {
    const { changedRows, encounters, loading } = this.state;

    if (loading) {
      return <h1>Loading encounters...</h1>;
    }

    const header = (
      <div>
        <Button onClick={() => this.props.onComplete()}>Back</Button>
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

    encounters.forEach(encounter => {
      if (!byDOB[encounter.formattedDateOfBirth]) {
        byDOB[encounter.formattedDateOfBirth] = [encounter];
      } else {
        byDOB[encounter.formattedDateOfBirth].push(encounter);
      }
    });

    const pendingMatches: TransformedEncounter[][] = [];

    each(byDOB, dobEncounters => {
      const sets = [];

      while (dobEncounters.length) {
        const currentSet = [dobEncounters.shift()];

        dobEncounters.slice().forEach((encounter, index) => {
          if (
            arraySimilarity(
              metaphones(currentSet[0].patientName),
              metaphones(encounter.patientName)
            ) >= 0.6
          ) {
            currentSet.push(encounter);
            dobEncounters.splice(index, 1);
          }
        });

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
                {matches.map((match, j) => {
                  const providenceMrn =
                    match.providenceMrn === EXCLUDE_STRING_VALUE ? '' : match.providenceMrn;
                  const mrn = match.mrn === EXCLUDE_STRING_VALUE ? '' : match.mrn;

                  return (
                    <Table.Row key={j}>
                      <Table.Cell>{usernameToName(match.username)}</Table.Cell>
                      <Table.Cell>{match.patientName}</Table.Cell>
                      <Table.Cell>
                        {match.parsedEncounterDate.format(DATE_FORMAT_DISPLAY)}
                      </Table.Cell>
                      <Table.Cell>{match.formattedDateOfBirth}</Table.Cell>
                      <Table.Cell>
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
                      </Table.Cell>
                      <Table.Cell>
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
                      </Table.Cell>
                      <Table.Cell>
                        <Button
                          disabled={
                            !(match.uniqueId in changedRows) ||
                            ((!('mrn' in changedRows[match.uniqueId]) ||
                              changedRows[match.uniqueId].mrn === match.mrn) &&
                              (!('providenceMrn' in changedRows[match.uniqueId]) ||
                                changedRows[match.uniqueId].providenceMrn === match.providenceMrn))
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
