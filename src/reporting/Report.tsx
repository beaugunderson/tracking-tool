/* eslint-disable no-await-in-loop */
import '../../node_modules/dc/dc.css';
import './Report.css';
import * as d3 from 'd3';
import crossfilter from 'crossfilter2';
import dc from 'dc';
import mergeImg from 'merge-img';
import moment from 'moment';
import React from 'react';
import reductio from 'reductio';
import typedArrayToBuffer from 'typedarray-to-buffer';
import { Button, Checkbox, Container, Dimmer, Loader, Modal, Statistic } from 'semantic-ui-react';
import {
  EXCLUDE_NUMBER_VALUE,
  EXCLUDE_STRING_VALUE,
  SCORE_DECLINED,
  SCORE_MAY_INDICATE_COGNITIVE_IMPAIRMENT,
  SCORE_MILD_MINIMAL_OR_NONE,
  SCORE_MODERATE,
  SCORE_MODERATELY_SEVERE,
  SCORE_NORMAL,
  SCORE_SEVERE,
  transform,
  TransformedEncounter
} from './data';
import { isBoolean, isNaN, isString, keys, map, sum, values, zipObject } from 'lodash';
import { OTHER_ENCOUNTER_OPTIONS } from '../forms/OtherEncounterForm';
import { usernameToName } from '../usernames';

const { remote, screen } = window.require('electron');

const DEFAULT_MARGINS = { top: 10, right: 50, bottom: 30, left: 30 };
const OUR_MARGINS = { ...DEFAULT_MARGINS, left: 55 };

const OTHER_FIELD_NAMES: string[] = map(OTHER_ENCOUNTER_OPTIONS, 'fieldName') as string[];
const OTHER_FIELD_MAPPING = zipObject(OTHER_FIELD_NAMES, map(
  OTHER_ENCOUNTER_OPTIONS,
  'name'
) as string[]);

const TITLE_PADDING = 78;

const GAD_PHQ_ORDERING = {
  [SCORE_SEVERE]: 0,
  [SCORE_MODERATELY_SEVERE]: 1,
  [SCORE_MODERATE]: 2,
  [SCORE_MILD_MINIMAL_OR_NONE]: 3,
  [SCORE_DECLINED]: 4
};

