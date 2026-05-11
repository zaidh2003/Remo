# REMO Thesis Formatting Guide for Turiba University

## Quick Start

### 1. Install Required Library
```bash
pip install python-docx
```

### 2. Run the Formatter
```bash
python format_thesis.py your_thesis.docx formatted_thesis.docx
```

---

## Turiba University Thesis Standards

### Page Setup
- **Paper Size:** A4 (8.27" × 11.69")
- **Margins:**
  - Left: 1.5 inches (for binding)
  - Right: 1.0 inch
  - Top: 1.0 inch
  - Bottom: 1.0 inch

### Typography
- **Font:** Times New Roman
- **Size:** 12pt for body text
- **Line Spacing:** Double-spaced (2.0)
- **Alignment:** Justified
- **First Line Indent:** 0.5 inches

### Headings
- **Heading 1:** 14pt, Bold, Left-aligned
- **Heading 2:** 13pt, Bold, Left-aligned
- **Heading 3:** 12pt, Bold, Left-aligned

### Page Numbers
- **Location:** Bottom center
- **Format:** Arabic numerals (1, 2, 3...)
- **Start:** After title page and abstract

---

## Thesis Structure

### Required Sections (in order):

1. **Title Page**
   - University name
   - Thesis title (ALL CAPS)
   - Author name
   - Supervisor name
   - Location and date

2. **Abstract**
   - 250-300 words
   - Single-spaced
   - Keywords (3-5)

3. **Table of Contents**
   - Auto-generated
   - Include all headings and page numbers

4. **List of Figures** (if applicable)

5. **List of Tables** (if applicable)

6. **List of Abbreviations** (if applicable)

7. **Introduction**
   - Background
   - Problem statement
   - Objectives
   - Scope

8. **Literature Review / Theoretical Framework**

9. **Methodology**

10. **Implementation / Results**

11. **Discussion**

12. **Conclusion**

