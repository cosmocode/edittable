<?php
require_once dirname(__FILE__).'/../renderer/json.php';

/**
 * @group plugin_edittable
 * @group plugins
 */
class renderer_plugin_edittable_json_test extends DokuWikiTest {


    function test_table() {

        $input = <<<EOF
^ H 1        ^    H 2   ^     H 3 ^ ** H 4 **    ^
| R 1 C 1    | R 1 C 2           || R 1 Col 4 |
| R 2 C 1    | :::               || R 2 Col 4 |
| R 3 C 1    | R 3 C 2  | R 3 C 3 | R 3 Col 4 |
EOF;

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
                array('hide' => true, 'rowspan' => 1, 'colspan' => 1, 'tag' => 'td'),
                array('align' => null, 'colspan' => 1, 'rowspan' => 1, 'tag' => 'td'),
            ),
            array(
                array('align' => 'left', 'colspan' => 1, 'rowspan' => 1, 'tag' => 'td'),
                array('hide' => true, 'rowspan' => 1, 'colspan' => 1),
                array('hide' => true, 'rowspan' => 1, 'colspan' => 1),
                array('align' => null, 'colspan' => 1, 'rowspan' => 1, 'tag' => 'td'),
            ),
            array(
                array('align' => 'left', 'colspan' => 1, 'rowspan' => 1, 'tag' => 'td'),
                array('align' => 'left', 'colspan' => 1, 'rowspan' => 1, 'tag' => 'td'),
                array('align' => null, 'colspan' => 1, 'rowspan' => 1, 'tag' => 'td'),
                array('align' => null, 'colspan' => 1, 'rowspan' => 1, 'tag' => 'td'),
            ),
        );

        $renderer = $this->render($input);

        $this->assertEquals($data, json_decode($renderer->getDataJSON(), true));
        $this->assertEquals($meta, json_decode($renderer->getMetaJSON(), true));
    }


    function test_empty_and_short_rows() {

        $input = <<<EOF
^ A ^ B ^ C ^
| 1 |
|||
EOF;

        $data = array(
            array('A', 'B', 'C'),
            array('1', '', ''),
            array('', '', ''),
        );

        $renderer = $this->render($input);
        $meta = json_decode($renderer->getMetaJSON(), true);

        $this->assertEquals($data, json_decode($renderer->getDataJSON(), true));
        $this->assertCount(3, $meta[1]);
        $this->assertCount(3, $meta[2]);
        $this->assertEquals('td', $meta[2][0]['tag']);
    }


    function test_table_without_cells() {

        $input = '|';

        $data = array(
            array(''),
        );

        $renderer = $this->render($input);
        $meta = json_decode($renderer->getMetaJSON(), true);

        $this->assertEquals($data, json_decode($renderer->getDataJSON(), true));
        $this->assertCount(1, $meta[0]);
        $this->assertEquals('td', $meta[0][0]['tag']);
    }


    /**
     * render the given text with the JSON table renderer
     *
     * @param $text
     * @return renderer_plugin_edittable_json
     */
    protected function render($text) {
        $instructions = p_get_instructions($text);
        $Renderer     = new renderer_plugin_edittable_json();

        foreach($instructions as $instruction) {
            // Execute the callback against the Renderer
            call_user_func_array(array(&$Renderer, $instruction[0]), $instruction[1]);
        }
        return $Renderer;
    }

    /**
     * A short header row stays a header row when the table is written back
     */
    function test_short_header_row() {
        $renderer = new renderer_plugin_edittable_json();
        $instructions = p_get_instructions("^ A ^ B ^\n| 1 | 2 | 3 |\n");
        foreach ($instructions as $instruction) {
            call_user_func_array(array(&$renderer, $instruction[0]), $instruction[1]);
        }

        $meta = json_decode($renderer->getMetaJSON(), true);

        // the parser padded the head row with a normal cell, it has to become a header cell again
        $this->assertEquals('th', $meta[0][2]['tag']);
        $this->assertEquals('td', $meta[1][2]['tag']);
    }
}
