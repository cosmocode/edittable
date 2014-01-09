jQuery(function () {
    var $container = jQuery('#edittable__editor');
    if(!$container.length) return;

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
        contextMenu: ["row_above", "row_below", "hsep1", "col_left", "col_right", "hsep2", "remove_row", "remove_col"], //fixme add span
        multiSelect: false, // until properly tested with col/row span
        fillHandle: false, // until properly tested with col/row span
        undo: false, // until properly tested with col/row span
        manualColumnResize: true,

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
            return meta[row][col]
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

            Handsontable.renderers.TextRenderer.apply(this, arguments);
        },

        /**
         * This recalculates the col and row spans and makes sure all correct cells are hidden
         *
         * @param forced bool
         */
        beforeRender: function (forced) {
            var row, r, c, col;

            // unhide all cells
            for (row = 0; row < data.length; row++) {
                for (col = 0; col < data[0].length; col++)
                    if (meta[row][col].hide) {
                        meta[row][col].hide = false;
                        data[row][col] = '';
                    }
            }


            // rehide needed cells
            for (row = 0; row < data.length; row++) {
                for (col = 0; col < data[0].length; col++) {
                    var colspan = 1;
                    var rowspan = 1;
                    if (meta[row][col].colspan) colspan = meta[row][col].colspan;
                    if (meta[row][col].rowspan) rowspan = meta[row][col].rowspan;

                    for (c = 1; c < colspan; c++) {
                        // hide colspanned cell in same row
                        meta[row][col + c].hide = true;
                        data[row][col + c] = '';

                        // hide colspanned rows below if rowspan is in effect as well
                        for (r = 1; r < rowspan; r++) {
                            meta[row + r][col + c].hide = true;
                            data[row + r][col + c] = '';
                        }

                    }

                    // hide rowspanned columns
                    for (r = 1; r < rowspan; r++) {
                        meta[row + r][col].hide = true;
                        data[row + r][col] = ':::';
                    }
                }
            }
        },

        /**
         * Update meta data array when rows are added
         *
         * @param index int
         * @param amount int
         */
        afterCreateRow: function (index, amount) {
            var i;
            var cols = 1; // minimal number of cells
            if (data[0]) cols = data[0].length;

            // insert into meta array
            for (i = 0; i < amount; i++) {
                var newrow = [];
                for (i = 0; i < cols; i++) newrow.push({});
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
            for (var row = 0; row < data.length; row++) {
                for (var i = 0; i < amount; i++) {
                    meta[row].splice(index, 0, {});
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
         * Update meta data array when a column was moved
         *
         * @param oldIndex
         * @param newIndex
         */
        afterColumnMove: function (oldIndex, newIndex) {
            /* FIXME still broken
             for (var row = 0; row < data.length; row++) {
             meta[row].splice(newIndex, 0, meta[row].splice(oldIndex, 1)[0]);
             data[row].splice(newIndex, 0, data[row].splice(oldIndex, 1)[0]);
             }
             */
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

                if (v != 0) {
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
                } else if (h != 0) {
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
         * Store data and meta back in the form
         *
         * @param changes
         * @param source
         */
        afterChange: function(changes, source){
            $datafield.val(JSON.stringify(data));
            $metafield.val(JSON.stringify(meta));
        }

    });

});