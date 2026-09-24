/* global LANG */

window.edittable = window.edittable || {};

(function (edittable) {
    'use strict';
    /**
     * List all cells of a selection range
     *
     * @param {object} selection the selection range with start and end coordinates
     *
     * @returns {Array} the row and column of each cell in the range
     */
    edittable.cellArray = function (selection) {
        const selectionArray = [];
        for (let row = selection.start.row; row <= selection.end.row; row += 1) {
            for (let col = selection.start.col; col <= selection.end.col; col += 1) {
                selectionArray.push({row, col});
            }
        }
        return selectionArray;
    };

    /**
     * Wrap the label of a context menu item in an element with a CSS class that selects the item's icon
     *
     * @param {string} key the CSS class
     * @param {string} label the label of the menu item
     * @returns {string} the HTML to be used as the item's name
     */
    function itemName(key, label) {
        return `<div class="${key}">${label}</div>`;
    }

    /**
     * Create the contextMenu setting with the items of the table editor
     *
     * @param {Function} getData get the current data array
     * @param {Function} getMeta get the current meta array
     * @returns {object} the contextMenu setting for Handsontable
     */
    edittable.getEditTableContextMenu = function (getData, getMeta) {
        return {
            items: {
                toggle_header: {
                    name: itemName('toggle_header', LANG.plugins.edittable.toggle_header),
                    /**
                     * Toggle the selected cells between header and normal cells
                     *
                     * @param {string} key key of the menu item
                     * @param {Array} selection the selected ranges
                     *
                     * @return {void}
                     */
                    callback(key, selection) {
                        const meta = getMeta();
                        for (const {row, col} of edittable.cellArray(selection[0])) {
                            meta[row][col].tag = meta[row][col].tag === 'th' ? 'td' : 'th';
                        }
                        this.render();
                    }
                },
                align_left: {
                    name: itemName('align_left', LANG.plugins.edittable.align_left),
                    /**
                     * Align the selected cells to the left
                     *
                     * @param {string} key key of the menu item
                     * @param {Array} selection the selected ranges
                     *
                     * @return {void}
                     */
                    callback(key, selection) {
                        const meta = getMeta();
                        for (const {row, col} of edittable.cellArray(selection[0])) {
                            meta[row][col].align = 'left';
                        }
                        this.render();
                    },
                    /**
                     * disable if the selected cell is already aligned to the left
                     *
                     * @return {boolean} true if the entry is to be disabled, false otherwise
                     */
                    disabled() {
                        const [row, col] = this.getSelectedLast();
                        const align = getMeta()[row][col].align;
                        return !align || align === 'left';
                    }
                },
                align_center: {
                    name: itemName('align_center', LANG.plugins.edittable.align_center),
                    /**
                     * Center the selected cells
                     *
                     * @param {string} key key of the menu item
                     * @param {Array} selection the selected ranges
                     *
                     * @return {void}
                     */
                    callback(key, selection) {
                        const meta = getMeta();
                        for (const {row, col} of edittable.cellArray(selection[0])) {
                            meta[row][col].align = 'center';
                        }
                        this.render();
                    },
                    /**
                     * disable if the selected cell is already centered
                     *
                     * @return {boolean} true if the entry is to be disabled, false otherwise
                     */
                    disabled() {
                        const [row, col] = this.getSelectedLast();
                        return getMeta()[row][col].align === 'center';
                    }
                },
                align_right: {
                    name: itemName('align_right', LANG.plugins.edittable.align_right),
                    /**
                     * Align the selected cells to the right
                     *
                     * @param {string} key key of the menu item
                     * @param {Array} selection the selected ranges
                     *
                     * @return {void}
                     */
                    callback(key, selection) {
                        const meta = getMeta();
                        for (const {row, col} of edittable.cellArray(selection[0])) {
                            meta[row][col].align = 'right';
                        }
                        this.render();
                    },
                    /**
                     * disable if the selected cell is already aligned to the right
                     *
                     * @return {boolean} true if the entry is to be disabled, false otherwise
                     */
                    disabled() {
                        const [row, col] = this.getSelectedLast();
                        return getMeta()[row][col].align === 'right';
                    }
                },
                hsep1: '---------',
                row_above: {
                    name: itemName('row_above', LANG.plugins.edittable.row_above)
                },
                remove_row: {
                    name: itemName('remove_row', LANG.plugins.edittable.remove_row),
                    /**
                     * Remove the selected rows after the user confirms
                     *
                     * @param {string} key key of the menu item
                     * @param {Array} selection the selected ranges
                     *
                     * @return {void}
                     */
                    callback(key, selection) {
                        if (window.confirm(LANG.plugins.edittable.confirmdeleterow)) {
                            const {start, end} = selection[0];
                            this.alter('remove_row', start.row, end.row - start.row + 1);
                        }
                    },
                    /**
                     * disable when the selection covers all rows
                     *
                     * @return {boolean} true if the entry is to be disabled, false otherwise
                     */
                    disabled() {
                        const rowsInTable = this.countRows();
                        const [firstSelectedRow, , lastSelectedRow] = this.getSelectedLast();
                        const allRowsSelected = firstSelectedRow === 0 && lastSelectedRow === rowsInTable - 1;
                        return rowsInTable <= 1 || allRowsSelected;
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
                     * Remove the selected columns after the user confirms
                     *
                     * @param {string} key key of the menu item
                     * @param {Array} selection the selected ranges
                     *
                     * @return {void}
                     */
                    callback(key, selection) {
                        if (window.confirm(LANG.plugins.edittable.confirmdeletecol)) {
                            const {start, end} = selection[0];
                            this.alter('remove_col', start.col, end.col - start.col + 1);
                        }
                    },
                    /**
                     * disable when the selection covers all columns
                     *
                     * @return {boolean} true if the entry is to be disabled, false otherwise
                     */
                    disabled() {
                        const colsInTable = this.countCols();
                        const [, firstSelectedColumn, , lastSelectedColumn] = this.getSelectedLast();
                        const allColsSelected = firstSelectedColumn === 0 && lastSelectedColumn === colsInTable - 1;
                        return colsInTable <= 1 || allColsSelected;
                    }
                },
                col_right: {
                    name: itemName('col_right', LANG.plugins.edittable.col_right)
                },
                hsep3: '---------',
                mergeCells: {
                    /**
                     * Offer to split the selection if it is exactly one merged cell, to merge it otherwise
                     *
                     * @return {string} the HTML to be used as the item's name
                     */
                    name() {
                        const [startRow, startCol, endRow, endCol] = this.getSelectedLast();
                        const info = this.getPlugin('mergeCells').mergedCellsCollection.get(startRow, startCol);
                        if (info && info.row === startRow && info.col === startCol &&
                            info.row + info.rowspan - 1 === endRow && info.col + info.colspan - 1 === endCol) {
                            return itemName('unmerge', LANG.plugins.edittable.unmerge_cells);
                        }
                        return itemName('merge', LANG.plugins.edittable.merge_cells);
                    },

                    /**
                     * disable if only one cell is selected
                     *
                     * @return {boolean} true if the entry is to be disabled, false otherwise
                     */
                    disabled() {
                        const [startRow, startCol, endRow, endCol] = this.getSelectedLast();
                        return startRow === endRow && startCol === endCol;
                    }

                }
            }
        };
    };
}(window.edittable));
