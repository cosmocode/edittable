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
                array('hide' => true, 'rowspan' => 1, 'colspan' => 1),
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
        $json = new JSON(JSON_LOOSE_TYPE);

        $this->assertEquals($data, $json->decode($renderer->getDataJSON()));
        $this->assertEquals($meta, $json->decode($renderer->getMetaJSON()));
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
}
