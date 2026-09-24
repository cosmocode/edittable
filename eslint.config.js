const js = require('@eslint/js');
const globals = require('globals');
const compat = require('eslint-plugin-compat');
const jsdoc = require('eslint-plugin-jsdoc');
const stylistic = require('@stylistic/eslint-plugin');

module.exports = [
    {
        ignores: ['_jstest/run.js', 'lib/', 'node_modules/', 'eslint.config.js']
    },
    js.configs.recommended,
    compat.configs['flat/recommended'],
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'script',
            globals: {
                ...globals.browser,
                ...globals.jquery
            }
        },
        plugins: {
            jsdoc,
            '@stylistic': stylistic
        },
        rules: {
            'default-case': 'error',
            'eqeqeq': ['error', 'smart'],
            'no-magic-numbers': ['error', {
                ignoreArrayIndexes: true,
                ignore: [-1, 0, 1]
            }],
            'dot-notation': 'warn',
            'object-shorthand': ['error', 'always'],
            'prefer-const': 'error',
            'no-var': 'error',
            'no-implicit-globals': 'error',
            'no-return-assign': 'error',
            'no-throw-literal': 'error',
            'strict': ['error', 'function'],
            '@stylistic/comma-dangle': ['error', 'never'],
            '@stylistic/indent': ['error', 4],
            '@stylistic/quotes': ['error', 'single'],
            '@stylistic/linebreak-style': ['error', 'unix'],
            'jsdoc/check-param-names': 'warn',
            'jsdoc/check-types': 'warn',
            'jsdoc/require-param': 'warn',
            'jsdoc/require-param-type': 'warn',
            'jsdoc/require-returns-type': 'warn',
            'jsdoc/require-jsdoc': ['error', {
                require: {
                    FunctionDeclaration: true,
                    MethodDefinition: true,
                    ClassDeclaration: false,
                    ArrowFunctionExpression: false
                }
            }]
        }
    },
    {
        files: ['_jstest/**/*.js'],
        languageOptions: {
            globals: {
                ...globals.qunit
            }
        },
        rules: {
            'no-magic-numbers': 'off'
        }
    }
];
