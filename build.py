#!/usr/bin/env python3
"""
Static build for the Life Ready Learning Hub.

Every page is plain HTML with marker comments. This script fills the
markers in place so the published HTML is fully crawlable (no JavaScript
needed to see navigation, links, or content):

    <!-- SEO:START --> ... <!-- SEO:END -->              title, meta, Open Graph, JSON-LD
    <!-- HEADER:START --> ... <!-- HEADER:END -->        partials/header.html
    <!-- FOOTER:START --> ... <!-- FOOTER:END -->        partials/footer.html
    <!-- BREADCRUMB:START --> ... <!-- BREADCRUMB:END -->
    <!-- ARTICLEMETA:START --> ... <!-- ARTICLEMETA:END -->
    <!-- RELATED:START --> ... <!-- RELATED:END -->
    <!-- LIBRARY:START --> ... <!-- LIBRARY:END -->      education.html resource groups
    <!-- LATEST:START --> ... <!-- LATEST:END -->        homepage article cards
    <!-- VIDEOS:START --> ... <!-- VIDEOS:END -->        videos.html
    <!-- TEMPLATES:START --> ... <!-- TEMPLATES:END -->  templates.html

It also writes sitemap.xml, robots.txt, and llms.txt.

Run after any content change:  python3 build.py
"""

import html
import json
import re
from datetime import date
from pathlib import Path

ROOT = Path(__file__).parent

# ---------------------------------------------------------------------------
# Site settings
# ---------------------------------------------------------------------------

SITE_URL = "https://life-ready-dashboard.vercel.app"
SITE_NAME = "Life Ready Learning Hub"
SITE_TAGLINE = "Free, plain-English financial education"
LOCALE = "en_CA"
LANG = "en-CA"
OG_IMAGE = "/assets/og-image.png"
LAST_UPDATED = "2026-09-30"

PUBLISHER = {
    "name": "Iberian Pacific Financial Services Inc.",
    "url": "https://iberianpacific.ca",
    "email": "support@iberianpacific.ca",
    "phone": "+1-604-916-8819",
}

AUDIENCE = "Canadians looking to build everyday money skills, including the Life Ready Facilitated Care community"

# ---------------------------------------------------------------------------
# Content catalogue
# ---------------------------------------------------------------------------

TOPICS = [
    ("budgeting", "Budgeting", "Build a spending plan that actually fits your paycheque."),
    ("debt", "Debt Management", "Pay down what you owe with a plan, not panic."),
    ("credit", "Credit", "Understand your credit score and how to build it up."),
    ("investing", "Saving &amp; Investing", "How RRSPs, TFSAs, and compound growth work for you."),
    ("insurance", "Insurance &amp; Protection", "Know what each type of coverage actually protects."),
    ("retirement", "Retirement Planning", "Start planning for retirement, even decades away."),
]
TOPIC_NAMES = {slug: name for slug, name, _ in TOPICS}

