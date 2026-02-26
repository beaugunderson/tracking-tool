import { constructPendingMatchGroups } from './LinkMrnReport';
import { EXCLUDE_STRING_VALUE, type TransformedEncounter } from '../../../shared/transform';

describe('constructPendingMatches', () => {
  it('should find different MRNs for the same patient', () => {
    const encounters = [
      {
        uniqueId: '1',
        formattedDateOfBirth: '01/01/2001',
        mrn: 'swedish-1',
        providenceMrn: 'providence-1',
        patientName: 'J.R. Bob Dobbs',
      },

      {
        uniqueId: '2',
        formattedDateOfBirth: '01/01/2001',
        mrn: 'swedish-1',
        providenceMrn: 'providence-1',
        patientName: 'Bob Dobbs',
      },

      {
        uniqueId: '3',
        formattedDateOfBirth: '01/01/2001',
        mrn: 'swedish-1a',
        providenceMrn: 'providence-1',
        patientName: 'Bob Dobbs',
      },

      {
        uniqueId: '4',
        formattedDateOfBirth: '01/01/2001',
        mrn: 'swedish-2',
        providenceMrn: 'providence-2',
        patientName: 'Jane J Doe',
      },

      {
        uniqueId: '5',
        formattedDateOfBirth: '01/01/2001',
        mrn: 'swedish-2',
        providenceMrn: 'providence-2',
        patientName: 'Jane Doe',
      },

      {
        uniqueId: '6',
        formattedDateOfBirth: '01/01/2001',
        mrn: 'swedish-2',
        providenceMrn: 'providence-2',
        patientName: 'Jane Doe',
      },

      {
        uniqueId: '7',
        formattedDateOfBirth: '01/01/2008',
        mrn: EXCLUDE_STRING_VALUE,
        providenceMrn: 'providence-3',
        patientName: 'Grumpy Bits',
      },

      {
        uniqueId: '8',
        formattedDateOfBirth: '01/01/2004',
        mrn: EXCLUDE_STRING_VALUE,
        providenceMrn: 'providence-4',
        patientName: 'Jon Jon',
      },

      {
        uniqueId: '9',
        formattedDateOfBirth: '01/01/2003',
        mrn: 'swedish-3',
        providenceMrn: EXCLUDE_STRING_VALUE,
        patientName: 'Jon Bits',
      },

      {
        uniqueId: '10',
        formattedDateOfBirth: '01/01/2000',
        mrn: 'swedish-4',
        providenceMrn: EXCLUDE_STRING_VALUE,
        patientName: 'Jim Grasslawn',
      },

      {
        uniqueId: '11',
        formattedDateOfBirth: '01/01/1998',
        mrn: 'swedish-5',
        providenceMrn: EXCLUDE_STRING_VALUE,
        patientName: 'Buck Challenger',
      },

      {
        uniqueId: '12',
        formattedDateOfBirth: '01/01/1998',
        mrn: 'swedish-5',
        providenceMrn: 'providence-5',
        patientName: 'Buck Challenger',
      },

      {
        uniqueId: '13',
        formattedDateOfBirth: '01/01/1998',
        mrn: EXCLUDE_STRING_VALUE,
        providenceMrn: 'providence-5',
        patientName: 'Buck Challenger',
      },
    ] as TransformedEncounter[];

    const pendingMatches = constructPendingMatchGroups(encounters);

    expect(pendingMatches).toEqual([
      {
        canonicalDateOfBirth: '01/01/2001',
        canonicalProvidenceMrn: 'providence-1',
        canonicalSwedishMrn: 'swedish-1',
        encounters: [
          {
            uniqueId: '2',
            formattedDateOfBirth: '01/01/2001',
            mrn: 'swedish-1',
            providenceMrn: 'providence-1',
            patientName: 'Bob Dobbs',
          },
          {
            uniqueId: '3',
            formattedDateOfBirth: '01/01/2001',
            mrn: 'swedish-1a',
            providenceMrn: 'providence-1',
            patientName: 'Bob Dobbs',
          },
        ],
        id: '2-3',
        type: 'same-patient-different-mrns',
      },
      {
        canonicalDateOfBirth: '01/01/2001',
        canonicalProvidenceMrn: 'providence-1',
        canonicalSwedishMrn: 'swedish-1',
        encounters: [
          {
            uniqueId: '1',
            formattedDateOfBirth: '01/01/2001',
            mrn: 'swedish-1',
            providenceMrn: 'providence-1',
            patientName: 'J.R. Bob Dobbs',
          },
          {
            uniqueId: '2',
            formattedDateOfBirth: '01/01/2001',
            mrn: 'swedish-1',
            providenceMrn: 'providence-1',
            patientName: 'Bob Dobbs',
          },
        ],
        id: '1-2',
        type: 'same-swedish-mrn-different-patients',
      },
      {
        canonicalDateOfBirth: '01/01/2001',
        canonicalProvidenceMrn: 'providence-1',
        canonicalSwedishMrn: 'swedish-1',
        encounters: [
          {
            uniqueId: '1',
            formattedDateOfBirth: '01/01/2001',
            mrn: 'swedish-1',
            providenceMrn: 'providence-1',
            patientName: 'J.R. Bob Dobbs',
          },
          {
            uniqueId: '2',
            formattedDateOfBirth: '01/01/2001',
            mrn: 'swedish-1',
            providenceMrn: 'providence-1',
            patientName: 'Bob Dobbs',
          },
          {
            uniqueId: '3',
            formattedDateOfBirth: '01/01/2001',
            mrn: 'swedish-1a',
            providenceMrn: 'providence-1',
            patientName: 'Bob Dobbs',
          },
        ],
        id: '1-2-3',
        type: 'same-providence-mrn-different-patients',
      },
    ]);
  });

  it('should find different patients for the same MRN', () => {
    const encounters = [
      // same `mrn`
      {
        uniqueId: '1',
        formattedDateOfBirth: '01/01/2001',
        mrn: 'swedish-1',
        providenceMrn: 'providence-1',
        patientName: 'Tobasco Jones',
      },

      {
        uniqueId: '2',
        formattedDateOfBirth: '01/01/1982',
        mrn: 'swedish-1',
        providenceMrn: 'providence-2',
        patientName: 'Reginald Glockenspiel',
      },

      // same `providenceMrn`
      {
        uniqueId: '3',
        formattedDateOfBirth: '01/01/1950',
        mrn: 'swedish-3',
        providenceMrn: 'providence-3',
        patientName: 'Optimus Prime',
      },

      {
        uniqueId: '4',
        formattedDateOfBirth: '01/01/1960',
        mrn: 'swedish-4',
        providenceMrn: 'providence-3',
        patientName: 'Jamberry Goose Egg',
      },

      // same `providenceMrn`, missing swedish `mrn`
      {
        uniqueId: '9',
        formattedDateOfBirth: '01/01/1930',
        providenceMrn: 'providence-8',
        patientName: 'George Jetson',
      },

      {
        uniqueId: '10',
        formattedDateOfBirth: '01/01/1940',
        providenceMrn: 'providence-8',
        patientName: 'Gibraltar Ham Rock',
      },

      // same `mrn` and `providenceMrn`
      {
        uniqueId: '5',
        formattedDateOfBirth: '01/01/1975',
        mrn: 'swedish-5',
        providenceMrn: 'providence-5',
        patientName: 'Joseph Joseph',
      },

      {
        uniqueId: '6',
        formattedDateOfBirth: '01/01/1985',
        mrn: 'swedish-5',
        providenceMrn: 'providence-5',
        patientName: 'Adam Aardvark',
      },

      // non-conflicting patients
      {
        uniqueId: '7',
        formattedDateOfBirth: '01/01/2000',
        mrn: 'swedish-6',
        providenceMrn: 'providence-6',
        patientName: 'Corduroy Jeans',
      },

      {
        uniqueId: '8',
        formattedDateOfBirth: '01/01/1960',
        mrn: 'swedish-7',
        providenceMrn: 'providence-7',
        patientName: 'Swimmy Fish',
      },
    ] as TransformedEncounter[];

    const pendingMatches = constructPendingMatchGroups(encounters);

    expect(pendingMatches).toEqual([
      // same `mrn`
      {
        canonicalDateOfBirth: '01/01/2001',
        canonicalProvidenceMrn: 'providence-1',
        canonicalSwedishMrn: 'swedish-1',
        encounters: [
          {
            uniqueId: '1',
            formattedDateOfBirth: '01/01/2001',
            mrn: 'swedish-1',
            providenceMrn: 'providence-1',
            patientName: 'Tobasco Jones',
          },

          {
            uniqueId: '2',
            formattedDateOfBirth: '01/01/1982',
            mrn: 'swedish-1',
            providenceMrn: 'providence-2',
            patientName: 'Reginald Glockenspiel',
          },
        ],
        id: '1-2',
        type: 'same-swedish-mrn-different-patients',
      },

      // same `mrn` and `providenceMrn`
      {
        canonicalDateOfBirth: '01/01/1975',
        canonicalProvidenceMrn: 'providence-5',
        canonicalSwedishMrn: 'swedish-5',
        encounters: [
          {
            uniqueId: '5',
            formattedDateOfBirth: '01/01/1975',
            mrn: 'swedish-5',
            providenceMrn: 'providence-5',
            patientName: 'Joseph Joseph',
          },

          {
            uniqueId: '6',
            formattedDateOfBirth: '01/01/1985',
            mrn: 'swedish-5',
            providenceMrn: 'providence-5',
            patientName: 'Adam Aardvark',
          },
        ],
        id: '5-6',
        type: 'same-providence-mrn-different-patients',
      },

      // same `providenceMrn`
      {
        canonicalDateOfBirth: '01/01/1950',
        canonicalProvidenceMrn: 'providence-3',
        canonicalSwedishMrn: 'swedish-3',
        encounters: [
          {
            uniqueId: '3',
            formattedDateOfBirth: '01/01/1950',
            mrn: 'swedish-3',
            providenceMrn: 'providence-3',
            patientName: 'Optimus Prime',
          },

          {
            uniqueId: '4',
            formattedDateOfBirth: '01/01/1960',
            mrn: 'swedish-4',
            providenceMrn: 'providence-3',
            patientName: 'Jamberry Goose Egg',
          },
        ],
        id: '3-4',
        type: 'same-providence-mrn-different-patients',
      },

      // same `providenceMrn`, missing swedish `mrn`
      {
        canonicalDateOfBirth: '01/01/1930',
        canonicalProvidenceMrn: 'providence-8',
        canonicalSwedishMrn: null,
        encounters: [
          {
            uniqueId: '9',
            formattedDateOfBirth: '01/01/1930',
            providenceMrn: 'providence-8',
            patientName: 'George Jetson',
          },

          {
            uniqueId: '10',
            formattedDateOfBirth: '01/01/1940',
            providenceMrn: 'providence-8',
            patientName: 'Gibraltar Ham Rock',
          },
        ],
        id: '9-10',
        type: 'same-providence-mrn-different-patients',
      },
    ]);
  });
});
