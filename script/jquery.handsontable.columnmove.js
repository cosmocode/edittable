/**
 * Handle Column Moves on our Editor
 *
 * based on the example plugin that comes with Handsontable but simplified and adjusted to work on our
 * custom data/meta datastructure
 *
 * @author Andreas Gohr <andi@cosmocode.de>
 * @constructor
 */
function EditTableColumnMove() {
    var pressed,
        startCol,
        endCol,
        startX,
        startOffset;

    var ghost = document.createElement('DIV'),
        ghostStyle = ghost.style;

    ghost.className = 'ghost';
    ghostStyle.position = 'absolute';
    ghostStyle.top = '25px';
    ghostStyle.left = 0;
    ghostStyle.width = '10px';
    ghostStyle.height = '10px';
    ghostStyle.backgroundColor = '#CCC';
    ghostStyle.opacity = 0.7;

    /**
     * Attach all the events
     */
    var bindMoveColEvents = function () {
        var instance = this;

        /**
         * during drag operation
         */
        instance.rootElement.on('mousemove.editTableColumnMove', function (e) {
            if (pressed) {
                ghostStyle.left = startOffset + e.pageX - startX + 6 + 'px';
                if (ghostStyle.display === 'none') {
                    ghostStyle.display = 'block';
                }
            }
        });

        /**
         * end of drag operation
         *
         * The column move is executed here
         */
        instance.rootElement.on('mouseup.editTableColumnMove', function () {
            if (pressed) {
                if (startCol < endCol) {
                    endCol--;
                }
                if (instance.getSettings().rowHeaders) {
                    startCol--;
                    endCol--;
                }
                jQuery('.editTableColumnMover.active').removeClass('active');
                pressed = false;
                ghostStyle.display = 'none';

                if (startCol == endCol)  return;

                // if this row is part of a row span, do not move
                if (instance.raw.colinfo[endCol].colspan) return;

                // swap cols in each row
                for (var i = 0; i < instance.raw.data.length; i++) {
                    instance.raw.data[i].splice(endCol, 0, instance.raw.data[i].splice(startCol, 1)[0]);
                    instance.raw.meta[i].splice(endCol, 0, instance.raw.meta[i].splice(startCol, 1)[0]);
                }

                instance.forceFullRender = true;
                instance.view.render(); //updates all
            }
        });

        /**
         * start drag operation
         */
        instance.rootElement.on('mousedown.editTableColumnMove', '.editTableColumnMover', function (e) {

            var mover = e.currentTarget;
            var TH = instance.view.wt.wtDom.closest(mover, 'TH');
            startCol = instance.view.wt.wtDom.index(TH) + instance.colOffset();
            endCol = startCol;
            pressed = true;
            startX = e.pageX;

            var TABLE = instance.$table[0];
            TABLE.parentNode.appendChild(ghost);
            ghostStyle.width = instance.view.wt.wtDom.outerWidth(TH) + 'px';
            ghostStyle.height = instance.view.wt.wtDom.outerHeight(TABLE) + 'px';
            startOffset = parseInt(instance.view.wt.wtDom.offset(TH).left - instance.view.wt.wtDom.offset(TABLE).left, 10);
            ghostStyle.left = startOffset + 6 + 'px';
        });

        /**
         * on mouseover, show drag handle
         */
        instance.rootElement.on('mouseenter.editTableColumnMove', 'td, th', function () {
            if (pressed) {
                var active = instance.view.THEAD.querySelector('.editTableColumnMover.active');
                if (active) {
                    instance.view.wt.wtDom.removeClass(active, 'active');
                }
                endCol = instance.view.wt.wtDom.index(this) + instance.colOffset();

                // if this row is part of a row span, do not move
                if (instance.raw.colinfo[endCol - 1].colspan) return;

                var THs = instance.view.THEAD.querySelectorAll('th');
                var mover = THs[endCol].querySelector('.editTableColumnMover');
                instance.view.wt.wtDom.addClass(mover, 'active');
            }
        });

        instance.addHook('afterDestroy', unbindMoveColEvents);
    };

    /**
     * Remove all the Events
     */
    var unbindMoveColEvents = function () {
        var instance = this;
        instance.rootElement.off('mouseup.editTableColumnMove');
        instance.rootElement.off('mousemove.editTableColumnMove');
        instance.rootElement.off('mousedown.editTableColumnMove');
        instance.rootElement.off('mouseenter.editTableColumnMove');
    };

    /**
     * Initialize the plugin
     */
    this.init = function () {
        var instance = this;
        var editTableColMoveEnabled = !!(this.getSettings().editTableColumnMove);

        if (editTableColMoveEnabled) {
            instance.forceFullRender = true;
            bindMoveColEvents.call(this);

        } else {
            unbindMoveColEvents.call(this);
        }
    };

    /**
     * Add a move handler to each column head
     *
     * @param col
     * @param TH
     */
    this.getColHeader = function (col, TH) {
        if (this.getSettings().editTableColumnMove) {
            // if this col is part of a col span, do not add move handle
            if (this.raw.colinfo[col].colspan) return;

            var DIV = document.createElement('DIV');
            DIV.className = 'editTableColumnMover';
            TH.firstChild.appendChild(DIV);
        }
    };
}

var htEditTableColumnMove = new EditTableColumnMove();

Handsontable.PluginHooks.add('afterInit', function () {
    htEditTableColumnMove.init.call(this);
});

Handsontable.PluginHooks.add('afterGetColHeader', htEditTableColumnMove.getColHeader);