const MOCA_ORDERING = {
  [SCORE_MAY_INDICATE_COGNITIVE_IMPAIRMENT]: 0,
  [SCORE_NORMAL]: 1,
  [SCORE_DECLINED]: 2
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function screenshot(difference?: number) {
  const { scaleFactor } = screen.getPrimaryDisplay();

  const captureRect = {
    x: 0,
    y: difference || 0,
    width: window.innerWidth * scaleFactor,
    height: (difference ? window.innerHeight - difference : window.innerHeight) * scaleFactor
  };

  return new Promise(resolve => remote.getCurrentWindow().capturePage(captureRect, resolve));
}

function removeExcludedData(group) {
  return {
    all() {
      return group
        .all()
        .filter(d => d.key !== EXCLUDE_STRING_VALUE && d.key !== EXCLUDE_NUMBER_VALUE);
    }
  };
}

const uniqueMrn = reductio()
  .exception((d: TransformedEncounter) => d.mrn)
  .exceptionCount(true);

interface ReportProps {
  onComplete: () => void;
}

interface ReportState {
  encounters?: TransformedEncounter[];
  hideSocialWorkers?: boolean;
  loading?: boolean;
  screenshotData?: string;
  windowWidth?: number;
}

export class Report extends React.Component<ReportProps, ReportState> {
  state: ReportState = {};

  resize = () => this.setState({ windowWidth: window.innerWidth });

  handleReset = () => {
    dc.filterAll();
    dc.redrawAll();
  };

  async componentDidMount() {
    this.resize();

    window.addEventListener('resize', this.resize);

    this.setState({ encounters: await transform() }, async () => this.renderCharts());
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.resize);
  }

  async componentDidUpdate(prevProps: any, prevState: ReportState) {
    if (
      this.state.encounters !== prevState.encounters ||
      this.state.windowWidth !== prevState.windowWidth
    ) {
      await this.renderCharts();
    }
  }

  async renderCharts() {
    if (!this.state.encounters) {
      return;
    }

    // #region chart definitions
    const ageBucketChart = dc.rowChart('#age-chart');
    const clinicChart = dc.rowChart('#clinic-chart');
    const dayOfWeekChart = dc.barChart('#number-of-tasks-chart');
    const diagnosisChart = dc.rowChart('#diagnosis-chart');
    const doctorChart = dc.rowChart('#doctor-chart');
    const encounterTypeChart = dc.rowChart('#encounter-type-chart');
    const encountersByDateChart = dc.barChart('#encounter-date-chart');
    const gadChart = dc.rowChart('#gad-chart');
    const interventionChart = dc.rowChart('#intervention-chart');
    const limitedEnglishProficiencyChart = dc.rowChart('#limited-english-proficiency-chart');
    const locationChart = dc.rowChart('#location-chart');
    const mocaChart = dc.rowChart('#moca-chart');
    const numberOfInterventionsChart = dc.barChart('#number-of-interventions-chart');
    const otherCategoryChart = dc.rowChart('#other-category-chart');
    const otherCategoryTimeChart = dc.rowChart('#other-category-time-chart');
    const phqChart = dc.rowChart('#phq-chart');
    const researchChart = dc.rowChart('#research-chart');
    const stageChart = dc.rowChart('#stage-chart');
    const testChart = dc.rowChart('#test-chart');
    const timeChart = dc.barChart('#time-chart');
    const userChart = dc.rowChart('#user-chart');
    // #endregion

    const ndx = crossfilter(this.state.encounters);

    const colors = ['#6baed6'];
    const windowWidth = this.state.windowWidth - 100;

    // #region grouped reducers
    const idKey = (d: TransformedEncounter) => d._id;
    const bisect = d3.bisector(idKey);

    function add(elements: TransformedEncounter[], item: TransformedEncounter) {
      const pos = bisect.right(elements, idKey(item));

      elements.splice(pos, 0, item);

      return elements;
    }

    function remove(elements: TransformedEncounter[], item: TransformedEncounter) {
      const pos = bisect.left(elements, idKey(item));

      if (idKey(elements[pos]) === idKey(item)) {
        elements.splice(pos, 1);
      }

      return elements;
    }

    function init(): TransformedEncounter[] {
      return [];
    }
    // #endregion

    // #region totals
    function renderNumber(
      selector: string,
      group: crossfilter.GroupAll<TransformedEncounter, {}>,
      accessor: (d: any) => number | string = d => d
    ) {
      const number = dc.numberDisplay(selector);
      number
        .formatNumber(d3.format('.1~f'))
        .group(group)
        .transitionDuration(0)
        .valueAccessor(accessor);
      number.render();
    }

    renderNumber('#total-tasks', ndx.groupAll().reduceSum(d => d.parsedNumberOfTasks));

    renderNumber(
      '#average-minutes-per-entry',
      ndx.groupAll().reduce(add, remove, init),
      (entries: TransformedEncounter[]) => {
        let minuteCount = 0;
        let entryCount = 0;

        entries.forEach(entry => {
          if (entry.mrn === EXCLUDE_STRING_VALUE) {
            return;
          }

          minuteCount += parseInt(entry.timeSpent, 10);
          entryCount += 1;
        });

        const value = minuteCount / entryCount;

        return isNaN(value) ? 0 : value;
      }
    );

    renderNumber(
      '#average-tasks-per-entry',
      ndx.groupAll().reduce(add, remove, init),
      (entries: TransformedEncounter[]) => {
        let taskCount = 0;
        let entryCount = 0;

        entries.forEach(entry => {
          if (entry.mrn === EXCLUDE_STRING_VALUE) {
            return;
          }

          taskCount += entry.parsedNumberOfTasks;
          entryCount += 1;
        });

        const value = taskCount / entryCount;

        return isNaN(value) ? 0 : value;
      }
    );

    renderNumber(
      '#average-tasks',
      ndx.groupAll().reduce(add, remove, init),
      (entries: TransformedEncounter[]) => {
        const byMrn = {};

        entries.forEach(entry => {
          if (entry.mrn === EXCLUDE_STRING_VALUE) {
            return;
          }

          if (!byMrn[entry.mrn]) {
            byMrn[entry.mrn] = 0;
          }

          byMrn[entry.mrn] += entry.parsedNumberOfTasks;
        });

        const value = sum(values(byMrn)) / keys(byMrn).length;

        return isNaN(value) ? 0 : value;
      }
    );

    renderNumber(
      '#average-time',
      ndx.groupAll().reduce(add, remove, init),
      (entries: TransformedEncounter[]) => {
        const byMrn = {};

        entries.forEach(entry => {
          if (entry.mrn === EXCLUDE_STRING_VALUE) {
            return;
          }

          if (!byMrn[entry.mrn]) {
            byMrn[entry.mrn] = 0;
          }

          byMrn[entry.mrn] += parseInt(entry.timeSpent, 10);
        });

        const value = sum(values(byMrn)) / keys(byMrn).length;

        return isNaN(value) ? 0 : value;
      }
    );

    renderNumber(
      '#unique-patients',
      ndx.groupAll().reduce(add, remove, init),
      (entries: TransformedEncounter[]) => {
        const mrns = new Set();

        entries.forEach(entry => {
          if (entry.mrn === EXCLUDE_STRING_VALUE) {
            return;
          }

          mrns.add(entry.mrn);
        });

        return mrns.size;
      }
    );
    // #endregion

    // #region encounters by day
    const encounterDateDimension = ndx.dimension(d => moment(d.encounterDate).format('YYYY-MM'));
    const encounterDateGroup = encounterDateDimension
      .group()
      .reduceSum(d => d.parsedNumberOfTasks);

    encountersByDateChart
      .width(windowWidth)
      .height(150)
      .brushOn(true)
      .x(d3.scaleBand())
      .xUnits(dc.units.ordinal)
      .elasticX(true)
      .elasticY(true)
      .renderLabel(true)
      .yAxisLabel('Tasks')
      // @ts-ignore
      .yAxisPadding('15%')
      .dimension(encounterDateDimension)
      .group(encounterDateGroup)
      .margins(OUR_MARGINS);

    encountersByDateChart.xAxis().tickFormat(d => {
      const tokens = d.split('-');
      return `${tokens[1]}/${tokens[0]}`;
    });

    encountersByDateChart.yAxis().ticks(7);
    encountersByDateChart.yAxisMin = () => 0;

    encountersByDateChart.render();
    // #endregion

    // #region day of week
    const dayOfWeekDimension = ndx.dimension(d => d.parsedEncounterDate.isoWeekday());
    const dayOfWeekGroup = dayOfWeekDimension.group().reduceSum(d => d.parsedNumberOfTasks);

    dayOfWeekChart
      .width(windowWidth / 3)
      .height(200)
      .brushOn(false)
      .x(d3.scaleBand())
      .xUnits(dc.units.ordinal)
      .elasticX(true)
      .elasticY(true)
      .renderLabel(true)
      .yAxisLabel('Tasks')
      // @ts-ignore
      .yAxisPadding('10%')
      .dimension(dayOfWeekDimension)
      .group(removeExcludedData(dayOfWeekGroup))
      .margins(OUR_MARGINS);

    dayOfWeekChart
      .xAxis()
      .ticks(7)
      .tickFormat(t => 'MTWTFSS'[t - 1]);
    dayOfWeekChart.yAxisMin = () => 0;

    dayOfWeekChart.render();
    // #endregion

    // #region number of interventions
    const numberOfInterventionsDimension = ndx.dimension(d =>
      d.numberOfInterventions < 10 ? d.numberOfInterventions : 10
    );
    const numberOfInterventionsGroup = numberOfInterventionsDimension.group();

    numberOfInterventionsChart
      .width(windowWidth / 3)
      .height(200)
      .brushOn(false)
      .elasticY(true)
      .x(d3.scaleBand())
      .xUnits(dc.units.ordinal)
      .yAxisLabel('Entries')
      .renderLabel(true)
      // @ts-ignore
      .yAxisPadding('10%')
      .dimension(numberOfInterventionsDimension)
      .margins(OUR_MARGINS)
      .group(removeExcludedData(numberOfInterventionsGroup));

    numberOfInterventionsChart
      .xAxis()
      .ticks(7)
      .tickFormat(d => {
        if (d === 10) {
          return '10+';
        }

        return d3.format('d')(d);
      });

    numberOfInterventionsChart.yAxisMin = () => 0;

    numberOfInterventionsChart.render();
    // #endregion

    // #region time spent
    const timeRange = [0, 100];
    const timeBinWidth = 10;

    const timeDimension = ndx.dimension(d => {
      let timeSpent = parseInt(d.timeSpent, 10);

      if (timeSpent <= timeRange[0]) {
        // eslint-disable-next-line prefer-destructuring
        timeSpent = timeRange[0];
      }

      if (timeSpent >= timeRange[1]) {
        timeSpent = timeRange[1] - timeBinWidth;
      }

      return timeBinWidth * Math.floor(timeSpent / timeBinWidth);
    });

    const timeGroup = timeDimension.group();

    timeChart
      .width(windowWidth / 3)
      .height(200)
      .brushOn(false)
      .elasticY(true)
      .yAxisLabel('Entries')
      // @ts-ignore
      .yAxisPadding('10%')
      .renderLabel(true)
      .dimension(timeDimension)
      .margins(OUR_MARGINS)
      .group(timeGroup)
      .x(d3.scaleLinear().domain(timeRange))
      .xUnits(dc.units.fp.precision(timeBinWidth))
      .round((d: number) => timeBinWidth * Math.floor(d / timeBinWidth));

    timeChart.xAxis().tickFormat(d => {
      if (d === timeRange[1]) {
        return '100+';
      }

      return d3.format('d')(d);
    });

    timeChart.yAxisMin = () => 0;

    timeChart.render();
    // #endregion

    // #region gad
    const gadDimension = ndx.dimension(d => d.gadScoreLabel || EXCLUDE_STRING_VALUE);
    const gadGroup = gadDimension.group().reduceCount();

    gadChart
      .dimension(gadDimension)
      .group(removeExcludedData(gadGroup))
      .width(windowWidth / 4)
      .height(200)
      .elasticX(true)
      .ordinalColors(colors)
      .renderTitleLabel(true)
      .titleLabelOffsetX(windowWidth / 4 - TITLE_PADDING)
      .title(d => d.value)
      .ordering(d => GAD_PHQ_ORDERING[d.key])
      .xAxis()
      .ticks(4);

    gadChart.render();
    // #endregion

    // #region moca
    const mocaDimension = ndx.dimension(d => d.mocaScoreLabel || EXCLUDE_STRING_VALUE);
    const mocaGroup = mocaDimension.group().reduceCount();

    mocaChart
      .dimension(mocaDimension)
      .group(removeExcludedData(mocaGroup))
      .width(windowWidth / 4)
      .height(200)
      .elasticX(true)
      .ordinalColors(colors)
      .renderTitleLabel(true)
      .titleLabelOffsetX(windowWidth / 4 - TITLE_PADDING)
      .title(d => d.value)
      .ordering(d => MOCA_ORDERING[d.key])
      .xAxis()
      .ticks(4);

    mocaChart.render();
    // #endregion

    // #region phq
    const phqDimension = ndx.dimension(d => d.phqScoreLabel || EXCLUDE_STRING_VALUE);
    const phqGroup = phqDimension.group().reduceCount();

    phqChart
      .dimension(phqDimension)
      .group(removeExcludedData(phqGroup))
      .width(windowWidth / 4)
      .ordinalColors(colors)
      .height(200)
      .elasticX(true)
      .renderTitleLabel(true)
      .titleLabelOffsetX(windowWidth / 4 - TITLE_PADDING)
      .title(d => d.value)
      .ordering(d => GAD_PHQ_ORDERING[d.key])
      .xAxis()
      .ticks(4);

    phqChart.render();
    // #endregion

    // #region by age
    const ageDimension = ndx.dimension(d => {
      if (d.encounterType === 'patient') {
        return isString(d.ageBucket) ? d.ageBucket : 'Unknown';
      }

      return EXCLUDE_STRING_VALUE;
    });
    const ageGroup = uniqueMrn(ageDimension.group());

    ageBucketChart
      .width(windowWidth / 4)
      .height(200)
      .elasticX(true)
      .dimension(ageDimension)
      .group(removeExcludedData(ageGroup))
      .ordinalColors(colors)
      .valueAccessor(d => d.value.exceptionCount)
      .ordering(d => -d.value.exceptionCount)
      .renderTitleLabel(true)
      .titleLabelOffsetX(windowWidth / 4 - TITLE_PADDING)
      .title(d => d.value.exceptionCount)
      .xAxis()
      .ticks(4);

    ageBucketChart.render();
    // #endregion

    // #region by diagnosis
    const diagnosisDimension = ndx.dimension(d => d.diagnosisType || EXCLUDE_STRING_VALUE);
    const diagnosisGroup = uniqueMrn(diagnosisDimension.group());

    diagnosisChart
      .width(windowWidth / 4)
      .height(200)
      .elasticX(true)
      .dimension(diagnosisDimension)
      .group(removeExcludedData(diagnosisGroup))
      .ordinalColors(colors)
      .valueAccessor(d => d.value.exceptionCount)
      .ordering(d => -d.value.exceptionCount)
      .renderTitleLabel(true)
      .titleLabelOffsetX(windowWidth / 4 - TITLE_PADDING)
      .title(d => d.value.exceptionCount)
      .xAxis()
      .ticks(4);

    diagnosisChart.render();
    // #endregion

    // #region by stage
    const stageDimension = ndx.dimension(d => {
      if (d.encounterType === 'patient') {
        return d.diagnosisStage || 'N/A';
      }

      return EXCLUDE_STRING_VALUE;
    });
    const stageGroup = uniqueMrn(stageDimension.group());

    stageChart
      .width(windowWidth / 4)
      .height(200)
      .elasticX(true)
      .dimension(stageDimension)
      .group(removeExcludedData(stageGroup))
      .ordinalColors(colors)
      .valueAccessor(d => d.value.exceptionCount)
      .ordering(d => -d.value.exceptionCount)
      .renderTitleLabel(true)
      .titleLabelOffsetX(windowWidth / 4 - TITLE_PADDING)
      .title(d => d.value.exceptionCount)
      .xAxis()
      .ticks(4);

    stageChart.render();
    // #endregion

    // #region by research
    const researchDimension = ndx.dimension(d => {
      if (isBoolean(d.research)) {
        return d.research ? 'Research' : 'Non-research';
      }

      return EXCLUDE_STRING_VALUE;
    });
    const researchGroup = uniqueMrn(researchDimension.group());

    researchChart
      .width(windowWidth / 4)
      .height(200)
      .elasticX(true)
      .dimension(researchDimension)
      .group(removeExcludedData(researchGroup))
      .ordinalColors(colors)
      .valueAccessor(d => d.value.exceptionCount)
      .ordering(d => -d.value.exceptionCount)
      .renderTitleLabel(true)
      .titleLabelOffsetX(windowWidth / 4 - TITLE_PADDING)
      .title(d => d.value.exceptionCount)
      .xAxis()
      .ticks(4);

    researchChart.render();
    // #endregion

    // #region by encounter type
    const encounterTypeDimension = ndx.dimension(d => d.formattedEncounterType);
    const encounterTypeGroup = encounterTypeDimension
      .group()
      .reduceSum(d => (d.encounterType === 'other' ? 1 : d.parsedNumberOfTasks));

    encounterTypeChart
      .width(windowWidth / 4)
      .height(200)
      .elasticX(true)
      .dimension(encounterTypeDimension)
      .group(encounterTypeGroup)
      .ordinalColors(colors)
      .renderTitleLabel(true)
      .titleLabelOffsetX(windowWidth / 4 - TITLE_PADDING)
      .title(d => d.value)
      .xAxis()
      .ticks(4);

    encounterTypeChart.render();
    // #endregion

    // #region by assessment tool
    const testDimension = ndx.dimension(d => d.tests as any, true);
    const testGroup = testDimension.group();

    testChart
      .width(windowWidth / 4)
      .height(200)
      .elasticX(true)
      .ordinalColors(colors)
      .dimension(testDimension)
      .group(testGroup)
      .renderTitleLabel(true)
      .titleLabelOffsetX(windowWidth / 4 - TITLE_PADDING)
      .title(d => d.value);

    testChart.render();
    // #endregion

    // #region by limited-english proficiency
    const limitedEnglishProficiencyDimension = ndx.dimension(d => {
      if (isBoolean(d.limitedEnglishProficiency)) {
        return d.limitedEnglishProficiency ? 'LEP' : 'Non-LEP';
      }

      return EXCLUDE_STRING_VALUE;
    });
    const limitedEnglishProficiencyGroup = uniqueMrn(limitedEnglishProficiencyDimension.group());

    limitedEnglishProficiencyChart
      .width(windowWidth / 4)
      .height(200)
      .elasticX(true)
      .ordinalColors(colors)
      .dimension(limitedEnglishProficiencyDimension)
      .group(removeExcludedData(limitedEnglishProficiencyGroup))
      .valueAccessor(d => d.value.exceptionCount)
      .ordering(d => -d.value.exceptionCount)
      .renderTitleLabel(true)
      .titleLabelOffsetX(windowWidth / 4 - TITLE_PADDING)
      .title(d => d.value.exceptionCount)
      .xAxis()
      .ticks(4);

    limitedEnglishProficiencyChart.render();
    // #endregion

    // #region by other category
    const otherCategoryDimension = ndx.dimension(d =>
      d.activity ? OTHER_FIELD_MAPPING[d.activity] : EXCLUDE_STRING_VALUE
    );

    const otherCategoryGroup = otherCategoryDimension.group();
    const otherCategoryTimeGroup = otherCategoryDimension
      .group()
      .reduceSum(d => parseInt(d.timeSpent, 10) / 60);

    otherCategoryChart
      .width(windowWidth / 4)
      .height(200)
      .elasticX(true)
      .ordinalColors(colors)
      .dimension(otherCategoryDimension)
      .group(removeExcludedData(otherCategoryGroup))
      .ordinalColors(colors)
      .renderTitleLabel(true)
      .titleLabelOffsetX(windowWidth / 4 - TITLE_PADDING)
      .title(d => d.value)
      .xAxis()
      .ticks(5);

    otherCategoryChart.render();

    otherCategoryTimeChart
      .width(windowWidth / 4)
      .height(200)
      .elasticX(true)
      .ordinalColors(colors)
      .dimension(otherCategoryDimension)
      .group(removeExcludedData(otherCategoryTimeGroup))
      .ordinalColors(colors)
      .renderTitleLabel(true)
      .titleLabelOffsetX(windowWidth / 4 - TITLE_PADDING)
      .title(d => d3.format('.1~f')(d.value))
      .xAxis()
      .ticks(5);

    otherCategoryTimeChart.render();
    // #endregion

    // #region by social worker
    const userDimension = ndx.dimension(d => usernameToName(d.username));
    const userGroup = userDimension.group().reduceSum(d => d.parsedNumberOfTasks);

    userChart
      .width(windowWidth / 3)
      .height(600)
      .elasticX(true)
      .ordinalColors(colors)
      .dimension(userDimension)
      .group(userGroup)
      .renderTitleLabel(true)
      .titleLabelOffsetX(windowWidth / 3 - TITLE_PADDING)
      .title(d => d.value)
      .xAxis()
      .ticks(4);

    userChart.render();
    // #endregion

    // #region by doctor
    const doctorDimension = ndx.dimension(d => d.doctorPrimary);
    const doctorGroup = uniqueMrn(doctorDimension.group());

    doctorChart
      .width(windowWidth / 2)
      .height(1800)
      .elasticX(true)
      .ordinalColors(colors)
      .dimension(doctorDimension)
      .valueAccessor(d => d.value.exceptionCount)
      .ordering(d => -d.value.exceptionCount)
      .group(removeExcludedData(doctorGroup))
      .renderTitleLabel(true)
      .titleLabelOffsetX(windowWidth / 2 - TITLE_PADDING)
      .title(d => d.value.exceptionCount);

    doctorChart.render();
    // #endregion

    // #region by intervention
    const interventionDimension = ndx.dimension(d => d.interventions as any, true);
    const interventionGroup = interventionDimension.group();

    interventionChart
      .width(windowWidth / 2)
      .height(1800)
      .elasticX(true)
      .ordinalColors(colors)
      .dimension(interventionDimension)
      .group(interventionGroup)
      .renderTitleLabel(true)
      .titleLabelOffsetX(windowWidth / 2 - TITLE_PADDING)
      .title(d => d.value);

    interventionChart.render();
    // #endregion

    // #region by location
    const locationDimension = ndx.dimension(d => (d.location ? d.location : EXCLUDE_STRING_VALUE));
    const locationGroup = locationDimension.group().reduceSum(d => d.parsedNumberOfTasks);

    locationChart
      .width(windowWidth / 3)
      .height(300)
      .elasticX(true)
      .ordinalColors(colors)
      .dimension(locationDimension)
      .group(removeExcludedData(locationGroup))
      .renderTitleLabel(true)
      .titleLabelOffsetX(windowWidth / 3 - TITLE_PADDING)
      .title(d => d.value);

    locationChart.render();
    // #endregion

    // #region by clinic
    const clinicDimension = ndx.dimension(d => d.clinic || EXCLUDE_STRING_VALUE);
    const clinicGroup = clinicDimension.group().reduceSum(d => d.parsedNumberOfTasks);

    clinicChart
      .width(windowWidth / 3)
      .height(600)
      .elasticX(true)
      .dimension(clinicDimension)
      .ordinalColors(colors)
      .group(removeExcludedData(clinicGroup))
      .renderTitleLabel(true)
      .titleLabelOffsetX(windowWidth / 3 - TITLE_PADDING)
      .title(d => d.value);

    clinicChart.render();
    // #endregion
  }

  render() {
    return (
      <div className={this.state.hideSocialWorkers ? 'hide-social-workers' : ''}>
        {this.state.loading && (
          <Dimmer active>
            <Loader size="large" />
          </Dimmer>
        )}

        <Modal open={!!this.state.screenshotData}>
          <Modal.Header>Screenshot</Modal.Header>

          <Modal.Content>
            <Container textAlign="center">
              <img alt="Screenshot" className="screenshot" src={this.state.screenshotData} />
            </Container>
          </Modal.Content>

          <Modal.Actions>
            <Button
              onClick={() => this.setState({ screenshotData: null })}
              positive
              content="Close"
            />
          </Modal.Actions>
        </Modal>

        <div>
          <Button onClick={() => this.props.onComplete()}>Back</Button>

          <Button onClick={() => window.print()}>Print</Button>

          <Button
            onClick={async () => {
              const images = [];
              const height = document.scrollingElement.scrollHeight;
              const widthWithoutScrollbars = document.body.scrollWidth;

              for (let y = 0; y < height; y += window.innerHeight) {
                window.scrollTo(0, y);

                await sleep(250);

                // were we able to scroll the full amount?
                const difference = y - window.scrollY;

                if (difference > 0) {
                  images.push(await screenshot(difference));
                } else {
                  images.push(await screenshot());
                }
              }

              window.scrollTo(0, 0);

              this.setState({ loading: true });

              const pngs = images.map(image => typedArrayToBuffer(image.toPNG()));
              const merged = await mergeImg(pngs, { direction: true });

              merged.crop(0, 0, widthWithoutScrollbars * 2, merged.bitmap.height);

              merged.getBase64('image/png', (err, screenshotData) => {
                this.setState({ loading: false, screenshotData });
              });
            }}
          >
            Screenshot
          </Button>
        </div>

        <Statistic.Group widths="6">
          <Statistic>
            <Statistic.Value>
              <span id="total-tasks" />
            </Statistic.Value>

            <Statistic.Label>Total tasks</Statistic.Label>
          </Statistic>

          <Statistic>
            <Statistic.Value>
              <span id="average-minutes-per-entry" />
            </Statistic.Value>

            <Statistic.Label>Average minutes/entry</Statistic.Label>
          </Statistic>

          <Statistic>
            <Statistic.Value>
              <span id="average-tasks-per-entry" />
            </Statistic.Value>

            <Statistic.Label>Average tasks/entry</Statistic.Label>
          </Statistic>

          <Statistic>
            <Statistic.Value>
              <span id="average-tasks" />
            </Statistic.Value>

            <Statistic.Label>Average tasks/patient</Statistic.Label>
          </Statistic>

          <Statistic>
            <Statistic.Value>
              <span id="average-time" />
            </Statistic.Value>

            <Statistic.Label>Average minutes/patient</Statistic.Label>
          </Statistic>

          <Statistic>
            <Statistic.Value>
              <span id="unique-patients" />
            </Statistic.Value>

            <Statistic.Label>Unique Patients (MRNs)</Statistic.Label>
          </Statistic>
        </Statistic.Group>

        <br />

        <a className="reset" onClick={this.handleReset}>
          Reset filters
        </a>

        <br />

        <div id="encounter-date-chart">
          <strong>Tasks by Month</strong>
          <div className="clear" />
        </div>

        <div id="number-of-tasks-chart">
          <strong>Number of Tasks by Weekday</strong>
          <div className="clear" />
        </div>

        <div id="number-of-interventions-chart">
          <strong>Number of Interventions per Entry</strong>
          <div className="clear" />
        </div>

        <div id="time-chart">
          <strong>Time Spent per Entry</strong>
          <div className="clear" />
        </div>

        <div id="test-chart">
          <strong>Tests Given</strong>
          <div className="clear" />
        </div>

        <div id="phq-chart">
          <strong>PHQ Scores</strong>
          <div className="clear" />
        </div>

        <div id="gad-chart">
          <strong>GAD Scores</strong>
          <div className="clear" />
        </div>

        <div id="moca-chart">
          <strong>MOCA Scores</strong>
          <div className="clear" />
        </div>

        <div id="age-chart">
          <strong>Age (unique MRNs)</strong>
          <div className="clear" />
        </div>

        <div id="diagnosis-chart">
          <strong>Diagnosis Type (unique MRNs)</strong>
          <div className="clear" />
        </div>

        <div id="stage-chart">
          <strong>Stage (unique MRNs)</strong>
          <div className="clear" />
        </div>

        <div id="research-chart">
          <strong>Research (unique MRNs)</strong>
          <div className="clear" />
        </div>

        <div id="encounter-type-chart">
          <strong>Tasks per Type</strong>
          <div className="clear" />
        </div>

        <div id="limited-english-proficiency-chart">
          <strong>English Proficiency (unique MRNs)</strong>
          <div className="clear" />
        </div>

        <div id="other-category-chart">
          <strong>Other category (entries)</strong>
          <div className="clear" />
        </div>

        <div id="other-category-time-chart">
          <strong>Other category (hours)</strong>
          <div className="clear" />
        </div>

        <div className="clear" />

        <div>
          <div id="location-chart">
            <strong>Tasks per Location</strong>
            <div className="clear" />
          </div>

          <div id="clinic-chart">
            <strong>Tasks per Clinic</strong>
            <div className="clear" />
          </div>

          <div id="user-chart">
            <strong>
              Tasks per Social Worker &nbsp;&nbsp;&nbsp;
              <Checkbox
                label="Hide"
                onChange={(e, data) => this.setState({ hideSocialWorkers: data.checked })}
              />
            </strong>
            <div className="clear" />
          </div>

          <div className="clear" />
        </div>

        <div id="doctor-chart">
          <strong>Primary Provider (unique MRNs)</strong>
          <div className="clear" />
        </div>

        <div id="intervention-chart">
          <strong>Intervention (entries)</strong>
          <div className="clear" />
        </div>
      </div>
    );
  }
}
