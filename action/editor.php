<?php

/**
 * Table editor
 *
 * @author Adrian Lang <lang@cosmocode.de>
 * @author Andreas Gohr <gohr@cosmocode.de>
 */

use dokuwiki\Extension\ActionPlugin;
use dokuwiki\Extension\EventHandler;
use dokuwiki\Extension\Event;
use dokuwiki\Utf8\PhpString;
use dokuwiki\Form\Form;
use dokuwiki\Utf8;

/**
 * handles all the editor related things
 *
 * like displaying the editor and adding custom edit buttons
 */
class action_plugin_edittable_editor extends ActionPlugin
{
    /**
     * Register its handlers with the DokuWiki's event controller
     */
    public function register(EventHandler $controller)
    {
        // register custom edit buttons
        $controller->register_hook('HTML_SECEDIT_BUTTON', 'BEFORE', $this, 'seceditButton');

        // register our editor
        $controller->register_hook('EDIT_FORM_ADDTEXTAREA', 'BEFORE', $this, 'editform');

        // register preprocessing for accepting editor data
        // $controller->register_hook('ACTION_ACT_PREPROCESS', 'BEFORE', $this, 'handleTablePost');
        $controller->register_hook('PLUGIN_EDITTABLE_PREPROCESS_EDITOR', 'BEFORE', $this, 'handleTablePost');
    }

    /**
     * Add a custom edit button under each table
     *
     * The target 'table' is provided by DokuWiki's XHTML core renderer in the table_close() method
     *
     * @param Event $event
     */
    public function seceditButton(Event $event)
    {
        if ($event->data['target'] !== 'table') return;

        $event->data['name'] = $this->getLang('secedit_name');
    }

    /**
     * Creates the actual Table Editor form
     *
     * @param Event $event
     */
    public function editform(Event $event)
    {
        global $TEXT;
        global $RANGE;
        global $INPUT;

        if ($event->data['target'] !== 'table') return;
        if (!$RANGE) {
            // section editing failed, use the default editor instead
            $event->data['target'] = 'section';
            return;
        }
        if (!$this->isTableOnly($TEXT)) {
            // the table editor rebuilds the rows only and would drop the markup around them
            msg($this->getLang('mixedmarkup'), -1);
            $event->data['target'] = 'section';
            return;
        }

        $event->stopPropagation();
        $event->preventDefault();

        /** @var renderer_plugin_edittable_json $Renderer our own renderer to convert table to array */
        $Renderer     = plugin_load('renderer', 'edittable_json', true);
        $instructions = p_get_instructions($TEXT);

        // Loop through the instructions
        foreach ($instructions as $instruction) {
            // Execute the callback against the Renderer
            call_user_func_array([&$Renderer, $instruction[0]], $instruction[1]);
        }

        // output data and editor field

        /** @var Form $form */
        $form = $event->data['form'];

        // data for handsontable
        $form->setHiddenField('edittable_data', $Renderer->getDataJSON());
        $form->setHiddenField('edittable_meta', $Renderer->getMetaJSON());
        $form->addHTML('<div id="edittable__editor"></div>');

        // set data from action asigned to "New Table" button in the toolbar
        foreach ($INPUT->post->arr('edittable__new', []) as $k => $v) {
            $form->setHiddenField("edittable__new[$k]", $v);
        }

        // set target and range to keep track during previews
        $form->setHiddenField('target', 'table');
        $form->setHiddenField('range', $RANGE);
    }

    /**
     * Does the given wiki text consist of table rows only?
     *
     * The table editor replaces the whole edit section with the table it rebuilds, so anything in
     * the section that is not part of a row is lost on save. Syntax whose markup spans several
     * rows is such a case: the parser swallows it and the editor never sees it.
     *
     * A construct inside a cell may span several lines as well. Those lines belong to their row,
     * so they are folded into it before the check.
     *
     * @param string $text wiki text of the edit section
     * @return bool true when every line is a table row
     */
    public function isTableOnly($text)
    {
        foreach (explode("\n", $this->maskProtected($text)) as $line) {
            // the section may be padded with empty lines
            if (trim($line) === '') continue;

            // a row starts and ends with a cell delimiter
            if (!preg_match('/^[\t ]*[|^](?:.*[|^])?[\t ]*$/', $line)) return false;
        }
        return true;
    }

