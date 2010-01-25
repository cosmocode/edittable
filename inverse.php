<?php
/**
 * Renderer for WikiText output
 *
 * @author Adrian Lang <lang@cosmocode.de>
 */

require_once DOKU_INC . 'inc/parser/renderer.php';
require_once DOKU_INC . 'inc/html.php';
require_once DOKU_PLUGIN . 'edittable/common.php';

/**
 * The Renderer
 */
class Doku_Renderer_wiki extends Doku_Renderer {

    // @access public
    var $doc = '';        // will contain the whole document

    function getFormat(){
        return 'wiki';
    }

    function document_start() {
        //reset some internals
    }

    function document_end() {
        $this->doc = rtrim($this->doc, DOKU_LF);
    }

    function header($text, $level, $pos) {
        if(!$text) return; //skip empty headlines

        // write the header
        $markup = str_repeat('=', 7 - $level);
        $this->doc .= "$markup $text $markup" . DOKU_LF;
    }

    function section_open($level) {
        $this->doc .= DOKU_LF;
    }

    function section_close() {
        $this->doc .= DOKU_LF;
    }

    function cdata($text) {
        $this->doc .= $text;
    }

    function p_close() {
        $this->doc = rtrim($this->doc, DOKU_LF) . DOKU_LF . DOKU_LF;
    }

    function linebreak() {
        $this->doc .= ' \\\\'.DOKU_LF;
    }

    function hr() {
        $this->doc .= '----'.DOKU_LF;
    }

    function strong_open() {
        $this->doc .= '**';
    }

    function strong_close() {
        $this->doc .= '**';
    }

    function emphasis_open() {
        $this->doc .= '//';
    }

    function emphasis_close() {
        $this->doc .= '//';
    }

    function underline_open() {
        $this->doc .= '__';
    }

    function underline_close() {
        $this->doc .= '__';
    }

    function monospace_open() {
        $this->doc .= "''";
    }

    function monospace_close() {
        $this->doc .= "''";
    }

    function subscript_open() {
        $this->doc .= '<sub>';
    }

    function subscript_close() {
        $this->doc .= '</sub>';
    }

    function superscript_open() {
        $this->doc .= '<sup>';
    }

    function superscript_close() {
        $this->doc .= '</sup>';
    }

    function deleted_open() {
        $this->doc .= '<del>';
    }

    function deleted_close() {
        $this->doc .= '</del>';
    }

    function footnote_open() {
        $this->doc .= '((';
    }

    function footnote_close() {
        $this->doc .= '))';
    }

    function listu_open() {
        if (!isset($this->_liststack)) {
            $this->_liststack = array();
        }
        if (count($this->_liststack) === 0) {
            $this->doc .= DOKU_LF;
        }
        $this->_liststack[] = '*';
    }

    function listu_close() {
        array_pop($this->_liststack);
        if (count($this->_liststack) === 0) {
            $this->doc .= DOKU_LF;
        }
    }

    function listo_open() {
        if (!isset($this->_liststack)) {
            $this->_liststack = array();
        }
        if (count($this->_liststack) === 0) {
            $this->doc .= DOKU_LF;
        }
        $this->_liststack[] = '-';
    }

    function listo_close() {
        array_pop($this->_liststack);
        if (count($this->_liststack) === 0) {
            $this->doc .= DOKU_LF;
        }
    }

    function listitem_open($level) {
        $this->doc .= str_repeat(' ', $level * 2) . end($this->_liststack);
    }

    function listcontent_close() {
        $this->doc .= DOKU_LF;
    }

    function unformatted($text) {
        if (strpos($text, '%%') !== false) {
            $this->doc .= "<nowiki>$text</nowiki";
        } else {
            $this->doc .= "%%$text%%";
        }
    }

    function php($text, $wrapper='code') {
        $this->doc .= "<php>$text</php>";
    }

