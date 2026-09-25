<?php

/**
 * Renderer for WikiText output
 *
 * @author Adrian Lang <lang@cosmocode.de>
 */

use dokuwiki\Parsing\ModeRegistry;
use dokuwiki\Parsing\ParserMode\Externallink;
use dokuwiki\Utf8\PhpString;

class renderer_plugin_edittable_inverse extends Doku_Renderer
{
    /** @var string will contain the whole document */
    public $doc = '';

    // bunch of internal state variables
    private $prepend_not_block = '';
    private $key = 0;
    private $pos = 0;
    private $ownspan = 0;
    private $previous_block = false;
    private $row = 0;
    private $rowspans = [];
    private $table = [];
    private $liststack = [];
    private $quotelvl = 0;
    private $extlinkparser;
    protected $extlinkPatterns = [];

    /** @var string text written by the last cdata() call */
    private $lastCdataText = '';
    /** @var int length of $doc right after the last cdata() call */
    private $lastCdataEnd = -1;

    /** @var bool whether the renderer currently writes the content of a table cell */
    protected $inTableCell = false;

    /** @var array start and end offset in $doc of every verbatim chunk of the current cell */
    protected $protectedRanges = [];

    /** @var int number of plugin blocks that are currently open */
    private $pluginlvl = 0;
    /** @var int offset in $doc where the outermost open plugin block starts */
    private $pluginstart = 0;

    public function getFormat()
    {
        return 'wiki';
    }

    public function document_start()
    {
    }

    public function document_end()
    {
        $this->block();
        $this->doc = rtrim($this->doc);
    }

    public function header($text, $level, $pos)
    {
        $this->block();
        if (!$text) return; //skip empty headlines

        // write the header
        $markup = str_repeat('=', 7 - $level);
        $this->doc .= "$markup $text $markup" . DOKU_LF;
    }

    public function section_open($level)
    {
        $this->block();
#        $this->doc .= DOKU_LF;
    }

    public function section_close()
    {
        $this->block();
        $this->doc .= DOKU_LF;
    }

    // FIXME this did something compllicated with surrounding whitespaces. Why?
    public function cdata($text)
    {
        if ((string) $text === '') {
            $this->not_block();
            return;
        }

//        if(!$this->previous_block && trim(substr($text, 0, 1)) === '' && trim($text) !== '') {
//            $this->doc .= ' ';
//        }
        $this->not_block();

//        if(trim(substr($text, -1, 1)) === '' && trim($text) !== '') {
//            $this->prepend_not_block = ' ';
//        }
//        $this->doc .= trim($text);

        $this->doc .= $text;
        $this->lastCdataText = $text;
        $this->lastCdataEnd = strlen($this->doc);
    }

    public function p_close()
    {
        if ($this->inTableCell) {
            // a cell ends at the end of the line, so a paragraph in it writes no line break
            $this->not_block();
            return;
        }
        $this->block();
        if ($this->quotelvl === 0) {
            $this->doc = rtrim($this->doc, DOKU_LF) . DOKU_LF . DOKU_LF;
        }
    }

    public function p_open()
    {
        if ($this->inTableCell) {
            // in a cell a paragraph only separates its text from the block before it
            $this->not_block();
            if ($this->doc !== '' && trim(substr($this->doc, -1)) !== '') $this->doc .= ' ';
            return;
        }
        $this->block();
        if ((string) $this->doc !== '' && substr($this->doc, 1, -1) !== DOKU_LF) {
            $this->doc .= DOKU_LF . DOKU_LF;
        }
        $this->doc .= str_repeat('>', $this->quotelvl);
    }

    public function linebreak()
    {
        $this->not_block();
        $this->doc .= '\\\\ ';
    }

    public function hr()
    {
        $this->block();
        $this->doc .= '----';
    }

    public function block()
    {
        if (isset($this->prepend_not_block)) {
            unset($this->prepend_not_block);
        }
        $this->previous_block = true;
    }

    public function not_block()
    {
        if (isset($this->prepend_not_block)) {
            $this->doc .= $this->prepend_not_block;
            unset($this->prepend_not_block);
        }
        $this->previous_block = false;
    }