    /**
     * Handles a POST from the table editor
     *
     * This function preprocesses a POST from the table editor and converts it to plain DokuWiki markup
     *
     * @author Andreas Gohr <gohr@cosmocode,de>
     */
    public function handleTablePost(Event $event)
    {
        global $TEXT;
        global $INPUT;
        if (!$INPUT->post->has('edittable_data')) return;

        $data = json_decode($INPUT->post->str('edittable_data'), true);
        $meta = json_decode($INPUT->post->str('edittable_meta'), true);

        $TEXT = $this->buildTable($data, $meta);
    }

    /**
     * Create a DokuWiki table
     *
     * converts the table array to plain wiki markup text. pads the table so the markup is easy to read
     *
     * Padding can be switched off with the "pad markup" setting. Cells then carry the spaces their
     * alignment needs and nothing more, so a cell without an alignment gets no alignment marker.
     *
     * @param array $data table content for each cell
     * @param array $meta meta data for each cell
     * @return string
     */
    public function buildTable($data, $meta)
    {
        $table = '';
        $rows  = count($data);
        $cols  = $rows ? count($data[0]) : 0;
        $padMarkup = (bool)$this->getConf('pad markup');

        // pick the markup for every line break before the cells are measured
        for ($row = 0; $row < $rows; $row++) {
            for ($col = 0; $col < $cols; $col++) {
                $data[$row][$col] = $this->cellMarkup($data[$row][$col]);
            }
        }

        $colmax = $cols ? array_fill(0, $cols, 0) : [];

        // find maximum column widths
        for ($row = 0; $row < $rows; $row++) {
            for ($col = 0; $col < $cols; $col++) {
                $len = $this->strWidth($data[$row][$col]);

                // alignment adds padding
                if (isset($meta[$row][$col]['align']) && $meta[$row][$col]['align'] == 'center') {
                    $len += 4;
                } else {
                    $len += 3;
                }

                // remember lenght
                $meta[$row][$col]['length'] = $len;

                // a cell that spans several lines has no single width
                if (str_contains($data[$row][$col], "\n")) continue;

                if ($len > $colmax[$col]) $colmax[$col] = $len;
            }
        }

        $last = '|'; // used to close the last cell
        for ($row = 0; $row < $rows; $row++) {
            for ($col = 0; $col < $cols; $col++) {
                // hidden cells may carry no span info of their own
                if (!isset($meta[$row][$col]['colspan'])) $meta[$row][$col]['colspan'] = 1;
                if (!isset($meta[$row][$col]['rowspan'])) $meta[$row][$col]['rowspan'] = 1;

                // minimum padding according to alignment
                $align = $meta[$row][$col]['align'] ?? null;
                if ($align == 'center') {
                    $lpad = 2;
                    $rpad = 2;
                } elseif ($align == 'right') {
                    $lpad = 2;
                    $rpad = 1;
                } elseif ($align == 'left' || $padMarkup) {
                    $lpad = 1;
                    $rpad = 2;
                } else {
                    // two spaces would mark the cell as left aligned, which it is not
                    $lpad = 1;
                    $rpad = 1;
                    if ($data[$row][$col] === '') $rpad = 0;
                }

                // target width of this column
                $target = $colmax[$col];

                // colspanned columns span all the cells
                for ($i = 1; $i < $meta[$row][$col]['colspan']; $i++) {
                    $target += $colmax[$col + $i];
                }

                // copy colspans to rowspans below if any
                if ($meta[$row][$col]['colspan'] > 1) {
                    for ($i = 1; $i < $meta[$row][$col]['rowspan']; $i++) {
                        $meta[$row + $i][$col]['colspan'] = $meta[$row][$col]['colspan'];
                    }
                }

                // how much padding needs to be added? a multiline cell gets none
                $length = $meta[$row][$col]['length'];
                $addpad = 0;
                if ($padMarkup && !str_contains($data[$row][$col], "\n")) {
                    $addpad = $target - $length;
                }

                // decide which side needs padding
                if (isset($meta[$row][$col]['align']) && $meta[$row][$col]['align'] == 'right') {
                    $lpad += $addpad;
                } else {
                    $rpad += $addpad;
                }

                // add the padding
                $cdata = $data[$row][$col];
                if (!isset($meta[$row][$col]['hide']) || !$meta[$row][$col]['hide'] || $cdata) {
                    $cdata = str_pad('', $lpad) . $cdata . str_pad('', $rpad);
                }

                // finally add the cell
                $last   =  (isset($meta[$row][$col]['tag']) && $meta[$row][$col]['tag'] == 'th') ? '^' : '|';
                $table .= $last;
                $table .= $cdata;
            }

            // close the row
            $table .= "$last\n";
        }
        $table = rtrim($table, "\n");

        return $table;
    }

