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
            'multiline cell' => array("| a | %%x\ny%% |", false),
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