    /**
     * Remember that the document holds verbatim source from the given offset to its end
     *
     * A line break in such a range comes from the source and keeps a table cell open. Every
     * other line break in a cell was written by this renderer.
     *
     * @param int $start offset in the document where the verbatim text starts
     */
    protected function markProtected($start)
    {
        $this->protectedRanges[] = [$start, strlen($this->doc)];
    }

    /**
     * Begin collecting the content of a table cell
     *
     * Drops the state that is only meaningful within a single cell. A plugin that forgot to
     * close its block would otherwise leak into the cells that follow.
     */
    protected function startCell()
    {
        $this->inTableCell = true;
        $this->protectedRanges = [];
        $this->pluginlvl = 0;
    }

    /**
     * Does the given offset lie inside a verbatim chunk?
     *
     * @param int $pos offset in the document
     * @return bool
     */
    protected function isProtected($pos)
    {
        foreach ($this->protectedRanges as $range) {
            if ($pos >= $range[0] && $pos < $range[1]) return true;
        }
        return false;
    }

    public function strong_open()
    {
        $this->not_block();
        $this->doc .= '**';
    }

    public function strong_close()
    {
        $this->not_block();
        $this->doc .= '**';
    }

    public function emphasis_open()
    {
        $this->not_block();
        $this->doc .= '//';
    }

    public function emphasis_close()
    {
        $this->not_block();
        $this->doc .= '//';
    }

    public function underline_open()
    {
        $this->not_block();
        $this->doc .= '__';
    }

    public function underline_close()
    {
        $this->not_block();
        $this->doc .= '__';
    }

    public function monospace_open()
    {
        $this->not_block();
        $this->doc .= "''";
    }

    public function monospace_close()
    {
        $this->not_block();
        $this->doc .= "''";
    }

    public function subscript_open()
    {
        $this->not_block();
        $this->doc .= '<sub>';
    }

    public function subscript_close()
    {
        $this->not_block();
        $this->doc .= '</sub>';
    }

    public function superscript_open()
    {
        $this->not_block();
        $this->doc .= '<sup>';
    }

    public function superscript_close()
    {
        $this->not_block();
        $this->doc .= '</sup>';
    }

    public function deleted_open()
    {
        $this->not_block();
        $this->doc .= '<del>';
    }

    public function deleted_close()
    {
        $this->not_block();
        $this->doc .= '</del>';
    }

    public function footnote_open()
    {
        $this->not_block();
        $this->doc .= '((';
    }

    public function footnote_close()
    {
        $this->not_block();
        $this->doc .= '))';
    }

    public function listu_open()
    {
        $this->block();
        if (!isset($this->liststack)) {
            $this->liststack = [];
        }
        if (count($this->liststack) === 0) {
            $this->doc .= DOKU_LF;
        }
        $this->liststack[] = '*';
    }

    public function listu_close()
    {
        $this->block();
        array_pop($this->liststack);
        if (count($this->liststack) === 0 && substr($this->doc, -1) !== DOKU_LF) {
            $this->doc .= DOKU_LF;
        }
    }

    public function listo_open()
    {
        $this->block();
        if (!isset($this->liststack)) {
            $this->liststack = [];
        }
        if (count($this->liststack) === 0) {
            $this->doc .= DOKU_LF;
        }
        $this->liststack[] = '-';
    }

    public function listo_close()
    {
        $this->block();
        array_pop($this->liststack);
        if (count($this->liststack) === 0 && substr($this->doc, -1) !== DOKU_LF) {
            $this->doc .= DOKU_LF;
        }
    }

    public function listitem_open($level, $node = false)
    {
        $this->block();
        // the space after the marker is part of the content the parser reports
        $this->doc .= str_repeat(' ', $level * 2) . end($this->liststack);
    }

    public function listcontent_close()
    {
        $this->block();
        $this->doc .= DOKU_LF;
    }

    public function unformatted($text)
    {
        $this->not_block();
        $start = strlen($this->doc);
        if (str_contains($text, '%%')) {
            $this->doc .= "<nowiki>$text</nowiki>";
        } elseif ($text[0] == "\n") {
            $this->doc .= "<nowiki>$text</nowiki>";
        } else {
            $this->doc .= "%%$text%%";
        }
        $this->markProtected($start);
    }