    function phpblock($text) {
        $this->doc .= "<PHP>$text</PHP>" . DOKU_LF;
    }

    function html($text, $wrapper='code') {
        $this->doc .= "<html>$text</html>" . DOKU_LF;
    }

    function htmlblock($text) {
        $this->doc .= "<HTML>$text</HTML>". DOKU_LF;
    }

    function quote_open() {
        $this->doc .= '>';
    }

    function quote_close() {
        $strpos = strrpos($this->doc, DOKU_LF);
        if ($strpos === strlen($this->doc)) {
            return;
        }
        $lastline = substr($this->doc, $strpos);
        $this->doc = substr_replace($this->doc, preg_replace('/(>+)(.+)/', '\1 \2', $lastline), $strpos) . DOKU_LF;
    }

    function preformatted($text) {
        $this->doc .= preg_replace('/^/m', '  ', $text) . DOKU_LF;
    }

    function file($text, $language=null, $filename=null) {
        $this->_highlight('file',$text,$language,$filename);
    }

    function code($text, $language=null, $filename=null) {
        $this->_highlight('code',$text,$language,$filename);
    }

    function _highlight($type, $text, $language=null, $filename=null) {
        $this->doc .= "<$type";
        if ($language != null) {
            $this->doc .= " $language";
        }
        if ($filename != null) {
            $this->doc .= " $filename";
        }
        $this->doc .= ">$text</$type>" . DOKU_LF;
    }

    function acronym($acronym) {
        $this->doc .= $acronym;
    }

    function smiley($smiley) {
        $this->doc .= $smiley;
    }

    function entity($entity) {
        $this->doc .= $entity;
    }

    function multiplyentity($x, $y) {
        $this->doc .= "{$x}x{$y}";
    }

    function singlequoteopening() {
        $this->doc .= "'";
    }

    function singlequoteclosing() {
        $this->doc .= "'";
    }

    function apostrophe() {
        $this->doc .= "'";
    }

    function doublequoteopening() {
        $this->doc .= '"';
    }

    function doublequoteclosing() {
        $this->doc .= '"';
    }

    /**
    */
    function camelcaselink($link) {
      $this->doc .= $link;
    }


    function locallink($hash, $name = NULL){
        $this->doc .= "[[#$hash";
        if ($name !== null) {
            $this->doc .= '|';
            $this->_echoLinkTitle($name);
        }
        $this->doc .= ']]';
    }

    function internallink($id, $name = NULL, $search=NULL,$returnonly=false,$linktype='content') {
        $this->doc .= "[[$id";
        if ($name !== null) {
            $this->doc .= '|';
            $this->_echoLinkTitle($name);
        }
        $this->doc .= ']]';
    }

    function externallink($url, $name = NULL) {
        if ($name !== null && !in_array($url, array($name, 'http://' . $name))) {
            $this->doc .= "[[$url|";
            $this->_echoLinkTitle($name);
            $this->doc .= ']]';
        } else {
            if ($url === "http://$name") {
                $url = $name;
            }
            $this->doc .= $url;
        }
    }

    /**
    */
    function interwikilink($match, $name = NULL, $wikiName, $wikiUri) {
        $this->doc .= "[[$wikiName>$wikiUri";
        if ($name !== null) {
            $this->doc .= '|';
            $this->_echoLinkTitle($name);
        }
        $this->doc .= ']]';
    }

    /**
     */
    function windowssharelink($url, $name = NULL) {
        $this->doc .= "[[$url";
        if ($name !== null) {
            $this->doc .= '|';
            $this->_echoLinkTitle($name);
        }
        $this->doc .= "]]";
    }

    function emaillink($address, $name = NULL) {
        if ($name === null) {
            $this->doc .= "<$address>";
        } else {
            $this->doc .= "[[$adress|";
            $this->_echoLinkTitle($name);
            $this->doc .= ']]';
        }
    }