    /**
     * Give every line break of a cell the markup that fits it
     *
     * The editor shows all line breaks alike. A line break inside a verbatim construct belongs
     * to that construct and keeps the cell open, so it stays. Any other one would end the table
     * row and becomes a forced line break.
     *
     * @param string $text cell text as the editor posted it
     * @return string
     */
    public function cellMarkup($text)
    {
        $text = str_replace(["\r\n", "\r"], "\n", $text);
        if (!str_contains($text, "\n")) return $text;

        $ranges = $this->protectedRanges($text);

        return preg_replace_callback(
            '/\n/',
            function ($match) use ($ranges) {
                $pos = $match[0][1];
                foreach ($ranges as $range) {
                    if ($pos >= $range[0] && $pos < $range[1]) return "\n";
                }
                return '\\\\ ';
            },
            $text,
            -1,
            $count,
            PREG_OFFSET_CAPTURE
        );
    }

    /**
     * Replace the line breaks inside verbatim constructs by spaces
     *
     * The masked text has the same length as the given one, so offsets into it still match.
     *
     * @param string $text wiki text
     * @return string
     */
    protected function maskProtected($text)
    {
        foreach ($this->protectedRanges($text) as $range) {
            for ($pos = $range[0]; $pos < $range[1]; $pos++) {
                if ($text[$pos] === "\n") $text[$pos] = ' ';
            }
        }
        return $text;
    }

    /**
     * Locate the verbatim constructs of a wiki text
     *
     * The text is parsed on its own. The parser hands out the source of every construct it
     * protects, which is searched for from the end of the construct before it, because the
     * parser reports them in source order.
     *
     * A plugin that opens a block covers everything up to its exit, because that markup belongs
     * to the plugin even though the parser reports its content as ordinary syntax. A block that
     * is never closed yields no range at all, so its line breaks are treated as unprotected.
     *
     * @param string $text wiki text
     * @return array start and end offset of every verbatim construct
     */
    protected function protectedRanges($text)
    {
        $ranges = [];
        $offset = 0;
        $level = 0;
        $blockstart = 0;

        foreach (p_get_instructions($text) as $instruction) {
            $state = null;
            if ($instruction[0] === 'plugin') {
                $source = $instruction[1][3] ?? '';
                $state = $instruction[1][2] ?? null;
            } elseif (in_array($instruction[0], ['code', 'file', 'unformatted', 'php', 'html'])) {
                $source = $instruction[1][0];
            } else {
                continue;
            }

            if ((string)$source === '') continue;
            $pos = strpos($text, (string) $source, $offset);
            if ($pos === false) continue;

            $offset = $pos + strlen($source);

            if ($state === DOKU_LEXER_ENTER) {
                if ($level === 0) $blockstart = $pos;
                $level++;
            } elseif ($state === DOKU_LEXER_EXIT) {
                if ($level > 0) $level--;
                if ($level === 0) $ranges[] = [$blockstart, $offset];
            } elseif ($level === 0) {
                // a match inside an open block is covered by that block already
                $ranges[] = [$pos, $offset];
            }
        }

        return $ranges;
    }

    /**
     * Return width of string
     *
     * @param string $str
     * @return int
     */
    public function strWidth($str)
    {
        static $callable;

        if (isset($callable)) {
            return $callable($str);
        }
        if (UTF8_MBSTRING) {
            // count fullwidth characters as 2, halfwidth characters as 1
            $callable = 'mb_strwidth';
        } else {
            // count any characters as 1
            $callable = PhpString::strlen(...);
        }
        return $this->strWidth($str);
    }
}