    public function php($text, $wrapper = 'code')
    {
        $this->not_block();
        $start = strlen($this->doc);
        $this->doc .= "<php>$text</php>";
        $this->markProtected($start);
    }

    public function phpblock($text)
    {
        $this->block();
        $this->doc .= "<PHP>$text</PHP>";
    }

    public function html($text, $wrapper = 'code')
    {
        $this->not_block();
        $start = strlen($this->doc);
        $this->doc .= "<html>$text</html>";
        $this->markProtected($start);
    }

    public function htmlblock($text)
    {
        $this->block();
        $this->doc .= "<HTML>$text</HTML>";
    }

    public function quote_open()
    {
        $this->block();
        if (substr($this->doc, -(++$this->quotelvl)) === DOKU_LF . str_repeat('>', $this->quotelvl - 1)) {
            $this->doc .= '>';
        } else {
            $this->doc .= DOKU_LF . str_repeat('>', $this->quotelvl);
        }
        $this->prepend_not_block = ' ';
    }

    public function quote_close()
    {
        $this->block();
        $this->quotelvl--;
        if (strrpos($this->doc, DOKU_LF) === strlen($this->doc) - 1) {
            return;
        }
        $this->doc .= DOKU_LF . DOKU_LF;
    }

    public function preformatted($text)
    {
        $this->block();
        $this->doc .= preg_replace('/^/m', '  ', $text) . DOKU_LF;
    }

    public function file($text, $language = null, $filename = null)
    {
        $this->highlight('file', $text, $language, $filename);
    }

    public function code($text, $language = null, $filename = null)
    {
        $this->highlight('code', $text, $language, $filename);
    }

    public function highlight($type, $text, $language = null, $filename = null)
    {
        // a cell ends at the end of the line, so a block in it starts where it stands
        if ($this->previous_block && !$this->inTableCell) {
            $this->doc .= DOKU_LF;
        }

        $this->block();
        $start = strlen($this->doc);
        $this->doc .= "<$type";
        if ($language != null) {
            $this->doc .= " $language";
        }
        if ($filename != null) {
            $this->doc .= " $filename";
        }
        $this->doc .= ">";
        $this->doc .= $text;
        $this->doc .= "</$type>";
        $this->markProtected($start);
    }

    public function acronym($acronym)
    {
        $this->not_block();
        $this->doc .= $acronym;
    }

    public function smiley($smiley)
    {
        $this->not_block();
        $this->doc .= $smiley;
    }

    public function entity($entity)
    {
        $this->not_block();
        $this->doc .= $entity;
    }

    public function multiplyentity($x, $y)
    {
        $this->not_block();
        $this->doc .= "{$x}x{$y}";
    }

    public function singlequoteopening()
    {
        $this->not_block();
        $this->doc .= "'";
    }

    public function singlequoteclosing()
    {
        $this->not_block();
        $this->doc .= "'";
    }

    public function apostrophe()
    {
        $this->not_block();
        $this->doc .= "'";
    }

    public function doublequoteopening()
    {
        $this->not_block();
        $this->doc .= '"';
    }

    public function doublequoteclosing()
    {
        $this->not_block();
        $this->doc .= '"';
    }

    /**
     */
    public function camelcaselink($link)
    {
        $this->not_block();
        $this->doc .= $link;
    }

    public function locallink($hash, $name = null)
    {
        $this->not_block();
        $this->doc .= "[[#$hash";
        if ($name !== null) {
            $this->doc .= '|';
            $this->echoLinkTitle($name);
        }
        $this->doc .= ']]';
    }

    public function internallink($id, $name = null, $search = null, $returnonly = false, $linktype = 'content')
    {
        $this->not_block();
        $this->doc .= "[[$id";
        if ($name !== null) {
            $this->doc .= '|';
            $this->echoLinkTitle($name);
        }
        $this->doc .= ']]';
    }

