/* global initToolbar, Handsontable, LANG */

window.edittable = window.edittable || {};
window.edittable_plugins = window.edittable_plugins || {};

(function (edittable, edittable_plugins) {
    'use strict';

    /**
     * Milliseconds to wait before the fill handle adds another column, the same as Handsontable uses for rows
     *
     * @type {number}
     */
    const INTERVAL_FOR_ADDING_COLUMN = 200;

    /**
     * Key codes Handsontable listens to for undo and redo
     *
     * @type {number}
     */
    const KEY_CODE_Z = 90;
    const KEY_CODE_Y = 89;

    /**
     * Move rows to a new position
     *
     * @param {Array} movingRowIndexes the indices of the rows to be moved
     * @param {int} target the row where the rows will be inserted
     * @param {Array} dmarray the data or meta array
     *
     * @return {Array} the new data or meta array
     */
    edittable.moveRow = function moveRow(movingRowIndexes, target, dmarray) {
        const startIndex = movingRowIndexes[0];
        const endIndex = movingRowIndexes[movingRowIndexes.length - 1];
        const moveForward = target < startIndex;

        const first = dmarray.slice(0, Math.min(startIndex, target));
        const moving = dmarray.slice(startIndex, endIndex + 1);
        const between = moveForward ? dmarray.slice(target, startIndex) : dmarray.slice(endIndex + 1, target);
        const last = dmarray.slice(Math.max(endIndex + 1, target));
        if (moveForward) {
            return [...first, ...moving, ...between, ...last];
        }
        return [...first, ...between, ...moving, ...last];
    };

    /**
     * Insert rows with default cell properties into the meta array
     *
     * @param {int} index the index where the new rows are inserted
     * @param {int} amount the number of rows to insert
     * @param {Array} metaArray the meta array
     *
     * @return {Array} the changed meta array
     */
    edittable.addRowToMeta = function (index, amount, metaArray) {
        const cols = metaArray[0]?.length ?? 1; // an empty table gets one cell per row

        for (let i = 0; i < amount; i += 1) {
            const newrow = Array.from({length: cols}, () => ({rowspan: 1, colspan: 1}));
            metaArray.splice(index, 0, newrow);
        }

        return metaArray;
    };


    /**
     * Move columns to a new position
     *
     * @param {Array} movingColIndexes the indices of the columns to be moved
     * @param {int} target the column where the columns will be inserted
     * @param {Array} dmarray the data or meta array
     *
     * @return {Array} the new data or meta array
     */
    edittable.moveCol = function moveCol(movingColIndexes, target, dmarray) {
        return dmarray.map(row => edittable.moveRow(movingColIndexes, target, row));
    };

    /**
     * Collect all merged cells from the meta array
     *
     * @param {Array} meta the meta array
     * @returns {Array} an array of the cells with a rowspan or colspan larger than 1
     */
    edittable.getMerges = function (meta) {
        const merges = [];
        for (let row = 0; row < meta.length; row += 1) {
            for (let col = 0; col < meta[0].length; col += 1) {
                const {rowspan, colspan} = meta[row][col];
                if (rowspan > 1 || colspan > 1) {
                    merges.push({row, col, rowspan, colspan});
                }
            }
        }
        return merges;
    };


    /**
     * Check if the target of a move lies inside a merge
     *
     * @param {Array} merges the merged cells
     * @param {int} target the target column or row
     * @param {string} direction 'col' or 'row'
     *
     * @return {boolean} whether the target col/row is part of a merge
     */
    edittable.isTargetInMerge = function isTargetInMerge(merges, target, direction) {
        return merges.some(merge => merge[direction] < target && target < merge[direction] + merge[`${direction}span`]);
    };

    /**
     * Check if the moving cols/rows would tear a merge apart
     *
     * This is the case when some, but not all, of the cols/rows spanned by a merge are moved.
     *
     * @param {Array} merges the merged cells
     * @param {Array} movingIndexes the indices of the cols/rows to be moved
     * @param {string} direction 'col' or 'row'
     *
     * @return {boolean} whether a merge is only partly moved
     */
    edittable.isMovingPartOfMerge = function isMovingPartOfMerge(merges, movingIndexes, direction) {
        return merges.some(merge => {
            const span = merge[`${direction}span`];
            let moved = 0;
            for (let i = merge[direction]; i < merge[direction] + span; i += 1) {
                if (movingIndexes.includes(i)) {
                    moved += 1;
                }
            }
            return moved > 0 && moved < span;
        });
    };

    /**
     * Initialize the table editor if the page contains one
     *
     * @return {void}
     */
    edittable.loadEditor = function () {
        const $container = jQuery('#edittable__editor');
        if (!$container.length) {
            return;
        }

        const $form = jQuery('#dw__editform');
        const $datafield = $form.find('input[name=edittable_data]');
        const $metafield = $form.find('input[name=edittable_meta]');

        const data = JSON.parse($datafield.val());
        let meta = JSON.parse($metafield.val());

        /**
         * Get the current meta array
         *
         * @return {Array} the current meta array as array of rows with arrays of columns with objects
         */
        function getMeta() {return meta;}

        /**
         * Get the current data array
         *
         * @return {Array} the current data array as array of rows with arrays of columns with strings
         */
        function getData() {return data;}

        /**
         * Open the context menu below the toolbar button
         *
         * @param {Handsontable} hot the table instance
         *
         * @return {void}
         */
        function openMenu(hot) {
            if (!hot.getSelectedLast()) {
                return;
            }
            const rect = jQuery('#tool__bar .edittable__menu')[0].getBoundingClientRect();
            hot.getPlugin('contextMenu').open({
                pageX: rect.left + window.scrollX,
                pageY: rect.bottom + window.scrollY
            });
        }

        const lastselect = {row: 0, col: 0};
        let addingColumn = false;

        /**
         * Add a column at the end of the table after a short delay, unless one is already being added
         *
         * @param {Handsontable} hot the table instance
         *
         * @return {void}
         */
        function addColumnDelayed(hot) {
            if (addingColumn) {
                return;
            }
            addingColumn = true;
            setTimeout(() => {
                hot.alter('insert_col', undefined, 1, 'Autofill.fill');
                addingColumn = false;
            }, INTERVAL_FOR_ADDING_COLUMN);
        }

        const handsontable_config = {
            data,
            startRows: 5,
            startCols: 5,
            colHeaders: true,
            rowHeaders: true,
            manualColumnResize: true,
            outsideClickDeselects: false,
            contextMenu: edittable.getEditTableContextMenu(getData, getMeta),
            manualColumnMove: true,
            manualRowMove: true,
            mergeCells: edittable.getMerges(meta),
            fillHandle: true,
            selectionMode: 'range',


            /**
             * Attach the raw data structures to the instance
             *
             * @return {void}
             */
            afterLoadData() {
                this.raw = {
                    data,
                    meta,
                    colinfo: data[0].map(() => ({})),
                    rowinfo: data.map(() => ({}))
                };
            },

            /**
             * Provide the cell properties from the meta array
             *
             * @param {int} row the row of the cell
             * @param {int} col the column of the cell
             * @returns {object} the properties of the cell
             */
            cells(row, col) {
                return meta[row][col];
            },

            /**
             * Render a cell with the spans, visibility, alignment and header state from the meta array
             *
             * @param {object} instance the handsontable instance
             * @param {HTMLTableCellElement} td the dom node of the cell
             * @param {int} row the row of the cell to be rendered
             * @param {int} col the column of the cell to be rendered
             * @param {...*} rest the remaining renderer arguments
             *
             * @return {void}
             */
            renderer(instance, td, row, col, ...rest) {
                // cellProperties and instance.getCellMeta() do not give the right data here
                const cellMeta = meta[row][col];
                const $td = jQuery(td);

                if (cellMeta.colspan) {
                    $td.attr('colspan', cellMeta.colspan);
                } else {
                    $td.removeAttr('colspan');
                }

                if (cellMeta.rowspan) {
                    $td.attr('rowspan', cellMeta.rowspan);
                } else {
                    $td.removeAttr('rowspan');
                }

                if (cellMeta.hide) {
                    $td.hide();
                } else {
                    $td.show();
                }

                if (cellMeta.align === 'right') {
                    $td.addClass('right');
                    $td.removeClass('center');
                } else if (cellMeta.align === 'center') {
                    $td.addClass('center');
                    $td.removeClass('right');
                } else {
                    $td.removeClass('center');
                    $td.removeClass('right');
                }

                if (cellMeta.tag === 'th') {
                    $td.addClass('header');
                } else {
                    $td.removeClass('header');
                }

                Handsontable.renderers.TextRenderer.call(this, instance, td, row, col, ...rest);
            },

            /**
             * Select the first cell, connect the DokuWiki toolbar to the cell editor and watch the fill handle
             *
             * @return {void}
             */
            afterInit() {
                this.selectCell(0, 0);

                // initToolbar() finds the textarea by its ID
                jQuery('textarea.handsontableInput').attr('id', 'handsontable__input');
                /**
                 * Make the toolbar button open the context menu
                 *
                 * @param {jQuery} $btn the button element
                 * @return {string} the ID of the cell editor, so the toolbar adds the button without a picker
                 */
                window.addBtnActionEditTableMenu = $btn => {
                    $btn.on('click', () => openMenu(this));
                    return 'handsontable__input';
                };
                const menuButton = {
                    title: LANG.plugins.edittable.table_menu,
                    type: 'EditTableMenu',
                    icon: '../../plugins/edittable/images/add_table.png',
                    class: 'edittable__menu'
                };
                initToolbar('tool__bar', 'handsontable__input', [...window.toolbar, menuButton], false);

                // add columns while the fill handle is dragged past the right edge of the table
                document.documentElement.addEventListener('mousemove', e => {
                    if (!this.getPlugin('autofill').handleDraggedCells) {
                        return;
                    }
                    const rect = this.table.getBoundingClientRect();
                    if (e.clientX > rect.right && e.clientY <= rect.bottom) {
                        addColumnDelayed(this);
                    }
                });
            },

            /**
             * Recalculate the spans and hidden cells from the merges and store the table in the form
             *
             * @return {void}
             */
            beforeRender() {
                this.raw.rowinfo = data.map(() => ({}));
                this.raw.colinfo = data[0].map(() => ({}));

                // reset all cells to unmerged and visible
                for (let row = 0; row < data.length; row += 1) {
                    for (let col = 0; col < data[0].length; col += 1) {
                        if (meta[row][col].hide) {
                            meta[row][col].hide = false;
                            data[row][col] = '';
                        }
                        meta[row][col].colspan = 1;
                        meta[row][col].rowspan = 1;

                        // make sure no data cell is undefined/null
                        if (!data[row][col]) {
                            data[row][col] = '';
                        }
                    }
                }

                for (const {row, col, rowspan, colspan} of this.getPlugin('mergeCells').mergedCellsCollection.mergedCells) {
                    meta[row][col].colspan = colspan;
                    meta[row][col].rowspan = rowspan;

                    // hide the covered cells, move their text into the merged cell and mark lower rows with :::
                    for (let r = row; r < row + rowspan; r += 1) {
                        for (let c = col; c < col + colspan; c += 1) {
                            if (r === row && c === col) {
                                continue;
                            }
                            meta[r][c].hide = true;
                            meta[r][c].rowspan = 1;
                            meta[r][c].colspan = 1;
                            if (data[r][c] && data[r][c] !== ':::') {
                                data[row][col] += ` ${data[r][c]}`;
                            }
                            data[r][c] = r === row ? '' : ':::';
                        }
                    }
                }

                $datafield.val(JSON.stringify(data));
                $metafield.val(JSON.stringify(meta));
            },

            /**
             * Disable key handling while the link wizard or any other dialog is visible
             *
             * Shift+F10 opens the context menu.
             *
             * @param {Event} e the keydown event object
             *
             * @return {void}
             */
            beforeKeyDown(e) {
                if (jQuery('.ui-dialog:visible').length) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                    return;
                }
                if (e.shiftKey && e.key === 'F10') {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                    openMenu(this);
                }
            },

            /**
             * Move the columns in our data and meta arrays instead of letting Handsontable move them
             *
             * The data array is changed in place, so the table is only rendered after the merges are updated.
             *
             * @param {Array} movingCols the indices of the columns to be moved
             * @param {int} target the column where the columns will be inserted
             *
             * @return {false} always prevent Handsontable's own move
             */
            beforeColumnMove(movingCols, target) {
                const merges = this.getPlugin('mergeCells').mergedCellsCollection.mergedCells;
                const disallowMove = edittable.isTargetInMerge(merges, target, 'col') ||
                    edittable.isMovingPartOfMerge(merges, movingCols, 'col');
                if (disallowMove) {
                    return false;
                }
                meta = edittable.moveCol(movingCols, target, meta);
                data.splice(0, data.length, ...edittable.moveCol(movingCols, target, data));
                this.updateSettings({mergeCells: edittable.getMerges(meta)});
                return false;
            },

            /**
             * Move the rows in our data and meta arrays instead of letting Handsontable move them
             *
             * The data array is changed in place, so the table is only rendered after the merges are updated.
             *
             * @param {Array} movingRows the indices of the rows to be moved
             * @param {int} target the row where the rows will be inserted
             *
             * @return {false} always prevent Handsontable's own move
             */
            beforeRowMove(movingRows, target) {
                const merges = this.getPlugin('mergeCells').mergedCellsCollection.mergedCells;
                const disallowMove = edittable.isTargetInMerge(merges, target, 'row') ||
                    edittable.isMovingPartOfMerge(merges, movingRows, 'row');
                if (disallowMove) {
                    return false;
                }
                meta = edittable.moveRow(movingRows, target, meta);
                data.splice(0, data.length, ...edittable.moveRow(movingRows, target, data));
                this.updateSettings({mergeCells: edittable.getMerges(meta)});
                return false;
            },

            /**
             * Update meta data array when rows are added
             *
             * @param {int} index the index where the new rows are created
             * @param {int} amount the number of new rows that are created
             *
             * @return {void}
             */
            afterCreateRow(index, amount) {
                meta = edittable.addRowToMeta(index, amount, meta);
            },

            /**
             * Give the current cell editor textarea the ID the toolbar uses
             *
             * Handsontable can create a second textarea and ignore the first one.
             * The older textareas get removed, so the ID stays unique.
             *
             * @return {void}
             */
            afterBeginEditing() {
                if (jQuery('textarea.handsontableInput').length > 1) {
                    jQuery('textarea.handsontableInput:not(:last)').remove();
                    jQuery('textarea.handsontableInput').attr('id', 'handsontable__input');
                }
            },

            /**
             * Update meta data array when rows are removed
             *
             * @param {int} index the index where the rows are removed
             * @param {int} amount the number of rows that are removed
             *
             * @return {void}
             */
            afterRemoveRow(index, amount) {
                meta.splice(index, amount);
            },

            /**
             * Update meta data array when columns are added
             *
             * @param {int} index the index where the new columns are created
             * @param {int} amount the number of new columns that are created
             *
             * @return {void}
             */
            afterCreateCol(index, amount) {
                for (const metaRow of meta) {
                    // new cells are header cells when all their neighbours are
                    const neighbours = [metaRow[index - 1], metaRow[index]].filter(Boolean);
                    const tag = neighbours.length && neighbours.every(cell => cell.tag === 'th') ? 'th' : 'td';
                    for (let i = 0; i < amount; i += 1) {
                        metaRow.splice(index, 0, {rowspan: 1, colspan: 1, tag});
                    }
                }
            },

            /**
             * Update meta data array when columns are removed
             *
             * @param {int} index the index where the columns are removed
             * @param {int} amount the number of columns that are removed
             *
             * @return {void}
             */
            afterRemoveCol(index, amount) {
                for (const metaRow of meta) {
                    metaRow.splice(index, amount);
                }
            },

            /**
             * Skip hidden cells for selection
             *
             * @param {int} r the row of the selected cell
             * @param {int} c the column of the selected cell
             *
             * @return {void}
             */
            afterSelection(r, c) {
                if (!meta[r][c].hide) {
                    lastselect.row = r;
                    lastselect.col = c;
                    return;
                }

                // a hidden cell got selected, move on to the next visible cell in the same direction
                const v = Math.sign(r - lastselect.row);
                const h = Math.sign(c - lastselect.col);

                if (v !== 0) {
                    // user navigated vertically
                    let x = r;
                    do {
                        x += v;
                        if (!meta[x][c].hide) {
                            this.selectCell(x, c);
                            return;
                        }
                    } while (x > 0 && x < data.length);
                    // found no suitable cell
                    this.deselectCell();
                } else if (h !== 0) {
                    // user navigated horizontally
                    let x = c;
                    do {
                        x += h;
                        if (!meta[r][x].hide) {
                            this.selectCell(r, x);
                            return;
                        }
                    } while (x > 0 && x < data[0].length);
                    // found no suitable cell
                    this.deselectCell();
                }
            },

            /**
             * Join the content of all cells into the first cell before they are merged by the user
             *
             * @param {CellRange} cellRange the range of cells to be merged
             * @param {boolean} auto true if the merge was not triggered by the user
             *
             * @return {void}
             */
            beforeMergeCells(cellRange, auto) {
                if (auto) {
                    return;
                }
                const topLeft = cellRange.getTopLeftCorner();
                const bottomRight = cellRange.getBottomRightCorner();
                for (let r = topLeft.row; r <= bottomRight.row; r += 1) {
                    for (let c = topLeft.col; c <= bottomRight.col; c += 1) {
                        if (r === topLeft.row && c === topLeft.col) {
                            continue;
                        }
                        if (data[r][c] && data[r][c] !== ':::') {
                            data[topLeft.row][topLeft.col] += ` ${data[r][c]}`;
                        }
                    }
                }
            },

            /**
             * Add a new column when the fill handle is dragged into the last column
             *
             * @return {void}
             */
            afterOnCellMouseOver() {
                const fill = this.selection.highlight.getFill();
                if (fill.isEmpty()) {
                    return;
                }
                const lastCol = this.countCols() - 1;
                const [, startCol, , endCol] = this.getSelectedLast();
                if (Math.max(startCol, endCol) < lastCol && fill.getCorners()[3] === lastCol) {
                    addColumnDelayed(this);
                }
            },

            /**
             * Add rows and columns if the pasted data does not fit into the table
             *
             * @param {Array} pasteData An array of arrays which contains data to paste.
             * @param {Array} coords An array of objects with ranges of the visual indexes (startRow, startCol, endRow, endCol)
             *        that correspond to the previously selected area.
             * @return {true} always allowing the pasting
             */
            beforePaste(pasteData, coords) {
                const {startRow, startCol} = coords[0];
                const missingRows = (startRow + pasteData.length) - this.countRows();
                const missingCols = (startCol + pasteData[0].length) - this.countCols();
                if (missingRows > 0) {
                    this.alter('insert_row', undefined, missingRows, 'paste');
                }
                if (missingCols > 0) {
                    this.alter('insert_col', undefined, missingCols, 'paste');
                }
                return true;
            }
        };

        if (window.JSINFO.plugins.edittable['default columnwidth']) {
            handsontable_config.colWidths = window.JSINFO.plugins.edittable['default columnwidth'];
        }


        for (const plugin of Object.values(edittable_plugins)) {
            if (typeof plugin.modifyHandsontableConfig === 'function') {
                plugin.modifyHandsontableConfig(handsontable_config, $form);
            }
        }


        // an open cell editor undoes the typing in its own text area, so the table must stay out of it
        // Handsontable listens on the document, so the key has to be stopped on its way up there
        $container[0].addEventListener('keydown', e => {
            const undoKey = (e.ctrlKey || e.metaKey) && !e.altKey &&
                (e.keyCode === KEY_CODE_Z || e.keyCode === KEY_CODE_Y);
            if (!undoKey) {
                return;
            }

            const editor = $container.handsontable('getInstance').getActiveEditor();
            if (editor && editor.isOpened()) {
                e.stopPropagation(); // not prevented, the text area still undoes the typing
            }
        });

        // the toolbar and its dialogs write into the cell editor, so it has to be open and stay open
        document.body.addEventListener('mousedown', e => {
            const $target = jQuery(e.target);
            if (!$target.closest('#link__wiz, #tool__bar, .picker').length || $target.closest('.edittable__menu').length) {
                return;
            }
            e.stopPropagation();

            const hot = $container.handsontable('getInstance');
            const editor = hot.getSelectedLast() ? hot.getActiveEditor() : null;
            if (editor) {
                editor.enableFullEditMode(); // keep the text that is already in the cell
                editor.beginEditing(); // does nothing while the cell is already being edited
            }
        });

        $container.handsontable(handsontable_config);

    };

    jQuery(edittable.loadEditor);

}(window.edittable, window.edittable_plugins));
