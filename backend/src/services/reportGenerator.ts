import PDFDocument from 'pdfkit'
import type { EvaluationResult } from './evaluation'

interface ReportData {
  candidateName: string
  candidateEmail: string
  jdTitle: string
  interviewDate: string
  durationMinutes: number
  evaluation: EvaluationResult
}

export function generateReport(data: ReportData): PDFKit.PDFDocument {
  const doc = new PDFDocument({ margin: 0, size: 'A4' })

  const primary = '#4f46e5'
  const primaryDark = '#3730a3'
  const textDark = '#0f172a'
  const textMuted = '#64748b'
  const green = '#10b981'
  const red = '#ef4444'
  const amber = '#f59e0b'
  const pageWidth = 595.28
  const margin = 50

  // ───────────────────────────────────────────
  // COVER PAGE
  // ───────────────────────────────────────────

  // Background gradient (simulated with rectangles)
  const gradientSteps = 40
  for (let i = 0; i < gradientSteps; i++) {
    const ratio = i / gradientSteps
    const r = Math.round(79 * (1 - ratio) + 55 * ratio)  // indigo to violet
    const g = Math.round(70 * (1 - ratio) + 48 * ratio)
    const b = Math.round(229 * (1 - ratio) + 163 * ratio)
    const stripHeight = 842 / gradientSteps
    doc.rect(0, i * stripHeight, pageWidth, stripHeight + 1)
      .fillColor(`#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`)
      .fill()
  }

  // Dot pattern overlay
  doc.fillColor('#ffffff').opacity(0.06)
  for (let x = 0; x < pageWidth; x += 24) {
    for (let y = 0; y < 842; y += 24) {
      doc.circle(x, y, 1).fill()
    }
  }
  doc.opacity(1)

  // Logo area
  doc.fontSize(14).fillColor('#ffffff').opacity(0.9)
  doc.text('SKILLLENS', margin, 60, { characterSpacing: 4 })
  doc.opacity(1)

  // Main title
  doc.fontSize(42).fillColor('#ffffff')
  doc.text('Interview', margin, 260)
  doc.text('Evaluation Report')
  doc.moveDown(1.5)

  // Divider
  doc.rect(margin, doc.y, 60, 3).fillColor('#ffffff').opacity(0.6).fill()
  doc.opacity(1)
  doc.moveDown(1)

  // Candidate details on cover
  doc.fontSize(16).fillColor('#ffffff').opacity(0.95)
  doc.text(data.candidateName, margin)
  doc.opacity(1)
  doc.moveDown(0.3)
  doc.fontSize(12).fillColor('#ffffff').opacity(0.6)
  doc.text(data.jdTitle, margin)
  doc.moveDown(0.2)
  doc.text(data.interviewDate, margin)
  doc.text(`${data.durationMinutes} minutes`, margin)
  doc.opacity(1)

  // Bottom of cover
  doc.fontSize(9).fillColor('#ffffff').opacity(0.4)
  doc.text('CONFIDENTIAL', margin, 780)
  doc.opacity(1)

  // ───────────────────────────────────────────
  // PAGE 2: RESULTS
  // ───────────────────────────────────────────
  doc.addPage({ margin: 50 })

  // Header bar
  doc.rect(0, 0, pageWidth, 4).fillColor(primary).fill()

  // Page header
  doc.fontSize(9).fillColor(primary).text('SKILLLENS', margin, 24, { characterSpacing: 2 })
  doc.fontSize(9).fillColor(textMuted).text('Interview Evaluation Report', pageWidth - margin - 160, 24)
  doc.moveTo(margin, 42).lineTo(pageWidth - margin, 42).strokeColor('#e2e8f0').stroke()

  // Overall Rating Section
  doc.moveDown(2)
  const ratingY = 70
  doc.fontSize(10).fillColor(textMuted).text('OVERALL RATING', margin, ratingY, { characterSpacing: 1 })

  const rating = data.evaluation.overallRating
  const ratingColor = rating >= 7 ? green : rating >= 5 ? amber : red

  // Score circle
  const circleX = margin + 40
  const circleY = ratingY + 60
  doc.circle(circleX, circleY, 30).lineWidth(4).strokeColor(ratingColor).stroke()
  doc.fontSize(24).fillColor(ratingColor).text(
    `${rating}`,
    circleX - 15, circleY - 14,
    { width: 30, align: 'center' }
  )
  doc.fontSize(8).fillColor(textMuted).text(
    'of 10',
    circleX - 15, circleY + 12,
    { width: 30, align: 'center' }
  )

  // Recommendation
  doc.fontSize(18).fillColor(textDark).text(data.evaluation.recommendation, margin + 90, ratingY + 38)
  doc.fontSize(10).fillColor(textMuted).text(
    data.evaluation.overallComments,
    margin + 90, ratingY + 62,
    { width: pageWidth - margin * 2 - 100 }
  )

  // Candidate info row
  const infoY = ratingY + 120
  doc.moveTo(margin, infoY).lineTo(pageWidth - margin, infoY).strokeColor('#e2e8f0').stroke()
  doc.fontSize(9).fillColor(textMuted)
  doc.text('Candidate', margin, infoY + 10)
  doc.text('Position', margin + 160, infoY + 10)
  doc.text('Email', margin + 320, infoY + 10)
  doc.fontSize(10).fillColor(textDark)
  doc.text(data.candidateName, margin, infoY + 24)
  doc.text(data.jdTitle, margin + 160, infoY + 24)
  doc.text(data.candidateEmail, margin + 320, infoY + 24)
  doc.moveTo(margin, infoY + 42).lineTo(pageWidth - margin, infoY + 42).strokeColor('#e2e8f0').stroke()

  // Category Scores
  let catY = infoY + 64
  doc.fontSize(10).fillColor(textMuted).text('CATEGORY SCORES', margin, catY, { characterSpacing: 1 })
  catY += 24

  for (const cat of data.evaluation.categories) {
    const scoreColor = cat.score >= 7 ? green : cat.score >= 5 ? amber : red

    if (catY > 700) {
      doc.addPage({ margin: 50 })
      doc.rect(0, 0, pageWidth, 4).fillColor(primary).fill()
      catY = 30
    }

    doc.fontSize(11).fillColor(textDark).text(cat.name, margin, catY)
    doc.fontSize(11).fillColor(scoreColor).text(`${cat.score}/${cat.maxScore}`, pageWidth - margin - 40, catY, { width: 40, align: 'right' })

    // Score bar
    const barY = catY + 18
    const barWidth = pageWidth - margin * 2
    const fillWidth = (cat.score / cat.maxScore) * barWidth
    doc.rect(margin, barY, barWidth, 6).fillColor('#f1f5f9').fill()
    doc.rect(margin, barY, fillWidth, 6).fillColor(scoreColor).fill()

    doc.fontSize(9).fillColor(textMuted).text(cat.comments, margin, barY + 12, {
      width: pageWidth - margin * 2,
    })

    catY = doc.y + 14
  }

  // ───────────────────────────────────────────
  // PAGE 3: STRENGTHS & AREAS FOR IMPROVEMENT
  // ───────────────────────────────────────────
  doc.addPage({ margin: 50 })
  doc.rect(0, 0, pageWidth, 4).fillColor(primary).fill()

  let secY = 30
  doc.fontSize(10).fillColor(green).text('STRENGTHS', margin, secY, { characterSpacing: 1 })
  secY += 20

  for (const s of data.evaluation.strengths) {
    doc.fontSize(10).fillColor(textDark)
    // Green bullet
    doc.circle(margin + 4, secY + 5, 3).fillColor(green).fill()
    doc.fillColor(textDark).text(s, margin + 16, secY, { width: pageWidth - margin * 2 - 16 })
    secY = doc.y + 8
  }

  secY += 16
  doc.fontSize(10).fillColor(amber).text('AREAS FOR IMPROVEMENT', margin, secY, { characterSpacing: 1 })
  secY += 20

  for (const w of data.evaluation.weaknesses) {
    doc.fontSize(10).fillColor(textDark)
    doc.circle(margin + 4, secY + 5, 3).fillColor(amber).fill()
    doc.fillColor(textDark).text(w, margin + 16, secY, { width: pageWidth - margin * 2 - 16 })
    secY = doc.y + 8
  }

  // Footer on last page
  const footerY = 800
  doc.moveTo(margin, footerY).lineTo(pageWidth - margin, footerY).strokeColor('#e2e8f0').stroke()
  doc.fontSize(8).fillColor(textMuted).text(
    `Generated by SkillLens on ${new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}`,
    margin, footerY + 8
  )
  doc.text('Confidential', pageWidth - margin - 80, footerY + 8, { width: 80, align: 'right' })

  doc.end()
  return doc
}