    /**
     * Handle external Links
     *
     * @author Andreas Gohr <andi@splitbrain.org>
     * @param string $url the link target
     * @param string|array|null $name the link title, an array for media titles
     */
    public function externallink($url, $name = null)
    {
        $this->not_block();

        /*
         * When $name is null it might have been a match of an URL that was in the text without
         * any link syntax. These are recognized by a bunch of patterns in Doku_Parser_Mode_externallink.
         * We simply reuse these patterns here. However, since we don't parse the pattern through the Lexer,
         * no escaping is done on the patterns - this means we need a non-conflicting delimiter. I decided for
         * a single tick >>'<< which seems to work. Since the patterns contain wordboundaries they are matched
         * against the URL surrounded by spaces.
         */
        if ($name === null) {
            // get the patterns from the parser
            if (is_null($this->extlinkparser)) {
                global $conf;
                $this->extlinkparser = new Externallink();
                // The Externallink mode reads its ModeRegistry in preConnect().
                // Provide one when the setter is available.
                if (method_exists($this->extlinkparser, 'setModeRegistry')) {
                    $this->extlinkparser->setModeRegistry(
                        new ModeRegistry($conf['syntax'] ?? 'dw')
                    );
                }
                $this->extlinkparser->preConnect();
                $this->extlinkPatterns = $this->extlinkparser->getPatterns();
            }

            // check if URL matches pattern
            foreach ($this->extlinkPatterns as $pattern) {
                if (preg_match("'$pattern'", " $url ")) {
                    $this->doc .= $url; // gotcha!
                    return;
                }
            }
        }

        // still here?
        if (is_string($name) && ($url === "http://$name" || $url === "ftp://$name")) {
            // special case - www.* or ftp.* matching
            $this->doc .= $name;
        } else {
            // link syntax! definitively link syntax
            $this->doc .= "[[$url";
            if (!is_null($name)) {
                // we do have a name!
                $this->doc .= '|';
                $this->echoLinkTitle($name);
            }
            $this->doc .= ']]';
        }
    }

    public function interwikilink($match, $name = null, $wikiName = null, $wikiUri = null)
    {
        $this->not_block();
        $this->doc .= "[[$wikiName>$wikiUri";
        if ($name !== null) {
            $this->doc .= '|';
            $this->echoLinkTitle($name);
        }
        $this->doc .= ']]';
    }

    public function windowssharelink($url, $name = null)
    {
        $this->not_block();
        $this->doc .= "[[$url";
        if ($name !== null) {
            $this->doc .= '|';
            $this->echoLinkTitle($name);
        }
        $this->doc .= "]]";
    }

    public function emaillink($address, $name = null)
    {
        $this->not_block();
        if ($name === null) {
            $this->doc .= "<$address>";
        } else {
            $this->doc .= "[[$address|";
            $this->echoLinkTitle($name);
            $this->doc .= ']]';
        }
    }

    public function internalmedia(
        $src,
        $title = null,
        $align = null,
        $width = null,
        $height = null,
        $cache = null,
        $linking = null
    ) {
        $this->not_block();
        $this->doc .= '{{';
        if ($align === 'center' || $align === 'right') {
            $this->doc .= ' ';
        }
        $this->doc .= $src;

        $params = [];
        if ($width !== null || $height !== null) {
            // a height without width is written as 0xHEIGHT
            $params[0] = $width ?? 0;
            if ($height !== null) {
                $params[0] .= "x$height";
            }
        }
        if ($cache !== 'cache') {
            $params[] = $cache;
        }
        if ($linking !== 'details') {
            $params[] = $linking;
        }
        if (count($params) > 0) {
            $this->doc .= '?';
        }
        $this->doc .= implode('&', $params);

        if ($align === 'center' || $align === 'left') {
            $this->doc .= ' ';
        }
        if ($title != null) {
            $this->doc .= "|$title";
        }
        $this->doc .= '}}';
    }

    public function externalmedia(
        $src,
        $title = null,
        $align = null,
        $width = null,
        $height = null,
        $cache = null,
        $linking = null
    ) {
        $this->internalmedia($src, $title, $align, $width, $height, $cache, $linking);
    }

