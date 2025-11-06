module.exports = {
  root: true,

  env: {
    browser: true,
    jest: true,
    node: true,
  },

  parser: '@typescript-eslint/parser',

  plugins: [
    'filenames',
    'import',
    'prettier',
    'react',
    'react-perf',
    'sort-imports-es6-autofix',
    '@typescript-eslint',
  ],

  extends: ['airbnb', 'plugin:prettier/recommended'],

  rules: {
    'array-callback-return': 'off',
    'arrow-body-style': 'off',
    'class-methods-use-this': 'off',
    'consistent-return': 'off',
    'filenames/match-exported': 'error',
    'import/default': 'error',
    'import/extensions': ['warn', 'never'],
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
    'no-continue': 'off',
    'no-param-reassign': [
      'error',
      {
        props: true,
        // allow reassigning evt.target.value
        ignorePropertyModificationsFor: ['evt'],
      },
    ],
    'no-plusplus': 'off',
    'no-return-assign': 'off',
    'no-underscore-dangle': 'off',
    'no-use-before-define': 'off',
    'no-useless-constructor': 'off',
    'prettier/prettier': ['error', { singleQuote: true, printWidth: 99, edOfLine: 'auto' }],

    // override this from airbnb's guide specifically to allow for..of loops
    'no-restricted-syntax': [
      'error',
      {
        selector: 'ForInStatement',
        message:
          'for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.',
      },
      {
        selector: 'LabeledStatement',
        message:
          'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand',
      },
      {
        selector: 'WithStatement',
        message:
          '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.',
      },
    ],

    // https://github.com/typescript-eslint/typescript-eslint/issues/2471
    'no-shadow': 'off', // replaced by ts-eslint rule below
    'no-unused-vars': 'off', // replaced by ts-eslint rule below
    '@typescript-eslint/no-shadow': 'error',

    // JSX
    'jsx-a11y/anchor-is-valid': 'off',
    'jsx-a11y/click-events-have-key-events': 'off',
    'jsx-a11y/href-no-hash': 'off',
    'jsx-a11y/img-has-alt': 'off',
    'jsx-a11y/label-has-associated-control': 'off',
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
    'react/jsx-uses-react': 'off',
    'react/no-array-index-key': 'off',
    'react/no-danger': 'off',
    'react/no-did-mount-set-state': 'off',
    'react/no-find-dom-node': 'off',
    'react/no-multi-comp': 'off',
    'react/no-unused-prop-types': 'off',
    'react/no-unused-state': 'warn',
    'react/prefer-stateless-function': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/require-default-props': 'off',
    'react/sort-comp': 'off',
    'react/sort-prop-types': ['warn', { ignoreCase: true }],
    'react/state-in-constructor': ['error', 'never'],

    // react-perf
    'react-perf/jsx-no-new-object-as-prop': 'warn',
    'react-perf/jsx-no-new-array-as-prop': 'warn',
    'react-perf/jsx-no-new-function-as-prop': 'warn',
    'react-perf/jsx-no-jsx-as-prop': 'warn',

    // TODO re-enable when https'://github.com/yannickcr/eslint-plugin-react/issues/1468 is fixed
    'react/default-props-match-prop-types': 'off',

    'rulesdir/import-match-filename': 'off',

    '@typescript-eslint/no-unused-vars': 'error',

    // preferable to built in 'sort-imports' because it handles default imports better and has better auto-fix
    'sort-imports-es6-autofix/sort-imports-es6': [
      'error',
      { ignoreCase: true, memberSyntaxSortOrder: ['none', 'all', 'single', 'multiple'] },
    ],
  },
};
