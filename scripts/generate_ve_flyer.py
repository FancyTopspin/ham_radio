#!/usr/bin/env python3
"""
Generate a professional 1-page "VE Handout" flyer PDF for Volunteer Examiners
and amateur radio clubs to distribute to testing candidates.
"""

import os
import sys
from io import BytesIO
from pathlib import Path
import qrcode
import pypdf

from reportlab.lib import colors
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    Image,
    KeepTogether,
)

def create_qr_code(data: str) -> BytesIO:
    """Generate a crisp high-res QR code image in memory."""
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=8,
        border=1,
    )
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#0f172a", back_color="#ffffff")
    buf = BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf

def build_ve_flyer(output_path: str, url: str = "https://openham.org"):
    # 8.5 x 11 inches: 612 x 792 points
    # Margins: 28pt top/bottom, 32pt left/right -> Usable: 548 x 736 pt
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        leftMargin=32,
        rightMargin=32,
        topMargin=26,
        bottomMargin=26,
    )

    styles = getSampleStyleSheet()

    # Custom palette
    NAVY = HexColor("#0f172a")       # Slate 900
    SLATE = HexColor("#334155")      # Slate 700
    LIGHT_BG = HexColor("#f8fafc")   # Slate 50
    CARD_BG = HexColor("#f1f5f9")    # Slate 100
    BLUE = HexColor("#0284c7")       # Sky 600
    DARK_BLUE = HexColor("#0369a1")  # Sky 700
    ACCENT = HexColor("#059669")     # Emerald 600
    BORDER_COLOR = HexColor("#cbd5e1") # Slate 300
    LINE_COLOR = HexColor("#94a3b8")   # Slate 400

    # Typography styles
    title_style = ParagraphStyle(
        "HeaderTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=22,
        textColor=HexColor("#ffffff"),
        alignment=0,
    )

    subtitle_style = ParagraphStyle(
        "HeaderSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=12,
        textColor=HexColor("#38bdf8"), # Sky 400
        alignment=0,
    )

    badge_style = ParagraphStyle(
        "HeaderBadge",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=11,
        textColor=HexColor("#e2e8f0"),
        alignment=2,
    )

    hero_head_style = ParagraphStyle(
        "HeroHead",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=13.5,
        leading=16,
        textColor=NAVY,
    )

    hero_body_style = ParagraphStyle(
        "HeroBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=11.5,
        textColor=SLATE,
    )

    feature_item_style = ParagraphStyle(
        "FeatureItem",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=10.5,
        textColor=NAVY,
    )

    qr_label_bold = ParagraphStyle(
        "QRBold",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9.5,
        leading=12,
        textColor=NAVY,
        alignment=1,
    )

    qr_label_url = ParagraphStyle(
        "QRUrl",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=11,
        textColor=BLUE,
        alignment=1,
    )

    qr_label_sub = ParagraphStyle(
        "QRSub",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=7.5,
        leading=9.5,
        textColor=HexColor("#64748b"),
        alignment=1,
    )

    section_head_style = ParagraphStyle(
        "SectionHead",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=13,
        textColor=NAVY,
    )

    card_step_num = ParagraphStyle(
        "CardStepNum",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=BLUE,
    )

    card_step_title = ParagraphStyle(
        "CardStepTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11,
        textColor=NAVY,
    )

    card_step_desc = ParagraphStyle(
        "CardStepDesc",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=7.5,
        leading=9.5,
        textColor=SLATE,
    )

    notes_title = ParagraphStyle(
        "NotesTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9.5,
        leading=12,
        textColor=NAVY,
    )

    notes_field_label = ParagraphStyle(
        "NotesLabel",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=SLATE,
    )

    footer_text = ParagraphStyle(
        "FooterText",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=7,
        leading=9,
        textColor=HexColor("#64748b"),
        alignment=1,
    )

    story = []

    # -------------------------------------------------------------
    # 1. HEADER BANNER (Width: 548 pt)
    # -------------------------------------------------------------
    header_left = [
        Paragraph("HAM RADIO EXAM PREP", title_style),
        Spacer(1, 2),
        Paragraph("MODERN FCC AMATEUR RADIO STUDY PLATFORM", subtitle_style),
    ]
    header_right = [
        Paragraph("<b>Official NCVEC Question Pools</b><br/>Technician • General • Extra<br/>100% Free & Open Access", badge_style)
    ]

    header_table = Table(
        [[header_left, header_right]],
        colWidths=[360, 188],
    )
    header_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), NAVY),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 10))

    # -------------------------------------------------------------
    # 2. HERO & QR CODE (Two-column layout)
    # -------------------------------------------------------------
    left_content = [
        Paragraph("Pass Your Exam on the First Attempt — Guaranteed", hero_head_style),
        Spacer(1, 4),
        Paragraph(
            "Designed for both first-time test takers and seasoned operators upgrading their licenses. "
            "Our intelligent engine eliminates rote memorization by combining cognitive spaced repetition "
            "with in-depth engineering breakdowns for every single question.",
            hero_body_style,
        ),
        Spacer(1, 8),
        # 4 Key Features with bullet bullets
        Paragraph("<b>✓ Spaced Repetition (SM-2):</b> Automatically schedules practice based on your recall strength so you retain key concepts permanently.", feature_item_style),
        Spacer(1, 3),
        Paragraph("<b>✓ Authentic Mock Exams:</b> Uses the exact NCVEC sub-element blueprints (35 questions for Tech & General, 50 for Extra).", feature_item_style),
        Spacer(1, 3),
        Paragraph("<b>✓ Comprehensive Explanations:</b> Detailed RF principles, Ohm's law derivations, schematic diagrams, and FCC Part 97 rule citations.", feature_item_style),
        Spacer(1, 3),
        Paragraph("<b>✓ Smart Mistake Queue:</b> Automatically isolates missed questions so you can target and conquer your weak spots in minutes.", feature_item_style),
        Spacer(1, 3),
        Paragraph("<b>✓ Cross-Device & Mobile-Ready:</b> No app installation needed. Works seamlessly in any browser on phone, tablet, or PC.", feature_item_style),
    ]

    # QR Code generation
    qr_buf = create_qr_code(url)
    qr_img = Image(qr_buf, width=110, height=110)

    right_content = [
        Paragraph("<b>START PRACTICING NOW</b>", qr_label_bold),
        Spacer(1, 2),
        qr_img,
        Spacer(1, 2),
        Paragraph("Scan with phone camera", qr_label_sub),
        Spacer(1, 2),
        Paragraph("openham.org", qr_label_url),
        Spacer(1, 1),
        Paragraph("Instant access • No credit card • Ad-free", qr_label_sub),
    ]

    hero_table = Table(
        [[left_content, right_content]],
        colWidths=[370, 178],
    )
    hero_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BACKGROUND', (1, 0), (1, 0), LIGHT_BG),
        ('BOX', (1, 0), (1, 0), 1, BORDER_COLOR),
        ('ALIGN', (1, 0), (1, 0), 'CENTER'),
        ('TOPPADDING', (1, 0), (1, 0), 8),
        ('BOTTOMPADDING', (1, 0), (1, 0), 8),
        ('LEFTPADDING', (1, 0), (1, 0), 8),
        ('RIGHTPADDING', (1, 0), (1, 0), 8),
        ('RIGHTPADDING', (0, 0), (0, 0), 12),
        ('LEFTPADDING', (0, 0), (0, 0), 0),
        ('TOPPADDING', (0, 0), (0, 0), 0),
        ('BOTTOMPADDING', (0, 0), (0, 0), 0),
    ]))
    story.append(hero_table)
    story.append(Spacer(1, 10))

    # -------------------------------------------------------------
    # 3. LICENSING ROADMAP (4 Compact Step Cards)
    # -------------------------------------------------------------
    story.append(Paragraph("FOUR STEPS TO YOUR AMATEUR RADIO LICENSE", section_head_style))
    story.append(Spacer(1, 5))

    step1 = [
        Paragraph("STEP 1", card_step_num),
        Paragraph("Study & Practice", card_step_title),
        Spacer(1, 2),
        Paragraph("Master the official questions at <b>openham.org</b>. Aim for consistent 85%+ on mock exams.", card_step_desc),
    ]
    step2 = [
        Paragraph("STEP 2", card_step_num),
        Paragraph("Get an FCC FRN", card_step_title),
        Spacer(1, 2),
        Paragraph("Register free for an FCC Registration Number at <b>fcc.gov/cores</b> before taking your exam.", card_step_desc),
    ]
    step3 = [
        Paragraph("STEP 3", card_step_num),
        Paragraph("Attend VE Session", card_step_title),
        Spacer(1, 2),
        Paragraph("Test in-person or online with a VE team (ARRL, W5YI, Laurel). Bring photo ID and your FRN.", card_step_desc),
    ]
    step4 = [
        Paragraph("STEP 4", card_step_num),
        Paragraph("Get On The Air!", card_step_title),
        Spacer(1, 2),
        Paragraph("Receive your official callsign in the FCC database in days. Upgrade anytime to General & Extra!", card_step_desc),
    ]

    steps_table = Table(
        [[step1, step2, step3, step4]],
        colWidths=[133, 133, 133, 133],
    )
    steps_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), CARD_BG),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOX', (0, 0), (-1, -1), 0.75, BORDER_COLOR),
        ('INNERGRID', (0, 0), (-1, -1), 0.75, BORDER_COLOR),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(steps_table)
    story.append(Spacer(1, 10))

    # -------------------------------------------------------------
    # 4. VOLUNTEER EXAMINER & CLUB SESSION NOTES (Write-in Area)
    # -------------------------------------------------------------
    notes_header = [
        Paragraph("<b>LOCAL EXAM SESSION & CLUB CONTACT INFO</b> (Fill in for your candidates)", notes_title),
    ]

    row1_left = Paragraph("<b>Exam Team / Club:</b> ________________________________________________", notes_field_label)
    row1_right = Paragraph("<b>Exam Fee:</b> $ ________", notes_field_label)

    row2_left = Paragraph("<b>Next Session Date & Time:</b> ________________________________________", notes_field_label)
    row2_right = Paragraph("<b>Location / Room:</b> ______________________", notes_field_label)

    row3_left = Paragraph("<b>Elmer / Club Contact Email:</b> ________________________________________", notes_field_label)
    row3_right = Paragraph("<b>Club Website / Net:</b> ____________________", notes_field_label)

    notes_table = Table(
        [
            [notes_header, ""],
            [row1_left, row1_right],
            [row2_left, row2_right],
            [row3_left, row3_right],
        ],
        colWidths=[365, 167],
    )
    notes_table.setStyle(TableStyle([
        ('SPAN', (0, 0), (1, 0)),
        ('BACKGROUND', (0, 0), (-1, -1), HexColor("#ffffff")),
        ('BOX', (0, 0), (-1, -1), 1, BLUE),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, 0), 6),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 4),
        ('TOPPADDING', (0, 1), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('BACKGROUND', (0, 0), (1, 0), HexColor("#eff6ff")), # Sky 50
    ]))
    story.append(notes_table)
    story.append(Spacer(1, 10))

    # -------------------------------------------------------------
    # 5. FOOTER & COPYRIGHT
    # -------------------------------------------------------------
    footer_p = Paragraph(
        "<b>Current Official Question Pools:</b> Technician (Element 2) 2026–2030 • General (Element 3) 2023–2027 • Amateur Extra (Element 4) 2024–2028<br/>"
        "Free to print and distribute for amateur radio clubs, VE teams, hamfests, and STEM events. • <b>https://openham.org</b>",
        footer_text,
    )
    story.append(footer_p)

    # Build document
    doc.build(story)

    # Strict Page Count Validation
    reader = pypdf.PdfReader(output_path)
    page_count = len(reader.pages)
    if page_count != 1:
        raise ValueError(f"CRITICAL ERROR: Flyer generated {page_count} pages! Must be strictly 1 page.")
    
    print(f"SUCCESS: Generated 1-page VE flyer at {output_path} (Pages: {page_count})")

if __name__ == "__main__":
    out_dir = Path("/home/ubuntu/ai_projects/ham_radio_web_app/frontend/public")
    out_dir.mkdir(parents=True, exist_ok=True)
    pdf_path = str(out_dir / "ve-handout-flyer.pdf")
    build_ve_flyer(pdf_path)