13. **References**
    - APA or Harvard style
    - Hanging indent (0.5")
    - Single-spaced within entries
    - Double-spaced between entries

14. **Appendices** (if applicable)

---

## Common Formatting Issues to Fix

### 1. Inconsistent Fonts
❌ **Wrong:** Mix of Arial, Calibri, Times New Roman  
✅ **Correct:** Times New Roman throughout

### 2. Incorrect Line Spacing
❌ **Wrong:** Single-spaced or 1.5-spaced  
✅ **Correct:** Double-spaced (2.0)

### 3. Missing Indentation
❌ **Wrong:** No first-line indent  
✅ **Correct:** 0.5" first-line indent for paragraphs

### 4. Improper Margins
❌ **Wrong:** Equal margins all around  
✅ **Correct:** Left 1.5", others 1.0"

### 5. Inconsistent Heading Styles
❌ **Wrong:** Random bold/italic/underline  
✅ **Correct:** Consistent heading hierarchy

### 6. Poor Reference Formatting
❌ **Wrong:** Inconsistent citation style  
✅ **Correct:** Consistent APA/Harvard style

### 7. Missing Page Numbers
❌ **Wrong:** No page numbers  
✅ **Correct:** Page numbers on all pages (except title)

### 8. Improper Table/Figure Captions
❌ **Wrong:** No captions or inconsistent format  
✅ **Correct:** "Table 1: Description" above tables, "Figure 1: Description" below figures

---

## Content Improvements for REMO Thesis

### 1. Introduction Section
**Should Include:**
- Clear problem statement about restaurant management challenges
- Specific objectives (what REMO aims to achieve)
- Scope and limitations
- Thesis structure overview

**Example Structure:**
```
1. INTRODUCTION
   1.1 Background
   1.2 Problem Statement
   1.3 Research Questions
   1.4 Objectives
   1.5 Scope and Limitations
   1.6 Thesis Structure
```

### 2. Literature Review
**Should Cover:**
- Existing restaurant management systems
- AI in hospitality industry
- Real-time communication systems
- Role-based access control
- Multi-branch coordination systems

### 3. Methodology
**Should Include:**
- System design approach
- Technology selection justification
- Development methodology (Agile/Waterfall)
- Testing strategy
- Evaluation criteria

### 4. Implementation
**Should Detail:**
- System architecture
- Database design
- AI integration
- Security implementation
- User interface design
- Key features implementation

### 5. Results
**Should Present:**
- Performance metrics
- User testing results
- Comparison with existing systems
- AI accuracy measurements
- System scalability tests

### 6. Discussion
**Should Analyze:**
- Achievement of objectives
- Hypothesis validation
- Limitations encountered
- Comparison with literature
- Practical implications

### 7. Conclusion
**Should Summarize:**
- Key findings
- Contributions
- Limitations
- Future work recommendations

---

## REMO-Specific Content Guidelines

### Technical Details to Include:

#### System Architecture
- Next.js 16 framework
- React 19 for UI
- Firebase for backend
- Groq AI (LLaMA 3.3 70B)
- TypeScript for type safety

#### Key Features to Highlight:
1. **AI-Powered Staff Matching**
   - 67% reduction in emergency response time
   - Intelligent skill-based matching

2. **Real-Time Multi-Branch Coordination**
   - Instant alert broadcasting
   - Live status updates

3. **Automated Policy Enforcement**
   - 100% compliance rate
   - Taxi request validation

4. **Role-Based Access Control**
   - Admin, Manager, Employee roles
   - Firestore security rules

5. **Multilingual Support**
   - English, Russian, Latvian
   - Complete UI translation

#### Metrics to Include:
- Emergency shift fill time: 45 min → 15 min (67% improvement)
- Response rate: 30% → 58% (93% increase)
- Schedule creation time: 8-12 hrs → 2-3 hrs (75% reduction)
- Policy compliance: 85% → 100%
- ROI: 4,525% (first year)

---

## Citation Examples

### APA Style (7th Edition)

**Book:**
```
Author, A. A. (Year). Title of work. Publisher.
```

**Journal Article:**
```
Author, A. A., & Author, B. B. (Year). Title of article. 
    Journal Name, volume(issue), pages. https://doi.org/xxx
```

**Website:**
```
Author, A. A. (Year, Month Day). Title of page. Site Name. 
    URL
```

**Software/Framework:**
```
Next.js. (2024). Next.js documentation (Version 16.2.4). 
    Vercel. https://nextjs.org/docs
```

### Harvard Style

**Book:**
```
Author, A.A. (Year) Title of work. Place: Publisher.
```

**Journal Article:**
```
Author, A.A. and Author, B.B. (Year) 'Title of article', 
    Journal Name, volume(issue), pp. pages.
```

---

## Checklist Before Submission

### Formatting
- [ ] Times New Roman, 12pt throughout
- [ ] Double-spaced paragraphs
- [ ] Correct margins (Left 1.5", others 1")
- [ ] Justified alignment
- [ ] First-line indents (0.5")
- [ ] Consistent heading styles
- [ ] Page numbers on all pages (except title)

### Content
- [ ] Title page complete
- [ ] Abstract (250-300 words)
- [ ] Table of contents with page numbers
- [ ] All sections present
- [ ] Figures and tables numbered and captioned
- [ ] References formatted consistently
- [ ] No spelling or grammar errors

### Technical Content
- [ ] Clear problem statement
- [ ] Well-defined objectives
- [ ] Methodology explained
- [ ] Results presented with data
- [ ] Discussion of findings
- [ ] Conclusion summarizes key points
- [ ] All technical terms defined
- [ ] Code snippets properly formatted
- [ ] Diagrams clear and labeled

### References
- [ ] All sources cited in text
- [ ] All citations in reference list
- [ ] Consistent citation style
- [ ] Proper hanging indent
- [ ] Alphabetically ordered
- [ ] URLs working (if applicable)

---

## Additional Resources

### Turiba University Guidelines
- Check official thesis guidelines from your department
- Consult with your supervisor
- Review previous successful theses

### Useful Tools
- **Grammarly:** Grammar and spell checking
- **Turnitin:** Plagiarism checking
- **Mendeley/Zotero:** Reference management
- **Draw.io:** Creating diagrams
- **PlantUML:** UML diagram generation

---

## Getting Help

If you encounter issues:

1. **Check the error message** - The script provides detailed error information
2. **Verify file format** - Ensure your file is .docx (not .doc)
3. **Close the file** - Make sure the document isn't open in Word
4. **Check permissions** - Ensure you have write access to the output location
5. **Contact supervisor** - For content-specific questions

---

## Manual Adjustments After Formatting

After running the script, manually check:

1. **Table of Contents** - Update field codes (Right-click → Update Field)
2. **Page Breaks** - Ensure chapters start on new pages
3. **Figure/Table Placement** - Adjust positioning as needed
4. **Cross-References** - Verify all references are correct
5. **Equations** - Check mathematical notation
6. **Code Blocks** - Ensure proper formatting
7. **Appendices** - Verify correct ordering

---

**Last Updated:** 2024  
**Version:** 1.0  
**For:** Turiba University Thesis Submissions
