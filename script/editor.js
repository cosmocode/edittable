/**
 * This configures the Handsontable Plugin
 */

var edittable_moveRow = function edittable_moveRow(startRow,endRow,dmarray) {
    var metarow = dmarray.splice(startRow,1)[0];
    dmarray.splice(endRow, 0, metarow);
};

var edittable_moveCol = function edittable_moveCol(startCol,endCol,dmarray) {
    for (var i = 0; i < dmarray.length; ++i) {
        var datacol = dmarray[i].splice(startCol, 1)[0];
        dmarray[i].splice(endCol, 0, datacol);
    }
};

/**
 * If the number of rows or columns in front of some merged cells changes, update the mergedCellInfoCollection accordingly.
 *
 * @param direction string either col or row
 * @param type string either create, remove or move
 * @param start int
 * @param end int optional, only for moves
 */
var edittable_updateMergeInfo = function edittable_updateMergeInfo(direction, type, start, end) {
    var mergesNeedUpdate = false;
    if (type === 'create' || type === 'remove') {
        end = Infinity;
    }

    for (var i = 0; i < this.mergeCells.mergedCellInfoCollection.length; ++i) {
        if (start <= this.mergeCells.mergedCellInfoCollection[i][direction] && end > this.mergeCells.mergedCellInfoCollection[i][direction]) {
            if (type === 'create') {
                this.mergeCells.mergedCellInfoCollection[i][direction] += 1;
            } else {
                this.mergeCells.mergedCellInfoCollection[i][direction] -= 1;
            }
            mergesNeedUpdate = true;
        }
        if (start > this.mergeCells.mergedCellInfoCollection[i][direction] && end <= this.mergeCells.mergedCellInfoCollection[i][direction]) {
            this.mergeCells.mergedCellInfoCollection[i][direction] += 1;
            mergesNeedUpdate = true;
        }
    }

    if (mergesNeedUpdate) {
        this.updateSettings({mergeCells: this.mergeCells.mergedCellInfoCollection});
    }
};

var edittable_getMerges = function edittable_getMerges (meta) {
    var merges = [];
    for (var row = 0; row < meta.length; row++) {
        for (var col = 0; col < meta[0].length; col++) {
            if (meta[row][col].hasOwnProperty('rowspan') && meta[row][col]['rowspan'] > 1 ||
                meta[row][col].hasOwnProperty('colspan') && meta[row][col]['colspan'] > 1) {
                var merge = {};
                merge['row'] = row;
                merge['col'] = col;
                merge['rowspan'] = meta[row][col]['rowspan'];
                merge['colspan'] = meta[row][col]['colspan'];
                merges.push(merge);
            }
        }
    }
    return merges;
};

/**
 * If the top-left cell of a set of merged cells is removed by an 'remove row'/'remove column' action, then split the merge
 *
 * @param index int
 * @param amount int
 * @param direction string either 'row' or 'col'
 */
var edittable_unmergeRemovedMerges = function edittable_unmergeRemovedMerges(index, amount, direction) {
    var mergesToSplit = [];
    for (var span = 0; span < amount; ++span) {
        for (var i = 0; i < this.mergeCells.mergedCellInfoCollection.length; ++i) {
            if (this.mergeCells.mergedCellInfoCollection[i][direction] === index + span) {
                mergesToSplit.push(i);
            }
        }
    }
    if (mergesToSplit !== []) {
        for (var merge = mergesToSplit.length - 1; merge >= 0; --merge) {
            this.mergeCells.mergedCellInfoCollection.splice(mergesToSplit[merge], 1);
        }
        this.updateSettings({mergeCells: this.mergeCells.mergedCellInfoCollection});
    }
};

