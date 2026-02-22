import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import { fixupPluginRules } from '@eslint/compat';
import globals from 'globals';
import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-plugin-prettier/recommended';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactPerf from 'eslint-plugin-react-perf';
import sortImports from '@j4cobi/eslint-plugin-sort-imports';
import tseslint from 'typescript-eslint';

const __dirname = dirname(fileURLToPath(import.meta.url));

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default tseslint.config(
  ...compat.extends('airbnb'),

  js.configs.recommended,
  tseslint.configs.recommended,

  // should be last
  prettierConfig,

  {
    ignores: [
      'out/**',
      'release/**',
    ],
  },

  {
    plugins: {
      'react-hooks': fixupPluginRules(reactHooks),
      'react-perf': reactPerf,
      'sort-imports': sortImports,
      prettier,
      react,
    },

    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },

    settings: {
      react: { version: 'detect' },
    },

    rules: {
      'array-callback-return': 'off',
      'arrow-body-style': 'off',
      'class-methods-use-this': 'off',
      'consistent-return': 'off',
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
          ignorePropertyModificationsFor: ['evt'],
        },
      ],
      'no-plusplus': 'off',
      'no-return-assign': 'off',
      'no-underscore-dangle': 'off',
      'no-use-before-define': 'off',
      'no-useless-constructor': 'off',
      'prettier/prettier': ['error', { singleQuote: true, printWidth: 99, endOfLine: 'auto' }],

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
      'no-shadow': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-shadow': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-require-imports': 'off',

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
      'react/default-props-match-prop-types': 'off',

      // react-perf
      'react-perf/jsx-no-new-object-as-prop': 'warn',
      'react-perf/jsx-no-new-array-as-prop': 'warn',
      'react-perf/jsx-no-new-function-as-prop': 'warn',
      'react-perf/jsx-no-jsx-as-prop': 'warn',

      // react-hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      'sort-imports/sort-imports': [
        'error',
        { ignoreCase: true, memberSyntaxSortOrder: ['none', 'all', 'single', 'multiple'] },
      ],
    },
  },

  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      'no-undef': 'off',
    },
  },
);
