/* global LANG */

window.edittable = window.edittable || {};

(function (edittable) {
    'use strict';
    /**
     * create an iterable array of selected cells from the selection object
     *
     * @param {object} selection the selection object
     *
     * @returns {Array} an array of the rows/columns of the cells in the selection
     */
    edittable.cellArray = function (selection) {
        var selectionArray = [];
        for (var currentRow = selection.start.row; currentRow <= selection.end.row; currentRow += 1) {
            for (var currentCol = selection.start.col; currentCol <= selection.end.col; currentCol += 1) {
                selectionArray.push({row: currentRow, col: currentCol});
            }
        }
        return selectionArray;
    };

    /**
     * Defines our own contextMenu with custom callbacks
     *
     * @param {function} getData get the current data array
     * @param {function} getMeta get the current meta array
     * @returns {object} the context menu object
     */
    edittable.getEditTableContextMenu = function (getData, getMeta) {
        return {
            items: {
                toggle_header: {
                    name: LANG.plugins.edittable.toggle_header,
                    callback: function (key, selection) {
                        var meta = getMeta();
                        jQuery.each(edittable.cellArray(selection), function (index, cell) {
                            var col = cell.col;
                            var row = cell.row;

                            if (meta[row][col].tag && meta[row][col].tag === 'th') {
                                meta[row][col].tag = 'td';
                            } else {
                                meta[row][col].tag = 'th';
                            }
                        });
                        this.render();
                    }
                },
                align_left: {
                    name: LANG.plugins.edittable.align_left,
                    callback: function (key, selection) {
                        var meta = getMeta();
                        jQuery.each(edittable.cellArray(selection), function (index, cell) {
                            var col = cell.col;
                            var row = cell.row;
                            meta[row][col].align = 'left';
                        });
                        this.render();
                    },
                    disabled: function () {
                        var meta = getMeta();
                        var selection = this.getSelected();
                        var row = selection[0];
                        var col = selection[1];
                        return (!meta[row][col].align || meta[row][col].align === 'left');
                    }
                },
                align_center: {
                    name: LANG.plugins.edittable.align_center,
                    callback: function (key, selection) {
                        var meta = getMeta();
                        jQuery.each(edittable.cellArray(selection), function (index, cell) {
                            var col = cell.col;
                            var row = cell.row;
                            meta[row][col].align = 'center';
                        });
                        this.render();
                    },
                    disabled: function () {
                        var meta = getMeta();
                        var selection = this.getSelected();
                        var row = selection[0];
                        var col = selection[1];
                        return (meta[row][col].align && meta[row][col].align === 'center');
                    }
                },
                align_right: {
                    name: LANG.plugins.edittable.align_right,
                    callback: function (key, selection) {
                        var meta = getMeta();
                        jQuery.each(edittable.cellArray(selection), function (index, cell) {
                            var col = cell.col;
                            var row = cell.row;
                            meta[row][col].align = 'right';
                        });
                        this.render();
                    },
                    disabled: function () {
                        var meta = getMeta();
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
                     * @param {string} key key of the menu item
                     * @param {object} selection the selection object
                     *
                     * @return {void}
                     */
                    callback: function (key, selection) {
                        if (window.confirm(LANG.plugins.edittable.confirmdeleterow)) {
                            var amount = selection.end.row - selection.start.row + 1;
                            this.alter('remove_row', selection.start.row, amount);
                        }
                    },
                    /**
                     * do not show when this is the last row
                     *
                     * @return {boolean} true if the entry is to be disabled, false otherwise
                     */
                    disabled: function () {
                        var rowsInTable = this.countRows();
                        var firstSelectedRow = this.getSelected()[0];
                        var lastSelectedRow = this.getSelected()[2]; // fix magic number with destructuring once we drop IE11
                        var allRowsSelected = firstSelectedRow === 0 && lastSelectedRow === rowsInTable - 1;
                        return (rowsInTable <= 1 || allRowsSelected);
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
                     * @param {string} key key of the menu item
                     * @param {object} selection the selection object
                     *
                     * @return {void}
                     */
                    callback: function (key, selection) {
                        if (window.confirm(LANG.plugins.edittable.confirmdeletecol)) {
                            var amount = selection.end.col - selection.start.col + 1;
                            this.alter('remove_col', selection.start.col, amount);
                        }
                    },
                    /**
                     * do not show when this is the last row
                     *
                     * @return {boolean} true if the entry is to be disabled, false otherwise
                     */
                    disabled: function () {
                        var colsInTable = this.countCols();
                        var firstSelectedColumn = this.getSelected()[1];
                        var lastSelectedColumn = this.getSelected()[3]; // fix magic number with destructuring once we drop IE11
                        var allColsSelected = firstSelectedColumn === 0 && lastSelectedColumn === colsInTable - 1;
                        return (colsInTable <= 1 || allColsSelected);
                    }
                },
                col_right: {
                    name: LANG.plugins.edittable.col_right
                },
                hsep3: '---------',
                mergeCells: {
                    name: function () {
                        var sel = this.getSelected();
                        var info = this.mergeCells.mergedCellInfoCollection.getInfo(sel[0], sel[1]);
                        if (info) {
                            return '<div class="unmerge">' + LANG.plugins.edittable.unmerge_cells + '</div>';
                        } else {
                            return '<div class="merge">' + LANG.plugins.edittable.merge_cells + '</div>';
                        }
                    },

                    /**
                     * disable if only one cell is selected
                     *
                     * @return {boolean} true if the entry is to be disabled, false otherwise
                     */
                    disabled: function () {
                        var selection = this.getSelected();
                        var startRow = selection[0];
                        var startCol = selection[1];
                        var endRow = selection[2];
                        var endCol = selection[3];
                        return startRow === endRow && startCol === endCol;
                    }

                }
            }
        };
    };
}(window.edittable));