ARTICLES = [
    {
        "file": "article-budgeting-basics.html",
        "topic": "budgeting",
        "headline": "How to Build a Budget That Actually Works",
        "title": "How to Build a Budget That Actually Works | Life Ready",
        "description": "A simple, step-by-step budgeting guide for Canadians: find your real numbers, try the 50/30/20 split, automate your savings, and review monthly.",
        "card": "A simple framework for putting every paycheque to work, including the 50/30/20 rule and how to automate savings.",
        "minutes": 6,
        "published": "2026-07-28",
        "keywords": ["how to make a budget", "50/30/20 rule", "budgeting for beginners", "monthly budget Canada", "spending plan"],
        "related": ["article-debt-management.html", "article-investing-basics.html", "article-credit-scores.html"],
    },
    {
        "file": "article-debt-management.html",
        "topic": "debt",
        "headline": "A Practical Plan for Paying Down Debt",
        "title": "How to Pay Off Debt: Avalanche vs. Snowball | Life Ready",
        "description": "A step-by-step debt repayment plan for Canadians: list what you owe, compare the avalanche and snowball methods, and avoid common debt traps.",
        "card": "How to prioritize what you owe, compare the avalanche and snowball methods, and avoid common traps.",
        "minutes": 7,
        "published": "2026-07-28",
        "keywords": ["how to pay off debt", "debt avalanche vs snowball", "credit card debt Canada", "debt repayment plan", "credit counselling"],
        "related": ["article-credit-scores.html", "article-budgeting-basics.html", "article-retirement-planning.html"],
    },
    {
        "file": "article-credit-scores.html",
        "topic": "credit",
        "headline": "Credit Scores in Canada, Explained",
        "title": "Credit Scores in Canada, Explained | Life Ready",
        "description": "What affects your credit score in Canada, why Equifax and TransUnion scores differ, and the simple habits that build good credit over time.",
        "card": "What actually affects your credit score, how Canada's two bureaus work, and habits that build credit over time.",
        "minutes": 6,
        "published": "2026-07-28",
        "keywords": ["credit score Canada", "how to improve credit score", "Equifax vs TransUnion", "credit utilization", "good credit score Canada"],
        "related": ["article-debt-management.html", "article-budgeting-basics.html", "article-insurance-basics.html"],
    },
    {
        "file": "article-investing-basics.html",
        "topic": "investing",
        "headline": "Investing Basics: RRSPs, TFSAs, and Compound Growth",
        "title": "Investing Basics: RRSPs, TFSAs &amp; Compounding | Life Ready",
        "description": "How RRSPs and TFSAs work, why employer matching matters, how compound growth builds wealth, and how to choose investments that fit your goals.",
        "card": "How RRSPs and TFSAs differ, why an employer match is worth capturing, and how compounding works in your favour.",
        "minutes": 7,
        "published": "2026-07-28",
        "keywords": ["RRSP vs TFSA", "investing for beginners Canada", "compound interest", "group RRSP employer match", "target date funds"],
        "related": ["article-retirement-planning.html", "article-budgeting-basics.html", "article-debt-management.html"],
    },
    {
        "file": "article-insurance-basics.html",
        "topic": "insurance",
        "headline": "Insurance Basics: Health, Dental, Life, and Disability Coverage",
        "title": "Insurance Basics in Canada, Explained | Life Ready",
        "description": "A plain-English guide to extended health, dental, life, and disability insurance in Canada, plus how claims and pre-determinations work.",
        "card": "A plain-English guide to extended health, dental, life, and disability coverage, and how to actually use it.",
        "minutes": 6,
        "published": "2026-07-28",
        "keywords": ["insurance basics Canada", "extended health benefits", "disability insurance", "life insurance beneficiary", "how to submit insurance claim"],
        "related": ["article-budgeting-basics.html", "article-retirement-planning.html", "article-credit-scores.html"],
    },
    {
        "file": "article-retirement-planning.html",
        "topic": "retirement",
        "headline": "Retirement Planning in Canada: Where to Start",
        "title": "Retirement Planning in Canada: Where to Start | Life Ready",
        "description": "Why starting early beats starting big, how CPP, OAS, RRSPs, and TFSAs fit together, and how to set a realistic retirement savings goal.",
        "card": "Why starting early matters more than starting big, and how CPP, OAS, RRSPs, and TFSAs fit together.",
        "minutes": 7,
        "published": "2026-07-28",
        "keywords": ["retirement planning Canada", "CPP and OAS", "how much to save for retirement", "RRSP retirement", "retirement income"],
        "related": ["article-investing-basics.html", "article-budgeting-basics.html", "article-insurance-basics.html"],
    },
]
ARTICLES_BY_FILE = {a["file"]: a for a in ARTICLES}

