import '../../node_modules/dc/dc.css';
import './Report.css';

import crossfilter from 'crossfilter2';
import * as d3 from 'd3';
import dc from 'dc';
import moment from 'moment';
import React from 'react';
import reductio from 'reductio';
import { Button, Statistic } from 'semantic-ui-react';
import { isBoolean, isNaN, isString, keys, sum, values } from 'lodash';
import {
  EXCLUDE_NUMBER_VALUE,
  EXCLUDE_STRING_VALUE,
  transform,
  TransformedPatientEncounter
} from './data';
import { USERNAMES } from '../usernames';

const DEFAULT_MARGINS = { top: 10, right: 50, bottom: 30, left: 30 };
const OUR_MARGINS = { ...DEFAULT_MARGINS, left: 55 };

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
  .exception((d: TransformedPatientEncounter) => d.mrn)
  .exceptionCount(true);

interface ReportProps {
  onComplete: () => void;
}

interface ReportState {
  windowWidth?: number;
}

export class Report extends React.Component<ReportProps, ReportState> {
  encounters?: TransformedPatientEncounter[];

  state = {
    windowWidth: null
  };

  resize = () => this.setState({ windowWidth: window.innerWidth });

  handleReset = () => {
    dc.filterAll();
    dc.redrawAll();
  };

