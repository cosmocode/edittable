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

    function test_bare_externallink() {
        $input  = 'see http://www.example.com for details';
        $output = $this->render($input);
        $this->assertEquals($input, $output);
    }

    function test_media_height_only() {
        $input  = '{{wiki:dokuwiki-128.png?0x100}}';
        $output = $this->render($input);
        $this->assertEquals($input, $output);
    }

    /**
     * Text a plugin adds as a cdata call of its own must end up in the wiki source only once
     */
    function test_plugin_with_own_cdata() {
        $renderer = new renderer_plugin_edittable_inverse();
        $renderer->plugin('dummy', array(), DOKU_LEXER_ENTER, '<dummy>');
        $renderer->cdata('content');
        $renderer->plugin('dummy', array(), DOKU_LEXER_UNMATCHED, 'content');
        $renderer->plugin('dummy', array(), DOKU_LEXER_EXIT, '</dummy>');

        $this->assertEquals('<dummy>content</dummy>', $renderer->doc);
    }

    /**
     * Plugins that leave unmatched text to the renderer still get it written out
     */
    function test_plugin_without_own_cdata() {
        $renderer = new renderer_plugin_edittable_inverse();
        $renderer->plugin('dummy', array(), DOKU_LEXER_ENTER, '<dummy>');
        $renderer->plugin('dummy', array(), DOKU_LEXER_UNMATCHED, 'content');
        $renderer->plugin('dummy', array(), DOKU_LEXER_EXIT, '</dummy>');

        $this->assertEquals('<dummy>content</dummy>', $renderer->doc);
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
