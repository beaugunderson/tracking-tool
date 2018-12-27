import '../../node_modules/dc/dc.css';
import './Report.css';

import crossfilter from 'crossfilter2';
import * as d3 from 'd3';
import dc from 'dc';
import moment from 'moment';
import React from 'react';
import reductio from 'reductio';
import { keys, sum, values } from 'lodash';
import { transform, TransformedPatientEncounter } from './data';
import { PatientEncounter } from '../forms/PatientEncounterForm';
import { Button, Statistic } from 'semantic-ui-react';

const DEFAULT_MARGINS = { top: 10, right: 50, bottom: 30, left: 30 };
const OUR_MARGINS = { ...DEFAULT_MARGINS, left: 55 };

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
    const encountersByDateChart = dc.barChart('#encounter-date-chart');
    const interventionChart = dc.rowChart('#intervention-chart');
    const locationChart = dc.rowChart('#location-chart');
    const numberOfTasksChart = dc.barChart('#number-of-tasks-chart');
    const numberOfInterventionsChart = dc.barChart('#number-of-interventions-chart');
    const researchChart = dc.rowChart('#research-chart');
    const stageChart = dc.rowChart('#stage-chart');
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
      accessor: (d: any) => number = d => d
    ) {
      const number = dc.numberDisplay(selector);
      number
        .formatNumber(d3.format('.1~f'))
        .group(group)
        .transitionDuration(0)
        .valueAccessor(accessor);
      number.render();
    }

    renderNumber('#total-tasks', ndx.groupAll().reduceSum(d => parseInt(d.numberOfTasks, 10)));

    renderNumber(
      '#average-tasks',
      ndx.groupAll().reduce(add, remove, init),
      (entries: TransformedPatientEncounter[]) => {
        const byMrn = {};

        entries.forEach(entry => {
          if (!byMrn[entry.mrn]) {
            byMrn[entry.mrn] = 0;
          }

          byMrn[entry.mrn] += parseInt(entry.numberOfTasks, 10);
        });

        return sum(values(byMrn)) / keys(byMrn).length;
      }
    );

    renderNumber(
      '#average-time',
      ndx.groupAll().reduce(add, remove, init),
      (entries: TransformedPatientEncounter[]) => {
        const byMrn = {};

        entries.forEach(entry => {
          if (!byMrn[entry.mrn]) {
            byMrn[entry.mrn] = 0;
          }

          byMrn[entry.mrn] += parseInt(entry.timeSpent, 10);
        });

        return sum(values(byMrn)) / keys(byMrn).length;
      }
    );

    const uniqueMrn = reductio()
      .exception((d: TransformedPatientEncounter) => d.mrn)
      .exceptionCount(true);

    renderNumber(
      '#unique-patients',
      uniqueMrn(ndx.groupAll()),
      (d: { exceptionCount: number }) => d.exceptionCount
    );
    // #endregion

    // #region encounters by day
    const encounterDateDimension = ndx.dimension(d => moment(d.encounterDate).format('YYYY-MM'));
    const encounterDateGroup = encounterDateDimension.group();

    encountersByDateChart
      .width(windowWidth)
      .height(150)
      .brushOn(true)
      .x(d3.scaleBand())
      .xUnits(dc.units.ordinal)
      .elasticX(true)
      .elasticY(true)
      .yAxisLabel('Encounters')
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
    const numberOfTasksDimension = ndx.dimension((d: TransformedPatientEncounter) =>
      parseInt(d.numberOfTasks, 10)
    );
    const numberOfTasksGroup = numberOfTasksDimension.group();

    numberOfTasksChart
      .width(windowWidth / 3)
      .height(200)
      .brushOn(false)
      .x(d3.scaleBand())
      .xUnits(dc.units.ordinal)
      .elasticX(true)
      .elasticY(true)
      .yAxisLabel('Number of Tasks')
      .dimension(numberOfTasksDimension)
      .group(numberOfTasksGroup)
      .margins(OUR_MARGINS);

    numberOfTasksChart.xAxis().ticks(7);

    numberOfTasksChart.render();
    // #endregion

    // #region number of interventions
    const numberOfInterventionsDimension = ndx.dimension(
      (d: PatientEncounter) => d.numberOfInterventions
    );
    const numberOfInterventionsGroup = numberOfInterventionsDimension.group();

    numberOfInterventionsChart
      .width(windowWidth / 3)
      .height(200)
      .brushOn(false)
      .elasticY(true)
      .x(d3.scaleBand())
      .xUnits(dc.units.ordinal)
      .yAxisLabel('Number of Interventions')
      .dimension(numberOfInterventionsDimension)
      .margins(OUR_MARGINS)
      .group(numberOfInterventionsGroup)
      .xAxis()
      .ticks(7);

    numberOfInterventionsChart.render();
    // #endregion

    // #region time spent
    const timeDimension = ndx.dimension((d: PatientEncounter) => parseInt(d.timeSpent, 10));
    const timeGroup = timeDimension.group();

    timeChart
      .width(windowWidth / 3)
      .height(200)
      .brushOn(false)
      .elasticY(true)
      .x(d3.scaleBand())
      .xUnits(dc.units.ordinal)
      .yAxisLabel('Time Spent')
      .dimension(timeDimension)
      .margins(OUR_MARGINS)
      .group(timeGroup)
      .xAxis()
      .ticks(7);

    timeChart.render();
    // #endregion

    // #region by age
    const ageDimension = ndx.dimension((d: PatientEncounter) => d.ageBucket);
    const ageGroup = ageDimension.group();

    ageBucketChart
      .width(windowWidth / 4)
      .height(200)
      .elasticX(true)
      .dimension(ageDimension)
      .group(ageGroup)
      .xAxis()
      .ticks(4);

    ageBucketChart.render();
    // #endregion

    // #region by diagnosis
    const diagnosisDimension = ndx.dimension((d: PatientEncounter) => d.diagnosisType);
    const diagnosisGroup = diagnosisDimension.group();

    diagnosisChart
      .width(windowWidth / 4)
      .height(200)
      .elasticX(true)
      .dimension(diagnosisDimension)
      .group(diagnosisGroup)
      .xAxis()
      .ticks(4);

    diagnosisChart.render();
    // #endregion

    // #region by stage
    const stageDimension = ndx.dimension((d: PatientEncounter) => d.diagnosisStage || 'N/A');
    const stageGroup = stageDimension.group();

    stageChart
      .width(windowWidth / 4)
      .height(200)
      .elasticX(true)
      .dimension(stageDimension)
      .group(stageGroup)
      .xAxis()
      .ticks(4);

    stageChart.render();
    // #endregion

    // #region by research
    const researchDimension = ndx.dimension((d: PatientEncounter) =>
      d.research ? 'Research' : 'Non-research'
    );
    const researchGroup = researchDimension.group();

    researchChart
      .width(windowWidth / 4)
      .height(200)
      .elasticX(true)
      .dimension(researchDimension)
      .group(researchGroup)
      .xAxis()
      .ticks(4);

    researchChart.render();
    // #endregion

    // #region by user
    const userDimension = ndx.dimension((d: PatientEncounter) => d.username);

    // TODO sum by tasks or time?
    const userGroup = userDimension.group();

    userChart
      .width(windowWidth / 3)
      .height(200)
      .elasticX(true)
      .ordinalColors(colors)
      .dimension(userDimension)
      .group(userGroup)
      .xAxis()
      .ticks(4);

    userChart.render();
    // #endregion

    // #region by doctor
    const doctorDimension = ndx.dimension((d: PatientEncounter) => d.doctorPrimary);
    const doctorGroup = doctorDimension.group();

    doctorChart
      .width(windowWidth / 2)
      .height(1800)
      .elasticX(true)
      .ordinalColors(colors)
      .dimension(doctorDimension)
      .group(doctorGroup);

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
    const locationDimension = ndx.dimension((d: PatientEncounter) => d.location);
    const locationGroup = locationDimension.group();

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
    const clinicDimension = ndx.dimension((d: PatientEncounter) => d.clinic);
    const clinicGroup = clinicDimension.group();

    clinicChart
      .width(windowWidth / 3)
      .height(600)
      .elasticX(true)
      .dimension(clinicDimension)
      .ordinalColors(colors)
      .group(clinicGroup);

    clinicChart.render();
    // #endregion
  }

  render() {
    return (
      <div>
        <div>
          <Button onClick={() => this.props.onComplete()}>Back</Button>
        </div>

        <Statistic.Group widths="4">
          <Statistic>
            <Statistic.Value>
              <span id="total-tasks" />
            </Statistic.Value>

            <Statistic.Label>Total tasks</Statistic.Label>
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

            <Statistic.Label>Unique patients by MRN</Statistic.Label>
          </Statistic>
        </Statistic.Group>

        <br />

        <a className="reset" onClick={this.handleReset} style={{ cursor: 'pointer' }}>
          Reset filters
        </a>

        <br />

        <div id="encounter-date-chart">
          <strong>Encounters by Date</strong>
          <div className="clearfix" />
        </div>

        <div id="number-of-tasks-chart">
          <strong>Number of Tasks</strong>
          <div className="clearfix" />
        </div>

        <div id="number-of-interventions-chart">
          <strong>Number of Interventions</strong>
          <div className="clearfix" />
        </div>

        <div id="time-chart">
          <strong>Time Spent</strong>
          <div className="clearfix" />
        </div>

        <div id="age-chart">
          <strong>Age</strong>
          <div className="clearfix" />
        </div>

        <div id="diagnosis-chart">
          <strong>Diagnosis Type</strong>
          <div className="clearfix" />
        </div>

        <div id="stage-chart">
          <strong>Stage</strong>
          <div className="clearfix" />
        </div>

        <div id="research-chart">
          <strong>Research</strong>
          <div className="clearfix" />
        </div>

        <div>
          <div id="clinic-chart">
            <strong>Clinic</strong>
            <div className="clearfix" />
          </div>

          <div id="location-chart">
            <strong>Location</strong>
            <div className="clearfix" />
          </div>

          <div id="user-chart">
            <strong>Social Worker</strong>
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
