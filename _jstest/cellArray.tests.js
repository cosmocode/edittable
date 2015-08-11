QUnit.test("1 by 1", function(assert) {
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
    actual_result = cellArray(selection);
    expected_result = [{col:2, row:2}];
    assert.deepEqual(actual_result, expected_result);
});

QUnit.test("1 by 2", function(assert) {
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
    actual_result = cellArray(selection);
    expected_result = [{col:2, row:2}, {col:3, row:2}];
    assert.deepEqual(actual_result, expected_result);
});

QUnit.test("2 by 1", function(assert) {
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
    actual_result = cellArray(selection);
    expected_result = [{col:2, row:2}, {col:2, row:3}];
    assert.deepEqual(actual_result, expected_result);
});

QUnit.test("2 by 2", function(assert) {
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
    actual_result = cellArray(selection);
    expected_result = [{col:2, row:2}, {col:3, row:2},{col:2, row:3}, {col:3, row:3}];
    assert.deepEqual(actual_result, expected_result);
});
