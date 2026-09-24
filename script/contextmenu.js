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
     * Wrap the label of a context menu item in an element with the item's key as CSS class
     *
     * The class is used to show the item's icon.
     *
     * @param {string} key the key of the menu item
     * @param {string} label the label of the menu item
     * @returns {string} the HTML to be used as the item's name
     */
    function itemName(key, label) {
        return '<div class="' + key + '">' + label + '</div>';
    }

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
                    name: itemName('toggle_header', LANG.plugins.edittable.toggle_header),
                    callback: function (key, selection) {
                        var meta = getMeta();
                        jQuery.each(edittable.cellArray(selection[0]), function (index, cell) {
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
                    name: itemName('align_left', LANG.plugins.edittable.align_left),
                    callback: function (key, selection) {
                        var meta = getMeta();
                        jQuery.each(edittable.cellArray(selection[0]), function (index, cell) {
                            var col = cell.col;
                            var row = cell.row;
                            meta[row][col].align = 'left';
                        });
                        this.render();
                    },
                    disabled: function () {
                        var meta = getMeta();
                        var selection = this.getSelectedLast();
                        var row = selection[0];
                        var col = selection[1];
                        return (!meta[row][col].align || meta[row][col].align === 'left');
                    }
                },
                align_center: {
                    name: itemName('align_center', LANG.plugins.edittable.align_center),
                    callback: function (key, selection) {
                        var meta = getMeta();
                        jQuery.each(edittable.cellArray(selection[0]), function (index, cell) {
                            var col = cell.col;
                            var row = cell.row;
                            meta[row][col].align = 'center';
                        });
                        this.render();
                    },
                    disabled: function () {
                        var meta = getMeta();
                        var selection = this.getSelectedLast();
                        var row = selection[0];
                        var col = selection[1];
                        return (meta[row][col].align && meta[row][col].align === 'center');
                    }
                },
                align_right: {
                    name: itemName('align_right', LANG.plugins.edittable.align_right),
                    callback: function (key, selection) {
                        var meta = getMeta();
                        jQuery.each(edittable.cellArray(selection[0]), function (index, cell) {
                            var col = cell.col;
                            var row = cell.row;
                            meta[row][col].align = 'right';
                        });
                        this.render();
                    },
                    disabled: function () {
                        var meta = getMeta();
                        var selection = this.getSelectedLast();
                        var row = selection[0];
                        var col = selection[1];
                        return (meta[row][col].align && meta[row][col].align === 'right');
                    }
                },
                hsep1: '---------',
                row_above: {
                    name: itemName('row_above', LANG.plugins.edittable.row_above)
                },
                remove_row: {
                    name: itemName('remove_row', LANG.plugins.edittable.remove_row),
                    /**
                     * The same as the default action, but with confirmation
                     *
                     * @param {string} key key of the menu item
                     * @param {Array} selection the selected ranges
                     *
                     * @return {void}
                     */
                    callback: function (key, selection) {
                        if (window.confirm(LANG.plugins.edittable.confirmdeleterow)) {
                            var range = selection[0];
                            var amount = range.end.row - range.start.row + 1;
                            this.alter('remove_row', range.start.row, amount);
                        }
                    },
                    /**
                     * do not show when this is the last row
                     *
                     * @return {boolean} true if the entry is to be disabled, false otherwise
                     */
                    disabled: function () {
                        var rowsInTable = this.countRows();
                        var firstSelectedRow = this.getSelectedLast()[0];
                        var lastSelectedRow = this.getSelectedLast()[2]; // fix magic number with destructuring once we drop IE11
                        var allRowsSelected = firstSelectedRow === 0 && lastSelectedRow === rowsInTable - 1;
                        return (rowsInTable <= 1 || allRowsSelected);
                    }
                },
                row_below: {
                    name: itemName('row_below', LANG.plugins.edittable.row_below)
                },
                hsep2: '---------',
                col_left: {
                    name: itemName('col_left', LANG.plugins.edittable.col_left)
                },
                remove_col: {
                    name: itemName('remove_col', LANG.plugins.edittable.remove_col),
                    /**
                     * The same as the default action, but with confirmation
                     *
                     * @param {string} key key of the menu item
                     * @param {Array} selection the selected ranges
                     *
                     * @return {void}
                     */
                    callback: function (key, selection) {
                        if (window.confirm(LANG.plugins.edittable.confirmdeletecol)) {
                            var range = selection[0];
                            var amount = range.end.col - range.start.col + 1;
                            this.alter('remove_col', range.start.col, amount);
                        }
                    },
                    /**
                     * do not show when this is the last row
                     *
                     * @return {boolean} true if the entry is to be disabled, false otherwise
                     */
                    disabled: function () {
                        var colsInTable = this.countCols();
                        var firstSelectedColumn = this.getSelectedLast()[1];
                        var lastSelectedColumn = this.getSelectedLast()[3]; // fix magic number with destructuring once we drop IE11
                        var allColsSelected = firstSelectedColumn === 0 && lastSelectedColumn === colsInTable - 1;
                        return (colsInTable <= 1 || allColsSelected);
                    }
                },
                col_right: {
                    name: itemName('col_right', LANG.plugins.edittable.col_right)
                },
                hsep3: '---------',
                mergeCells: {
                    name: function () {
                        var sel = this.getSelectedLast();
                        var info = this.getPlugin('mergeCells').mergedCellsCollection.get(sel[0], sel[1]);
                        if (info && info.row === sel[0] && info.col === sel[1] &&
                            info.row + info.rowspan - 1 === sel[2] && info.col + info.colspan - 1 === sel[3]) {
                            return itemName('unmerge', LANG.plugins.edittable.unmerge_cells);
                        }
                        return itemName('merge', LANG.plugins.edittable.merge_cells);
                    },

                    /**
                     * disable if only one cell is selected
                     *
                     * @return {boolean} true if the entry is to be disabled, false otherwise
                     */
                    disabled: function () {
                        var selection = this.getSelectedLast();
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
