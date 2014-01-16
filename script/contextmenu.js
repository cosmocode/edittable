/**
 * Defines our own contextMenu with custom callbacks
 *
 * @param data array
 * @param meta array
 * @returns object
 */
function getEditTableContextMenu(data, meta) {
    return {
        items: {
            toggle_header: {
                name: LANG.plugins.edittable.toggle_header,
                callback: function (key, selection) {
                    var col = selection.start.col();
                    var row = selection.start.row();

                    if (meta[row][col].tag && meta[row][col].tag === 'th') {
                        meta[row][col].tag = 'td';
                    } else {
                        meta[row][col].tag = 'th';
                    }
                    this.render();
                }
            },
            align_left: {
                name: LANG.plugins.edittable.align_left,
                callback: function (key, selection) {
                    var col = selection.start.col();
                    var row = selection.start.row();
                    meta[row][col].align = 'left';
                    this.render();
                },
                disabled: function () {
                    var selection = this.getSelected();
                    var row = selection[0];
                    var col = selection[1];
                    return (!meta[row][col].align || meta[row][col].align === 'left');
                }
            },
            align_center: {
                name: LANG.plugins.edittable.align_center,
                callback: function (key, selection) {
                    var col = selection.start.col();
                    var row = selection.start.row();
                    meta[row][col].align = 'center';
                    this.render();
                },
                disabled: function () {
                    var selection = this.getSelected();
                    var row = selection[0];
                    var col = selection[1];
                    return (meta[row][col].align && meta[row][col].align === 'center');
                }
            },
            align_right: {
                name: LANG.plugins.edittable.align_right,
                callback: function (key, selection) {
                    var col = selection.start.col();
                    var row = selection.start.row();
                    meta[row][col].align = 'right';
                    this.render();
                },
                disabled: function () {
                    var selection = this.getSelected();
                    var row = selection[0];
                    var col = selection[1];
                    return (meta[row][col].align && meta[row][col].align === 'right');
                }
            },
            hsep1: '---------',
            row_above: {
                name: LANG.plugins.edittable.row_above
            },
            remove_row: {
                name: LANG.plugins.edittable.remove_row,
                /**
                 * The same as the default action, but with confirmation
                 *
                 * @param key
                 * @param selection
                 */
                callback: function (key, selection) {
                    if (window.confirm(LANG.plugins.edittable.confirmdeleterow)) {
                        var amount = selection.end.row() - selection.start.row() + 1;
                        this.alter("remove_row", selection.start.row(), amount);
                    }
                }
                // fixme don't delete last column
            },
            row_below: {
                name: LANG.plugins.edittable.row_below
            },
            hsep2: '---------',
            col_left: {
                name: LANG.plugins.edittable.col_left
            },
            remove_col: {
                name: LANG.plugins.edittable.remove_col,
                /**
                 * The same as the default action, but with confirmation
                 *
                 * @param key
                 * @param selection
                 */
                callback: function (key, selection) {
                    if (window.confirm(LANG.plugins.edittable.confirmdeletecol)) {
                        var amount = selection.end.col() - selection.start.col() + 1;
                        this.alter("remove_col", selection.start.col(), amount);
                    }
                }
                // fixme don't delete last row
            },
            col_right: {
                name: LANG.plugins.edittable.col_right
            },
            hsep3: '---------',
            colspan_add: {
                name: LANG.plugins.edittable.colspan_add,
                /**
                 * Increase colspan and rerender the table
                 *
                 * @param key
                 * @param selection
                 */
                callback: function (key, selection) {
                    var col = selection.start.col();
                    var row = selection.start.row();

                    if (meta[row][col].colspan) {
                        meta[row][col].colspan++;
                    } else {
                        meta[row][col].colspan = 2;
                    }

                    // copy over any data from the merged cell   fixme handle colspanned cells
                    data[row][col] += ' ' + data[row][col + 1];

                    this.render();
                },
                /**
                 * don't show when not enough space for colspan
                 *
                 * @returns {boolean}
                 */
                disabled: function () {
                    var selection = this.getSelected();
                    var row = selection[0];
                    var col = selection[1];
                    var end = this.countCols();

                    var span = meta[row][col].colspan ? meta[row][col].colspan : 1;

                    // fixme don't bump into hidden fields

                    return ((col + span + 1) > end);
                }
            },
            colspan_del: {
                name: LANG.plugins.edittable.colspan_del,
                /**
                 * Decrease colspan and rerender table
                 *
                 * @param key
                 * @param selection
                 */
                callback: function (key, selection) {
                    var col = selection.start.col();
                    var row = selection.start.row();

                    meta[row][col].colspan--;
                    this.render();
                },
                /**
                 * Make available only when colspan is set
                 *
                 * @returns {boolean}
                 */
                disabled: function () {
                    var selection = this.getSelected();
                    var row = selection[0];
                    var col = selection[1];

                    return !(meta[row][col].colspan && meta[row][col].colspan > 1);
                }
            },
            rowspan_add: {
                name: LANG.plugins.edittable.rowspan_add,
                /**
                 * Increase rowspan and rerender the table
                 *
                 * @param key
                 * @param selection
                 */
                callback: function (key, selection) {
                    var col = selection.start.col();
                    var row = selection.start.row();

                    if (meta[row][col].rowspan) {
                        meta[row][col].rowspan++;
                    } else {
                        meta[row][col].rowspan = 2;
                    }

                    // copy over any data from the merged cell  fixme handle colspanned cells
                    data[row][col] += ' ' + data[row + 1][col];

                    this.render();
                },
                /**
                 * don't show when not enough space for rowspan
                 *
                 * @returns {boolean}
                 */
                disabled: function () {
                    var selection = this.getSelected();
                    var row = selection[0];
                    var col = selection[1];
                    var end = this.countRows();

                    var span = meta[row][col].rowspan ? meta[row][col].rowspan : 1;

                    // fixme don't bump into hidden fields

                    return ((row + span + 1) > end);
                }
            },
            rowspan_del: {
                name: LANG.plugins.edittable.rowspan_del,
                /**
                 * Decrease colspan and rerender table
                 *
                 * @param key
                 * @param selection
                 */
                callback: function (key, selection) {
                    var col = selection.start.col();
                    var row = selection.start.row();

                    meta[row][col].rowspan--;
                    this.render();
                },
                /**
                 * Make available only when rowspan is set
                 *
                 * @returns {boolean}
                 */
                disabled: function () {
                    var selection = this.getSelected();
                    var row = selection[0];
                    var col = selection[1];

                    return !(meta[row][col].rowspan && meta[row][col].rowspan > 1);
                }
            }

        }
    }
}