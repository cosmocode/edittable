<?php
require_once dirname(__FILE__).'/../action/editor.php';

/**
 * @group plugin_edittable
 * @group plugins
 */
class action_plugin_edittable_editor_test extends DokuWikiTest {


    function test_table() {
        $data = array(
            array('H 1', 'H 2', 'H 3', '** H 4 **'),
            array('R 1 C 1', 'R 1 C 2', '', 'R 1 Col 4' ),
            array('R 2 C 1', ':::', '', 'R 2 Col 4'),
            array('R 3 C 1', 'R 3 C 2', 'R 3 C 3', 'R 3 Col 4')
        );

        $meta = array(
            array(
                array('align' => 'left', 'colspan' => 1, 'rowspan' => 1, 'tag' => 'th'),
                array('align' => 'center', 'colspan' => 1, 'rowspan' => 1, 'tag' => 'th'),
                array('align' => 'right', 'colspan' => 1, 'rowspan' => 1, 'tag' => 'th'),
                array('align' => 'left', 'colspan' => 1, 'rowspan' => 1, 'tag' => 'th'),
            ),
            array(
                array('align' => 'left', 'colspan' => 1, 'rowspan' => 1, 'tag' => 'td'),
                array('align' => 'left', 'colspan' => 2, 'rowspan' => 2, 'tag' => 'td'),
                array('hide' => true),
                array('align' => null, 'colspan' => 1, 'rowspan' => 1, 'tag' => 'td'),
            ),
            array(
                array('align' => 'left', 'colspan' => 1, 'rowspan' => 1, 'tag' => 'td'),
                array('hide' => true),
                array('hide' => true),
                array('align' => null, 'colspan' => 1, 'rowspan' => 1, 'tag' => 'td'),
            ),
            array(
                array('align' => 'left', 'colspan' => 1, 'rowspan' => 1, 'tag' => 'td'),
                array('align' => 'left', 'colspan' => 1, 'rowspan' => 1, 'tag' => 'td'),
                array('align' => null, 'colspan' => 1, 'rowspan' => 1, 'tag' => 'td'),
                array('align' => null, 'colspan' => 1, 'rowspan' => 1, 'tag' => 'td'),
            ),
        );

        $expect = <<<EOF
^ H 1      ^  H 2     ^      H 3 ^ ** H 4 **  ^
| R 1 C 1  | R 1 C 2            || R 1 Col 4  |
| R 2 C 1  | :::                || R 2 Col 4  |
| R 3 C 1  | R 3 C 2  | R 3 C 3  | R 3 Col 4  |
EOF;

        $action = new action_plugin_edittable_editor();
        $output = $action->buildTable($data, $meta);

        $this->assertEquals($expect, $output);
    }

    /**
     * A cell that spans several lines keeps its line breaks and does not widen its column
     */
    function test_table_multiline_cell() {
        $data = array(
            array("<code>\nline1\nline2\n</code>", 'plain'),
            array('a', 'b'),
        );

        $meta = array(
            array(
                array('align' => null, 'colspan' => 1, 'rowspan' => 1, 'tag' => 'td'),
                array('align' => null, 'colspan' => 1, 'rowspan' => 1, 'tag' => 'td'),
            ),
            array(
                array('align' => null, 'colspan' => 1, 'rowspan' => 1, 'tag' => 'td'),
                array('align' => null, 'colspan' => 1, 'rowspan' => 1, 'tag' => 'td'),
            ),
        );

        $expect = "| <code>\nline1\nline2\n</code>  | plain  |\n| a  | b      |";

        $action = new action_plugin_edittable_editor();
        $this->assertEquals($expect, $action->buildTable($data, $meta));
    }

    /**
     * A line break the user typed becomes a forced line break
     */
    function test_typed_linebreak() {
        $action = new action_plugin_edittable_editor();

        $this->assertEquals('a\\\\ b', $action->cellMarkup("a\nb"));
    }

    /**
     * A line break inside a verbatim construct stays a line break
     */
    function test_protected_linebreak() {
        $action = new action_plugin_edittable_editor();

        $this->assertEquals("<code>\nx\n</code>", $action->cellMarkup("<code>\nx\n</code>"));
    }

    /**
     * Each line break of a cell is judged on its own
     */
    function test_mixed_linebreaks() {
        $action = new action_plugin_edittable_editor();

        $this->assertEquals(
            "typed\\\\ newline <code>\nx\n</code> tail",
            $action->cellMarkup("typed\nnewline <code>\nx\n</code> tail")
        );
    }