    /**
     * Renders an RSS feed
     *
     * @author Andreas Gohr <andi@splitbrain.org>
     */
    public function rss($url, $params)
    {
        $this->block();
        $this->doc .= '{{rss>' . $url;
        $vals = [];
        if ($params['max'] !== 8) {
            $vals[] = $params['max'];
        }
        if ($params['reverse']) {
            $vals[] = 'reverse';
        }
        if ($params['author']) {
            $vals[] = 'author';
        }
        if ($params['date']) {
            $vals[] = 'date';
        }
        if ($params['details']) {
            $vals[] = 'desc';
        }
        if ($params['refresh'] !== 14400) {
            $val = '10m';
            foreach (['d' => 86400, 'h' => 3600, 'm' => 60] as $p => $div) {
                $res = $params['refresh'] / $div;
                if ($res === intval($res)) {
                    $val = "$res$p";
                    break;
                }
            }
            $vals[] = $val;
        }
        if (count($vals) > 0) {
            $this->doc .= ' ' . implode(' ', $vals);
        }
        $this->doc .= '}}';
    }

    public function table_open($maxcols = null, $numrows = null, $pos = null)
    {
        $this->block();
        $this->table    = [];
        $this->row      = 0;
        $this->rowspans = [];
    }

    public function table_close($pos = null)
    {
        $this->doc .= $this->tableToWikitext($this->table);
    }

    public function tablerow_open()
    {
        $this->block();
        $this->table[++$this->row] = [];
        $this->key                  = 1;
        while (isset($this->rowspans[$this->key])) {
            --$this->rowspans[$this->key];
            if ($this->rowspans[$this->key] === 1) {
                unset($this->rowspans[$this->key]);
            }
            ++$this->key;
        }
    }

    public function tablerow_close()
    {
        $this->block();
    }

    public function tableheader_open($colspan = 1, $align = null, $rowspan = 1)
    {
        $this->cellOpen('th', $colspan, $align, $rowspan);
    }

    public function cellOpen($tag, $colspan, $align, $rowspan)
    {
        $this->block();
        $this->table[$this->row][$this->key] = [
            'tag' => $tag,
            'colspan' => $colspan,
            'align' => $align,
            'rowspan' => $rowspan
        ];
        if ($rowspan > 1) {
            $this->rowspans[$this->key] = $rowspan;
            $this->ownspan               = true;
        }
        $this->pos = strlen($this->doc);
        $this->startCell();
    }

    public function tableheader_close()
    {
        $this->cellClose();
    }

    public function cellClose()
    {
        $this->inTableCell = false;
        $this->block();
        $this->table[$this->row][$this->key]['text'] = trim(substr($this->doc, $this->pos));
        $this->doc                                      = substr($this->doc, 0, $this->pos);
        $this->key += $this->table[$this->row][$this->key]['colspan'];
        while (isset($this->rowspans[$this->key]) && !$this->ownspan) {
            --$this->rowspans[$this->key];
            if ($this->rowspans[$this->key] === 1) {
                unset($this->rowspans[$this->key]);
            }
            ++$this->key;
        }
        $this->ownspan = false;
    }

    public function tablecell_open($colspan = 1, $align = null, $rowspan = 1)
    {
        $this->cellOpen('td', $colspan, $align, $rowspan);
    }

    public function tablecell_close()
    {
        $this->cellClose();
    }

    /**
     * Append the raw markup a plugin matched
     *
     * Some plugins add a cdata call for text they do not handle themselves. The same text is also
     * part of their match, so it must not be appended a second time.
     *
     * A plugin that opens a block has the content between its enter and its exit parsed as
     * ordinary wiki syntax. Everything in between belongs to the plugin's markup, so the whole
     * block counts as one verbatim chunk.
     *
     * @param string $name name of the plugin
     * @param mixed $args data returned by the plugin's handler
     * @param string|int $state lexer state the match was found in
     * @param string $match raw markup matched by the plugin
     */
    public function plugin($name, $args, $state = '', $match = '')
    {
        if (
            $state === DOKU_LEXER_UNMATCHED &&
            $this->lastCdataEnd === strlen($this->doc) &&
            $this->lastCdataText === $match
        ) {
            return;
        }

        $this->not_block();
        // This will break for plugins which provide a catch-all render method
        // like the do or pagenavi plugins
#        $plugin =& plugin_load('syntax',$name);
#        if($plugin === null || !$plugin->render($this->getFormat(),$this,$args)) {
        $start = strlen($this->doc);
        $this->doc .= $match;
#        }

        if ($state === DOKU_LEXER_ENTER) {
            if ($this->pluginlvl === 0) $this->pluginstart = $start;
            $this->pluginlvl++;
            return;
        }
        if ($state === DOKU_LEXER_EXIT) {
            if ($this->pluginlvl > 0) $this->pluginlvl--;
            if ($this->pluginlvl === 0) $this->markProtected($this->pluginstart);
            return;
        }

        // a match inside an open block is covered by that block already
        if ($this->pluginlvl === 0) $this->markProtected($start);
    }

