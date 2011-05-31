<?php
require_once DOKU_INC.'_test/lib/unittest.php';
require_once DOKU_INC.'inc/init.php';
require_once dirname(__FILE__) . '/../inverse.php';

class edittable_test_inverse extends Doku_UnitTestCase {
    function test() {
        $this->externallink();
    }

    function externallink() {
        $text = '[[file:///x:\folder\file.zip]]';
        $this->render($text);
    }

    protected function render($text) {
        $instructions = p_get_instructions($text);
        $Renderer = new Doku_Renderer_wiki;

        foreach ( $instructions as $instruction ) {
            // Execute the callback against the Renderer
            call_user_func_array(array(&$Renderer, $instruction[0]),$instruction[1]);
        }

        $this->assertEqual($Renderer->doc, $text);
    }
}
