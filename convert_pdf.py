import os
import re
from fpdf import FPDF

class PDF(FPDF):
    def header(self):
        # Adding a nice top header bar
        self.set_fill_color(17, 17, 17) # Dark header
        self.rect(0, 0, 210, 15, "F")
        self.set_text_color(212, 175, 55) # Gold text
        self.set_font("SegoeUI", "B", 10)
        self.cell(0, -6, "ADS THỜI TRANG THỰC CHIẾN", align="C")
        self.ln(12)

    def footer(self):
        # Position at 1.5 cm from bottom
        self.set_y(-15)
        self.set_font("SegoeUI", "I", 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10, f"Trang {self.page_no()}/{{nb}} | Hotline hỗ trợ: 0987.654.321", align="C")

def convert_markdown_to_pdf(md_path, pdf_path):
    pdf = PDF()
    pdf.alias_nb_pages()
    
    # Register Segoe UI font for proper Vietnamese unicode rendering
    font_dir = "C:\\Windows\\Fonts"
    segoe_reg = os.path.join(font_dir, "segoeui.ttf")
    segoe_bold = os.path.join(font_dir, "segoeuib.ttf")
    segoe_italic = os.path.join(font_dir, "segoeuii.ttf")
    
    if os.path.exists(segoe_reg):
        pdf.add_font("SegoeUI", "", segoe_reg)
        pdf.add_font("SegoeUI", "B", segoe_bold)
        pdf.add_font("SegoeUI", "I", segoe_italic)
    else:
        # Fallback to Arial if Segoe UI is not available
        arial_reg = os.path.join(font_dir, "arial.ttf")
        arial_bold = os.path.join(font_dir, "arialbd.ttf")
        arial_italic = os.path.join(font_dir, "ariali.ttf")
        pdf.add_font("SegoeUI", "", arial_reg)
        pdf.add_font("SegoeUI", "B", arial_bold)
        pdf.add_font("SegoeUI", "I", arial_italic)

    pdf.add_page()
    pdf.set_margins(20, 20, 20)
    pdf.set_auto_page_break(auto=True, margin=20)
    
    # Read Markdown file
    with open(md_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    in_table = False
    table_data = []

    for line in lines:
        line_str = line.strip()
        
        # Handle Table
        if line_str.startswith('|'):
            if not in_table:
                in_table = True
                table_data = []
            
            # Skip separator row like | :--- | :--- |
            if not re.match(r'^\|[\s:-|]+$', line_str):
                row = [cell.strip() for cell in line_str.split('|')[1:-1]]
                table_data.append(row)
            continue
        else:
            if in_table:
                # Render the accumulated table
                in_table = False
                if table_data:
                    pdf.set_font("SegoeUI", "B", 9)
                    pdf.set_fill_color(240, 240, 240)
                    # Print headers
                    headers = table_data[0]
                    col_width = 170 / len(headers)
                    for header in headers:
                        pdf.cell(col_width, 8, header, border=1, fill=True, align="C")
                    pdf.ln()
                    
                    pdf.set_font("SegoeUI", "", 9)
                    for row in table_data[1:]:
                        # Check height needed for row cells to handle wrap
                        max_lines = 1
                        for cell in row:
                            cell_lines = len(pdf.multi_cell(col_width, 6, cell, split_only=True))
                            max_lines = max(max_lines, cell_lines)
                        
                        row_height = 6 * max_lines
                        # Print cells side-by-side using multi_cell inside rect or manual cursor control
                        x_start = pdf.get_x()
                        y_start = pdf.get_y()
                        
                        # Ensure we don't break page in middle of row
                        if y_start + row_height > 270:
                            pdf.add_page()
                            y_start = pdf.get_y()
                            
                        for i, cell in enumerate(row):
                            pdf.set_xy(x_start + i * col_width, y_start)
                            pdf.multi_cell(col_width, 6, cell, border=1, align="L")
                        pdf.set_xy(x_start, y_start + row_height)
                    pdf.ln(5)

        # Skip empty lines
        if not line_str:
            pdf.ln(3)
            continue

        # Handle Headers
        if line_str.startswith('# '):
            pdf.ln(5)
            pdf.set_font("SegoeUI", "B", 16)
            pdf.set_text_color(163, 29, 29) # Primary Red
            title_text = line_str[2:].replace('**', '')
            pdf.multi_cell(0, 10, title_text)
            pdf.ln(2)
        elif line_str.startswith('## '):
            pdf.ln(4)
            pdf.set_font("SegoeUI", "B", 13)
            pdf.set_text_color(184, 150, 45) # Gold
            pdf.multi_cell(0, 8, line_str[3:].replace('**', ''))
            pdf.ln(2)
        elif line_str.startswith('### '):
            pdf.ln(3)
            pdf.set_font("SegoeUI", "B", 11)
            pdf.set_text_color(17, 17, 17) # Dark
            pdf.multi_cell(0, 7, line_str[4:].replace('**', ''))
            pdf.ln(1)
        # Handle Blockquotes
        elif line_str.startswith('> '):
            pdf.set_font("SegoeUI", "I", 10)
            pdf.set_text_color(100, 100, 100)
            pdf.set_fill_color(245, 245, 245)
            quote_text = line_str[2:].replace('**', '')
            
            # Print with left border line
            x = pdf.get_x()
            y = pdf.get_y()
            pdf.set_draw_color(163, 29, 29)
            pdf.set_line_width(0.8)
            
            # Draw line
            lines_wrapped = pdf.multi_cell(0, 6, quote_text, split_only=True)
            h = len(lines_wrapped) * 6
            pdf.line(x, y, x, y + h)
            
            # Print text indented
            pdf.set_x(x + 5)
            pdf.multi_cell(0, 6, quote_text)
            pdf.set_line_width(0.2) # reset line width
            pdf.set_draw_color(0, 0, 0) # reset color
            pdf.ln(2)
        # Handle Bullet Points
        elif line_str.startswith('* ') or line_str.startswith('- ') or line_str.startswith('👉 ') or line_str.startswith('✔️ ') or line_str.startswith('🌸 ') or line_str.startswith('🎁 ') or line_str.startswith('⚡ ') or line_str.startswith('✔ '):
            pdf.set_font("SegoeUI", "", 10)
            pdf.set_text_color(51, 51, 51)
            
            bullet = "•"
            text_start = 2
            if line_str.startswith('👉 '): bullet = "👉"; text_start = 3
            elif line_str.startswith('✔️ '): bullet = "✓"; text_start = 3
            elif line_str.startswith('🌸 '): bullet = "🌸"; text_start = 3
            elif line_str.startswith('🎁 '): bullet = "🎁"; text_start = 3
            elif line_str.startswith('⚡ '): bullet = "⚡"; text_start = 3
            elif line_str.startswith('✔ '): bullet = "✓"; text_start = 2
            
            content = line_str[text_start:].strip()
            
            # Parse bold parts in content
            parts = content.split('**')
            
            # Print bullet
            pdf.set_x(25)
            pdf.write(6, f"{bullet} ")
            
            for index, part in enumerate(parts):
                if index % 2 == 1:
                    pdf.set_font("SegoeUI", "B", 10)
                else:
                    pdf.set_font("SegoeUI", "", 10)
                pdf.write(6, part)
            pdf.ln(6)
        # Horizontal rules
        elif line_str == '---':
            pdf.ln(4)
            pdf.set_draw_color(200, 200, 200)
            pdf.line(20, pdf.get_y(), 190, pdf.get_y())
            pdf.ln(4)
            pdf.set_draw_color(0, 0, 0)
        # Regular paragraph
        else:
            pdf.set_font("SegoeUI", "", 10)
            pdf.set_text_color(51, 51, 51)
            
            # Parse bold parts in paragraph
            parts = line_str.split('**')
            for index, part in enumerate(parts):
                if index % 2 == 1:
                    pdf.set_font("SegoeUI", "B", 10)
                else:
                    pdf.set_font("SegoeUI", "", 10)
                pdf.write(6, part)
            pdf.ln(6)
            
    pdf.output(pdf_path)
    print(f"PDF successfully generated at: {pdf_path}")

if __name__ == "__main__":
    convert_markdown_to_pdf("quy-trinh-ads-thoi-trang.md", "quy-trinh-ads-thoi-trang.pdf")
