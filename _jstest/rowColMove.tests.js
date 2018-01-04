/* eslint-env qunit */
/*eslint no-magic-numbers: 0*/

window.edittable = window.edittable || {};

(function (edittable) {
    'use strict';

    QUnit.module('Tests for edittable.moveRow and edittable.moveCol');
    QUnit.test('edittable.moveRow 0 to 1', function (assert) {
        var meta = [['a', 'b'], ['c', 'd'], ['e', 'f']];
        var actual_meta = edittable.moveRow([0], 2, meta);
        var expected_meta = [['c', 'd'], ['a', 'b'], ['e', 'f']];
        assert.deepEqual(actual_meta, expected_meta);
    });


    QUnit.test('edittable.moveRow 0 to 2', function (assert) {
        var meta = [['a', 'b'], ['c', 'd'], ['e', 'f']];
        var actual_meta = edittable.moveRow([0], 3, meta);
        var expected_meta = [['c', 'd'], ['e', 'f'], ['a', 'b']];
        assert.deepEqual(actual_meta, expected_meta);
    });

    QUnit.test('edittable.moveRow 1 to 2', function (assert) {
        var meta = [['a', 'b'], ['c', 'd'], ['e', 'f']];
        var actual_meta = edittable.moveRow([1], 3, meta);
        var expected_meta = [['a', 'b'], ['e', 'f'], ['c', 'd']];
        assert.deepEqual(actual_meta, expected_meta);
    });

    QUnit.test('edittable.moveRow 2 to 1', function (assert) {
        var meta = [['a', 'b'], ['c', 'd'], ['e', 'f']];
        var actual_meta = edittable.moveRow([2], 1, meta);
        var expected_meta = [['a', 'b'], ['e', 'f'], ['c', 'd']];
        assert.deepEqual(actual_meta, expected_meta);
    });

    QUnit.test('edittable.moveRow 2 to 0', function (assert) {
        var meta = [['a', 'b'], ['c', 'd'], ['e', 'f']];
        var actual_meta = edittable.moveRow([2], 0, meta);
        var expected_meta = [['e', 'f'], ['a', 'b'], ['c', 'd']];
        assert.deepEqual(actual_meta, expected_meta);
    });

    QUnit.test('edittable.moveRow 1 to 0', function (assert) {
        var meta = [['a', 'b'], ['c', 'd'], ['e', 'f']];
        var actual_meta = edittable.moveRow([1], 0, meta);
        var expected_meta = [['c', 'd'], ['a', 'b'], ['e', 'f']];
        assert.deepEqual(actual_meta, expected_meta);
    });

    QUnit.test('edittable.moveRow [0,1] to 2', function (assert) {
        var meta = [['a', 'b'], ['c', 'd'], ['e', 'f']];
        var actual_meta = edittable.moveRow([0, 1], 3, meta);
        var expected_meta = [['e', 'f'], ['a', 'b'], ['c', 'd']];
        assert.deepEqual(actual_meta, expected_meta);
    });

    QUnit.test('edittable.moveRow [1, 2] to 0', function (assert) {
        var meta = [['a', 'b'], ['c', 'd'], ['e', 'f']];
        var actual_meta = edittable.moveRow([1, 2], 0, meta);
        var expected_meta = [['c', 'd'], ['e', 'f'], ['a', 'b']];
        assert.deepEqual(actual_meta, expected_meta);
    });

    QUnit.test('edittable.moveCol 0 to 1', function (assert) {
        var meta = [['a', 'b', 'c'], ['d', 'e', 'f'], ['g', 'h', 'i']];
        var actual_meta = edittable.moveCol([0], 2, meta);
        var expected_meta = [['b', 'a', 'c'], ['e', 'd', 'f'], ['h', 'g', 'i']];
        assert.deepEqual(actual_meta, expected_meta);
    });

    QUnit.test('edittable.moveCol 0 to 2', function (assert) {
        var meta = [['a', 'b', 'c'], ['d', 'e', 'f'], ['g', 'h', 'i']];
        var actual_meta = edittable.moveCol([0], 3, meta);
        var expected_meta = [['b', 'c', 'a'], ['e', 'f', 'd'], ['h', 'i', 'g']];
        assert.deepEqual(actual_meta, expected_meta);
    });

    QUnit.test('edittable.moveCol 1 to 2', function (assert) {
        var meta = [['a', 'b', 'c'], ['d', 'e', 'f'], ['g', 'h', 'i']];
        var actual_meta = edittable.moveCol([1], 3, meta);
        var expected_meta = [['a', 'c', 'b'], ['d', 'f', 'e'], ['g', 'i', 'h']];
        assert.deepEqual(actual_meta, expected_meta);
    });

    QUnit.test('edittable.moveCol 1 to 0', function (assert) {
        var meta = [['a', 'b', 'c'], ['d', 'e', 'f'], ['g', 'h', 'i']];
        var actual_meta = edittable.moveCol([1], 0, meta);
        var expected_meta = [['b', 'a', 'c'], ['e', 'd', 'f'], ['h', 'g', 'i']];
        assert.deepEqual(actual_meta, expected_meta);
    });

    QUnit.test('edittable.moveCol 2 to 0', function (assert) {
        var meta = [['a', 'b', 'c'], ['d', 'e', 'f'], ['g', 'h', 'i']];
        var actual_meta = edittable.moveCol([2], 0, meta);
        var expected_meta = [['c', 'a', 'b'], ['f', 'd', 'e'], ['i', 'g', 'h']];
        assert.deepEqual(actual_meta, expected_meta);
    });

    QUnit.test('edittable.moveCol 2 to 1', function (assert) {
        var meta = [['a', 'b', 'c'], ['d', 'e', 'f'], ['g', 'h', 'i']];
        var actual_meta = edittable.moveCol([2], 1, meta);
        var expected_meta = [['a', 'c', 'b'], ['d', 'f', 'e'], ['g', 'i', 'h']];
        assert.deepEqual(actual_meta, expected_meta);
    });

    QUnit.test('edittable.moveCol [0, 1] to 2', function (assert) {
        var meta = [['a', 'b', 'c'], ['d', 'e', 'f'], ['g', 'h', 'i']];
        var actual_meta = edittable.moveCol([0, 1], 3, meta);
        var expected_meta = [['c', 'a', 'b'], ['f', 'd', 'e'], ['i', 'g', 'h']];
        assert.deepEqual(actual_meta, expected_meta);
    });

    QUnit.test('edittable.moveCol [1, 2] to 0', function (assert) {
        var meta = [['a', 'b', 'c'], ['d', 'e', 'f'], ['g', 'h', 'i']];
        var actual_meta = edittable.moveCol([1, 2], 0, meta);
        var expected_meta = [['b', 'c', 'a'], ['e', 'f', 'd'], ['h', 'i', 'g']];
        assert.deepEqual(actual_meta, expected_meta);
    });
}(window.edittable));