  async componentDidMount() {
    this.resize();

    window.addEventListener('resize', this.resize);

    this.encounters = await transform();

    await this.renderCharts();
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.resize);
  }

  async componentDidUpdate() {
    await this.renderCharts();
  }

  async renderCharts() {
    const windowWidth = this.state.windowWidth - 100;

    if (!this.encounters) {
      return;
    }

    const ageBucketChart = dc.rowChart('#age-chart');
    const clinicChart = dc.rowChart('#clinic-chart');
    const diagnosisChart = dc.rowChart('#diagnosis-chart');
    const doctorChart = dc.rowChart('#doctor-chart');
    const encounterTypeChart = dc.rowChart('#encounter-type-chart');
    const encountersByDateChart = dc.barChart('#encounter-date-chart');
    const interventionChart = dc.rowChart('#intervention-chart');
    const locationChart = dc.rowChart('#location-chart');
    const dayOfWeekChart = dc.barChart('#number-of-tasks-chart');
    const numberOfInterventionsChart = dc.barChart('#number-of-interventions-chart');
    const researchChart = dc.rowChart('#research-chart');
    const stageChart = dc.rowChart('#stage-chart');
    const testChart = dc.rowChart('#test-chart');
    const timeChart = dc.barChart('#time-chart');
    const userChart = dc.rowChart('#user-chart');

    const ndx = crossfilter(this.encounters);

    const colors = ['#6baed6'];

    // #region grouped reducers
    const idKey = (d: TransformedPatientEncounter) => d._id;
    const bisect = d3.bisector(idKey);

    function add(elements: TransformedPatientEncounter[], item: TransformedPatientEncounter) {
      const pos = bisect.right(elements, idKey(item));

      elements.splice(pos, 0, item);

      return elements;
    }

    function remove(elements: TransformedPatientEncounter[], item: TransformedPatientEncounter) {
      const pos = bisect.left(elements, idKey(item));

      if (idKey(elements[pos]) === idKey(item)) {
        elements.splice(pos, 1);
      }

      return elements;
    }

    function init(): TransformedPatientEncounter[] {
      return [];
    }
    // #endregion

    // #region totals
    function renderNumber(
      selector: string,
      group: crossfilter.GroupAll<TransformedPatientEncounter, {}>,
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
      '#average-tasks-per-entry',
      ndx.groupAll().reduce(add, remove, init),
      (entries: TransformedPatientEncounter[]) => {
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
      (entries: TransformedPatientEncounter[]) => {
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
      (entries: TransformedPatientEncounter[]) => {
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
      (entries: TransformedPatientEncounter[]) => {
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
      .yAxisLabel('Tasks')
      .dimension(encounterDateDimension)
      .group(encounterDateGroup)
      .margins(OUR_MARGINS);

    encountersByDateChart.xAxis().tickFormat(d => {
      const tokens = d.split('-');
      return `${tokens[1]}/${tokens[0]}`;
    });

    encountersByDateChart.yAxis().ticks(7);

    encountersByDateChart.render();
    // #endregion

    // #region number of tasks
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
      .yAxisLabel('Tasks')
      .dimension(dayOfWeekDimension)
      .group(removeExcludedData(dayOfWeekGroup))
      .margins(OUR_MARGINS);

    dayOfWeekChart
      .xAxis()
      .ticks(7)
      .tickFormat(t => 'MTWTFSS'[t - 1]);

    dayOfWeekChart.render();
    // #endregion

    // #region number of interventions
    const numberOfInterventionsDimension = ndx.dimension(d => d.numberOfInterventions);
    const numberOfInterventionsGroup = numberOfInterventionsDimension.group();

    numberOfInterventionsChart
      .width(windowWidth / 3)
      .height(200)
      .brushOn(false)
      .elasticY(true)
      .x(d3.scaleBand())
      .xUnits(dc.units.ordinal)
      .yAxisLabel('Entries')
      .dimension(numberOfInterventionsDimension)
      .margins(OUR_MARGINS)
      .group(removeExcludedData(numberOfInterventionsGroup))
      .xAxis()
      .ticks(7);

    numberOfInterventionsChart.render();
    // #endregion

    // #region time spent
    const timeDimension = ndx.dimension(d => parseInt(d.timeSpent, 10));
    const timeGroup = timeDimension.group();

    timeChart
      .width(windowWidth / 3)
      .height(200)
      .brushOn(false)
      .elasticY(true)
      .x(d3.scaleBand())
      .xUnits(dc.units.ordinal)
      .yAxisLabel('Entries')
      .dimension(timeDimension)
      .margins(OUR_MARGINS)
      .group(timeGroup)
      .xAxis()
      .ticks(7);

    timeChart.render();
    // #endregion

    // #region by age
    const ageDimension = ndx.dimension(d =>
      isString(d.ageBucket) ? d.ageBucket : EXCLUDE_STRING_VALUE
    );
    const ageGroup = uniqueMrn(ageDimension.group());

    ageBucketChart
      .width(windowWidth / 4)
      .height(200)
      .elasticX(true)
      .dimension(ageDimension)
      .group(removeExcludedData(ageGroup))
      .valueAccessor(d => d.value.exceptionCount)
      .ordering(d => -d.value.exceptionCount)
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
      .valueAccessor(d => d.value.exceptionCount)
      .ordering(d => -d.value.exceptionCount)
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
      .valueAccessor(d => d.value.exceptionCount)
      .ordering(d => -d.value.exceptionCount)
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
      .valueAccessor(d => d.value.exceptionCount)
      .ordering(d => -d.value.exceptionCount)
      .xAxis()
      .ticks(4);

    researchChart.render();
    // #endregion

    // #region by encounter type
    const encounterTypeDimension = ndx.dimension(d => d.formattedEncounterType);
    const encounterTypeGroup = encounterTypeDimension
      .group()
      .reduceSum(d => d.parsedNumberOfTasks);

    encounterTypeChart
      .width(windowWidth / 4)
      .height(200)
      .elasticX(true)
      .dimension(encounterTypeDimension)
      .group(encounterTypeGroup)
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
      .group(testGroup);

    testChart.render();
    // #endregion

    // #region by user
    const userDimension = ndx.dimension(d => USERNAMES[d.username] || d.username);
    const userGroup = userDimension.group().reduceSum(d => d.parsedNumberOfTasks);

    userChart
      .width(windowWidth / 3)
      .height(600)
      .elasticX(true)
      .ordinalColors(colors)
      .dimension(userDimension)
      .group(userGroup)
      .xAxis()
      .ticks(4);

    userChart.render();
    // #endregion

    // #region by doctor
    const doctorDimension = ndx.dimension(d => d.doctorPrimary);
    const doctorGroup = doctorDimension.group();

    doctorChart
      .width(windowWidth / 2)
      .height(1800)
      .elasticX(true)
      .ordinalColors(colors)
      .dimension(doctorDimension)
      .group(removeExcludedData(doctorGroup));

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
      .group(interventionGroup);

    interventionChart.render();
    // #endregion

    // #region by location
    const locationDimension = ndx.dimension(d => d.location);
    const locationGroup = locationDimension.group().reduceSum(d => d.parsedNumberOfTasks);

    locationChart
      .width(windowWidth / 3)
      .height(300)
      .elasticX(true)
      .ordinalColors(colors)
      .dimension(locationDimension)
      .group(locationGroup);

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
      .group(removeExcludedData(clinicGroup));

    clinicChart.render();
    // #endregion
  }

  render() {
    return (
      <div>
        <div>
          <Button onClick={() => this.props.onComplete()}>Back</Button>
        </div>

        <Statistic.Group widths="5">
          <Statistic>
            <Statistic.Value>
              <span id="total-tasks" />
            </Statistic.Value>

            <Statistic.Label>Total tasks</Statistic.Label>
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

        <a className="reset" onClick={this.handleReset} style={{ cursor: 'pointer' }}>
          Reset filters
        </a>

        <br />

        <div id="encounter-date-chart">
          <strong>Tasks by Date</strong>
          <div className="clearfix" />
        </div>

        <div id="number-of-tasks-chart">
          <strong>Number of Tasks by Weekday</strong>
          <div className="clearfix" />
        </div>

        <div id="number-of-interventions-chart">
          <strong>Number of Interventions per Entry</strong>
          <div className="clearfix" />
        </div>

        <div id="time-chart">
          <strong>Time Spent per Entry</strong>
          <div className="clearfix" />
        </div>

        <div id="age-chart">
          <strong>Age (unique MRNs)</strong>
          <div className="clearfix" />
        </div>

        <div id="diagnosis-chart">
          <strong>Diagnosis Type (unique MRNs)</strong>
          <div className="clearfix" />
        </div>

        <div id="stage-chart">
          <strong>Stage (unique MRNs)</strong>
          <div className="clearfix" />
        </div>

        <div id="research-chart">
          <strong>Research (unique MRNs)</strong>
          <div className="clearfix" />
        </div>

        <div id="encounter-type-chart">
          <strong>Tasks per Type</strong>
          <div className="clearfix" />
        </div>

        <div id="test-chart">
          <strong>Tests Given</strong>
          <div className="clearfix" />
        </div>

        <div className="clearfix" />

        <div>
          <div id="clinic-chart">
            <strong>Tasks per Clinic</strong>
            <div className="clearfix" />
          </div>

          <div id="location-chart">
            <strong>Tasks per Location</strong>
            <div className="clearfix" />
          </div>

          <div id="user-chart">
            <strong>Tasks per Social Worker</strong>
            <div className="clearfix" />
          </div>

          <div className="clearfix" />
        </div>

        <div id="doctor-chart">
          <strong>Primary Provider</strong>
          <div className="clearfix" />
        </div>

        <div id="intervention-chart">
          <strong>Intervention</strong>
          <div className="clearfix" />
        </div>
      </div>
    );
  }
}
