/* eslint-env qunit */

window.edittable = window.edittable || {};

(function (edittable) {
    'use strict';

    QUnit.module('Tests for edittable.addRowToMeta');
    QUnit.test('Add one row to the top', function (assert) {
        var meta = [
            [
                { 'tag': 'th', 'colspan': 1, 'rowspan': 1 },
                { 'tag': 'th', 'colspan': 1, 'rowspan': 1 }
            ],
            [
                { 'tag': 'td', 'colspan': 1, 'rowspan': 1 },
                { 'tag': 'td', 'colspan': 1, 'rowspan': 1 }
            ]
        ];
        var actual_result = edittable.addRowToMeta(0,1,meta);
        var expected_result = [
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
