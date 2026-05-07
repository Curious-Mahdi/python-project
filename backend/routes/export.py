from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required
import io
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from database.db import query

export_bp = Blueprint("export", __name__)


@export_bp.route("/pdf", methods=["POST"])
@jwt_required()
def export_pdf():
    """Generate a Match Strategy PDF."""
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
    from reportlab.lib.enums import TA_CENTER, TA_LEFT

    data = request.get_json() or {}
    match_id = data.get("match_id")
    player_name = data.get("player_name")
    ai_summary = data.get("ai_summary", "No AI summary provided.")
    h2h_data = data.get("h2h", {})

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4,
                             rightMargin=2*cm, leftMargin=2*cm,
                             topMargin=2*cm, bottomMargin=2*cm)

    styles = getSampleStyleSheet()
    navy = colors.HexColor("#0A0E1A")
    blue = colors.HexColor("#00D4FF")
    white = colors.white

    title_style = ParagraphStyle("title", parent=styles["Title"],
                                  fontSize=24, textColor=blue,
                                  spaceAfter=6, alignment=TA_CENTER)
    sub_style = ParagraphStyle("sub", parent=styles["Normal"],
                                fontSize=11, textColor=colors.grey,
                                alignment=TA_CENTER, spaceAfter=20)
    section_style = ParagraphStyle("section", parent=styles["Heading2"],
                                    fontSize=13, textColor=blue, spaceAfter=8)
    body_style = ParagraphStyle("body", parent=styles["Normal"],
                                 fontSize=10, textColor=colors.black, spaceAfter=6)

    content = []

    # Header
    content.append(Paragraph("⚡ SportsMassive", title_style))
    content.append(Paragraph("IPL Intelligence & Strategy Report", sub_style))
    content.append(HRFlowable(width="100%", thickness=2, color=blue))
    content.append(Spacer(1, 0.4*cm))

    # Match details
    if match_id:
        match = query("SELECT * FROM matches WHERE id=?", (match_id,), one=True)
        if match:
            content.append(Paragraph("📋 Match Summary", section_style))
            match_table_data = [
                ["Field", "Detail"],
                ["Venue", match["venue"]],
                ["Date", match["match_date"]],
                ["Teams", f"{match['team1']} vs {match['team2']}"],
                ["Toss", f"{match['toss_winner']} chose to {match['toss_decision']}"],
                ["Result", f"{match['winner']} won by {match['result_margin']}"],
            ]
            t = Table(match_table_data, colWidths=[4*cm, 12*cm])
            t.setStyle(TableStyle([
                ("BACKGROUND", (0,0), (-1,0), navy),
                ("TEXTCOLOR", (0,0), (-1,0), white),
                ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
                ("FONTSIZE", (0,0), (-1,-1), 10),
                ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.HexColor("#F5F5F5"), white]),
                ("GRID", (0,0), (-1,-1), 0.5, colors.HexColor("#DDDDDD")),
                ("PADDING", (0,0), (-1,-1), 6),
            ]))
            content.append(t)
            content.append(Spacer(1, 0.5*cm))

    # H2H Section
    if h2h_data:
        content.append(Paragraph("⚔️ Head-to-Head Battle Stats", section_style))
        overall = h2h_data.get("overall", {})
        if overall:
            h2h_table = [
                ["Metric", "Value"],
                ["Balls Faced", str(overall.get("balls_faced", 0))],
                ["Runs Scored", str(overall.get("runs_scored", 0))],
                ["Strike Rate", str(overall.get("strike_rate", 0))],
                ["Dismissals", str(overall.get("dismissals", 0))],
                ["Boundaries (4s)", str(overall.get("fours", 0))],
                ["Sixes", str(overall.get("sixes", 0))],
                ["Dot Balls", str(overall.get("dot_balls", 0))],
            ]
            t2 = Table(h2h_table, colWidths=[8*cm, 8*cm])
            t2.setStyle(TableStyle([
                ("BACKGROUND", (0,0), (-1,0), navy),
                ("TEXTCOLOR", (0,0), (-1,0), white),
                ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
                ("FONTSIZE", (0,0), (-1,-1), 10),
                ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.HexColor("#F0F8FF"), white]),
                ("GRID", (0,0), (-1,-1), 0.5, colors.HexColor("#CCCCCC")),
                ("PADDING", (0,0), (-1,-1), 6),
            ]))
            content.append(t2)
            content.append(Spacer(1, 0.5*cm))

    # AI Summary
    content.append(Paragraph("🤖 AI Scout Analysis", section_style))
    content.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#CCCCCC")))
    content.append(Spacer(1, 0.3*cm))
    for para in ai_summary.split("\n\n"):
        if para.strip():
            content.append(Paragraph(para.strip(), body_style))
    content.append(Spacer(1, 0.5*cm))

    # Footer
    content.append(HRFlowable(width="100%", thickness=1, color=blue))
    content.append(Paragraph(
        "Generated by SportsMassive | IPL Intelligence Platform | Powered by Gemini AI",
        ParagraphStyle("footer", parent=styles["Normal"], fontSize=8,
                       textColor=colors.grey, alignment=TA_CENTER)
    ))

    doc.build(content)
    buffer.seek(0)
    return send_file(
        buffer,
        mimetype="application/pdf",
        as_attachment=True,
        download_name="sportsmassive_strategy.pdf"
    )