# Same template links as studentfinancial.ca.
TEMPLATES = [
    {
        "id": "complete-spending-plan",
        "name": "Complete Financial Spending Plan",
        "description": "A free, all-in-one Google Sheet covering everything from your monthly budget to your long-term goals.",
        "url": "https://docs.google.com/spreadsheets/d/17zQUAbBdKj6JEYIH6UAY_od7iSDD0XhGBIOnqNKUn90/edit?usp=sharing",
        "tabs": ["Monthly Spending Plan", "Personal Financial Snapshot", "Dashboard", "Goals Tracker", "Accounts", "Tax Savings", "Budget Link"],
        "topics": ["budgeting", "debt", "investing"],
    },
]

# Add a YouTube video ID (the part after "v=" in the URL), upload date
# (YYYY-MM-DD), and ISO 8601 duration (e.g. "PT4M30S") to publish a video.
# Published videos get a click-to-play embed and VideoObject schema;
# entries without an ID show as "coming soon".
VIDEOS = [
    {"title": "Budgeting 101: Build Your First Spending Plan", "description": "A short walkthrough of the 50/30/20 split and how to set up a monthly spending plan using the free template.", "topic": "budgeting", "youtube_id": None, "upload_date": None, "duration": None},
    {"title": "Debt Payoff Strategies: Avalanche vs. Snowball", "description": "How the two most popular debt payoff methods work, and how to choose the one you will stick with.", "topic": "debt", "youtube_id": None, "upload_date": None, "duration": None},
    {"title": "How Credit Scores Work in Canada", "description": "The five factors behind your credit score and the everyday habits that improve it.", "topic": "credit", "youtube_id": None, "upload_date": None, "duration": None},
    {"title": "RRSP vs. TFSA: Which Account First?", "description": "A side-by-side look at Canada's two most popular savings accounts and when each one makes sense.", "topic": "investing", "youtube_id": None, "upload_date": None, "duration": None},
    {"title": "Insurance Basics in Five Minutes", "description": "What health, dental, life, and disability coverage actually protect, and how to make a claim.", "topic": "insurance", "youtube_id": None, "upload_date": None, "duration": None},
    {"title": "Retirement Planning: Your First Steps", "description": "How CPP, OAS, and personal savings fit together, and how to pick a starting contribution rate.", "topic": "retirement", "youtube_id": None, "upload_date": None, "duration": None},
]

PAGES = [
    {
        "file": "index.html",
        "path": "/",
        "kind": "home",
        "nav": "home",
        "title": "Life Ready Learning Hub | Free Financial Education in Canada",
        "description": "Free, plain-English financial education for Canadians: articles, videos, and a free budget template on budgeting, debt, credit, investing, and retirement.",
        "priority": "1.0",
        "changefreq": "weekly",
    },
    {
        "file": "education.html",
        "path": "/education",
        "kind": "library",
        "nav": "articles",
        "title": "Financial Education Articles &amp; Resources | Life Ready",
        "description": "Browse free financial education articles, videos, and templates by topic: budgeting, debt management, credit scores, investing, insurance, and retirement.",
        "breadcrumbs": [("Home", "/"), ("Articles &amp; Resources", None)],
        "priority": "0.9",
        "changefreq": "weekly",
    },
    {
        "file": "videos.html",
        "path": "/videos",
        "kind": "videos",
        "nav": "videos",
        "title": "Financial Education Videos | Life Ready Learning Hub",
        "description": "Short, free financial education videos on budgeting, paying off debt, credit scores, RRSPs and TFSAs, insurance, and retirement planning in Canada.",
        "breadcrumbs": [("Home", "/"), ("Videos", None)],
        "priority": "0.8",
        "changefreq": "weekly",
    },
    {
        "file": "templates.html",
        "path": "/templates",
        "kind": "templates",
        "nav": "templates",
        "title": "Free Budget &amp; Spending Plan Template | Life Ready",
        "description": "Get a free Google Sheets spending plan template with a monthly budget, net worth snapshot, goals tracker, and tax savings tab. No sign-up needed to view.",
        "breadcrumbs": [("Home", "/"), ("Templates", None)],
        "priority": "0.9",
        "changefreq": "monthly",
    },
]