jQuery(function () {
    var $container = jQuery('#edittable__editor');
    if (!$container.length) return;

    var $form = jQuery('#dw__editform');
    var $datafield = $form.find('input[name=edittable_data]');
    var $metafield = $form.find('input[name=edittable_meta]');

    var $layoutfield = $form.find('input[name=tablelayout]');
    var tablelayout = $layoutfield.val();
    if (tablelayout) {
        tablelayout = JSON.parse(tablelayout);

        var colWidths = [];
        tablelayout.colwidth.forEach(function (currentValue, index, array) {
            var undefinedValue;
            if (currentValue.substr(-2) != 'px') {
                colWidths.push(undefinedValue);
                return;
            }
            console.log('Set size of col ' + index + ' to ' + currentValue);
            colWidths[index] = parseInt(currentValue);
        });
    }


    var data = JSON.parse($datafield.val());
    var meta = JSON.parse($metafield.val());
    var merges = edittable_getMerges(meta);
    if (merges === []) merges = true;
    var lastselect = {row: 0, col: 0};

    $container.handsontable({
        data: data,
        startRows: 5,
        startCols: 5,
        colHeaders: true,
        rowHeaders: true,
        manualColumnResize: true,
        colWidths: colWidths,
        outsideClickDeselects: false,
        contextMenu: getEditTableContextMenu(data, meta),
        manualColumnMove: true,
        manualRowMove: true,
        mergeCells: merges,


        /**
         * Attach pointers to our raw data structures in the instance
         */
        afterLoadData: function () {
            var i;
            this.raw = {
                data: data,
                meta: meta,
                colinfo: [],
                rowinfo: []
            };
            for (i = 0; i < data.length; i++) this.raw.rowinfo[i] = {};
            for (i = 0; i < data[0].length; i++) this.raw.colinfo[i] = {};
        },

        /**
         * initialize cell properties
         *
         * properties are stored in extra array
         *
         * @param row int
         * @param col int
         * @param prop string
         * @returns {*}
         */
        cells: function (row, col, prop) {
            return meta[row][col];
        },

        /**
         * Custom cell renderer
         *
         * It handles all our custom meta attributes like alignments and rowspans
         *
         * @param instance
         * @param td
         * @param row
         * @param col
         * @param prop
         * @param value
         * @param cellProperties
         */
        renderer: function (instance, td, row, col, prop, value, cellProperties) {
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

            if (cellMeta.align == 'right') {
                $td.addClass('right');
                $td.removeClass('center');
            } else if (cellMeta.align == 'center') {
                $td.addClass('center');
                $td.removeClass('right');
            } else {
                $td.removeClass('center');
                $td.removeClass('right');
            }

            if (cellMeta.tag == 'th') {
                $td.addClass('header');
            } else {
                $td.removeClass('header');
            }

            Handsontable.renderers.TextRenderer.apply(this, arguments);
        },

        /**
         * Initialization after the Editor loaded
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
        },

        /**
         * This recalculates the col and row spans and makes sure all correct cells are hidden
         *
         * @param forced bool
         */
        beforeRender: function (forced) {
            var row, r, c, col, i;

            // reset row and column infos - we store spanning info there
            this.raw.rowinfo = [];
            this.raw.colinfo = [];
            for (i = 0; i < data.length; i++) this.raw.rowinfo[i] = {};
            for (i = 0; i < data[0].length; i++) this.raw.colinfo[i] = {};

            // unhide all cells
            for (row = 0; row < data.length; row++) {
                for (col = 0; col < data[0].length; col++) {
                    if (meta[row][col].hide) {
                        meta[row][col].hide = false;
                        data[row][col] = '';
                    }
                    // unset all row/colspans
                    meta[row][col].colspan = 1;
                    meta[row][col].rowspan = 1;

                    // make sure no data cell is undefined/null
                    if (!data[row][col]) data[row][col] = '';
                }
            }

            var manualRowMoveDisable = [];
            var manualColumnMoveDisable = [];
            for (var merge = 0; merge < this.mergeCells.mergedCellInfoCollection.length; ++merge) {
                row = this.mergeCells.mergedCellInfoCollection[merge].row;
                col = this.mergeCells.mergedCellInfoCollection[merge].col;
                var colspan = this.mergeCells.mergedCellInfoCollection[merge].colspan;
                var rowspan = this.mergeCells.mergedCellInfoCollection[merge].rowspan;
                if (rowspan > 1) {
                    for (i = row; i < row+rowspan; ++i ) {
                        if (manualRowMoveDisable.indexOf(i) === -1) {
                            manualRowMoveDisable.push(i);
                        }
                    }
                }
                if (colspan > 1) {
                    for (i = col; i < col+colspan; ++i ) {
                        if (manualColumnMoveDisable.indexOf(i) === -1) {
                            manualColumnMoveDisable.push(i);
                        }
                    }
                }
                meta[row][col]['colspan'] = colspan;
                meta[row][col]['rowspan'] = rowspan;

                // hide the cells hidden by the row/colspan

                for (r = row; r < row + rowspan; ++r) {
                    for (c = col; c < col + colspan; ++c) {
                        if (r === row && c === col) continue;
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

            if (!this.manualRowMoveDisable || JSON.stringify(manualRowMoveDisable.sort()) != JSON.stringify(this.manualRowMoveDisable.sort())) {
                this.manualRowMoveDisable = manualRowMoveDisable;
                this.updateSettings({manualRowMoveDisable: manualRowMoveDisable});
            }
            if (!this.manualColumnMoveDisable || JSON.stringify(manualColumnMoveDisable.sort()) != JSON.stringify(this.manualColumnMoveDisable.sort())) {
                this.manualColumnMoveDisable = manualColumnMoveDisable;
                this.updateSettings({manualColumnMoveDisable: manualColumnMoveDisable});
            }

            // Clone data object
            // Since we can't use real line breaks (\n) inside table cells, this object is used to store all cell values with DokuWiki's line breaks (\\) instead of actual ones.
            var dataLBFixed = jQuery.extend(true, {}, data);

            // In dataLBFixed, replace all actual line breaks with DokuWiki line breaks
            // In data, replace all DokuWiki line breaks with actual ones so the editor displays line breaks properly
            for (row = 0; row < data.length; row++) {
                for (col = 0; col < data[0].length; col++) {
                    dataLBFixed[row][col] = data[row][col].replace(/(\r\n|\n|\r)/g,"\\\\ ");
                    data[row][col]        = data[row][col].replace(/\\\\\s/g,"\n");
                }
            }

            // Store dataFixed and meta back in the form
            $datafield.val(JSON.stringify(dataLBFixed));
            $metafield.val(JSON.stringify(meta));
        },

        /**
         * Disable key handling while the link wizard or any other dialog is visible
         *
         * @param e
         */
        beforeKeyDown: function(e) {
            if(jQuery('.ui-dialog:visible').length) {
                e.stopImmediatePropagation();
                e.preventDefault();
            }
        },

        beforeColumnMove: function(startCol, endCol) {
            edittable_moveCol(startCol, endCol, meta);
            edittable_moveCol(startCol, endCol, data);
            edittable_updateMergeInfo.call(this, 'col','move',startCol, endCol);
        },

        afterColumnMove: function () {
            this.updateSettings({manualColumnMove: true});
        },

        beforeRowMove: function(startRow, endRow) {
            edittable_moveRow(startRow, endRow, meta);
            edittable_moveRow(startRow, endRow, data);
            edittable_updateMergeInfo.call(this, 'row','move',startRow, endRow);
        },

        afterRowMove: function () {
            this.updateSettings({manualRowMove: true});
        },

        /**
         * Update meta data array when rows are added
         *
         * @param index int
         * @param amount int
         */
        afterCreateRow: function (index, amount) {
            for (var z = 0; z < amount; z++) {
                this.raw.rowinfo.splice(index, 0, [
                    {}
                ]);
            }

            var i;
            var cols = 1; // minimal number of cells
            if (data[0]) cols = data[0].length;

            // insert into meta array
            for (i = 0; i < amount; i++) {
                var newrow = [];
                for (i = 0; i < cols; i++) newrow.push({rowspan: 1, colspan: 1});
                meta.splice(index, 0, newrow);
            }
            edittable_updateMergeInfo.call(this, 'row','create',index);
        },


        /**
         * if rows are removed which contain the beginning of a set of merged cells, split the merge
         *
         * @param index
         * @param amount
         */
        beforeRemoveRow: function (index, amount) {
            edittable_unmergeRemovedMerges.call(this, index, amount, 'row');
        },


        /**
         * Update meta data array when rows are removed
         *
         * @param index int
         * @param amount int
         */
        afterRemoveRow: function (index, amount) {
            meta.splice(index, amount);
            edittable_updateMergeInfo.call(this, 'row','remove',index);
        },

        /**
         * Update meta data array when columns are added
         *
         * @param index int
         * @param amount int
         */
        afterCreateCol: function (index, amount) {
            for (var z = 0; z < amount; z++) {
                this.raw.colinfo.splice(index, 0, [
                    {}
                ]);
            }

            for (var row = 0; row < data.length; row++) {
                for (var i = 0; i < amount; i++) {
                    meta[row].splice(index, 0, {rowspan: 1, colspan: 1});
                }
            }
            edittable_updateMergeInfo.call(this, 'col','create',index);
        },

        /**
         * if colmuns are removed which contain the beginning of a set of merged cells, split the merge
         *
         * @param index
         * @param amount
         */
        beforeRemoveCol: function (index, amount) {
            edittable_unmergeRemovedMerges.call(this, index, amount, 'col');
        },

        /**
         * Update meta data array when columns are removed
         *
         * @param index int
         * @param amount int
         */
        afterRemoveCol: function (index, amount) {
            for (var row = 0; row < data.length; row++) {
                meta[row].splice(index, amount);
            }
            edittable_updateMergeInfo.call(this, 'col','remove',index);
        },

        /**
         * Skip hidden cells for selection
         *
         * @param r int
         * @param c int
         * @param r2 int
         * @param c2 int
         */
        afterSelection: function (r, c, r2, c2) {
            if (meta[r][c].hide) {
                // user navigated into a hidden cell! we need to find the next selectable cell
                var x = 0;

                var v = r - lastselect.row;
                if (v > 0) v = 1;
                if (v < 0) v = -1;

                var h = c - lastselect.col;
                if (h > 0) h = 1;
                if (h < 0) h = -1;

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
        }
    });

});
