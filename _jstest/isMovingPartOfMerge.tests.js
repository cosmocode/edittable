window.edittable = window.edittable || {};

(function (edittable) {
    'use strict';

    QUnit.module('Tests for edittable.isMovingPartOfMerge');

    const merges = [{row: 1, col: 0, rowspan: 1, colspan: 2}, {row: 2, col: 1, rowspan: 2, colspan: 1}];

    QUnit.test('moving a column outside of all merges', assert => {
        assert.notOk(edittable.isMovingPartOfMerge(merges, [2], 'col'));
    });

    QUnit.test('moving the first column of a merge', assert => {
        assert.ok(edittable.isMovingPartOfMerge(merges, [0], 'col'));
    });

    QUnit.test('moving a column covered by a merge', assert => {
        assert.ok(edittable.isMovingPartOfMerge(merges, [1], 'col'));
    });

    QUnit.test('moving all columns of a merge', assert => {
        assert.notOk(edittable.isMovingPartOfMerge([merges[0]], [0, 1], 'col'));
    });

    QUnit.test('moving a row covered by a merge', assert => {
        assert.ok(edittable.isMovingPartOfMerge(merges, [3], 'row'));
    });

    QUnit.test('moving a row with a merge that spans only one row', assert => {
        assert.notOk(edittable.isMovingPartOfMerge(merges, [1], 'row'));
    });

    QUnit.test('moving all rows of a merge', assert => {
        assert.notOk(edittable.isMovingPartOfMerge(merges, [2, 3], 'row'));
    });
}(window.edittable));
