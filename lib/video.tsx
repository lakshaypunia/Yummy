export const manimCode = `"""
╔══════════════════════════════════════════════════════════════════╗
║         THE LIVING CELL — Manim Biology Explainer Video         ║
║                   8 Scenes · ~56 seconds                        ║
╠══════════════════════════════════════════════════════════════════╣
║  SETUP & RENDER INSTRUCTIONS                                    ║
║                                                                  ║
║  1. Install Manim Community Edition:                            ║
║     pip install manim                                            ║
║                                                                  ║
║  2. Render individual scenes (fast preview):                    ║
║     manim -pql cell_structure_manim.py TitleScene               ║
║     manim -pql cell_structure_manim.py OrganelleCards           ║
║                                                                  ║
║  3. Render full video at high quality:                          ║
║     manim -pqh cell_structure_manim.py CellVideoFull            ║
║                                                                  ║
║  4. Flags:  -p = preview  -q = quality (l/m/h/k)               ║
║             -o = output filename                                 ║
║                                                                  ║
║  Output → media/videos/cell_structure_manim/                    ║
╚══════════════════════════════════════════════════════════════════╝
"""

from manim import *
import numpy as np

# ─── GLOBAL DESIGN TOKENS ────────────────────────────────────────────────────
BG          = "#050A14"
CELL_CYAN   = "#00F5D4"
CELL_VIOLET = "#8B5CF6"
CELL_PINK   = "#F472B6"
CELL_GOLD   = "#FBBF24"
CELL_GREEN  = "#34D399"
CELL_RED    = "#F87171"
CELL_BLUE   = "#60A5FA"
CELL_WHITE  = "#F0F4FF"
CELL_DIM    = "#8899BB"
CELL_BG2    = "#0D1526"

config.background_color = BG
config.frame_width  = 14.2
config.frame_height = 8


# ─── HELPERS ─────────────────────────────────────────────────────────────────
def label_tag(text, color=CELL_CYAN):
    """Small monospace tag label."""
    return Text(text, font="Courier New", font_size=14, color=color)


def section_title(main, color=CELL_WHITE, size=52):
    return Text(main, font_size=size, color=color, weight=BOLD)


def body_text(text, color=CELL_WHITE, size=20):
    return Text(text, font_size=size, color=color)


def bullet(text, dot_color=CELL_CYAN, text_color=CELL_WHITE, size=18):
    dot  = Dot(radius=0.07, color=dot_color).set_glow_factor(0.6)
    txt  = Text(text, font_size=size, color=text_color)
    grp  = VGroup(dot, txt).arrange(RIGHT, buff=0.22)
    return grp


def card(width, height, fill=CELL_BG2, stroke=CELL_CYAN, opacity=0.9):
    return RoundedRectangle(
        corner_radius=0.18,
        width=width, height=height,
        fill_color=fill, fill_opacity=0.85,
        stroke_color=stroke, stroke_width=1.5
    )


def glow_circle(radius, color, fill_opacity=0.15):
    outer = Circle(radius=radius + 0.15, color=color,
                   fill_color=color, fill_opacity=0.05, stroke_width=0)
    inner = Circle(radius=radius, color=color,
                   fill_color=color, fill_opacity=fill_opacity,
                   stroke_width=2)
    return VGroup(outer, inner)


# ─── SCENE 1: TITLE ──────────────────────────────────────────────────────────
class TitleScene(Scene):
    def construct(self):
        # ---------- animated cell illustration ----------
        membrane = Ellipse(width=4.2, height=3.8,
                           color=CELL_CYAN, stroke_width=2.5,
                           fill_color="#0D1A2E", fill_opacity=0.9)
        membrane.set_stroke(CELL_CYAN, 2.5)

        nucleus = Circle(radius=0.85, color=CELL_VIOLET,
                         fill_color="#160D35", fill_opacity=0.95,
                         stroke_width=2.2)
        nucleus_inner = Circle(radius=0.38, color=CELL_VIOLET,
                               fill_color=CELL_VIOLET, fill_opacity=0.4,
                               stroke_width=0)
        nucleus.move_to(UP * 0.2)
        nucleus_inner.move_to(UP * 0.2)

        # Mitochondria
        mito = Ellipse(width=1.1, height=0.52, color=CELL_GREEN,
                       fill_color="#0D2A1A", fill_opacity=0.9,
                       stroke_width=1.8)
        mito.move_to(LEFT * 1.4 + DOWN * 0.8)

        # Ribosomes
        ribos = VGroup(*[
            Dot(radius=0.1, color=CELL_GOLD, fill_opacity=0.85).move_to(
                RIGHT * (1.2 + i * 0.0) + UP * (0.8 - i * 0.35)
            ) for i in range(4)
        ])

        # Vacuole
        vacuole = Circle(radius=0.45, color=CELL_BLUE,
                         fill_color="#0A1F2A", fill_opacity=0.85,
                         stroke_width=1.5)
        vacuole.move_to(LEFT * 0.5 + UP * 0.85)

        # ER wavy
        er_path = VMobject(color=CELL_PINK, stroke_width=2)
        er_path.set_points_smoothly([
            RIGHT * 0.4 + DOWN * 0.6,
            RIGHT * 0.9 + DOWN * 0.3,
            RIGHT * 1.3 + DOWN * 0.65,
            RIGHT * 1.7 + DOWN * 0.35,
        ])

        cell_group = VGroup(membrane, mito, er_path, vacuole,
                            nucleus, nucleus_inner, ribos)
        cell_group.move_to(UP * 0.5)

        # ---------- text ----------
        tag   = label_tag("BIOLOGY EXPLAINER", CELL_CYAN)
        title = Text("THE LIVING CELL", font_size=68,
                     color=CELL_WHITE, weight=BOLD)
        line  = Line(LEFT * 3.5, RIGHT * 3.5,
                     color=CELL_CYAN, stroke_width=1.5)
        sub   = label_tag("A Complete Biology Deep Dive", CELL_DIM)
        sub.scale(1.3)

        text_group = VGroup(tag, title, line, sub)
        text_group.arrange(DOWN, buff=0.3)
        text_group.move_to(DOWN * 2.5)

        # ---------- animate ----------
        self.play(FadeIn(cell_group, scale=0.7), run_time=1.2)
        self.play(
            Rotate(membrane, angle=TAU / 60, rate_func=linear),
            FadeIn(tag, shift=UP * 0.3), run_time=0.6
        )
        self.play(Write(title), run_time=1.0)
        self.play(Create(line), run_time=0.5)
        self.play(FadeIn(sub, shift=UP * 0.2), run_time=0.6)

        # Pulse nucleus
        self.play(
            nucleus.animate.scale(1.08),
            nucleus_inner.animate.scale(1.15),
            run_time=0.5
        )
        self.play(
            nucleus.animate.scale(1 / 1.08),
            nucleus_inner.animate.scale(1 / 1.15),
            run_time=0.5
        )
        self.wait(1.5)
        self.play(FadeOut(VGroup(cell_group, text_group)), run_time=0.7)


# ─── SCENE 2: WHAT IS A CELL ─────────────────────────────────────────────────
class WhatIsCell(Scene):
    def construct(self):
        # Tag + title
        tag   = label_tag("01 / FUNDAMENTALS", CELL_CYAN)
        title = section_title("What Is a Cell?")
        header = VGroup(tag, title).arrange(DOWN, aligned_edge=LEFT, buff=0.18)
        header.to_corner(UL, buff=0.5)

        self.play(FadeIn(tag, shift=UP * 0.2), run_time=0.4)
        self.play(Write(title), run_time=0.7)

        # Bullets
        facts = [
            ("The cell is the basic unit of life.",      CELL_CYAN),
            ("Every organism is made of one or more cells.", CELL_WHITE),
            ("Humans have ~37 trillion cells.",          CELL_GOLD),
            ("Cells carry out all functions of life.",   CELL_GREEN),
        ]
        bullets = VGroup(*[
            bullet(t, dot_color=c, text_color=c if c != CELL_WHITE else CELL_WHITE)
            for t, c in facts
        ]).arrange(DOWN, aligned_edge=LEFT, buff=0.35)
        bullets.next_to(header, DOWN, buff=0.5).align_to(header, LEFT)

        for b in bullets:
            self.play(FadeIn(b, shift=RIGHT * 0.3), run_time=0.4)

        # Right: cell diagram
        membrane = Ellipse(width=4.5, height=4.0,
                           color=CELL_CYAN, stroke_width=2.5,
                           fill_color="#0D1A2E", fill_opacity=0.9)
        nucleus  = Circle(radius=0.9, color=CELL_VIOLET,
                          fill_color="#160D35", fill_opacity=0.95,
                          stroke_width=2)
        nuc_core = Circle(radius=0.35, color=CELL_VIOLET,
                          fill_color=CELL_VIOLET, fill_opacity=0.5,
                          stroke_width=0)

        mito = Ellipse(width=1.1, height=0.5, color=CELL_GREEN,
                       fill_color="#0D2A1A", fill_opacity=0.9, stroke_width=1.8)
        mito.move_to(LEFT * 1.2 + DOWN * 0.9)
        ribs = VGroup(*[
            Dot(radius=0.1, color=CELL_GOLD).move_to(RIGHT * 1.3 + UP * (0.6 - i * 0.32))
            for i in range(4)
        ])
        vacu = Circle(radius=0.42, color=CELL_BLUE,
                      fill_color="#0A1F2A", fill_opacity=0.85, stroke_width=1.5)
        vacu.move_to(LEFT * 0.4 + UP * 0.9)

        diagram = VGroup(membrane, mito, ribs, vacu, nucleus, nuc_core)
        diagram.scale(0.82).to_edge(RIGHT, buff=0.6).shift(DOWN * 0.2)

        # Arrow labels
        def arrow_label(text, color, start, end):
            arr = Arrow(start, end, color=color, buff=0.08,
                        stroke_width=1.5, tip_length=0.15,
                        max_tip_length_to_length_ratio=0.35)
            lbl = Text(text, font_size=14, color=color)
            lbl.next_to(arr.get_start(), direction=normalize(start - end) * 0.5)
            return VGroup(arr, lbl)

        center = diagram.get_center()
        nuc_pos  = center + UP * 0.16
        mito_pos = center + LEFT * 1.2 + DOWN * 0.9
        mem_pos  = center + RIGHT * 2.2 + DOWN * 1.5

        lbl_nuc  = arrow_label("Nucleus",    CELL_VIOLET, nuc_pos  + UP*1.2+RIGHT*1.5, nuc_pos  + UP*0.8)
        lbl_mito = arrow_label("Mitochondria", CELL_GREEN, mito_pos + LEFT*1.3+DOWN*0.5, mito_pos + LEFT*0.5)
        lbl_mem  = arrow_label("Membrane",   CELL_CYAN,   mem_pos  + DOWN*0.7,          mem_pos  + UP*0.1)

        self.play(FadeIn(diagram, scale=0.8), run_time=0.8)
        self.play(
            FadeIn(lbl_nuc),
            FadeIn(lbl_mito),
            FadeIn(lbl_mem),
            run_time=0.7
        )
        self.wait(2)
        self.play(FadeOut(VGroup(header, bullets, diagram, lbl_nuc, lbl_mito, lbl_mem)))


# ─── SCENE 3: ORGANELLE CARDS ─────────────────────────────────────────────────
class OrganelleCards(Scene):
    def construct(self):
        tag   = label_tag("02 / ORGANELLES", CELL_CYAN)
        title = section_title("Cell Organelles", size=46)
        header = VGroup(tag, title).arrange(DOWN, aligned_edge=LEFT, buff=0.15)
        header.to_corner(UL, buff=0.45)
        self.play(FadeIn(tag), Write(title), run_time=0.7)

        organelles = [
            ("🧬", "Nucleus",              CELL_VIOLET, "Information Storage",   "Control center; contains DNA"),
            ("⚡", "Mitochondria",         CELL_GREEN,  "Energy Production",     "Converts glucose → ATP"),
            ("🔵", "Ribosome",             CELL_GOLD,   "Protein Synthesis",     "Translates mRNA → proteins"),
            ("🌀", "Endoplasmic Reticulum",CELL_PINK,   "Processing & Transport","Rough: proteins; Smooth: lipids"),
            ("📦", "Golgi Apparatus",      CELL_BLUE,   "Packaging & Shipping",  "Sorts & ships proteins"),
            ("♻️", "Lysosome",             CELL_RED,    "Digestion & Recycling", "Breaks down waste & pathogens"),
        ]

        cards = VGroup()
        for emoji, name, color, role, desc in organelles:
            bg  = card(4.2, 1.65, fill=CELL_BG2, stroke=color)
            top = Line(bg.get_corner(UL), bg.get_corner(UR),
                       color=color, stroke_width=3)
            ico = Text(emoji, font_size=28).move_to(bg.get_left() + RIGHT * 0.55)
            nam = Text(name, font_size=17, color=color, weight=BOLD)
            rol = Text(role.upper(), font="Courier New", font_size=10, color=CELL_DIM)
            dsc = Text(desc, font_size=13, color=CELL_WHITE)
            text_col = VGroup(nam, rol, dsc).arrange(DOWN, aligned_edge=LEFT, buff=0.07)
            text_col.next_to(ico, RIGHT, buff=0.22)
            grp = VGroup(bg, top, ico, text_col)
            cards.add(grp)

        cards.arrange_in_grid(rows=3, cols=2, buff=0.22)
        cards.next_to(header, DOWN, buff=0.35).scale(0.97)

        for i, c in enumerate(cards):
            self.play(FadeIn(c, shift=UP * 0.25), run_time=0.3)

        self.wait(2.2)
        self.play(FadeOut(VGroup(header, cards)))


# ─── SCENE 4: MITOCHONDRIA DEEP DIVE ─────────────────────────────────────────
class MitochondriaDeepDive(Scene):
    def construct(self):
        tag   = label_tag("03 / DEEP DIVE", CELL_GREEN)
        title = section_title("Mitochondria", color=CELL_WHITE, size=50)
        sub   = Text('"The Powerhouse of the Cell"',
                     font_size=20, color=CELL_GREEN, slant=ITALIC)
        header = VGroup(tag, title, sub).arrange(DOWN, aligned_edge=LEFT, buff=0.15)
        header.to_corner(UL, buff=0.5)
        self.play(FadeIn(tag), Write(title), FadeIn(sub), run_time=0.8)

        # ── Mitochondria illustration ──
        outer = Ellipse(width=4.0, height=2.6, color=CELL_GREEN,
                        fill_color="#0D2A1A", fill_opacity=0.95, stroke_width=2.5)
        inner_mem = Ellipse(width=3.3, height=2.0, color=CELL_GREEN,
                            fill_color="#0A1F12", fill_opacity=0.8,
                            stroke_width=1.5, stroke_opacity=0.6)

        # Cristae (wavy inner folds)
        cristae = VGroup()
        for i in range(5):
            x_start = -1.4 + i * 0.65
            crista = VMobject(color=CELL_GREEN, stroke_width=2, stroke_opacity=0.55)
            crista.set_points_smoothly([
                np.array([x_start, -0.7, 0]),
                np.array([x_start + 0.15,  0.1, 0]),
                np.array([x_start - 0.05,  0.7, 0]),
            ])
            cristae.add(crista)

        mito_label = Text("MATRIX", font="Courier New",
                          font_size=16, color=CELL_GREEN)

        # ATP dots rotating
        atp_dots = VGroup(*[
            Dot(radius=0.12, color=CELL_GOLD, fill_opacity=0.85).move_to(
                np.array([1.6 * np.cos(i * TAU / 8), 0.9 * np.sin(i * TAU / 8), 0])
            ) for i in range(8)
        ])

        mito_group = VGroup(outer, inner_mem, cristae, mito_label, atp_dots)
        mito_group.scale(0.88).to_edge(RIGHT, buff=0.4).shift(DOWN * 0.4)

        self.play(FadeIn(outer, scale=0.7), run_time=0.6)
        self.play(FadeIn(inner_mem), Create(cristae), run_time=0.5)
        self.play(FadeIn(mito_label), FadeIn(atp_dots), run_time=0.4)
        self.play(Rotate(atp_dots, angle=TAU / 8, rate_func=smooth), run_time=1.0)

        # ── Respiration steps ──
        steps = [
            ("1", "Glycolysis",          "Cytoplasm  →  2 ATP",          CELL_GOLD),
            ("2", "Krebs Cycle",         "Matrix     →  NADH + FADH₂",  CELL_GREEN),
            ("3", "Electron Transport",  "Inner Mem  →  32–34 ATP",      CELL_CYAN),
        ]
        step_group = VGroup()
        for num, name, detail, color in steps:
            circle = Circle(radius=0.28, color=color,
                            fill_color=color, fill_opacity=0.2, stroke_width=2)
            num_t  = Text(num, font_size=18, color=color, weight=BOLD)
            num_t.move_to(circle)
            name_t   = Text(name,   font_size=18, color=color, weight=BOLD)
            detail_t = Text(detail, font_size=14, color=CELL_DIM,
                            font="Courier New")
            text_c = VGroup(name_t, detail_t).arrange(DOWN, aligned_edge=LEFT, buff=0.05)
            row = VGroup(VGroup(circle, num_t), text_c).arrange(RIGHT, buff=0.25)
            step_group.add(row)

        step_group.arrange(DOWN, aligned_edge=LEFT, buff=0.32)
        step_group.next_to(header, DOWN, buff=0.45)

        for s in step_group:
            self.play(FadeIn(s, shift=RIGHT * 0.3), run_time=0.45)

        # Fun fact box
        fact_box = card(5.4, 0.95, fill=CELL_BG2, stroke=CELL_GREEN)
        fact_txt = Text(
            "💡 Mitochondria have their own DNA — evidence\n"
            "   of the Endosymbiotic Theory.",
            font_size=15, color=CELL_WHITE, line_spacing=1.4
        )
        fact_group = VGroup(fact_box, fact_txt)
        fact_txt.move_to(fact_box)
        fact_group.next_to(step_group, DOWN, buff=0.35)

        self.play(FadeIn(fact_group, shift=UP * 0.2), run_time=0.6)
        self.wait(2)
        self.play(FadeOut(VGroup(header, step_group, mito_group, fact_group)))


# ─── SCENE 5: NUCLEUS & DNA ───────────────────────────────────────────────────
class NucleusScene(Scene):
    def construct(self):
        tag   = label_tag("04 / NUCLEUS", CELL_VIOLET)
        title = section_title("The Control Center", size=46)
        header = VGroup(tag, title).arrange(DOWN, aligned_edge=LEFT, buff=0.15)
        header.to_corner(UL, buff=0.5)
        self.play(FadeIn(tag), Write(title), run_time=0.7)

        # ── DNA Double Helix ──
        helix = VGroup()
        n_rungs = 18
        amp = 0.7
        half_height = 3.2

        for i in range(n_rungs):
            t      = i / (n_rungs - 1)
            y      = -half_height / 2 + t * half_height
            angle  = t * 2.5 * TAU
            x1     =  amp * np.cos(angle)
            x2     = -amp * np.cos(angle)
            rung_color = CELL_PINK if i % 2 == 0 else CELL_CYAN
            rung = Line(np.array([x1, y, 0]), np.array([x2, y, 0]),
                        color=rung_color, stroke_width=2.2, stroke_opacity=0.8)
            helix.add(rung)

        # Backbone A (violet)
        spine_a_pts = [
            np.array([amp * np.cos(t * 2.5 * TAU),
                      -half_height / 2 + t * half_height, 0])
            for t in np.linspace(0, 1, 80)
        ]
        spine_a = VMobject(color=CELL_VIOLET, stroke_width=3)
        spine_a.set_points_smoothly(spine_a_pts)

        # Backbone B (cyan)
        spine_b_pts = [
            np.array([-amp * np.cos(t * 2.5 * TAU),
                      -half_height / 2 + t * half_height, 0])
            for t in np.linspace(0, 1, 80)
        ]
        spine_b = VMobject(color=CELL_CYAN, stroke_width=3)
        spine_b.set_points_smoothly(spine_b_pts)

        dna = VGroup(spine_a, spine_b, helix)
        dna.scale(0.75).to_edge(LEFT, buff=0.7).shift(DOWN * 0.3)

        dna_label = Text("DNA Double Helix",
                         font="Courier New", font_size=14, color=CELL_DIM)
        dna_label.next_to(dna, DOWN, buff=0.2)

        self.play(Create(spine_a), Create(spine_b), run_time=1.0)
        self.play(Create(helix),   run_time=0.6)
        self.play(FadeIn(dna_label), run_time=0.3)
        self.play(Rotate(dna, angle=PI / 8, axis=UP), run_time=1.0)

        # ── Fact cards ──
        facts = [
            ("Size",        "6 µm diameter",          CELL_VIOLET),
            ("DNA Length",  "~2 m when uncoiled",      CELL_CYAN),
            ("Genes",       "~20,000–25,000 genes",    CELL_PINK),
            ("Chromosomes", "46 (23 pairs) in humans", CELL_GOLD),
        ]
        fact_cards = VGroup()
        for label, value, color in facts:
            bg    = card(3.8, 0.88, fill=CELL_BG2, stroke=color)
            lbl_t = Text(label.upper(), font="Courier New",
                         font_size=11, color=CELL_DIM)
            val_t = Text(value, font_size=17, color=color, weight=BOLD)
            col   = VGroup(lbl_t, val_t).arrange(DOWN, aligned_edge=LEFT, buff=0.06)
            col.move_to(bg).shift(LEFT * 0.15)
            fact_cards.add(VGroup(bg, col))

        fact_cards.arrange_in_grid(rows=2, cols=2, buff=0.2)
        fact_cards.to_edge(RIGHT, buff=0.4).shift(UP * 0.5)

        for fc in fact_cards:
            self.play(FadeIn(fc, shift=UP * 0.2), run_time=0.35)

        # DNA → mRNA → Protein flow
        flow_items = [
            ("DNA",     CELL_VIOLET),
            ("→ mRNA",  CELL_CYAN),
            ("→ Protein", CELL_GREEN),
        ]
        flow_label = Text("Gene Expression:",
                          font_size=17, color=CELL_WHITE, weight=BOLD)
        flow_row   = VGroup(*[
            Text(t, font_size=18, color=c, weight=BOLD)
            for t, c in flow_items
        ]).arrange(RIGHT, buff=0.3)
        flow_group = VGroup(flow_label, flow_row).arrange(DOWN, aligned_edge=LEFT, buff=0.12)
        flow_group.next_to(fact_cards, DOWN, buff=0.35).align_to(fact_cards, LEFT)

        self.play(FadeIn(flow_group, shift=UP * 0.2), run_time=0.6)
        self.wait(2)
        self.play(FadeOut(VGroup(header, dna, dna_label, fact_cards, flow_group)))


# ─── SCENE 6: CELL TYPES ──────────────────────────────────────────────────────
class CellTypes(Scene):
    def construct(self):
        tag   = label_tag("05 / CELL TYPES", CELL_CYAN)
        title = section_title("Prokaryote vs Eukaryote", size=44)
        header = VGroup(tag, title).arrange(DOWN, aligned_edge=LEFT, buff=0.15)
        header.to_corner(UL, buff=0.5)
        self.play(FadeIn(tag), Write(title), run_time=0.7)

        # Two comparison cards
        comparison = [
            {
                "name": "Prokaryotic Cell",
                "examples": "Bacteria, Archaea",
                "color": CELL_GOLD,
                "features": [
                    "No true nucleus (nucleoid)",
                    "No membrane-bound organelles",
                    "Smaller: 1–10 µm",
                    "Circular DNA",
                    "E.g. E. coli",
                ],
            },
            {
                "name": "Eukaryotic Cell",
                "examples": "Animals, Plants, Fungi",
                "color": CELL_CYAN,
                "features": [
                    "True nucleus with envelope",
                    "Membrane-bound organelles",
                    "Larger: 10–100 µm",
                    "Linear chromosomes",
                    "E.g. Human cell",
                ],
            },
        ]
        comp_cards = VGroup()
        for info in comparison:
            bg      = card(5.5, 3.5, fill=CELL_BG2, stroke=info["color"])
            top_bar = Line(bg.get_corner(UL) + RIGHT * 0.01,
                           bg.get_corner(UR) + LEFT * 0.01,
                           color=info["color"], stroke_width=4)
            name_t  = Text(info["name"], font_size=20,
                           color=info["color"], weight=BOLD)
            ex_t    = Text(info["examples"], font="Courier New",
                           font_size=13, color=CELL_DIM)
            feat_list = VGroup(*[
                bullet(f, dot_color=info["color"],
                       text_color=CELL_WHITE, size=14)
                for f in info["features"]
            ]).arrange(DOWN, aligned_edge=LEFT, buff=0.16)
            content = VGroup(name_t, ex_t, feat_list).arrange(DOWN, aligned_edge=LEFT, buff=0.18)
            content.move_to(bg).shift(DOWN * 0.1)
            comp_cards.add(VGroup(bg, top_bar, content))

        comp_cards.arrange(RIGHT, buff=0.45)
        comp_cards.next_to(header, DOWN, buff=0.4)

        self.play(FadeIn(comp_cards[0], shift=RIGHT * 0.3), run_time=0.5)
        self.play(FadeIn(comp_cards[1], shift=LEFT  * 0.3), run_time=0.5)

        # Plant vs Animal mini-table
        rows = [
            ("Feature",      "🌿 Plant Cell", "🐾 Animal Cell"),
            ("Cell Wall",    "✓ Cellulose",   "✗"),
            ("Chloroplasts", "✓",             "✗"),
            ("Vacuole",      "Large central", "Small/absent"),
            ("Centrioles",   "✗",             "✓"),
        ]
        table_title = Text("Plant vs Animal Cell", font_size=18,
                           color=CELL_WHITE, weight=BOLD)
        table_title.to_edge(DOWN, buff=1.2)

        col_colors = [CELL_DIM, CELL_GREEN, CELL_BLUE]
        table_rows = VGroup()
        for r_i, row in enumerate(rows):
            row_group = VGroup()
            for c_i, cell_val in enumerate(row):
                cell_bg = Rectangle(width=3.4, height=0.44,
                                    fill_color="#0D1526" if r_i > 0 else "#111D35",
                                    fill_opacity=0.9,
                                    stroke_color="#ffffff18", stroke_width=0.5)
                cell_txt = Text(cell_val, font_size=13,
                                color=col_colors[c_i] if r_i == 0 else CELL_WHITE)
                if c_i > 0 and r_i > 0:
                    cell_txt.set_color(CELL_GREEN if "✓" in cell_val else (CELL_RED if "✗" in cell_val else CELL_WHITE))
                cell_txt.move_to(cell_bg)
                row_group.add(VGroup(cell_bg, cell_txt))
            row_group.arrange(RIGHT, buff=0)
            table_rows.add(row_group)

        table_rows.arrange(DOWN, buff=0)
        table_rows.next_to(table_title, DOWN, buff=0.15)
        table_group = VGroup(table_title, table_rows)
        table_group.to_edge(DOWN, buff=0.25)

        self.play(FadeIn(table_title, shift=UP * 0.2), run_time=0.4)
        self.play(FadeIn(table_rows, shift=UP * 0.2), run_time=0.5)
        self.wait(2)
        self.play(FadeOut(VGroup(header, comp_cards, table_group)))


# ─── SCENE 7: CELL DIVISION ───────────────────────────────────────────────────
class CellDivision(Scene):
    def construct(self):
        tag   = label_tag("06 / DIVISION", CELL_GREEN)
        title = section_title("Cell Division", size=48)
        header = VGroup(tag, title).arrange(DOWN, aligned_edge=LEFT, buff=0.15)
        header.to_corner(UL, buff=0.5)
        self.play(FadeIn(tag), Write(title), run_time=0.7)

        # ── Cell cycle wheel ──
        phases = [
            ("G1",  CELL_CYAN,   "Cell grows"),
            ("S",   CELL_GOLD,   "DNA replicates"),
            ("G2",  CELL_PINK,   "Final prep"),
            ("M",   CELL_GREEN,  "Cell divides"),
        ]
        wheel_center = LEFT * 3.2 + DOWN * 0.5
        outer_r, inner_r = 2.0, 1.1
        arcs = VGroup()
        arc_labels = VGroup()

        for i, (phase, color, desc) in enumerate(phases):
            start_a = i * TAU / 4 - TAU / 8
            end_a   = start_a + TAU / 4

            # Sector
            sector = AnnularSector(
                inner_radius=inner_r,
                outer_radius=outer_r,
                angle=TAU / 4 - 0.08,
                start_angle=start_a,
                color=color,
                fill_color=color,
                fill_opacity=0.22,
                stroke_width=2,
            )
            sector.move_to(wheel_center)
            arcs.add(sector)

            mid_a = start_a + TAU / 8
            mid_r = (outer_r + inner_r) / 2
            lx = wheel_center[0] + mid_r * np.cos(mid_a)
            ly = wheel_center[1] + mid_r * np.sin(mid_a)
            lbl = Text(phase, font_size=18, color=color, weight=BOLD)
            lbl.move_to(np.array([lx, ly, 0]))
            arc_labels.add(lbl)

        # Center circle
        center_circle = Circle(radius=inner_r, color=WHITE,
                               fill_color=CELL_BG2, fill_opacity=0.95,
                               stroke_width=1.5, stroke_opacity=0.3)
        center_circle.move_to(wheel_center)
        center_text = VGroup(
            Text("CELL", font_size=18, color=CELL_WHITE, weight=BOLD),
            Text("CYCLE", font="Courier New", font_size=13, color=CELL_DIM),
        ).arrange(DOWN, buff=0.08).move_to(wheel_center)

        wheel = VGroup(arcs, center_circle, center_text, arc_labels)

        # Rotation indicator arc
        arrow_arc = Arc(radius=outer_r + 0.3, angle=TAU * 0.6,
                        start_angle=PI / 2, color=WHITE,
                        stroke_opacity=0.25, stroke_width=1.5)
        arrow_arc.move_to(wheel_center)
        arrow_tip = ArrowTip(color=WHITE, fill_opacity=0.25)
        arrow_tip.scale(0.5)
        tip_pt = arrow_arc.get_end()
        arrow_tip.move_to(tip_pt)

        self.play(FadeIn(center_circle), Write(center_text), run_time=0.5)
        for s in arcs:
            self.play(FadeIn(s), run_time=0.22)
        self.play(*[FadeIn(l) for l in arc_labels], run_time=0.3)
        self.play(FadeIn(arrow_arc), FadeIn(arrow_tip), run_time=0.3)
        self.play(Rotate(wheel, angle=PI / 4, about_point=wheel_center,
                         rate_func=smooth), run_time=1.0)

        # ── Right: phase descriptions ──
        phase_details = [
            ("G1 Phase",  "Cell grows, copies organelles",    CELL_CYAN),
            ("S Phase",   "DNA replication — doubles genome", CELL_GOLD),
            ("G2 Phase",  "Growth + final preparations",      CELL_PINK),
            ("M Phase",   "Mitosis: nucleus + cell divides",  CELL_GREEN),
        ]
        detail_group = VGroup()
        for ph, desc, color in phase_details:
            num_dot = Circle(radius=0.25, color=color,
                             fill_color=color, fill_opacity=0.18, stroke_width=2)
            dot_fill = Dot(radius=0.12, color=color).move_to(num_dot)
            ph_t  = Text(ph,   font_size=18, color=color, weight=BOLD)
            dsc_t = Text(desc, font_size=14, color=CELL_DIM)
            texts = VGroup(ph_t, dsc_t).arrange(DOWN, aligned_edge=LEFT, buff=0.05)
            row   = VGroup(VGroup(num_dot, dot_fill), texts).arrange(RIGHT, buff=0.25)
            detail_group.add(row)

        detail_group.arrange(DOWN, aligned_edge=LEFT, buff=0.32)
        detail_group.to_edge(RIGHT, buff=0.5).shift(UP * 0.3)

        for row in detail_group:
            self.play(FadeIn(row, shift=RIGHT * 0.25), run_time=0.38)

        # Fun fact box
        fact_bg  = card(5.0, 0.98, fill=CELL_BG2, stroke=CELL_GREEN)
        fact_txt = Text(
            "💡 Mitosis = body cells (2n→2n)\n   Meiosis = sex cells (2n→n)",
            font_size=15, color=CELL_WHITE, line_spacing=1.4
        )
        fact_group = VGroup(fact_bg, fact_txt)
        fact_txt.move_to(fact_bg)
        fact_group.next_to(detail_group, DOWN, buff=0.35)

        self.play(FadeIn(fact_group, shift=UP * 0.2), run_time=0.5)
        self.wait(2)
        self.play(FadeOut(VGroup(header, wheel, arrow_arc, arrow_tip,
                                 detail_group, fact_group)))


# ─── SCENE 8: OUTRO ───────────────────────────────────────────────────────────
class OutroScene(Scene):
    def construct(self):
        tag = label_tag("SUMMARY", CELL_CYAN)
        title = Text("You Now Know\nthe Living Cell",
                     font_size=58, color=CELL_WHITE, weight=BOLD,
                     line_spacing=1.1)
        title.set_color_by_gradient(CELL_CYAN, CELL_VIOLET)

        divider = Line(LEFT * 4, RIGHT * 4, color=CELL_CYAN, stroke_width=1.5)

        topics = [
            "What Is a Cell",
            "Organelles & Functions",
            "Mitochondria & ATP",
            "Nucleus & DNA",
            "Prokaryote vs Eukaryote",
            "Cell Division",
        ]
        topic_cards = VGroup()
        for t in topics:
            bg  = card(3.8, 0.62, fill=CELL_BG2, stroke=CELL_CYAN)
            txt = VGroup(
                Text("✓", font_size=16, color=CELL_GREEN),
                Text(t,   font_size=15, color=CELL_WHITE),
            ).arrange(RIGHT, buff=0.18)
            txt.move_to(bg)
            topic_cards.add(VGroup(bg, txt))

        topic_cards.arrange_in_grid(rows=2, cols=3, buff=0.22)

        footer = label_tag("Biology  ·  Cell Structure  ·  Manim Explainer", CELL_DIM)
        footer.scale(1.1)

        all_content = VGroup(tag, title, divider, topic_cards, footer)
        all_content.arrange(DOWN, buff=0.35)
        all_content.center()

        self.play(FadeIn(tag, shift=DOWN * 0.2), run_time=0.4)
        self.play(Write(title), run_time=1.0)
        self.play(Create(divider), run_time=0.5)
        for tc in topic_cards:
            self.play(FadeIn(tc, shift=UP * 0.2), run_time=0.28)
        self.play(FadeIn(footer), run_time=0.4)

        # Final pulse
        self.play(title.animate.scale(1.05), run_time=0.4)
        self.play(title.animate.scale(1 / 1.05), run_time=0.4)
        self.wait(1.5)


# ─── COMBINED FULL VIDEO ─────────────────────────────────────────────────────
class CellVideoFull(Scene):
    """
    Renders all 8 scenes in sequence as one continuous video.
    Run:  manim -pqh cell_structure_manim.py CellVideoFull
    """
    def construct(self):
        scenes = [
            TitleScene,
            WhatIsCell,
            OrganelleCards,
            MitochondriaDeepDive,
            NucleusScene,
            CellTypes,
            CellDivision,
            OutroScene,
        ]
        for SceneClass in scenes:
            s = SceneClass()
            s.renderer = self.renderer
            s.camera   = self.camera
            s.construct()
            self.wait(0.2)`
