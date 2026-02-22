import './LinkMrnReport.css';
import moment from 'moment';
import React, { useCallback } from 'react';
import { Button, Checkbox, Input, Radio, Table } from 'semantic-ui-react';
import { chain, Dictionary, each, groupBy, map, sortBy } from 'lodash';
import { DATE_FORMAT_DATABASE, DATE_FORMAT_DISPLAY } from '../constants';
import { ErrorMessage } from '../ErrorMessage';
import { EXCLUDE_STRING_VALUE, parseDate, transform, TransformedEncounter } from './data';
import { Fix } from '../data';
import {
  namesRepresentSamePerson,
  obfuscateDate,
  obfuscateNumber,
  obfuscateString,
} from '../utilities';
import { PageLoader } from '../components/PageLoader';
import { usernameToName } from '../usernames';

function hasMultipleMrns(encounters: TransformedEncounter[]) {
  const swedishMrns = new Set();
  const providenceMrns = new Set();

  const cooccurrences = [];

  for (const encounter of encounters) {
    const swedishMrn =
      encounter.mrn && encounter.mrn !== EXCLUDE_STRING_VALUE ? encounter.mrn : null;

    const providenceMrn =
      encounter.providenceMrn && encounter.providenceMrn !== EXCLUDE_STRING_VALUE
        ? encounter.providenceMrn
        : null;

    if (swedishMrn) {
      swedishMrns.add(swedishMrn);
    }

    if (providenceMrn) {
      providenceMrns.add(providenceMrn);
    }

    if (swedishMrn && providenceMrn) {
      cooccurrences.push([swedishMrn, providenceMrn]);
    }
  }

  if (swedishMrns.size > 1) {
    return true;
  }

  if (providenceMrns.size > 1) {
    return true;
  }

  if (swedishMrns.size === 1 && providenceMrns.size === 1 && !cooccurrences.length) {
    return true;
  }

  return false;
}

function hasSingleMrn(encounters: TransformedEncounter[]) {
  const swedishMrns = new Set();
  const providenceMrns = new Set();

  for (const encounter of encounters) {
    const swedishMrn =
      encounter.mrn && encounter.mrn !== EXCLUDE_STRING_VALUE ? encounter.mrn : null;

    const providenceMrn =
      encounter.providenceMrn && encounter.providenceMrn !== EXCLUDE_STRING_VALUE
        ? encounter.providenceMrn
        : null;

    if (swedishMrn) {
      swedishMrns.add(swedishMrn);
    }

    if (providenceMrn) {
      providenceMrns.add(providenceMrn);
    }
  }

  if (swedishMrns.size === 1 || providenceMrns.size === 1) {
    return true;
  }

  return false;
}

const similarNames = (a: TransformedEncounter, b: TransformedEncounter) =>
  namesRepresentSamePerson(a.patientName, b.patientName);

const differentBirthDatesOrDissimilarNames = (a: TransformedEncounter, b: TransformedEncounter) =>
  a.formattedDateOfBirth !== b.formattedDateOfBirth || !similarNames(a, b);

