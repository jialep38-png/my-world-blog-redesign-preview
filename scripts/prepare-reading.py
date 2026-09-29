"""Render selected existing posts; source prose is preserved, never executed.

Maintenance only: Python-Markdown is required. No runtime dependency.
Usage: python scripts/prepare-reading.py ../my-world-blog/src/content/essay
"""
from pathlib import Path
import hashlib
import json
import re
import sys
import markdown

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT.parent / 'my-world-blog/src/content/essay'
POSTS = [
    ('reconnect-blog-content-notes', 'Reconnecting the blog', '把博客重新接上线', 'building', 'A place to return to, and a reason to keep writing.'),
    ('spring-2026-systems-recap', 'From ideas to small systems', '把零散想法做成小系统', 'building', 'What a season of small experiments had in common.'),
    ('astro-blog-content-structure-note', 'A stable home for content', '给内容一个稳定的位置', 'notes', 'Small decisions about structure that make writing easier.'),
    ('genericagent-wechat-reliability', 'When an agent goes quiet', '当智能体没有回复', 'notes', 'Follow the message, from receiving it to sending an answer.'),
    ('newapi-cpa-route-diagnosis', 'Find the failed hop', 'NewAPI / CPA 路由诊断', 'notes', 'Trace the model, route, credential, relay and logs before changing a setting.'),
    ('ai-collaboration-engineering-workflow-note', 'Working with AI, thoughtfully', '与 AI 协作：从调研到交付', 'notes', 'A reading note on research, plans, collaboration and verification.'),
    ('narrarc-agentic-rag-architecture-note', 'Answers with evidence', '让答案带上证据', 'notes', 'How an answer can lead back to the messages behind it.'),
    ('weekly-learning-system-from-checklist-note', 'A week with a receipt', '把学习清单落成每周执行', 'notes', 'One main module, two practical tasks, and evidence for the next review.'),
    ('pai-codex-bridge-review', 'Bridging PAI and Codex', 'PAI-Codex 桥接复盘', 'building', 'Static instructions, runtime events, and a daily entry point.'),
    ('teaching-doc-generator-pipeline-review', 'A resilient document pipeline', '教学文档流水线复盘', 'building', 'Five stages, fallback paths, and a PDF that survives the messy cases.'),
]

posts = []
for slug, en, zh, kind, description_en in POSTS:
    path = SOURCE / f'{slug}.md'
    raw = path.read_text(encoding='utf-8')
    _, meta, body = raw.split('---', 2)
    def field(name):
        return re.search(rf'^{name}:\s*(.+)$', meta, re.M).group(1).strip().strip('"')
    # The selected source files contain Markdown, no executable raw HTML.
    if re.search(r'<(?:script|iframe|style|object)\b', body, re.I):
        raise ValueError(f'Unexpected embedded HTML in {slug}')
    parser = markdown.Markdown(extensions=['extra', 'toc', 'sane_lists'], extension_configs={'toc': {'slugify': lambda text, separator: text}})
    rendered = parser.convert(body)
    headings = []
    def heading(match):
        level, text = match.group(1), match.group(3)
        identifier = f'reading-s{len(headings)+1:02d}'
        if slug == 'reconnect-blog-content-notes' and len(headings) < 3:
            identifier = ['reading-open', 'reading-order', 'reading-process'][len(headings)]
        headings.append({'id': identifier, 'text': re.sub('<[^>]*>', '', text)})
        return f'<h{level} id="{identifier}">{text}</h{level}>'
    rendered = re.sub(r'<h([23]) id="([^"]*)">(.*?)</h\1>', heading, rendered)
    plain = re.sub(r'<[^>]+>', '', rendered)
    posts.append({'slug': slug, 'en': en, 'zh': zh, 'title': field('title'), 'date': field('date'),
                  'type': kind, 'summary': field('description'), 'summaryEn': description_en,
                  'minutes': max(1, round(len(plain) / 400)), 'headings': headings,
                  'html': rendered, 'source': f'https://2006038.xyz/archive/{slug}/',
                  'sourceSha256': hashlib.sha256(path.read_bytes()).hexdigest()})

target = ROOT / 'reading-data.js'
target.write_text('/* Generated from the existing blog. Run scripts/prepare-reading.py to refresh. */\nwindow.JournalPosts = ' + json.dumps(posts, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8')
print(f'Rendered {len(posts)} existing articles, {sum(len(p["headings"]) for p in posts)} headings, {target.stat().st_size} bytes')
