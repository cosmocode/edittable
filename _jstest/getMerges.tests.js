/* eslint-env qunit */

window.edittable = window.edittable || {};

(function (edittable) {
    'use strict';

    QUnit.module( 'Tests for edittable_getMerges' );
    QUnit.test('merge 2x2', function(assert) {
        var meta = [
            [
                {
                    'tag': 'th',
                    'colspan': 1,
                    'rowspan': 1,
                    'align': 'left'
                },
                {
                    'tag': 'th',
                    'colspan': 1,
                    'rowspan': 1,
                    'align': 'left'
                },
                {
                    'tag': 'th',
                    'colspan': 1,
                    'rowspan': 1,
                    'align': 'left'
                },
                {
                    'tag': 'th',
                    'colspan': 1,
                    'rowspan': 1,
                    'align': 'left'
                }
            ],
            [
                {
                    'tag': 'td',
                    'colspan': 1,
                    'rowspan': 1,
                    'align': 'left'
                },
                {
                    'tag': 'td',
                    'colspan': 1,
                    'rowspan': 1,
                    'align': 'left'
                },
                {
                    'tag': 'td',
                    'colspan': 1,
                    'rowspan': 1,
                    'align': 'left'
                },
                {
                    'tag': 'td',
                    'colspan': 1,
                    'rowspan': 1,
                    'align': 'left'
                }
            ],
            [
                {
                    'tag': 'td',
                    'colspan': 2,
                    'rowspan': 2,
                    'align': 'left'
                },
                {
                    'hide': true,
                    'rowspan': 1,
                    'colspan': 1
                },
                {
                    'tag': 'th',
                    'colspan': 1,
                    'rowspan': 1,
                    'align': 'left'
                },
                {
                    'tag': 'td',
                    'colspan': 1,
                    'rowspan': 1,
                    'align': 'left'
                }
            ],
            [
                {
                    'hide': true,
                    'rowspan': 1,
                    'colspan': 1
                },
                {
                    'hide': true,
                    'rowspan': 1,
                    'colspan': 1
                },
                {
                    'tag': 'td',
                    'colspan': 1,
                    'rowspan': 1,
                    'align': 'left'
                },
                {
                    'tag': 'td',
                    'colspan': 1,
                    'rowspan': 1,
                    'align': 'left'
                }
            ]
        ];

        var actual_merges = edittable.getMerges(meta);
        var expected_merges = [{row:2, col:0, rowspan: 2, colspan: 2}];
        assert.deepEqual(actual_merges, expected_merges);
    });

}(window.edittable));
