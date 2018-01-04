/* global initToolbar */

window.edittable = window.edittable || {};
window.edittable_plugins = window.edittable_plugins || {};

(function (edittable, edittable_plugins) {
    'use strict';

    /**
     *
     *
     * @param {Array} movingRowIndexes the indices of the rows to be moved
     * @param {int} target the row where the rows will be inserted
     * @param {Array} dmarray the data or meta array
     *
     * @return {Array} the new data or meta array
     */
    edittable.moveRow = function moveRow(movingRowIndexes, target, dmarray) {
        var startIndex = movingRowIndexes[0];
        var endIndex = movingRowIndexes[movingRowIndexes.length - 1];
        var moveForward = target < startIndex;

        var first = dmarray.slice(0, Math.min(startIndex, target));
        var moving = dmarray.slice(startIndex, endIndex + 1);
        var between;
        if (moveForward) {
            between = dmarray.slice(target, startIndex);
        } else {
            between = dmarray.slice(endIndex + 1, target);
        }
        var last = dmarray.slice(Math.max(endIndex + 1, target));
        if (moveForward) {
            return [].concat(first, moving, between, last);
        }
        return [].concat(first, between, moving, last);
    };

    edittable.addRowToMeta = function (index, amount, metaArray) {
        var i;
        var cols = 1; // minimal number of cells
        if (metaArray[0]) {
            cols = metaArray[0].length;
        }

        // insert into meta array
        for (i = 0; i < amount; i += 1) {
            var newrow = Array.apply(null, new Array(cols)).map(function initializeRowMeta() {
                return { rowspan: 1, colspan: 1 };
            });
            metaArray.splice(index, 0, newrow);
        }

        return metaArray;
    };


    /**
     *
     * @param {Array} movingColIndexes the indices of the columns to be moved
     * @param {int} target the column where the columns will be inserted
     * @param {Array} dmarray the data or meta array
     *
     * @return {Array} the new data or meta array
     */
    edittable.moveCol = function moveCol(movingColIndexes, target, dmarray) {
        return dmarray.map(function (row) {
            return edittable.moveRow(movingColIndexes, target, row);
        });
    };

    /**
     *
     * @param {Array} meta the meta array
     * @returns {Array} an array of the cells with a rowspan or colspan larger than 1
     */
    edittable.getMerges = function (meta) {
        var merges = [];
        for (var row = 0; row < meta.length; row += 1) {
            for (var col = 0; col < meta[0].length; col += 1) {
                if (meta[row][col].hasOwnProperty('rowspan') && meta[row][col].rowspan > 1 ||
                    meta[row][col].hasOwnProperty('colspan') && meta[row][col].colspan > 1) {
                    var merge = {};
                    merge.row = row;
                    merge.col = col;
                    merge.rowspan = meta[row][col].rowspan;
                    merge.colspan = meta[row][col].colspan;
                    merges.push(merge);
                }
            }
        }
        return merges;
    };


    /**
     *
     * @param {Array} merges an array of the cells that are part of a merge
     * @param {int} target the target column or row
     * @param {string} direction whether we're trying to move a col or row
     *
     * @return {bool} wether the target col/row is part of a merge
     */
    edittable.isTargetInMerge = function isTargetInMerge(merges, target, direction) {
        return merges.some(function (merge) {
            return (merge[direction] < target && target < merge[direction] + merge[direction + 'span']);
        });
    };

    edittable.loadEditor = function () {
        var $container = jQuery('#edittable__editor');
        if (!$container.length) {
            return;
        }

        var $form = jQuery('#dw__editform');
        var $datafield = $form.find('input[name=edittable_data]');
        var $metafield = $form.find('input[name=edittable_meta]');

        var data = JSON.parse($datafield.val());
        var meta = JSON.parse($metafield.val());

        /**
         * Get the current meta array
         *
         * @return {array} the current meta array as array of rows with arrays of columns with objects
         */
        function getMeta() {return meta;}

        /**
         * Get the current data array
         *
         * @return {array} the current data array as array of rows with arrays of columns with strings
         */
        function getData() {return data;}

        var merges = edittable.getMerges(meta);
        if (merges === []) {
            merges = true;
        }
        var lastselect = { row: 0, col: 0 };

        var handsontable_config = {
            data: data,
            startRows: 5,
            startCols: 5,
            colHeaders: true,
            rowHeaders: true,
            manualColumnResize: true,
            outsideClickDeselects: false,
            contextMenu: edittable.getEditTableContextMenu(getData, getMeta),
            manualColumnMove: true,
            manualRowMove: true,
            mergeCells: merges,


            /**
             * Attach pointers to our raw data structures in the instance
             *
             * @return {void}
             */
            afterLoadData: function () {
                var i;
                this.raw = {
                    data: data,
                    meta: meta,
                    colinfo: [],
                    rowinfo: []
                };
                for (i = 0; i < data.length; i += 1) {
                    this.raw.rowinfo[i] = {};
                }
                for (i = 0; i < data[0].length; i += 1) {
                    this.raw.colinfo[i] = {};
                }
            },

            /**
             * initialize cell properties
             *
             * properties are stored in extra array
             *
             * @param {int} row the row of the desired column
             * @param {int} col the col of the desired column
             * @returns {Array} the respective cell from the meta array
             */
            cells: function (row, col) {
                return meta[row][col];
            },

            /**
             * Custom cell renderer
             *
             * It handles all our custom meta attributes like alignments and rowspans
             *
             * @param {object} instance the handsontable instance
             * @param {HTMLTableCellElement} td the dom node of the cell
             * @param {int} row the row of the cell to be rendered
             * @param {int} col the column of the cell to be rendered
             *
             * @return {void}
             */
            renderer: function (instance, td, row, col) {
                // for some reason, neither cellProperties nor instance.getCellMeta() give the right data
                var cellMeta = meta[row][col];
                var $td = jQuery(td);

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

                /* globals Handsontable */
                Handsontable.renderers.TextRenderer.apply(this, arguments);
            },

            /**
             * Initialization after the Editor loaded
             *
             * @return {void}
             */
            afterInit: function () {
                // select first cell
                this.selectCell(0, 0);

                // we need an ID on the input field
                jQuery('textarea.handsontableInput').attr('id', 'handsontable__input');

                // we're ready to intialize the toolbar now
                initToolbar('tool__bar', 'handsontable__input', window.toolbar, false);

                // we wrap DokuWiki's pasteText() here to get notified when the toolbar inserted something into our editor
                var original_pasteText = window.pasteText;
                window.pasteText = function (selection, text, opts) {
                    original_pasteText(selection, text, opts); // do what pasteText does
                    // trigger resize
                    jQuery('#handsontable__input').data('AutoResizer').check();
                };
                window.pasteText = original_pasteText;

                /*
             This is a workaround to rerender the table. It serves two functions:
             1: On wide tables with linebreaks in columns with no pre-defined table widths (via the tablelayout plugin)
                reset the width of the table columns to what is needed by its no narrower content
             2: On table with some rows fixed at the top, ensure that the content of these rows stays at the top as well,
                not only the lefthand rownumbers
             Attaching this to the event 'afterRenderer' did not have the desired results, as it seemed not to work for
             usecase 1 at all and for usecase 2 only with a delay.
            */
                var _this = this;
                this.addHookOnce('afterOnCellMouseOver', function () {
                    _this.updateSettings({});
                });
            },

            /**
             * This recalculates the col and row spans and makes sure all correct cells are hidden
             *
             * @return {void}
             */
            beforeRender: function () {
                var row, r, c, col, i;

                // reset row and column infos - we store spanning info there
                this.raw.rowinfo = [];
                this.raw.colinfo = [];
                for (i = 0; i < data.length; i += 1) {
                    this.raw.rowinfo[i] = {};
                }
                for (i = 0; i < data[0].length; i += 1) {
                    this.raw.colinfo[i] = {};
                }

                // unhide all cells
                for (row = 0; row < data.length; row += 1) {
                    for (col = 0; col < data[0].length; col += 1) {
                        if (meta[row][col].hide) {
                            meta[row][col].hide = false;
                            data[row][col] = '';
                        }
                        // unset all row/colspans
                        meta[row][col].colspan = 1;
                        meta[row][col].rowspan = 1;

                        // make sure no data cell is undefined/null
                        if (!data[row][col]) {
                            data[row][col] = '';
                        }
                    }
                }

                for (var merge = 0; merge < this.mergeCells.mergedCellInfoCollection.length; merge += 1) {
                    row = this.mergeCells.mergedCellInfoCollection[merge].row;
                    col = this.mergeCells.mergedCellInfoCollection[merge].col;
                    var colspan = this.mergeCells.mergedCellInfoCollection[merge].colspan;
                    var rowspan = this.mergeCells.mergedCellInfoCollection[merge].rowspan;
                    meta[row][col].colspan = colspan;
                    meta[row][col].rowspan = rowspan;

                    // hide the cells hidden by the row/colspan

                    for (r = row; r < row + rowspan; r += 1) {
                        for (c = col; c < col + colspan; c += 1) {
                            if (r === row && c === col) {
                                continue;
                            }
                            meta[r][c].hide = true;
                            meta[r][c].rowspan = 1;
                            meta[r][c].colspan = 1;
                            if (data[r][c] && data[r][c] !== ':::') {
                                data[row][col] += ' ' + data[r][c];
                            }
                            if (r === row) {
                                data[r][c] = '';
                            } else {
                                data[r][c] = ':::';
                            }
                        }
                    }
                }

                // Clone data object
                // Since we can't use real line breaks (\n) inside table cells, this object is used to store all cell values with DokuWiki's line breaks (\\) instead of actual ones.
                var dataLBFixed = jQuery.extend(true, {}, data);

                // In dataLBFixed, replace all actual line breaks with DokuWiki line breaks
                // In data, replace all DokuWiki line breaks with actual ones so the editor displays line breaks properly
                for (row = 0; row < data.length; row += 1) {
                    for (col = 0; col < data[0].length; col += 1) {
                        dataLBFixed[row][col] = data[row][col].replace(/(\r\n|\n|\r)/g, '\\\\ ');
                        data[row][col] = data[row][col].replace(/\\\\\s/g, '\n');
                    }
                }

                // Store dataFixed and meta back in the form
                $datafield.val(JSON.stringify(dataLBFixed));
                $metafield.val(JSON.stringify(meta));
            },

            /**
             * Disable key handling while the link wizard or any other dialog is visible
             *
             * @param {event} e the keydown event object
             *
             * @return {void}
             */
            beforeKeyDown: function (e) {
                if (jQuery('.ui-dialog:visible').length) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                }
            },

            beforeColumnMove: function (movingCols, target) {
                var disallowMove = edittable.isTargetInMerge(this.mergeCells.mergedCellInfoCollection, target, 'col');
                if (disallowMove) {
                    return false;
                }
                meta = edittable.moveCol(movingCols, target, meta);
                data = edittable.moveCol(movingCols, target, data);
                this.updateSettings({ mergeCells: edittable.getMerges(meta), data: data });
                return false;
            },

            beforeRowMove: function (movingRows, target) {
                var disallowMove = edittable.isTargetInMerge(this.mergeCells.mergedCellInfoCollection, target, 'row');
                if (disallowMove) {
                    return false;
                }
                meta = edittable.moveRow(movingRows, target, meta);
                data = edittable.moveRow(movingRows, target, data);
                this.updateSettings({ mergeCells: edittable.getMerges(meta), data: data });
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
            afterCreateRow: function (index, amount) {
                meta = edittable.addRowToMeta(index, amount, meta);
            },

            /**
             * Set id for toolbar to current handsontable input textarea
             *
             * For some reason (bug?), handsontable creates a new div.handsontableInputHolder with a new textarea and
             * ignores the old one. For the toolbar to keep working we need make sure the currently used textarea has
             * also the id `handsontable__input`.
             *
             * @return {void}
             */
            afterBeginEditing: function () {
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
            afterRemoveRow: function (index, amount) {
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
            afterCreateCol: function (index, amount) {
                for (var row = 0; row < data.length; row += 1) {
                    for (var i = 0; i < amount; i += 1) {
                        meta[row].splice(index, 0, { rowspan: 1, colspan: 1 });
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
            afterRemoveCol: function (index, amount) {
                for (var row = 0; row < data.length; row += 1) {
                    meta[row].splice(index, amount);
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
            afterSelection: function (r, c) {
                if (meta[r][c].hide) {
                    // user navigated into a hidden cell! we need to find the next selectable cell
                    var x = 0;

                    var v = r - lastselect.row;
                    if (v > 0) {
                        v = 1;
                    }
                    if (v < 0) {
                        v = -1;
                    }

                    var h = c - lastselect.col;
                    if (h > 0) {
                        h = 1;
                    }
                    if (h < 0) {
                        h = -1;
                    }

                    if (v !== 0) {
                        x = r;
                        // user navigated vertically
                        do {
                            x += v;
                            if (!meta[x][c].hide) {
                                // cell is selectable, do it
                                this.selectCell(x, c);
                                return;
                            }

                        } while (x > 0 && x < data.length);
                        // found no suitable cell
                        this.deselectCell();
                    } else if (h !== 0) {
                        x = c;
                        // user navigated horizontally
                        do {
                            x += h;
                            if (!meta[r][x].hide) {
                                // cell is selectable, do it
                                this.selectCell(r, x);
                                return;
                            }

                        } while (x > 0 && x < data[0].length);
                        // found no suitable cell
                        this.deselectCell();
                    }
                } else {
                    // remember this selection
                    lastselect.row = r;
                    lastselect.col = c;
                }
            },

            /**
             *
             * @param {Array} pasteData An array of arrays which contains data to paste.
             * @param {Array} coords An array of objects with ranges of the visual indexes (startRow, startCol, endRow, endCol)
             *        that correspond to the previously selected area.
             * @return {true} always allowing the pasting
             */
            beforePaste: function (pasteData, coords) {
                var startRow = coords[0].startRow;
                var startCol = coords[0].startCol;
                var totalRows = this.countRows();
                var totalCols = this.countCols();

                var missingRows = (startRow + pasteData.length) - totalRows;
                var missingCols = (startCol + pasteData[0].length) - totalCols;
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


        for (var plugin in edittable_plugins) {
            if (edittable_plugins.hasOwnProperty(plugin)) {
                if (typeof edittable_plugins[plugin].modifyHandsontableConfig === 'function') {
                    edittable_plugins[plugin].modifyHandsontableConfig(handsontable_config, $form);
                }
            }
        }


        $container.handsontable(handsontable_config);

    };

    jQuery(document).ready(edittable.loadEditor);

}(window.edittable, window.edittable_plugins));
