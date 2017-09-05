/* eslint-env qunit */

window.edittable = window.edittable || {};

(function (edittable) {
    'use strict';

    QUnit.module( 'Tests for edittable_cellArray' );
    QUnit.test('1 by 1', function(assert) {
        var selection = {
            start: {
                row: 2,
                col: 2
            },
            end: {
                row: 2,
                col: 2
            }
        };
        var actual_result = edittable.cellArray(selection);
        var expected_result = [{col:2, row:2}];
        assert.deepEqual(actual_result, expected_result);
    });

    QUnit.test('1 by 2', function(assert) {
        var selection = {
            start: {
                row: 2,
                col: 2
            },
            end: {
                row: 2,
                col: 3
            }
        };
        var actual_result = edittable.cellArray(selection);
        var expected_result = [{col:2, row:2}, {col:3, row:2}];
        assert.deepEqual(actual_result, expected_result);
    });

    QUnit.test('2 by 1', function(assert) {
        var selection = {
            start: {
                row: 2,
                col: 2
            },
            end: {
                row: 3,
                col: 2
            }
        };
        var actual_result = edittable.cellArray(selection);
        var expected_result = [{col:2, row:2}, {col:2, row:3}];
        assert.deepEqual(actual_result, expected_result);
    });

    QUnit.test('2 by 2', function(assert) {
        var selection = {
            start: {
                row: 2,
                col: 2
            },
            end: {
                row: 3,
                col: 3
            }
        };
        var actual_result = edittable.cellArray(selection);
        var expected_result = [{col:2, row:2}, {col:3, row:2},{col:2, row:3}, {col:3, row:3}];
        assert.deepEqual(actual_result, expected_result);
    });

}(window.edittable));
