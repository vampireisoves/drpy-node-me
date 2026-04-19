<?php

class HtmlParser {
    
    /**
     * Parse HTML and return array of OuterHTML strings
     */
    public function pdfa($html, $rule) {
        if (empty($html) || empty($rule)) return [];
        $doc = $this->getDom($html);
        $xpath = new DOMXPath($doc);
        
        $xpathQuery = $this->parseRuleToXpath($rule);
        $nodes = $xpath->query($xpathQuery);
        
        $res = [];
        if ($nodes) {
            foreach ($nodes as $node) {
                // saveHTML($node) returns OuterHTML
                $res[] = $doc->saveHTML($node);
            }
        }
        return $res;
    }

    /**
     * Parse HTML and return single value (Text, Html, or Attribute)
     */
    public function pdfh($html, $rule, $baseUrl = '') {
        if (empty($html) || empty($rule)) return '';
        $doc = $this->getDom($html);
        $xpath = new DOMXPath($doc);

        // Separate Option
        $option = '';
        if (strpos($rule, '&&') !== false) {
            $parts = explode('&&', $rule);
            $option = array_pop($parts);
            $rule = implode('&&', $parts);
        }

        $xpathQuery = $this->parseRuleToXpath($rule);
        $nodes = $xpath->query($xpathQuery);
        
        if ($nodes && $nodes->length > 0) {
            // Special handling for Text option: concatenate all nodes
            if ($option === 'Text') {
                $text = '';
                foreach ($nodes as $node) {
                    $text .= $node->textContent;
                }
                return $this->parseText($text);
            }
            
            // For other options, use the first node
            $node = $nodes->item(0);
            return $this->formatOutput($doc, $node, $option, $baseUrl);
        }
        return '';
    }
    
    /**
     * Parse HTML and return URL (auto joined)
     */
    public function pd($html, $rule, $baseUrl = '') {
        $res = $this->pdfh($html, $rule, $baseUrl);
        return $this->urlJoin($baseUrl, $res);
    }

    // --- Helper Methods ---

    private function parseText($text) {
        // Match JS behavior: 
        // text = text.replace(/[\s]+/gm, '\n');
        // text = text.replace(/\n+/g, '\n').replace(/^\s+/, '');
        // text = text.replace(/\n/g, ' ');
        
        $text = preg_replace('/[\s]+/u', "\n", $text);
        $text = preg_replace('/\n+/', "\n", $text);
        $text = trim($text);
        $text = str_replace("\n", ' ', $text);
        return $text;
    }

    private function parseRuleToXpath($rule) {
        // Replace && with space to unify as descendant separator
        $rule = str_replace('&&', ' ', $rule);
        $parts = explode(' ', $rule);
        $xpathParts = [];
        
        foreach ($parts as $part) {
            if (empty($part)) continue;
            $xpathParts[] = $this->transSingleSelector($part);
        }
        
        // Join with descendant axis
        return '//' . implode('//', $xpathParts);
    }

    private function transSingleSelector($selector) {
        // Handle :eq
        $position = null;
        if (preg_match('/:eq\((-?\d+)\)/', $selector, $matches)) {
            $idx = intval($matches[1]);
            $selector = str_replace($matches[0], '', $selector);
            if ($idx >= 0) {
                $position = $idx + 1; // XPath is 1-based
            } else {
                // -1 is last()
                // -2 is last()-1
                $offset = abs($idx) - 1;
                $position = "last()" . ($offset > 0 ? "-$offset" : ""); 
            }
        }
        
        // Handle tag.class#id
        $tag = '*';
        $conditions = [];
        
        // Extract id
        if (preg_match('/#([\w-]+)/', $selector, $m)) {
            $conditions[] = '@id="' . $m[1] . '"';
            $selector = str_replace($m[0], '', $selector);
        }
        
        // Extract classes
        if (preg_match_all('/\.([\w-]+)/', $selector, $m)) {
            foreach ($m[1] as $cls) {
                $conditions[] = 'contains(concat(" ", normalize-space(@class), " "), " ' . $cls . ' ")';
            }
            $selector = preg_replace('/\.[\w-]+/', '', $selector);
        }
        
        // Remaining is tag
        if (!empty($selector)) {
            $tag = $selector;
        }
        
        $xpath = $tag;
        if (!empty($conditions)) {
            $xpath .= '[' . implode(' and ', $conditions) . ']';
        }
        if ($position !== null) {
            $xpath .= '[' . $position . ']';
        }
        
        return $xpath;
    }

    private function formatOutput($doc, $node, $option, $baseUrl) {
        if ($option === 'Text') {
            return $this->parseText($node->textContent);
        } elseif ($option === 'Html') {
            return $doc->saveHTML($node);
        } elseif ($option) {
            // Attribute
            $val = $node->getAttribute($option);
            // Handle style url() extraction if needed? JS does it.
            // JS: if (contains(opt, 'style') && contains(ret, 'url(')) ...
            return $val;
        }
        // Default to outer HTML if no option provided
        return $doc->saveHTML($node);
    }

    private function getDom($html) {
        $doc = new DOMDocument();
        // Suppress warnings for malformed HTML
        libxml_use_internal_errors(true);
        // Force UTF-8 encoding
        if (!empty($html) && mb_detect_encoding($html, 'UTF-8', true) === false) {
             $html = mb_convert_encoding($html, 'UTF-8', 'GBK, BIG5'); 
        }
        // Add meta charset to ensure DOMDocument treats it as UTF-8
        $html = '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">' . $html;
        
        $doc->loadHTML($html);
        libxml_clear_errors();
        return $doc;
    }

    private function urlJoin($baseUrl, $relativeUrl) {
        if (empty($relativeUrl)) return '';
        if (preg_match('#^https?://#', $relativeUrl)) return $relativeUrl;
        
        if (empty($baseUrl)) return $relativeUrl;

        $parts = parse_url($baseUrl);
        $scheme = isset($parts['scheme']) ? $parts['scheme'] . '://' : 'http://';
        $host = isset($parts['host']) ? $parts['host'] : '';
        
        // Handle protocol-relative URLs (starting with //)
        if (substr($relativeUrl, 0, 2) == '//') {
            return (isset($parts['scheme']) ? $parts['scheme'] . ':' : 'http:') . $relativeUrl;
        }
        
        if (substr($relativeUrl, 0, 1) == '/') {
            return $scheme . $host . $relativeUrl;
        }
        
        // Relative path
        $path = isset($parts['path']) ? $parts['path'] : '/';
        $dir = rtrim(dirname($path), '/\\');
        if ($dir === '/' || $dir === '\\') $dir = ''; // handle root
        
        return $scheme . $host . $dir . '/' . $relativeUrl;
    }
}
