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
                },
                /**
                 * do not show when this is the last row
                 */
                disabled: function () {
                    return (this.countRows() <= 1);
                }
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
                },
                /**
                 * do not show when this is the last row
                 */
                disabled: function () {
                    return (this.countCols() <= 1);
                }
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

                    // increase rowspan by the colspan of the cell to the right
                    meta[row][col].colspan += meta[row][col + 1].colspan;

                    // copy over any data from the merged cells
                    var colspan = meta[row][col].colspan;
                    var rowspan = meta[row][col].rowspan;
                    for (var i = 0; i < rowspan; i++) {
                        if (data[row + i][col + colspan - 1 ] != ':::') {
                            data[row][col] += ' ' + data[row + i][col + colspan - 1 ];
                        }
                    }

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

                    var rowspan = meta[row][col].rowspan;
                    var colspan = meta[row][col].colspan;

                    // no cells to merge
                    if ((col + colspan) >= end) return true;

                    // don't merge into hidden or spanned cells
                    for (var i = 0; i < rowspan; i++) {
                        if (meta[row + i][col + colspan].hide) return true;
                        if (meta[row + i][col + colspan].rowspan > 1) {
                            // we allow merge with same rowspanned cell only
                            return meta[row + i][col + colspan].rowspan != rowspan;
                        }
                    }

                    return false; // merge is fine
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

                    // increase rowspan by the rowspan of the cell below
                    meta[row][col].rowspan += meta[row + 1][col].rowspan;

                    // copy over any data from the merged cells
                    var colspan = meta[row][col].colspan;
                    var rowspan = meta[row][col].rowspan;
                    for (var i = 0; i < colspan; i++) {
                        if (data[row + rowspan - 1][col + i] != ':::') {
                            data[row][col] += ' ' + data[row + rowspan - 1][col + i];
                        }
                    }

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

                    var rowspan = meta[row][col].rowspan;
                    var colspan = meta[row][col].colspan;

                    // no cells to merge
                    if ((row + rowspan) >= end) return true;

                    // don't merge into hidden or spanned cells
                    for (var i = 0; i < colspan; i++) {
                        if (meta[row + rowspan][col + i].hide) return true;
                        if (meta[row + rowspan][col + i].colspan > 1) {
                            // we allow merge with same colspanned cell only
                            return meta[row + rowspan][col + i].colspan != colspan;
                        }
                    }

                    return false; // merge is fine
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
    };
}