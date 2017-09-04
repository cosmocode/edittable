module.exports = {
    'parserOptions': {
        'ecmaVersion': 5
    },
    'env': {
        'browser': true,
        'jquery': true
    },
    'plugins': [
        'compat'
    ],
    'extends': 'eslint:recommended',
    'rules': {
        'compat/compat': 'error',
        'valid-jsdoc': 'warn',
        'default-case': 'error',
        'eqeqeq': [
            'error',
            'smart'
        ],
        'no-magic-numbers': [
            'error',
            {
                'ignoreArrayIndexes': true,
                'ignore': [
                    -1,
                    0,
                    1
                ]
            }
        ],
        'comma-dangle': [
            'error',
            'never'
        ]
    }
};