    public function echoLinkTitle($title)
    {
        if (is_array($title)) {
            $this->internalmedia(
                $title['src'],
                $title['title'],
                $title['align'],
                $title['width'],
                $title['height'],
                $title['cache'],
                $title['linking']
            );
        } else {
            $this->doc .= $title;
        }
    }

    /**
     * Helper for table to wikitext conversion
     *
     * @author Adrian Lang <lang@cosmocode.de>
     * @param array $_table
     * @return string
     */
    private function tableToWikitext($_table)
    {
        // Preprocess table for rowspan, make table 0-based.
        $table = [];
        $keys  = array_keys($_table);
        $start = array_pop($keys);
        foreach ($_table as $i => $row) {
            $inorm = $i - $start;
            if (!isset($table[$inorm])) $table[$inorm] = [];
            $nextkey = 0;
            foreach ($row as $cell) {
                while (isset($table[$inorm][$nextkey])) {
                    $nextkey++;
                }
                $nextkey += $cell['colspan'] - 1;
                $table[$inorm][$nextkey] = $cell;
                $rowspan                 = $cell['rowspan'];
                $i2                      = $inorm + 1;
                while ($rowspan-- > 1) {
                    if (!isset($table[$i2])) $table[$i2] = [];
                    $nu_cell                = $cell;
                    $nu_cell['text']        = ':::';
                    $nu_cell['rowspan']     = 1;
                    $table[$i2++][$nextkey] = $nu_cell;
                }
            }
            ksort($table[$inorm]);
        }

        // Get the max width for every column to do table prettyprinting.
        $m_width = [];
        foreach ($table as $row) {
            foreach ($row as $n => $cell) {
                // A cell that spans several lines has no single width.
                if (str_contains($cell['text'], DOKU_LF)) continue;

                // Calculate cell width.
                $diff = (PhpString::strlen($cell['text']) + $cell['colspan'] +
                    ($cell['align'] === 'center' ? 3 : 2));

                // Calculate current max width.
                $span = $cell['colspan'];
                while (--$span >= 0) {
                    if (isset($m_width[$n - $span])) {
                        $diff -= $m_width[$n - $span];
                    }
                }

                if ($diff > 0) {
                    // Just add the difference to all cols.
                    while (++$span < $cell['colspan']) {
                        $m_width[$n - $span] = ($m_width[$n - $span] ?? 0) + ceil($diff / $cell['colspan']);
                    }
                }
            }
        }

        // Write the table.
        $types = ['th' => '^', 'td' => '|'];
        $str   = '';
        foreach ($table as $row) {
            $pos = 0;
            foreach ($row as $n => $cell) {
                $pos += PhpString::strlen($cell['text']) + 1;
                $span   = $cell['colspan'];
                $target = 0;
                while (--$span >= 0) {
                    if (isset($m_width[$n - $span])) {
                        $target += $m_width[$n - $span];
                    }
                }
                $pad = $target - PhpString::strlen($cell['text']);

                // A cell that spans several lines gets no more padding than its alignment needs.
                if (str_contains($cell['text'], DOKU_LF)) {
                    $pad = $cell['colspan'] + ($cell['align'] === 'center' ? 3 : 2);
                }

                $pos += $pad + ($cell['colspan'] - 1);
                switch ($cell['align']) {
                    case 'right':
                        $lpad = $pad - 1;
                        break;
                    case 'left':
                    case '':
                        $lpad = 1;
                        break;
                    case 'center':
                        $lpad = floor($pad / 2);
                        break;
                }
                $str .= $types[$cell['tag']] . str_repeat(' ', $lpad) .
                    $cell['text'] . str_repeat(' ', $pad - $lpad) .
                    str_repeat($types[$cell['tag']], $cell['colspan'] - 1);
            }
            $str .= $types[$cell['tag']] . DOKU_LF;
        }
        return $str;
    }
}

//Setup VIM: ex: et ts=4 enc=utf-8 :
