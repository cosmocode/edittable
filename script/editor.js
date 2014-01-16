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
        outsideClickDeselects: false,

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
            var original_pasteText = pasteText;
            pasteText = function (selection, text, opts) {
                original_pasteText(selection, text, opts); // do what pasteText does
                // trigger resize
                jQuery('#handsontable__input').data('AutoResizer').check();
            }
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
        afterChange: function (changes, source) {
            $datafield.val(JSON.stringify(data));
            $metafield.val(JSON.stringify(meta));
        },

        /**
         * Defines our own contextMenu with custom callbacks
         */
        contextMenu: {
            items: {
                toggle_header: {
                    name: LANG.plugins.edittable.toggle_header,
                    callback: function (key, selection) {
                        var col = selection.start.col();
                        var row = selection.start.row();

                        if(meta[row][col].tag && meta[row][col].tag === 'th'){
                            meta[row][col].tag = 'td';
                        }else{
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
                    disabled: function() {
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
                    disabled: function() {
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
                    disabled: function() {
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

                        if(meta[row][col].colspan){
                            meta[row][col].colspan++;
                        } else {
                            meta[row][col].colspan = 2;
                        }

                        // copy over any data from the merged cell   fixme handle colspanned cells
                        data[row][col] += ' '+data[row][col+1];

                        this.render();
                    },
                    /**
                     * don't show when not enough space for colspan
                     *
                     * @returns {boolean}
                     */
                    disabled: function(){
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
                    callback: function(key, selection){
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
                    disabled: function() {
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

                        if(meta[row][col].rowspan){
                            meta[row][col].rowspan++;
                        } else {
                            meta[row][col].rowspan = 2;
                        }

                        // copy over any data from the merged cell  fixme handle colspanned cells
                        data[row][col] += ' '+data[row+1][col];

                        this.render();
                    },
                    /**
                     * don't show when not enough space for rowspan
                     *
                     * @returns {boolean}
                     */
                    disabled: function(){
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
                    callback: function(key, selection){
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
                    disabled: function() {
                        var selection = this.getSelected();
                        var row = selection[0];
                        var col = selection[1];

                        return !(meta[row][col].rowspan && meta[row][col].rowspan > 1);
                    }
                }

            }
        }

    });

});