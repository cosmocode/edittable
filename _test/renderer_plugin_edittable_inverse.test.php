<?php
require_once dirname(__FILE__).'/../renderer/inverse.php';

/**
 * @group plugin_edittable
 * @group plugins
 */
class renderer_plugin_edittable_inverse_test extends DokuWikiTest {

    function test_externallink() {
        $input  = '[[file:///x:\folder\file.zip]]';
        $output = $this->render($input);
        $this->assertEquals($input, $output);
    }

    function test_fullsyntax() {
        $input = io_readFile(dirname(__FILE__).'/'.basename(__FILE__, '.php').'.txt');
        $this->assertTrue(strlen($input) > 1000); // make sure we got what we want
        $output = $this->render($input);

        $input  = $this->noWS($input);
        $output = $this->noWS($output);
        $this->assertEquals($input, $output);
    }

    /**
     * reduce spaces and newlines to single occurances
     *
     * @param $text
     * @return mixed
     */
    protected function noWS($text) {
        $text = preg_replace('/\n+/s', "\n", $text);
        $text = preg_replace('/ +/', ' ', $text);
        return $text;
    }

    /**
     * render the given text with the inverse renderer
     *
     * @param $text
     * @return string
     */
    protected function render($text) {
        $instructions = p_get_instructions($text);
        $Renderer     = new renderer_plugin_edittable_inverse();

        foreach($instructions as $instruction) {
            // Execute the callback against the Renderer
            call_user_func_array(array(&$Renderer, $instruction[0]), $instruction[1]);
        }
        return $Renderer->doc;
    }
}
