var edittable = edittable || {};

(function (edittable) {
    "use strict";

QUnit.module( "Tests for edittable.moveRow and edittable.moveCol" );
QUnit.test("edittable.moveRow 0 to 1", function(assert) {
    var meta = [['a','b'],['c','d'],['e','f']];
    var data = [['a','b'],['c','d'],['e','f']];
    edittable.moveRow(0,1,data);
    edittable.moveRow(0,1,meta);
    var expected_meta = [['c','d'],['a','b'],['e','f']];
    var expected_data = [['c','d'],['a','b'],['e','f']];
    assert.deepEqual(meta, expected_meta);
    assert.deepEqual(data, expected_data);
});

QUnit.test("edittable.moveRow 0 to 2", function(assert) {
    var meta = [['a','b'],['c','d'],['e','f']];
    var data = [['a','b'],['c','d'],['e','f']];
    edittable.moveRow(0,2,data);
    edittable.moveRow(0,2,meta);
    var expected_meta = [['c','d'],['e','f'],['a','b']];
    var expected_data = [['c','d'],['e','f'],['a','b']];
    assert.deepEqual(meta, expected_meta);
    assert.deepEqual(data, expected_data);
});

QUnit.test("edittable.moveRow 1 to 2", function(assert) {
    var meta = [['a','b'],['c','d'],['e','f']];
    var data = [['a','b'],['c','d'],['e','f']];
    edittable.moveRow(1,2,data);
    edittable.moveRow(1,2,meta);
    var expected_meta = [['a','b'],['e','f'],['c','d']];
    var expected_data = [['a','b'],['e','f'],['c','d']];
    assert.deepEqual(meta, expected_meta);
    assert.deepEqual(data, expected_data);
});

QUnit.test("edittable.moveRow 2 to 1", function(assert) {
    var meta = [['a','b'],['c','d'],['e','f']];
    var data = [['a','b'],['c','d'],['e','f']];
    edittable.moveRow(2,1,data);
    edittable.moveRow(2,1,meta);
    var expected_meta = [['a','b'],['e','f'],['c','d']];
    var expected_data = [['a','b'],['e','f'],['c','d']];
    assert.deepEqual(meta, expected_meta);
    assert.deepEqual(data, expected_data);
});

QUnit.test("edittable.moveRow 2 to 0", function(assert) {
    var meta = [['a','b'],['c','d'],['e','f']];
    var data = [['a','b'],['c','d'],['e','f']];
    edittable.moveRow(2,0,data);
    edittable.moveRow(2,0,meta);
    var expected_meta = [['e','f'],['a','b'],['c','d']];
    var expected_data = [['e','f'],['a','b'],['c','d']];
    assert.deepEqual(meta, expected_meta);
    assert.deepEqual(data, expected_data);
});

QUnit.test("edittable.moveRow 1 to 0", function(assert) {
    var meta = [['a','b'],['c','d'],['e','f']];
    var data = [['a','b'],['c','d'],['e','f']];
    edittable.moveRow(1,0,data);
    edittable.moveRow(1,0,meta);
    var expected_meta = [['c','d'],['a','b'],['e','f']];
    var expected_data = [['c','d'],['a','b'],['e','f']];
    assert.deepEqual(meta, expected_meta);
    assert.deepEqual(data, expected_data);
});

QUnit.test("edittable.moveCol 0 to 1", function(assert) {
    var meta = [['a','b','c'],['d','e','f'],['g','h', 'i']];
    var data = [['a','b','c'],['d','e','f'],['g','h', 'i']];
    edittable.moveCol(0,1,data);
    edittable.moveCol(0,1,meta);
    var expected_meta = [['b','a','c'],['e','d','f'],['h','g', 'i']];
    var expected_data = [['b','a','c'],['e','d','f'],['h','g', 'i']];
    assert.deepEqual(meta, expected_meta);
    assert.deepEqual(data, expected_data);
});

QUnit.test("edittable.moveCol 0 to 2", function(assert) {
    var meta = [['a','b','c'],['d','e','f'],['g','h', 'i']];
    var data = [['a','b','c'],['d','e','f'],['g','h', 'i']];
    edittable.moveCol(0,2,data);
    edittable.moveCol(0,2,meta);
    var expected_meta = [['b','c','a'],['e','f','d'],['h','i', 'g']];
    var expected_data = [['b','c','a'],['e','f','d'],['h','i', 'g']];
    assert.deepEqual(meta, expected_meta);
    assert.deepEqual(data, expected_data);
});

QUnit.test("edittable.moveCol 1 to 2", function(assert) {
    var meta = [['a','b','c'],['d','e','f'],['g','h', 'i']];
    var data = [['a','b','c'],['d','e','f'],['g','h', 'i']];
    edittable.moveCol(1,2,data);
    edittable.moveCol(1,2,meta);
    var expected_meta = [['a','c','b'],['d','f','e'],['g','i', 'h']];
    var expected_data = [['a','c','b'],['d','f','e'],['g','i', 'h']];
    assert.deepEqual(meta, expected_meta);
    assert.deepEqual(data, expected_data);
});

QUnit.test("edittable.moveCol 1 to 0", function(assert) {
    var meta = [['a','b','c'],['d','e','f'],['g','h', 'i']];
    var data = [['a','b','c'],['d','e','f'],['g','h', 'i']];
    edittable.moveCol(1,0,data);
    edittable.moveCol(1,0,meta);
    var expected_meta = [['b','a','c'],['e','d','f'],['h','g', 'i']];
    var expected_data = [['b','a','c'],['e','d','f'],['h','g', 'i']];
    assert.deepEqual(meta, expected_meta);
    assert.deepEqual(data, expected_data);
});

QUnit.test("edittable.moveCol 2 to 0", function(assert) {
    var meta = [['a','b','c'],['d','e','f'],['g','h', 'i']];
    var data = [['a','b','c'],['d','e','f'],['g','h', 'i']];
    edittable.moveCol(2,0,data);
    edittable.moveCol(2,0,meta);
    var expected_meta = [['c','a','b'],['f','d','e'],['i','g', 'h']];
    var expected_data = [['c','a','b'],['f','d','e'],['i','g', 'h']];
    assert.deepEqual(meta, expected_meta);
    assert.deepEqual(data, expected_data);
});

QUnit.test("edittable.moveCol 2 to 1", function(assert) {
    var meta = [['a','b','c'],['d','e','f'],['g','h', 'i']];
    var data = [['a','b','c'],['d','e','f'],['g','h', 'i']];
    edittable.moveCol(2,1,data);
    edittable.moveCol(2,1,meta);
    var expected_meta = [['a','c','b'],['d','f','e'],['g','i', 'h']];
    var expected_data = [['a','c','b'],['d','f','e'],['g','i', 'h']];
    assert.deepEqual(meta, expected_meta);
    assert.deepEqual(data, expected_data);
});

}(edittable));
