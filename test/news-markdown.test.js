import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import vm from 'vm';

function loadNewsMarkdownApi() {
    const src = readFileSync(join(process.cwd(), 'assets/js/shared/news-home.js'), 'utf8');
    const context = {
        window: {},
        document: {
            readyState: 'complete',
            addEventListener: () => {}
        }
    };
    vm.createContext(context);
    vm.runInContext(src, context);
    return {
        render: context.window.renderNewsMarkdownHtml,
        renderTitle: context.window.renderNewsTitleMarkdownHtml,
        serialize: context.window.serializeNewsEditorHtml,
        serializeTitle: context.window.serializeNewsTitleEditorHtml,
        stripPlain: context.window.stripNewsMarkdownPlainText
    };
}

function htmlToRoot(html) {
    const root = document.createElement('div');
    root.innerHTML = html;
    return root;
}

describe('renderNewsMarkdownHtml', () => {
    const { render } = loadNewsMarkdownApi();

    it('returns empty string for blank input', () => {
        expect(render('')).toBe('');
        expect(render('   ')).toBe('');
    });

    it('renders bold, italic, code, and links', () => {
        expect(render('**bold**')).toContain('<strong>bold</strong>');
        expect(render('*italic*')).toContain('<em>italic</em>');
        expect(render('`code`')).toContain('<code>code</code>');
        expect(render('[KIU](https://kiu.edu.ge)')).toContain('<a href="https://kiu.edu.ge"');
    });

    it('renders paragraphs and line breaks', () => {
        const html = render('Line one\nLine two\n\nSecond block');
        expect(html).toContain('<p>Line one<br>Line two</p>');
        expect(html).toContain('<p>Second block</p>');
    });

    it('renders headings, lists, blockquotes, and small text', () => {
        const html = render('# Title\n\n## Section\n\n### Subsection\n\n- one\n- two\n\n> quoted\n\n^footnote^');
        expect(html).toContain('<h2 class="newsx-md-h2">Title</h2>');
        expect(html).toContain('<h3 class="newsx-md-h3">Section</h3>');
        expect(html).toContain('<h4 class="newsx-md-h4">Subsection</h4>');
        expect(html).toContain('<ul><li>one</li><li>two</li></ul>');
        expect(html).toContain('<blockquote class="newsx-md-quote">quoted</blockquote>');
        expect(html).toContain('<small class="newsx-md-small">footnote</small>');
    });

    it('renders ordered lists', () => {
        const html = render('1. first\n2. second');
        expect(html).toBe('<ol><li>first</li><li>second</li></ol>');
    });

    it('renders underline, highlight, color, size, and alignment extensions', () => {
        expect(render('__underlined__')).toContain('<u class="newsx-md-underline">underlined</u>');
        expect(render('==highlighted==')).toContain('<mark class="newsx-md-highlight">highlighted</mark>');
        expect(render('«#ff0000»red«/»')).toContain('style="color:#ff0000"');
        expect(render('«bg:#ffff00»mark«/bg»')).toContain('style="background-color:#ffff00"');
        expect(render('«size:22»big«/size»')).toContain('style="font-size:22px"');
        expect(render('::center:: Centered line')).toContain('class="newsx-md-align-center"');
    });

    it('escapes unsafe HTML and blocks javascript links', () => {
        const html = render('<script>alert(1)</script>\n\n[javascript](javascript:alert(1))');
        expect(html).not.toContain('<script>');
        expect(html).toContain('&lt;script&gt;');
        expect(html).not.toContain('href="javascript:');
    });
});

describe('serializeNewsEditorHtml', () => {
    const { render, serialize } = loadNewsMarkdownApi();

    it('serializes bold, heading, list, quote, and small text', () => {
        const html = render('## Section\n\n**bold**\n\n- one\n- two\n\n> quoted\n\n^small^');
        const root = htmlToRoot(html);
        const markdown = serialize(root);
        expect(markdown).toContain('## Section');
        expect(markdown).toContain('**bold**');
        expect(markdown).toContain('- one');
        expect(markdown).toContain('- two');
        expect(markdown).toContain('> quoted');
        expect(markdown).toContain('^small^');
    });

    it('serializes underline, highlight, color, size, and alignment', () => {
        const html = render('::center:: __under__ and ==mark==\n\n«#112233»tone«/»');
        const markdown = serialize(htmlToRoot(html));
        expect(markdown).toContain('::center::');
        expect(markdown).toContain('__under__');
        expect(markdown).toContain('==mark==');
        expect(markdown).toContain('«#112233»');
    });
});

describe('serializeNewsTitleEditorHtml', () => {
    const { renderTitle, serializeTitle } = loadNewsMarkdownApi();

    it('round-trips inline headline formatting as a single line', () => {
        const source = '**Bold** and *italic* with «#ff0000»red«/»';
        const root = htmlToRoot(renderTitle(source));
        expect(serializeTitle(root)).toBe(source);
    });

    it('collapses whitespace and newlines', () => {
        const root = document.createElement('div');
        root.innerHTML = '<strong>One</strong> <em>Two</em>';
        expect(serializeTitle(root)).toBe('**One** *Two*');
    });
});

describe('stripNewsMarkdownPlainText', () => {
    const { stripPlain } = loadNewsMarkdownApi();

    it('removes inline markdown tokens', () => {
        expect(stripPlain('**Campus** «size:22»Update«/size»')).toBe('Campus Update');
        expect(stripPlain('__under__ ==mark== `code`')).toBe('under mark code');
    });
});