export const manimCode2 = `from manim import *

# ─────────────────────────────────────────────
#  Helpers
# ─────────────────────────────────────────────
def make_node(value, color=BLUE_D, radius=0.38):
    circle = Circle(radius=radius, color=color, fill_opacity=1,
                    stroke_color=WHITE, stroke_width=2)
    label = Text(str(value), font_size=22, color=WHITE, weight=BOLD)
    label.move_to(circle.get_center())
    return VGroup(circle, label)


def make_bf_label(bf, pos):
    color = GREEN if bf == 0 else (YELLOW if abs(bf) == 1 else RED)
    box = RoundedRectangle(corner_radius=0.1, width=0.6, height=0.32,
                           fill_color=color, fill_opacity=0.9,
                           stroke_color=WHITE, stroke_width=1.5)
    txt = Text("bf=" + str(bf), font_size=14, color=WHITE, weight=BOLD)
    txt.move_to(box)
    grp = VGroup(box, txt)
    grp.move_to(pos)
    return grp


def tree_edge(n1, n2):
    return Line(n1[0].get_center(), n2[0].get_center(),
                color="#888888", stroke_width=2.5, buff=0.38)


def two_line_text(line1, line2, font_size=20, color=WHITE):
    t1 = Text(line1, font_size=font_size, color=color)
    t2 = Text(line2, font_size=font_size, color=color)
    grp = VGroup(t1, t2).arrange(DOWN, buff=0.12, aligned_edge=LEFT)
    return grp


# ─────────────────────────────────────────────
#  Main Scene
# ─────────────────────────────────────────────
class AVLTreeExplainer(Scene):
    def construct(self):
        self.camera.background_color = "#0f0f1a"
        self._intro()
        self._what_is_avl()
        self._balance_factor()
        self._right_rotation()
        self._left_rotation()
        self._left_right_rotation()
        self._right_left_rotation()
        self._outro()

    # ─────────────── utility ──────────────────
    def _section_heading(self, text):
        h = Text(text, font_size=28, color=BLUE_A, weight=BOLD)
        h.to_edge(UP).shift(DOWN * 0.15)
        underline = Line(h.get_left(), h.get_right(),
                         color=BLUE_D, stroke_width=2)
        underline.next_to(h, DOWN, buff=0.06)
        return VGroup(h, underline)

    def _rot_arrow(self, start, end, label_line1, label_line2, color=YELLOW):
        arr = Arrow(start, end, color=color, buff=0.1, stroke_width=4)
        lbl = two_line_text(label_line1, label_line2, font_size=17, color=color)
        lbl.next_to(arr, UP, buff=0.12)
        return arr, lbl

    # ─────────────── 1. INTRO ─────────────────
    def _intro(self):
        title = Text("AVL Trees", font_size=72, color=BLUE_B, weight=BOLD)
        sub = Text("Self-Balancing Binary Search Trees",
                   font_size=28, color="#cccccc")
        sub.next_to(title, DOWN, buff=0.4)
        tagline = Text("A visual walkthrough of insertions and rotations",
                       font_size=20, color=YELLOW_B)
        tagline.next_to(sub, DOWN, buff=0.3)

        self.play(Write(title), run_time=1.2)
        self.play(FadeIn(sub, shift=UP * 0.3), run_time=0.8)
        self.play(FadeIn(tagline, shift=UP * 0.2), run_time=0.6)
        self.wait(1.8)
        self.play(FadeOut(VGroup(title, sub, tagline)))

    # ─────────────── 2. WHAT IS AVL ──────────
    def _what_is_avl(self):
        heading = self._section_heading("Why AVL Trees?")
        self.play(Write(heading))
        self.wait(0.4)

        bad_title = Text("Regular BST  (worst-case skewed)",
                         font_size=21, color=RED_B)
        bad_title.to_corner(UL).shift(DOWN * 1.2 + RIGHT * 0.3)
        self.play(FadeIn(bad_title))

        positions_bad = [LEFT * 4 + UP * 1.5 + DOWN * i * 1.05 + RIGHT * i * 0.85
                         for i in range(5)]
        nodes_bad = [make_node(v, color=RED_D) for v in [10, 20, 30, 40, 50]]
        for n, p in zip(nodes_bad, positions_bad):
            n.move_to(p)

        self.play(*[GrowFromCenter(n) for n in nodes_bad], run_time=1.0)
        edges_bad = [tree_edge(nodes_bad[i], nodes_bad[i + 1]) for i in range(4)]
        self.play(*[Create(e) for e in edges_bad], run_time=0.6)

        bad_label = Text("O(n) search  like a linked list!",
                         font_size=18, color=RED_A)
        bad_label.next_to(nodes_bad[-1], DOWN, buff=0.25)
        self.play(Write(bad_label))
        self.wait(0.8)

        good_title = Text("AVL Tree  (always balanced)",
                          font_size=21, color=GREEN_B)
        good_title.move_to(RIGHT * 2 + UP * 2.2)
        self.play(FadeIn(good_title))

        n_root = make_node(30, GREEN_D); n_root.move_to(RIGHT * 2 + UP * 1.0)
        n_l = make_node(20, GREEN_D);   n_l.move_to(RIGHT * 0.7 + DOWN * 0.1)
        n_r = make_node(40, GREEN_D);   n_r.move_to(RIGHT * 3.3 + DOWN * 0.1)
        n_ll = make_node(10, GREEN_D);  n_ll.move_to(RIGHT * 0.1 + DOWN * 1.2)
        n_rr = make_node(50, GREEN_D);  n_rr.move_to(RIGHT * 3.9 + DOWN * 1.2)

        good_nodes = [n_root, n_l, n_r, n_ll, n_rr]
        self.play(*[GrowFromCenter(n) for n in good_nodes], run_time=1.0)
        good_edges = [tree_edge(n_root, n_l), tree_edge(n_root, n_r),
                      tree_edge(n_l, n_ll), tree_edge(n_r, n_rr)]
        self.play(*[Create(e) for e in good_edges], run_time=0.6)

        good_label = Text("O(log n) search  always!",
                          font_size=18, color=GREEN_A)
        good_label.next_to(n_ll, DOWN, buff=0.25)
        self.play(Write(good_label))
        self.wait(1.8)

        all_objs = VGroup(heading, bad_title, bad_label, good_title, good_label,
                          *nodes_bad, *edges_bad, *good_nodes, *good_edges)
        self.play(FadeOut(all_objs))

    # ─────────────── 3. BALANCE FACTOR ───────
    def _balance_factor(self):
        heading = self._section_heading("The Balance Factor")
        self.play(Write(heading))

        formula_line1 = Text("bf(node)  =  height(left subtree)", font_size=26, color=YELLOW_B)
        formula_line2 = Text("           -  height(right subtree)", font_size=26, color=YELLOW_B)
        formula = VGroup(formula_line1, formula_line2).arrange(DOWN, buff=0.15, aligned_edge=LEFT)
        formula.shift(UP * 1.9)
        self.play(Write(formula), run_time=1.0)

        rule = Text("AVL Rule:  bf must be  -1, 0,  or  1  for EVERY node",
                    font_size=22, color=YELLOW_A)
        rule.next_to(formula, DOWN, buff=0.35)
        self.play(FadeIn(rule, shift=UP * 0.2))
        self.wait(0.5)

        n30 = make_node(30); n30.move_to(UP * 0.0 + LEFT * 0.0)
        n15 = make_node(15); n15.move_to(DOWN * 1.1 + LEFT * 1.5)
        n50 = make_node(50); n50.move_to(DOWN * 1.1 + RIGHT * 1.5)
        n10 = make_node(10); n10.move_to(DOWN * 2.2 + LEFT * 2.3)
        n20 = make_node(20); n20.move_to(DOWN * 2.2 + LEFT * 0.7)

        tree_nodes = [n30, n15, n50, n10, n20]
        tree_edges = [tree_edge(n30, n15), tree_edge(n30, n50),
                      tree_edge(n15, n10), tree_edge(n15, n20)]

        self.play(*[GrowFromCenter(n) for n in tree_nodes],
                  *[Create(e) for e in tree_edges], run_time=1.2)

        bf_labels = [
            make_bf_label(2, n30.get_center() + UP * 0.62 + RIGHT * 0.5),
            make_bf_label(0, n15.get_center() + UP * 0.62 + RIGHT * 0.5),
            make_bf_label(0, n50.get_center() + UP * 0.62 + RIGHT * 0.5),
            make_bf_label(0, n10.get_center() + UP * 0.62 + RIGHT * 0.5),
            make_bf_label(0, n20.get_center() + UP * 0.62 + RIGHT * 0.5),
        ]
        self.play(*[FadeIn(b, scale=0.8) for b in bf_labels], run_time=0.8)
        self.play(Flash(n30[0], color=RED, flash_radius=0.55))

        bad_note = Text("bf = 2  means VIOLATION!  A rotation is needed.",
                        font_size=20, color=RED_A)
        bad_note.to_edge(DOWN).shift(UP * 0.3)
        self.play(Write(bad_note))
        self.wait(2)

        self.play(FadeOut(VGroup(heading, formula, rule, bad_note,
                                 *tree_nodes, *tree_edges, *bf_labels)))

    # ─────────────── 4. RIGHT ROTATION ───────
    def _right_rotation(self):
        heading = self._section_heading("Case 1 : LL Imbalance  ->  Right Rotation")
        self.play(Write(heading))

        desc = Text("Insert order:  30  ->  20  ->  10   (all going LEFT)",
                    font_size=20, color="#cccccc")
        desc.shift(UP * 2.3)
        self.play(FadeIn(desc))
        self.wait(0.4)

        n30 = make_node(30, RED_D);  n30.move_to(LEFT * 2.5 + UP * 0.8)
        n20 = make_node(20, RED_D);  n20.move_to(LEFT * 3.5 + DOWN * 0.2)
        n10 = make_node(10, RED_D);  n10.move_to(LEFT * 4.5 + DOWN * 1.2)
        e1 = tree_edge(n30, n20); e2 = tree_edge(n20, n10)

        self.play(GrowFromCenter(n30))
        self.play(GrowFromCenter(n20), Create(e1))
        self.play(GrowFromCenter(n10), Create(e2))

        bf30 = make_bf_label(2,  n30.get_center() + UP * 0.62)
        bf20 = make_bf_label(1,  n20.get_center() + UP * 0.62)
        bf10 = make_bf_label(0,  n10.get_center() + UP * 0.62)
        self.play(FadeIn(bf30), FadeIn(bf20), FadeIn(bf10))
        self.play(Flash(n30[0], color=RED, flash_radius=0.55))

        before_lbl = Text("Before rotation", font_size=17, color="#999999")
        before_lbl.next_to(n30, UP, buff=0.95)
        self.play(Write(before_lbl))
        self.wait(0.7)

        arr, lbl = self._rot_arrow(
            LEFT * 1.2 + UP * 0.0, RIGHT * 0.4 + UP * 0.0,
            "Right", "Rotation", color=YELLOW
        )
        self.play(GrowArrow(arr), Write(lbl))
        self.wait(0.3)

        n20b = make_node(20, GREEN_D); n20b.move_to(RIGHT * 2.0 + UP * 0.8)
        n10b = make_node(10, GREEN_D); n10b.move_to(RIGHT * 1.0 + DOWN * 0.2)
        n30b = make_node(30, GREEN_D); n30b.move_to(RIGHT * 3.0 + DOWN * 0.2)
        e3 = tree_edge(n20b, n10b); e4 = tree_edge(n20b, n30b)

        self.play(GrowFromCenter(n20b))
        self.play(GrowFromCenter(n10b), Create(e3),
                  GrowFromCenter(n30b), Create(e4))

        bf20b = make_bf_label(0, n20b.get_center() + UP * 0.62)
        bf10b = make_bf_label(0, n10b.get_center() + UP * 0.62)
        bf30b = make_bf_label(0, n30b.get_center() + UP * 0.62)
        self.play(FadeIn(bf20b), FadeIn(bf10b), FadeIn(bf30b))

        after_lbl = Text("After  (balanced)", font_size=17, color=GREEN_B)
        after_lbl.next_to(n20b, UP, buff=0.95)
        self.play(Write(after_lbl))
        self.wait(0.5)

        steps_lines = [
            "1. z = unbalanced node  (30)",
            "2. y = left child of z  (20)",
            "3. z.left  =  y.right",
            "4. y.right  =  z",
            "5. Update heights and balance factors",
        ]
        step_texts = VGroup(*[
            Text(s, font_size=15, color="#cccccc") for s in steps_lines
        ]).arrange(DOWN, buff=0.2, aligned_edge=LEFT)
        step_texts.to_corner(DR).shift(UP * 0.6 + LEFT * 0.1)
        self.play(FadeIn(step_texts, shift=LEFT * 0.3), run_time=1.0)
        self.wait(2)

        self.play(FadeOut(VGroup(
            heading, desc,
            n30, n20, n10, e1, e2, bf30, bf20, bf10, before_lbl,
            arr, lbl,
            n20b, n10b, n30b, e3, e4, bf20b, bf10b, bf30b, after_lbl,
            step_texts
        )))

    # ─────────────── 5. LEFT ROTATION ────────
    def _left_rotation(self):
        heading = self._section_heading("Case 2 : RR Imbalance  ->  Left Rotation")
        self.play(Write(heading))

        desc = Text("Insert order:  10  ->  20  ->  30   (all going RIGHT)",
                    font_size=20, color="#cccccc")
        desc.shift(UP * 2.3)
        self.play(FadeIn(desc))
        self.wait(0.4)

        n10 = make_node(10, RED_D); n10.move_to(LEFT * 3.5 + UP * 0.8)
        n20 = make_node(20, RED_D); n20.move_to(LEFT * 2.5 + DOWN * 0.2)
        n30 = make_node(30, RED_D); n30.move_to(LEFT * 1.5 + DOWN * 1.2)
        e1 = tree_edge(n10, n20); e2 = tree_edge(n20, n30)

        self.play(GrowFromCenter(n10))
        self.play(GrowFromCenter(n20), Create(e1))
        self.play(GrowFromCenter(n30), Create(e2))

        bf10 = make_bf_label(-2, n10.get_center() + UP * 0.62)
        bf20 = make_bf_label(-1, n20.get_center() + UP * 0.62)
        bf30 = make_bf_label(0,  n30.get_center() + UP * 0.62)
        self.play(FadeIn(bf10), FadeIn(bf20), FadeIn(bf30))
        self.play(Flash(n10[0], color=RED, flash_radius=0.55))

        before_lbl = Text("Before rotation", font_size=17, color="#999999")
        before_lbl.next_to(n10, UP, buff=0.95)
        self.play(Write(before_lbl))
        self.wait(0.7)

        arr, lbl = self._rot_arrow(
            LEFT * 0.2 + UP * 0.0, RIGHT * 1.4 + UP * 0.0,
            "Left", "Rotation", color=YELLOW
        )
        self.play(GrowArrow(arr), Write(lbl))
        self.wait(0.3)

        n20b = make_node(20, GREEN_D); n20b.move_to(RIGHT * 3.0 + UP * 0.8)
        n10b = make_node(10, GREEN_D); n10b.move_to(RIGHT * 2.0 + DOWN * 0.2)
        n30b = make_node(30, GREEN_D); n30b.move_to(RIGHT * 4.0 + DOWN * 0.2)
        e3 = tree_edge(n20b, n10b); e4 = tree_edge(n20b, n30b)

        self.play(GrowFromCenter(n20b))
        self.play(GrowFromCenter(n10b), Create(e3),
                  GrowFromCenter(n30b), Create(e4))

        bf20b = make_bf_label(0, n20b.get_center() + UP * 0.62)
        bf10b = make_bf_label(0, n10b.get_center() + UP * 0.62)
        bf30b = make_bf_label(0, n30b.get_center() + UP * 0.62)
        self.play(FadeIn(bf20b), FadeIn(bf10b), FadeIn(bf30b))

        after_lbl = Text("After  (balanced)", font_size=17, color=GREEN_B)
        after_lbl.next_to(n20b, UP, buff=0.95)
        self.play(Write(after_lbl))
        self.wait(0.5)

        steps_lines = [
            "1. z = unbalanced node  (10)",
            "2. y = right child of z  (20)",
            "3. z.right  =  y.left",
            "4. y.left   =  z",
            "5. Update heights and balance factors",
        ]
        step_texts = VGroup(*[
            Text(s, font_size=15, color="#cccccc") for s in steps_lines
        ]).arrange(DOWN, buff=0.2, aligned_edge=LEFT)
        step_texts.to_corner(DR).shift(UP * 0.6 + LEFT * 0.1)
        self.play(FadeIn(step_texts, shift=LEFT * 0.3), run_time=1.0)
        self.wait(2)

        self.play(FadeOut(VGroup(
            heading, desc,
            n10, n20, n30, e1, e2, bf10, bf20, bf30, before_lbl,
            arr, lbl,
            n20b, n10b, n30b, e3, e4, bf20b, bf10b, bf30b, after_lbl,
            step_texts
        )))

    # ─────────────── 6. LEFT-RIGHT ROTATION ──
    def _left_right_rotation(self):
        heading = self._section_heading("Case 3 : LR Imbalance  ->  Left then Right Rotation")
        self.play(Write(heading))

        desc = Text("Insert order:  30  ->  10  ->  20   (Left then Right)",
                    font_size=20, color="#cccccc")
        desc.shift(UP * 2.3)
        self.play(FadeIn(desc))

        note_l1 = Text("Two steps:", font_size=18, color=YELLOW_A, weight=BOLD)
        note_l2 = Text("  Step 1: Left-rotate the left child   |   Step 2: Right-rotate the root",
                       font_size=18, color=YELLOW_A)
        note = VGroup(note_l1, note_l2).arrange(RIGHT, buff=0.2)
        note.shift(UP * 1.75)
        self.play(FadeIn(note))
        self.wait(0.5)

        n30 = make_node(30, RED_D);  n30.move_to(LEFT * 4.0 + UP * 0.5)
        n10 = make_node(10, RED_D);  n10.move_to(LEFT * 5.0 + DOWN * 0.5)
        n20 = make_node(20, ORANGE); n20.move_to(LEFT * 4.2 + DOWN * 1.5)
        e1 = tree_edge(n30, n10); e2 = tree_edge(n10, n20)
        self.play(GrowFromCenter(n30), GrowFromCenter(n10),
                  GrowFromCenter(n20), Create(e1), Create(e2))
        bf30 = make_bf_label(2,  n30.get_center() + UP * 0.62)
        bf10 = make_bf_label(-1, n10.get_center() + UP * 0.62)
        bf20 = make_bf_label(0,  n20.get_center() + UP * 0.62)
        self.play(FadeIn(bf30), FadeIn(bf10), FadeIn(bf20))
        lbl0 = Text("Original  (LR case)", font_size=16, color=RED_A)
        lbl0.next_to(n30, UP, buff=0.85)
        self.play(Write(lbl0))
        self.wait(0.8)

        arr1, lbl_arr1 = self._rot_arrow(
            LEFT * 2.6 + UP * 0.0, LEFT * 1.1 + UP * 0.0,
            "Step 1:", "Left on 10", color=YELLOW
        )
        self.play(GrowArrow(arr1), Write(lbl_arr1))
        self.wait(0.3)

        n30b = make_node(30, RED_D);  n30b.move_to(LEFT * 0.5 + UP * 0.5)
        n20b = make_node(20, ORANGE); n20b.move_to(LEFT * 1.5 + DOWN * 0.5)
        n10b = make_node(10, RED_D);  n10b.move_to(LEFT * 2.3 + DOWN * 1.5)
        e3 = tree_edge(n30b, n20b); e4 = tree_edge(n20b, n10b)
        self.play(GrowFromCenter(n30b), GrowFromCenter(n20b),
                  GrowFromCenter(n10b), Create(e3), Create(e4))
        bf30b = make_bf_label(2, n30b.get_center() + UP * 0.62)
        bf20b = make_bf_label(1, n20b.get_center() + UP * 0.62)
        bf10b = make_bf_label(0, n10b.get_center() + UP * 0.62)
        self.play(FadeIn(bf30b), FadeIn(bf20b), FadeIn(bf10b))
        lbl1 = Text("After Step 1  (now LL case)", font_size=16, color=YELLOW_B)
        lbl1.next_to(n30b, UP, buff=0.85)
        self.play(Write(lbl1))
        self.wait(0.8)

        arr2, lbl_arr2 = self._rot_arrow(
            RIGHT * 0.9 + UP * 0.0, RIGHT * 2.4 + UP * 0.0,
            "Step 2:", "Right on 30", color=GREEN
        )
        self.play(GrowArrow(arr2), Write(lbl_arr2))
        self.wait(0.3)

        n20c = make_node(20, GREEN_D); n20c.move_to(RIGHT * 3.8 + UP * 0.5)
        n10c = make_node(10, GREEN_D); n10c.move_to(RIGHT * 2.8 + DOWN * 0.5)
        n30c = make_node(30, GREEN_D); n30c.move_to(RIGHT * 4.8 + DOWN * 0.5)
        e5 = tree_edge(n20c, n10c); e6 = tree_edge(n20c, n30c)
        self.play(GrowFromCenter(n20c), GrowFromCenter(n10c),
                  GrowFromCenter(n30c), Create(e5), Create(e6))
        bf20c = make_bf_label(0, n20c.get_center() + UP * 0.62)
        bf10c = make_bf_label(0, n10c.get_center() + UP * 0.62)
        bf30c = make_bf_label(0, n30c.get_center() + UP * 0.62)
        self.play(FadeIn(bf20c), FadeIn(bf10c), FadeIn(bf30c))
        lbl2 = Text("Balanced!", font_size=17, color=GREEN_B, weight=BOLD)
        lbl2.next_to(n20c, UP, buff=0.85)
        self.play(Write(lbl2))
        self.wait(2)

        self.play(FadeOut(VGroup(
            heading, desc, note,
            n30, n10, n20, e1, e2, bf30, bf10, bf20, lbl0,
            arr1, lbl_arr1,
            n30b, n20b, n10b, e3, e4, bf30b, bf20b, bf10b, lbl1,
            arr2, lbl_arr2,
            n20c, n10c, n30c, e5, e6, bf20c, bf10c, bf30c, lbl2
        )))

    # ─────────────── 7. RIGHT-LEFT ROTATION ──
    def _right_left_rotation(self):
        heading = self._section_heading("Case 4 : RL Imbalance  ->  Right then Left Rotation")
        self.play(Write(heading))

        desc = Text("Insert order:  10  ->  30  ->  20   (Right then Left)",
                    font_size=20, color="#cccccc")
        desc.shift(UP * 2.3)
        self.play(FadeIn(desc))

        note_l1 = Text("Two steps:", font_size=18, color=YELLOW_A, weight=BOLD)
        note_l2 = Text("  Step 1: Right-rotate the right child   |   Step 2: Left-rotate the root",
                       font_size=18, color=YELLOW_A)
        note = VGroup(note_l1, note_l2).arrange(RIGHT, buff=0.2)
        note.shift(UP * 1.75)
        self.play(FadeIn(note))
        self.wait(0.5)

        n10 = make_node(10, RED_D);  n10.move_to(LEFT * 4.0 + UP * 0.5)
        n30 = make_node(30, RED_D);  n30.move_to(LEFT * 3.0 + DOWN * 0.5)
        n20 = make_node(20, ORANGE); n20.move_to(LEFT * 3.8 + DOWN * 1.5)
        e1 = tree_edge(n10, n30); e2 = tree_edge(n30, n20)
        self.play(GrowFromCenter(n10), GrowFromCenter(n30),
                  GrowFromCenter(n20), Create(e1), Create(e2))
        bf10 = make_bf_label(-2, n10.get_center() + UP * 0.62)
        bf30 = make_bf_label(1,  n30.get_center() + UP * 0.62)
        bf20 = make_bf_label(0,  n20.get_center() + UP * 0.62)
        self.play(FadeIn(bf10), FadeIn(bf30), FadeIn(bf20))
        lbl0 = Text("Original  (RL case)", font_size=16, color=RED_A)
        lbl0.next_to(n10, UP, buff=0.85)
        self.play(Write(lbl0))
        self.wait(0.8)

        arr1, lbl_arr1 = self._rot_arrow(
            LEFT * 2.2 + UP * 0.0, LEFT * 0.7 + UP * 0.0,
            "Step 1:", "Right on 30", color=YELLOW
        )
        self.play(GrowArrow(arr1), Write(lbl_arr1))
        self.wait(0.3)

        n10b = make_node(10, RED_D);  n10b.move_to(LEFT * 0.2 + UP * 0.5)
        n20b = make_node(20, ORANGE); n20b.move_to(RIGHT * 0.8 + DOWN * 0.5)
        n30b = make_node(30, RED_D);  n30b.move_to(RIGHT * 0.0 + DOWN * 1.5)
        e3 = tree_edge(n10b, n20b); e4 = tree_edge(n20b, n30b)
        self.play(GrowFromCenter(n10b), GrowFromCenter(n20b),
                  GrowFromCenter(n30b), Create(e3), Create(e4))
        bf10b = make_bf_label(-2, n10b.get_center() + UP * 0.62)
        bf20b = make_bf_label(-1, n20b.get_center() + UP * 0.62)
        bf30b = make_bf_label(0,  n30b.get_center() + UP * 0.62)
        self.play(FadeIn(bf10b), FadeIn(bf20b), FadeIn(bf30b))
        lbl1 = Text("After Step 1  (now RR case)", font_size=16, color=YELLOW_B)
        lbl1.next_to(n10b, UP, buff=0.85)
        self.play(Write(lbl1))
        self.wait(0.8)

        arr2, lbl_arr2 = self._rot_arrow(
            RIGHT * 1.6 + UP * 0.0, RIGHT * 3.1 + UP * 0.0,
            "Step 2:", "Left on 10", color=GREEN
        )
        self.play(GrowArrow(arr2), Write(lbl_arr2))
        self.wait(0.3)

        n20c = make_node(20, GREEN_D); n20c.move_to(RIGHT * 4.0 + UP * 0.5)
        n10c = make_node(10, GREEN_D); n10c.move_to(RIGHT * 3.0 + DOWN * 0.5)
        n30c = make_node(30, GREEN_D); n30c.move_to(RIGHT * 5.0 + DOWN * 0.5)
        e5 = tree_edge(n20c, n10c); e6 = tree_edge(n20c, n30c)
        self.play(GrowFromCenter(n20c), GrowFromCenter(n10c),
                  GrowFromCenter(n30c), Create(e5), Create(e6))
        bf20c = make_bf_label(0, n20c.get_center() + UP * 0.62)
        bf10c = make_bf_label(0, n10c.get_center() + UP * 0.62)
        bf30c = make_bf_label(0, n30c.get_center() + UP * 0.62)
        self.play(FadeIn(bf20c), FadeIn(bf10c), FadeIn(bf30c))
        lbl2 = Text("Balanced!", font_size=17, color=GREEN_B, weight=BOLD)
        lbl2.next_to(n20c, UP, buff=0.85)
        self.play(Write(lbl2))
        self.wait(2)

        self.play(FadeOut(VGroup(
            heading, desc, note,
            n10, n30, n20, e1, e2, bf10, bf30, bf20, lbl0,
            arr1, lbl_arr1,
            n10b, n20b, n30b, e3, e4, bf10b, bf20b, bf30b, lbl1,
            arr2, lbl_arr2,
            n20c, n10c, n30c, e5, e6, bf20c, bf10c, bf30c, lbl2
        )))

    # ─────────────── 8. OUTRO ─────────────────
    def _outro(self):
        heading = Text("Summary", font_size=52, color=BLUE_B, weight=BOLD)
        heading.shift(UP * 2.8)
        self.play(Write(heading))

        cases = [
            ("LL  (left-left)",   "Right Rotation",             GREEN_B),
            ("RR  (right-right)", "Left Rotation",              TEAL_B),
            ("LR  (left-right)",  "Left  then  Right Rotation", YELLOW_B),
            ("RL  (right-left)",  "Right  then  Left Rotation", GOLD_B),
        ]

        rows = VGroup()
        for case_str, action_str, color in cases:
            case_txt   = Text(case_str,   font_size=24, color=WHITE)
            arrow_txt  = Text("  ->  ",   font_size=24, color="#999999")
            action_txt = Text(action_str, font_size=24, color=color, weight=BOLD)
            row = VGroup(case_txt, arrow_txt, action_txt).arrange(RIGHT, buff=0.15)
            rows.add(row)

        rows.arrange(DOWN, aligned_edge=LEFT, buff=0.45)
        rows.shift(DOWN * 0.3)
        for row in rows:
            self.play(FadeIn(row, shift=RIGHT * 0.3), run_time=0.45)

        self.wait(0.5)

        key = Text(
            "AVL trees guarantee  O(log n)  for insert, delete, and search!",
            font_size=21, color=YELLOW_A, weight=BOLD
        )
        key.to_edge(DOWN).shift(UP * 0.45)
        box = SurroundingRectangle(key, color=YELLOW_D, corner_radius=0.15,
                                   buff=0.2, stroke_width=2)
        self.play(Create(box), Write(key), run_time=1)
        self.wait(2.5)

        self.play(FadeOut(VGroup(heading, rows, key, box)))
        fin = Text("Thanks for watching!", font_size=48, color=BLUE_B, weight=BOLD)
        self.play(Write(fin))
        self.wait(2)
        self.play(FadeOut(fin))`

