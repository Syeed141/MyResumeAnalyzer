# AI Resume Analyzer

An intelligent **AI-powered resume analysis web application** that evaluates resumes, provides improvement suggestions, ATS insights, and allows users to chat with an AI resume coach.

Upload your resume in **PDF format**, and the system will analyze it using **AI (GPT-4o via Puter AI)** to provide structured feedback and actionable improvements.

---

# 🚀 Live Features

- AI resume analysis
- ATS compatibility checks
- Resume scoring system
- Keyword suggestions
- Performance metrics
- Resume insights
- Resume statistics
- Interactive AI chat assistant (Jarvis)
- Instant PDF parsing
- Clean modern UI

---

# 🧠 Project Workflow

Example workflow:

1. Upload your resume (PDF)
2. AI extracts text from the document
3. AI analyzes resume quality
4. Displays score, strengths, improvements
5. Shows ATS insights and metrics
6. Ask Jarvis questions about your resume

---

# 🛠 Tech Stack

### Frontend
- React
- TailwindCSS
- Vite

### AI
- Puter AI
- GPT-4o Model

### PDF Processing
- pdfjs-dist

### Other
- Modern JavaScript (ES6+)

---

# ⭐ Key Features

# 🏆 Resume Score System

Resumes are scored from 1 to 10.

Score interpretation:

| Score | Meaning |
|------|------|
| 8 – 10 | Excellent |
| 6 – 7 | Good |
| 1 – 5 | Needs Improvement |

The score is calculated based on:

- Resume structure
- Content quality
- Keyword optimization
- ATS compatibility
- Impact statements

---

# ✅ ATS Presence Checklist

The system checks whether your resume includes important sections:

- Contact Information
- Skills
- Experience
- Education
- Projects
- Certifications

This improves ATS (Applicant Tracking System) compatibility.

---

# 📊 Resume Performance Metrics

The system evaluates several metrics:

- Content Clarity
- ATS Optimization
- Keyword Usage
- Formatting Quality
- Impact Statements

Each metric is scored  0 to 10

---

# 🔍 Resume Insights

AI provides additional insights including:

- Suggested keywords
- Actionable improvement items
- Resume optimization tips
- ATS checklist

---

# 📄 Resume Snapshot

Quick statistics about your uploaded resume:

- Word count
- Character count
- Estimated page count
- Extracted text preview

---

# 🤖 AI Chat Assistant (Jarvis)

Users can ask questions about their resume.

Example questions:

- How can I improve my summary?
- Is my resume ATS friendly?
- What skills am I missing?
- How can I improve my experience section?

Jarvis answers only based on the resume content to avoid hallucinations.

---

# 📁 Project Structure

```
AI-Resume-Analyzer
│
├── public
│
├── src
│   ├── App.jsx
│   ├── constants.js
│   ├── main.jsx
│   └── styles.css
│
├── package.json
├── vite.config.js
└── README.md
```

---

# ⚙️ Installation

Clone the repository:

```bash
git clone https://github.com/yourusername/ai-resume-analyzer.git
```

Navigate to the project folder:

```bash
cd ai-resume-analyzer
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

---

# 📦 Dependencies

Install required packages:

```bash
npm install pdfjs-dist
```

---

# 🤖 Puter AI Setup

This project uses **Puter AI**.

Include Puter in your HTML:

```html
<script src="https://js.puter.com/v2/"></script>
```

---


# 🚀 Future Improvements

Planned improvements:

- Resume templates
- Job description matching
- ATS score breakdown
- Resume rewriting suggestions
- Resume export improvements
- Multi-language support
- Backend AI integration
- Resume comparison tools

---

# 🤝 Contributing

Contributions are welcome.

Steps:

1. Fork the repository

2. Create a new branch

```bash
git checkout -b feature-name
```

3. Commit changes

```bash
git commit -m "Add new feature"
```

4. Push branch

```bash
git push origin feature-name
```

5. Open a Pull Request

---



