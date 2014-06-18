/**
 * This configures the Handsontable Plugin
 */
jQuery(function () {
    var $container = jQuery('#edittable__editor');
    if (!$container.length) return;

    var $form = jQuery('#dw__editform');
    var $datafield = $form.find('input[name=edittable_data]');
    var $metafield = $form.find('input[name=edittable_meta]');

    var data = JSON.parse($datafield.val());
    var meta = JSON.parse($metafield.val());
    var lastselect = {row: 0, col: 0};

    $container.handsontable({
        data: data,
        startRows: 5,
        startCols: 5,
        colHeaders: true,
        rowHeaders: true,
        multiSelect: false, // until properly tested with col/row span
        fillHandle: false, // until properly tested with col/row span
        undo: false, // until properly tested with col/row span
        manualColumnResize: true,
        editTableColumnMove: true, // custom plugin
        editTableRowMove: true, // custom plugin
        outsideClickDeselects: false,
        contextMenu: getEditTableContextMenu(data, meta),

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
            this.rootElement.find('textarea.handsontableInput').attr('id', 'handsontable__input');

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

                    // make sure no data cell is undefined/null
                    if (!data[row][col]) data[row][col] = '';
                }
            }

            // rehide needed cells
            for (row = 0; row < data.length; row++) {
                for (col = 0; col < data[0].length; col++) {
                    var colspan = meta[row][col].colspan;
                    var rowspan = meta[row][col].rowspan;

                    for (c = 1; c < colspan; c++) {
                        // does the colspan reach out of the table? decrease it
                        if (!meta[row][col + c]) {
                            meta[row][col].colspan--;
                            continue;
                        }

                        // hide colspanned cell in same row
                        meta[row][col + c].hide = true;
                        meta[row][col + c].rowspan = 1;
                        meta[row][col + c].colspan = 1;
                        data[row][col + c] = '';

                        this.raw.colinfo[col].colspan = true;
                        this.raw.colinfo[col + c].colspan = true;

                        // hide colspanned rows below if rowspan is in effect as well
                        for (r = 1; r < rowspan; r++) {
                            // does the rowspan reach out of the table? decrease it
                            if (!meta[row + r]) {
                                meta[row][col].rowspan--;
                                continue;
                            }

                            meta[row + r][col + c].hide = true;
                            meta[row + r][col + c].rowspan = 1;
                            meta[row + r][col + c].colspan = 1;
                            data[row + r][col + c] = '';

                            this.raw.rowinfo[row + r].rowspan = true;
                        }

                    }

                    // hide rowspanned columns
                    rowspan = meta[row][col].rowspan; // might have changed above
                    for (r = 1; r < rowspan; r++) {
                        // does the rowspan reach out of the table? decrease it
                        if (!meta[row + r]) {
                            meta[row][col].rowspan--;
                            continue;
                        }

                        meta[row + r][col].hide = true;
                        meta[row + r][col].rowspan = 1;
                        meta[row + r][col].colspan = 1;
                        data[row + r][col] = ':::';

                        this.raw.rowinfo[row].rowspan = true;
                        this.raw.rowinfo[row + r].rowspan = true;
                    }
                }
            }

            // Store data and meta back in the form
            $datafield.val(JSON.stringify(data));
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
        },

        /**
         * Update meta data array when rows are removed
         *
         * @param index int
         * @param amount int
         */
        afterRemoveRow: function (index, amount) {
            meta.splice(index, amount);
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