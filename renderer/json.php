<?php

/**
 * Table Renderer for Table Editor
 *
 * This renderer will use the inverse renderer to create Wiki text for everything inside the table. The table
 * it self is stored in two arrays which then can be outputted as JSON.
 *
 * @author     Andreas Gohr <gohr@cosmocode.de>
 * @license    GPL 2 (http://www.gnu.org/licenses/gpl.html)
 */

class renderer_plugin_edittable_json extends renderer_plugin_edittable_inverse
{
    /** @var array holds the data cells */
    private $tdata = [];
    /** @var array holds the cell meta data */
    private $tmeta = [];

    /** @var array holds the meta data of the current cell */
    private $tmetacell = [];

    /** @var int current row */
    private $current_row = -1;

    /** @var int current column */
    private $current_col = 0;

    /** @var bool whether the cells being collected belong to the table head */
    private $in_thead = false;

    /**
     * Returns the whole table data as two dimensional array
     *
     * @return array
     */
    public function getDataJSON()
    {
        return json_encode($this->tdata);
    }

    /**
     * Returns meta data for all cells in a two dimensional array of arrays
     *
     * @return array
     */
    public function getMetaJSON()
    {
        return json_encode($this->tmeta);
    }

    // renderer functions below

    public function table_open($maxcols = null, $numrows = null, $pos = null)
    {
        // FIXME: is this needed somewhere? $this->_counter['table_begin_pos'] = strlen($this->doc);
    }

    /**
     * Normalize the collected table
     *
     * Fills up empty and short rows, so every row has a cell in every column, and sorts the cells
     * of each row by their column.
     *
     * @param int|null $pos byte position of the table in the source
     */
    public function table_close($pos = null)
    {
        // a table always has at least one column, even when all of its rows are empty
        $cols = 1;
        foreach ($this->tmeta as $cells) {
            $cols = max($cols, max(array_keys($cells)) + 1);
        }
        for ($row = 0; $row <= $this->current_row; $row++) {
            for ($col = 0; $col < $cols; $col++) {
                if (isset($this->tmeta[$row][$col])) continue;
                $this->tmeta[$row][$col] = ['tag' => 'td', 'colspan' => 1, 'rowspan' => 1, 'align' => null];
                $this->tdata[$row][$col] = '';
            }
            ksort($this->tdata[$row]);
            ksort($this->tmeta[$row]);
        }
    }

    /**
     * Start of the table head
     *
     * DokuWiki puts a row into the head when all its cells were written with a caret. Any normal
     * cell in there was added by the parser to pad a short row, so remembering the section keeps
     * such a row a head row when the table is written back.
     */
    public function tablethead_open()
    {
        $this->in_thead = true;
    }

    /**
     * End of the table head
     */
    public function tablethead_close()
    {
        $this->in_thead = false;
    }

    public function tablerow_open()
    {
        // move counters
        $this->current_row++;
        $this->current_col = 0;
    }

    public function tablerow_close()
    {
    }

    public function tableheader_open($colspan = 1, $align = null, $rowspan = 1)
    {
        $this->tablefieldOpen('th', $colspan, $align, $rowspan);
    }

    public function tableheader_close()
    {
        $this->tablefieldClose();
    }

    public function tablecell_open($colspan = 1, $align = null, $rowspan = 1)
    {
        $this->tablefieldOpen('td', $colspan, $align, $rowspan);
    }

    public function tablecell_close()
    {
        $this->tablefieldClose();
    }

    /**
     * Used for a opening THs and TDs
     *
     * @param $tag
     * @param $colspan
     * @param $align
     * @param $rowspan
     */
    private function tablefieldOpen($tag, $colspan, $align, $rowspan)
    {
        // skip cells that already exist - those are previous (span) cells!
        while (isset($this->tmeta[$this->current_row][$this->current_col])) {
            $this->current_col++;
        }

        // remember these, we use them when closing
        $this->tmetacell = [];
        $this->tmetacell['tag'] = $this->in_thead ? 'th' : $tag;
        $this->tmetacell['colspan'] = $colspan;
        $this->tmetacell['rowspan'] = $rowspan;
        $this->tmetacell['align'] = $align;

        // empty $doc
        $this->doc = '';
        $this->startCell();
    }

    /**
     * The text of the current cell as the editor shows it
     *
     * A line break inside a verbatim construct comes from the source and keeps the cell open,
     * so it stays. Any other line break would end the table row and becomes a space. A forced
     * line break becomes a real one, so the editor shows a single kind of line break.
     *
     * @return string
     */
    private function cellText()
    {
        $text = trim($this->doc);
        $lead = strlen($this->doc) - strlen(ltrim($this->doc));

        return preg_replace_callback(
            '/\n|\\\\\\\\\s/',
            function ($match) use ($lead) {
                [$found, $pos] = $match[0];
                if ($this->isProtected($lead + $pos)) return $found;
                return $found === "\n" ? ' ' : "\n";
            },
            $text,
            -1,
            $count,
            PREG_OFFSET_CAPTURE
        );
    }

    /**
     * Used for closing THs and TDs
     */
    private function tablefieldClose()
    {
        $this->inTableCell = false;

        // these have been set to the correct cell already
        $row = $this->current_row;
        $col = $this->current_col;

        $this->tdata[$row][$col] = $this->cellText();
        $this->tmeta[$row][$col] = $this->tmetacell; // as remembered in the open call

        // now fill up missing span cells
        {
            $rowspan = $this->tmetacell['rowspan'];
            $colspan = $this->tmetacell['colspan'];

        for ($c = 1; $c < $colspan; $c++) {
            // hide colspanned cell in same row
            $this->tmeta[$row][$col + $c]['tag'] = $this->tmeta[$row][$col]['tag'];
            $this->tmeta[$row][$col + $c]['hide'] = true;
            $this->tmeta[$row][$col + $c]['rowspan'] = 1;
            $this->tmeta[$row][$col + $c]['colspan'] = 1;
            $this->tdata[$row][$col + $c] = '';

            // hide colspanned rows below if rowspan is in effect as well
            for ($r = 1; $r < $rowspan; $r++) {
                $this->tmeta[$row + $r][$col + $c]['hide'] = true;
                $this->tmeta[$row + $r][$col + $c]['rowspan'] = 1;
                $this->tmeta[$row + $r][$col + $c]['colspan'] = 1;
                $this->tdata[$row + $r][$col + $c] = '';
            }
        }

            // hide rowspanned columns
        for ($r = 1; $r < $rowspan; $r++) {
            $this->tmeta[$row + $r][$col]['hide'] = true;
            $this->tmeta[$row + $r][$col]['rowspan'] = 1;
            $this->tmeta[$row + $r][$col]['colspan'] = 1;
            $this->tdata[$row + $r][$col] = ':::';
        }
        }
    }
}