    /**
     * Two constructs with the same content are told apart by their position
     */
    function test_repeated_construct() {
        $action = new action_plugin_edittable_editor();

        $input = "<code>\nx\n</code>\nmid\n<code>\nx\n</code>";
        $this->assertEquals(
            "<code>\nx\n</code>\\\\ mid\\\\ <code>\nx\n</code>",
            $action->cellMarkup($input)
        );
    }

    /**
     * @return array [wiki text, is it a table only?]
     */
    function provideTableOnly() {
        return array(
            'rows' => array("| a | b |\n| c | d |", true),
            'header' => array("^ a ^ b ^\n| c | d |", true),
            'colspan' => array("| a ||\n| c | d |", true),
            'alignment' => array("|  a  |    b |\n| c | d |", true),
            'padded' => array("\n| a | b |\t\n", true),
            'no cells' => array('|', true),
            'row spanning markup' => array("| a | b |<pagemod 1>\n| @@x@@ | @@y@@ |</pagemod>", false),
            'trailing text' => array("| a | b |\nsome text", false),
            'multiline cell' => array("| a | %%x\ny%% |", true),
            'multiline code cell' => array("| a | <code>\nx\n</code> |", true),
            'multiline cell in several rows' => array("| a | <code>\nx\n</code> |\n| b | c |", true),
        );
    }

    /**
     * @dataProvider provideTableOnly
     */
    function test_isTableOnly($text, $expect) {
        $action = new action_plugin_edittable_editor();
        $this->assertEquals($expect, $action->isTableOnly($text));
    }


    /**
     * @return array [wiki text of a table]
     */
    function provideRoundtrip() {
        return array(
            'code block' => array("| <code>\nline1\nline2\n</code> | b |\n"),
            'text around a block' => array("| foo <code>\nx\n</code> bar | b |\n"),
            'two blocks with the same content' => array("| <code>\nx\n</code> mid <code>\nx\n</code> | b |\n"),
            'nowiki span' => array("| a %%x\ny%% b | c |\n"),
            'forced line break and a block' => array("| a\\\\ b <code>\nx\n</code> | c |\n"),
            'plain table' => array("^ A ^ B ^\n| a | b |\n"),
        );
    }

    /**
     * Opening a table in the editor and saving it again must not change its cells
     *
     * @dataProvider provideRoundtrip
     */
    function test_roundtrip($input) {
        $action = new action_plugin_edittable_editor();
        $this->assertTrue($action->isTableOnly(trim($input)));

        $renderer = $this->renderJSON($input);
        $data = json_decode($renderer->getDataJSON(), true);
        $meta = json_decode($renderer->getMetaJSON(), true);

        $output = $action->buildTable($data, $meta);

        $this->assertEquals(
            $data,
            json_decode($this->renderJSON($output . "\n")->getDataJSON(), true)
        );
    }

    /**
     * collect the cells of the given wiki text
     *
     * @param string $text
     * @return renderer_plugin_edittable_json
     */
    protected function renderJSON($text) {
        $renderer = new renderer_plugin_edittable_json();
        foreach (p_get_instructions($text) as $instruction) {
            call_user_func_array(array(&$renderer, $instruction[0]), $instruction[1]);
        }
        return $renderer;
    }

    /**
     * Without padding a cell carries only the spaces its alignment needs
     */
    function test_table_unpadded() {
        global $conf;
        $conf['plugin']['edittable']['pad markup'] = 0;

        $data = array(
            array('H 1', 'H 2', 'H 3'),
            array('a much longer cell', '', 'x'),
        );

        $meta = array(
            array(
                array('align' => null, 'colspan' => 1, 'rowspan' => 1, 'tag' => 'th'),
                array('align' => null, 'colspan' => 1, 'rowspan' => 1, 'tag' => 'th'),
                array('align' => null, 'colspan' => 1, 'rowspan' => 1, 'tag' => 'th'),
            ),
            array(
                array('align' => null, 'colspan' => 1, 'rowspan' => 1, 'tag' => 'td'),
                array('align' => null, 'colspan' => 1, 'rowspan' => 1, 'tag' => 'td'),
                array('align' => 'center', 'colspan' => 1, 'rowspan' => 1, 'tag' => 'td'),
            ),
        );

        $expect = <<<EOF
^ H 1 ^ H 2 ^ H 3 ^
| a much longer cell | |  x  |
EOF;

        $action = new action_plugin_edittable_editor();
        $output = $action->buildTable($data, $meta);
        $this->assertEquals($expect, $output);

        // the cells without an alignment must not gain one
        $aligns = array();
        foreach (p_get_instructions($output . "\n") as $instruction) {
            if ($instruction[0] == 'tablecell_open' || $instruction[0] == 'tableheader_open') {
                $aligns[] = $instruction[1][1];
            }
        }
        $this->assertEquals(
            array(null, null, null, null, null, 'center'),
            $aligns
        );
    }
}