export const ReactFlowcode = `
import React, { useState, useCallback } from 'react';
import ReactFlow, { 
  Node, 
  Edge, 
  Background, 
  Controls,
  applyNodeChanges,
  OnChanges
} from 'reactflow';
import 'reactflow/dist/style.css';

// --- Simple AVL Logic ---
class AVLNode {
  value: number;
  left: AVLNode | null = null;
  right: AVLNode | null = null;
  height: number = 1;
  constructor(val: number) { this.value = val; }
}

const getHeight = (n: AVLNode | null): number => n ? n.height : 0;
const getBalance = (n: AVLNode | null): number => n ? getHeight(n.left) - getHeight(n.right) : 0;

const rotateRight = (y: AVLNode) => {
  const x = y.left!;
  const T2 = x.right;
  x.right = y;
  y.left = T2;
  y.height = Math.max(getHeight(y.left), getHeight(y.right)) + 1;
  x.height = Math.max(getHeight(x.left), getHeight(x.right)) + 1;
  return x;
};

const rotateLeft = (x: AVLNode) => {
  const y = x.right!;
  const T2 = y.left;
  y.left = x;
  x.right = T2;
  x.height = Math.max(getHeight(x.left), getHeight(x.right)) + 1;
  y.height = Math.max(getHeight(y.left), getHeight(y.right)) + 1;
  return y;
};

const insert = (node: AVLNode | null, value: number): AVLNode => {
  if (!node) return new AVLNode(value);
  if (value < node.value) node.left = insert(node.left, value);
  else if (value > node.value) node.right = insert(node.right, value);
  else return node;

  node.height = 1 + Math.max(getHeight(node.left), getHeight(node.right));
  const balance = getBalance(node);

  if (balance > 1 && value < node.left!.value) return rotateRight(node);
  if (balance < -1 && value > node.right!.value) return rotateLeft(node);
  if (balance > 1 && value > node.left!.value) {
    node.left = rotateLeft(node.left!);
    return rotateRight(node);
  }
  if (balance < -1 && value < node.right!.value) {
    node.right = rotateRight(node.right!);
    return rotateLeft(node);
  }
  return node;
};

export default function AVLVisualizer() {
  const [tree, setTree] = useState<AVLNode | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [inputValue, setInputValue] = useState('');

  const generateFlowData = (root: AVLNode | null) => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    const traverse = (node: AVLNode | null, x: number, y: number, level: number) => {
      if (!node) return;
      const id = node.value.toString();
      
      newNodes.push({
        id,
        data: { label: \`Val: \${node.value} (H:\${node.height})\` },
        position: { x, y },
        style: { background: '#fff', border: '1px solid #222', borderRadius: '50%', width: 60, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }
      });

      const spacing = 200 / (level + 1);
      if (node.left) {
        newEdges.push({ id: \`e\${id}-\${node.left.value}\`, source: id, target: node.left.value.toString() });
        traverse(node.left, x - spacing, y + 100, level + 1);
      }
      if (node.right) {
        newEdges.push({ id: \`e\${id}-\${node.right.value}\`, source: id, target: node.right.value.toString() });
        traverse(node.right, x + spacing, y + 100, level + 1);
      }
    };

    traverse(root, 400, 50, 0);
    setNodes(newNodes);
    setEdges(newEdges);
  };

  const handleAddNode = () => {
    const val = parseInt(inputValue);
    if (isNaN(val)) return;
    const newTree = insert(tree, val);
    setTree(newTree);
    generateFlowData(newTree);
    setInputValue('');
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '10px', background: '#f0f0f0', zIndex: 5 }}>
        <input 
          type="number" 
          value={inputValue} 
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter node value"
        />
        <button onClick={handleAddNode} style={{ marginLeft: '10px' }}>Add & Balance</button>
      </div>
      <div style={{ flexGrow: 1 }}>
        <ReactFlow nodes={nodes} edges={edges} fitView>
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}
`;

