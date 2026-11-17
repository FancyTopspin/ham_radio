"""
Official NCVEC Amateur Radio License Examination Diagram Mappings.
Provides direct image URLs to official question pool diagrams for Technician, General, and Extra exams.
"""

OFFICIAL_DIAGRAM_URLS = {
    # Technician Class (Element 2)
    'Figure T-1': 'https://hamexam.org/images/figures/T2026/T1.jpg',
    'Figure T-2': 'https://hamexam.org/images/figures/T2026/T2.jpg',
    'Figure T-3': 'https://hamexam.org/images/figures/T2026/T3.jpg',
    'T-1': 'https://hamexam.org/images/figures/T2026/T1.jpg',
    'T-2': 'https://hamexam.org/images/figures/T2026/T2.jpg',
    'T-3': 'https://hamexam.org/images/figures/T2026/T3.jpg',
    'T1': 'https://hamexam.org/images/figures/T2026/T1.jpg',
    'T2': 'https://hamexam.org/images/figures/T2026/T2.jpg',
    'T3': 'https://hamexam.org/images/figures/T2026/T3.jpg',

    # General Class (Element 3)
    'Figure G7-1': 'https://hamexam.org/images/figures/G2023/G7-1.jpg',
    'G7-1': 'https://hamexam.org/images/figures/G2023/G7-1.jpg',

    # Amateur Extra Class (Element 4)
    'Figure E5-1': 'https://hamexam.org/images/figures/E2024/E5-1.png',
    'Figure E6-1': 'https://hamexam.org/images/figures/E2024/E6-1.png',
    'Figure E6-2': 'https://hamexam.org/images/figures/E2024/E6-2.png',
    'Figure E6-3': 'https://hamexam.org/images/figures/E2024/E6-3.png',
    'Figure E7-1': 'https://hamexam.org/images/figures/E2024/E7-1.png',
    'Figure E7-2': 'https://hamexam.org/images/figures/E2024/E7-2.png',
    'Figure E7-3': 'https://hamexam.org/images/figures/E2024/E7-3.png',
    'Figure E9-1': 'https://hamexam.org/images/figures/E2024/E9-1.png',
    'Figure E9-2': 'https://hamexam.org/images/figures/E2024/E9-2.png',
    'Figure E9-3': 'https://hamexam.org/images/figures/E2024/E9-3.png',
    'E5-1': 'https://hamexam.org/images/figures/E2024/E5-1.png',
    'E6-1': 'https://hamexam.org/images/figures/E2024/E6-1.png',
    'E6-2': 'https://hamexam.org/images/figures/E2024/E6-2.png',
    'E6-3': 'https://hamexam.org/images/figures/E2024/E6-3.png',
    'E7-1': 'https://hamexam.org/images/figures/E2024/E7-1.png',
    'E7-2': 'https://hamexam.org/images/figures/E2024/E7-2.png',
    'E7-3': 'https://hamexam.org/images/figures/E2024/E7-3.png',
    'E9-1': 'https://hamexam.org/images/figures/E2024/E9-1.png',
    'E9-2': 'https://hamexam.org/images/figures/E2024/E9-2.png',
    'E9-3': 'https://hamexam.org/images/figures/E2024/E9-3.png',
}

def get_official_diagram_url(figure_name: str) -> str:
    """
    Resolves the canonical URL for an official NCVEC figure name.
    """
    if not figure_name:
        return ''
    cleaned = figure_name.strip()
    if cleaned in OFFICIAL_DIAGRAM_URLS:
        return OFFICIAL_DIAGRAM_URLS[cleaned]

    import re
    m = re.search(r'(?i)(?:figure\s+)?([TGE][0-9\-]+)', cleaned)
    if m:
        key = m.group(1).upper()
        if key in OFFICIAL_DIAGRAM_URLS:
            return OFFICIAL_DIAGRAM_URLS[key]
        full_key = f"Figure {key}"
        if full_key in OFFICIAL_DIAGRAM_URLS:
            return OFFICIAL_DIAGRAM_URLS[full_key]

    return ''
