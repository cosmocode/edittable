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

    /**
     * A code block keeps its own line breaks and gains none
     */
    function test_code_block_linebreaks() {
        $input  = "<code>\nfoo\n</code>";
        $output = $this->render($input);
        $this->assertEquals($input, $output);
    }

    /**
     * Text that follows a block inside a cell stays on the same line
     *
     * The parser reports such text as a paragraph of its own.
     */
    function test_text_after_block_in_cell() {
        $renderer = new renderer_plugin_edittable_inverse();
        $renderer->tablecell_open();
        $renderer->cdata(' foo ');
        $renderer->code("\nbar\n");
        $renderer->p_open();
        $renderer->cdata('tail ');
        $renderer->p_close();

        $this->assertEquals(" foo <code>\nbar\n</code> tail ", $renderer->doc);
    }

    /**
     * Two blocks in one cell are not separated by a line break of the renderer
     */
    function test_two_blocks_in_cell() {
        $renderer = new renderer_plugin_edittable_inverse();
        $renderer->tablecell_open();
        $renderer->code("\nx\n");
        $renderer->code("\ny\n");

        $this->assertEquals("<code>\nx\n</code><code>\ny\n</code>", $renderer->doc);
    }

    /**
     * A list inside a cell ends without a blank line
     */
    function test_list_in_cell() {
        $renderer = new renderer_plugin_edittable_inverse();
        $renderer->tablecell_open();
        $renderer->plugin('dummy', array(), DOKU_LEXER_ENTER, '<dummy>');
        $renderer->listu_open();
        $renderer->listitem_open(1);
        $renderer->cdata(' item'); // the parser keeps the space after the marker in the content
        $renderer->listcontent_close();
        $renderer->listu_close();
        $renderer->plugin('dummy', array(), DOKU_LEXER_EXIT, '</dummy>');

        $this->assertEquals("<dummy>\n  * item\n</dummy>", $renderer->doc);
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