for a in ARTICLES:
    PAGES.append({
        "file": a["file"],
        "path": "/" + a["file"].removesuffix(".html"),
        "kind": "article",
        "nav": "articles",
        "title": a["title"],
        "description": a["description"],
        "breadcrumbs": [("Home", "/"), ("Articles", "/education"), (TOPIC_NAMES[a["topic"]], f"/education#{a['topic']}"), (a["headline"], None)],
        "priority": "0.8",
        "changefreq": "monthly",
        "article": a,
    })

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def abs_url(path):
    return SITE_URL + path


def page_url(file):
    if file == "index.html":
        return "/"
    return "/" + file.removesuffix(".html")


def strip_tags(s):
    return html.unescape(re.sub(r"<[^>]+>", "", s)).strip()


def human_date(iso):
    d = date.fromisoformat(iso)
    return d.strftime("%B ") + str(d.day) + d.strftime(", %Y")


def replace_block(text, name, content, file):
    pattern = re.compile(rf"(<!-- {name}:START -->)(.*?)(<!-- {name}:END -->)", re.S)
    if not pattern.search(text):
        return text
    return pattern.sub(lambda m: m.group(1) + "\n" + content.rstrip() + "\n" + m.group(3), text)


def extract_faqs(text):
    items = re.findall(
        r'<details class="faq-item">\s*<summary>(.*?)</summary>\s*<div class="faq-answer">(.*?)</div>\s*</details>',
        text, re.S,
    )
    return [(strip_tags(q), re.sub(r"\s+", " ", strip_tags(a))) for q, a in items]


def ld(obj):
    return '<script type="application/ld+json">\n' + json.dumps(obj, indent=2, ensure_ascii=False) + "\n</script>"


ORG_ID = PUBLISHER["url"] + "/#organization"
WEBSITE_ID = SITE_URL + "/#website"

# ---------------------------------------------------------------------------
# Generated blocks
# ---------------------------------------------------------------------------


