window.edittable = window.edittable || {};

(function (edittable) {
    'use strict';

    QUnit.module('Tests for edittable.addRowToMeta');
    QUnit.test('Add one row to the top', assert => {
        const meta = [
            [
                { 'tag': 'th', 'colspan': 1, 'rowspan': 1 },
                { 'tag': 'th', 'colspan': 1, 'rowspan': 1 }
            ],
            [
                { 'tag': 'td', 'colspan': 1, 'rowspan': 1 },
                { 'tag': 'td', 'colspan': 1, 'rowspan': 1 }
            ]
        ];
        const actual_result = edittable.addRowToMeta(0,1,meta);
        const expected_result = [
            [
                {
                    'colspan': 1,
                    'rowspan': 1
                },
                {
                    'colspan': 1,
                    'rowspan': 1
                }
            ],
            [
                {
                    'colspan': 1,
                    'rowspan': 1,
                    'tag': 'th'
                },
                {
                    'colspan': 1,
                    'rowspan': 1,
                    'tag': 'th'
                }
            ],
            [
                {
                    'colspan': 1,
                    'rowspan': 1,
                    'tag': 'td'
                },
                {
                    'colspan': 1,
                    'rowspan': 1,
                    'tag': 'td'
                }
            ]
        ];
        assert.deepEqual(actual_result, expected_result);
    });
}(window.edittable));
