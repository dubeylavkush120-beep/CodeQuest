import sys
import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

def create_codequest_presentation(output_path="CodeQuest_Presentation.pptx"):
    prs = Presentation()
    # 16:9 Widescreen
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Color Palette (Dark Tech Cyberpunk Theme)
    BG_DARK = RGBColor(11, 14, 20)          # #0B0E14
    CARD_BG = RGBColor(21, 25, 37)          # #151925
    CARD_BORDER = RGBColor(45, 52, 74)      # #2D344A
    ACCENT_PURPLE = RGBColor(139, 92, 246)  # #8B5CF6
    ACCENT_CYAN = RGBColor(56, 189, 248)    # #38BDF8
    ACCENT_GREEN = RGBColor(16, 185, 129)   # #10B981
    ACCENT_ORANGE = RGBColor(245, 158, 11)  # #F59E0B
    TEXT_LIGHT = RGBColor(248, 250, 252)    # #F8FAFC
    TEXT_MUTED = RGBColor(148, 163, 184)    # #94A3B8

    def apply_background(slide):
        bg_shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
        bg_shape.fill.solid()
        bg_shape.fill.fore_color.rgb = BG_DARK
        bg_shape.line.fill.background()
        
        # Subtle decorative accent line at the top
        top_bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, Inches(0.08))
        top_bar.fill.solid()
        top_bar.fill.fore_color.rgb = ACCENT_PURPLE
        top_bar.line.fill.background()

    def add_header(slide, title_text, category_text="CODEQUEST PLATFORM"):
        header_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.7), Inches(1.1))
        tf = header_box.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        
        p_cat = tf.paragraphs[0]
        p_cat.text = category_text.upper()
        p_cat.font.size = Pt(10)
        p_cat.font.bold = True
        p_cat.font.color.rgb = ACCENT_PURPLE
        p_cat.space_after = Pt(4)

        p_title = tf.add_paragraph()
        p_title.text = title_text
        p_title.font.size = Pt(24)
        p_title.font.bold = True
        p_title.font.color.rgb = TEXT_LIGHT

    def create_card(slide, left, top, width, height, title="", title_color=ACCENT_CYAN, border_color=CARD_BORDER):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_BG
        card.line.color.rgb = border_color
        card.line.width = Pt(1.5)
        
        if title:
            tb = slide.shapes.add_textbox(left + Inches(0.25), top + Inches(0.2), width - Inches(0.5), Inches(0.5))
            tf = tb.text_frame
            tf.word_wrap = True
            tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
            p = tf.paragraphs[0]
            p.text = title
            p.font.size = Pt(14)
            p.font.bold = True
            p.font.color.rgb = title_color
        return card

    # =========================================================================
    # SLIDE 1: Title Slide
    # =========================================================================
    slide1 = prs.slides.add_slide(blank_layout)
    apply_background(slide1)
    
    # Hero Title Box
    t_box = slide1.shapes.add_textbox(Inches(1.0), Inches(1.2), Inches(11.3), Inches(3.2))
    tf1 = t_box.text_frame
    tf1.word_wrap = True
    
    p_tag = tf1.paragraphs[0]
    p_tag.text = "NEXT-GENERATION DEVELOPER INTELLIGENCE PLATFORM"
    p_tag.font.size = Pt(12)
    p_tag.font.bold = True
    p_tag.font.color.rgb = ACCENT_CYAN
    p_tag.space_after = Pt(12)
    
    p_main = tf1.add_paragraph()
    p_main.text = "CODEQUEST"
    p_main.font.size = Pt(48)
    p_main.font.bold = True
    p_main.font.color.rgb = TEXT_LIGHT
    p_main.space_after = Pt(8)
    
    p_sub = tf1.add_paragraph()
    p_sub.text = "A Unified MERN Ecosystem for Algorithmic Telemetry, AI Interview Readiness & Peer Coding Duels"
    p_sub.font.size = Pt(18)
    p_sub.font.color.rgb = ACCENT_PURPLE

    # Metadata Cards
    create_card(slide1, Inches(1.0), Inches(4.7), Inches(5.4), Inches(1.9), title="Presented By", title_color=ACCENT_CYAN)
    m_box1 = slide1.shapes.add_textbox(Inches(1.25), Inches(5.35), Inches(4.9), Inches(1.1))
    tf_m1 = m_box1.text_frame
    tf_m1.word_wrap = True
    p1 = tf_m1.paragraphs[0]
    p1.text = "Lavkush"
    p1.font.bold = True
    p1.font.size = Pt(15)
    p1.font.color.rgb = TEXT_LIGHT
    p2 = tf_m1.add_paragraph()
    p2.text = "B.Tech - Computer Science & Engineering"
    p2.font.size = Pt(12)
    p2.font.color.rgb = TEXT_MUTED
    p3 = tf_m1.add_paragraph()
    p3.text = "Full Stack MERN Developer | Competitive Programmer"
    p3.font.size = Pt(11)
    p3.font.color.rgb = ACCENT_GREEN

    create_card(slide1, Inches(6.9), Inches(4.7), Inches(5.4), Inches(1.9), title="Mentorship & Guidance", title_color=ACCENT_PURPLE)
    m_box2 = slide1.shapes.add_textbox(Inches(7.15), Inches(5.35), Inches(4.9), Inches(1.1))
    tf_m2 = m_box2.text_frame
    tf_m2.word_wrap = True
    p1 = tf_m2.paragraphs[0]
    p1.text = "Department of Computer Science & Engineering"
    p1.font.bold = True
    p1.font.size = Pt(14)
    p1.font.color.rgb = TEXT_LIGHT
    p2 = tf_m2.add_paragraph()
    p2.text = "Project Mentor: Faculty Coordinator"
    p2.font.size = Pt(12)
    p2.font.color.rgb = TEXT_MUTED
    p3 = tf_m2.add_paragraph()
    p3.text = "Academic Capstone / Technical Showcase 2026"
    p3.font.size = Pt(11)
    p3.font.color.rgb = ACCENT_CYAN

    # =========================================================================
    # SLIDE 2: Proposed Solution & System Architecture
    # =========================================================================
    slide2 = prs.slides.add_slide(blank_layout)
    apply_background(slide2)
    add_header(slide2, "Proposed Solution & System Architecture", "SYSTEM OVERVIEW")

    create_card(slide2, Inches(0.8), Inches(1.7), Inches(6.3), Inches(5.2), title="The CodeQuest Solution", title_color=ACCENT_CYAN)
    sol_box = slide2.shapes.add_textbox(Inches(1.05), Inches(2.35), Inches(5.8), Inches(4.3))
    tf_sol = sol_box.text_frame
    tf_sol.word_wrap = True
    items_sol = [
        ("Unified Platform Telemetry", "Merges LeetCode, Codeforces, CodeChef, GFG, and GitHub into one synchronized developer identity."),
        ("365-Day Activity Heatmap", "Resolves fragmented activity calendars into a unified 52-week GitHub/LeetCode style contribution grid."),
        ("Developer DNA Radar Matrix", "Plots 6-axis skill competency (DSA, Algorithms, Real-World Dev, Speed, Problem Solving, Math)."),
        ("AI Company Readiness Index", "Evaluates telemetry against real interview benchmarks for Google, Amazon, Microsoft, and Startups."),
        ("1v1 Algorithmic Speed Duel", "Multiplayer coding room with curated problems and real-time victory validation."),
        ("Live GitHub README Card", "Auto-updating SVG badge showcasing live contest ratings, streak flames, and total verified solves.")
    ]
    for i, (heading, desc) in enumerate(items_sol):
        p = tf_sol.paragraphs[0] if i == 0 else tf_sol.add_paragraph()
        p.text = f"•  {heading}: "
        p.font.bold = True
        p.font.size = Pt(11)
        p.font.color.rgb = TEXT_LIGHT
        run = p.add_run()
        run.text = desc
        run.font.bold = False
        run.font.size = Pt(10)
        run.font.color.rgb = TEXT_MUTED
        p.space_after = Pt(8)

    create_card(slide2, Inches(7.4), Inches(1.7), Inches(5.1), Inches(5.2), title="Architecture & Flow", title_color=ACCENT_PURPLE)
    arch_box = slide2.shapes.add_textbox(Inches(7.65), Inches(2.35), Inches(4.6), Inches(4.3))
    tf_arch = arch_box.text_frame
    tf_arch.word_wrap = True
    arch_steps = [
        ("1. Client Layer (Vite + React 18)", "Responsive SPA with Recharts data visualizers and Framer Motion micro-interactions."),
        ("2. API Gateway & Reverse Proxy", "Express.js reverse proxy on port 5001 routing authenticated traffic with zero CORS errors."),
        ("3. Telemetry Integration Engines", "Rate-limited Codeforces queue (2.2s delay) & LeetCode GraphQL queries fetching real contest ratings."),
        ("4. Persistent Data Store", "MongoDB Atlas storing encrypted credentials, platform caches, and 365-day submission timestamps."),
        ("5. AI Synthesis Engine", "Gemini API pipeline generating tailored Daily Quests and algorithmic gap analyses."),
        ("6. Dynamic Card Generator", "Vector SVG renderer streaming cached, high-DPI statistics directly to GitHub READMEs.")
    ]
    for i, (heading, desc) in enumerate(arch_steps):
        p = tf_arch.paragraphs[0] if i == 0 else tf_arch.add_paragraph()
        p.text = f"[{heading}]"
        p.font.bold = True
        p.font.size = Pt(11)
        p.font.color.rgb = ACCENT_CYAN
        p2 = tf_arch.add_paragraph()
        p2.text = desc
        p2.font.size = Pt(10)
        p2.font.color.rgb = TEXT_MUTED
        p2.space_after = Pt(6)

    # =========================================================================
    # SLIDE 3: Technical Approach & Tech Stack
    # =========================================================================
    slide3 = prs.slides.add_slide(blank_layout)
    apply_background(slide3)
    add_header(slide3, "Technical Approach & Technology Stack", "IMPLEMENTATION ARCHITECTURE")

    tech_cards = [
        ("Frontend Technologies", ACCENT_CYAN, Inches(0.8), Inches(1.7), Inches(3.7), Inches(5.2), [
            ("React 18 & Vite", "Ultra-fast HMR and optimized asset bundling in under 6.3s."),
            ("Recharts Visualizers", "AreaCharts, Hexagonal RadarCharts & 365-day grids."),
            ("Framer Motion", "Physics-based card animations and interactive modals."),
            ("Lucide React Icons", "Crisp developer-first iconography."),
            ("Axios & JWT Interceptors", "Automatic token injection and unified error handling.")
        ]),
        ("Backend & Infrastructure", ACCENT_PURPLE, Inches(4.8), Inches(1.7), Inches(3.7), Inches(5.2), [
            ("Node.js & Express.js", "Non-blocking RESTful backend operating on port 5001."),
            ("MongoDB Atlas", "Cloud database cluster with indexed multi-platform schemas."),
            ("In-Process DNS Interceptor", "Google (8.8.8.8) & Cloudflare DNS overriding Windows blackholes."),
            ("Rate Limit Promise Queue", "Throttled API caller preventing Codeforces 429 penalties."),
            ("Bcrypt & JWT Security", "Salted password hashing and 7-day signed session tokens.")
        ]),
        ("AI & Advanced Integrations", ACCENT_GREEN, Inches(8.8), Inches(1.7), Inches(3.7), Inches(5.2), [
            ("LeetCode GraphQL", "Deep query for userContestRanking and submissionCalendar."),
            ("Codeforces Status API", "Extracts unique accepted problems and date distributions."),
            ("Gemini AI Engine", "Generates custom Daily Quests and Readiness evaluations."),
            ("SVG Vector Engine", "Direct XML stream rendering dynamic GitHub README cards."),
            ("Printable CSS Engine", "One-click recruiter dossier PDF generation via window.print().")
        ])
    ]

    for title, color, left, top, width, height, items in tech_cards:
        create_card(slide3, left, top, width, height, title=title, title_color=color)
        tb = slide3.shapes.add_textbox(left + Inches(0.25), top + Inches(0.85), width - Inches(0.5), height - Inches(1.0))
        tf = tb.text_frame
        tf.word_wrap = True
        for i, (name, d) in enumerate(items):
            p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
            p.text = f"• {name}"
            p.font.bold = True
            p.font.size = Pt(11)
            p.font.color.rgb = TEXT_LIGHT
            p_desc = tf.add_paragraph()
            p_desc.text = d
            p_desc.font.size = Pt(9.5)
            p_desc.font.color.rgb = TEXT_MUTED
            p_desc.space_after = Pt(6)

    # =========================================================================
    # SLIDE 4: Feasibility, Viability & Challenges
    # =========================================================================
    slide4 = prs.slides.add_slide(blank_layout)
    apply_background(slide4)
    add_header(slide4, "Feasibility, Viability & Engineering Solutions", "SYSTEM ROBUSTNESS")

    # Column 1: Feasibility & Viability
    create_card(slide4, Inches(0.8), Inches(1.7), Inches(5.7), Inches(5.2), title="Feasibility & Viability Analysis", title_color=ACCENT_CYAN)
    fv_box = slide4.shapes.add_textbox(Inches(1.05), Inches(2.35), Inches(5.2), Inches(4.3))
    tf_fv = fv_box.text_frame
    tf_fv.word_wrap = True
    fv_points = [
        ("Technical Feasibility", "Zero browser extensions needed. Leverages sanctioned GraphQL, REST, and vector formats for seamless cross-platform sync."),
        ("Operational Feasibility", "Lightweight Node.js daemon handles thousands of concurrent telemetry queries with minimal memory footprint (<80MB)."),
        ("Market Viability", "35M+ competitive programmers and students actively maintain 3-5 separate coding profiles with no unified benchmark."),
        ("Commercial & Academic Model", "Freemium developer portfolio with premium enterprise recruitment analytics and university club dashboards.")
    ]
    for i, (h, d) in enumerate(fv_points):
        p = tf_fv.paragraphs[0] if i == 0 else tf_fv.add_paragraph()
        p.text = f"✓ {h}: "
        p.font.bold = True
        p.font.size = Pt(11)
        p.font.color.rgb = ACCENT_GREEN
        r = p.add_run()
        r.text = d
        r.font.bold = False
        r.font.size = Pt(10)
        r.font.color.rgb = TEXT_MUTED
        p.space_after = Pt(10)

    # Column 2: Challenges & Solutions
    create_card(slide4, Inches(6.8), Inches(1.7), Inches(5.7), Inches(5.2), title="Overcoming Technical Challenges", title_color=ACCENT_ORANGE)
    cs_box = slide4.shapes.add_textbox(Inches(7.05), Inches(2.35), Inches(5.2), Inches(4.3))
    tf_cs = cs_box.text_frame
    tf_cs.word_wrap = True
    cs_points = [
        ("Challenge: Codeforces Rate Limiting (429)", "Solution: Implemented a serialized async promise queue enforcing a strict 2200ms delay between API requests."),
        ("Challenge: Local Host DNS Blackholing", "Solution: Built an in-process DNS interceptor routing queries through Google (8.8.8.8) and Cloudflare resolvers."),
        ("Challenge: WinNAT Port 5000 Reservation", "Solution: Migrated backend to port 5001 and configured Vite dev server reverse proxy for unified same-origin routing."),
        ("Challenge: LeetCode Scraping Prohibitions", "Solution: Integrated official public GraphQL endpoint with exact contest rating mapping, avoiding brittle scrapers.")
    ]
    for i, (h, d) in enumerate(cs_points):
        p = tf_cs.paragraphs[0] if i == 0 else tf_cs.add_paragraph()
        p.text = f"⚠ {h}"
        p.font.bold = True
        p.font.size = Pt(11)
        p.font.color.rgb = ACCENT_ORANGE
        p_sol = tf_cs.add_paragraph()
        p_sol.text = f"➜ {d}"
        p_sol.font.size = Pt(10)
        p_sol.font.color.rgb = TEXT_LIGHT
        p_sol.space_after = Pt(8)

    # =========================================================================
    # SLIDE 5: Benefits and Potential Impact
    # =========================================================================
    slide5 = prs.slides.add_slide(blank_layout)
    apply_background(slide5)
    add_header(slide5, "Benefits and Potential Impact", "VALUE PROPOSITION")

    quadrants = [
        ("For Students & Developers", ACCENT_CYAN, Inches(0.8), Inches(1.7), Inches(5.7), Inches(2.5), [
            ("Unified Identity", "Single home for 600+ solves across LeetCode, Codeforces, and GitHub."),
            ("Habit Discipline", "365-day contribution heatmap with Duolingo-style Streak Freeze protection.")
        ]),
        ("For Recruiters & Hiring Managers", ACCENT_PURPLE, Inches(6.8), Inches(1.7), Inches(5.7), Inches(2.5), [
            ("Verified Proof-of-Work", "Eliminates inflated resumes with authenticated platform solve stats."),
            ("One-Click Dossier", "Exportable, high-density PDF profiling true algorithmic competence.")
        ]),
        ("For Colleges & Coding Clubs", ACCENT_GREEN, Inches(0.8), Inches(4.4), Inches(5.7), Inches(2.5), [
            ("Campus Leaderboards", "Compare real progress scores across students and peer batches."),
            ("Peer Code Duels", "Live 1v1 algorithmic speed competitions fostering healthy rivalries.")
        ]),
        ("Gamification & Engagement", ACCENT_ORANGE, Inches(6.8), Inches(4.4), Inches(5.7), Inches(2.5), [
            ("RPG Persona Progression", "Unlockable titles (Recursion Weaver, Grandmaster) and holographic badges."),
            ("Daily Quests & XP", "Targeted algorithmic missions rewarding habit consistency with +50 XP.")
        ])
    ]

    for title, color, left, top, width, height, items in quadrants:
        create_card(slide5, left, top, width, height, title=title, title_color=color)
        tb = slide5.shapes.add_textbox(left + Inches(0.25), top + Inches(0.75), width - Inches(0.5), height - Inches(0.9))
        tf = tb.text_frame
        tf.word_wrap = True
        for i, (name, d) in enumerate(items):
            p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
            p.text = f"• {name}: "
            p.font.bold = True
            p.font.size = Pt(11)
            p.font.color.rgb = TEXT_LIGHT
            r = p.add_run()
            r.text = d
            r.font.bold = False
            r.font.size = Pt(10)
            r.font.color.rgb = TEXT_MUTED
            p.space_after = Pt(4)

    # =========================================================================
    # SLIDE 6: Real-World Applications of CodeQuest
    # =========================================================================
    slide6 = prs.slides.add_slide(blank_layout)
    apply_background(slide6)
    add_header(slide6, "Real-World Applications of CodeQuest", "PRACTICAL UTILITY")

    apps = [
        ("1. Automated Placement Preparation & Mock Readiness",
         "Students evaluate their exact match score for companies like Google (38%), Amazon (48%), Microsoft (46%), and Unicorns (52%), identifying algorithmic blind spots prior to on-campus placement drives.",
         ACCENT_CYAN),
        ("2. Real-Time Peer Speed Duels & Hackathons",
         "Coding clubs and university labs organize 15-minute speed battles using 6-character room codes, training participants in rapid problem breakdown under intense time pressure.",
         ACCENT_PURPLE),
        ("3. Dynamic Proof-of-Work in GitHub Profile READMEs",
         "Developers embed auto-updating vector SVG badges in their public GitHub repositories, creating a viral proof of consistency for international open-source maintainers.",
         ACCENT_GREEN),
        ("4. Verified Technical Dossier for Job Applications",
         "Candidates share a single public dossier URL (codequest.app/u/username) or print a verified 1-page PDF dossier that recruiters can review in under 30 seconds.",
         ACCENT_ORANGE)
    ]

    for i, (title, desc, color) in enumerate(apps):
        top_pos = Inches(1.7 + i * 1.3)
        create_card(slide6, Inches(0.8), top_pos, Inches(11.7), Inches(1.15), title=title, title_color=color)
        tb = slide6.shapes.add_textbox(Inches(1.05), top_pos + Inches(0.55), Inches(11.2), Inches(0.5))
        tf = tb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = desc
        p.font.size = Pt(10.5)
        p.font.color.rgb = TEXT_MUTED

    # =========================================================================
    # SLIDE 7: Future Scope and Enhancements
    # =========================================================================
    slide7 = prs.slides.add_slide(blank_layout)
    apply_background(slide7)
    add_header(slide7, "Future Scope and Technical Roadmap", "SCALABILITY & EXPANSION")

    roadmap = [
        ("Phase 1: WebRTC Multiplayer Code Arena", "Integrate Monaco Editor and WebRTC data channels for real-time keystroke synchronization during 1v1 duels.", ACCENT_CYAN),
        ("Phase 2: Sandboxed Remote Code Execution", "Connect Judge0 or AWS Lambda micro-sandboxes to run and evaluate C++, Java, and Python code directly inside CodeQuest.", ACCENT_PURPLE),
        ("Phase 3: AI Resume ATS Matcher", "Upload resumes to automatically cross-reference listed skills against verified platform solves and GitHub commit history.", ACCENT_GREEN),
        ("Phase 4: University Inter-College Tournaments", "Multi-team competitive coding brackets with real-time spectator boards and automated college ranking points.", ACCENT_ORANGE),
        ("Phase 5: Native Mobile Application", "React Native iOS/Android app with daily push notification reminders for maintaining streaks and accepting peer challenges.", ACCENT_CYAN)
    ]

    for i, (title, desc, color) in enumerate(roadmap):
        top_pos = Inches(1.7 + i * 1.05)
        card = create_card(slide7, Inches(0.8), top_pos, Inches(11.7), Inches(0.95), title="", border_color=color)
        tb = slide7.shapes.add_textbox(Inches(1.1), top_pos + Inches(0.12), Inches(11.1), Inches(0.7))
        tf = tb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = title
        p.font.bold = True
        p.font.size = Pt(13)
        p.font.color.rgb = color
        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.size = Pt(10)
        p2.font.color.rgb = TEXT_MUTED

    # =========================================================================
    # SLIDE 8: Comparative Analysis (CodeQuest vs Existing Systems)
    # =========================================================================
    slide8 = prs.slides.add_slide(blank_layout)
    apply_background(slide8)
    add_header(slide8, "Comparative Analysis with Existing Systems", "BENCHMARKING")

    # Table creation
    rows = 9
    cols = 6
    left = Inches(0.8)
    top = Inches(1.7)
    width = Inches(11.7)
    height = Inches(5.1)

    table_shape = slide8.shapes.add_table(rows, cols, left, top, width, height)
    table = table_shape.table

    table.columns[0].width = Inches(3.2)
    table.columns[1].width = Inches(1.7)
    table.columns[2].width = Inches(1.7)
    table.columns[3].width = Inches(1.7)
    table.columns[4].width = Inches(1.7)
    table.columns[5].width = Inches(1.7)

    headers = ["Platform Feature", "CodeQuest", "LeetCode", "Codeforces", "StopStalk", "GitHub"]
    for col_idx, h_text in enumerate(headers):
        cell = table.cell(0, col_idx)
        cell.fill.solid()
        cell.fill.fore_color.rgb = CARD_BG
        p = cell.text_frame.paragraphs[0]
        p.text = h_text
        p.font.bold = True
        p.font.size = Pt(11)
        p.font.color.rgb = ACCENT_CYAN if col_idx == 1 else TEXT_LIGHT
        p.alignment = PP_ALIGN.CENTER if col_idx > 0 else PP_ALIGN.LEFT

    matrix_data = [
        ("Cross-Platform Aggregation", "✓ Yes (5 Hubs)", "✗ No", "✗ No", "Partial", "✗ No"),
        ("365-Day Verified Heatmap", "✓ Yes", "✓ LeetCode Only", "✗ No", "✗ No", "✓ Commits Only"),
        ("AI Company Readiness Score", "✓ Yes (Tier-1)", "✗ No", "✗ No", "✗ No", "✗ No"),
        ("1v1 Algorithmic Speed Duel", "✓ Yes (Live Rooms)", "✗ No", "✗ No", "✗ No", "✗ No"),
        ("Developer DNA Radar Matrix", "✓ Yes (6-Axis)", "✗ No", "✗ No", "✗ No", "✗ No"),
        ("Live GitHub README SVG Card", "✓ Yes", "✗ No", "✗ No", "✗ No", "✗ No"),
        ("1-Click Verified Recruiter Dossier", "✓ Yes (Print PDF)", "✗ No", "✗ No", "✗ No", "✗ No"),
        ("Gamification (Streak Freeze & Titles)", "✓ Yes", "✗ No", "✗ No", "✗ No", "✗ No"),
    ]

    for row_idx, row_vals in enumerate(matrix_data):
        for col_idx, val in enumerate(row_vals):
            cell = table.cell(row_idx + 1, col_idx)
            cell.fill.solid()
            cell.fill.fore_color.rgb = RGBColor(16, 20, 30) if row_idx % 2 == 0 else CARD_BG
            p = cell.text_frame.paragraphs[0]
            p.text = val
            p.font.size = Pt(10)
            if col_idx == 1:
                p.font.bold = True
                p.font.color.rgb = ACCENT_GREEN
            elif "✓" in val:
                p.font.color.rgb = TEXT_LIGHT
            elif "✗" in val:
                p.font.color.rgb = RGBColor(239, 68, 68)
            else:
                p.font.color.rgb = TEXT_MUTED
            p.alignment = PP_ALIGN.CENTER if col_idx > 0 else PP_ALIGN.LEFT

    # =========================================================================
    # SLIDE 9: Conclusion & Live Demonstration
    # =========================================================================
    slide9 = prs.slides.add_slide(blank_layout)
    apply_background(slide9)
    add_header(slide9, "Conclusion & Project Achievements", "PROJECT CONCLUSION")

    create_card(slide9, Inches(0.8), Inches(1.7), Inches(6.5), Inches(5.2), title="Summary of Achievements", title_color=ACCENT_CYAN)
    c_box = slide9.shapes.add_textbox(Inches(1.05), Inches(2.35), Inches(6.0), Inches(4.3))
    tf_c = c_box.text_frame
    tf_c.word_wrap = True
    conclusions = [
        ("Solved Multi-Platform Fragmentation", "Engineers no longer need to share 5 disjoint profile links. CodeQuest synthesizes 600+ solves into one authentic record."),
        ("Full-Stack Architectural Rigor", "Built on modern MERN stack with in-process DNS interceptors, serialized rate-limit queues, and Vite reverse proxies."),
        ("AI-Augmented Developer Guidance", "Pioneered automated interview readiness evaluations for Tier-1 firms combined with daily tailored algorithmic quests."),
        ("Community & Peer Competition", "Integrated real-time 1v1 speed duels and GitHub README vector streaming for viral organic growth.")
    ]
    for i, (h, d) in enumerate(conclusions):
        p = tf_c.paragraphs[0] if i == 0 else tf_c.add_paragraph()
        p.text = f"★ {h}"
        p.font.bold = True
        p.font.size = Pt(11)
        p.font.color.rgb = ACCENT_PURPLE
        p_d = tf_c.add_paragraph()
        p_d.text = d
        p_d.font.size = Pt(10)
        p_d.font.color.rgb = TEXT_MUTED
        p_d.space_after = Pt(8)

    create_card(slide9, Inches(7.6), Inches(1.7), Inches(4.9), Inches(5.2), title="Live Demonstration Endpoints", title_color=ACCENT_GREEN)
    d_box = slide9.shapes.add_textbox(Inches(7.85), Inches(2.35), Inches(4.4), Inches(4.3))
    tf_d = d_box.text_frame
    tf_d.word_wrap = True
    demos = [
        ("Frontend Application", "http://localhost:5173", "Next-Gen React Dashboard, Heatmap, DNA Matrix, & Arena."),
        ("Backend REST API", "http://localhost:5001/api/health", "Express daemon with JWT authentication and MongoDB Atlas."),
        ("Live GitHub README SVG Card", "http://localhost:5001/api/cards/shiva120.svg", "Direct vector badge stream with real-time solve counts."),
        ("Verified Public Dossier", "http://localhost:5173/u/shiva120", "Shareable, print-optimized proof-of-work portfolio.")
    ]
    for i, (label, url, sub) in enumerate(demos):
        p = tf_d.paragraphs[0] if i == 0 else tf_d.add_paragraph()
        p.text = f"● {label}:"
        p.font.bold = True
        p.font.size = Pt(11)
        p.font.color.rgb = ACCENT_CYAN
        p_url = tf_d.add_paragraph()
        p_url.text = url
        p_url.font.size = Pt(9.5)
        p_url.font.bold = True
        p_url.font.color.rgb = ACCENT_GREEN
        p_sub = tf_d.add_paragraph()
        p_sub.text = sub
        p_sub.font.size = Pt(9)
        p_sub.font.color.rgb = TEXT_MUTED
        p_sub.space_after = Pt(6)

    # =========================================================================
    # SLIDE 10: Thank You Slide
    # =========================================================================
    slide10 = prs.slides.add_slide(blank_layout)
    apply_background(slide10)

    ty_box = slide10.shapes.add_textbox(Inches(1.0), Inches(1.8), Inches(11.3), Inches(3.8))
    tf_ty = ty_box.text_frame
    tf_ty.word_wrap = True

    p_ty = tf_ty.paragraphs[0]
    p_ty.text = "THANK YOU!"
    p_ty.font.size = Pt(54)
    p_ty.font.bold = True
    p_ty.font.color.rgb = TEXT_LIGHT
    p_ty.alignment = PP_ALIGN.CENTER
    p_ty.space_after = Pt(12)

    p_qa = tf_ty.add_paragraph()
    p_qa.text = "Open for Questions & Discussion"
    p_qa.font.size = Pt(20)
    p_qa.font.color.rgb = ACCENT_CYAN
    p_qa.alignment = PP_ALIGN.CENTER
    p_qa.space_after = Pt(20)

    p_contact = tf_ty.add_paragraph()
    p_contact.text = "Presented by: Lavkush | Computer Science & Engineering"
    p_contact.font.size = Pt(14)
    p_contact.font.color.rgb = TEXT_MUTED
    p_contact.alignment = PP_ALIGN.CENTER

    p_link = tf_ty.add_paragraph()
    p_link.text = "Explore CodeQuest: http://localhost:5173"
    p_link.font.size = Pt(13)
    p_link.font.color.rgb = ACCENT_PURPLE
    p_link.alignment = PP_ALIGN.CENTER

    # Save
    prs.save(output_path)
    print(f"Presentation successfully saved to: {output_path}")

if __name__ == "__main__":
    out_file = sys.argv[1] if len(sys.argv) > 1 else "CodeQuest_Presentation.pptx"
    create_codequest_presentation(out_file)
