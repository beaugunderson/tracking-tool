import './GridReport.css';
import * as doubleMetaphone from 'double-metaphone';
import React from 'react';
import { Button, Table } from 'semantic-ui-react';
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

  for (const x of a) {
    if (b.includes(x)) {
      matches++;
    }
  }

  return matches / Math.max(a.length, b.length);
}

interface LinkMrnReportProps {
  onComplete: (err?: Error) => void;
}

interface LinkMrnReportState {
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
    encounters: null,
    loading: true
  };

  async componentDidMount() {
    try {
      this.setState({ encounters: await transform(), loading: false });
    } catch (e) {
      this.props.onComplete(e);
    }
  }

  render() {
    const { encounters, loading } = this.state;

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
        <React.Fragment>
          {header}

          <h1>There are no encounters to display.</h1>
        </React.Fragment>
      );
    }

    const byDOB: { [dob: string]: TransformedEncounter[] } = {};

    encounters.forEach(encounter => {
      if (!byDOB[encounter.dateOfBirth]) {
        byDOB[encounter.dateOfBirth] = [encounter];
      } else {
        byDOB[encounter.dateOfBirth].push(encounter);
      }
    });

    const pendingMatches: TransformedEncounter[][] = [];

    each(byDOB, dobEncounters => {
      const sets = [];

      while (dobEncounters.length) {
        const currentSet = [dobEncounters[0]];

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
      <React.Fragment>
        {header}

        {pendingMatches.map((matches, i) => {
          return (
            <Table key={i}>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell width={1}>Social Worker</Table.HeaderCell>
                  <Table.HeaderCell width={2}>Name</Table.HeaderCell>
                  <Table.HeaderCell width={1}>Date of Birth</Table.HeaderCell>
                  <Table.HeaderCell width={1}>Providence MRN</Table.HeaderCell>
                  <Table.HeaderCell width={1}>Swedish MRN</Table.HeaderCell>
                </Table.Row>
              </Table.Header>

              <Table.Body>
                {matches.map((match, j) => {
                  return (
                    <Table.Row key={j}>
                      <Table.Cell>{usernameToName(match.username)}</Table.Cell>
                      <Table.Cell>{match.patientName}</Table.Cell>
                      <Table.Cell>{match.dateOfBirth}</Table.Cell>
                      <Table.Cell>
                        {match.providenceMrn === EXCLUDE_STRING_VALUE ? '' : match.providenceMrn}
                      </Table.Cell>
                      <Table.Cell>{match.mrn}</Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table>
          );
        })}
      </React.Fragment>
    );
  }
}