    function internalmedia ($src, $title=NULL, $align=NULL, $width=NULL,
                            $height=NULL, $cache=NULL, $linking=NULL) {
        $this->doc .= '{{';
        if ($align === 'center' || $align === 'right') {
            $this->doc .= ' ';
        }
        $this->doc .= $src;

        $params = array();
        if ($width !== null) {
            $params[0] = $width;
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
        $this->doc .= join('&', $params);

        if ($align === 'center' || $align === 'left') {
            $this->doc .= ' ';
        }
        if ($title != null) {
            $this->doc .= "|$title";
        }
        $this->doc .= '}}';
    }

    function externalmedia ($src, $title=NULL, $align=NULL, $width=NULL,
                            $height=NULL, $cache=NULL, $linking=NULL) {
        $this->internalmedia($src, $title, $align, $width, $height, $cache, $linking);
    }

    /**
     * Renders an RSS feed
     *
     * @author Andreas Gohr <andi@splitbrain.org>
     */
    function rss ($url,$params){
        $this->doc .= '{{' . $url;
        $vals = array();
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
            foreach(array('d' => 86400, 'h' => 3600, 'm' => 60) as $p => $div) {
                $res = $params['refresh'] / $div;
                if ($res === intval($res)) {
                    $val = "$res$p";
                    break;
                }
            }
            $vals[] = $val;
        }
        if (count($vals) > 0) {
            $this->doc .= ' ' . join(' ', $vals);
        }
        $this->doc .= '}}';
    }

    function table_open() {
        $this->_table = array();
        $this->_row = 0;
        $this->_rowspans = array();
    }

    function table_close($begin, $end) {
        $this->doc .= table_to_wikitext($this->_table);
    }

    function tablerow_open() {
        $this->_table[++$this->_row] = array();
        $this->_key = 1;
        while (isset($this->_rowspans[$this->_key])) {
            --$this->_rowspans[$this->_key];
            if ($this->_rowspans[$this->_key] === 1) {
                unset($this->_rowspans[$this->_key]);
            }
            ++$this->_key;
        }
    }

    function tablerow_close(){
    }

    function tableheader_open($colspan = 1, $align = NULL, $rowspan = 1){
        $this->_cellopen('th', $colspan, $align, $rowspan);
    }

    function _cellopen($tag, $colspan, $align, $rowspan) {
        $this->_table[$this->_row][$this->_key] = compact('tag', 'colspan', 'align', 'rowspan');
        if ($rowspan > 1) {
            $this->_rowspans[$this->_key] = $rowspan;
            $this->_ownspan = true;
        }
        $this->_pos = strlen($this->doc);
    }

    function tableheader_close(){
        $this->_cellclose();
    }

    function _cellclose() {
        $this->_table[$this->_row][$this->_key]['text'] = trim(substr($this->doc, $this->_pos));
        $this->doc = substr($this->doc, 0, $this->_pos);
        $this->_key += $this->_table[$this->_row][$this->_key]['colspan'];
        while (isset($this->_rowspans[$this->_key]) && !$this->_ownspan) {
            --$this->_rowspans[$this->_key];
            if ($this->_rowspans[$this->_key] === 1) {
                unset($this->_rowspans[$this->_key]);
            }
            ++$this->_key;
        }
        $this->_ownspan = false;
    }

    function tablecell_open($colspan = 1, $align = NULL, $rowspan = 1){
        $this->_cellopen('td', $colspan, $align, $rowspan);
    }

    function tablecell_close(){
        $this->_cellclose();
    }

    function plugin($plugin, $args, $state, $match) {
        $this->doc .= $match;
    }

    function _echoLinkTitle($title) {
        if (is_array($title)) {
            extract($title);
            $this->internalmedia($src, $title, $align, $width, $height, $cache,
                                 $linking);
        } else {
            $this->doc .= $title;
        }
    }
}

//Setup VIM: ex: et ts=4 enc=utf-8 :