def seo_block(page, text):
    url = abs_url(page["path"])
    title = page["title"]
    desc = page["description"]
    is_article = page["kind"] == "article"
    image = abs_url(OG_IMAGE)

    lines = [
        f"    <title>{title}</title>",
        f'    <meta name="description" content="{desc}">',
        f'    <link rel="canonical" href="{url}">',
        '    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">',
        '    <meta name="theme-color" content="#D49424">',
        f'    <meta name="author" content="{PUBLISHER["name"]}">',
        f'    <meta property="og:site_name" content="{SITE_NAME}">',
        f'    <meta property="og:locale" content="{LOCALE}">',
        f'    <meta property="og:type" content="{"article" if is_article else "website"}">',
        f'    <meta property="og:title" content="{title}">',
        f'    <meta property="og:description" content="{desc}">',
        f'    <meta property="og:url" content="{url}">',
        f'    <meta property="og:image" content="{image}">',
        '    <meta property="og:image:width" content="1200">',
        '    <meta property="og:image:height" content="630">',
        f'    <meta property="og:image:alt" content="{SITE_NAME}: {SITE_TAGLINE}">',
    ]
    if is_article:
        a = page["article"]
        lines += [
            f'    <meta property="article:published_time" content="{a["published"]}">',
            f'    <meta property="article:modified_time" content="{LAST_UPDATED}">',
            f'    <meta property="article:section" content="{strip_tags(TOPIC_NAMES[a["topic"]])}">',
        ]
        lines += [f'    <meta property="article:tag" content="{k}">' for k in a["keywords"]]
    lines += [
        '    <meta name="twitter:card" content="summary_large_image">',
        f'    <meta name="twitter:title" content="{title}">',
        f'    <meta name="twitter:description" content="{desc}">',
        f'    <meta name="twitter:image" content="{image}">',
        '    <link rel="icon" type="image/svg+xml" href="/assets/logo.svg">',
        '    <link rel="apple-touch-icon" href="/assets/logo.png">',
        '    <link rel="preconnect" href="https://fonts.googleapis.com">',
        '    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
        '    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,700;1,400&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,400&display=swap">',
        '    <link rel="stylesheet" href="/css/styles.css">',
    ]

    graph = [
        {
            "@type": ["Organization", "FinancialService"],
            "@id": ORG_ID,
            "name": PUBLISHER["name"],
            "url": PUBLISHER["url"],
            "email": PUBLISHER["email"],
            "telephone": PUBLISHER["phone"],
            "areaServed": {"@type": "Country", "name": "Canada"},
            "address": {"@type": "PostalAddress", "addressRegion": "BC", "addressCountry": "CA"},
        },
        {
            "@type": "WebSite",
            "@id": WEBSITE_ID,
            "url": SITE_URL + "/",
            "name": SITE_NAME,
            "description": SITE_TAGLINE + " on budgeting, debt, credit, investing, insurance, and retirement for Canadians.",
            "inLanguage": LANG,
            "publisher": {"@id": ORG_ID},
            "potentialAction": {
                "@type": "SearchAction",
                "target": {"@type": "EntryPoint", "urlTemplate": SITE_URL + "/education?q={search_term_string}"},
                "query-input": "required name=search_term_string",
            },
        },
    ]

    webpage_type = {"home": "WebPage", "library": "CollectionPage", "videos": "CollectionPage", "templates": "CollectionPage", "article": "WebPage"}[page["kind"]]
    webpage = {
        "@type": webpage_type,
        "@id": url + "#webpage",
        "url": url,
        "name": strip_tags(title),
        "description": desc,
        "inLanguage": LANG,
        "isPartOf": {"@id": WEBSITE_ID},
        "dateModified": LAST_UPDATED,
        "primaryImageOfPage": {"@type": "ImageObject", "url": image},
    }
    if page.get("breadcrumbs"):
        webpage["breadcrumb"] = {"@id": url + "#breadcrumb"}
    graph.append(webpage)

    if page.get("breadcrumbs"):
        graph.append({
            "@type": "BreadcrumbList",
            "@id": url + "#breadcrumb",
            "itemListElement": [
                {"@type": "ListItem", "position": i + 1, "name": strip_tags(name), **({"item": abs_url(href)} if href else {})}
                for i, (name, href) in enumerate(page["breadcrumbs"])
            ],
        })

    if is_article:
        a = page["article"]
        graph.append({
            "@type": "Article",
            "@id": url + "#article",
            "headline": a["headline"],
            "description": desc,
            "image": image,
            "datePublished": a["published"],
            "dateModified": LAST_UPDATED,
            "author": {"@id": ORG_ID},
            "publisher": {"@id": ORG_ID},
            "mainEntityOfPage": {"@id": url + "#webpage"},
            "articleSection": strip_tags(TOPIC_NAMES[a["topic"]]),
            "keywords": ", ".join(a["keywords"]),
            "timeRequired": f"PT{a['minutes']}M",
            "inLanguage": LANG,
            "isAccessibleForFree": True,
            "educationalLevel": "Beginner",
            "learningResourceType": "Article",
            "audience": {"@type": "Audience", "audienceType": AUDIENCE},
            "about": {"@type": "Thing", "name": strip_tags(TOPIC_NAMES[a["topic"]]) + " (personal finance)"},
        })

    if page["kind"] in ("library", "home"):
        graph.append({
            "@type": "ItemList",
            "@id": url + "#articles",
            "name": "Financial education articles",
            "itemListElement": [
                {"@type": "ListItem", "position": i + 1, "url": abs_url(page_url(a["file"])), "name": a["headline"]}
                for i, a in enumerate(ARTICLES)
            ],
        })

    if page["kind"] == "templates":
        for t in TEMPLATES:
            graph.append({
                "@type": "DigitalDocument",
                "@id": url + "#" + t["id"],
                "name": t["name"],
                "description": t["description"],
                "url": t["url"],
                "encodingFormat": "application/vnd.google-apps.spreadsheet",
                "isAccessibleForFree": True,
                "author": {"@id": ORG_ID},
                "learningResourceType": "Template",
                "hasPart": [{"@type": "CreativeWork", "name": tab} for tab in t["tabs"]],
            })

    published_videos = [v for v in VIDEOS if v["youtube_id"]]
    if page["kind"] == "videos" and published_videos:
        for v in published_videos:
            obj = {
                "@type": "VideoObject",
                "name": v["title"],
                "description": v["description"],
                "thumbnailUrl": f"https://i.ytimg.com/vi/{v['youtube_id']}/hqdefault.jpg",
                "embedUrl": f"https://www.youtube-nocookie.com/embed/{v['youtube_id']}",
                "contentUrl": f"https://www.youtube.com/watch?v={v['youtube_id']}",
                "publisher": {"@id": ORG_ID},
                "isAccessibleForFree": True,
            }
            if v["upload_date"]:
                obj["uploadDate"] = v["upload_date"]
            if v["duration"]:
                obj["duration"] = v["duration"]
            graph.append(obj)

    faqs = extract_faqs(text)
    if faqs:
        graph.append({
            "@type": "FAQPage",
            "@id": url + "#faq",
            "mainEntity": [
                {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": ans}}
                for q, ans in faqs
            ],
        })

    lines.append(ld({"@context": "https://schema.org", "@graph": graph}))
    return "\n".join(lines)


def header_block(page):
    text = (ROOT / "partials/header.html").read_text()
    return text.replace(f'data-nav="{page["nav"]}"', f'data-nav="{page["nav"]}" class="active" aria-current="page"')


def footer_block():
    return (ROOT / "partials/footer.html").read_text().replace("{year}", LAST_UPDATED[:4])


def breadcrumb_block(page):
    items = []
    for name, href in page.get("breadcrumbs", []):
        if href:
            items.append(f'<li><a href="{href}">{name}</a></li>')
        else:
            items.append(f'<li aria-current="page">{name}</li>')
    return '<nav class="breadcrumb" aria-label="Breadcrumb"><ol>' + "".join(items) + "</ol></nav>"


def article_meta_block(a):
    topic = TOPIC_NAMES[a["topic"]]
    return (
        '<div class="article-meta">\n'
        f'    <span><a href="/education#{a["topic"]}">{topic}</a></span>\n'
        f'    <span>{a["minutes"]} min read</span>\n'
        f'    <span>Updated <time datetime="{LAST_UPDATED}">{human_date(LAST_UPDATED)}</time></span>\n'
        f'    <span>By <a href="{PUBLISHER["url"]}" rel="author">{PUBLISHER["name"]}</a></span>\n'
        "</div>"
    )


def article_card(a, heading="h3"):
    return (
        f'<a href="{page_url(a["file"])}" class="resource-card">\n'
        '    <div class="resource-card-body">\n'
        f'        <span class="resource-type">Article · {a["minutes"]} min read</span>\n'
        f'        <{heading}>{a["headline"]}</{heading}>\n'
        f'        <p>{a["card"]}</p>\n'
        '        <span class="read-link">Read article →</span>\n'
        "    </div>\n"
        "</a>"
    )


def template_card_small(t):
    return (
        '<a href="/templates" class="resource-card">\n'
        '    <div class="resource-card-body">\n'
        '        <span class="resource-type template">Template · Google Sheets</span>\n'
        f'        <h3>{t["name"]}</h3>\n'
        f'        <p>{t["description"]}</p>\n'
        '        <span class="read-link">Get the free template →</span>\n'
        "    </div>\n"
        "</a>"
    )


def video_card(v, heading="h3"):
    topic = TOPIC_NAMES[v["topic"]]
    if v["youtube_id"]:
        vid = v["youtube_id"]
        title = html.escape(v["title"], quote=True)
        return (
            '<article class="resource-card video-card">\n'
            f'    <button type="button" class="video-embed" data-youtube-id="{vid}" aria-label="Play video: {title}">\n'
            f'        <img src="https://i.ytimg.com/vi/{vid}/hqdefault.jpg" alt="" loading="lazy" width="480" height="360">\n'
            '        <span class="video-play" aria-hidden="true"></span>\n'
            "    </button>\n"
            '    <div class="resource-card-body">\n'
            f'        <span class="resource-type video">Video · {topic}</span>\n'
            f'        <{heading}>{v["title"]}</{heading}>\n'
            f'        <p>{v["description"]}</p>\n'
            f'        <a class="read-link" href="https://www.youtube.com/watch?v={vid}" target="_blank" rel="noopener">Watch on YouTube →</a>\n'
            "    </div>\n"
            "</article>"
        )
    return (
        '<article class="resource-card video-placeholder-card">\n'
        '    <div class="resource-card-body">\n'
        f'        <span class="resource-type video">Video · Coming Soon · {topic}</span>\n'
        f'        <{heading}>{v["title"]}</{heading}>\n'
        f'        <p>{v["description"]}</p>\n'
        "    </div>\n"
        "</article>"
    )


def related_block(a):
    cards = [article_card(ARTICLES_BY_FILE[f]) for f in a["related"]]
    videos = [v for v in VIDEOS if v["topic"] == a["topic"] and v["youtube_id"]]
    parts = []
    if videos:
        parts.append('<section class="article-video" aria-labelledby="watch-heading">\n<h2 id="watch-heading">Watch: ' + videos[0]["title"] + "</h2>\n" + video_card(videos[0]) + "\n</section>")
    t = TEMPLATES[0]
    parts.append(
        '<aside class="template-cta" aria-label="Free template">\n'
        '    <div>\n'
        '        <span class="subheading">Free Template</span>\n'
        f'        <h2>Put this into practice with the {t["name"]}</h2>\n'
        '        <p>A free Google Sheet with a monthly budget, net worth snapshot, goals tracker, and more.</p>\n'
        "    </div>\n"
        '    <a href="/templates" class="btn btn-primary">Get the Free Template</a>\n'
        "</aside>"
    )
    parts.append(
        '<section class="related" aria-labelledby="related-heading">\n'
        '    <h2 id="related-heading">Keep learning</h2>\n'
        '    <div class="resource-grid">\n' + "\n".join(cards) + "\n    </div>\n"
        "</section>"
    )
    return "\n".join(parts)


def library_block():
    groups = []
    for slug, name, desc in TOPICS:
        cards = [article_card(a) for a in ARTICLES if a["topic"] == slug]
        cards += [template_card_small(t) for t in TEMPLATES if slug in t["topics"]]
        cards += [video_card(v) for v in VIDEOS if v["topic"] == slug]
        groups.append(
            f'<section class="category-group" id="{slug}" data-category="{slug}" aria-labelledby="{slug}-heading">\n'
            f'    <h2 id="{slug}-heading">{name}</h2>\n'
            f'    <p class="category-desc">{desc}</p>\n'
            '    <div class="resource-grid">\n' + "\n".join(cards) + "\n    </div>\n"
            "</section>"
        )
    return "\n".join(groups)


def latest_block():
    return "\n".join(article_card(a) for a in ARTICLES)


def videos_block():
    return "\n".join(video_card(v, "h2") for v in VIDEOS)


def templates_block():
    out = []
    for t in TEMPLATES:
        tabs = "\n".join(f"            <li>{tab}</li>" for tab in t["tabs"])
        out.append(
            f'<article class="template-card" id="{t["id"]}">\n'
            '    <span class="resource-type template">Free Template · Google Sheets</span>\n'
            f'    <h2>{t["name"]}</h2>\n'
            f'    <p>{t["description"]} It includes:</p>\n'
            f'    <ul class="template-tabs">\n{tabs}\n    </ul>\n'
            f'    <a href="{t["url"]}" class="btn btn-primary btn-block" target="_blank" rel="noopener">View Template</a>\n'
            "</article>"
        )
    return "\n".join(out)


# ---------------------------------------------------------------------------
# Site-level files
# ---------------------------------------------------------------------------


def write_sitemap():
    urls = []
    for p in PAGES:
        urls.append(
            "  <url>\n"
            f"    <loc>{abs_url(p['path'])}</loc>\n"
            f"    <lastmod>{LAST_UPDATED}</lastmod>\n"
            f"    <changefreq>{p['changefreq']}</changefreq>\n"
            f"    <priority>{p['priority']}</priority>\n"
            "  </url>"
        )
    (ROOT / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "\n".join(urls) + "\n</urlset>\n"
    )


def write_robots():
    ai_bots = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-User", "Claude-SearchBot",
               "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot-Extended", "Bingbot", "CCBot"]
    lines = ["# Life Ready Learning Hub: all educational content is open to search engines and AI assistants.", "",
             "User-agent: *", "Allow: /", ""]
    for bot in ai_bots:
        lines += [f"User-agent: {bot}", "Allow: /", ""]
    lines += [f"Sitemap: {SITE_URL}/sitemap.xml", ""]
    (ROOT / "robots.txt").write_text("\n".join(lines))