function makeGroups(
  group: { [name: string]: TransformedEncounter[] },
  similarityFn: (a: TransformedEncounter, b: TransformedEncounter) => boolean,
  needsMatchingFn: (encounters: TransformedEncounter[]) => boolean,
) {
  const pendingMatches: TransformedEncounter[][] = [];

  each(group, (encounters) => {
    const sets: TransformedEncounter[][] = [];
    const encountersCopy = encounters.slice();

    while (encountersCopy.length) {
      const currentSet = [encountersCopy.shift()];

      for (let i = 0; i < encountersCopy.length; i++) {
        if (!encountersCopy[i]) {
          continue;
        }

        if (similarityFn(currentSet[0], encountersCopy[i])) {
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
      if (set.length > 1 && needsMatchingFn(set)) {
        pendingMatches.push(set);
      }
    });
  });

  return pendingMatches;
}

function groupName(encounters: TransformedEncounter[]): string {
  return encounters.map((encounter) => encounter.uniqueId).join('-');
}

function topByProperty(
  encounters: TransformedEncounter[],
  property: 'formattedDateOfBirth' | 'mrn' | 'providenceMrn',
): string | null {
  const top = chain(encounters)
    .filter((encounter) => encounter[property] && encounter[property] !== EXCLUDE_STRING_VALUE)
    .countBy(property)
    .toPairs()
    .sortBy((pair) => -pair[1])
    .first()
    .value();

  if (top) {
    return top[0] as string;
  }

  return null;
}

function formatGroup(encounters: TransformedEncounter[], type: string): Group {
  return {
    canonicalDateOfBirth: topByProperty(encounters, 'formattedDateOfBirth'),
    canonicalSwedishMrn: topByProperty(encounters, 'mrn'),
    canonicalProvidenceMrn: topByProperty(encounters, 'providenceMrn'),
    encounters,
    id: groupName(encounters),
    type,
  };
}

function formatGroups(groups: TransformedEncounter[][], type: string): Group[] {
  return groups.map((encounters) => formatGroup(encounters, type));
}

interface Group {
  canonicalDateOfBirth: string | null;
  canonicalSwedishMrn: string | null;
  canonicalProvidenceMrn: string | null;
  encounters: TransformedEncounter[];
  id: string;
  type: string;
}

export function constructPendingMatchGroups(encounters: TransformedEncounter[]): Group[] {
  const byDOB = groupBy(
    encounters.filter((encounter) => encounter.formattedDateOfBirth),
    'formattedDateOfBirth',
  );

  const bySwedishMrn = groupBy(
    encounters.filter((encounter) => encounter.mrn),
    'mrn',
  );

  const byProvidenceMrn = groupBy(
    encounters.filter((encounter) => encounter.providenceMrn),
    'providenceMrn',
  );

  const samePatientDifferentMrns = formatGroups(
    makeGroups(byDOB, similarNames, hasMultipleMrns),
    'same-patient-different-mrns',
  );

  const sameSwedishMrnDifferentPatients = formatGroups(
    makeGroups(bySwedishMrn, differentBirthDatesOrDissimilarNames, hasSingleMrn),
    'same-swedish-mrn-different-patients',
  );

  const sameProvidenceMrnDifferentPatients = formatGroups(
    makeGroups(byProvidenceMrn, differentBirthDatesOrDissimilarNames, hasSingleMrn),
    'same-providence-mrn-different-patients',
  );

  const pendingMatches = [
    ...samePatientDifferentMrns,
    ...sameSwedishMrnDifferentPatients,
    ...sameProvidenceMrnDifferentPatients,
  ];

  const uniqueMatches = {};

  for (const group of pendingMatches) {
    uniqueMatches[group.id] = group;
  }

  return Object.values(uniqueMatches);
}

enum SAVE_STATUS {
  UNSAVED = 1,
  SAVING = 2,
  SAVED = 3,
}

enum MODE {
  MAKE_FIXES = 'MAKE_FIXES',
  SHOW_FIXES = 'SHOW_FIXES',
}

const TYPE_MAP = {
  'same-patient-different-mrns': 'Same patient, different MRNs',
  'same-swedish-mrn-different-patients': 'Same Swedish MRN, different patients',
  'same-providence-mrn-different-patients': 'Same Providence MRN, different patients',
} as const;

interface LinkMrnReportProps {}

interface LinkMrnReportState {
  changedRows: {
    [uniquedId: string]: {
      dateOfBirth?: string;
      mrn?: string;
      providenceMrn?: string;
    };
  };
  encounters: TransformedEncounter[];
  error?: Error;
  fixes: Fix[];
  mode: MODE;
  mrnInferenceEnabled: boolean;
  obfuscated: boolean;
  pendingMatchGroups: Group[];
  pendingMatchGroupsByType: Dictionary<Group[]>;
  saveStatuses: { [uniqueId: string]: SAVE_STATUS };
}

type EncounterRowProps = {
  canonicalDateOfBirth: string | null;
  canonicalProvidenceMrn: string | null;
  canonicalSwedishMrn: string | null;
  changedRow: { dateOfBirth?: string; mrn?: string; providenceMrn?: string } | undefined;
  encounter: TransformedEncounter;
  obfuscated: boolean;
  onFieldChange: (uniqueId: string, field: string, value: string) => void;
  onSave: (encounter: TransformedEncounter, mrn: string, providenceMrn: string) => void;
  saveStatus: SAVE_STATUS | undefined;
};

function EncounterRow({
  canonicalDateOfBirth,
  canonicalProvidenceMrn,
  canonicalSwedishMrn,
  changedRow,
  encounter,
  obfuscated,
  onFieldChange,
  onSave,
  saveStatus,
}: EncounterRowProps) {
  const providenceMrn =
    encounter.providenceMrn === EXCLUDE_STRING_VALUE ? '' : encounter.providenceMrn;
  const mrn = encounter.mrn === EXCLUDE_STRING_VALUE ? '' : encounter.mrn;
  const saveDisabled =
    !changedRow ||
    ('mrn' in changedRow && changedRow.mrn === encounter.mrn) ||
    ('providenceMrn' in changedRow && changedRow.providenceMrn === encounter.providenceMrn);

  const handleDateOfBirthChange = useCallback(
    (_e: React.SyntheticEvent, data: { value?: string }) => {
      let dateOfBirth: string;

      try {
        dateOfBirth = parseDate(data.value).format(DATE_FORMAT_DATABASE);
      } catch {
        return;
      }

      onFieldChange(encounter.uniqueId, 'dateOfBirth', dateOfBirth);
    },
    [encounter.uniqueId, onFieldChange],
  );

  const handleProvidenceMrnChange = useCallback(
    (_e: React.SyntheticEvent, data: { value?: string }) => {
      onFieldChange(encounter.uniqueId, 'providenceMrn', data.value);
    },
    [encounter.uniqueId, onFieldChange],
  );

  const handleMrnChange = useCallback(
    (_e: React.SyntheticEvent, data: { value?: string }) => {
      onFieldChange(encounter.uniqueId, 'mrn', data.value);
    },
    [encounter.uniqueId, onFieldChange],
  );

  const handleSave = useCallback(
    () => onSave(encounter, mrn, providenceMrn),
    [encounter, mrn, providenceMrn, onSave],
  );

  return (
    <Table.Row>
      <Table.Cell>{usernameToName(encounter.username)}</Table.Cell>

      <Table.Cell>
        {obfuscated ? obfuscateString(encounter.patientName) : encounter.patientName}
      </Table.Cell>

      <Table.Cell>{encounter.parsedEncounterDate.format(DATE_FORMAT_DISPLAY)}</Table.Cell>

      <Table.Cell>
        {obfuscated ? (
          obfuscateDate(encounter.formattedDateOfBirth)
        ) : (
          <Input
            defaultValue={encounter.formattedDateOfBirth}
            negative={
              canonicalDateOfBirth && encounter.formattedDateOfBirth !== canonicalDateOfBirth
            }
            onChange={handleDateOfBirthChange}
          />
        )}
      </Table.Cell>

      <Table.Cell negative={canonicalProvidenceMrn && providenceMrn !== canonicalProvidenceMrn}>
        {obfuscated ? (
          obfuscateNumber(providenceMrn)
        ) : (
          <Input defaultValue={providenceMrn} onChange={handleProvidenceMrnChange} />
        )}
      </Table.Cell>

      <Table.Cell negative={canonicalSwedishMrn && mrn !== canonicalSwedishMrn}>
        {obfuscated ? (
          obfuscateNumber(mrn)
        ) : (
          <Input defaultValue={mrn} onChange={handleMrnChange} />
        )}
      </Table.Cell>

      <Table.Cell>
        {!obfuscated && (
          <Button
            className="link-mrn-save-button"
            color={saveStatus === SAVE_STATUS.SAVED ? 'green' : 'blue'}
            disabled={saveDisabled}
            loading={saveStatus === SAVE_STATUS.SAVING}
            onClick={handleSave}
          >
            {saveStatus === SAVE_STATUS.SAVED ? 'Saved!' : 'Save'}
          </Button>
        )}
      </Table.Cell>
    </Table.Row>
  );
}

export class LinkMrnReport extends React.Component<LinkMrnReportProps, LinkMrnReportState> {
  static whyDidYouRender = {
    logOnDifferentValues: true,
  };

  state: LinkMrnReportState = {
    changedRows: {},
    encounters: [],
    error: null,
    fixes: [],
    mode: MODE.MAKE_FIXES,
    mrnInferenceEnabled: true,
    obfuscated: false,
    pendingMatchGroups: [],
    pendingMatchGroupsByType: {},
    saveStatuses: {},
  };

  handleObfuscatedChange = (_e: React.SyntheticEvent, data: { checked?: boolean }) =>
    this.setState({ obfuscated: data.checked });

  handleMrnInferenceToggle = () => {
    this.setState(
      (state) => ({
        mrnInferenceEnabled: !state.mrnInferenceEnabled,
      }),
      async () => {
        await this.loadEncounters(this.state.mrnInferenceEnabled);
      },
    );
  };

  handleModeChange = (_e: React.SyntheticEvent, { value }: { value?: string | number }) =>
    this.setState({ mode: value as MODE });

  handleFieldChange = (uniqueId: string, field: string, value: string) => {
    this.setState((state) => ({
      changedRows: {
        ...state.changedRows,
        [uniqueId]: {
          ...state.changedRows[uniqueId],
          [field]: value,
        },
      },
      saveStatuses: {
        ...state.saveStatuses,
        [uniqueId]: SAVE_STATUS.UNSAVED,
      },
    }));
  };

  handleSave = async (encounter: TransformedEncounter, mrn: string, providenceMrn: string) => {
    const { changedRows } = this.state;

    if (!changedRows[encounter.uniqueId]) {
      return;
    }

    const record: Fix = {
      uniqueId: encounter.uniqueId,
      dateOfBirth: changedRows[encounter.uniqueId].dateOfBirth || encounter.dateOfBirth,
      mrn: changedRows[encounter.uniqueId].mrn || mrn,
      providenceMrn: changedRows[encounter.uniqueId].providenceMrn || providenceMrn,
    };

    this.setState((state) => ({
      saveStatuses: {
        ...state.saveStatuses,
        [encounter.uniqueId]: SAVE_STATUS.SAVING,
      },
    }));

    try {
      await window.trackingTool.fixesInsert(record);
      this.setState((state) => ({
        saveStatuses: {
          ...state.saveStatuses,
          [encounter.uniqueId]: SAVE_STATUS.SAVED,
        },
      }));
    } catch (err) {
      this.setState({ error: err as Error });
    }
  };

  async loadEncounters(mapMrns: boolean) {
    this.setState({ encounters: null, fixes: null }, async () => {
      const allEncounters = await transform(mapMrns);
      const encounters = allEncounters.filter(
        (encounter) => encounter.encounterType === 'patient',
      );

      const fixes = await window.trackingTool.fixesGetAll();

      const pendingMatchGroups = constructPendingMatchGroups(encounters);
      const pendingMatchGroupsByType = groupBy(pendingMatchGroups, 'type');

      this.setState({
        encounters,
        fixes,
        pendingMatchGroups,
        pendingMatchGroupsByType,
      });
    });
  }

  async componentDidMount() {
    await window.trackingTool.fixesOpen();
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
          onChange={this.handleObfuscatedChange}
        />
        &nbsp;&nbsp;&nbsp;
        <Checkbox
          checked={mrnInferenceEnabled}
          label="Enable MRN inference"
          onClick={this.handleMrnInferenceToggle}
        />
        &nbsp;&nbsp;&nbsp;
        <Radio
          label="Make Fixes"
          name="mode"
          value={MODE.MAKE_FIXES}
          checked={mode === MODE.MAKE_FIXES}
          onChange={this.handleModeChange}
        />
        &nbsp;&nbsp;&nbsp;
        <Radio
          label="Show Fixes"
          name="mode"
          value={MODE.SHOW_FIXES}
          checked={mode === MODE.SHOW_FIXES}
          onChange={this.handleModeChange}
        />
      </div>
    );

    if (mode === MODE.MAKE_FIXES) {
      return this.renderMakeFixes(header);
    }

    return this.renderShowFixes(header);
  }

  renderMakeFixes(header: React.ReactElement) {
    const {
      changedRows,
      encounters,
      obfuscated,
      pendingMatchGroups,
      pendingMatchGroupsByType,
      saveStatuses,
    } = this.state;

    if (!encounters || encounters.length === 0) {
      return (
        <>
          {header}

          <h1>There are no encounters to display.</h1>
        </>
      );
    }

    return (
      <>
        {header}

        <h2>{pendingMatchGroups.length} groups to match</h2>

        {map(pendingMatchGroupsByType, (groups, type) => (
          <>
            <h3>{TYPE_MAP[type]}</h3>

            {groups.map((group, i) => (
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
                  {sortBy(group.encounters, 'encounterDate').map((encounter) => (
                    <EncounterRow
                      canonicalDateOfBirth={group.canonicalDateOfBirth}
                      canonicalProvidenceMrn={group.canonicalProvidenceMrn}
                      canonicalSwedishMrn={group.canonicalSwedishMrn}
                      changedRow={changedRows[encounter.uniqueId]}
                      encounter={encounter}
                      key={encounter.uniqueId}
                      obfuscated={obfuscated}
                      onFieldChange={this.handleFieldChange}
                      onSave={this.handleSave}
                      saveStatus={saveStatuses[encounter.uniqueId]}
                    />
                  ))}
                </Table.Body>
              </Table>
            ))}
          </>
        ))}
      </>
    );
  }

  renderShowFixes(header: React.ReactElement) {
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
              <Table.HeaderCell>Date of Birth</Table.HeaderCell>
              <Table.HeaderCell>Providence MRN</Table.HeaderCell>
              <Table.HeaderCell>Swedish MRN</Table.HeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {sortBy(fixes, 'createdAt').map((fix, i) => {
              return (
                <Table.Row key={i}>
                  <Table.Cell>{moment(fix.createdAt).format(DATE_FORMAT_DISPLAY)}</Table.Cell>
                  <Table.Cell>{fix.uniqueId}</Table.Cell>
                  <Table.Cell>
                    {fix.dateOfBirth ? parseDate(fix.dateOfBirth).format(DATE_FORMAT_DISPLAY) : ''}
                  </Table.Cell>
                  <Table.Cell>{fix.providenceMrn}</Table.Cell>
                  <Table.Cell>{fix.mrn}</Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table>
      </>
    );
  }
}
