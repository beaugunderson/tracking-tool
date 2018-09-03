module.exports = {
  root: true,

  env: {
    browser: true,
    electron: true,
    node: true
  },

  parser: 'babel-eslint',

  plugins: ['filenames', 'flowtype', 'import', 'prettier', 'react', 'react-perf'],

  extends: [
    'airbnb',
    'plugin:flowtype/recommended',
    'prettier',
    'prettier/flowtype',
    'prettier/react'
  ],

  settings: {
    flowtype: {
      onlyFilesWithFlowAnnotation: true
    }
  },

  rules: {
    'array-callback-return': 'off',
    'arrow-body-style': 'off',
    'arrow-parens': 'off',
    'class-methods-use-this': 'off',
    'comma-dangle': 'off',
    'consistent-return': 'off',
    'filenames/match-exported': 'error',
    'import/default': 'error',
    'import/first': 'off',
    'import/named': 'error',
    'import/newline-after-import': 'warn',
    'import/no-cycle': 'off',
    'import/no-extraneous-dependencies': 'off',
    'import/no-named-as-default-member': 'error',
    'import/no-named-as-default': 'error',
    'import/no-unresolved': 'off',
    'import/order': 'off',
    'import/prefer-default-export': 'off',
    'lines-between-class-members': 'off',
    'no-case-declarations': 'off',
    'no-cond-assign': ['error', 'except-parens'],
    'no-param-reassign': [
      'error',
      {
        props: true,
        // allow reassigning evt.target.value
        ignorePropertyModificationsFor: ['evt']
      }
    ],
    'no-plusplus': 'off',
    'no-return-assign': 'off',
    'no-underscore-dangle': 'off',
    'no-use-before-define': 'off',
    'no-useless-constructor': 'off',
    'prettier/prettier': ['error', { singleQuote: true, printWidth: 99 }],

    // override this from airbnb's guide specifically to allow for..of loops
    'no-restricted-syntax': [
      'error',
      {
        selector: 'ForInStatement',
        message:
          'for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.'
      },
      {
        selector: 'LabeledStatement',
        message:
          'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand'
      },
      {
        selector: 'WithStatement',
        message:
          '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.'
      }
    ],

    // flowtype
    'flowtype/define-flow-type': 'warn',
    'flowtype/use-flow-type': 'warn',
    'flowtype/no-weak-types': 'warn',

    // JSX
    'jsx-a11y/anchor-is-valid': 'off',
    'jsx-a11y/click-events-have-key-events': 'off',
    'jsx-a11y/href-no-hash': 'off',
    'jsx-a11y/img-has-alt': 'off',
    'jsx-a11y/label-has-for': 'off',
    'jsx-a11y/no-noninteractive-element-interactions': 'warn',
    'jsx-a11y/no-static-element-interactions': 'off',
    'jsx-a11y/tabindex-no-positive': 'off',
    'react/jsx-filename-extension': 'off',
    // important for speed
    'react/jsx-no-bind': 'error',
    'react/jsx-space-before-closing': 'off',

    // React
    'react/destructuring-assignment': 'off',
    'react/no-array-index-key': 'off',
    'react/no-danger': 'off',
    'react/no-did-mount-set-state': 'off',
    'react/no-find-dom-node': 'off',
    'react/no-multi-comp': 'off',
    'react/no-unused-prop-types': 'off',
    'react/no-unused-state': 'warn',
    'react/prefer-stateless-function': 'off',
    'react/require-default-props': 'off',
    'react/sort-comp': 'off',
    'react/sort-prop-types': ['warn', { ignoreCase: true }],

    //react-perf
    'react-perf/jsx-no-new-object-as-prop': 'warn',
    'react-perf/jsx-no-new-array-as-prop': 'warn',
    'react-perf/jsx-no-new-function-as-prop': 'warn',
    'react-perf/jsx-no-jsx-as-prop': 'warn',

    // TODO re-enable when https'://github.com/yannickcr/eslint-plugin-react/issues/1468 is fixed
    'react/default-props-match-prop-types': 'off',

    'rulesdir/import-match-filename': 'off'
  }
};