def write_llms():
    out = [
        f"# {SITE_NAME}",
        "",
        f"> {SITE_TAGLINE} for Canadians, published by {PUBLISHER['name']} ({PUBLISHER['url']}) for the Life Ready Facilitated Care community and the public. "
        "The site offers articles, short videos, and a free Google Sheets spending plan template covering budgeting, debt, credit, investing (RRSPs and TFSAs), insurance, and retirement planning in Canada.",
        "",
        "This site is educational only. It is not a group benefits, group investment, or insurance portal, and nothing on it is personalized financial, tax, or legal advice. "
        f"Questions can be sent to {PUBLISHER['email']}.",
        "",
        "## Articles",
        "",
    ]
    for a in ARTICLES:
        out.append(f"- [{strip_tags(a['headline'])}]({abs_url(page_url(a['file']))}): {strip_tags(a['description'])}")
    out += ["", "## Templates", ""]
    for t in TEMPLATES:
        out.append(f"- [{t['name']}]({abs_url('/templates')}): {t['description']} Tabs: {', '.join(t['tabs'])}. Direct link: {t['url']}")
    out += ["", "## Videos", ""]
    for v in VIDEOS:
        status = f"https://www.youtube.com/watch?v={v['youtube_id']}" if v["youtube_id"] else "coming soon"
        out.append(f"- {v['title']} ({status}): {v['description']}")
    out += ["", "## Site sections", ""]
    for p in PAGES:
        if p["kind"] != "article":
            out.append(f"- [{strip_tags(p['title'])}]({abs_url(p['path'])}): {strip_tags(p['description'])}")
    out.append("")
    (ROOT / "llms.txt").write_text("\n".join(out))


# ---------------------------------------------------------------------------


def build():
    for page in PAGES:
        path = ROOT / page["file"]
        text = path.read_text()
        text = replace_block(text, "SEO", seo_block(page, text), page["file"])
        text = replace_block(text, "HEADER", header_block(page), page["file"])
        text = replace_block(text, "FOOTER", footer_block(), page["file"])
        text = replace_block(text, "BREADCRUMB", breadcrumb_block(page), page["file"])
        if page["kind"] == "article":
            text = replace_block(text, "ARTICLEMETA", article_meta_block(page["article"]), page["file"])
            text = replace_block(text, "RELATED", related_block(page["article"]), page["file"])
        text = replace_block(text, "LIBRARY", library_block(), page["file"])
        text = replace_block(text, "LATEST", latest_block(), page["file"])
        text = replace_block(text, "VIDEOS", videos_block(), page["file"])
        text = replace_block(text, "TEMPLATES", templates_block(), page["file"])
        path.write_text(text)
        print("built", page["file"])
    write_sitemap()
    write_robots()
    write_llms()
    print("wrote sitemap.xml, robots.txt, llms.txt")


if __name__ == "__main__":
    build()