export const mermaidCode = `flowchart TD
    %% Define Styling
    classDef patient fill:#d4edda,stroke:#28a745,stroke-width:2px,color:#000;
    classDef admin fill:#cce5ff,stroke:#007bff,stroke-width:2px,color:#000;
    classDef medical fill:#fff3cd,stroke:#ffc107,stroke-width:2px,color:#000;
    classDef billing fill:#f8d7da,stroke:#dc3545,stroke-width:2px,color:#000;

    %% Patient Actions
    subgraph Patient_Journey [Patient]
        P1(Login / Register Portal) --> P2(Request Appointment)
        P3(Arrive at Hospital)
        P4(Pay Bill)
        P5(Collect Medication / Discharge)
    end

    %% Reception/Admin Actions
    subgraph Reception_Admin [Reception / Admin]
        A1{Check Availability}
        A2(Confirm Appointment)
        A3(Patient Check-in & Triage)
    end

    %% Doctor/Medical Actions
    subgraph Medical_Staff [Doctor & Lab]
        D1(Access Patient Records)
        D2(Examine Patient)
        D3{Diagnosis & Action}
        D4(Order Lab Tests)
        D5(Write Prescription)
    end

    %% Pharmacy & Billing Actions
    subgraph Pharmacy_Billing [Pharmacy & Billing]
        B1(Process Lab Results)
        B2(Prepare Medication)
        B3(Generate Final Invoice)
    end

    %% Flow Connections Across Subgraphs
    P2 --> A1
    A1 -- Available --> A2
    A1 -- Unavailable --> P2
    A2 --> P3
    P3 --> A3
    A3 --> D1
    D1 --> D2
    D2 --> D3
    
    D3 -- Needs Tests --> D4
    D3 -- Needs Meds --> D5
    
    D4 --> B1
    B1 --> D1
    
    D5 --> B2
    D5 --> B3
    B2 --> P5
    
    B3 --> P4
    P4 --> P5

    %% Apply Classes to Nodes (Broadly Compatible Method)
    class P1,P2,P3,P4,P5 patient;
    class A1,A2,A3 admin;
    class D1,D2,D3,D4,D5 medical;
    class B1,B2,B3 billing;

`;